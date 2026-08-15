FROM node:18-alpine

WORKDIR /app

# Copy package files from server directory
COPY server/package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy backend server code
COPY server/ ./

# Expose server port
EXPOSE 5000

ENV PORT=5000

CMD ["node", "index.cjs"]
