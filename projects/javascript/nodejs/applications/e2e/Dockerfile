FROM node:12-alpine

WORKDIR /usr/src/

COPY ./package*.json ./
RUN npm i --production

COPY ./dist/ ./dist/

CMD [ "./node_modules/.bin/mocha", "--exit", "--timeout", "600000", "./dist/**/*.js" ]
