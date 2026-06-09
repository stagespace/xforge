FROM node:24-alpine AS client
WORKDIR /app/client/xforge
COPY client/xforge/package*.json ./
RUN npm ci
COPY client/xforge/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY --from=client /app/client/xforge/dist ./client/xforge/dist

ENV NODE_ENV=production
ENV PORT=3107
EXPOSE 3107

CMD ["node", "src/server.js"]
