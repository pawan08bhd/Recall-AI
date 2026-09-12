# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-slim
WORKDIR /app

# Install dependencies for server
COPY server/package*.json ./server/
RUN npm --prefix server install --production

# Copy server code
COPY server/ ./server/

# Copy built static frontend from client-builder
COPY --from=client-builder /app/client/dist ./client/dist

# Default production environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "--prefix", "server", "start"]
