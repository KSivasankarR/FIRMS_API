import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { secretKey } from '../../config/appConfig';
import { _getUserToken } from '../../services/UserService';
import { logger } from '../../logger';

//export const SECRET_KEY: Secret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InBhdmFuIiwiaWF0IjoxNTE2MjM5MDIyfQ.5DUTMN9oPwKBgHlJcWmzbBVodUJ_19u3sVy-6_Y0vkk';

export let userSession = {
  _id: '',
  email: '',
  role: '',
  isAdmin: '',
  userType: '',
  userName: '',
  applicationNumber: '',
  applicationId: '',
  district: ''
};
export interface CustomRequest extends Request {
 token: string | JwtPayload;
}

interface DecodedToken extends JwtPayload {
  username: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  const SECRET_KEY = process.env.INDUST_SECRET_KEY;
  if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined in the environment variables");
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    (req as any).user = decoded as DecodedToken;
    next();
  });
};

export const isLogin = async (req: any, res: Response, next: NextFunction) => {
 try {
   const token = req.header('Authorization')?.replace('Bearer ', '');
   if (!token) {
     throw new Error();
   }

   const verified:any = jwt.verify(token, secretKey);
   if(verified?._id){
   const userToken=await _getUserToken(verified._id,verified.userType=="user"?true:false)
   
    if(verified && userToken && token==userToken.token) {
      userSession._id = verified._id;
      userSession.email = verified.email;
      userSession.role = verified.role;
      userSession.isAdmin = verified.isAdmin;
      userSession.userType = verified.userType;
      userSession.userName = verified.userName;
      userSession.applicationNumber = verified.applicationNumber;
      userSession.applicationId = verified.applicationId;
      userSession.district = verified.district;
      
      console.log("<====  userSession  ====>", userSession);
      logger.info(`<======== isLogin - userSession ========>, ${JSON.stringify(userSession)}`);

    }
    else {
      throw new Error();
    }
  }
  else {
    throw new Error();
  }
   next();
 } catch (err) {
  return res.status(401).send({
    success: false,
    message: "Session Expired",
    data: {}
  });

 }
};

export const isAdmin = async (req: any, res: Response, next: NextFunction) => {
  try { 
    if (!userSession || !userSession.isAdmin) {
      throw new Error();
    }
    next();
  } catch (err) {
   return res.status(401).send({
     success: false,
     message: "Invalid Admin User",
     data: {}
   }); 
  }
 };