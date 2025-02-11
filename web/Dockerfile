FROM node:20-alpine AS build

# Install project dependencies
WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install --ignore-scripts

# Build the project
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:bookworm AS serve
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Must provide nginx.conf file to the volume to configure nginx
VOLUME "/etc/nginx/config/"
VOLUME "/usr/share/nginx/html/config/"

USER nginx

CMD ["nginx", "-c", "/etc/nginx/config/nginx.conf", "-g", "daemon off;"]
