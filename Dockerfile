FROM node:22.13.1

WORKDIR /app

COPY package.json /app

RUN npm install -g pm2

RUN npm install

COPY . /app

EXPOSE 8080

CMD ["pm2-runtime","app.js"]