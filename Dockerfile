FROM node:22-slim AS build

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm exec tsc

FROM node:22-slim AS production

WORKDIR /app

RUN npm install -g pnpm

COPY --from=build /app/package.json /app/pnpm-lock.yaml ./

RUN pnpm install --prod

COPY --from=build /app/dist ./dist

EXPOSE 9999

CMD ["node", "dist/server.js"]