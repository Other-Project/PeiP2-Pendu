const path = require("path");
const fs = require("fs");

const frontPath = "./front";
const errorPaths = {
    400: frontPath + "/error400.html",
    404: frontPath + "/error404.html",
    500: frontPath + "/error500.html",
}
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

async function getErrorPage(errorCode, response) {
    let filepath = errorPaths[errorCode];
    response.statusCode = errorCode;
    try {
        await fs.promises.access(filepath, fs.constants.R_OK);
        response.setHeader('Content-Type', mimeTypes[path.extname(filepath)] ?? mimeTypes.default);
        response.end(await fs.promises.readFile(filepath));
    }
    catch {
        response.setHeader('Content-Type', mimeTypes[".json"]);
        response.end(JSON.stringify({"code": errorCode}));
    }
}

function getFile(filepath, urlPath, response) {
    fs.access(filepath, fs.constants.R_OK, (accessError) => {
        if (accessError) {
            getErrorPage(404, response).then(() => {});
            return;
        }
        if (fs.statSync(filepath).isDirectory()) {
            getFile(filepath + "index.html", urlPath, response);
            return;
        }
        fs.readFile(filepath, async (readError, data) => {
            if (readError) {
                getErrorPage(500, response).then(() => {});
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
        getErrorPage(400, response).then(() => {});
        return;
    }
    getFile(filepath, urlPath, response);
}

exports.manage = manageRequest;