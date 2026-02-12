import { body, query, param, check, validationResult } from 'express-validator'
import express, { Request, Response, NextFunction } from 'express';

export const validateFirmName = () => {
    return [
        body('firmName').notEmpty().withMessage('Firm Name is not allowed to be empty').isLength({ max: 200 }).withMessage('Firm Name must not exceed 200 characters').custom(async value=>{
            if (value !== value.trim()) {
                    throw new Error('Firm Name should not start or end with spaces');
                }
                if (value.length === 0) {
                    throw new Error('Firm Name must contain at least 1 character');
                }
        }),
        body('district').notEmpty().withMessage('District is not allowed to be empty').custom(async value=>{
            const reg: any = /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/gmi;
            if(!reg.test(value)){
                throw new Error('district name format is invalid');
            }
        }),
        checkErrors,
    ]
}

export const validateRegistrationName = () => {
    return [
        body('registrationName').notEmpty().withMessage('registrationName is not allowed to be empty').custom(async value=>{
             if (value !== value.trim()) {
                    throw new Error('Firm Name should not start or end with spaces');
                }
                if (value.length === 0) {
                    throw new Error('Firm Name must contain at least 1 character');
                }
        }),
        checkErrors,
    ]
}

export const validateSocietyName = () => {
    return [
        body('societyName').notEmpty().withMessage('Firm Name is not allowed to be empty'),
        body('district').notEmpty().withMessage('District is not allowed to be empty'),
        checkErrors,
    ]
}

export const validateSMS = () => {
    return [
        body('message').notEmpty().withMessage('Message is not allowed to be empty'),
        checkErrors,
    ]
}

export const validateCreateNewFirm = () => {
    return [
        body('firmName').notEmpty().withMessage('Firm Name is not allowed to be empty').custom(async value=>{
           if (value !== value.trim()) {
                    throw new Error('registrationName should not start or end with spaces');
                }
                if (value.length === 0) {
                    throw new Error('registrationName must contain at least 1 character');
                }
        }),
        body('district').notEmpty().withMessage('District is not allowed to be empty').custom(async value=>{
            const reg: any = /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/gmi;
            if(!reg.test(value)){
                throw new Error('district name format is invalid');
            }
        }),
        body('firstName').notEmpty().withMessage('First Name is not allowed to be empty').custom(async value=>{
            const reg: any = /^[A-Za-z\s]*$/;
            if(!reg.test(value)){
                throw new Error('firstName format is invalid');
            }
        }),
        body('lastName').notEmpty().withMessage('Last Name is not allowed to be empty').custom(async value=>{
            const reg: any = /^[A-Za-z\s]*$/;
            if(!reg.test(value)){
                throw new Error('lastName format is invalid');
            }
        }),
        body('email').notEmpty().withMessage('Email is not allowed to be empty').isEmail().withMessage('email format is invalid'),
        body('alternateEmail').notEmpty().withMessage('Alternate Email is not allowed to be empty').isEmail().withMessage('alternateEmail format is invalid'),
        body('mobileNumber').notEmpty().withMessage('Mobile Number is not allowed to be empty').custom(async value=>{
            const reg: any = /^\d{10}$/;
            if(!reg.test(value)){
                throw new Error('mobileNumber format is invalid');
            }
        }),
        body('aadharNumber').notEmpty().withMessage('Aadhar Number is not allowed to be empty'),
        body('registrationType').notEmpty().withMessage('Registration Type is not allowed to be empty').custom(async value=>{
            const reg: any = /^[A-Za-z]+$/;
            if(!reg.test(value)){
                throw new Error('registrationType format is invalid');
            }
        }),
        checkErrors,
    ]
}

export const validateCreateNewSociety = () => {
    return [
        body('societyName').notEmpty().withMessage('Society Name is not allowed to be empty'),
        body('district').notEmpty().withMessage('District is not allowed to be empty'),
        body('firstName').notEmpty().withMessage('First Name is not allowed to be empty'),
        body('lastName').notEmpty().withMessage('Last Name is not allowed to be empty'),
        body('email').notEmpty().withMessage('Email is not allowed to be empty'),
        body('alternateEmail').notEmpty().withMessage('Alternate Email is not allowed to be empty'),
        body('mobileNumber').notEmpty().withMessage('Mobile Number is not allowed to be empty'),
        body('aadharNumber').notEmpty().withMessage('Aadhar Number is not allowed to be empty'),
        body('registrationType').notEmpty().withMessage('Registration Type is not allowed to be empty'),
        checkErrors,
    ]
}
export const validateCreateFirm = () => {
    return [
        body('applicantDetails').notEmpty().withMessage('Applicant Details are not allowed to be empty'),
        body('firmPartners').notEmpty().withMessage('Address Details are not allowed to be empty'),
        body('contactDetails').notEmpty().withMessage('Contact Details are not allowed to be empty'),
        body('partnerDetails').notEmpty().withMessage('Partner Details not allowed to be empty'),
        body('processingHistory').notEmpty().withMessage('Processing History is not allowed to be empty'),
        body('documentAttached').notEmpty().withMessage('DocumentAttached not allowed to be empty'),
        body('principalPlaceBusiness').notEmpty().withMessage('Principal Place Business are not allowed to be empty'),
        checkErrors,
    ]
}

export const validateLogin = () => {
    return [
        body('aadharNumber').notEmpty().withMessage('Aadhar Number is not allowed to be empty'),
        //body('password').notEmpty().withMessage('Password is not allowed to be empty'),
        checkErrors,
    ]
}

export const validatedepartmentLogin = () => {
    return [
        body('userNameOrEmail').notEmpty().withMessage('User Id is not allowed to be empty'),
        body('password').notEmpty().withMessage('Password is not allowed to be empty'),
        checkErrors,
    ]
}

export const validateDepartmentChangePassword = () => {
    return [
        body('password').notEmpty().withMessage('Old Password is not allowed to be empty'),
        checkErrors,
    ]
}

export const validateCheckUser = () => {
    return [
        body('email').notEmpty().withMessage('email is not allowed to be empty').isEmail().withMessage('email format is invalid'),
        body('aadharNumber').notEmpty().withMessage('Aadhar Number is not allowed to be empty'),
        checkErrors,
    ]
}

export const validateVerifyOTP = () => {
    return [
        body('aadharNumber').notEmpty().withMessage('Aadhaar Number is not allowed to be empty'),
        body('transactionNumber').notEmpty().withMessage('Transaction Number is not allowed to be empty'),
        body('otp').notEmpty().withMessage('OTP is not allowed to be empty'),
        checkErrors,
    ]
}

export const validatecheckUserAadhar = () => {
    return [
        body('aadharNumber').notEmpty().withMessage('Aadhar Number is not allowed to be empty'),
        checkErrors,
    ]
}

export const checkErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)

    if (errors.isEmpty()) {
        return next()
    }

    return res.status(400).send({
        success: false,
        message: errors.array()[0].msg,
        data: {}
    });
}

