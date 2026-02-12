import express, { Request, Response } from 'express';
import { User, Firm, Districts, DistrictsInformation } from '../../models/index'
import { _checkUser, createUser, _checkUserAadhar } from '../../services/UserService';
import {generateJWTToken} from '../../utils/functions'
import { _checkFirm, _createFirm } from '../../services/FirmsService';
import { logger } from '../../logger';

export const getDistricts = async (req: Request, res: Response) => {
    try {
        const districts = await Districts.find({}).sort({"name": 1});
        return res.json(districts);
    } catch(error) {
        logger.error(`getDistricts- ${error}`);
        return res.status(500).json(error);
    }
}

export const getDistrictsMandals = async (req: Request, res: Response) => {
    try {
        const {districtName} = req.body;
        const districtMandals = await DistrictsInformation.find({districtName: districtName},{districtName:1, mandalName:1, _id:0}).sort({"mandalName": 1});

        const districtMandalsUnique = districtMandals.filter((obj, index) => {
            return index === districtMandals.findIndex(o => obj.districtName === o.districtName && obj.mandalName === o.mandalName);
          });

        return res.json(districtMandalsUnique);
    } catch(error) {
        logger.error(`getDistrictsMandals- ${error}`);
        return res.status(500).json(error);
    }
}

export const getDistrictsMandalVillages = async (req: Request, res: Response) => {
    try {
        const {districtName, mandalName} = req.body;
        const districtMandalVillages = await DistrictsInformation.find({districtName: districtName, mandalName:mandalName},{districtName:1, mandalName:1, villageName:1, _id:0}).sort({"villageName": 1});

        const districtMandalVillagesUnique = districtMandalVillages.filter((obj, index) => {
            return index === districtMandalVillages.findIndex(o => obj.districtName === o.districtName && obj.mandalName === o.mandalName &&obj.villageName!=null && obj.villageName === o.villageName);
          });
        
        return res.json(districtMandalVillagesUnique);
    } catch(error) {
        logger.error(`getDistrictsMandalVillages- ${error}`);
        return res.status(500).json(error);
    }
}

export const getDistrictDdoCode = async (req: Request, res: Response) => {
    try {
        const {districtName} = req.body;
        const districtMandals = await Districts.find({name: districtName},{name:1, ddoCode:1, code:1, _id:0});
        return res.json(districtMandals);
    } catch(error) {
        logger.error(`getDistrictDdoCode- ${error}`);
        return res.status(500).json(error);
    }
}

export * as MasterController from './MasterController';