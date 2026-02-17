import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs'
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { User, DepartmentUsers } from '../../models/index'
import { secretKey } from '../../config/appConfig';
import { generateJWTToken } from '../../utils/functions'
import { userSession } from '../middleware/auth';
import { _getUserFirmDetails } from '../../services/FirmsService';

import moment from 'moment';
import { _checkVerifyOTP, _clearToken, _getAadharNumberByUUID, _getUUIDByAadharNumber } from '../../services/UserService';
import { logger } from '../../logger';
import UserLogs from '../../models/UserLogs';
const util = require('util');
var CryptoJS = require("crypto-js");

/*
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, userName } = req.body;
  try {
    const oldUser = await User.findOne({ email: email, password: password });
    if (oldUser) {
      res.json(oldUser);
    }
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    const result = await User.create({
      email: email,
      password: hash
    }); 
    res.status(201).json({ result });

  } catch (error) {
    console.log(error);
    res.status(201).json({ error });
  }
}
*/

export const loginUser = async (req: Request, res: Response) => {

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
  else if (otpData.refId == '')
    return res.status(400).send({ success: false, message: "Reference Id is not allowed to be empty", data: {} });

  console.log("<========  userCheck Start  ========>");
  logger.info(`<========  loginUser - userCheck Start  ========>`);
  const otpResponse = await _checkVerifyOTP(otpData);
  console.log("<========  userCheck  ========>", otpResponse);  
  logger.info(`<========  loginUser - userCheck  ========>, ${util.inspect(otpResponse, { depth: null, colors: false })})`);

  if (otpResponse.status == 200) {

    if (otpResponse.data.status != 'Success') {
      return res.status(200).send({
        success: false,
        message: otpResponse.data.message,
        data: {}
      });
    }
    else {

      let aadharNumber = Buffer.from(otpData.aadharNumber, 'base64');
      try {

        var refId = CryptoJS.AES.decrypt(otpData.refId, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);

        const resp = await _getUUIDByAadharNumber(aadharNumber.toString())
        if (resp.data?.status == "Success") {
          aadharNumber = resp.data.UUID
        }
        else {
          return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
        }
        let user: any = await User.findOne({ aadharNumber: aadharNumber, _id: refId });

        console.log("<==========  user  ==========>", user);
        logger.info(`<========  user  ========>, ${user}`);

        if (!user) {
          logger.error(`invalid user id- ${refId}`);
          return res.status(401).send({
            success: false,
            message: 'Invalid UserId',
            data: {}
          });
        }
        else if (user.status != 'Active') {
          logger.error(`invalid user id- ${refId}`);
          return res.status(401).send({
            success: false,
            message: 'User Inactive',
            data: {}
          });
        }
        else {

          let applicationDetails: any;
          if (user.registrationType === 'firm')
            applicationDetails = await _getUserFirmDetails(user._id);

          console.log("<===========  applicationDetails  ===============>", applicationDetails);
          logger.info(`<========  applicationDetails  ========>, ${applicationDetails}`);

          user.userType = 'user';
          user.applicationNumber = applicationDetails.applicationNumber;
          user.applicationId = applicationDetails._id;
          let aadhar = ''
          const resp = await _getAadharNumberByUUID(user.aadharNumber.toString())
          if (resp.data?.status == "Success") {
            aadhar = resp.data.UID
          }
          else {
            return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
          }
          const token = generateJWTToken(user);
          const userDetails: any = {}
          userDetails.firstName = user.firstName
          userDetails.lastName = user.lastName
          userDetails.email = user.email
          userDetails.alternateEmail = user.alternateEmail
          userDetails.mobileNumber = user.mobileNumber
          userDetails.aadharNumber = aadhar
          userDetails.registrationType = user.registrationType
          userDetails.status = user.status
          userDetails.applicationId = applicationDetails._id;
          userDetails.applicationNumber = applicationDetails.applicationNumber;
          userDetails.userType = user.userType
          userDetails.token = token
          userDetails.lastLogin = user.lastLogin
          let userLogs: any = {}
          userLogs.userName = user.firstName + " " + user.lastName
          userLogs.email = user.email
          userLogs.createdBy = user.createdBy
          const userDetailsEnc = CryptoJS.AES.encrypt(JSON.stringify(userDetails), process.env.SECRET_KEY).toString();
          const version = process.env.E_VERSION;
          let clientIpAddress;
          if (req.socket && req.socket.remoteAddress) {
              clientIpAddress = req.socket.remoteAddress;
            } else {
              clientIpAddress = req.ip;
            }
          await UserLogs.create({ userName: userLogs.userName, email: userLogs.email, createdBy: userLogs.createdBy, version: version });
          const lastLogin = new Date()
          await User.findOneAndUpdate({ _id: user._id }, { $set: { lastLogin: lastLogin, token: token } });
          logger.info(`user details fetched successfully for userid- ${user._id}`);
          logger.info(`<========  userCheck Start  ========>, ${userDetailsEnc}`);
          return res.status(200).send({
            success: true,
            message: 'User details fetched successfully',
            data: userDetailsEnc
          });
        }
      } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(401).send({
          success: false,
          message: "Unable to login. Please try again",
          data: {}
        });

      }
    }
  }
  else {
    logger.error(`login failed -${refId}`);
    return res.status(200).send({
      success: false,
      message: 'Something went wrong. Please try again',
      data: {}
    });

  }
}

