import { User,DepartmentUsers } from '../models/index'
const axios = require('axios');
import https = require("https");

export const getDaSocities = async (filterObject: any, skip: number, limit: number) => {

    /*
    skip = skip || 0;
    limit = limit || 10;
    const totalCount = await DaSociety.find(filterObject).countDocuments();
    const dasocieties = await DaSociety.aggregate([
        { $match: filterObject},
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        
    ]).allowDiskUse(true);
    */
    return false; //{ dasocieties, totalCount };
}

export const _checkUser = async (email: string) => {
    return await User.findOne({$or:[{email:email}]});
}

export const _checkUserAadhar = async (aadharNumber: number) => {
    return await User.findOne({aadharNumber:aadharNumber});
}
export const _getUserToken = async (id: any,userType:any) => {
    if(userType){
    return await User.findOne({_id:id},{token:1});
    }
    else{
        return await DepartmentUsers.findOne({_id:id},{token:1});
    }
}

export const _clearToken = async (id: any,isUser:any) => {
    if(isUser){
    return await User.findByIdAndUpdate({_id:id},{$unset:{token:""}});
    }
    else{
    return await DepartmentUsers.findByIdAndUpdate({_id:id},{$unset:{token:""}});
    }
}

export const createUser = async (payload: User) => {

    try{
        //payload.status = 1;
        const user = await new User(payload).save();
        const userDetails: any = {}
        userDetails._id = user._id
        userDetails.firstName = user.firstName
        userDetails.lastName = user.lastName
        userDetails.email = user.email
        userDetails.alternateEmail = user.alternateEmail
        userDetails.mobileNumber = user.mobileNumber
        userDetails.aadharNumber = user.aadharNumber
        userDetails.registrationType = user.registrationType
        userDetails.status = user.status
        
        return userDetails;
    } catch(error) {
        console.log("<===== Error =====>", error);
        return false;
    }
}

export const _checkVerifyOTP = async (otpReq: any) => {

    const url = process.env.AADHAR_URL +"/aadharEKYCWithOTP"; 
    const params = {
                  'aadharNumber':otpReq.aadharNumber,
                  'transactionNumber':otpReq.transactionNumber,         
                  'otp':otpReq.otp
                }
                const agent = new https.Agent({

                    rejectUnauthorized: false,
            
                  });
    return await axios.post(url, params,{ httpsAgent: agent });
}
export const _getUUIDByAadharNumber = async (aadharNumber: any) => {

    const url = process.env.AADHAR_VAULT_URL +"/getUUIDByAadharNumber"; 
    const ciphertext=Buffer.from(aadharNumber.toString(),'binary').toString('base64')
    const params = {
                  'aadharNumber':ciphertext,
                }
                const agent = new https.Agent({

                    rejectUnauthorized: false,
            
                  });
    return await axios.post(url, params,{ httpsAgent: agent });
}
export const _getAadharNumberByUUID = async (UUIDNumber: any) => {

    const url = process.env.AADHAR_VAULT_URL +"/getAadharNumberByUUID"; 
    const ciphertext = Buffer.from(UUIDNumber.toString(),'binary').toString('base64')
    const params = {
                  'uuidNumber':ciphertext,
                }
                const agent = new https.Agent({

                    rejectUnauthorized: false,
            
                  });
    return await axios.post(url, params,{ httpsAgent: agent });
}