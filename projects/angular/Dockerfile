
# Build
FROM node:10 as build
WORKDIR /usr/src/app/

COPY ./package*.json ./
RUN npm install

COPY ./src/ ./src/
COPY ./angular.json ./
COPY ./tsconfig.json ./
RUN npm run build --preserve-symlinks --prod

# Final
FROM nginx
COPY --from=build /usr/src/app/dist/ /usr/share/nginx/html

CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/settings.template.json > /usr/share/nginx/html/assets/settings.json && exec nginx -g 'daemon off;'"]
