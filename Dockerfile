# ---------- 1. Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build


# ---------- 2. Production Stage ----------
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npm prune --omit=dev && npm cache clean --force

ENV NODE_ENV=production

EXPOSE 3000

# 🔥 FIXED (IMPORTANT)
CMD ["node", "dist/src/main.js"]