FROM node:14-alpine

WORKDIR /usr/src/

COPY ./package*.json ./
RUN npm i --production --registry "https://verdaccio.tenlastic.com"

COPY ./dist/ ./dist/
COPY ./fixtures/ ./fixtures/

CMD [ "./node_modules/.bin/mocha", "--exit", "--timeout", "600000", "./dist/**/*.js" ]
