FROM node:18-alpine

WORKDIR /app

# Copy package files from backend/server
COPY backend/server/package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy backend server code
COPY backend/server/ ./

# Expose server port
EXPOSE 5000

# Set environment variable
ENV PORT=5000

CMD ["node", "index.cjs"]
