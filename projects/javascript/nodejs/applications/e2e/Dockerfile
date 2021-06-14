FROM node:12-alpine

WORKDIR /usr/src/
COPY ./package*.json ./
RUN npm i
COPY ./src/ ./src/

CMD [ "npm", "run", "start" ]