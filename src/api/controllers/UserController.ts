import express, { Request, Response } from 'express';
import { User, Firm, DepartmentUsers } from '../../models/index'
import { _checkUser, createUser, _checkUserAadhar, _checkVerifyOTP, _getUUIDByAadharNumber } from '../../services/UserService';
import { generateJWTToken } from '../../utils/functions'
import { _checkFirm, _createFirm } from '../../services/FirmsService';
import { userSession } from '../middleware/auth';
import axios from 'axios';
import { logger } from '../../logger';
const util = require('util');
const nodemailer = require("nodemailer");
var CryptoJS = require("crypto-js");


export const getallUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}, { password: 0 });
        return res.json(users);
    } catch (error) {
        logger.error(`getallUsers- ${error}`);
        return res.status(500).json(error);
    }

}
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const users = await User.findOne({
            _id: id
        }, { password: 0 });

        if (!users) {
            const error = new Error('User does not exist');
            return res.status(500).json(error)
        }

        res.json(users);
    } catch (error) {
        logger.error(`getUserById- ${error}`);
        return res.status(500).json(error);
    }

};

export const checkUser = async (req: Request, res: Response) => {

    let { email, aadharNumber } = req.body;
    aadharNumber = JSON.parse(CryptoJS.AES.decrypt(aadharNumber, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8));
    console.log("<========  userCheck Start  ========>");    
    const resp = await _getUUIDByAadharNumber(aadharNumber.toString())
    if (resp.data?.status == "Success") {
        aadharNumber = resp.data.UUID        
    }
    else if(resp.data?.status == "Failure" && resp.data?.message == "Aadhaar Vault service Error : UUID not Found."){
        return res.status(200).send({ message: 'Your EKYC process is not completed. Please complete the EKYC Process', success: false, data: {} });
    }
    else {
        return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
    }
    const userCheck = await _checkUser(email);
    console.log("<========  userCheck  ========>", userCheck);

    if (userCheck) {
        return res.status(200).send({
            success: false,
            message: 'User already exists!',
            data: {}
        });
    }
    else {
        return res.status(200).send({
            success: true,
            message: 'User not available',
            data: {}
        });

    }
};

export const checkUserAadhar = async (req: Request, res: Response) => {

    let { aadharNumber } = req.body;

    aadharNumber = JSON.parse(CryptoJS.AES.decrypt(aadharNumber, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8));

    console.log("<========  userCheck Start  ========>", aadharNumber);
    logger.info(`<========  userCheck Start  ========>, ${aadharNumber}`);
    const resp = await _getUUIDByAadharNumber(aadharNumber.toString())
    if (resp.data?.status == "Success") {
        aadharNumber = resp.data.UUID
    }
    else {
        return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
    }
    const userCheck = await _checkUserAadhar(aadharNumber);
    console.log("<========  userCheck  ========>", userCheck);

    if (userCheck) {
        const refId = CryptoJS.AES.encrypt(userCheck._id.toString(), process.env.SECRET_KEY).toString();

        return res.status(200).send({
            success: true,
            message: 'User exists!',
            data: { refId: refId }
        });
    }
    else {
        return res.status(200).send({
            success: false,
            message: 'Invalid',
            data: {}
        });

    }
};

export const createFirmSocietyUser = async (req: Request, res: Response) => {
    try {
        const request: any = { ...req.body }
        request.aadharNumber = Buffer.from(req.body.aadharNumber, 'base64')
        let { registrationType, firmName, societyName, district, email, alternateEmail, aadharNumber } = request;
        console.log("<========  registrationType  ========>", registrationType);
        if (registrationType != 'firm' && registrationType != 'society') throw new Error;

        if (email === alternateEmail) return res.status(200).send({ message: "Email and alternate email should not be same", success: false, data: {} });

        console.log("<========  userCheck Start  ========>");
        const resp = await _getUUIDByAadharNumber(aadharNumber.toString())
        if (resp.data?.status == "Success") {
            aadharNumber = resp.data.UUID
            request.aadharNumber=resp.data.UUID
        }
        else {
            return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
        }

        const userCheck = await _checkUser(email);
        console.log("<========  userCheck  ========>", userCheck);

        if (userCheck) {
            return res.status(200).send({
                success: false,
                message: 'User already exists!',
                data: {}
            });
        }

        if (registrationType == 'firm') {
            const firmCheck = await _checkFirm(firmName, district);
            console.log("<========  firm  ========>", firmCheck);
            if (firmCheck) {
                return res.status(200).send({ message: "Firm already exists!", success: false, data: {} });
            }
        }

        let user = await createUser(request);
        console.log("<========  user  ========>", user);
        if (!user) {
            return res.status(200).send({ message: "User already exists!", success: false, data: {} });
        }

        let applicationNumber = '';
        let applicationId;
        if (registrationType == 'firm') {
            applicationNumber = 'FRA' + Date.now() + ((Math.random() * 100000).toFixed());
            const firmPayload = {
                firmName: firmName,
                district: district,
                userId: user._id,
                applicationNumber: applicationNumber,
                createdBy:userSession.email,
                version:process.env.E_VERSION,
                
            }

            console.log("<========  firmPayload  ========>", firmPayload);

            const firm = await _createFirm(firmPayload);
            console.log("<========  firm  ========>", firm);

            if (!firm) {
                return res.status(200).send({
                    success: false,
                    message: 'Unable to create firm. Please try again',
                    data: {}
                });
            } else {
                applicationId = firm._id;
            }
        }

        console.log("<========  user  ========>", user);

        //if (user) {
        user.userType = 'user';
        user.applicationNumber = applicationNumber;
        user.applicationId = applicationId;

        user.token = generateJWTToken(user);
        return res.status(200).send({
            success: true,
            message: 'User Saved Sucessfully!',
            data: CryptoJS.AES.encrypt(JSON.stringify(user), process.env.SECRET_KEY).toString()
        });
        //}


    } catch (error) {
        logger.error(`createFirmSocietyUser- ${error}`);
        console.log("<========  error  ========>", error);

        return res.status(500).send({
            success: false,
            message: "Unable to create user. Please try again",
            data: {}
        });
    }
}