export const loginDepartment = async (req: Request, res: Response) => {

  const { password, userNameOrEmail } = req.body;
  try {

    let user: any = await DepartmentUsers.findOne({
      $or: [
        { userName: userNameOrEmail },
        { email: userNameOrEmail }
      ],
      $and: [{ role: { $in: ['DLF', 'DR'] } }, { status: 'Active' }]
    });

    console.log("<==========  user  ==========>", user);
    logger.info(`<========  user  ========>, ${user}`);

    if (!user) {
      logger.error(`username/password incorrect ${userNameOrEmail}`);
      return res.status(401).send({
        success: false,
        message: 'Username/password incorrect',
        data: {}
      });
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    // const isMatch = true;
    if (isMatch) {
      if (isMatch) {
        if (user.loginAttemptTime) {
          let date: any = new Date()
          var diff = (date - user.loginAttemptTime) / 300000;
          if (diff < 1) {
            let msg = "You have exceeded maximum login attempts. Please try after five minutes"
            return res.status(401).send({
              success: false,
              message: msg,
              data: {}
            });
          } else {
            const updateUser = {
              $unset: {
                loginAttemptCount: 0,
                loginAttemptTime: new Date()
              }
            };
            const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
          }
        }
        else {
          const updateUser = {
            $unset: {
              loginAttemptCount: 0
            }
          };
          const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);

        }

        user.userType = 'dept';
        user.applicationNumber = 0;
        user.applicationId = 0;

        const token = generateJWTToken(user);
        const userDetails: any = {}
        userDetails.userName = user.userName
        userDetails.fullName = user.fullName
        //userDetails.firstName = user.firstName
        //userDetails.lastName = user.lastName
        //userDetails.middleName = user.middleName
        userDetails.email = user.email
        userDetails.mobileNumber = user.mobileNumber
        //userDetails.status = user.status
        userDetails.role = user.role
        userDetails.userType = user.userType
        userDetails.district = user.district
        userDetails.token = token
        userDetails.deptUserId = user._id
        userDetails.lastLogin = user.lastLogin
        userDetails.isPasswordChanged = user.isPasswordChanged
        let userLogs: any = {}
        userLogs.userName = user.userName
        userLogs.email = user.email
        userLogs.createdBy = user.createdBy
        const version = process.env.E_VERSION;
        let clientIpAddress;
      if (req.socket && req.socket.remoteAddress) {
          clientIpAddress = req.socket.remoteAddress;
        } else {
          clientIpAddress = req.ip;
        }
        await UserLogs.create({ userName: userLogs.userName, email: userLogs.email, createdBy: userLogs.createdBy, version: version});

        const lastLogin = new Date()
        await DepartmentUsers.findOneAndUpdate({ _id: user._id }, { $set: { lastLogin: lastLogin, token: token } });
        logger.info(`<========  userDetails  ========>, ${userDetails}`);
        return res.status(200).send({
          success: true,
          message: 'User details fetched successfully',
          data: userDetails
        });

      } else {
        let msg = ""
        if (user.loginAttemptTime) {
          let date: any = new Date()
          var diff = (date - user.loginAttemptTime) / 300000;
          if (diff < 1) {
            msg = "You have exceeded maximum login attempts. Please try after five minutes"
          } else {
            const updateUser = {
              $set: { loginAttemptCount: 1, },
              $unset: {

                loginAttemptTime: new Date()
              }
            };
            const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
          }
        }
        else {
          if (!user.loginAttemptCount || user.loginAttemptCount < 1) {
            const updateUser = {
              loginAttemptCount: user.loginAttemptCount ? user.loginAttemptCount + 1 : 1
            };
            const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
          } else {
            const updateUser = {
              loginAttemptCount: user.loginAttemptCount ? user.loginAttemptCount + 1 : 1,
              loginAttemptTime: new Date()
            };
            msg = "You have exceeded maximum login attempts. Please try after five minutes"
            const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
          }
        }
        logger.error(`msg -${userNameOrEmail}`);
        return res.status(401).send({
          success: false,
          message: msg == "" ? "Username/password incorrect" : msg,
          data: {}
        });
      }
    } else {
      let msg = ""
      if (user.loginAttemptTime) {
        let date: any = new Date()
        var diff = (date - user.loginAttemptTime) / 300000;
        if (diff < 1) {
          msg = "You have exceeded maximum login attempts. Please try after five minutes"
        } else {
          const updateUser = {
            $set: { loginAttemptCount: 1, },
            $unset: {
              loginAttemptTime: new Date()
            }
          };
          const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
        }
      }
      else {
        if (!user.loginAttemptCount || user.loginAttemptCount < 1) {
          const updateUser = {
            loginAttemptCount: user.loginAttemptCount ? user.loginAttemptCount + 1 : 1
          };
          const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
        } else {
          const updateUser = {
            loginAttemptCount: user.loginAttemptCount ? user.loginAttemptCount + 1 : 1,
            loginAttemptTime: new Date()
          };
          msg = "You have exceeded maximum login attempts. Please try after five minutes"
          const result = await DepartmentUsers.findOneAndUpdate({ _id: user._id }, updateUser);
        }
      }
      return res.status(401).send({
        success: false,
        message: msg == "" ? 'Username/password incorrect' : msg,
        data: {}
      });
    }
  } catch (error) {
    logger.error(`error- ${error}`);
    return res.status(401).send({
      success: false,
      message: "Unable to login. Please try again",
      data: {}
    });

  }

}

