FROM node:12-alpine

# Install Tini for signal forwarding.
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# Set up NodeJS.
WORKDIR /usr/src/
COPY ./package*.json ./
RUN npm i --production
COPY ./dist/ ./dist/

EXPOSE 3000
CMD [ "node", "./dist/index.js" ]