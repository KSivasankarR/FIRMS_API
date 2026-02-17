import express, { Request, Response } from 'express';
import { User, Firm } from '../../models/index'
import { _checkAvailability } from '../../services/NationalEmblemPreventionService';
import { logger } from '../../logger';




export const checkAvailability = async(req: Request, res: Response) =>{

    const {registrationName} = req.body;
    console.log("<========  userCheck Start  ========>");
    const firmCheck = await _checkAvailability(registrationName);
    console.log("<========  userCheck  ========>", firmCheck);
    logger.info("<======== checkAvailability- firmCheck  ========>", firmCheck);

    if(firmCheck.length) {
        return res.status(200).send({
            success: false,
            message: 'Name is not available under national emblem act',
            data: {}
        });              
    }
    else{
        return res.status(200).send({
            success: true,
            message: 'Name is available',
            data: {}
        });              

    }
};




export * as NationalEmblemPreventionController from './NationalEmblemsPreventionController';