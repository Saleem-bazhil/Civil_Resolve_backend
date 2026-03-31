# ---------- 1. Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install required system deps (fix prisma/alpine issues)
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build app
RUN npm run build


# ---------- 2. Production Stage ----------
FROM node:20-alpine

WORKDIR /app

# Install only required runtime deps
RUN apk add --no-cache openssl

# Copy only necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Remove dev dependencies (IMPORTANT 🔥)
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Start app with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]