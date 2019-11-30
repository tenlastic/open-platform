# Stage 1
FROM node:10 AS install
WORKDIR /usr/src/app/

COPY ./package*.json ./
RUN npm install --production --silent

# Stage 2
FROM node:10-alpine
WORKDIR /usr/src/app/

COPY --from=install /usr/src/app/node_modules ./node_modules
RUN npm rebuild -q

COPY ./dist/ ./dist/

EXPOSE 3000
CMD [ "node", "./dist/index.js" ]