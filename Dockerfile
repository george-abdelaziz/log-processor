FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

FROM node:20-alpine AS final

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json .

ENV PORT=3000
EXPOSE ${PORT}

CMD ["node", "src/index.js"] 