FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ARG VITE_ENDPOINT_LOGIN

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENDPOINT_LOGIN=$VITE_ENDPOINT_LOGIN

RUN npm run build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]