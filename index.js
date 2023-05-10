const http = require("http");
const files = require("./files");
const api = require("./api");

const port = 8000;
const hostname = "0.0.0.0";

const server = http.createServer((request, response) => {
    let url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
    if(url.pathname.startsWith("/api/")) api.manage(request, response);
    else files.manage(request, response);
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
