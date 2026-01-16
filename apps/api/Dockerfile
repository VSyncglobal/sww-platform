# apps/api/Dockerfile

FROM node:20-alpine

# --- THE FIX: Install OpenSSL for Prisma ---
RUN apk add --no-cache openssl
# -------------------------------------------

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json ./

RUN pnpm install

COPY . .

RUN npx prisma generate

RUN pnpm build

EXPOSE 3000

# Point to the compiled file
CMD ["node", "dist/src/main"]