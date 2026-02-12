import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb'
import { Firm, User, DepartmentUsers, Districts } from '../../models/index';
import { getDocs, appNumber } from '../../utils/functions';
import { _checkFirm, _getAllFirms, _getFirm, _createFirm, _updateFirmName, _deleteFirm, _sendSMS, _processingHistoryUpdate, _updateFirmAddress, _updatePartnerAddress, _updateFirmPartner, _updateDocs, _updateFirm, _saveHistory, downloadFirmHistory, _paymentResponseUpdate, _updateUnsetFirm, _getFirmByAppNumber, _updateFirmByAPP,_getFirmDate } from '../../services/FirmsService';
import { Firm as FirmType } from '../../models/types/index';
import moment from 'moment';
const multer = require('multer')
import { firmDocsUpload } from '../../utils/functions';
import { userSession } from '../middleware/auth';
import mongoose, { Types } from 'mongoose';

import { downloadUrl } from '../../config/appConfig'
import { createUser, _getAadharNumberByUUID, _getUUIDByAadharNumber } from '../../services/UserService';
import { logger } from '../../logger';
import { Exception } from 'handlebars';
var CryptoJS = require("crypto-js");
const PDFKitDocument = require("pdfkit-table");
const fs = require('fs');
const Path = require('path');
var xl = require('excel4node');
const puppeteer = require('puppeteer');
const hbs = require('handlebars');
const CryptoJs = require('crypto-js');
const axios = require('axios');
const https = require('https');
var JsBarcode = require('jsbarcode');
// var Canvas = require("canvas");
const util = require('util');
var { createCanvas } = require("canvas");
const { PDFDocument } = require("pdf-lib");


const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

