FROM node:16

# Install Google Chrome.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && apt-get install -qy google-chrome-stable

# Install Lerna.
RUN npm i -g lerna

# Install mc (minio client).
RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc -O mc && \
  chmod +x mc && \
  mv mc /usr/local/bin/mc

# Install TCP Dump.
RUN apt-get update && apt-get install -qy tcpdump