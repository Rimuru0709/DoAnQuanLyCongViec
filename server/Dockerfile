# =============================================
# SERVER DOCKERFILE — Node.js Production
# =============================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files (layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy server source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:5000/ || exit 1

# Start server
CMD ["node", "server.js"]
