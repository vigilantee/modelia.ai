# --- BUILDER STAGE ---
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# 1. Install Dependencies
# Copy package files first to leverage Docker caching
COPY package*.json ./
# 1. FIX: Install ALL dependencies, including devDeps, for the build process
RUN npm ci

# 2. Copy source code and build
COPY . .
RUN npm run build

# --- FINAL STAGE (Production) ---
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# 1. FIX: Copy ONLY the production dependencies (node_modules) and built code

# Copy only the production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy the built application code
COPY --from=builder /app/dist ./dist

# Create necessary directory and set ownership
RUN mkdir -p uploads && chown -R node:node uploads

# Set user for security
USER node

# Expose the application port
EXPOSE 3001

# Healthcheck to verify the server is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]