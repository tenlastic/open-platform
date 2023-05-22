FROM node:16-alpine

WORKDIR /usr/src/

# Install Chrome.
RUN apk add --no-cache chromium

# Tell Puppeteer to skip installing Chrome and use the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY ./package*.json ./
RUN npm install --production --registry "https://verdaccio.tenlastic.com"

COPY ./dist/ ./dist/
COPY ./fixtures/ ./fixtures/

ENTRYPOINT [
  "./node_modules/.bin/mocha", 
  "--exit",
  "--require", "source-map-support/register",
  "--retries", "2", 
  "--timeout", "600000", 
  "./dist/**/*.js"
]
