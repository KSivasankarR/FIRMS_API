import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import { resolve } from 'path';
import { init as initDb } from './src/config/db';
import router from './src/api/index';
import swaggerUi from 'swagger-ui-express';
import swaggerJson from './swagger.json';

const app = express();
const PORT = process.env.PORT || 3004;

// ------------------- CORS & Security -------------------
const allowedOrigins = [
    'http://10.10.120.190:3008',
    'http://10.10.120.6:8091',
    'https://firms.rs.ap.gov.in',
    'https://esign.rs.ap.gov.in',
    'http://localhost:3008'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.header('X-Frame-Options','SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.header('Cache-Control','private, must-revalidate, max-age=0, no-store, no-cache');
    res.header('Expires', '0');
    res.header('Pragma', 'no-cache');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    next();
});

// ------------------- Middleware -------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicFolder = resolve(__dirname, './public');
app.use(express.static(publicFolder));
app.use("/api/files", express.static(resolve(process.env.FILE_DIR_PATH || '.', "pdfs/uploads")));

// ------------------- Swagger -------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJson));

// ------------------- Routes -------------------
app.get("/", (_req: Request, res: Response) => {
    res.send("Hello TypeScript with Node.js!");
});

app.use("/api", router);

// ------------------- Database Init -------------------
initDb();

// ------------------- Error Handler -------------------
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
};
app.use(errorHandler);

// ------------------- Start Server -------------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
