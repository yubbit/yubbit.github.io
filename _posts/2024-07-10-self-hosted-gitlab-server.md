---
layout: posts
title: Setting up a self-hosted Gitlab server
# sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
---

Most web-based git repositories such as Github and GitLab impose size limits on
the size of a repository, and may charge depending on the amount of storage
used or the bandwidth usage of a given repo. On the other hand, almost all of
my projects involve textures, meshes, and other media files that would easily
cap out these limits. I had an unused NVIDIA Jetson Nano lying around from my
days playing around with AI in robotics, so I took one look at it and went
"Eh, why not?"

## Setting up a LAN-accessible Gitlab server

Setting up a GitLab server was simple enough using GitLab's official
instructions for setting up a server using <!--more--> Docker Compose. You can find those
instructions [here](https://docs.gitlab.com/ee/install/docker.html#install-gitlab-using-docker-compose).

The only problem with their official instructions was that they only provide
Docker images for the `AMD64` architecture. This meant that while docker
compose would successfully pull the image without complaining, the image
itself failed to run on the NVIDIA Jetson, which uses the Tegra architecture,
which itself uses an `ARM64` CPU. I managed to find an alternative Docker 
image that was built for `ARM64`. The repo for it and its accompanying
instructions can be found [here](https://github.com/zengxs/gitlab-arm64).
Their image is based off the [DockerFile provided by Gitlab](https://gitlab.com/gitlab-org/omnibus-gitlab/-/tree/master/docker).
These would make a good starting base for someone looking to build an image to
run on any other CPU architecture.

Finally, GitLab provides some [additional instructions](https://docs.gitlab.com/omnibus/settings/rpi.html#reduce-running-processes)
for getting things to run on weaker devices like a Raspberry Pi, which I
incorporated into my configuration.

I ended up with the following `docker-compose.yml` file:

```yml
services:
  gitlab:
    image: zengxs/gitlab:ce
    container_name: gitlab
    restart: always
    hostname: '<hostname>'
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        sidekiq['concurrency'] = 4
        puma['worker_processes'] = 2
        postgresql['shared_buffers'] = "256MB"
        prometheus_monitoring['enable'] = false
        gitlab_rails['env'] = {'MALLOC_CONF' => 'dirty_decay_ms:1000,muzzy_decay_ms:1000'}
        gitaly['env'] = {'MALLOC_CONF' => 'dirty_decay_ms:1000,muzzy_decay_ms:1000'}
    ports:
      - '80:80'
      - '443:443'
      - '22:22'
    volumes:
      - '$GITLAB_HOME/config:/etc/gitlab'
      - '$GITLAB_HOME/logs:/var/log/gitlab'
      - '$GITLAB_HOME/data:/var/opt/gitlab'
    shm_size: '256m'
```

## Making it accessible through the internet

The next step to this was exposing my GitLab server to the internet so I could
pull the project remotely to any computers that needed it, to provide access 
to anyone that might need my work, and to serve as a platform for any
collaborative work that might need doing in the future.

The problem with my setup is that I'm on a home router behind [CGNAT](https://en.wikipedia.org/wiki/Carrier-grade_NAT),
which means that any inbound requests to my public IP address will just bounce
off the NAT servers off my ISP instead of making it to my server. If I had an
actual public IP, then I'd need to configure my router's port forwarding rules
to point to my server, which I won't be talking about here.

I ended up going through [this article](https://gist.github.com/Quick104/d6529ce0cf2e6f2e5b94c421a388318b)
on how to expose a server with WireGuard, which inspired how I eventually
went about exposing my server to the internet. I also found [this article](https://pimylifeup.com/wireguard-docker/),
which gave details about how to set up a WireGuard Docker container using
Docker Compose.

The first step was acquiring a public IP address. The easiest way to do that
was to set up a VPS. For my use case, I explicitly looked for one that did not
have any limits on data transfer, and that was situated in a data center that
was close enough to my two main bases of operation (Australia and the
Philippines). I opted to go for an [OVHCloud VPS](https://www.ovhcloud.com/en-au/vps/)
and picked the Starter tier, since I wasn't sure if any of this would actually
work.

Next, I had to set up a VPN to connect my server to my VPS. The instructions
for that can be found [here](https://github.com/wg-easy/wg-easy) or in [here](https://pimylifeup.com/wireguard-docker/).
It's as simple as running the following `docker-compose.yml` file:

```yaml
volumes:
  etc_wireguard:

services:
  wg-easy:
    environment:
    image: ghcr.io/wg-easy/wg-easy
    container_name: wg-easy
    volumes:
      - etc_wireguard:/etc/wireguard
    ports:
      - "80:80/tcp"
      - "443:443/tcp"
      - "51820:51820/udp"
      - "51821:51821/tcp"
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
```

Note that I exposed ports `80` and `443` of my Docker container since I'll
also be passing any requests over to the VPN.

The next step was connecting my server to the VPN. To start things off, after
setting up the WireGuard server, I opened its interface by visiting
`http://<ip-address-of-vps>:51821/`, and set up a client. Once I had that, I
downloaded the WireGuard config file from the interface onto my server.

Once that's done, ordinarily things would be as simple as installing WireGuard
onto the server and connecting to the VPN using WireGuard's official
instructions. In my case however, since I'm running on a Tegra processor on
a version of Ubuntu custom built for it, installing WireGuard turned out to be
a bit more complicated. 

Installing WireGuard via `apt` installed it as a kernel module for a different 
architecture, which failed to run on the Jetson Nano. Attempting to compile it
straight from source didn't work since the headers supplied with the Nano
didn't match those needed to compile the software. However, I found [this](https://www.wireguard.com/xplatform/)
article, which details how to run a userspace implementation of WireGuard
using Go (as opposed to a kernel level implementation). Instructions for
installing `wireguard-go` can be found [here](https://github.com/WireGuard/wireguard-go).

Once that was installed, running `wireguard-go` still resulted in errors, so I
did a `whereis` to find the executable and modified it to remove references to
specific architectures and it worked perfectly.

From here, I copied the configuration file that I downloaded a while back into
`/etc/wireguard/wg0.conf`. I then ran `sudo systemctl start wg-quick@wg0` and
`sudo systemctl enable wg-quick@wg0` to start it up every time I boot up the
server.

With all that out of the way, all that was left to do was to set up the port
forwarding rules on each machine. From within the `wg-easy` Docker container
on the VPS, I added the following rules:

```bash
iptables -A FORWARD -i eth0 -o wg0 -p tcp --syn --dport 80 -m conntrack --ctstate NEW -j ACCEPT &
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to-destination 10.8.0.2 &
iptables -t nat -A POSTROUTING -o wg0 -p tcp --dport 80 -d 10.8.0.2 -j SNAT --to-source 10.8.0.1 &

iptables -A FORWARD -i eth0 -o wg0 -p tcp --syn --dport 443 -m conntrack --ctstate NEW -j ACCEPT &
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j DNAT --to-destination 10.8.0.2 &
iptables -t nat -A POSTROUTING -o wg0 -p tcp --dport 443 -d 10.8.0.2 -j SNAT --to-source 10.8.0.1 &
```

In this case, `10.8.0.1` refers to the VPS's IP address on WireGuard, while
`10.8.0.2` refers to the GitLab server's IP address.

I may have had to configure some additional rules on the server to forward
requests coming in through the VPN to the Docker container, but it seems to
have worked without doing this.

From here, I was finally able to access my GitLab server externally through
`http://<ip-address-of-vps>`.

## Giving the server a domain name

While it was usable from here, I wanted to set up a domain name for my site to
make it easier to remember. I opted to use [no-ip](https://my.noip.com/) to
register a domain name for myself, then set up their [DNS Update Client](https://www.noip.com/download?page=linux)
on my VPS.

Finally, I wanted to enable SSL encryption on the website just to avoid that
"Not Secure" warning that shows up when the page is only accessible through
`http`. GitLab makes that a simple matter of adding the following to the
configuration file:

```yaml
  gitlab:
    ...
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        ...
        external_url '<url>'
        letsencrypt['contact_emails'] = ['<email>']
        ...
```

## Next steps

With all that done, I may revisit this to set up nginx to add more services
like a file server, or to set up redirects to GitHub pages.

Choosing to use such a nonstandard device definitely complicated this whole
process, but it ultimately made for an interesting learning experience. For
now, I'm going to savor having a functioning GitLab server with LFS support
for practically no cost.
