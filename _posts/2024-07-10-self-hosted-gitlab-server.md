---
layout: post_blog
title: Building a Self-Hosted GitLab Server on a Jetson Nano
---

Most web-based git repositories like GitHub and GitLab impose size limits on repositories, often charging based on storage or bandwidth usage. My projects, however, frequently involve textures, meshes, and other media that easily exceed these limits. I had an unused NVIDIA Jetson Nano from my robotics AI experiments, so I thought, "Why not try this?"

## A Journey into the Unknown: Setting Up a LAN-Accessible GitLab Server

Setting up a GitLab server was surprisingly straightforward using their official Docker Compose instructions [here](https://docs.gitlab.com/ee/install/docker.html#install-gitlab-using-docker-compose). I ran into a bit of a problem though, since their Docker images only support `AMD64` architecture, which didn't work on my Jetson Nano's `ARM64` CPU. I found an alternative `ARM64` image [here](https://github.com/zengxs/gitlab-arm64), based on GitLab's own Dockerfile. These could serve as a great base for custom builds.

I ended up with this `docker-compose.yml` configuration:

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

## Bridging the Gap: Making It Accessible Internationally

The next challenge was exposing my GitLab server to the internet. With my home router behind [CGNAT](https://en.wikipedia.org/wiki/Carrier-grade_NAT), inbound traffic just bounced off my ISP's NAT servers. I turned to [WireGuard](https://www.wireguard.com/) for a solution, following this guide [here](https://gist.github.com/Quick104/d6529ce0cf2e6f2e5b94c421a388318b) and [here](https://pimylifeup.com/wireguard-docker/).

I set up a VPS with an OVHCloud Starter tier [here](https://www.ovhcloud.com/en-au/vps/) and configured the following `docker-compose.yml` for the WireGuard server:

```yaml
volumes:
  etc_wireguard:

services:
  wg-easy:
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

## Overcoming Technical Hurdles

Connecting my Jetson Nano to the VPS proved tricky. Installing WireGuard via `apt` failed due to architecture mismatches, and compiling from source hit header issues. I found a workaround using a userspace implementation [here](https://www.wireguard.com/xplatform/) and modified the executable to remove architecture-specific code.

After configuring `/etc/wireguard/wg0.conf` and running `sudo systemctl start wg-quick@wg0`, I finally had a working setup. The final iptables rules for port forwarding looked like this:

```bash
iptables -A FORWARD -i eth0 -o wg0 -p tcp --syn --dport 80 -m conntrack --ctstate NEW -j ACCEPT &
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to-destination 10.8.0.2 &
iptables -t nat -A POSTROUTING -o wg0 -p tcp --dport 80 -d 10.8.0.2 -j SNAT --to-source 10.8.0.1 &

iptables -A FORWARD -i eth0 -o wg0 -p tcp --syn --dport 443 -m conntrack --ctstate NEW -j ACCEPT &
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j DNAT --to-destination 10.8.0.2 &
iptables -t nat -A POSTROUTING -o wg0 -p tcp --dport 443 -d 10.8.0.2 -j SNAT --to-source 10.8.0.1
```

## Securing the Server

To avoid the "Not Secure" warning, I enabled SSL by updating the GitLab config:

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

## Next Steps

With this setup, I can now host my GitLab instance for practically no cost. I might eventually add an nginx reverse proxy for additional services or redirects to GitHub pages. Using a nonstandard device like the Jetson Nano definitely complicated the process, but it turned into an interesting learning experience.

For now, I'm savoring the achievement of running a fully functional GitLab server with LFS support on a low-cost, low-power device.