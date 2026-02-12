import { Firm as firm } from '../models/types/Firm.types';
import { Firm, PaymentsInformation ,Districts} from '../models/index';
import { ObjectId } from 'mongoose';
var ObjectId = require('mongoose').Types.ObjectId; 
import moment from 'moment';

export const _getAllFirms = async (req: any, district: any) => {
    const sort = '_id';
    const perPage: any = req.query ? req.query.perPage : 10;
    const page: any = req.query ? req.query.page : 1;
    const skip: any = (parseInt(page) - 1) * parseInt(perPage);
    let fromDate:any = req.query.from ? req.query.from : '';
    if(fromDate) {
        fromDate = moment(fromDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
    }
    
    let toDate:any = req.query.to ? req.query.to : '';
    if(toDate) {
        toDate = moment(toDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
    } else {
        toDate = moment().format('YYYY-MM-DD');
    }
    
    const status = req.query.status;
    const limit = parseInt(perPage);
    let dateObj=new Date(toDate);
    let currdate=new Date();
   
    
    dateObj.setHours(currdate.getHours())
    dateObj.setMinutes(currdate.getMinutes())
    dateObj.setSeconds(currdate.getSeconds())
    
    
    console.log("dateObj:::",dateObj)
    console.log("currdate::::",currdate )
    
    const filterAndCond = [];
    const filerOrCond = [];
    
    if(fromDate && toDate) {
        filterAndCond.push({ createdAt: { $gte: new Date(fromDate), $lte: dateObj } } );
    } 
    if(status) {
        filerOrCond.push({"status": { $regex: status, $options: "i" }});

    }
    
    const filterObject:any = {district: district, status: { $ne: 'Incomplete' }};
    if(filterAndCond.length) {
        filterObject['$and'] = filterAndCond;
    }
    if(filerOrCond.length) {
        filterObject['$or'] = filerOrCond;
    }

    //const totalCount=await Firm.find(filterObject).countDocuments();
    const firms:firm[] = await Firm.find(filterObject);  
    const totalCount=firms?.length
    return { firms,totalCount };
}
export const downloadFirmHistory = async (id:any, payload: any,appId?:any) => {

    if(appId){
    await PaymentsInformation.findOneAndUpdate({applicationNumber:appId,isUtilized:false},{isUtilized:true});
    }
    return await Firm.findOneAndUpdate(
        { _id: id },
        {
            $push: { downloadsHistory: payload },
            isdownload: true
        },
    );
}
export const _getFirm = async (id: string) => {
    return await Firm.findById({ _id: id });
}
export const _getFirmByAppNumber = async (id: string) => {
    return await Firm.findOne({ applicationNumber: id });
}

export const _getUserFirmDetails = async (userId: ObjectId) => {
    return await Firm.findOne({ userId: userId });
}

export const _checkFirm = async (firmName: string, district: string) => { 
    return await Firm.findOne({ firmName: {$regex: firmName.replace(/\s+/g, ' ').trim(), $options: "i"}, district: district });
}

export const _createFirm = async (payload: any) => {
    return await new Firm(payload).save();
}

export const _updateUnsetFirm=async(id:string,payload:any)=>{
    return await Firm.findByIdAndUpdate({_id:id},{$unset:{...payload}}); 
}
export const _updateFirm = async (id:string,payload: any) => {
    return await Firm.findByIdAndUpdate({_id:id},{$set:{...payload}});
}
export const _updateFirmByAPP = async (id:string,payload: any) => {
    return await Firm.findOneAndUpdate({applicationNumber:id},{$set:{...payload}});
}


export const _updateFirmName = async (id: string, newFirmName: string,newFirmDate:any) => {
    return await Firm.findOneAndUpdate({ _id: id }, {$set:{firmName:newFirmName,firmNameEffectDate:newFirmDate}}, {returnOriginal: false});
}

export const _updateFirmAddress = async (id: string,AddressData:any) => {
    return await Firm.findOneAndUpdate({ _id: id ,"principalPlaceBusiness._id":AddressData._id},
        { $set: { "principalPlaceBusiness.$.doorNo" : AddressData.doorNo,
        "principalPlaceBusiness.$.street" : AddressData.street,
        "principalPlaceBusiness.$.district" : AddressData.district,
        "principalPlaceBusiness.$.mandal" : AddressData.mandal,
        "principalPlaceBusiness.$.villageOrCity" : AddressData.villageOrCity,
        "principalPlaceBusiness.$.pinCode" : AddressData.pinCode,
        "principalPlaceBusiness.$.registrationDistrict" : AddressData.registrationDistrict,
        "principalPlaceBusiness.$.effectiveDate" : AddressData.effectiveDate,
         } },
        { new:true });
}

export const _updatePartnerAddress = async (id: string,AddressData:any) => {
    return await Firm.findOneAndUpdate({ _id: id,"firmPartners._id":AddressData._id },
        { $set: { "firmPartners.$.doorNo" : AddressData.doorNo,
        "firmPartners.$.street" : AddressData.street,
        "firmPartners.$.state" : AddressData.state,
        "firmPartners.$.district" : AddressData.district,
        "firmPartners.$.mandal" : AddressData.mandal,
        "firmPartners.$.villageOrCity" : AddressData.villageOrCity,
        "firmPartners.$.pinCode" : AddressData.pinCode,
        "firmPartners.$.country" : AddressData.country,
         } },
        { new :true });
}


export const _updateFirmPartner = async (id:string,type:string,payload?:any,dissolveDate?:string) => {
if(type==='addPartner'){
    return await Firm.findOneAndUpdate({_id: id},{$addToSet:{firmPartners:{ $each:payload}}});
}
else if(type==='exitPartner'){
    return await Firm.findOneAndUpdate({ _id: id, "firmPartners._id": payload._id },
        { $set: { "firmPartners.$.status" : "InActive",}},{
            new: true
          });
}
else if(type==='replacePartner'){
    return await Firm.findOneAndUpdate({ _id: id, "firmPartners._id": payload._id },
        { $set: { "firmPartners.$.partnerName" : payload.partnerName,
        "firmPartners.$.relation" : payload.relation,
        "firmPartners.$.relationType" : payload.relationType,
        "firmPartners.$.partnerSurname" : payload.partnerSurname,
        "firmPartners.$.age" : payload.age,
        "firmPartners.$.role" : payload.role,
        "firmPartners.$.joiningDate" : payload.joiningDate,
        "firmPartners.$.doorNo" : payload.doorNo,
        "firmPartners.$.street" : payload.street,
        "firmPartners.$.country" : payload.country,
        "firmPartners.$.state" : payload.state,
        "firmPartners.$.district":payload.district,
        "firmPartners.$.mandal":payload.mandal,
        "firmPartners.$.villageOrCity":payload.villageOrCity,
        "firmPartners.$.pinCode":payload.pinCode,
        "firmPartners.$.status":payload.status,
         } },{
            new: true
          });
}
else if(type==="dissloveFirm"){
    return await Firm.findOneAndUpdate({ _id: id },
        { $set: { "dissolveDate" : dissolveDate,}},{
            new: true
          });
}
}

export const _updateDocs=async(id:string,attachments:any)=>{
     await Firm.findOneAndUpdate(
        { _id: id },
        {
            $push: {  documentAttached: attachments},
        },
    );
}
export const _sendSMS = async (id: string, deptUpdatedBy: string, messageToApplicant: Object) => {
    return await Firm.findOneAndUpdate(
        { _id: id },
        {
            deptUpdatedBy: deptUpdatedBy,
            $push: { messageToApplicant: messageToApplicant },
        },
    );
}

export const _processingHistoryUpdate = async (id: any, deptUpdatedBy: string, remarksData: Object) => {
    return await Firm.findOneAndUpdate(
        { _id: id },
        {
            deptUpdatedBy: deptUpdatedBy,
            $push: { processingHistory: remarksData },
        },
    );
}

export const _deleteFirm = async (id: string) => {
    return await await Firm.deleteOne({ _id: id })
}

export const _saveHistory = async (id:any) => {

    let historyData:any = await _getFirm(id);
    historyData.historyDetails = [];

    if(historyData?.status == 'Approved' || historyData?.status == 'Rejected')
    {
        return await Firm.findOneAndUpdate(
            { _id: id },
            {
                $push: { historyDetails: historyData },
            },
        );
    }
    return false;
}

export const _downloadsHistory = async (id:any, payload: any) => {

    return await Firm.findOneAndUpdate(
        { _id: id },
        {
            $push: { downloadsHistory: payload },
            isdownload: true
        },
    );
}

export const _downloadsByLawHistory = async (id:any, payload: any) => {

    return await Firm.findOneAndUpdate(
        { _id: id },
        {
            $push: { downloadsByeLawHistory: payload },
            isByLawDownload: true
        },
    );
}

export const _paymentResponseUpdate = async (id: string, paymentResponseData: Object, status: any, paymentStatus: any) => {
    return await Firm.findOneAndUpdate(
        { _id: id },
        {
            status: status,
            paymentStatus: paymentStatus,
            $push: { paymentDetails: paymentResponseData },
        },
    );
}

export const _getFirmDate = async (fromDate: string, toDate: string) => {
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return ("Invalid date range");
    }
    const dateCondition = { createdAt: { $gte: startDate, $lte: endDate } };
    try {
        let firms = await Firm.aggregate([{$match: {...dateCondition }},{$project: {departmentName:"IGRS-AP",serviceName: "Firm",firmName: 1,applicationNumber: 1,district: 1,applicantDetails: 1,
            contactDetails: 1,createdAt: 1,updatedAt: 1,status: 1,firmStatus: 1,principalPlaceBusiness: 1,paymentDetails: {totalAmount: 1,createdAt: 1},documentAttached: {originalname: 1,path: 1},_id: 0}}]).cursor().toArray();

        return firms;
    } catch (error) {
        console.error('Error Fetching Firms Data:', error);
        throw error;
    }
};


export const _getAmendFirm = async (fromDate: string, toDate: string) => {
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return ("Invalid date range");
    }
    const dateCondition = { createdAt: { $gte: startDate, $lte: endDate } };
    const ammends = {$expr: { $gt: [{ $size: "$historyDetails" }, 0] } }
    try {
        let firms = await Firm.aggregate([{$match: {...dateCondition, ...ammends }},{$project: {departmentName:"IGRS-AP",serviceName: "Firm",firmName: 1,applicationNumber: 1,
            isFirmNameChange: 1,isNewPartnerAdded: 1,isOtherAddressChange: 1,isPartnerDeleted: 1,isPartnerPermanentAddressChange: 1,isPartnerReplaced: 1,isPrincipaladdressChange: 1,historyDetails: {applicantDetails: 1,contactDetails: 1,firmName: 1,userId: 1,applicationNumber: 1,atWill: 1,district: 1,
            status: 1,firmStatus :1,registrationNumber: 1,registrationYear: 1,isdownload: 1,paymentDetails: 1,isByLawDownload: 1,isFirmNameChange: 1,isPrincipaladdressChange: 1,isOtherAddressChange: 1,isPartnerPermanentAddressChange: 1,isNewPartnerAdded: 1,isPartnerDeleted: 1,isPartnerReplaced: 1,firmDissolved: 1,paymentStatus: 1,isResubmission: 1,firmPartners: 1,principalPlaceBusiness: 1,otherPlaceBusiness: 1,bussinessType: 1,firmDurationFrom :1,firmDurationTo: 1,industryType: 1,newNameEffectDate: 1,approvedRejectedById: 1,deptUpdatedBy: 1},createdAt: 1,updatedAt: 1,_id: 0}}]).cursor().toArray();
        return firms;
    } catch (error) {
        console.error('Error Fetching Firms Data:', error);
        throw error;
    }
};

