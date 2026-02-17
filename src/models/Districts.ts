import mongoose, { Schema } from 'mongoose';
import  {Districts}  from './types';
import moment from 'moment';
const now = moment().format();

const { Types: { ObjectId } } = Schema
const districtsSchema: Schema = new Schema({
    name: { type: String, require: true },
    ddoCode: { type: String, require: true},
    code: { type: String, require: true }
},
{
    timestamps: true
});

districtsSchema.pre('save', async function (next) {
    try{
        next();
    } catch (err) { console.error(err); }
});

const Districts = mongoose.model<Districts>('Districts', districtsSchema, 'districts');
export default Districts;