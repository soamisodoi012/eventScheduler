# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Add this line to copy your nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80