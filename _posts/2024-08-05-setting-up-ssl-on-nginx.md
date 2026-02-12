---
layout: post_blog
title: Setting up SSL on nginx
sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
---

After setting up my Gitea server and my file server, I wanted a quick way to
test any WebGPU or WebXR apps that I've made. Neither of these will run on
website that don't support SSL, so I decided to set that up real quick.

<!--more-->

## Setting up `certbot`

To start things off, I found a general guide on doing that [here](https://phoenixnap.com/kb/letsencrypt-docker).
To summarize, I needed to set up Let's Encrypt's `certbot` which would set up
an [ACME challenge](https://letsencrypt.org/docs/challenge-types/), which
needed to be accessible on `http://<YOUR_DOMAIN>/.well-known/acme-challenge/<TOKEN>`,
where `TOKEN` describes an automatically generated token by `certbot`.

Using the site above as a general guide, I added `certbot` to my nginx
container's `docker-compose.yml`:

```yaml
version: "3"
services:
  webserver:
    image: nginx:latest
    ports:
      - 80:80
      - 443:443
    volumes:
      - <host-path-to-shared-folder>:/srv/www/files:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/www/:/var/www/certbot/:ro
      - ./certbot/conf/:/etc/nginx/ssl/:ro
  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./certbot/www/:/var/www/certbot/:rw
      - ./certbot/conf/:/etc/letsencrypt/:rw
    depends_on:
      - webserver
```

Then I ran the command:

```sh
docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run -d \<domain-name\>
```

This calls on `certbot` to create an ACME challenge in the `/var/www/certbot/`
folder. `certbot` then attempts to access this file through the given domain
name, and it's considered a success if it can find it. Meanwhile, we've made
the volumes that `certbot` writes to accessible to our nginx webserver.

Of course, the nginx configuration file also needed to be changed accordingly:

```nginx
events {}
http {
  include mime.types;
  server {
    listen 80;
    listen [::]:80;

    server_name <domain-name>;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot/;
    }

    location / {
        return 301 https://<domain-name>$request_uri;
    }
  }
  server {
    listen 443 default_server ssl;
    listen [::]:443 ssl;
    http2 on;

    server_name <domain-name>;

    ssl_certificate /etc/nginx/ssl/live/<domain-name>/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/<domain-name>/privkey.pem;

    location /files { 
       root <host-path-to-shared-folder>; 
       autoindex on;
    }

    location ~ ^/(git)($|/) {
        client_max_body_size 512M;

        rewrite ^ $request_uri;
	rewrite ^/git$ /git/ permanent;
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

To summarize what this does, it makes `certbot`'s ACME challenge folder
accessible through my domain. Once the domain has passed the ACME challenge,
it writes the SSL configuration files to a given folder, which I also make
accessible to the nginx container. nginx then uses this to certify the server.
Other than that, nginx also now redirects all `http` requests to their
equivalent `https` address. The flow can be traced back by examining the
configs above and checking which folders map to which volumes.

## Next steps

My Gitea server still doesn't support SSH, and I really should use networks
to point my nginx container to the Gitea container. I'll also need to check on
why LFS uploads don't work as fast as they should. Other than that, I'd say
that this is all in at least a perfectly usable state and I'm quite happy with
the current set up.