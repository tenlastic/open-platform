FROM node:14-alpine

WORKDIR /usr/src/

COPY ./package*.json ./
RUN npm config set registry "https://verdaccio.tenlastic.com" && npm i --production

COPY ./dist/ ./dist/

CMD [ "./node_modules/.bin/mocha", "--exit", "--timeout", "600000", "./dist/**/*.js" ]
