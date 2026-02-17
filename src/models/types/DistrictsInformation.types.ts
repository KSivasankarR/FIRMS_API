import { Document, Schema } from 'mongoose';

export interface DistrictsInformation {
    id: string,
    stCode: number,
    districtName: string,
    revMandalCode: number,
    mandalName: string,
    revVillageCode: number,
    villageName: string,
    villageScretariatCode: number,
    villageScretariatName: string,
    parentSroCode: number,
    sroName: string,
    psName: string,
    psAdhaarNo: number,
    psMobileNo: number,
    vroName: string,
    vroAdhaarNo: number,
    vroMobile: number,
    gswsSystemMacAddress: number,
}