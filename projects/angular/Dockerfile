FROM nginx

ARG DIRECTORY

# Redirect all paths to index.html to enable Angular routing.
RUN sed -i \
  -e '/index  index.html index.htm;/a\' \
  -e '        try_files $uri $uri/ /index.html;' \
  /etc/nginx/conf.d/default.conf

# Copy files into Nginx static directory.
COPY ./dist/applications/${DIRECTORY}/ /usr/share/nginx/html/
