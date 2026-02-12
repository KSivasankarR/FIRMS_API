import { Document, ObjectId, Schema } from 'mongoose';
import { Request } from "express";
import { FirmPartners } from './Firm.Partners.types';
export interface Firm {
    userId?: Schema.Types.ObjectId,
    firmName: string,
    firmDurationFrom: string,
    firmDurationTo: string,
    atWill: boolean,
    industryType: string,
    bussinessType: string,
    firmNameEffectDate?: Date,
    applicationNumber: string,
    dissolveDate?: Date,
    newNameEffectDate?: Date,
    applicantDetails: {
        aadharNumber: string,
        name: string,
        surName: string,
        gender: string,
        relation: string,
        relationType: string,
        role: string,
        doorNo: string,
        street: string,
        district: string,
        mandal: string,
        villageOrCity: string,
        pinCode: number,
        state: string,
        country: string,
        age: number,
    },
    contactDetails: {
        landPhoneNumber?: number,
        mobileNumber: number,
        faxNumber?: number,
        email: string,
    },
    principalPlaceBusiness?: Array<PrincipalPlaceBusiness>;
    otherPlaceBusiness?: Array<OtherPlaceBusiness>;
    firmPartners?: Array<FirmPartners>,
    messageToApplicant?: Array<messageToApplicant>
    documentAttached?: Array<any>,
    processingHistory?: Array<ProcessingHistory>,
    createdAt?: Date,
    updatedAt?: Date,
    createdBy?: string,
    updatedBy?: string,
    version?: number,
    IPAddress?: string
    firmStatus: string,
    isFirmDissolved: boolean,
    paymentDetails: Array<paymentDetails>,
    historyDetails: Array<any>,
    isdownload: boolean,
    isByLawDownload: boolean,
    downloadsHistory: Array<any>,
    registrationNumber: number,
    registrationYear: number,
    isFirmNameChange: boolean,
    isPrincipaladdressChange: boolean,
    isOtherAddressChange: boolean,
    isPartnerPermanentAddressChange: boolean,
    isNewPartnerAdded: boolean,
    isPartnerDeleted: boolean,
    isPartnerReplaced: boolean,
    firmDissolved: boolean,
    status: string,
    paymentStatus: boolean,
    isResubmission: boolean,
    esignStatus: string,
    esignTxnId: string,
    approvedRejectedById?: Schema.Types.ObjectId,
    isLegacyDataUpdate: boolean,
    isLegacyData: string
}

export interface paymentDetails {
    applicationNumber: string,
    departmentTransID: string,
    cfmsTransID: number,
    transactionStatus: string,
    amount: number,
    totalAmount: number,
    paymentMode: string,
    bankTransID: number,
    bankTimeStamp: Date,
    isUtilized: boolean,
    createdAt: Date
}
export interface PrincipalPlaceBusiness {
    dateOfChange: Date,
    remarks: String,
    placeParticulars: String,
    doorNo: string,
    street: string,
    country: string,
    state: string,
    district: string,
    mandal: string,
    villageOrCity: string,
    pinCode: number,
    effectiveDate: Date,
    branch: string,
    type: string,
}

export interface OtherPlaceBusiness {
    ceasingDate: Date,
    placeName:string,
    openingDate:Date,
    doorNo: string,
    street: string,
    country: string,
    state: string,
    district: string,
    mandal: string,
    villageOrCity: string,
    pinCode: number,
    effectiveDate: Date,
    branch: string,
}
export interface AddressDetails {
    doorNo: string,
    street: string,
    country: string,
    state: string,
    district: string,
    mandal: string,
    villageOrCity: string,
    pinCode: number,
};

export interface PartnerDetails {
    partnerName: string,
    partnerSurname: string,
    age: number,
    joiningDate: string,
    partnerAddress: string,
}

export interface messageToApplicant {
    number: string,
    message: string,
    sentDate: string,
}
export interface ProcessingHistory {
    designation: string,
    status: string,
    remarks: string,
    attachements: Array<DocumentAttached>,
    applicationTakenDate: string,
    applicationProcessedDate: string,
}

export interface DocumentAttached extends Firm, Document {
    id: string
}

export interface checkList {
    isPartnershipDeedDoc: boolean,
    isAffidvitOrLeaseAgreementDoc: boolean,
    isSelfSignDeclarationDoc: boolean,
    isForm1DigitalSignDoc: boolean,
}