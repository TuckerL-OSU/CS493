FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
COPY lavellt-boatstatus-auth.json ./
RUN npm install
COPY . .
ENV GOOGLE_APPLICATION_CREDENTIALS="lavellt-boatstatus-auth.json"
ENV PORT=8080
EXPOSE ${PORT}
CMD [ "npm", "start" ]