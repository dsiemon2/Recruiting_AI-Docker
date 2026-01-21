FROM node:20-slim

# Install OpenSSL for Prisma, build tools for bcrypt, wget for health checks, and PostgreSQL client
RUN apt-get update && apt-get install -y openssl python3 make g++ wget postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports
EXPOSE 3000 3001

ENTRYPOINT ["/entrypoint.sh"]
