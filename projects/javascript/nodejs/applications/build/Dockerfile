FROM node:14-alpine

# Install Tini for signal forwarding.
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# Set up NodeJS.
WORKDIR /usr/src/
COPY ./package*.json ./
RUN npm i --production --registry "https://verdaccio.tenlastic.com"
COPY ./dist/ ./dist/

CMD [ "node", "./dist/index.js" ]