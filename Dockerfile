FROM thompsnm/nodejs-chrome
COPY . development/
WORKDIR development
RUN npm install
ENTRYPOINT [ "node", "index.js" ]
