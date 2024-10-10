const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const fs = require("fs");
const serveIndex = require('serve-index');
const app = express();

console.log("Directory:",process.execPath);

const runtimeDir = path.join(path.dirname(process.execPath),"runtime");
let filePath = process.argv[2] || path.join(path.dirname(process.execPath),"pages");
console.log("Listening for changes on: ", filePath);
console.log("Runtime directory: ", runtimeDir);

const listFiles=async ()=>{
    const directory=__dirname;
    const files=await fs.promises.readdir(directory);
    console.log(files);
}

console.log("reading folder:",__dirname);
listFiles().then(()=>console.log("finished reading:",__dirname));


const deletFileExcept = async (dir, exception) => {
    try {
        const files = await fs.promises.readdir(dir);
        console.log(files);
        for (const file of files) {
            console.log("Filename: ", file);
            const filePath = path.resolve(dir, file);
            if (file !== exception) {
                try {
                    const stats = await fs.promises.lstat(filePath);
                    if (stats.isDirectory()) {
                        await fs.promises.rmdir(filePath, { recursive: true });
                    } else {
                        await fs.promises.unlink(filePath);
                    }
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        throw err;
                    }
                }
            }
        }
        console.log("Files deleted successfully");
    } catch (err) {
        console.log("Error deleting the file: ", err);
    }
};

const injectScript = async (htmlPath) => {
    try {
        let data = await fs.promises.readFile(htmlPath, 'utf-8');
        const scriptToInject = "<!--Live reload script -->\n<script src='./socket.js'></script>\n</body>";
        data = data.replace('</body>', scriptToInject);
        await fs.promises.writeFile(htmlPath, data, 'utf-8');
    } catch (error) {
        console.error("Error injecting script: ", error);
    }
};

const readAndStoreFiles = async (sourceDir, targetDir) => {
    try {
        const items = await fs.promises.readdir(sourceDir);
        for (const item of items) {
            const sourcePath = path.resolve(sourceDir, item);
            const targetPath = path.resolve(targetDir, item);
            const stats = await fs.promises.lstat(sourcePath);
            if (stats.isDirectory()) {
                await fs.promises.mkdir(targetPath, { recursive: true });
                await readAndStoreFiles(sourcePath, targetPath);
            } else {
                const data = await fs.promises.readFile(sourcePath, 'utf-8');
                await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
                await fs.promises.writeFile(targetPath, data);
                if (path.extname(sourcePath) === '.html') {
                    await injectScript(targetPath);
                }
            }
        }
    } catch (error) {
        console.error("Error processing files: ", error);
    }
};

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.send("Live Reload script injected");
});

let flag = 0;
fs.watch(filePath, { recursive: true }, async (eventType, filename) => {
    if (!flag) {
        flag = 1;
        await readAndStoreFiles(filePath, path.resolve(runtimeDir, "public"));
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send("reload");
            }
        });
        setTimeout(() => flag = 0, 100);
    }
});

app.use(cors({ origin: '*' }));
app.use('/', express.static(path.resolve(runtimeDir, 'public')), serveIndex(path.resolve(runtimeDir, 'public'), { 'icons': true }));

app.get('/author', (req, res) => {
    res.json({ 
        'author-name': 'Vikas Bhat D' 
    });
});

deletFileExcept(path.resolve(runtimeDir, "public"), "socket.js")
.then(() => readAndStoreFiles(filePath, path.resolve(runtimeDir, "public")))
.then(() => server.listen(3000, () => {
    console.log("Server listening on port 3000");
    console.log("http://localhost:3000")
}));
