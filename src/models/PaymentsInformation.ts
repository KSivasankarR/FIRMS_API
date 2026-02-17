import mongoose, { Schema } from 'mongoose';
import  {PaymentsInformation}  from './types';
import moment from 'moment';
const now = moment().format();

const { Types: { ObjectId } } = Schema
const paymentsInformationSchema: Schema = new Schema({
    applicationNumber: { type: String },
    departmentTransID: { type: String},
    cfmsTransID: { type: Number},
    transactionStatus: { type: String},
    amount: { type: Number},
    totalAmount: { type: Number},
    paymentMode: { type: String},
    bankTransID: { type: Number},
    bankTimeStamp: { type: Date},
    isUtilized: { type: Boolean},
    createdAt: { type: Date}
});

paymentsInformationSchema.pre('save', async function (next) {
    try{
        next();
    } catch (err) { console.error(err); }
});

const PaymentsInformation = mongoose.model<PaymentsInformation>('PaymentsInformation', paymentsInformationSchema, 'paymentreceipts');
export default PaymentsInformation;