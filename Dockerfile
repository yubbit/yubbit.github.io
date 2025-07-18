FROM ruby:latest

RUN gem install jekyll
WORKDIR /srv/jekyll