export const Logout = async (req: Request, res: Response) => {
  try {
    const result = await _clearToken(userSession?._id, userSession?.userType == "user" ? true : false)
    logger.info(`<========  Logout  ========>, ${result}`);
    return res.status(200).send({
      success: true,
      message: 'User loggedout successfully',
      data: {}
    });
  }
  catch (error) {
    logger.error(`error- ${error}`);
    return res.status(401).send({
      success: false,
      message: "Unable to logout. Please try again",
      data: {}
    });

  }
}
export const changePassword = async (req: Request, res: Response) => {

  const bytes = CryptoJS.AES.decrypt(req.body.password, process.env.SECRET_KEY);
  var otpData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const password = otpData.password
  const oldPassword = otpData.oldPassword
  if (oldPassword == password) {
    return res.status(400).send({
      success: false,
      message: "Old Password and New Password should not be same",
      data: {}
    });
  }

  try {

    let user: any = await DepartmentUsers.findOne({
      $or: [
        { _id: userSession._id }
      ],
      $and: [{ role: { $in: ['DLF', 'DR'] } }]
    });

    console.log("<==========  user  ==========>", user);
    logger.info(`<========  user  ========>, ${user}`);

    if (!user) {
      return res.status(401).send({
        success: false,
        message: 'Username/password incorrect',
        data: {}
      });
    }
    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (isMatch) {

      const salt = bcrypt.genSaltSync(12);
      const newPassword = bcrypt.hashSync(password, salt);

      const updateUser = {
        password: newPassword,
        isPasswordChanged: true
      };
      const result = await DepartmentUsers.findOneAndUpdate({ _id: userSession._id }, updateUser);
      logger.info(`<========  Change Password  ========>, ${result}`);

      return res.status(200).send({
        success: true,
        message: 'User password changed successfully',
        data: {}
      });

    } else {
      return res.status(401).send({
        success: false,
        message: 'Old Password is incorrect',
        data: {}
      });
    }
  } catch (error) {
    logger.error(`error- ${error}`);
    return res.status(401).send({
      success: false,
      message: "Unable to update. Please try again",
      data: {}
    });

  }

}

export const getRefreshToken = async (req: Request, res: Response) => {
  try {

    const token = await generateJWTToken(userSession);

    if (token) {
      res.status(200).send({
        status: true,
        message: 'Success',
        code: 200,
        data: { token: token }
      })
    }
    else {
      res.status(403).send({
        status: false,
        message: 'Unable to get the refresh token',
        code: 403,
        data: {}
      })
    }
  } catch (error) {
    logger.error(`error- ${error}`);
    res.status(401).send({
      status: false,
      message: "Session Expired",
      data: {}
    });
  }
}

export const resetUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const users = await User.findOne({ email: email, password: password });
    if (!users) {
      return res.status(404).json({ email: 'Email not found' });
    }
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) throw err;
        users.password = hash;
        users
          .save()
          .then((users: any) => res.json(users))
          .catch((err: any) => console.log(err));
      });
    });
  } catch (error) {
    logger.error(`error- ${error}`);
    res.status(201).json({ error });
  }

};


export * as AuthController from './AuthController';