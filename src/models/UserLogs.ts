import mongoose, { Schema } from 'mongoose';

import { UserLogs } from './types/UserLogs.types';

import moment from 'moment';

const now = moment().format();



const { Types: { ObjectId } } = Schema

const userLogsSchema: Schema = new Schema({

    userName: { type: String, require: true },



    email: {

        type: String,

        trim: true,

        lowercase: true,

        required: true,

    },

    createdBy: { type: String },

    version: { type: Number },

    IPAddress: { type: String }

},

    {

        timestamps: true

    });



userLogsSchema.pre('save', async function (this: UserLogs) {

    try {



    } catch (err) { console.error(err); }





});



const UserLogs = mongoose.model<UserLogs>('UserLogs', userLogsSchema);

export default UserLogs;