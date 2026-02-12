import { Document, Schema } from 'mongoose';

export interface UserLogs {
    id: string,
    userName: string,
    email: string,
    createdBy:string,
    version:number,
    IPAddress:string
}