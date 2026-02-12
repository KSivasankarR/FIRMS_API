import mongoose, { Schema } from 'mongoose';
import { User } from './types';
import moment from 'moment';
const now = moment().format();
const saltRounds = 10;

const { Types: { ObjectId } } = Schema
const userSchema: Schema = new Schema({
    firstName: { type: String, require: true },
    lastName: { type: String, require: true },
    password: { type: String, require: true },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    alternateEmail: {
        type: String
    },
    mobileNumber: { type: Number, require: true },
    aadharNumber: { type: String, require: true },
    registrationType: { type: String, require: true },
    status: { type: String, default: 'Active' },
    lastLogin: { type: Date, default: now },
    token: { type: String },
    district: { type: String },
    createdBy:{type:String},
    updatedBy:{type:String},
    version:{type:Number},
    IPAddress:{type:String}
},
    {
        timestamps: true
    });

userSchema.pre('save', async function (this: User) {
    try {

    } catch (err) { console.error(err); }


});

const User = mongoose.model<User>('User', userSchema);
export default User;
