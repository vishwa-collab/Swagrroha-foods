FROM node:18-alpine

WORKDIR /app

# Copy package files from server subdirectory
COPY server/package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy server files
COPY server/ ./

EXPOSE 5000

ENV PORT=5000

CMD ["node", "index.cjs"]
