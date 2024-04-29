FROM node:16.17.0

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY . .

RUN date +%s > build_time.txt
RUN npm run build

CMD [ "node", "index.js" ]

# TODO: workout cron
