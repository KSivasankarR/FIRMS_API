import mongoose, { Schema } from 'mongoose';
import  {DistrictsInformation}  from './types';
import moment from 'moment';
const now = moment().format();

const { Types: { ObjectId } } = Schema
const districtsInformationSchema: Schema = new Schema({
    name: { type: String, require: true },
    stCode: { type: Number, require: true },
    districtName: { type: String, require: true },
    revMandalCode: { type: Number, require: true },
    mandalName: { type: String, require: true },
    revVillageCode: { type: Number, require: true },
    villageName: { type: String, require: true },
    villageScretariatCode: { type: Number, require: true },
    villageScretariatName: { type: String, require: true },
    parentSroCode: { type: Number, require: true },
    sroName: { type: String, require: true },
    psName: { type: String, require: true },
    psAdhaarNo: { type: Number, require: true },
    psMobileNo: { type: Number, require: true },
    vroName: { type: String, require: true },
    vroAdhaarNo: { type: Number, require: true },
    vroMobile: { type: Number, require: true },
    gswsSystemMacAddress: { type: Number, require: true },
},
{
    timestamps: true
});

districtsInformationSchema.pre('save', async function (next) {
    try{
        next();
    } catch (err) { console.error(err); }
});

const DistrictsInformation = mongoose.model<DistrictsInformation>('DistrictsInformation', districtsInformationSchema, 'districtsInformation');
export default DistrictsInformation;