import { config } from "dotenv";
import express from "express";
import * as http from "http";
import * as winston from "winston";
import * as expressWinston from "express-winston";
import cors from "cors";
import debug from "debug";
import { configureRoutes } from "./src/wix-controller";

config(); // Reading Env vars
const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = process.env.PORT || 3000;
const debugLog: debug.IDebugger = debug('app');
app.use(express.json());
app.use(cors());

// Setting up logging
const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true })
    ),
};

if (!process.env.DEBUG) {
    loggerOptions.meta = false; // when not debugging, log requests as one-liners
}
app.use(expressWinston.logger(loggerOptions));

// Add Wix controllers
configureRoutes(app);

// this is a simple route to make sure everything is working properly
const runningMessage = `Server running at http://localhost:${port}`;
app.get('/', (_req: express.Request, res: express.Response) => {
    res.status(200).send({ data: runningMessage });
});

server.listen(port, () => {
  debugLog(`Server running at http://localhost:${port}`);
});