export const _getFirmsAppNumber = async (applicationNumber: string) => {
    return await Firm.findOne({ applicationNumber});
}

export const _getmisReport = async (fromDate: string, toDate: string) => {

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);


    const dateCondition = { createdAt: { $gte: startDate, $lte: endDate } };
    try {
        const allDistricts: { name: string }[] = await Districts.find({}, { name: 1, _id: 0 }).lean();
        const districtList = allDistricts.map((d) => d.name);    

        let firms = await Firm.aggregate([
            { $match: { 
                ...dateCondition, 
                status: { $in: ["Approved", "Rejected", "Forwarded", "Incomplete", "Open", "Not Viewed"] } 
            } },
            { $group: { 
                _id: { 
                    district: "$district", 
                    status: "$status" 
                }, 
                count: { $sum: 1 },
                totalRevenue: { 
                    $sum: { 
                        $reduce: {
                            input: { $ifNull: ["$paymentDetails", [{ totalAmount: 0 }]] },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.totalAmount", 0] }] }
                        }
                    } 
                }
            } },
            { $group: { 
                _id: "$_id.district", 
                statusCounts: { 
                    $push: { 
                        status: "$_id.status", 
                        count: "$count", 
                        totalRevenue: "$totalRevenue" 
                    } 
                },
                totalRevenue: { $sum: "$totalRevenue" }
            } },
            { $project: {
                _id: 0,
                district: "$_id",
                Approved: { $ifNull: [{ $sum: { $map: { input: "$statusCounts", as: "s", in: { $cond: [ { $eq: ["$$s.status", "Approved"] }, "$$s.count", 0 ] } } } }, 0] },
                Rejected: { $ifNull: [{ $sum: { $map: { input: "$statusCounts", as: "s", in: { $cond: [ { $eq: ["$$s.status", "Rejected"] }, "$$s.count", 0 ] } } } }, 0] },
                Pending: { $ifNull: [{ $sum: { $map: { input: "$statusCounts", as: "s", in: { $cond: [ { $in: ["$$s.status", ["Forwarded", "Open", "Not Viewed", "Incomplete"]] }, "$$s.count", 0 ] } } } }, 0] },
                TotalCount: { $sum: "$statusCounts.count" },
                TotalRevenue: { $ifNull: ["$totalRevenue", 0] }
            } },
        ]);

        let result = districtList.map((district) => {
            let data = firms.find((f) => f.district === district);
            return data || { 
                district, 
                Approved: 0, 
                Rejected: 0, 
                Pending: 0, 
                TotalCount: 0, 
                TotalRevenue: 0 
            };
        });
        return result;
    } catch (error) {
        console.error("Error Fetching Firms Data:", error);
        throw error;
    }
};

