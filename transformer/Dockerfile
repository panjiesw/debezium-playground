FROM node:16.15.1-alpine3.16

WORKDIR /app

COPY package.json ./

COPY yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn-build YARN_CACHE_FOLDER=/root/.yarn-build \
  yarn install --frozen-lockfile --production

COPY index.js ./
COPY db.js ./

EXPOSE 3000

CMD node index.js
