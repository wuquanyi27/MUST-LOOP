FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY MUSTLOOP.html ./MUSTLOOP.html
COPY server.js ./server.js

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATA_DIR=/app/data

EXPOSE 3000

CMD ["node", "server.js"]