export const checkFirm = async (req: Request, res: Response) => {
    try {
        const { firmName, district } = req.body;
        console.log("<========  firmName  ========>", firmName);
        logger.info(`<========  firmName  ========>, ${firmName}`);

        const firm = await _checkFirm(firmName, district);

        console.log("<========  firm  ========>", firm);
        logger.info(`<========  firm  ========>, ${firm}`);

        if (firm) {
            return res.status(200).send({ message: "Firm already exists!", success: false, data: {} });
        }

        return res.status(200).send({ message: 'The Name is available to register', success: true, data: {} });
    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

};

export const createApprovalCertificate = async (id: string) => {
    let firmsFilesDirectory = Path.join(process.env.FILE_DIR_PATH, `pdfs/uploads/`);    
    if (!fs.existsSync(firmsFilesDirectory)) {
        fs.mkdirSync(firmsFilesDirectory, { recursive: true });
    }
    firmsFilesDirectory = `${firmsFilesDirectory}/firms/`;
    if (!fs.existsSync(firmsFilesDirectory)) {
        fs.mkdirSync(firmsFilesDirectory, { recursive: true });
    }
    firmsFilesDirectory = `${firmsFilesDirectory}${id}/`;
    if (!fs.existsSync(firmsFilesDirectory)) {
        fs.mkdirSync(firmsFilesDirectory, { recursive: true });
    }

    let firmData = await getFirmDetails(id);
    let deptUserDetails = await DepartmentUsers.findById({ _id: userSession._id });
    const assetsPath = Path.join(__dirname, `../../../assets/`);
    let bitmap = fs.readFileSync(`${assetsPath}Andhra_Pradesh_Official_Logo.png`);
    let apLogoBase64 = bitmap.toString("base64");
    bitmap = fs.readFileSync(`${assetsPath}Firms-Approved.png`);
    let sealFirmBase64 = bitmap.toString("base64");

    var canvas = createCanvas();
           
    JsBarcode(canvas, firmData.applicationNumber);
    const buf3 = canvas.toBuffer('image/png', { quality: 0.8 })
    var base64data = new Buffer(buf3).toString('base64');
    console.log(buf3);
    logger.info(`<======== createApprovalCertificate - buf3  ========>, ${util.inspect(buf3, { depth: null, colors: false })})` );
    // console.log(
    //   "<========  firmData  ========>",
    //   JSON.parse(JSON.stringify(firmData))
    // );

    firmData = JSON.parse(JSON.stringify(firmData));

    for (let i = 0; i < firmData.firmPartners.length; i++) {
        firmData.firmPartners[i].index = i + 1;
    }

    for (let i = 0; i < firmData.principalPlaceBusiness.length; i++) {
        firmData.principalPlaceBusiness[i].index = i + 1;
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const approvalCertificatePath = Path.join(__dirname, `../../reports/`);
    const files = [`${approvalCertificatePath}ApprovedCertificate.hbs`];
    let html = "";
    files.forEach((file) => {
        html += fs.readFileSync(`${file}`, "utf-8");
    });
    let dynamicData = JSON.parse(JSON.stringify(firmData));
    dynamicData.deptUserDetails = JSON.parse(JSON.stringify(deptUserDetails));
    dynamicData.todaysDate = getTodaysDate();

    for (let i = 0; i < dynamicData.firmPartners.length; i++) { }
    let registrationNumber: any = 1;
    let registrationYear = moment().format('YYYY');
   
    if ((!firmData.registrationNumber || firmData.registrationNumber <= 0) && firmData.district == userSession.district) {
        const firmData: any = await Firm.findOne({ registrationYear: registrationYear, district: userSession.district }, { registrationNumber: 1, registrationYear: 1, district: 1 }).sort({ registrationNumber: -1 })
        console.log('<============= firmData =============>', firmData);
        logger.info(`<======== createApprovalCertificate - firmData  ========>, ${firmData}`);

        if (firmData && firmData.registrationNumber > 0 && firmData.registrationYear == registrationYear && firmData.district == userSession.district) {
            registrationNumber = firmData.registrationNumber + 1;
        }
        console.log('<============= registrationNumber =============>', registrationNumber);
        logger.info(`<======== createApprovalCertificate - registrationNumber  ========>, ${registrationNumber}`);
    }
    else {
        registrationNumber = firmData.registrationNumber ? firmData.registrationNumber : '';
        registrationYear = firmData.registrationYear ? firmData.registrationYear : '';
    }
    
    dynamicData.registrationYear = registrationYear
    dynamicData.registrationNumber = registrationNumber
    dynamicData.assets = {
        sealFirmBase64: sealFirmBase64,
        apLogoBase64: apLogoBase64,
        barcodebase64:base64data,
    };
    page.setOfflineMode(true);
    await page.setContent(hbs.compile(html)(dynamicData));
    await page.pdf({
        path: `${firmsFilesDirectory}approvedFirm.pdf`,
        printBackground: true,
        format: "A4",
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
    });
    console.log("<========  Done printing  ========>");
    logger.info(`<======== createApprovalCertificate - Done printing  ========>`);
    await browser.close();
    await addGenertedAtTimeStamp(`${firmsFilesDirectory}approvedFirm.pdf`);
    console.log("<========  Done Adding TimeStamp  ========>");
    logger.info(`<======== createApprovalCertificate - Done Adding TimeStamp  ========>`);
    bitmap = fs.readFileSync(`${firmsFilesDirectory}approvedFirm.pdf`);
    let convertBase64 = bitmap.toString("base64");
    return {
        dataBase64: convertBase64,
        fileName: `approvedFirm.pdf`,
    };
};

export const createRejectionCertificate = async (id: string,remarks:string) => {
    let firmsFilesDirectory = Path.join(process.env.FILE_DIR_PATH, `pdfs/uploads/`);    
    if (!fs.existsSync(firmsFilesDirectory)) {
        fs.mkdirSync(firmsFilesDirectory, { recursive: true });
    }
    firmsFilesDirectory = `${firmsFilesDirectory}/firms/`;
    if (!fs.existsSync(firmsFilesDirectory)) {
        fs.mkdirSync(firmsFilesDirectory, { recursive: true });
    }
    firmsFilesDirectory = `${firmsFilesDirectory}${id}/`;
    if (!fs.existsSync(firmsFilesDirectory)) {
        fs.mkdirSync(firmsFilesDirectory, { recursive: true });
    }
    
    let firmData = await getFirmDetails(id);
    console.log("",firmData)
    let deptUserDetails = await DepartmentUsers.findById({ _id: userSession._id });
    const assetsPath = Path.join(__dirname, `../../../assets/`);
    let bitmap = fs.readFileSync(`${assetsPath}Andhra_Pradesh_Official_Logo.png`);
    let apLogoBase64 = bitmap.toString("base64");
    bitmap = fs.readFileSync(`${assetsPath}Firms-Rejected.png`);
    let sealFirmBase64 = bitmap.toString("base64");
    
    var canvas = createCanvas();
           
    JsBarcode(canvas, firmData.applicationNumber);
    const buf3 = canvas.toBuffer('image/png', { quality: 0.8 })
    var base64data = new Buffer(buf3).toString('base64');
    console.log(buf3);

    // console.log(
    //   "<========  firmData  ========>",
    //   JSON.parse(JSON.stringify(firmData))
    // );

    firmData = JSON.parse(JSON.stringify(firmData));
    
    for (let i = 0; i < firmData.firmPartners.length; i++) {
        firmData.firmPartners[i].index = i + 1;
    }
   

    for (let i = 0; i < firmData.principalPlaceBusiness.length; i++) {
        firmData.principalPlaceBusiness[i].index = i + 1;
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const approvalCertificatePath = Path.join(__dirname, `../../reports/`);
    const files = [`${approvalCertificatePath}RejectionCertificate.hbs`];
    let html = "";
    files.forEach((file) => {
        html += fs.readFileSync(`${file}`, "utf-8");
    });
    let dynamicData = JSON.parse(JSON.stringify(firmData));
    dynamicData.deptUserDetails = JSON.parse(JSON.stringify(deptUserDetails));
    dynamicData.todaysDate = getTodaysDate();
    dynamicData["remarks"]=remarks;
    console.log("DYNA<IC DATA OS", dynamicData);
    logger.info(`<======== createRejectionCertificate - DYNA<IC DATA OS  ========>, ${util.inspect(dynamicData, { depth: null, colors: false })})` );

    for (let i = 0; i < dynamicData.firmPartners.length; i++) { }

    dynamicData.assets = {
        sealFirmBase64: sealFirmBase64,
        apLogoBase64: apLogoBase64,
        barcodebase64:base64data
    };
    page.setOfflineMode(true);
    await page.setContent(hbs.compile(html)(dynamicData));
    await page.pdf({
        path: `${firmsFilesDirectory}rejectedFirm.pdf`,
        printBackground: true,
        format: "A4",
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
    });
    console.log("<========  Done printing  ========>");
    logger.info(`<======== createRejectionCertificate - Done printing  ========>`);
    await browser.close();
    await addGenertedAtTimeStamp(`${firmsFilesDirectory}rejectedFirm.pdf`);
    console.log("<========  Done Adding Timestamp  ========>");
    logger.info(`<======== createRejectionCertificate - Done Adding TimeStamp  ========>`);
    bitmap = fs.readFileSync(`${firmsFilesDirectory}rejectedFirm.pdf`);
    let convertBase64 = bitmap.toString("base64");
    return {
        dataBase64: convertBase64,
        fileName: `rejectedFirm.pdf`,
    };
};

const getFirmDetails = async (id: string) => {
    try {
        let firm: any = await _getFirmByAppNumber(id);
        logger.info(`<========  firm  ========>, ${firm}`);
        if (!firm) {
            throw new Error(`Firm details are not found for ${id}`);
        }

        let applicantDetails = firm.applicantDetails;
        let firmPartners = firm.firmPartners;
        //   if (
        //     applicantDetails?.aadharNumber &&
        //     applicantDetails?.aadharNumber?.toString() != null
        //   ) {
        //     const resp = await _getAadharNumberByUUID(
        //       applicantDetails.aadharNumber.toString()
        //     );
        //     if (resp.data?.status == "Success") {
        //       applicantDetails.aadharNumber = resp.data.UID;
        //     } else {
        //       throw new Error(
        //         "Aadhaar service is not working. Please try after sometime"
        //       );
        //     }
        //   }
        //   if (firmPartners?.length > 0) {
        //     for await (let pd of firmPartners) {
        //       if (pd.aadharNumber?.toString() != "") {
        //         const resp = await _getAadharNumberByUUID(pd.aadharNumber.toString());
        //         if (resp.data?.status == "Success") {
        //           pd.aadharNumber = resp.data.UID;
        //         } else {
        //           throw new Error(
        //             "Aadhaar service is not working. Please try after sometime"
        //           );
        //         }
        //       }
        //     }
        //   }

        return firm;
    } catch (error) {
        logger.error(`error- ${error}`);
        throw error;
    }
};

const addGenertedAtTimeStamp = async (filePath: String) => {
    try {
        let generatedOn = dateTimeInFormat(1);
        let data = fs.readFileSync(filePath);

        // Load the PDF file.
        let pdfDoc = await PDFDocument.load(data);

        console.log("# PDF document loaded.");
        logger.info(`<======== addGenertedAtTimeStamp - # PDF document loaded.  ========>`);

        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
            let imagePage = pdfDoc.getPage(i);
            imagePage.drawText(` Generated On: ${generatedOn}`, {
                x: 200,
                y: 10,
                size: 10
            });
        }

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(filePath, pdfBytes);

        return;

    } catch (ex) {
        logger.error(`error- ${ex}`);
        return;
    }
}

function getTodaysDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}
export const ActionDocument = async (id: string) => {
    let FirmData = await getFirmDetails(id);
    console.log("FirmData", FirmData)
    logger.info(`<======== ActionDocument - FirmData  ========>, ${FirmData}`);
    let deptUserDetails = await DepartmentUsers.findById({ _id: userSession._id });

    if (FirmData.documentAttached.length > 0) {
        FirmData.documentAttached.map(async (document: any) => {
            let filename = document?.originalname;
            
             const pdfsPath = Path.join(process.env.FILE_DIR_PATH, `uploads/${FirmData._id}/`);
            const file = `${pdfsPath}${filename}`;
            let existingPdfBytes = fs.readFileSync(file);
            const pdfDoc = await PDFDocument.load(existingPdfBytes)
            const format1 = "YYYY-MM-DD HH:mm:ss";
            let date1 = new Date();
            let dateTime1 = moment(date1).format(format1);
            const assetsPath = Path.join(__dirname, `../../../assets/`);
         
            let bitmap = fs.readFileSync(`${assetsPath}Firms-Approved.png`);
           
            const pngImage = await pdfDoc.embedPng(bitmap)
            const pngDims = pngImage.scale(0.6)
            const pages = pdfDoc.getPages()
            let bitmap1 = fs.readFileSync(`${assetsPath}whitecast.png`);
           
            const pngImage1 = await pdfDoc.embedPng(bitmap1)
          
            for (let page of pages) {
                const { width, height } = page.getSize()
                page.drawImage(pngImage1, { x: 10, y: 20,  })
             
                page.drawText('Approved on : ' + dateTime1,
                    { x: 10, y: 20, size: 8 })
                console.log("height", height)
                console.log("width", width)
                page.drawImage(pngImage, { x: 425, y: 23, width: pngDims.width - 30, height: pngDims.height - 30, })
                page.drawText(FirmData.district,
                    { x: 440, y: 18, size: 9 })
            }

            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(file, pdfBytes)
            console.log("updatedfilename:::", file)
            logger.info(`<======== ActionDocument - updatedfilename:::  ========>, ${file}`);
            console.log("<========  Done printing  ========>");
            logger.info(`<======== ActionDocument - Done printing  ========>`);

            // bitmap = fs.readFileSync(`${pdfsPath}`);
            // let convertBase64 = fs.readFileSync(`${pdfsPath}${filename}`).toString("base64");
            // return {
            //     dataBase64: convertBase64,
            //     fileName: `${filename}`,
            // };
        })
    }
};
export const ActionDocumentRejected = async (id: string) => {
    let FirmData = await getFirmDetails(id);
    console.log("FirmData", FirmData)
    logger.info(`<======== ActionDocumentRejected - FirmData  ========>, ${FirmData}`);
    let deptUserDetails = await DepartmentUsers.findById({ _id: userSession._id });

    if (FirmData.documentAttached.length > 0) {
        FirmData.documentAttached.map(async (document: any) => {
            // await docLink(document?.originalname, index, document?.path)
            let filename = document?.originalname;
            const pdfsPath = Path.join(process.env.FILE_DIR_PATH, `uploads/${FirmData._id}/`);
            const file = `${pdfsPath}${filename}`;
            let existingPdfBytes = fs.readFileSync(file);
            const pdfDoc = await PDFDocument.load(existingPdfBytes)
            const format1 = "YYYY-MM-DD HH:mm:ss";
            let date1 = new Date();
            let dateTime1 = moment(date1).format(format1);
            const assetsPath = Path.join(__dirname, `../../../assets/`);
            let bitmap = fs.readFileSync(`${assetsPath}Firms-Rejected.png`);
            const pngImage = await pdfDoc.embedPng(bitmap)
            const pngDims = pngImage.scale(0.6)
            const pages = pdfDoc.getPages()
            let bitmap1 = fs.readFileSync(`${assetsPath}whitecast.png`);
            const pngImage1 = await pdfDoc.embedPng(bitmap1)
            for (let page of pages) {
                const { width, height } = page.getSize()
                page.drawImage(pngImage1, { x: 10, y: 20, })
                page.drawText('Rejected on : ' + dateTime1,
                    { x: 10, y: 20, size: 8 })
                console.log("height", height)
                console.log("width", width)
                page.drawImage(pngImage, { x: 425, y: 23, width: pngDims.width - 30, height: pngDims.height - 30, })
                page.drawText(FirmData.district,
                    { x: 440, y: 18, size: 9 })
            }
            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(file, pdfBytes)
            console.log("updatedfilename:::", file)
            logger.info(`<======== ActionDocumentRejected - updatedfilename:::  ========>, ${file}`);
        })
    }
};
export const downloadFileByData = async (req: Request, res: Response) => {
    // const { id } = req.params;

    const id = Buffer.from(req.params.id, 'base64').toString();
    const filename = req.params.filename

    console.log("idapp", id)
    logger.info(`<======== downloadFileByData - idapp  ========>, ${id}`);
    let FirmData = await getFirmDetails(id);        
        const filePath = Path.join(process.env.FILE_DIR_PATH, `uploads/${FirmData._id}/${filename}`);
        console.log("filePathdata#$#$#$#$$$",filePath)
        logger.info(`<========  filePath  ========>, ${filePath}`);
        const contents = fs.readFileSync(filePath, { encoding: "base64" });
        console.log("contents", contents)
        // console.log("filePath", filePath)
        return res.status(200).send({ message: "Downloaded Successfully", success: true, data: { base64file: contents } })        
}

export const downloadcertificateByData = async (req: Request, res: Response) => {
    // const { id } = req.params;

    const id = Buffer.from(req.params.id, 'base64').toString();
    const filename = Buffer.from(req.params.filename, 'base64').toString();

    console.log("idapp", id)
    let FirmData = await getFirmDetails(id);
    if (userSession._id == FirmData.userId) {
        const filePath = Path.join(process.env.FILE_DIR_PATH, `uploads/${FirmData._id}/${filename}`);

        const contents = fs.readFileSync(filePath, { encoding: "base64" });
        console.log("contents", contents)
        logger.info(`<========  downloadcertificateByData - contents  ========>, ${util.inspect(contents, { depth: null, colors: false })})`);
        console.log("filePath", filePath)
        logger.info(`<========  downloadcertificateByData - filePath  ========>, ${filePath}`);
        return res.status(200).send({ message: "Downloaded Successfully", success: true, data: { base64file: contents } })

    } else {
        return res.status(400).send({ message: "Invalid action", success: false, data: {} });
    }    

}

export const downloadcertificate = async (req: Request, res: Response) => {
    // const { id } = req.params;
   
    const id = Buffer.from(req.params.id, 'base64').toString();
    console.log("idapp",id)
    logger.info(`<======== downloadcertificate - id  ========>, ${id}`);
    let firmData = await getFirmDetails(id);
   
    const assetsPath = Path.join(process.env.FILE_DIR_PATH, `pdfs/uploads/firms/${id}/`);    
    let filePath=""
    if (firmData.status === "Approved") {
        filePath = `${assetsPath}signedApprovedFirmsDocument.pdf`;
    } else if (firmData.status === "Rejected") {
        filePath = `${assetsPath}signedRejectedFirmsDocument.pdf`;
    } else {
        return res.status(400).send({ message: "Invalid action", success: false, data: {} });
    }
    const contents = fs.readFileSync(filePath, { encoding: "base64" });
    console.log("contents",contents)
    logger.info(`<======== downloadcertificate - contents  ========>, ${util.inspect(contents, { depth: null, colors: false })})`);
    console.log("filePath",filePath)
    logger.info(`<======== downloadcertificate - filePath  ========>, ${util.inspect(filePath, { depth: null, colors: false })})`);
    return res.status(200).send({ message: "Downloaded Successfully", success: true, data: {base64file:contents}})
}

export const actionOnCertificate = async (req: Request, res: Response) => {
    const id = req.body.id

    if (req.body.action === "Approved") {
        try {
            logger.info(`userSession', ${JSON.stringify(userSession)}`);
            await createApprovalCertificate(id);
            ActionDocument(id)
            const filePath = Path.join(
                process.env.FILE_DIR_PATH,
                `pdfs/uploads/firms/${id}/approvedFirm.pdf`
            );
            // InitiateEsign
            const contents = fs.readFileSync(filePath, { encoding: "base64" });
            // NEED TO CHANGE COORDINATES DATA HERE FOR APPROVED CERTIFICATE
            const coOrdinatesData = "1-55,270,50,100";
            // Fetch the aadhar number from the database

            let rrnValue = Math.floor(Math.random() * 100000000000000000);
            let deptUserDetails = await DepartmentUsers.findById({ _id: userSession._id });            
            let aadharUUIDResponse =  await _getAadharNumberByUUID(deptUserDetails?.aadharUUID);            
            let aadharNumber = aadharUUIDResponse.data?.UID
            
            let eSignData = {
                rrn: rrnValue,
                coordinates_location: "Top_Right",
                coordinates: coOrdinatesData,
                doctype: "PDF",
                uid: aadharNumber,
                signername: req.body.name?.substring(0, 50),
                signerlocation: req.body.location,
                filepassword: "",
                signreason: "FirmsEsign",
                authmode: req.body.authmode,
                webhookurl: process.env.ESIGN_REDIRECTION_URL,
                file: contents,
                callBackData: req.body,
                clientApp: "Firms&Societies",
            };
            logger.info(`<======== actionOnCertificate - eSignData ========>, ${util.inspect(eSignData, { depth: null, colors: false })})`);

            let esignRequestData = encryptWithAESPassPhrase(
                JSON.stringify(eSignData),
                "igrsSecretPhrase"
            );
            let esignUrl = process.env.ESIGN_URL?.toString();
            let eSignReponse = await igrsEsignAxiosCall(esignUrl, esignRequestData);
            logger.info(`<======== actionOnCertificate - eSignReponse ========>, ${util.inspect(eSignReponse, { depth: null, colors: false })})`);
            if (eSignReponse.status == "Success") {
                const payload = {
                    esignStatus: "InProgress",
                    esignTxnId: rrnValue.toString(),
                };
                await _updateFirmByAPP(id, payload);
                eSignReponse.txnid = eSignData.rrn;
            } else {
                console.log("ERROR IN ESIGN IS ", eSignReponse);
                logger.info(`<======== actionOnCertificate - ERROR IN ESIGN IS ========>, ${util.inspect(eSignReponse, { depth: null, colors: false })})`);
                throw new Error(eSignReponse.message);
            }

            return res
                .status(200)
                .send({
                    message: "Certificate generated successfully",
                    success: true,
                    data: eSignReponse,
                });
        } catch (error) {
            logger.error(`error- ${error}`);
            return res.status(500).send({ message: error, success: false, data: {} });
        }
    } else if (req.body.action === "Rejected") {

        try {
            logger.info(`userSession', ${JSON.stringify(userSession)}`);
           let remarks=req.body.remarks
            await createRejectionCertificate(id,remarks);
            ActionDocumentRejected(id)
            const filePath = Path.join(
                process.env.FILE_DIR_PATH,
                `pdfs/uploads/firms/${id}/rejectedFirm.pdf`
            );
            // InitiateEsign
            const contents = fs.readFileSync(filePath, { encoding: "base64" });
            // NEED TO CHANGE COORDINATES DATA HERE FOR REJECTED CERTIFICATE
            const coOrdinatesData = "1-55,125,50,100";
            // Fetch the aadhar number from the database

            let rrnValue = Math.floor(Math.random() * 100000000000000000);
            let deptUserDetails = await DepartmentUsers.findById({ _id: userSession._id });
            let aadharUUIDResponse =  await _getAadharNumberByUUID(deptUserDetails?.aadharUUID);
            let aadharNumber = aadharUUIDResponse.data?.UID

            let eSignData = {
                rrn: rrnValue,
                coordinates_location: "Top_Right",
                coordinates: coOrdinatesData,
                doctype: "PDF",
                uid: aadharNumber,
                signername: req.body.name?.substring(0, 50),
                signerlocation: req.body.location,
                filepassword: "",
                signreason: "FirmsEsign",
                authmode: req.body.authmode,
                webhookurl: process.env.ESIGN_REDIRECTION_URL,
                file: contents,
                callBackData: req.body,
                clientApp: "Firms&Societies",
            };
            logger.info(`<======== Rejected eSignData ========>, ${util.inspect(eSignData, { depth: null, colors: false })})`);
            let esignRequestData = encryptWithAESPassPhrase(
                JSON.stringify(eSignData),
                "igrsSecretPhrase"
            );
            let esignUrl = process.env.ESIGN_URL?.toString();
            console.log("BEOFRE CALLIMG");
            let eSignReponse = await igrsEsignAxiosCall(esignUrl, esignRequestData);
            logger.info(`<======== Rejected eSignReponse ========>, ${util.inspect(eSignReponse, { depth: null, colors: false })})`);
            if (eSignReponse.status == "Success") {
                const payload = {
                    esignStatus: "InProgress",
                    esignTxnId: rrnValue.toString(),
                };

                await _updateFirmByAPP(id, payload);
                eSignReponse.txnid = eSignData.rrn;
            } else {
                console.log("ERROR IN ESIGN IS ", eSignReponse);
                logger.info(`<======== Rejected ERROR IN ESIGN IS ========>, ${util.inspect(eSignReponse, { depth: null, colors: false })})`);
                throw new Error(eSignReponse.message);
            }

            return res
                .status(200)
                .send({
                    message: "Certificate generated successfully",
                    success: true,
                    data: eSignReponse,
                });
        } catch (error) {
            logger.error(`error- ${error}`);
            return res.status(500).send({ message: error, success: false, data: {} });
        }
    } else {
        return res
            .status(400)
            .send({ message: "Invalid action", success: false, data: {} });
    }
};

export const esignStatus = async (req: Request, res: Response) => {
    try {
        const { id, txnId, action } = req.body;
        let firmData = await getFirmDetails(id);
        if (firmData.esignTxnId != txnId) {
            return res.status(400).send({ message: "Txn id didn't match", success: false, data: {} });
        }
        const statusResponse = await igrsEsignStatusAxiosCall(txnId);
        logger.info(`<======== esignStatus - statusResponse ========>, ${statusResponse}`);
        if (statusResponse != null && statusResponse.status == "Success") {
            let firmsFilesDirectory = Path.join(process.env.FILE_DIR_PATH, `pdfs/uploads/firms/${id}/`);
            let filePath = "";
            if (action === "Approved") {
                filePath = `${firmsFilesDirectory}signedApprovedFirmsDocument.pdf`;
            } else if (action === "Rejected") {
                filePath = `${firmsFilesDirectory}signedRejectedFirmsDocument.pdf`;
            } else {
                return res.status(400).send({ message: "Invalid action", success: false, data: {} });
            }
            await fs.writeFileSync(filePath, statusResponse.data, { encoding: 'base64' });
            const payload = {
                esignStatus: "Done",
            };
            await _updateFirmByAPP(id, payload);
        } else if (statusResponse != null && statusResponse.status == "Failure") {
            return res.status(400).send({ message: statusResponse.message, success: false, data: {} });
        }

        return res.status(200).send({ message: "Esign status fetched successfully", success: true, data: statusResponse });
    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
};

const igrsEsignAxiosCall = async (eSignUrl: any, eSignData: String) => {
    try {
        let data = JSON.stringify({
            esignRequest: eSignData,
        });
        logger.info(`<======== igrsEsignAxiosCall - data ========>, ${data}`);
        let eSignConfig = {
            method: "post",
            maxBodyLength: Infinity,
            url: `${eSignUrl}/storeAndProcessEsignRequest`,
            headers: {
                "Content-Type": "application/json",
            },
            data: data,
        };
        logger.info(`<======== igrsEsignAxiosCall - eSignConfig ========>, ${eSignConfig}`);
        let fileResponse = await instance.request(eSignConfig);
        logger.info(`<======== igrsEsignAxiosCall - fileResponse ========>, ${fileResponse}`);
        if (fileResponse == null || fileResponse.data == null) {
            throw Error("IGRS Esign api error");
        }

        return fileResponse.data;
    } catch (ex: any) {
        logger.error("ESignServices - igrsEsignAxiosCall || Error :", ex);
        console.error("ESignServices - igrsEsignAxiosCall || Error :", ex);
        // return null
        throw ex;
    }
};

export const igrsEsignStatusAxiosCall = async (rrn: string) => {
    console.log(rrn);
    logger.info(`<======== igrsEsignStatusAxiosCall - rrn ========>, ${rrn}`);
    rrn = encryptWithAESPassPhrase(`${rrn}`, "igrsSecretPhrase");    
    console.log(rrn);
    logger.info(`<======== igrsEsignStatusAxiosCall - rrn ========>, ${rrn}`);
    rrn = encodeURIComponent(`${rrn}`);
    console.log(rrn);
    logger.info(`<======== igrsEsignStatusAxiosCall - rrn ========>, ${rrn}`);

    try {
        let eSignConfig = {
            method: "post",
            maxBodyLength: Infinity,
            url: `${process.env.ESIGN_URL}/downloadSignedDocTransID?transactionId=${rrn}`,
            headers: {
                "Content-Type": "application/json",
            },
            // httpsAgent
        };
        logger.info(`<======== igrsEsignStatusAxiosCall - eSignConfig ========>, ${eSignConfig}`);
        let fileResponse = await instance.request(eSignConfig);
        logger.info(`<======== igrsEsignStatusAxiosCall - fileResponse ========>, ${fileResponse}`);
        if (fileResponse == null || fileResponse.data == null) {
            throw Error("IGRS Esign api error");
        }

        return fileResponse.data;
    } catch (ex) {
        logger.error("ESignServices - igrsEsignStatusAxiosCall || Error :",ex);
        console.error("ESignServices - igrsEsignStatusAxiosCall || Error :",ex);
        throw ex;
    }
};

export const changeName = async (req: Request, res: Response) => {
    try {
        const { newFirmName, district, newNameEffectDate } = req.body;
        console.log("<========  newFirmName  ========>", newFirmName);
        logger.info(`<======== changeName - newFirmName ========>, ${newFirmName}`);
        console.log("<========  district  ========>", district);
        logger.info(`<======== changeName - district ========>, ${district}`);
        console.log("<========  req.params.id  ========>", req.body.id);
        logger.info(`<======== changeName - req.params.id ========>, ${req.params.id}`);

        const firm = await _checkFirm(newFirmName, district);

        console.log("<========  firm  ========>", firm);
        logger.info(`<======== changeName - firm ========>, ${firm}`);

        if (firm) {
            return true;
            //res.status(200).send({ message: "firm already exists!", success: false, data: {} });
        }
        else {
            const payload = {
                firmName: newFirmName,
                district: district,
                newNameEffectDate: newNameEffectDate,
                status: 'Incomplete'
            }
            logger.info(`<======== changeName - payload ========>, ${payload}`);
            //firmName: req.body.newFirmName,
            //newNameEffectDate: req.body.newNameEffectDate,

            const firm = await _updateFirm(req.body.id, payload);
            logger.info(`<======== changeName - firm ========>, ${firm}`);
            return false;
            //res.status(200).send({ message: 'firm Name changed successfully', success: true, data: {firm: firm} });         
        }

    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

};

const isFirmInValid = (req: any, res: any) => {
    return new Promise(function (resolve, reject) {

        const body: any = req.body;
        if (!body['applicantDetails']) {
            resolve({ "success": false, "message": "applicantDetails is not allowed to be empty", "data": {} })

        } else if (!body['applicantDetails']['aadharNumber']) {
            resolve({ "success": false, "message": "applicantDetails.aadharNumber is not allowed to be empty", "data": {} })

        } else if (body['applicantDetails']) {
            const data = body['applicantDetails'];
            const applicantDetails = [
                // { key: 'aadharNumber', reg: /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/ },
                { key: 'age', reg: /^[0-9]{2}$/ },
                { key: 'name', reg: /^[A-Za-z\s]*$/ },
                { key: 'surname', reg: /^[A-Za-z\s]*$/ },
                { key: 'relation', reg: /^[A-Za-z\s]*$/ },
                { key: 'relationType', reg: /^[A-Za-z/\s]*$/ },
                { key: 'gender', reg: /^[A-Za-z\s]*$/ },
                { key: 'role', reg: /^[A-Za-z \s]*$/ },
                // { key: 'doorNo', reg: /[A-Za-z0-9/-]|,/ },
                // { key: 'street', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'country', reg: /^[a-zA-Z-\\s\/\-\)\(\`\.\"\'\s]*$/ },
                { key: 'state', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                { key: 'district', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                // { key: 'mandal', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                // { key: 'villageOrCity', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                { key: 'pinCode', reg: /[0-9]/ },
            ];
            logger.info(`<======== isFirmInValid - applicantDetails ========>, ${applicantDetails}`);
            applicantDetails.some(obj => {
                if (data[obj.key] && !obj.reg.test(data[obj.key])) {
                    resolve({ "success": false, "message": `${obj.key} format is invalid`, "data": {} })
                    reject('rejected');
                    return true;
                }
            });
        }
        if (body['contactDetails']) {
            console.log('contactDetails................................');
            const data = body['contactDetails'];
            const contactDetails = [
                //{ key: 'landPhoneNumber', reg: /^\d+$/ },
                { key: 'mobileNumber', reg: /^\d{10}$/ },
                { key: 'email', reg: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ },
            ];
            logger.info(`<======== isFirmInValid - contactDetails ========>, ${contactDetails}`);
            contactDetails.forEach(obj => {
                if (data[obj.key] && !obj.reg.test(data[obj.key])) {
                    resolve({ "success": false, "message": `${obj.key} format is invalid`, "data": {} })

                    return true;
                }
            });
        }
        if (body['principalPlaceBusiness']) {
            console.log('principalPlaceBusiness................................');
            const data = body['principalPlaceBusiness'];
            const principalPlaceBusiness = [
                // { key: 'doorNo', reg: /[A-Za-z0-9/-]|,/ },
                // { key: 'street', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'state', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                { key: 'district', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                // { key: 'villageOrCity', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                // { key: 'mandal', reg: /^\s*[a-zA-Z]{1}[0-9a-zA-Z][0-9a-zA-Z '-.=#/]*$/ },
                { key: 'pinCode', reg: /[0-9]/ },
                { key: 'branch', reg: /^[a-zA-Z0-9\s,'-]*$/ },
            ];
            logger.info(`<======== isFirmInValid - principalPlaceBusiness ========>, ${principalPlaceBusiness}`);
            principalPlaceBusiness.some(obj => {
                if (data[obj.key] && !obj.reg.test(data[obj.key])) {
                    resolve({ "success": false, "message": `${obj.key} format is invalid`, "data": {} })

                    return true;
                }
            });
        }
        if (body['otherPlaceBusiness']) {
            console.log('otherPlaceBusiness................................');
            const otherPlaceBusinessData = body['otherPlaceBusiness'];
            const otherPlaceBusiness = [
                // { key: 'doorNo', reg: /[A-Za-z0-9/-]|,/ },
                // { key: 'street', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'state', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'district', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                // { key: 'villageOrCity', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                // { key: 'mandal', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'pinCode', reg: /[0-9]/ },
                { key: 'branch', reg: /^[a-zA-Z0-9\s,'-]*$/ },
            ];
            logger.info(`<======== isFirmInValid - otherPlaceBusiness ========>, ${otherPlaceBusiness}`);
            otherPlaceBusinessData.some((data: any) => {
                let isInvalid = false;
                otherPlaceBusiness.some(obj => {
                    if (data[obj.key] && !obj.reg.test(data[obj.key])) {
                        resolve({ "success": false, "message": `${obj.key} format is invalid`, "data": {} })
                        isInvalid = true;

                        return true;
                    }
                });
                return isInvalid;
            });

        }
        if (body['partnerDetails']) {
            console.log('partnerDetails................................');
            const partnerDetailsData = body['partnerDetails'];
            const partnerDetails = [
                // { key: 'aadharNumber', reg: /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/ },
                { key: 'partnerName', reg: /^[A-Za-z\s]*$/ },
                // { key: 'partnerSurname', reg: /^[A-Za-z\s]*$/ },
                { key: 'relation', reg: /^[A-Za-z\s]*$/ },
                { key: 'relationType', reg: /^[A-Za-z/\s]*$/ },
                { key: 'role', reg: /^[A-Za-z \s]*$/ },
                { key: 'age', reg: /^[0-9]{2}$/ },
                //{ key: 'joiningDate', reg: /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/ },
                // { key: 'street', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'state', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                { key: 'district', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                // { key: 'villageOrCity', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                // { key: 'mandal', reg: /^[a-zA-Z0-9\s,'-]*$/ },
                // { key: 'pinCode', reg: /[0-9]/ },
                { key: 'branch', reg: /^[a-zA-Z0-9\s,'-]*$/ },
            ];
            logger.info(`<======== isFirmInValid - partnerDetails ========>, ${partnerDetails}`);
            partnerDetailsData.some((data: any, index: any) => {
                let isInvalid = true;
                partnerDetails.some((obj,) => {
                    const reg = obj.reg.test(data[obj.key]);
                    if (data[obj.key] && (reg === false)) {
                        console.log(`kkkkkkkkk${index}]${obj.key}`, data[obj.key], reg);
                        resolve({ "success": false, "message": `partnerDetails[${index}]${obj.key} format is invalid`, "data": {} })
                        isInvalid = false;

                        return true;
                    }
                });
                return isInvalid;
            });
        }

        console.log('else................................');
        logger.info('else................................');

        // const booleanArray = ['isFirmNameChange', 'isPrincipaladdressChange', 'isOtherAddressChange', 'isPartnerPermanentAddressChange', 'isNewPartnerAdded', 'isPartnerDeleted', 'isPartnerReplaced'];
        // booleanArray.some(key=>{
        //     if((body[key] !== true || body[key] !== false)){
        //         console.log('dddddddd', typeof body[key]);
        //         resolve({"success": false, "message": `${key} format is invalid`, "data": {}})
        //    
        //         return true;
        //     }
        // });
        // const arr = [
        //{ key: 'firmDurationFrom', reg: /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/ },
        //{ key: 'firmDurationTo', reg: /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/ },
        //     { key: 'industryType', reg: /^[A-Za-z/\s]*$/ },
        //     { key: 'bussinessType', reg: /^[A-Za-z/\s]*$/ }];
        // arr.some((obj: any) => {
        //     if (Object.hasOwnProperty.bind(body)(obj.key) && !obj.reg.test(body[obj.key])) {
        //         resolve({ "success": false, "message": `${obj.key} format is invalid`, "data": {} })

        //         return true;
        //     }
        // });
        resolve(false);
    });
}

export const updateFirm = async (req: Request, res: Response) => {
    try {
        if (req.body.formType === 'form-1') {

            let data = await isFirmInValid(req, res);
            if (data) {
                return res.status(400).send(data);
            }
        }

        //console.log("<====   userSession  =======>", userSession);
        console.log("<====   Request  =======>", req.body);
        logger.info(`<======== updateFirm - Request ========>, ${util.inspect(req.body, { depth: null, colors: false })})`);

        let appId;
        if (req.body.id)
            appId = req.body.id;
        else if (req.params.id)
            appId = req.params.id;

        await _saveHistory(req.body.id);
        if (req.body.isFirmNameChange == "true" && req.body.newFirmName) {
            const firm = await changeName(req, res);

            console.log("<========  firm  ========>", firm);
            logger.info(`<======== updateFirm - firm ========>, ${util.inspect(firm, { depth: null, colors: false })})`);

            if (firm) {
                return res.status(200).send({ message: "Firm already exists!", success: false, data: {} });
            }
        }
        else if (req.body.firmDissolved == "true" && req.body.firmDissolved) {
            const payload = {
                firmDissolved: true,
                status: 'Incomplete'
            }
            const firm = await _updateFirm(req.body.id, payload);
            let applicantDetails = firm?.applicantDetails;
            let firmPartners = firm?.firmPartners;
            if (applicantDetails?.aadharNumber && applicantDetails?.aadharNumber?.toString() != null) {
                const resp = await _getAadharNumberByUUID(applicantDetails.aadharNumber.toString())
                logger.info(`<======== updateFirm - resp ========>, ${util.inspect(resp, { depth: null, colors: false })})`);
                if (resp.data?.status == "Success") {
                    applicantDetails.aadharNumber = resp.data.UID
                }
                else {
                    return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                }
            }
            if (firmPartners != undefined && firmPartners?.length > 0) {
                for await (let pd of firmPartners) {
                    if (pd.aadharNumber?.toString() != "") {
                        const resp = await _getAadharNumberByUUID(pd.aadharNumber.toString())
                        logger.info(`<======== updateFirm - resp ========>, ${util.inspect(resp, { depth: null, colors: false })})`);
                        if (resp.data?.status == "Success") {
                            pd.aadharNumber = resp.data.UID
                        }
                        else {
                            return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                        }
                    }
                }
            }
            return res.status(200).send({ message: 'Firm dissolved successfully', success: true, data: { firm: firm } });
        }


        if (req.body.formType === 'form-1') {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            logger.info(`<======== updateFirm - files ========>, ${util.inspect(files, { depth: null, colors: false })})`);
            const attachments = getDocs(files);
            if (attachments.length < 3) {
                return res.status(500).send({ message: `Please upload valid file attachment or only PDF type should be accepted`, success: false, data: {} });
            }
            const firmDetails = req.body.firmDetails;
            req.body.firmDurationFrom = req.body.firmDurationFrom;// ? moment(req.body.firmDurationFrom, 'DD/MM/YYYY').format('YYYY-MM-DD') : '';
            req.body.firmDurationTo = req.body.firmDurationTo; //moment(req.body.firmDurationTo, 'DD/MM/YYYY').format('YYYY-MM-DD');
            const checkList = {
                isPartnershipDeedDoc: true,
                isAffidvitOrLeaseAgreementDoc: true,
                isSelfSignDeclarationDoc: true,
                isForm1DigitalSignDoc: true,
            };        
            let partnerDetails = req.body.partnerDetails;
            if (partnerDetails && partnerDetails.length > 0) {
                for await (let pd of partnerDetails) {
                    if (pd.aadharNumber) {
                        const resp = await _getUUIDByAadharNumber(pd.aadharNumber.toString())
                        logger.info(`<======== updateFirm - resp ========>, ${util.inspect(resp, { depth: null, colors: false })})`);
                        if (resp.data?.status == "Success") {
                            pd.aadharNumber = resp.data.UUID
                        }
                        else {
                            return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                        }
                    }
                }
            }

            let processingHistory = req.body.processingHistory;
            if (processingHistory && processingHistory.length) {
                processingHistory = processingHistory.map((ph: any) => {
                    if (ph.applicationTakenDate) {
                        ph.applicationTakenDate = moment(ph.applicationTakenDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
                    }
                    if (ph.applicationProcessedDate) {
                        ph.applicationProcessedDate = moment(ph.applicationProcessedDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
                    }
                    return ph;
                });
            }
            let applicationDetails = req.body.applicantDetails;
            if (applicationDetails?.aadharNumber && applicationDetails?.aadharNumber?.toString() != '') {
                const resp = await _getUUIDByAadharNumber(applicationDetails.aadharNumber.toString())
                logger.info(`<======== updateFirm - resp ========>, ${util.inspect(resp, { depth: null, colors: false })})`);
                if (resp.data?.status == "Success") {
                    applicationDetails.aadharNumber = resp.data.UUID
                }
                else {
                    return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                }
            }
            applicationDetails.applicationNumber = appNumber;
            const firmUnset: any = {
                isPartnerReplaced: false,
                isNewPartnerAdded: false,
                isPartnerDeleted: false,
                firmDissolved: false,
                isOtherAddressChange: false,
                isPartnerPermanentAddressChange: false,
                isFirmNameChange: false,
                isPrincipaladdressChange: false,
            }
            await _updateUnsetFirm(appId, firmUnset)
            const firmPayload: any = {
                applicantDetails: applicationDetails,
                contactDetails: req.body.contactDetails,
                firmDurationFrom: req.body.firmDurationFrom,
                firmDurationTo: req.body.firmDurationTo,
                atWill: req.body.atWill,
                industryType: req.body.industryType,
                bussinessType: req.body.bussinessType,
                principalPlaceBusiness: req.body.principalPlaceBusiness,
                otherPlaceBusiness: req.body.otherPlaceBusiness,
                firmPartners: partnerDetails,
                documentAttached: attachments,
                processingHistory: [],
                messageToApplicant: [],
                status: 'Incomplete',
                isdownload: false,
                firmStatus: 'Pending',
                paymentStatus: false,
                isResubmission: false,
                isPartnerReplaced: req.body.isPartnerReplaced == "true" ? true : false,
                isNewPartnerAdded: req.body.isNewPartnerAdded == "true" ? true : false,
                isPartnerDeleted: req.body.isPartnerDeleted == "true" ? true : false,
                firmDissolved: req.body.firmDissolved == "true" ? true : false,
                isOtherAddressChange: req.body.isOtherAddressChange == "true" ? true : false,
                isPartnerPermanentAddressChange: req.body.isPartnerPermanentAddressChange == "true" ? true : false,
                isFirmNameChange: req.body.isFirmNameChange == "true" ? true : false,
                isPrincipaladdressChange: req.body.isPrincipaladdressChange == "true" ? true : false,
                updatedBy: userSession.email,
                checkList: checkList,

                version: process.env.E_VERSION,
            }
            logger.info(`<======== updateFirm - firmPayload ========>, ${util.inspect(firmPayload, { depth: null, colors: false })})`);
            if (req.body.isResubmission) {
                // firmPayload.applicationNumber = 'FRA' + Date.now() + ((Math.random() * 100000).toFixed());
                firmPayload.isResubmission = true;
                firmPayload.paymentStatus = true;
                firmPayload.status = "Not viewed"
            }

            let newFirm = await _updateFirm(appId, firmPayload)


            //const newFirmPartners = await _createFirmPartners(partnerDetails)

            let applicantDetailses = newFirm?.applicantDetails;
            let firmPartnerses = newFirm?.firmPartners;
            if (applicantDetailses?.aadharNumber && applicantDetailses?.aadharNumber?.toString() != '') {
                const resp = await _getAadharNumberByUUID(applicantDetailses.aadharNumber.toString())
                if (resp.data?.status == "Success") {
                    applicantDetailses.aadharNumber = resp.data.UID
                }
                else {
                    return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                }
            }
            if (firmPartnerses != undefined && firmPartnerses?.length > 0) {
                for await (let pd of firmPartnerses) {
                    if (pd.aadharNumber?.toString() != "") {
                        const resp = await _getAadharNumberByUUID(pd.aadharNumber.toString())
                        if (resp.data?.status == "Success") {
                            pd.aadharNumber = resp.data.UID
                        }
                        else {
                            return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                        }
                    }
                }
            }
            return res.status(200).send({ message: 'Update Firm successfully done', success: true, data: { firm: { newFirm } } });
        }
        else if (req.body.formType === 'payment') {
            await _paymentResponseUpdate(appId, {}, "Not Viewed", true)
        }
    } catch (error: any) {
        logger.error(`error- ${error}`);
        if (error && error.name == "CastError") {
            return res.status(500).send({ message: `Please provide correct value for ${error.path}`, success: false, data: {} });
        }
        else {
            return res.status(500).send({ message: error, success: false, data: {} });
        }
    }
};

export const sendSMS = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const firm = await Firm.findById({ _id: id })
        if (!firm) {
            return res.status(404).send({ message: 'Firm does not exits!', success: false, data: {} });
        }
        const user = await User.findById({ _id: firm.userId })
        if (!user) {
            return res.status(404).send({ message: 'User does not exits!', success: false, data: {} });
        }

        const smsMessage = {
            number: user.mobileNumber,
            message: req.body.message,
            sentDate: moment().format(),
        }
        logger.info(`<======== sendSMS - smsMessage ========>, ${smsMessage}`);

        const result = await _sendSMS(id, userSession._id, smsMessage);
        logger.info(`<======== sendSMS - result ========>, ${result}`);
        return res.status(200).send({ message: 'SMS Sent successfully', success: true, data: {} });

    }
    catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
}
/*
export const processingHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const firm = await Firm.findById({ _id: id })
        if (!firm) {
            return res.status(404).send({ message: 'Firm does not exits!', success: false, data: {} });
        }

        const remarksData = {
            designation: userSession.userName,
            status: "Forwarded By DLF",
            remarks: req.body.remarks,
            attachements: [],
            applicationTakenDate: firm.createdAt,
            applicationProcessedDate: moment().format(),
        }
        
        const result = await _processingHistoryUpdate(id, userSession._id, remarksData);
        return res.status(200).send({ message: 'Remarks Saved successfully', success: true, data: { } });

    }
    catch (error) {
        console.log('error-', error);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

}
*/

export const RedirectPayment = async (req: Request, res: Response) => {

    res.writeHead(301, {

        'Location': `${process.env.REDIRECTURL}`

    }).end();
}
export const RedirectCertificate = async (req: Request, res: Response) => {

    res.writeHead(301, {

        'Location': `${process.env.REDIRECTCERTIFICATEURL}`

    }).end();
}
export const UpdateRegNo = async (req: Request, res: Response) => {
    const reqBody = req.body;
    try {
        let registrationNumber = reqBody.registrationNumber;
        let registrationYear = reqBody.registrationYear;
        const applicationNumber = 'SCR' + Date.now() + ((Math.random() * 100000).toFixed());
        const reqBodyFirm: any = {
            ...req.body,
            applicationNumber: applicationNumber,
            firmName: "firm",
            registrationYear: registrationYear,
            registrationNumber: registrationNumber,
            district: userSession.district,
            deptUpdatedBy: userSession._id,

            paymentStatus: true,
        }

        const firm = await _createFirm(reqBodyFirm);
        logger.info(`<======== UpdateRegNo - firm ========>, ${firm}`);
        console.log("reqBodyFirm", reqBodyFirm);
        logger.info(`<======== UpdateRegNo - reqBodyFirm ========>, ${reqBodyFirm}`);
        if (firm) {
            return res.status(200).send({
                success: true,
                message: 'Firm details saved successfully',
                data: {}
            });
        } else {
            return res.status(200).send({
                success: false,
                message: 'Internal error',
                data: {}
            });
        }


    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
}
export const FirmsDataEntry = async (req: Request, res: Response) => {
    try {

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const attachments = getDocs(files);
        if (attachments.length < 3) {
            return res.status(500).send({ message: `Please upload valid file attachment or only PDF type should be accepted`, success: false, data: {} });
        }
        attachments.forEach((x: any) => { x.destination = `./uploads/0`, x.path = `./uploads/0/${x.originalname}` })
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
            const applicationNumber = 'FRA' + Date.now() + ((Math.random() * 100000).toFixed());
            let registrationNumber: any = 1;
            let registrationYear = req.body.registrationYear;
            const firmData: any = await Firm.findOne({ registrationYear: registrationYear, district: userSession.district }, { registrationNumber: 1, registrationYear: 1, district: 1 }).sort({ registrationNumber: -1 })
            if (firmData && firmData.registrationNumber > 0 && firmData.registrationYear == registrationYear && firmData.district == userSession.district) {
                registrationNumber = firmData.registrationNumber + 1;
            }

            const reqBodyFirm = { ...req.body, userId: user._id, applicationNumber: applicationNumber, registrationNumber: registrationNumber, paymentStatus: true, approvedRejectedById: userSession._id, deptUpdatedBy: userSession._id, documentAttached: attachments }
            logger.info(`<======== FirmsDataEntry - reqBodyFirm ========>, ${reqBodyFirm}`);
            const firm = await _createFirm(reqBodyFirm);
            logger.info(`<======== FirmsDataEntry - firm ========>, ${firm}`);
            if (firm) {
                const remarksData = {
                    designation: userSession.userName,
                    status: req.body.status,
                    remarks: "",
                    attachements: [],
                    applicationTakenDate: req.body.applicationProcessedDate,
                    applicationProcessedDate: req.body.applicationProcessedDate,
                }
                const result = await _processingHistoryUpdate(firm._id, userSession._id, remarksData);
                return res.status(200).send({
                    success: true,
                    message: 'Firm details saved successfully',
                    data: {}
                });
            }
            else {
                return res.status(200).send({
                    success: false,
                    message: 'Internal error',
                    data: {}
                });
            }
        }
    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
}
export const processingHistory = async (req: Request, res: Response) => {
    try {
        if (!req.body.remark) {
            return res.status(404).send({ message: 'Remark data is not allowed to be empty', success: false, data: {} });
        }
        let bytesreq = CryptoJS.AES.decrypt(req.body.remark, process.env.SECRET_KEY);
        let remarkData = JSON.parse(bytesreq.toString(CryptoJS.enc.Utf8));
        let firmId = remarkData.id;
        const reg = /^[A-Za-z\s]*$/;
        if (!remarkData.remarks) {
            return res.status(404).send({ message: 'Remarks is not allowed to be empty', success: false, data: {} });
        } else if (remarkData.remarks && !reg.test(remarkData.remarks)) {
            return res.status(404).send({ message: 'Remarks format is invalid!', success: false, data: {} });
        } else if (req.body.status && !reg.test(req.body.status)) {
            return res.status(404).send({ message: 'Status format is invalid!', success: false, data: {} });
        }
        const firm: any = await Firm.findById({ _id: firmId })
        if (!firm) {
            return res.status(404).send({ message: 'Firm does not exits!', success: false, data: {} });
        }
        if (remarkData.status == "Approved" && firm.status == "Rejected") {
            return res.status(404).send({ message: `Firm is already rejected you cannot approve it`, success: false, data: {} });
        }
        else if (remarkData.status == "Rejected" && firm.status == "Approved") {
            return res.status(404).send({ message: `Firm is already approved you cannot reject it`, success: false, data: {} });
        }
        else if ((!remarkData.status || remarkData.status == "Forwarded") && (firm.status == "Approved" || firm.status == "Rejected")) {
            return res.status(404).send({ message: `Firm is already approved you cannot forward it`, success: false, data: {} });
        }
        else if (userSession.role == "DR" && remarkData.status == "Forwarded") {
            return res.status(404).send({ message: `Firm status cannot be changed to forward`, success: false, data: {} });
        }
        else if (userSession.role != "DR" && (remarkData.status == "Approved" || remarkData.status == "Rejected")) {
            return res.status(404).send({ message: `Firm status cannot be changed to approved/rejected`, success: false, data: {} });
        }
        else if (firm.district?.toLowerCase() != userSession.district?.toLowerCase()) {
            return res.status(404).send({ message: `Firm status cannot be updated`, success: false, data: {} });
        }
        let status = "Forwarded By DLF";
        let applicationStatus = 'Forwarded';
        let firmStatus = 'Pending';
        if (remarkData.status) {
            status = remarkData.status;
            applicationStatus = remarkData.status;
            let payload;
            if (remarkData.status == "Approved") {
                //firmStatus = 'Active';


                let registrationNumber: any = 1;
                let registrationYear: any = moment().format('YYYY');
                if ((!firm.registrationNumber || firm.registrationNumber <= 0) && firm.district == userSession.district) {
                    let registrationYear = moment().format('YYYY');
                    const firmData: any = await Firm.findOne({ registrationYear: registrationYear, district: userSession.district }, { registrationNumber: 1, registrationYear: 1, district: 1 }).sort({ registrationNumber: -1 })
                    console.log('<============= firmData =============>', firmData);
                    logger.info(`<======== processingHistory - firmData ========>, ${firmData}`);


                    if (firmData && firmData.registrationNumber > 0 && firmData.registrationYear == registrationYear && firmData.district == userSession.district) {
                        registrationNumber = firmData.registrationNumber + 1;
                    }
                    console.log('<============= registrationNumber =============>', registrationNumber);
                }
                else {
                    registrationNumber = firm.registrationNumber ? firm.registrationNumber : '';
                    registrationYear = firm.registrationYear ? firm.registrationYear : '';
                }

                payload = {
                    status: 'Approved',
                    firmStatus: 'Active',
                    isNameChanged: 'false',
                    isMemberChanged: 'false',
                    registrationNumber: registrationNumber,
                    registrationYear: registrationYear,
                    approvedRejectedById: userSession._id,
                }
                logger.info(`<======== processingHistory - payload ========>, ${payload}`);

            }
            else {
                payload = {
                    status: status,
                    firmStatus: 'Pending'
                }
            }

            await _updateFirm(firmId, payload);
        }
        else {
            let payload = {
                status: applicationStatus,
                firmStatus: 'Pending',
            }
            await _updateFirm(firmId, payload);
        }

        const remarksData = {
            designation: userSession.userName,
            status: status,
            remarks: remarkData.remarks,
            attachements: [],
            applicationTakenDate: moment(firm.createdAt).format('YYYY-MM-DD'),
            applicationProcessedDate: moment().format(),
        }

        console.log("<===========  remarksData  ==========>", remarksData);
        logger.info(`<======== processingHistory - remarksData ========>, ${remarksData}`);

        const result = await _processingHistoryUpdate(firmId, userSession._id, remarksData);
        logger.info(`<======== processingHistory - result ========>, ${result}`);
        return res.status(200).send({ message: 'Remarks Saved successfully', success: true, data: {} });

    }
    catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

};

export const makeExcel = async (firms: any) => {
    const path = Path.join(__dirname, "../../../downloads/firms");
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Sheet 1');
    var headerStyle = wb.createStyle({
        font: {
            color: '#000000',
            size: 14,
            bold: true
        }
    });
    var rowsStyle = wb.createStyle({
        font: {
            color: '#000000',
            size: 12
        }
    });

    ws.cell(1, 1).string("SNo").style(headerStyle);
    ws.cell(1, 2).string("Application No").style(headerStyle);
    ws.cell(1, 3).string("Firm Name").style(headerStyle);
    ws.cell(1, 4).string("District Name").style(headerStyle);
    ws.cell(1, 5).string("Application Date").style(headerStyle);
    ws.cell(1, 6).string("Status").style(headerStyle);

    for (let i = 0; firms && i < firms.length; i++) {
        ws.cell(i + 2, 1).number(i + 1).style(rowsStyle);
        ws.cell(i + 2, 2).string(firms[i].applicationNumber).style(rowsStyle);
        ws.cell(i + 2, 3).string(firms[i].firmName).style(rowsStyle);
        ws.cell(i + 2, 4).string(firms[i].district).style(rowsStyle);
        ws.cell(i + 2, 5).string(firms[i].createdAt.toString()).style(rowsStyle);
        ws.cell(i + 2, 6).string(firms[i].status).style(rowsStyle);
    }

    const fileName = "Firms_" + moment().format('YYYYMMDDhmmss') + ".xlsx";

    wb.write("downloads/firms/" + fileName);
    return fileName;


}

export const makePdf = async (societies: any) => {
    let doc;
    try {
        //let Url = "http://localhost/pdfs";
        const path = Path.join(__dirname, "../../../../../downloads/firms");
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        // const doc = new PDFKitDocument({size: 'A4'});
        doc = new PDFKitDocument({ size: 'A4' });
        const fileNameValue = "Firms_" + moment().format('YYYYMMDDhmmss');

        console.log("<=== fileNameValue ===>", fileNameValue);

        doc.pipe(fs.createWriteStream(`${path}/${fileNameValue}.pdf`));
        let rowsValues = [];
        for (let i = 0; societies && i < societies.length; i++) {
            let indRow = [];
            indRow.push(i + 1);
            indRow.push(societies[i].applicationNumber)
            indRow.push(societies[i].FirmName)
            indRow.push(societies[i].district)
            indRow.push(societies[i].createdAt.toString())
            indRow.push(societies[i].status)
            rowsValues.push(indRow)
        }

        const table = {
            title: "Firms",
            headers: ["SNo", "Application No", "Firm Name", "District Name", "Application Date", "Status"],
            rows: rowsValues,
        };
        console.log()
        await doc.table(table, {
            height: 300,
            columnsSize: [25, 125, 150, 50, 125, 50],
            boundary: true
        });
        doc.end();
        //await new Promise(res => setTimeout(res, 1000));
        //const bitmap = fs.readFileSync(`${path}/${fileNameValue}.pdf`);
        return fileNameValue + ".pdf";
    } catch (ex) {
        if (doc != undefined && doc != null)
            doc.end();
        logger.error(`error- ${ex}`);
        return null;
    }
}

export const downloadFirms = async (req: Request, res: Response) => {
    try {

        if (userSession.district) {
            const { downloadType } = req.query;

            console.log("<=== downloadType ===>", downloadType);
            logger.info(`<======== downloadFirms - downloadType ========>, ${downloadType}`);

            const { firms, totalCount } = await _getAllFirms(req, userSession.district);

            let downloadLink;
            if (downloadType == 'pdf') {
                downloadLink = await makePdf(firms);
            }
            else if (downloadType == 'xls') {
                downloadLink = await makeExcel(firms);
            }
            else {
                return res.status(200).send({ message: 'downloadType not found', success: false, data: {} });
            }

            let fullDownloadUrl = `${downloadUrl}/firms/${downloadLink}`;
            logger.info(`<======== downloadFirms - fullDownloadUrl ========>, ${fullDownloadUrl}`);
            return res.status(200).send({ message: 'Download successfully done', success: true, data: { downloadUrl: fullDownloadUrl } });
        }
        else {
            return res.status(401).send({ success: false, message: "Invalid User", data: {} });
        }

    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

}

export const getallFirms = async (req: Request, res: Response) => {
    try {

        if (userSession.district) {
            const { firms, totalCount } = await _getAllFirms(req, userSession.district);
            const data = CryptoJS.AES.encrypt(JSON.stringify({ message: 'Get Firms details successfully done', success: true, data: { firms, totalCount } }), process.env.SECRET_KEY).toString();

            return res.status(200).send(data);
        }
        else {
            const data = CryptoJS.AES.encrypt(JSON.stringify({ success: false, message: "Invalid User", data: {} }));
            return res.status(401).send(data);
        }

    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

}
/*
export const getallFirms = async (req: Request, res: Response) => {
    try {
        const sort = '_id';
        const perPage: any = req.query ? req.query.perPage : 10;
        const page: any = req.query ? req.query.page : 1;
        const skip: any = (parseInt(page) - 1) * parseInt(perPage);
        let fromDate:any = req.query.from ? req.query.from : '';
        if(fromDate) {
            fromDate = moment(fromDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
        }
        
        let toDate:any = req.query.to ? req.query.to : '';
        if(toDate) {
            toDate = moment(toDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
        } else {
            toDate = moment().format('YYYY-MM-DD');
        }
        
        const status = req.query.status;
        const limit = parseInt(perPage);
        
        
        const filterAndCond = [];
        const filerOrCond = [];
        
        if(fromDate && toDate) {
            filterAndCond.push({ createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) } } );
        } 
        if(status) {
            filerOrCond.push({"status": { $regex: status, $options: "i" }});
 
        }
        
        const filterObject:any = {};
        if(filterAndCond.length) {
            filterObject['$and'] = filterAndCond;
        }
        if(filerOrCond.length) {
            filterObject['$or'] = filerOrCond;
        }
        const { firms, totalCount } = await _getAllFirms(filterObject, skip, limit);
 
        return res.status(200).send({ message: 'Get Firms details successfully done', success: true, data: { firms, totalCount } });
    } catch (error) {
        console.log(error)
        return res.status(500).send({ message: error, success: false, data: {} });
    }
 
}
*/
export const getFirm = async (req: Request, res: Response) => {
    try {

        const id = Buffer.from(req.params.id, 'base64').toString();
        if (!ObjectId.isValid(id)) {
            return res.status(404).send({ message: `Firm id not found`, success: false, data: {} });
        }

        let firm: any = await _getFirm(id);

        if (firm.district != userSession.district) {
            return res.status(404).send({ message: `Firm details are not accessable for this user`, success: false, data: {} });
        }
        if (firm?.status === 'Not Viewed') {
            if (userSession.role == 'DLF' || userSession.role == 'DR') {
                const payload = {
                    status: 'Open'
                }
                firm = await _updateFirm(firm._id, payload);
            }
        }

        if (!firm) {
            return res.status(404).send({ message: `Firm details are not found for ${id}`, success: false, data: {} });
        }
        let applicantDetails = firm.applicantDetails;
        let firmPartners = firm.firmPartners;
        if (applicantDetails?.aadharNumber && applicantDetails?.aadharNumber?.toString() != null) {
            const resp = await _getAadharNumberByUUID(applicantDetails.aadharNumber.toString())
            if (resp.data?.status == "Success") {
                applicantDetails.aadharNumber = resp.data.UID
            }
            else {
                return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
            }
        }
        if (firmPartners?.length > 0) {
            for await (let pd of firmPartners) {
                if (pd.aadharNumber?.toString() != "") {
                    const resp = await _getAadharNumberByUUID(pd.aadharNumber.toString())
                    if (resp.data?.status == "Success") {
                        pd.aadharNumber = resp.data.UID
                    }
                    else {
                        return res.status(500).send({ message: 'Aadhaar service is not working. Please try after sometime', success: false, data: {} });
                    }
                }
            }
        }

        //firm={...firm,firmPartners:partners,applicantDetails:applicantDetails}
        const data = CryptoJS.AES.encrypt(JSON.stringify({ message: 'Get Firm details successfully done', success: true, data: { firm } }), process.env.SECRET_KEY).toString();
        return res.status(200).send(data);
    } catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }

};

export const downloadFile = async (req: Request, res: Response) => {

    try {
        const { id, fileName } = req.params;


       
        const path = process.env.FILE_DIR_PATH + `uploads/${id}/${fileName}`;
console.log("pathdata:::::::::::",path)
logger.info(`<======== downloadFile - path ========>, ${path}`);
        if (fs.existsSync(path)) {

            console.log("<==== path ====>", path);

            const file = fs.createReadStream(path)
            var stat = fs.statSync(path);
            const filename = fileName;//(new Date()).toISOString()
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
            file.pipe(res);
        }
        else {
            return res.status(500).send();
        }

    }
    catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
}

export const downloadsHistory = async (req: Request, res: Response) => {
    try {
        const payload = {
            amount: req.body.amount,
            downloadDate: moment().format(),
        }

        await downloadFirmHistory(req.params.id, payload, req.body.appId);

        return res.status(200).send({ message: 'Downloads saved successfully', success: true, data: {} });

    }
    catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
}

export const reports = async (req: Request, res: Response) => {
    try {

        let approved = 0;
        let rejected = 0;
        let notViewed = 0;
        let forwarded = 0;
        let open = 0;

        const firms = await Firm.find({ district: userSession.district, status: { $ne: 'Incomplete' } }, { status: 1 })

        firms.forEach(firm => {
            if (firm.status == 'Approved')
                approved += 1;
            if (firm.status == 'Rejected')
                rejected += 1;
            if (firm.status == 'Not Viewed')
                notViewed += 1;
            if (firm.status == 'Forwarded')
                forwarded += 1;
            if (firm.status == 'Open')
                open += 1;

            console.log("<========  firm  ========>", firm);
        });

        console.log("<========  approved  ========>", approved);
        logger.info(`<======== reports - approved ========>, ${approved}`);
        console.log("<========  rejected  ========>", rejected);
        logger.info(`<======== reports - rejected ========>, ${rejected}`);
        console.log("<========  notViewed  ========>", notViewed);
        logger.info(`<======== reports - notViewed ========>, ${notViewed}`);
        console.log("<========  forwarded  ========>", forwarded);
        logger.info(`<======== reports - forwarded ========>, ${forwarded}`);
        console.log("<========  open  ========>", open);
        logger.info(`<======== reports - open ========>, ${open}`);

        const reports = {
            district: userSession.district,
            approved: approved,
            rejected: rejected,
            notViewed: notViewed,
            forwarded: forwarded,
            open: open
        }
        logger.info(`<======== reports - reports ========>, ${reports}`);

        return res.status(200).send({ message: 'Reports generated successfully', success: true, data: { reports } });

    }
    catch (error) {
        logger.error(`error- ${error}`);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
}

/*
export const createFirm = async (req: Request, res: Response) => {
    try {
 
        //console.log("<====   userSession  =======>", userSession);
        //console.log("<====   Request  =======>", req.body);
 
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const attachments = getDocs(files);
        if(attachments.length < 5) {
            return res.status(500).send({ message: `Please upload valid file attachment or only .pdf type should be accepted`, success: false, data: {} });
        }
        const firmDetails = req.body.firmDetails;
        firmDetails.firmDurationFrom = firmDetails.firmDurationFrom ? moment(firmDetails.firmDurationFrom, 'DD/MM/YYYY').format('YYYY-MM-DD') : '';
        firmDetails.firmDurationTo = moment(firmDetails.firmDurationTo, 'DD/MM/YYYY').format('YYYY-MM-DD');
        let partnerDetails = req.body.partnerDetails;
        if(partnerDetails && partnerDetails.length) {
            partnerDetails = partnerDetails.map((pd: any) => {
                if(pd.joiningDate) {
                    pd.joiningDate = moment(pd.joiningDate, 'DD/MM/YYYY').format('YYYY-MM-DD')
                }
                return pd;
            });
        }
        
        let processingHistory = req.body.processingHistory;
        if(processingHistory && processingHistory.length) {
            processingHistory = processingHistory.map((ph: any) => {
                if(ph.applicationTakenDate) {
                    ph.applicationTakenDate = moment(ph.applicationTakenDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
                }
                if(ph.applicationProcessedDate) {
                    ph.applicationProcessedDate = moment(ph.applicationProcessedDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
                }
                return ph;
            });
        }
        const applicationDetails = req.body.applicantDetails;
        applicationDetails.applicationNumber = appNumber;
        const firmPayload: Firm = {
            userId: userSession._id,
            applicantDetails: applicationDetails,
            addressDetails: req.body.addressDetails,
            contactDetails: req.body.contactDetails,
            firmDetails: firmDetails,
            principalPlaceBusiness: req.body.principalPlaceBusiness,
            documentAttached: attachments,
            processingHistory: [],
            messageToApplicant: []
        }
        let newFirm = await _createFirm(firmPayload)
 
        partnerDetails = partnerDetails.map((pd: any) => {
            pd.firmId = newFirm._id;
            return pd;
        });        
 
        const newFirmPartners = await _createFirmPartners(partnerDetails)
 
        return res.status(200).send({ message: 'Create Firm successfully done', success: true, data: { firm: {newFirm, partnerDetails: newFirmPartners} } });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
 
}
 
export const updateFirms = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firm = await Firm.findById({ _id: id })
        if (!firm) {
            return res.status(404).send({ message: 'Firm does not exits!', success: false, data: {} });
        }
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const attachments = getDocs(files);
        const firmUpdatePayload: Firm = {
            userId: userSession._id,
            applicantDetails: req.body.applicantDetails,
            addressDetails: req.body.addressDetails,
            contactDetails: req.body.contactDetails,
            firmDetails: req.body.firmDetails,
            principalPlaceBusiness: req.body.principalPlaceBusiness,
            documentAttached: attachments,
        }
        const result = await _updateFirm(id, firmUpdatePayload);
        return res.status(200).send({ message: 'Update Firm successfully done', success: true, data: { firm: result } });
 
    }
    catch (error) {
        console.log('error-', error);
        return res.status(500).send({ message: error, success: false, data: {} });
    }
 
}
 
export const deleteFirm = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await _deleteFirm(id);
        return res.status(200).send({ message: 'Delete Firm successfully done', success: true, data: { firm: result } });
    } catch (error) {
        return res.status(500).send({ message: error, success: false, data: {} });
    }
 
}
*/

const dateTimeInFormat = (formatType = 1) =>  {
        let date_time =  new Date();

        let date = ("0" + date_time.getDate()).slice(-2);
        let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
        let year = date_time.getFullYear();

        let hours = ("0" + date_time.getHours()).slice(-2);
        let minutes = ("0" + date_time.getMinutes()).slice(-2);
        let seconds = ("0" + date_time.getSeconds()).slice(-2);

        if (formatType == 1) {
            return date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
        } else if (formatType == 2) {
            let month_names_short = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return date + "-" + month_names_short[date_time.getMonth()] + "-" + ("0" + date_time.getFullYear()).slice(-2);
        }

        return "";
}



const encryptWithAESPassPhrase = (originalText: string, passphrase: string) => {
    const encryptedText = CryptoJs.AES.encrypt(originalText, passphrase).toString();
    return encryptedText;
};


export * as FirmController from './FirmController';


function ISODate(firmDurationFrom: any) {
    throw new Error('Function not implemented.');
}

