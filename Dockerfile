FROM node:10-alpine

COPY index.js index.js

CMD ["node", "index.js"]