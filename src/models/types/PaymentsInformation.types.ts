import { Document, Schema } from 'mongoose';

export interface PaymentsInformation {
    id: string,
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