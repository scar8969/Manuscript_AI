FROM node:18-alpine

RUN apk add --no-cache texlive-base texlive-latex python3 py3-pip

COPY scraper/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

RUN mkdir -p /app/temp && chmod 755 /app/temp

EXPOSE 3000

CMD ["node", "server.js"]