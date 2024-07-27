FROM node:18

WORKDIR /app

ENV NODE_ENV=development

# copy package lock
COPY package*.json ./

# install deps
RUN npm install
# rebuild node-rdkafka
# RUN npm rebuild node-rdkafka

COPY . .

EXPOSE 3000
CMD ["yarn", "dev"]