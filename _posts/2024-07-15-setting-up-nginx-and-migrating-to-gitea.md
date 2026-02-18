---
layout: post_blog
title: Setting up nginx and migrating to Gitea
---

Since making my Git server accessible externally, I wanted to set up my server
in such a way that I could set up multiple web services on the same domain. As 
an initial goal, I decided to run a file server alongside my Git serve. To
do this, I decided to set up as reverse proxy using nginx.

Another thing I wanted to do was to migrate my Git repositories from GitLab to
Gitea, since GitLab seemed to suffer from memory leaks that I couldn't find an
explanation for, at least on the NVIDIA Jetson. Gitea is far lighter weight
and seemed to be able to do everything I need it to.

## Setting up Gitea

I decided to run Gitea in its own Docker container to help me manage migrating
between GitLab and Gitea. I used the following `docker-compose.yml` file for
Gitea, which was based off the instructions found [here](https://docs.gitea.com/installation/install-with-docker):

```yaml
version: "3"

networks:
  gitea:
    external: false

services:
  server:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__server__ROOT_URL=http://<my-domain-name>/git
    restart: always
    networks:
      - gitea
    volumes:
      - ./gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "18202:3000"
      - "22:22"
```

Running this allowed me to set up the Gitea server locally, at which point I
retrieved all my files from the GitLab server and pushed them onto the Gitea
server.

To make sure that I properly migrated the LFS files, I explicitly ran this,
with gitea set as a remote pointing to the new Gitea server:

```bash
git lfs fetch --all
git lfs push gitea --all
```

Running `git lfs push` in particular seemed to be a lot slower than it was in
GitLab, running at 1MBps locally. This is something I'll have to investigate
in the future.

## Setting up nginx

Following my previous pattern of keeping everything containerized, I decided
to run nginx through Docker. I found their official Docker image [here](https://hub.docker.com/_/nginx)
Writing a `docker-compose.yml` file turned out to be quite straight forward in 
this case:

```yaml
web:
  image: nginx
  volumes:
   - <host-path-to-shared-folder>:/srv/www/files:ro
   - ./nginx.conf:/etc/nginx/nginx.conf:ro
  ports:
   - "80:80"
```

In particular, the nginx configuration file needs to be mapped to that exact
path. I used the following config:

```nginx
events {}
http {
  server {
    location /files { 
       root /srv/www; 
       autoindex on;
    }
    location ~ ^/(git)($|/) {
        client_max_body_size 512M;

        rewrite ^ $request_uri;
        rewrite ^(/git)?(/.*) $2 break;
        proxy_pass http://172.17.0.1:18202$uri;

        # other common HTTP headers, see the "Nginx" config section above
        proxy_set_header Connection $http_connection;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

The first location simply maps `/files` to the subdirectory containing the
sample files and creates a directory like structure for browsing them. The
second location was taken from Gitea's instructions [here](https://docs.gitea.com/administration/reverse-proxies#nginx-with-a-sub-path)
for how to set up Gitea with a reverse proxy. Notably, running the initial
setup of the Gitea server then attempting to change this seems to break the
site, so I haven't played around too much with trying to change its sub-path.

Note that the config I use explicitly uses the IP address `172.17.0.1` to
refer to that port on the host. A better practice would have been to use
Docker's networks to manage access to the Gitea server.

While these instructions are for Gitea since I'd finished migrating my
repositories over there locally by the time I'd written this, similar
instructions for GitLab can be found [here](https://docs.gitlab.com/omnibus/settings/configuration.html#configure-a-relative-url-for-gitlab).

## Next steps

Using nginx as a reverse proxy seems to have complicated things a little bit
in terms of setting up the SSL certificates for this website, which I'll have
to investigate in the future.

Some other things I'll need to do are to properly use Docker's network feature
to access the Gitea server directly without having to use the host's IP
address to access that container's ports. I'll also need to investigate why
pushing on LFS seems to be slower now than it used to be.

All-in-all I'm quite satisfied with how things are running compared to when I
ran GitLab. I'm lucky enough that I have a small enough number of repos that I
could afford to migrate them all manually. It might be a nice learning
experience to see how to migrate the Git server directly between Gitea and
GitLab, but there are other things that I'd rather do for now.
