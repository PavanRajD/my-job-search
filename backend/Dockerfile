FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5050
RUN apt-get update && apt-get install -y postgresql-client
CMD ["./wait-for-db.sh", "db", "node", "src/index.js"]
