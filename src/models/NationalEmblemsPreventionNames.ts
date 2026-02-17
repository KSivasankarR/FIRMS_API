import mongoose, { Schema } from 'mongoose';
import  {NationalEmblemsPreventionNames}  from './types';
import moment from 'moment';
const now = moment().format();

const { Types: { ObjectId } } = Schema
const nationalEmblemsPreventionNamesSchema: Schema = new Schema({
    name:{type: String, text: true}
});

nationalEmblemsPreventionNamesSchema.pre('save', async function (next) {
    try{
        this.updatedAt = now;
        next();
    } catch (err) { console.error(err); }
});

const NationalEmblemsPreventionNames = mongoose.model<NationalEmblemsPreventionNames>('NationalEmblemsPreventionNames', nationalEmblemsPreventionNamesSchema, 'nationalEmblemsPreventionNames');
export default NationalEmblemsPreventionNames;