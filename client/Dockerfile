# Stage 1: Build the React app
FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG REACT_APP_API_PORT=5000
ENV REACT_APP_API_PORT=$REACT_APP_API_PORT
ENV REACT_APP_API_URL=http://api:${REACT_APP_API_PORT}/api
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
