const fs = require("fs");
const http = require("http");
const path = require("path");

const port = Number(process.env.PORT || 3100);
const root = path.resolve(__dirname, "..", "build");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function safeResolve(requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const relativePath = decoded === "/" ? "/index.html" : decoded;
  const resolvedPath = path.normalize(path.join(root, relativePath));
  return resolvedPath.startsWith(root) ? resolvedPath : path.join(root, "index.html");
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const stream = fs.createReadStream(filePath);
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream"
  });
  stream.pipe(response);
}

const server = http.createServer((request, response) => {
  const resolvedPath = safeResolve(request.url || "/");

  fs.stat(resolvedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, resolvedPath);
      return;
    }

    sendFile(response, path.join(root, "index.html"));
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static frontend server listening on http://127.0.0.1:${port}`);
});
