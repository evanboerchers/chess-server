FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY dist .
EXPOSE 3000
CMD ["node", "dist/index.js"]
