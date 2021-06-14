FROM node:12-alpine

WORKDIR /usr/src/

# Install NPM modules.
COPY ./package*.json ./
RUN npm i

# Copy start script.
COPY ./scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Copy source files.
COPY ./src/ ./src/

CMD [ "npm", "run", "start" ]
