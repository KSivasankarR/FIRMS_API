import { Document, Schema } from 'mongoose';

export interface User {
    id: string,
    firstName: string,
    lastName: string,
    password: string,
    email: string,
    alternateEmail: string,
    mobileNumber: number,
    aadharNumber: string,
    registrationType: string,
    status: string
    lastLogin: Date,
    token:string,
    district:string,
    createdBy?:string,
    updatedBy?:string,
    version?:number,
    IPAddress?:string
}