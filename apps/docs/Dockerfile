# Build stage
FROM node:20 AS build-stage

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install -g pnpm && pnpm install

# Copy all source files
COPY . .

# Build the documentation
RUN pnpm build

# Serve stage
FROM nginx:alpine AS serve-stage

# Copy built assets from build-stage to nginx server
COPY --from=build-stage /app/.vitepress/dist /usr/share/nginx/html

# Expose port 80 to the Docker host
EXPOSE 80

# The command to run when the container starts
CMD ["nginx", "-g", "daemon off;"]