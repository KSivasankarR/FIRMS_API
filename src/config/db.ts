import mongoose from 'mongoose'
import {mongoUser, mongoPassword, mongoUrl, mongoDatabase} from './appConfig'
// import { logger } from 'utils/logger'
import { isLocalOrTestEnv, isLocalEnv, isTestEnv } from '../utils/functions'

const getMongoUrl = () => {
    // let url = `mongodb+srv://${mongoUser}:${mongoPassword}@${mongoSrvUrl}/${mongoDatabase}`
    let url = `${mongoUrl}`;
    // if (isLocalEnv()) {
    //     url = `mongodb://127.0.0.1:27017/${mongoDatabase}`
    // } 

    return url
}

const getConfig = () => ({
    maxPoolSize: 50,
    wtimeoutMS: 2500,
    useNewUrlParser: true
})

const _logError = (e: any) => {
    if (e) {
        // logger.error('Mongoose Init Error:', [e])
        console.error('Mongoose Init Error:', [e])
    }
}

const init = (done?: any) => {
    if (isTestEnv()) return false;

    mongoose.Promise = global.Promise;
    mongoose.connect(
        getMongoUrl(),
        getConfig(),
        (done || _logError)
    )

    const enableDebug = isLocalEnv()
    mongoose.set('debug', enableDebug);
}

const disconnect = (done?: any) => {
    mongoose.disconnect(done);
}

export {
    init,
    init as connect,
    disconnect,
    getMongoUrl,
    getConfig,
}
