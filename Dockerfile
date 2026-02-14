# ====================================
# Stage 1: Build
# ====================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (needs @nestjs/cli from devDependencies)
RUN npm run build

# ====================================
# Stage 2: Production
# ====================================
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Use node user for security
USER node

# Run in production mode
CMD ["npm", "run", "start:prod"]
