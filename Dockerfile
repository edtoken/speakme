FROM openresty/openresty:trusty

ENV DEBUG=0
ENV APP_PORT=5080
ENV BACKEND_URL=""
ENV FRONTEND_URL="http://localhost:5080"
ENV RUN_ENVIRONMENT="prod"
ENV NODE_ENV="production"

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_7.x | bash -
RUN apt-get install -y nodejs

ADD nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
ADD . /var/www

WORKDIR /var/www

RUN npm install --only=prod
RUN npm install --only=dev

RUN npm run build

WORKDIR /var/www

STOPSIGNAL SIGTERM