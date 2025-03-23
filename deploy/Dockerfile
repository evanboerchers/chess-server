FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY dist .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
