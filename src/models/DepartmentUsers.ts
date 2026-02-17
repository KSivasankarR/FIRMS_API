import mongoose, { Schema } from 'mongoose';
import  {DepartmentUsers}  from './types';
import moment from 'moment';
const now = moment().format();

const { Types: { ObjectId } } = Schema
const departmentUsersSchema: Schema = new Schema({
    fullName: { type: String},
    userName: { type: String, require: true,
        index: {
            unique: true
        },   
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        index: {
            unique: true
        },
        required: true,
    },
    password: { type: String, require: true  },
    mobileNumber: { type: Number},
    role: { type: String, require: true },
    district: { type: String, require: true },
    signature: { type: String},
    status: { type: String, default:'Active' },
    loginAttemptTime:{type:Date},
    loginAttemptCount:{type:Number},
    lastLogin:{type:Date},
    token:{type:String},
    createdBy:{type:String},
    updatedBy:{type:String},
    version:{type:Number},
    IPAddress:{type:String},
    isPasswordChanged: { type: Boolean, default: false },
    aadharUUID: { type: String},
},
{
    timestamps: true
});

departmentUsersSchema.pre('save', async function (next) {
    try{
        this.updatedAt = now;
        next();
    } catch (err) { console.error(err); }
});

const DepartmentUsers = mongoose.model<DepartmentUsers>('DepartmentUsers', departmentUsersSchema, 'departmentUsers');
export default DepartmentUsers;