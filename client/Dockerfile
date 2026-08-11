# =============================================
# CLIENT DOCKERFILE — Multi-stage Build
# Stage 1: Build React app with Vite
# Stage 2: Serve with Nginx
# =============================================

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:1.25-alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
