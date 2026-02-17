import express, { Request, Response } from 'express';
import { _updateFirmByAPP, _getFirmDate, _getFirmsAppNumber, _getAmendFirm, _getmisReport, _getFirmsLegacyApp, _getFirmsLegacyName, _createFirm, _processingHistoryUpdate, fetchRtgsDataReport, _getFirmData, _getFirmsName } from '../../services/FirmsService';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import moment from 'moment';
const multer = require('multer')
import mongoose, { Types } from 'mongoose';
import { createUser, _getAadharNumberByUUID, _getUUIDByAadharNumber } from '../../services/UserService';
import { logger } from '../../logger';
import path from 'path';
import { userSession } from '../middleware/auth';
import { Firm  } from '../../models/index';
import { getDocs, appNumber } from '../../utils/functions';
var CryptoJS = require("crypto-js");
const fs = require('fs');
const Path = require('path');
const axios = require('axios');
const https = require('https');
const util = require('util');
const { PDFDocument } = require("pdf-lib");
import postgresDao from '../../config/psSqlDao';
import { PaymentsInformation } from '../../models/index'


const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

export const industLogin = async (req: Request, res: Response) => {
    const { username, password } = req.body;  
    logger.info(`<======== industLogin - { username } ========>, ${util.inspect(username, { depth: null, colors: false })})`);
    logger.info(`<======== industLogin - { password } ========>, ${util.inspect(password, { depth: null, colors: false })})`);
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }    
    const SECRET_KEY = process.env.INDUST_SECRET_KEY;
    logger.info(`<======== industLogin - SECRET_KEY ========>, ${util.inspect(SECRET_KEY, { depth: null, colors: false })})`);
    const USERNAME = process.env.INDUST_USERNAME;
    logger.info(`<======== industLogin - USERNAME ========>, ${util.inspect(USERNAME, { depth: null, colors: false })})`);
    const PASSWORD = process.env.INDUST_PASSWORD;
    logger.info(`<======== industLogin - PASSWORD ========>, ${util.inspect(PASSWORD, { depth: null, colors: false })})`);

    if (!SECRET_KEY || !USERNAME || !PASSWORD) {        
        return res.status(500).json({ message: "Internal server error" });
      }          
    if (username === USERNAME && password === PASSWORD) {      
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
      logger.info(`<======== industLogin - token ========>, ${token}`);
        return res.json({ token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
};

export const dateFetchData = async (req: Request, res: Response) => {
    try {
        const { fromDate, toDate } = req.query;
        const output = await _getFirmDate(fromDate as string, toDate as string);
        return res.status(200).send({
            message: 'Firms Details Fetched Successfully',
            success: true,
            data: {
                output
            }
        });

    } catch (error) {
        logger.error(`dateFetchData- ${error}`);
        return res.status(500).send({ 
            message: "Failed", 
            success: false, 
            data: {} 
        });
    }
}

export const amendmentFirmDetails = async (req: Request, res: Response) => {
    try {
        const { fromDate, toDate } = req.query;
        const output = await _getAmendFirm(fromDate as string, toDate as string);
        // console.log("Fetched Data: ", output);
        if (!output || output.length === 0) {
            return res.status(404).send({
                message: "No Firms Found",
                success: false,
                data: {},
            });
        }

        let firmDetailsWithFiles = [];
        for (const firm of output) {
            const applicationNumber = firm?.applicationNumber;
            if (!applicationNumber) continue;

            const firmData = await getFirmDetails(applicationNumber);
            if (!firmData) continue;            
            let fileName = "";
            if (firmData.status === "Approved") {
                fileName = "signedApprovedFirmsDocument.pdf";
            } else if (firmData.status === "Rejected") {
                fileName = "signedRejectedFirmsDocument.pdf";
            } else {
                console.log(`Skipping Application ID: ${applicationNumber} - Status: ${firmData.status}`);
                continue;
            }
            const filePath = Path.join(process.env.FILE_DIR_PATH, `pdfs/uploads/firms/${applicationNumber}/`, fileName);
            let base64File = null;

            try {
                if (fs.existsSync(filePath)) {
                    base64File = fs.readFileSync(filePath, { encoding: "base64" });
                    console.log(`File found: ${filePath}`);
                } else {
                    logger.info(`<======== amendmentFirmDetails - File not found for Application ID: ${applicationNumber}`);
                    console.log(`File not found for Application ID: ${applicationNumber}`);
                }
            } catch (err) {
                logger.info(`Error reading file for Application ID: ${applicationNumber}: `, err);
                continue;
            }

            firmDetailsWithFiles.push({
                ...firm,
                files: base64File ? [{ fileName, base64file: base64File }] : []
            });
        }

        return res.status(200).send({
            message: "Firms Details Fetched Successfully",
            success: true,
            data: firmDetailsWithFiles,
        });
    } catch (error) {
        logger.info(`amendmentFirmDetails Error - ${error}`);
        return res.status(500).send({
            message: "Failed",
            success: false,
            data: {}
        });
    }
};

const getFirmDetails = async (applicationNumber: string) => {
    try {
        let firm: any = await _getFirmsAppNumber(applicationNumber);
        if (!firm) {
            throw new Error(`Firm details are not found for ${applicationNumber}`);
        }

        let applicantDetails = firm.applicantDetails;
        let firmPartners = firm.firmPartners;

        return firm;
    } catch (error) {
        logger.error(`error- ${error}`);
        throw error;
    }
};


export const misReport = async (req: Request, res: Response) => {
    try {
        const requiredParams:any = {
            fromDate: 'string',
            toDate: 'string',
        }
        for(let key in requiredParams){
            if(!req.query[key] || typeof req.query[key] !== requiredParams[key]){
                return res.status(400).send({
                    status: false,
                    message: `Missing required parameter: ${key}`
                });
            }
            requiredParams[key] = req.query[key];
        }

        const startDate = new Date(requiredParams.fromDate);
        const endDate = new Date(requiredParams.toDate);
        const currentDate = new Date();

        if(!(moment(requiredParams.fromDate, "YYYY-MM-DD", true).isValid()) || !(moment(requiredParams.toDate, "YYYY-MM-DD", true).isValid())) {
            return res.status(400).send({
                status: false,
                message: "Invalid date format"
            })
        }
    
        if (endDate < startDate || endDate > currentDate) {
            return res.status(400).send({
                status: false,
                message: "Invalid date range: toDate must be greater than or equal to fromDate"
            });
        }
        const output = await _getmisReport(requiredParams.fromDate as string, requiredParams.toDate as string);
        return res.status(200).send({
            message: 'Data Fetched Successfully',
            success: true,
            data: {
                output
            }
        });

    } catch (error) {
        logger.error(`misReport- ${error}`);
        return res.status(500).send({ 
            message: "Failed", 
            success: false, 
            data: {} 
        });
    }
}

export const getLegacyFirmDetails = async (req: Request, res: Response) => {
    try {
        let district = userSession.district;        
        let { type, identifier,isLegacyData } = req.params;        
        if (identifier) {
            identifier = Buffer.from(identifier, 'base64').toString();
        }
        let firm: any;
        if (type === "application") {
            firm = await _getFirmsLegacyApp(identifier ,  'Y', district);
        } else if (type === "firmName") {
            firm = await _getFirmsLegacyName(identifier , 'Y', district);
        } else {
            return res.status(400).json({ error: "Invalid type. Use 'application' or 'firmName'." });
        }

        if (!firm) {
            return res.status(404).json({ error: `Firm details not found for ${identifier}` });
        }

        return res.status(200).json(firm);
    } catch (error) {
        logger.error(`Error fetching firm details: ${error}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const FirmLegacyDataEntry = async (req: Request, res: Response) => {
    try {

        const reqBodyUser: any = {
            registrationType: 'firm',
            firmName: req.body.firmName,
            district: req.body.district,
            email: req.body.contactDetails.email,
            aadharNumber: req.body.applicantDetails.aadharNumber,
            lastName: "",
            firstName: req.body.applicantDetails.name,
            alternateEmail: req.body.contactDetails.email,
            mobileNumber: req.body.contactDetails.mobileNumber
        }

        let user = await createUser(reqBodyUser);

        if (user?._id) {
            const existingFirm = await Firm.findOne({ firmName: req.body.firmName , district: req.body.district });
            
            const applicationNumber = 'FRA' + Date.now() + ((Math.random() * 100000).toFixed());
            let registrationNumber: any = 1;
            let registrationYear = req.body.registrationYear;

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const attachments = getDocs(files);
    
            if (attachments.length < 3) {
                return res.status(500).send({ message: `Please upload valid file attachment or only PDF type should be accepted`, success: false, data: {} });
            }        
            const uploadPathBase = `${process.env.FILE_DIR_PATH}uploads/${user?._id}/`;
            attachments.forEach((x: any) => { x.destination = uploadPathBase; x.path = `${uploadPathBase}${x.originalname}` });

            if (!existingFirm) {
                const firmData: any = await Firm.findOne({ registrationYear: registrationYear, district: userSession.district }, { registrationNumber: 1 }).sort({ registrationNumber: -1 });
                if (firmData && firmData.registrationNumber > 0 && firmData.registrationYear == registrationYear && firmData.district == userSession.district) {
                    registrationNumber = firmData.registrationNumber + 1;
                }
                const reqBodyFirm = { ...req.body, userId: user._id, applicationNumber, registrationNumber, paymentStatus: true, approvedRejectedById: userSession._id, deptUpdatedBy: userSession._id, documentAttached: attachments };
                const firm = await _createFirm(reqBodyFirm);
                if (firm) {
                    const remarksData = { designation: userSession.userName, status: req.body.status, remarks: "", attachements: [], applicationTakenDate: req.body.applicationProcessedDate, applicationProcessedDate: req.body.applicationProcessedDate, };
                    await _processingHistoryUpdate(firm._id, userSession._id, remarksData);
                    return res.status(200).send({
                        success: true,
                        message: 'Firm created successfully',
                        data: firm
                    });
                }
            } else {                
                const updatedFirm = await Firm.findByIdAndUpdate(
                    existingFirm._id,
                    {
                        $set: { ...req.body, userId: user._id, paymentStatus: true, deptUpdatedBy: userSession._id, documentAttached: attachments , isLegacyDataUpdate : true }
                    },
                    { new: true }
                );
                if (updatedFirm) {
                    const remarksData = { designation: userSession.userName, status: req.body.status, remarks: "", attachements: [], applicationTakenDate: req.body.applicationProcessedDate, applicationProcessedDate: req.body.applicationProcessedDate, };
                    await _processingHistoryUpdate(updatedFirm._id, userSession._id, remarksData);
                    return res.status(200).send({
                        success: true,
                        message: 'Firm updated successfully',
                        data: updatedFirm
                    });
                }
            }
            return res.status(200).send({
                success: false,
                message: 'Internal error while saving firm data',
                data: {}
            });
        }
    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error || error, success: false, data: {} });
    }
}

export const getRtgsReport  = async (req: Request, res: Response) => {
    try {
        const requiredParams:any = {
            fromDate: 'string',
            toDate: 'string',
        }
        for(let key in requiredParams){
            if(!req.query[key] || typeof req.query[key] !== requiredParams[key]){
                return res.status(400).send({
                    status: false,
                    message: `Missing required parameter: ${key}`
                });
            }
            requiredParams[key] = req.query[key];
        }

        const startDate = new Date(requiredParams.fromDate);
        const endDate = new Date(requiredParams.toDate);
        const currentDate = new Date();

        if(!(moment(requiredParams.fromDate, "YYYY-MM-DD", true).isValid()) || !(moment(requiredParams.toDate, "YYYY-MM-DD", true).isValid())) {
            return res.status(400).send({
                status: false,
                message: "Invalid date format"
            })
        }
    
        if (endDate < startDate || endDate > currentDate) {
            return res.status(400).send({
                status: false,
                message: "Invalid date range: toDate must be greater than or equal to fromDate"
            });
        }
        const output = await fetchRtgsDataReport(requiredParams.fromDate as string, requiredParams.toDate as string);
        return res.status(200).send({
            message: 'Data Fetched Successfully',
            success: true,
            data: {
                output
            }
        });

    } catch (error) {
        logger.error(`misReport- ${error}`);
        return res.status(500).send({ 
            message: "Failed", 
            success: false, 
            data: {} 
        });
    }
}


export const getFirmDetail = async (req: Request, res: Response) => {
    try {
        const registrationNumber = req.query.registrationNumber as string;
        const registrationYear = req.query.registrationYear as string;
        const district = req.query.district as string;
        if (!registrationNumber || !registrationYear) {
            return res.status(400).json({ message: "registrationNumber and registrationYear are required" });
        }
        const currentYear = new Date().getFullYear();
        console.log("currentYear:::::::",currentYear)
        let year  = parseInt(registrationYear)
        if (isNaN(year) || year > currentYear) {
            return res.status(400).json({
                status: false,
                message: "Please enter a valid registration year"
            });
        }
        let firm = await _getFirmData(registrationNumber, registrationYear,district);
        if (!firm || (Array.isArray(firm) && firm.length == 0)) {
            return res.status(404).json({
                status: false,
                message: `No Data Found for ${registrationNumber} and ${registrationYear}`,
            });
        }
        if (!firm) {
            return res.status(400).json({
                status: false,
                message: `Already The Legacy data was updated for ${registrationNumber} and ${registrationYear} of a Firm in ${district}`,
            });                        
        }
        return res.status(200).json(firm);

    } catch (error) {
        logger.info(`error- ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const firmUserLegacyData = async (req: Request, res: Response) => {
    try {
        const { firmName, district,registrationYear, registrationNumber, status, applicationProcessedDate, applicantDetails,contactDetails = {}  } = req.body;
        
        if (!applicantDetails.name || !applicantDetails.aadharNumber) {
            return res.status(400).send({
                message: 'Missing applicant details.',
                success: false,
                data: {}
            });
        }
        
        if (!firmName || !district || !registrationYear || !status || !applicationProcessedDate) {
            return res.status(400).send({
                message: 'Missing required fields: firmName, district, registrationYear, status, or applicationProcessedDate.',
                success: false,
                data: {}
            });
        }

        if (applicantDetails?.aadharNumber && applicantDetails.aadharNumber.trim() !== '') {
            const resp = await _getUUIDByAadharNumber(applicantDetails.aadharNumber.toString());
            if (resp?.data?.status === "Success" && resp.data.UUID) {
                applicantDetails.aadharNumber = resp.data.UUID;
            } else {
                return res.status(500).send({
                    message: 'Aadhaar service is not working. Please try after sometime (Applicant)',
                    success: false,
                    data: {}
                });
            }
        }
        
        const reqBodyUser: any = {
            registrationType: 'firm',
            firmName,
            district,
            email: contactDetails.email,
            aadharNumber: applicantDetails.aadharNumber,
            lastName: "",
            firstName: applicantDetails.name,
            alternateEmail: applicantDetails.email,
            mobileNumber: applicantDetails.mobileNumber
        };
        
        const user = await createUser(reqBodyUser);
        if (!user?._id) {
            return res.status(500).send({
                success: false,
                message: 'User creation failed',
                data: {}
            });
        }
        
        const existingFirm: any = await Firm.findOne({ firmName });
        console.log("existingFirm::::::::::",existingFirm)     

        const applicationNumber = existingFirm?.applicationNumber ||  'FRA' + Date.now() + Math.floor(Math.random() * 100000);        

        const paymentPayload = [{
            applicationNumber,
            departmentTransID: `${applicationNumber}_${Date.now() + Math.floor(Math.random() * 100000)}`,
            cfmsTransID: '',
            transactionStatus: 'SUCCESS',
            amount: 0,
            totalAmount: 0,
            paymentMode: 'ONLINE',
            bankTransID: '',
            bankTimeStamp: new Date(),
            isUtilized: true,
            createdAt: new Date()
        }];        

        await PaymentsInformation.create(paymentPayload)

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const attachments = getDocs(files);
        if (!attachments || attachments.length < 3) {
            return res.status(400).send({
                message: 'Please upload at least 3 valid PDF attachments.',
                success: false,
                data: {}
            });
        }

        const uploadPathBase = process.env.FILE_DIR_PATH + `uploads/${existingFirm?._id?.toString()}`
        if (!fs.existsSync(uploadPathBase)) {
            fs.mkdirSync(uploadPathBase, { recursive: true });
        }
        attachments.forEach((file: any) => {
            const newFilePath = path.join(uploadPathBase, file.originalname);
            try {
                if (fs.existsSync(file.path)) {
                    fs.renameSync(file.path, newFilePath);
                }
            } catch (err) {
                console.error(`File move failed for ${file.originalname}: ${err}`);
            }
            file.destination = uploadPathBase;
            file.path = newFilePath;
        });

        let firmPartners = req.body.firmPartners || [];
        if (Array.isArray(firmPartners) && firmPartners.length > 0) {
            for await (let member of firmPartners) {
                if (member.aadharNumber && member.aadharNumber.trim() !== '') {
                    const resp = await _getUUIDByAadharNumber(member.aadharNumber.toString());
                    // console.log("Member Aadhaar → UUID response:", resp);
                    if (resp?.data?.status === "Success" && resp.data.UUID) {
                        member.aadharNumber = resp.data.UUID;
                    } else {
                        return res.status(500).send({
                            message: `Aadhaar service is not working for member ${member.name || ''}. Please try after sometime.`,
                            success: false,
                            data: {}
                        });
                    }
                }
            }
        }
        
        req.body.applicantDetails = applicantDetails;
        req.body.firmPartners = firmPartners;
        
        if (existingFirm) {
             const updatedFirm: any = await Firm.findByIdAndUpdate(
                existingFirm._id,
                {
                    $set: { 
                        ...req.body,
                        userId: user._id, 
                        paymentStatus: true, 
                        documentAttached: attachments, 
                        isLegacyDataUpdate: true,
                        status,
                        applicationProcessedDate,
                        isLegacyData: 'Y',
                        paymentDetails: paymentPayload
                    }
                },
                { new: true }
            );            
            if (updatedFirm) {
                const remarksData = { 
                    designation: user._id,
                    status, 
                    remarks: "Legacy data updated", 
                    attachements: [], 
                    applicationTakenDate: applicationProcessedDate, 
                    applicationProcessedDate 
                };
                await _processingHistoryUpdate(updatedFirm._id, user._id, remarksData);
                return res.status(200).send({
                    success: true,
                    message: 'Firm updated successfully',
                    data: updatedFirm
                });
            }

            return res.status(500).send({
                success: false,
                message: 'Failed to update existing firm',
                data: {}
            });
        }        
        let finalRegistrationNumber = registrationNumber;

        if (!finalRegistrationNumber) {
            const lastSociety: any = await Firm.findOne(
                { registrationYear, district },
                { registrationNumber: 1 }
            ).sort({ registrationNumber: -1 });

            finalRegistrationNumber = 1;
            if (lastSociety && lastSociety.registrationNumber > 0) {
                finalRegistrationNumber = lastSociety.registrationNumber + 1;
            }
        }
        
        const reqBodyFirm = { 
            ...req.body, 
            userId: user._id, 
            applicationNumber,
            registrationNumber: finalRegistrationNumber, 
            paymentStatus: true,
            approvedRejectedById: user._id,
            documentAttached: attachments,
            status,
            applicationProcessedDate,            
            isLegacyDataUpdate: true,
            isLegacyData: 'Y',
            paymentDetails: paymentPayload
        };
     
        const firm: any = await _createFirm(reqBodyFirm);
        if (firm) {
            const remarksData = {
                designation: user._id,
                status, 
                remarks: "Legacy data entry",
                attachements: [],
                applicationTakenDate: applicationProcessedDate,
                applicationProcessedDate
            };
            await _processingHistoryUpdate(firm._id, user._id, remarksData);

            return res.status(200).send({
                success: true,
                message: 'Firm created successfully',
                data: firm
            });
        }

        return res.status(500).send({
            success: false,
            message: 'Failed to create new firm',
            data: {}
        });

    } catch (error: any) {
        logger.info(`FirmLegacyDataEntry error: ${error.message}`, error);
        return res.status(500).send({
            message: error?.message || 'Unexpected Error',
            success: false,
            data: {}
        });
    }
};

export const getFirmsName = async (req: Request, res: Response) => {  
  try {    
    let { firmName } = req.params;
    if (firmName) {
        firmName = Buffer.from(firmName, 'base64').toString();
    }
    let firm = await _getFirmsName(firmName);
    if (!firm) {
      return res.status(404).json({ message: `Firm details are not found for ${firmName}` });
    }
    return res.status(200).json(firm);
  } catch (error) {
    logger.error(`error- ${error}`);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getPostgresDataFetch = async (req: Request, res: Response) => {
    try {        
        const query = `SELECT   frd.id, frd.uid_aadhar, frd.citizen_reg_num, frd.unique_application_num, frd.applicant_name,    frd.firm_name,    frd.registration_dist_id,    frd.other_address_id,
                        frd.address_id,    frd.contact_details_id,    frd.date_of_dissolution,    frd.created_by,    frd.created_ts,    frd.lastmodified_by,    frd.lastmodified_ts,
                        frd.version,    frd.firm_start_date,    frd.firm_end_date,    frd.applicant_info_id,    frd.firm_registration_no,    frd.service_request_id,    frd.status,    frd.principal_doorno,    
                        frd.principal_street,    frd.principal_city,    frd.principal_district,    frd.principal_state,    frd.principal_pincode,    frd.submissionts,    frd.apprequestno,    frd.servicerequesttype,
                        frd.department,    frd.service_status,    frd.paymentamount,    frd.reg_year,    frd.firm_district_name,    frd.oldfirmname,    frd.district,    frd.nature_of_business_type,    frd.firm_principal_location,
                        frd.firm_address_1,    frd.firm_address_2,    frd.firm_mandal_name,    frd.firm_mandal_id,    frd.duration_of_the_firm,    frd.no_of_branches,    frd.dissolved_date,    frd.business_type,    frd.premisses_type,
                        frd.principal_mandal,    frd.insert_date,    frd.approved_rejected_date,    frd.principal_address_id,    frd.firm_taluk_name,    frd.applied_by,    frd.legacy,    frd.country,    frd.principal_nri_address,    
                        frd.pdf_status,    frd.dup_status,    frd.igrs_district,    frd.missing_documents,    frd.cjd_status,    frd.old_dist_name,    frd.doc_path,    ai.district_name,    ai.firm_reg_no,    ai.reg_year  AS applicant_reg_year,
                        ai.application_id,    ai.applicant_first_name,    ai.applicant_middle_name,    ai.applicant_last_name,    ai.applicant_gender,    ai.applicant_doorno,    ai.applicant_street,    ai.applicant_city,    ai.applicant_district,   
                        ai.applicant_state,    ai.applicant_pincode,    ai.applicant_mobilenumber,    ai.applicant_landlinenumber,    ai.applicant_fax,    ai.applicant_emailid,    ai.applicant_relation,    ai.society_reg_no,    ai.aaadhar_id,    
                        ai.unique_application_id AS applicant_unique_application_id,    ai.firm_society_reg_district_name,    ai.applicant_address_id,    ai.applicant_country,    ai.applicant_mandal,    ai.applicant_nri_address,    ai.old_dist_name
                        AS applicant_old_dist_name,    oa.unique_application_id       AS oa_unique_application_id,    oa.firm_registration_no       AS oa_firm_registration_no,    oa.other_city,    oa.other_state,    oa.other_district,    oa.other_pincode,    
                        oa.other_doorno,    oa.other_street,    oa.other_mandal,    oa.other_address_id,    oa.firm_branch_reg_id,    oa.branch_reg_date,    oa.branch_taluk_name,    oa.applied_by   AS oa_applied_by,    oa.station  AS oa_station,    
                        oa.date1,    oa.dro_office,    oa.reg_year AS oa_reg_year,    oa.legacy  AS oa_legacy,  oa.country  AS oa_country,    oa.nri_address,    oa.other_state_address,    oa.old_dist_name   AS oa_old_dist_name,    
                        coalesce(p.partners, '[]')  AS partnersfrom PUBLIC.igrs_firm_registration_details frdleft join ( SELECT DISTINCT ON (firm_reg_no, reg_year, firm_society_reg_district_name)  *  FROM PUBLIC.igrs_applicant_info ORDER BY firm_reg_no, reg_year, firm_society_reg_district_name) ai    
                        ON frd.firm_registration_no = ai.firm_reg_no   AND frd.district = ai.firm_society_reg_district_name   AND frd.reg_year = ai.reg_yearleft join PUBLIC.igrs_other_address oa    ON oa.unique_application_id = frd.unique_application_numleft join lateral ( SELECT json_agg(ipd.*) AS partners    FROM PUBLIC.igrs_partner_details ipd   
                        WHERE ipd.firm_registration_id = frd.firm_registration_no  AND ipd.firm_society_reg_district_name = frd.district  AND ipd.firm_reg_year = frd.reg_year ) p ON TRUE  
                        WHERE frd.insert_date >= $1 AND frd.insert_date < $2;`;
        const result = await postgresDao.executeQuery(query);

        return res.status(200).json({
            count: result.length,
            data: result
        });

    } catch (err) {
        console.log("Errorrr", err)
    }
}

export const savePostgresData = async () => {
    try {
        let startDate = moment(process.env.START_DATE, 'YYYY-MM-DD').startOf('month');
        const today = moment().startOf('month');

        let totalProcessed = 0;
        let totalInserted = 0;
        let totalErrors = 0;

        logger.info(`Starting migration from ${startDate.format('YYYY-MM-DD')}`);

        while (startDate.isBefore(today)) {
            const monthStart = startDate.clone().startOf('month');
            const monthEnd = startDate.clone().endOf('month');

            logger.info(
                `Processing month: ${monthStart.format('YYYY-MM-DD')} → ${monthEnd.format('YYYY-MM-DD')}`
            );

            let windowStart = monthStart.clone();

            while (windowStart.isBefore(monthEnd)) {
                const windowEnd = moment.min(
                    windowStart.clone().add(10, 'day'),
                    monthEnd.clone().add(1, 'day')
                );

                const startDateStr = windowStart.format('YYYY-MM-DD');
                const endDateStr = windowEnd.format('YYYY-MM-DD');

                logger.info(`Processing range: ${startDateStr} → ${endDateStr}`);
                const query = `SELECT frd.id, frd.uid_aadhar, frd.citizen_reg_num, frd.unique_application_num, frd.applicant_name, frd.firm_name, frd.registration_dist_id, frd.other_address_id, frd.address_id,
                        frd.contact_details_id, frd.date_of_dissolution, frd.created_by, frd.created_ts, frd.lastmodified_by, frd.lastmodified_ts, frd.version, frd.firm_start_date, frd.firm_end_date, frd.applicant_info_id, frd.firm_registration_no, frd.service_request_id, frd.status, frd.principal_doorno, frd.principal_street,frd.principal_city, frd.principal_district, frd.principal_state,frd.principal_pincode, frd.submissionts, frd.apprequestno, frd.servicerequesttype, frd.department, frd.service_status, frd.paymentamount,
                        frd.reg_year, frd.firm_district_name, frd.oldfirmname, frd.district, frd.nature_of_business_type, frd.firm_principal_location, frd.firm_address_1, frd.firm_address_2, frd.firm_mandal_name, frd.firm_mandal_id, frd.duration_of_the_firm, frd.no_of_branches, frd.dissolved_date, frd.business_type, frd.premisses_type, frd.principal_mandal, frd.insert_date,
                        frd.approved_rejected_date, frd.principal_address_id, frd.firm_taluk_name, frd.applied_by, frd.legacy, frd.country, frd.principal_nri_address, frd.pdf_status, frd.dup_status, frd.igrs_district, frd.missing_documents, frd.cjd_status, frd.old_dist_name, frd.doc_path,

                        ai.district_name, ai.firm_reg_no, ai.reg_year AS applicant_reg_year, ai.application_id, ai.applicant_first_name, ai.applicant_middle_name, ai.applicant_last_name, ai.applicant_gender, ai.applicant_doorno, ai.applicant_street, ai.applicant_city, ai.applicant_district,
                        ai.applicant_state, ai.applicant_pincode, ai.applicant_mobilenumber, ai.applicant_landlinenumber, ai.applicant_fax, ai.applicant_emailid, ai.applicant_relation, ai.society_reg_no, ai.aaadhar_id,
                        ai.unique_application_id AS applicant_unique_application_id, ai.firm_society_reg_district_name, ai.applicant_address_id, ai.applicant_country, ai.applicant_mandal, ai.applicant_nri_address, ai.old_dist_name AS applicant_old_dist_name,

                        oa.unique_application_id AS oa_unique_application_id, oa.firm_registration_no AS oa_firm_registration_no, oa.other_city, oa.other_state, oa.other_district, oa.other_pincode, oa.other_doorno, oa.other_street, oa.other_mandal, oa.other_address_id, oa.firm_branch_reg_id, oa.branch_reg_date, oa.branch_taluk_name, oa.applied_by AS oa_applied_by, oa.station AS oa_station,
                        oa.date1, oa.dro_office, oa.reg_year AS oa_reg_year, oa.legacy AS oa_legacy, oa.country AS oa_country, oa.nri_address, oa.other_state_address,
                        oa.old_dist_name AS oa_old_dist_name,

                        COALESCE(p.partners, '[]') AS partners

                        FROM public.igrs_firm_registration_details frd

                        LEFT JOIN (
                            SELECT DISTINCT ON (firm_reg_no, reg_year, firm_society_reg_district_name) *
                            FROM public.igrs_applicant_info
                            ORDER BY firm_reg_no, reg_year, firm_society_reg_district_name
                        ) ai
                        ON frd.firm_registration_no = ai.firm_reg_no
                        AND frd.district = ai.firm_society_reg_district_name
                        AND frd.reg_year = ai.reg_year

                        LEFT JOIN public.igrs_other_address oa
                            ON oa.unique_application_id = frd.unique_application_num

                        LEFT JOIN LATERAL (
                            SELECT json_agg(ipd.*) AS partners
                            FROM public.igrs_partner_details ipd
                            WHERE ipd.firm_registration_id = frd.firm_registration_no
                            AND ipd.firm_society_reg_district_name = frd.district
                            AND ipd.firm_reg_year = frd.reg_year
                        ) p ON TRUE
                        WHERE frd.insert_date >= $1
                        AND frd.insert_date < $2;`;

                const result = await postgresDao.executeQuery(query, [
                    startDateStr,
                    endDateStr
                ]);

                if (!result?.length) {
                    logger.info('No records found for this period');
                    windowStart = windowEnd;
                    continue;
                }

                for (const row of result) {
                    try {
                        let partnersArray: any[] = [];

                        if (row.partners) {
                            try {
                                partnersArray = Array.isArray(row.partners)
                                    ? row.partners
                                    : JSON.parse(row.partners);
                            } catch {
                                partnersArray = [];
                            }
                        }

                        const firmPartners = partnersArray.map((partner: any) => {
                            return {
                                aadharNumber: partner.aadhaar_id == 'N/A' ? 0 : partner.aadhaar_id,
                                partnerName: partner.first_name || partner.partner_name || '',
                                partnerSurname: partner.last_name || '',
                                relation: partner.relation_name || '',
                                relationType: partner.relation || '',
                                role: '',
                                age: partner.age == null ? '' : partner.age || null,
                                joiningDate: toMongoDate(partner.joining_date),
                                doorNo: partner.permanent_doorno || partner.present_doorno || null,
                                street: partner.permanent_street || partner.present_street || null,
                                country: partner.permanent_country || partner.present_country,
                                state: partner.permanent_state || partner.present_state,
                                district: partner.permanent_district || partner.present_district || null,
                                mandal: partner.permanent_mandal || partner.present_mandal || null,
                                villageOrCity: partner.permanent_city || partner.present_city || null,
                                pinCode: partner.permanent_pincode || partner.present_pincode == 'N/A' ? 0 : partner.permanent_pincode || partner.present_pincode,
                                mobileNumber: '',
                                faxNumber: '',
                                email: '',
                                gender: partner.gender || '',
                                share: '',
                                status: partner.partner_status
                            };
                        });
                        
                        const firmDoc = {
                            firmName: row.firm_name,
                            applicationNumber: row.unique_application_num || row.unique_application_id || 0,
                            district: row.firm_district_name,
                            userId: new mongoose.Types.ObjectId(),
                            atWill: row.duration_of_the_firm?.trim().toUpperCase() === "AT WILL",
                            firmNameEffectDate: toMongoDate(row.firm_start_date),
                            firmDurationFrom: toMongoDate(row.firm_start_date),
                            firmDurationTo: toMongoDate(row.firm_end_date),
                            dissolveDate: toMongoDate(row.dissolved_date),
                            industryType: row.nature_of_business_type,
                            bussinessType: row.business_type,
                            registrationNumber: row.firm_reg_no || row.firm_registration_no,
                            registrationYear: row.reg_year || row.applicant_reg_year,
                            status: row.status,
                            firmStatus: row.status,
                            applicantDetails: [{
                                aadharNumber: row.aaadhar_id == 'N/A' ? '0' : row.aaadhar_id,
                                name: row.applicant_first_name + ' ' + row.applicant_last_name,
                                surName: '',
                                relation: row.applicant_relation,
                                relationType: '',
                                gender: row.applicant_gender,
                                role: '',
                                doorNo: row.applicant_doorno,
                                street: row.applicant_street,
                                district: row.applicant_district,
                                mandal: row.applicant_mandal,
                                villageOrCity: row.applicant_city,
                                pinCode: row.applicant_pincode == 'N/A' ? 0 : row.applicant_pincode,
                                country: row.applicant_country,
                                state: row.applicant_state,
                                age: null
                            }],
                            contactDetails: [{
                                landPhoneNumber: row.applicant_landlinenumber,
                                mobileNumber: row.applicant_mobilenumber,
                                faxNumner: row.applicant_fax,
                                email: row.applicant_emailid
                            }],
                            approvedRejectedById: new mongoose.Types.ObjectId(),
                            principalPlaceBusiness: [{
                                dateOfChange: null,
                                remarks: '',
                                placeParticulars: row.firm_principal_location || row.principle_address,
                                doorNo: row.principal_doorno,
                                street: row.principal_street,
                                state: row.principal_state,
                                district: row.principal_district,
                                mandal: '',
                                villageOrCity: row.principal_city,
                                pinCode: row.principal_pincode == 'N/A' ? 0 : row.principal_pincode,
                                effectiveDate: null,
                                branch: '',
                                country: '',
                                type: '',
                            }],
                            otherPlaceBusiness: [{
                                ceasingDate: null,
                                placeName: '',
                                openingDate: toMongoDate(row.branch_reg_date),
                                doorNo: row.other_doorno,
                                street: row.other_street,
                                state: row.other_state,
                                district: row.other_district,
                                mandal: row.other_mandal,
                                villageOrCity: row.other_city,
                                pinCode: row.other_pincode == 'N/A' || "null".trim() ? '0' : row.other_pincode,
                                effectiveDate: null,
                                branch: row.branch_taluk_name,
                                country: row.country,
                            }],
                            firmPartners: firmPartners.length > 0 ? firmPartners : [],
                            messageToApplicant: [],
                            processingHistory: [],
                            documentAttached: row.doc_path ? [{
                                id: '',
                                name: '',
                                size: '',
                                mimetype: '',
                                path: row.doc_path
                            }] : [],
                            paymentDetails: [],
                            deptUpdatedBy: new mongoose.Types.ObjectId(),
                            esignStatus: '',
                            esignTxnId: '',
                            historyDetails: [],
                            downloadsHistory: null,
                            firmDissolved: null,
                            paymentStatus: null,
                            isResubmission: false,
                            isdownload: false,
                            isByLawDownload: false,
                            isFirmNameChange: false,
                            isNewPartnerAdded: false,
                            isOtherAddressChange: false,
                            isPartnerDeleted: false,
                            isPartnerPermanentAddressChange: false,
                            isPartnerReplaced: false,
                            isPrincipaladdressChange: false,
                            version: null,
                            IPAddress: '',
                            createdBy: row.created_by,
                            updatedBy: row.lastmodified_by,
                            isLegacyData: 'Y',
                            createdAt: toMongoDate(row.insert_date || row.created_ts),
                            updatedAt: toMongoDate(row.lastmodified_ts || row.insert_date),
                        };
                        
                        await Firm.deleteOne({
                            applicationNumber: firmDoc.applicationNumber
                        });

                        await Firm.create(firmDoc);

                        totalInserted++;
                    } catch (err) {
                        totalErrors++;
                        logger.error('Record processing error:', err);
                    }

                    totalProcessed++;
                 
                    if (global.gc && totalProcessed % 100 === 0) {
                        global.gc();
                    }
                }

                windowStart = windowEnd;
            }

            startDate.add(1, 'month');
        }

        logger.info('<======== Final Summary ========>');
        logger.info(`Total Processed: ${totalProcessed}`);
        logger.info(`Total Inserted: ${totalInserted}`);
        logger.info(`Total Errors: ${totalErrors}`);

        return {
            Total: totalProcessed,
            Inserted: totalInserted,
            Errors: totalErrors
        };
    } catch (error) {
        logger.error('savePostgresData error:', error);
        throw error;
    }
};

const toMongoDate = (value: any) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};



export * as IndustrialController from './industrialController';