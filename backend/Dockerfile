FROM node:20-alpine

# Install build tools needed for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]