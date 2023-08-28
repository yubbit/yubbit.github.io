FROM jekyll/jekyll:latest
COPY . /srv/jekyll
RUN bundle install
RUN rm -r /srv/jekyll
