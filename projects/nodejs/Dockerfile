# Stage 1
FROM node:10 AS install
WORKDIR /usr/src/app/

COPY ./package*.json ./
RUN npm install --production

COPY ./dist/ ./dist/

EXPOSE 3000
CMD [ "node", "./dist/index.js" ]