export const _getFirmsLegacyApp = async (applicationNumber: string , isLegacyData: string, district: string ) => {
    return await Firm.findOne({ applicationNumber , isLegacyData, district});
}

export const _getFirmsLegacyName = async (firmName: string, isLegacyData: string, district: string ) => {
    return await Firm.findOne({ firmName,isLegacyData,district});
}

//RTGS Service
export const fetchRtgsDataReport  = async (fromDate: string, toDate: string) => {

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const dateCondition = { createdAt: { $gte: startDate, $lte: endDate } };
    try {
        const allDistricts: { name: string }[] = await Districts.find({}, { name: 1, _id: 0 }).lean();
        const districtList = allDistricts.map((d) => d.name);

        let firms = await Firm.aggregate([
            { $match: { 
                ...dateCondition, 
                status: { $in: ["Approved", "Rejected", "Forwarded", "Incomplete", "Open", "Not Viewed"] },
                // isLegacyData: { $ne: "Y" }
            } },
            { $group: { 
                _id: { 
                    district: "$district", 
                    status: "$status"
                }, 
                count: { $sum: 1 }
            } },
            { $group: { 
                _id: "$_id.district",
                statusCounts: { 
                    $push: { 
                        status: "$_id.status", 
                        count: "$count"
                    } 
                }
            } },
            { $project: {
                _id: 0,
                district: "$_id",
                open: { $ifNull: [{ $sum: { $map: { 
                    input: "$statusCounts", 
                    as: "s", 
                    in: { $cond: [ { $in: ["$$s.status", ["Forwarded", "Incomplete", "Open", "Not Viewed"]] }, "$$s.count", 0 ] }
                } } }, 0] },
                closed: { $ifNull: [{ $sum: { $map: { 
                    input: "$statusCounts", 
                    as: "s", 
                    in: { $cond: [ { $in: ["$$s.status", ["Approved", "Rejected"]] }, "$$s.count", 0 ] }
                } } }, 0] },
                total: { $sum: "$statusCounts.count" }
            } },
        ]);

        let result = districtList.map((district) => {
            let data = firms.find((f) => f.district === district);
            return data || { 
                district, 
                open: 0, 
                closed: 0, 
                total: 0 
            };
        });
        return result;
    } catch (error) {
        console.error("Error Fetching RTGS Data:", error);
        throw error;
    }
};

//Legacy
export const _getFirmData = async (registrationNumber: string, registrationYear: string,district: string) => {
  return await Firm.findOne({
    $expr: {
      $and: [
        { $eq: [{ $toString: "$registrationNumber" }, registrationNumber] },
        { $eq: [{ $toString: "$registrationYear" }, registrationYear] },
        { $eq: ["$district", district]},
        {$eq: ["$isLegacyDataUpdate",false]},
        {$eq: ["$isLegacyData", "Y"]}
      ]
    }
  });
};

export const _getFirmsName = async (firmName: string) => {
  return await Firm.aggregate([
    { $match: { firmName } },
    { $project: { _id: 0, firmName: 1, district: 1 } }
  ]);
};