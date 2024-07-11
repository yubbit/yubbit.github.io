FROM ruby:latest
COPY . /srv/jekyll
RUN bundle install
RUN rm -r /srv/jekyll
