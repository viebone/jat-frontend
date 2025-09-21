# Stage 1: Build the React app
FROM node:16 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve the build files using Nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
