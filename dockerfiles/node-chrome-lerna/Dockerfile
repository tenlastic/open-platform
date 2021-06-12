FROM node:12

# Install Google Chrome.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && apt-get install -qy google-chrome-stable

# Install RSync.
RUN apt-get update && apt-get install -qy rsync

# Install Lerna.
RUN npm i -g lerna