export const updateUsers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // console.log(id);

        const users = await User.findById({ _id: id })
        if (!users) {
            return res.status(500).json({ message: 'doesnot exist' })
        }
        const {
            userName,
            dob,
            firstName,
            lastName,
            gender,
            email,
            password,
            roleType,
            status,
            createdBy,
            modifiedBy } = req.body;
        const newUser = {
            userName,
            dob,
            firstName,
            lastName,
            gender,
            email,
            password,
            roleType,
            status,
            createdBy,
            modifiedBy
        };
        const result = await User.findOneAndUpdate({ _id: id }, newUser);
        res.json(result);

    }
    catch (error) {
        logger.error(`updateUsers- ${error}`);
        return res.status(500).json(error);

    }
}

export const updateDepartmentUser = async (req: Request, res: Response) => {
    try {
        const reg: any = /^[A-Za-z\s]*$/;
        const reg2: any = /^\d{10}$/;
        if (!req.body.fullName) {
            return res.status(404).send({ message: 'fullName is not allowed to be empty', success: false, data: {} });
        }
        else if (!reg.test(req.body.fullName)) {
            return res.status(404).send({ message: 'fullName format is invalid!', success: false, data: {} });
        }
        else if (!req.body.mobileNumber) {
            return res.status(404).send({ message: 'mobileNumber is not allowed to be empty', success: false, data: {} });
        }
        else if (!reg2.test(req.body.mobileNumber)) {
            return res.status(404).send({ message: 'mobileNumber format is invalid!', success: false, data: {} });
        }
        const { fullName, mobileNumber } = req.body;
        const signature = req.file?.buffer.toString('base64');

        //console.log("<========  signature  ========>", signature);
        //console.log("<========  signature Mime Type ========>", req.file?.mimetype);
        //console.log("<========  fullName  ========>", fullName);
        //console.log("<========  mobileNumber  ========>", mobileNumber);

        if (mobileNumber && mobileNumber.length < 10)
            return res.status(400).send({ message: "Enter valid mobile number", success: false, data: {} });

        if (req.file && (req.file?.mimetype != 'image/jpeg' && req.file?.mimetype != 'image/png' && req.file?.mimetype != 'image/jpg'))
            return res.status(400).send({ message: "Upload valid signature", success: false, data: {} });

        const user = await DepartmentUsers.findById({ _id: userSession._id })
        //console.log("<========  Dept User  ========>", user);
        //return false;

        if (!user) {
            return res.status(200).send({ message: "User doesn't exists!", success: false, data: {} });
        }
        const updateUser = {
            fullName: fullName,
            mobileNumber: mobileNumber,
            signature: signature,
            updatedBy: userSession.email,
            
            version:process.env.E_VERSION
        };
        const result = await DepartmentUsers.findOneAndUpdate({ _id: userSession._id }, updateUser);

        return res.status(200).send({ message: "User saved successfully.", success: true, data: {} });
    }
    catch (error) {
        logger.error(`updateDepartmentUser - ${error}`);
        return res.status(500).send({ message: "Something went wrong, please try again", success: false, data: {} });
    }
}

export const updateDepartmentUserData = async (req: Request, res: Response) => {
    try {

        const users = await DepartmentUsers.find()
        //console.log("<========  Dept User  ========>", user);
        //return false;

        if (!users) {
            return res.status(200).send({ message: "User doesn't exists!", success: false, data: {} });
        }

        users.forEach(async (user) => {
            const updateUser = {
                fullName: `${user.role} ${user.district}`,
                mobileNumber: '9999999999',
                status: 'Active',
            };
            //console.log("<========  Dept User Id  ========>", user._id);
            //console.log("<========  Dept User Data Update  ========>", updateUser);

            await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
        });



        return res.status(200).send({ message: "User dummy data saved successfully.", success: true, data: {} });
    }
    catch (error) {
        logger.error(`updateDepartmentUserData - ${error}`);
        return res.status(500).send({ message: "Something went wrong, please try again", success: false, data: {} });
    }
}

