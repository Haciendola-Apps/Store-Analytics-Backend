# Base image
FROM node:22.22.0-alpine3.20

# Set the working directory
WORKDIR /app

# Copy the files from the current directory
COPY --chown=node:node . .

# Ignore developers and deprecated dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Build image
RUN npm run build

# User with permissions to edit files copied
USER node

# Run in Developer mode
CMD ["npm", "run", "start:prod"]