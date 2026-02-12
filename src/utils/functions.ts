import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { secretKey } from '../config/appConfig';
import { ENVIROMENT } from '../config/constants';
import { nodeEnv } from '../config/appConfig';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import {userSession} from '../api/middleware/auth';
import moment from 'moment';

const { LOCAL, DEVELOPMENT, PREDEV, PRODUCTION, TEST } = ENVIROMENT;
const environment = nodeEnv || LOCAL;
export const isLocalOrTestEnv = () => ([LOCAL, TEST].includes(environment))
export const isLocalEnv = () => (environment === LOCAL)
export const isTestEnv = () => (environment === TEST)
export const isProdEnv = () => (environment === PRODUCTION)
export const isDevEnv = () => (environment === DEVELOPMENT)
export const isPredevEnv = () => (environment === PREDEV)
export let appNumber:string = '';
export const setAppNumber = () => ( appNumber = 'FRA'+ Date.now() + ( (Math.random()*100000).toFixed()))


export const generateJWTToken = (user: any) => {

    let role = '';
    let isAdmin = false;
    let userName = '';
    let applicationNumber= user?.applicationNumber;
    let applicationId= user?.applicationId;
    let district = user.district;

    if(user.userType == 'dept')
    {
        role = user.role;
        isAdmin = true;
        userName = user.userName;
        applicationNumber = 0;
        applicationId = 0;
        district = user.district;
    }
    /*
    console.log("<========== TOKEN User  ==========>", user);
    console.log("<== user._id ==>", user._id);
    console.log("<== userName ==>", userName);
    console.log("<== user.email ==>", user.email);
    console.log("<== role ==>", role);
    console.log("<== isAdmin ==>", isAdmin);
    console.log("<== user.userType ==>", user.userType);
    console.log("<== applicationNumber ==>", applicationNumber);
    console.log("<== secretKey ==>", secretKey);
    console.log("<== district ==>", user.district);
    */

    return jwt.sign({ _id: user._id?.toString(), userName: userName, email: user.email, role: role, isAdmin: isAdmin, userType:user.userType, applicationNumber:applicationNumber, applicationId:applicationId, district:district }, secretKey, {
        expiresIn: '60m',
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        //file.originalname = `${userSession.applicationNumber}_${file.fieldname}.pdf`;
        const fileNumber = moment().valueOf();
        file.originalname = `${file.fieldname}_${fileNumber}.pdf`;
        const filePath = process.env.FILE_DIR_PATH + `uploads/${userSession.applicationId}`;
        fs.mkdirSync(filePath, { recursive: true })
        callback(null, filePath );
    },
    filename: function (request, file, callback) {
        callback(null, file.originalname)
    }
  })

export const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

export const upload = multer({storage: storage, fileFilter: fileFilter});

export const getDocs = (docs: any) => {
    const attachments:any = [];
    if(docs) {
        Object.keys(docs).forEach(doc => {
            if(docs[doc].length > 0) {
                const _doc = docs[doc][0];
                const { originalname, mimetype, destination, path } = _doc;
                attachments.push({ originalname, mimetype, destination, path, id: (new Date().getTime()) });
            }
        })
    }
 
    return attachments;
}
export const firmDocsUpload = upload.fields([
    { name: 'leaseAgreement', maxCount: 1 },
    { name: 'partnershipDeed', maxCount: 1 },
    { name: 'affidavit', maxCount: 1 },
    { name: 'selfSignedDeclaration', maxCount: 1 },
    { name: 'others', maxCount: 1 },
])

export const societyDocsUpload = upload.fields([
    { name: 'applicationForm', maxCount: 1 },
    { name: 'membershipDeed', maxCount: 1 },
    { name: 'affidavit', maxCount: 1 },
    { name: 'selfSignedDeclaration', maxCount: 1 },
    { name: 'memorandumAndByeLaws', maxCount: 1 },
])
