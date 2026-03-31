FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# Run migration at container start (NOT build time)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]