# Use Bun official image (includes Node-compatible runtime)
FROM oven/bun:1.1.22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with Bun (super fast)
RUN bun install

# Copy all source files
COPY . .

# Build TypeScript (if applicable)
RUN bun run build

# Expose the app port
EXPOSE 9090

# Run the app
CMD ["bun", "run", "start"]
