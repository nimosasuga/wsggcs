# ========================================================
# Dockerfile for Grand Control (GC) Database Studio
# Target Domain: gc.cargo.washeng.online
# Multi-stage lightweight build (~70MB final image)
# ========================================================

# Stage 1: Build Frontend and Server
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite client and compile server TypeScript
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Non-root user for security
USER node

EXPOSE 3000

CMD ["node", "dist-server/index.js"]
