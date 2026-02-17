import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
const path = require("path");
import { resolve } from 'path'
import cors from 'cors'
import { init as initDb } from './src/config/db'
const PORT = process.env.PORT || 8000;
import router from './src/api/index';
import bodyParser from 'body-parser';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from "swagger-ui-express";
import swaggerJson from './swagger.json';
import type { ErrorRequestHandler } from "express";
 
//const publicFolder = resolve(__dirname, './public')
//process.env.DIR_ROOT = __dirname;
//app.use("/files", express.static(path.join(process.env.DIR_ROOT, "pdfs/uploads")));
//app.use("/files", express.static(path.join(__dirname, "./pdfs/uploads")));
 
initDb();
//app.use(express.json());
//app.use(bodyParser.json());
//app.use(express.urlencoded({ extended: true }));
//app.use(express.static(publicFolder))
 
const allowedOrigins = ['http://103.129.75.188:3008','http://103.174.56.169:8091','https://firms.rs.ap.gov.in','https://esign.rs.ap.gov.in', 'http://localhost:3008'];
app.use(cors({
    origin: allowedOrigins
}));

app.disable('x-powered-by');
app.disable('etag');
app.use(function (req, res, next) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // res.header('Access-Control-Allow-Origin', '*');
    res.header('X-Frame-Options','SAMEORIGIN');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('Expires', '0');
    res.header('Pragma', 'no-cache');
    res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.header('Cache-Control','private, must-revalidate, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
    res.header('Content-Security-Policy', `default-src 'self' 'unsafe-inline' 'unsafe-eval' https://firms.rs.ap.gov.in https://esign.rs.ap.gov.in http://103.129.75.188:3008 http://103.129.75.188:4000 https://registration.ap.gov.in; script-src 'self' 'unsafe-inline'; child-src https://firms.rs.ap.gov.in https://esign.rs.ap.gov.in http://103.129.75.188:3008 http://103.129.75.188:4000 https://registration.ap.gov.in; img-src * 'self' data: https:;`);
    res.removeHeader("X-Powered-By"); 
    next();
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJson));
const publicFolder = resolve(__dirname, './public')
app.use(express.json());
//app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicFolder))
app.use("/api/files", express.static(path.join(process.env.FILE_DIR_PATH, "pdfs/uploads")));
app.get("/", (req, res): void => {
    res.send("Hello Typescript with Node.js!")
});  
app.use('/api/', router);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => { };
app.use(errorHandler);
app.listen(PORT, (): void => {
    console.log(`Server Running here 👉 http://localhost:${PORT}`);
});
 