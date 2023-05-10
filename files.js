const path = require("path");
const fs = require("fs");

const frontPath = "./front";
const mimeTypes = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.md': 'text/plain',
    'default': 'application/octet-stream'
};

function getFile(filepath, urlPath, response) {
    fs.access(filepath, fs.constants.R_OK, (accessError) => {
        if (accessError) {
            response.statusCode = 404;
            response.setHeader('Content-Type', mimeTypes[".json"]);
            response.end(JSON.stringify({"message": `Couldn't find ${urlPath}`, "details": accessError}));
            return;
        }
        if (fs.statSync(filepath).isDirectory()) {
            getFile(filepath + "index.html", urlPath, response);
            return;
        }
        fs.readFile(filepath, (readError, data) => {
            if (readError) {
                response.statusCode = 500;
                response.setHeader('Content-Type', mimeTypes[".json"]);
                response.end(JSON.stringify({"message": `Couldn't read ${urlPath}`, "details": readError}));
                return;
            }
            response.statusCode = 200;
            response.setHeader('Content-Type', mimeTypes[path.extname(filepath)] ?? mimeTypes.default);
            response.end(data);
        });
    });
}

function manageRequest(request, response) {
    let urlPath = new URL(request.url, `${request.protocol}://${request.headers.host}`).pathname;
    let filepath = frontPath + urlPath;
    if (filepath.includes("..")) {
        response.statusCode = 400;
        response.setHeader('Content-Type', mimeTypes[".json"]);
        response.end(JSON.stringify({"message": `Invalid request ${urlPath}`}));
        return;
    }
    getFile(filepath, urlPath, response);
}

exports.manage = manageRequest;