export const sendSMSMail = async (req: any, res: any) => {


    try {
        let xmlString = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '+
        'xmlns:nic="http://nic.com/"><soapenv:Header/><soapenv:Body><nic:sendSms_New>'+
        '<phoneNo>'+req.body.phoneNumber+'</phoneNo><content>'+`Your Application is ` + req.body.status +'</content>'+
        '<templateId>'+`1007176258326536442`+'</templateId></nic:sendSms_New></soapenv:Body>'+
        '</soapenv:Envelope>';

        await axios({

            url: "http://igrs.ap.gov.in:7004/SMS_Service/SmsService?wsdl",

            data: xmlString,

            method: 'POST',

            headers: {

                'Accept': 'text/xml',

                'Content-Type': 'text/xml'

            }

        })
        let transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com",
            port: 587,
            //secure: false,
            ssl: true,
            auth: {
                user: "support.igrs@criticalriver.com",
                pass: "Rockstar@1234",
            },
        });
        await transporter.sendMail({
            from: '"Firms" <support.igrs@criticalriver.com>', // sender address
            to: req.body.email, // list of receivers
            subject: "Sub: Firms Status", // Subject line
            //text: "Dear User, ", // plain text body
            html: `Dear User, <br>
                    Firms Application is ${req.body.status}`
        });

        return res.status(200).send({ success: true })

    } catch (error) {
        logger.error(`sendSMSMail - ${error}`);
        return res.status(500).send({ message: "Something went wrong, please try again", success: false, data: {} });
    }

}
export const getDepartmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await DepartmentUsers.findOne({
            _id: id
        }, { password: 0 });

        if (!user) {
            //const error = new Error('User does not exist');
            return res.status(200).send({ message: "User does not exist.", success: false, data: {} });

        }

        return res.status(200).send({ message: "User data fetched successfully.", success: true, data: {} });

    } catch (error) {
        logger.error(`getDepartmentById - ${error}`);
        return res.status(500).json(error);
    }
};

export const getDepartmentCertificateDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await DepartmentUsers.findOne({
            _id: id
        }, { _id: 0, fullName: 1, district: 1, signature: 1 });

        if (!user) {
            const userDetailsEnc = CryptoJS.AES.encrypt(JSON.stringify({ message: "User does not exist.", success: false, data: {} }), process.env.SECRET_KEY).toString();

            //const error = new Error('User does not exist');
            return res.status(400).send(userDetailsEnc);

        }
        else if (user.district != userSession.district) {
            const userDetailsEnc = CryptoJS.AES.encrypt(JSON.stringify({ message: "unauthorized request.", success: false, data: {} }), process.env.SECRET_KEY).toString();

            return res.status(400).send(userDetailsEnc);
        }

        const userDetailsEnc = CryptoJS.AES.encrypt(JSON.stringify({ message: "User data fetched successfully.", success: true, data: user }), process.env.SECRET_KEY).toString();

        return res.status(200).send(userDetailsEnc);

    } catch (error) {
        logger.error(`getDepartmentCertificateDetails - ${error}`);
        return res.status(500).json(error);
    }
};

export const verifyOTP = async (req: Request, res: Response) => {

    const { otp } = req.body;
    //console.log("<========  otp Request  ========>", otp);

    var bytes = CryptoJS.AES.decrypt(otp, process.env.SECRET_KEY);
    var otpData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));


    if (otpData.aadharNumber == '')
        return res.status(400).send({ success: false, message: "Aadhaar Number is not allowed to be empty", data: {} });
    else if (otpData.transactionNumber == '')
        return res.status(400).send({ success: false, message: "Transaction Number is not allowed to be empty", data: {} });
    else if (otpData.otp == '')
        return res.status(400).send({ success: false, message: "OTP is not allowed to be empty", data: {} });

    console.log("<========  userCheck Start  ========>");
    const otpResponse = await _checkVerifyOTP(otpData);
    console.log("<========  userCheck  ========>", otpResponse);
    logger.info(`<========  verifyOTP - userCheck  ========>, ${util.inspect(otpResponse, { depth: null, colors: false })})`);

    if (otpResponse.status == 200) {

        if (otpResponse.data.status != 'Success') {
            return res.status(200).send({
                success: false,
                message: otpResponse.data.message,
                userInfo: {}
            });
        }
        else {
            const userDetailsEnc = CryptoJS.AES.encrypt(JSON.stringify(otpResponse.data), process.env.SECRET_KEY).toString();
            return res.status(200).send({
                success: true,
                message: 'OTP Verified',
                userInfo: userDetailsEnc
            });
        }
    }
    else {
        return res.status(200).send({
            success: false,
            message: 'Something went wrong. Please try again',
            userInfo: {}
        });

    }
};


/*
export const deleteUser =async (req: Request, res: Response)=>{
    try{
        const {id}=req.params;
        const result = await User.deleteOne({_id:id})
        res.status(200).json(result);

    }
    catch(error){
        return res.status(500).json(error);

    }

}
*/
export * as UserController from './UserController';