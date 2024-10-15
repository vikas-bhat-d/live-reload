const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const path = require("path");
const fs = require("fs");
const serveIndex = require('serve-index');
const {program}=require("commander")
const winston=require("winston");
const chalk=require("chalk")
const injectScript=require('./middleware/injectscript.middleware.js')

const app = express();

const logger = winston.createLogger({
    level: 'info', // Log level
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' })
    ],
});

logger.info("Directory:", process.execPath);

const runtimeDir = path.join(path.dirname(process.execPath), "runtime");

program
    .version('1.0.0')
    .argument('[relative-path]','Relative path to watch','./')
    .option('-p,--port <number>',"Port to listen",'3000')
    .parse(process.argv);

const options=program.opts();
const fpath=program.args[0] || './';
const port=parseInt(options.port);

const filePath=path.resolve(process.cwd(),fpath);


logger.info(chalk.hex('#038cfc')(`Listening for changes on: ${filePath}`));
logger.info(`Runtime directory: ${runtimeDir}`);


const deleteFileExcept = async (dir, exception="none") => {
    try {
        logger.info(`Cleaning public directory`)
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
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
        logger.info(`Cleaned the public directory`);
    } catch (err) {
        logger.error("Error cleaning the public directory: ", err);
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
        logger.info(`Change in ${filePath} detected..updating public directory..`)
        await readAndStoreFiles(filePath, path.resolve(runtimeDir, "public"));
        logger.info("Updated public directory with changed files succesfully..")
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send("reload");
            }
        });
        setTimeout(() => flag = 0, 100);
    }
});

app.use(cors({ origin: '*' }));
app.use('/', injectScript(port),express.static(path.resolve(runtimeDir, 'public')), serveIndex(path.resolve(runtimeDir, 'public'), { 'icons': true }));

app.get('/author',injectScript(port), (req, res) => {
    res.json({
        'author-name': 'Vikas Bhat D',
        'github':'https://github.com/vikas-bhat-d/',
        'linkedin':'https://www.linkedin.com/in/vikas-bhat-d/'
    })
})


deleteFileExcept(path.resolve(runtimeDir, "public"))
    .then(() => readAndStoreFiles(filePath, path.resolve(runtimeDir, "public")))
    .then(() => server.listen(port, () => {
        logger.info("Added the files from source directory to public directory")
        logger.info(`Server listening on port: ${port}`);
        logger.info(chalk.hex('#fcf803')(`URL: http://localhost:${port}`))
}));

const gracefulShutdown = async () => {
    logger.info(chalk.hex('#fc0335')("Shutting down server..."));
    deleteFileExcept(path.resolve(runtimeDir,"public"))
    .then(()=>{
        wss.close(() => {
            server.close(() => {
                logger.info(chalk.hex('#fc0335')("Server closed."));
                process.exit(0);
            });
        });
    })
};

['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, gracefulShutdown);
});
