import express, { Request, Response } from 'express';
import { PaymentsInformation } from '../../models/index'
import { _paymentResponseUpdate } from '../../services/FirmsService';
import { Firm } from '../../models/index';
import { logger } from '../../logger';
const util = require('util');

export const getPaymentDetails = async (req: Request, res: Response) => {
    try {
        const applicationNumber = req.params.id;
        const paymentDetails = await PaymentsInformation.findOne({applicationNumber: applicationNumber}).sort({createdAt: -1});
        //return res.json(paymentDetails);
        logger.info(`<======== getPaymentDetails - paymentDetails  ========>, ${util.inspect(paymentDetails, { depth: null, colors: false })})`);
        return res.status(200).send({ message: 'Payment Details Fetched Successfully', success: true, data: {paymentDetails: paymentDetails} });
    } catch(error) {
        logger.error(`getPaymentDetails- ${error}`);
        return res.status(500).json(error);
    }
}

export const paymentResponseDetails = async (req: Request, res: Response) => {
    try {
        const paymentResponseData = {
            applicationNumber: req.body.applicationNumber,
            departmentTransID: req.body.departmentTransID,
            cfmsTransID: req.body.cfmsTransID,
            transactionStatus: req.body.transactionStatus,
            amount: req.body.amount,
            totalAmount: req.body.totalAmount,
            paymentMode: req.body.paymentMode,  
            bankTransID: req.body.bankTransID,
            bankTimeStamp: req.body.bankTimeStamp,
            isUtilized: req.body.isUtilized,
            createdAt: req.body.createdAt
        }
        logger.info(`<======== paymentResponseDetails - paymentResponseData  ========>,${util.inspect(paymentResponseData, { depth: null, colors: false })})`);
        let status = 'Incomplete';
        let paymentStatus = false;
        if(req.body.transactionStatus == "Success")
        {
            status = 'Not Viewed';
            paymentStatus = true;
        }
        
        console.log("<=====  paymentResponseData  =====>", paymentResponseData);

        const paymentDetails = await _paymentResponseUpdate(req.params.id, paymentResponseData, status, paymentStatus);
        logger.info(`<======== getPaymentDetails - paymentDetails  ========>,${util.inspect(paymentDetails, { depth: null, colors: false })})`);
        return res.status(200).send({ message: 'Payment Response Details Saved Successfully', success: true, data: {}});
    } catch(error) {
        logger.error(`paymentResponseDetails- ${error}`);
        return res.status(500).json(error);
    }
}

export const confirmDephaseTransaction = async (req: Request, res: Response) => {
    try {
       let check =  await PaymentsInformation.findOneAndUpdate(
            { departmentTransID: req.params.id },
            {
                isUtilized: true
            },
        );
        logger.info(`<======== confirmDephaseTransaction - check  ========>,${util.inspect(check, { depth: null, colors: false })})`);
       let result = await Firm.findOneAndUpdate(
            { "paymentDetails.departmentTransID": req.params.id },
            {
                "paymentDetails.$.isUtilized": true
            },
        );
        logger.info(`<======== confirmDephaseTransaction - result  ========>,${util.inspect(result, { depth: null, colors: false })})`);

        return res.status(200).send({ message: 'Dephase Saved Successfully', success: true, data: {}});
    } catch(error) {
        logger.error(`confirmDephaseTransaction- ${error}`);
        return res.status(500).json(error);
    }
}

export * as PaymentController from './PaymentController';