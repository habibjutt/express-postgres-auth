FROM node:18

WORKDIR /app

# copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# copy rest of app
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
