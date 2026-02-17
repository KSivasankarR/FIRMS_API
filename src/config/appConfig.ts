export const backendPort = process.env.BACKEND_PORT || 8082;
// Node
export const nodeEnv = process.env.NODE_ENV;

// Mongo DB
export const mongoDatabase = process.env.MONGO_DB || 'fasp_api';
export const mongoUser = process.env.MONGO_USER;
export const mongoPassword = process.env.MONGO_PASSWORD;
export const mongoUrl = process.env.MONGO_URL;
export const connectionParams = process.env.MONGO_CONNECTION_PARAMS;
export const poolingConnections = process.env.MONGO_MAXCONN;
export const adminPassword = process.env.ADMIN_PASSWORD_DEFAULT;
export const secretKey = process.env.SECRET_KEY || 'GovtOfAndhraPradesh';
// console.log('process.env', process.env)
export const downloadUrl = process.env.DOWNLOAD_URL;
