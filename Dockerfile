# Base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the files from the current directory
COPY package*.json ./

# Ignore developers and deprecated dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build image
RUN npm run build

# User with permissions to edit files copied
# Note: NestJS build usually outputs to dist/
# We make sure node user can run it
USER node

# Run in production mode
CMD ["npm", "run", "start:prod"]
