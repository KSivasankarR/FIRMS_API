import express from 'express';
import { UserController } from './controllers/UserController';
import { AuthController } from './controllers/AuthController';
import { FirmController } from './controllers/FirmController';
import { IndustrialController } from './controllers/industrialController';
import { NationalEmblemPreventionController } from './controllers/NationalEmblemsPreventionController';
const router = express.Router();
import { isLogin, isAdmin, verifyToken} from './middleware/auth';

import { validateCreateNewFirm, validateCreateNewSociety, validateCreateFirm, validateLogin, validatedepartmentLogin, validateFirmName, validateCheckUser, validateSocietyName, validateSMS, validatecheckUserAadhar, validateDepartmentChangePassword, validateVerifyOTP, validateRegistrationName}  from './middleware/validations';

import { firmDocsUpload, setAppNumber } from '../utils/functions';
import { Request, Response, NextFunction } from 'express';
import { MasterController } from './controllers/MasterController';
import { PaymentController } from './controllers/PaymentController';

import multer, { FileFilterCallback } from 'multer';
const upload = multer({});
import cron from 'node-cron'

const generateAppNumber = (req: Request, res: Response, next: NextFunction) => {
    setAppNumber();
    next();
}
router.post('/users/createFirm', validateCreateNewFirm(), generateAppNumber, UserController.createFirmSocietyUser);
router.post('/users/createSociety', validateCreateNewSociety(), generateAppNumber, UserController.createFirmSocietyUser);

router.get('/users', isLogin, UserController.getallUsers);
router.get('/users/:id', isLogin, UserController.getUserById);
router.put('/users/update/:id', isLogin, UserController.updateUsers);
router.post('/checkUser', validateCheckUser(), UserController.checkUser);
router.post('/checkUserAadhar', validatecheckUserAadhar(), UserController.checkUserAadhar);

router.post('/login', AuthController.loginUser);
router.post('/departmentLogin', validatedepartmentLogin(), AuthController.loginDepartment);
router.post('/reset', isLogin, AuthController.resetUser);
router.get('/getRefreshToken', isLogin, AuthController.getRefreshToken);
router.post('/department/update', isLogin, isAdmin, upload.single('selfSignedSignature'), UserController.updateDepartmentUser);
router.post('/department/updateDummy', isLogin, isAdmin, UserController.updateDepartmentUserData);
router.get('/department/:id', isLogin, UserController.getDepartmentById);
router.get('/certificateDetails/:id', isLogin, UserController.getDepartmentCertificateDetails);
router.post('/department/changePassword', isLogin, isAdmin, validateDepartmentChangePassword(), AuthController.changePassword);
router.post('/department/dataEntry', isLogin, isAdmin,firmDocsUpload, FirmController.FirmsDataEntry);

router.post('/department/updateRegNo', isLogin, isAdmin, FirmController.UpdateRegNo);

//FirmController.
router.post('/firm/check', validateFirmName(), FirmController.checkFirm);
router.post('/firm/update', isLogin, firmDocsUpload, FirmController.updateFirm);
router.put('/firms/update/:id', isLogin, firmDocsUpload, FirmController.updateFirm);

router.put('/firms/sendSMS/:id', isLogin, isAdmin, FirmController.sendSMS);
router.post('/firms/remarks', isLogin, isAdmin, FirmController.processingHistory);
router.get('/firms/download', isLogin, isAdmin, FirmController.downloadFirms);
router.get('/firms/reports', isLogin, isAdmin, FirmController.reports);
router.get('/firms/:id',  FirmController.getFirm);
router.get('/firms/downloadcertificate/:id',  FirmController.downloadcertificate);

router.get('/firms/downloadFileByData/:id/:filename',  FirmController.downloadFileByData);
router.get('/firms/downloadcertificateByData/:id/:filename',  FirmController.downloadcertificateByData);
router.get('/firms', isLogin, isAdmin, FirmController.getallFirms);
router.post('/firms/downloads/:id', isLogin, FirmController.downloadsHistory);
router.get('/logout', isLogin, AuthController.Logout);
router.post('/firms/redirectPayment', FirmController.RedirectPayment);
router.post('/firms/redirectcertificate', FirmController.RedirectCertificate);
router.post('/firms/actionOnCertificate', isLogin, FirmController.actionOnCertificate); 
router.post('/firms/esignStatus', isLogin, FirmController.esignStatus); 

router.post('/firms/v1/api/redirect', (req: Request, res: Response) => { res.writeHead(301, {'Location': `${process.env.FIRMS_UI_REDIRECT_URL}` }).end() })

router.post('/checkAvailability', validateRegistrationName(), NationalEmblemPreventionController.checkAvailability)
router.get('/getDistricts', MasterController.getDistricts);
router.post('/getDistrictsMandals', MasterController.getDistrictsMandals);
router.post('/getDistrictsMandalVillages', MasterController.getDistrictsMandalVillages);
router.post('/getDistrictDdoCode', MasterController.getDistrictDdoCode);

router.get('/getPaymentDetails/:id', isLogin, PaymentController.getPaymentDetails);
router.post('/paymentResponseDetails/:id', isLogin, PaymentController.paymentResponseDetails);
router.post('/confirmDephaseTransaction/:id', isLogin, isAdmin, PaymentController.confirmDephaseTransaction);
router.get('/downloads/:id/:fileName', FirmController.downloadFile);
router.post('/verifyOTP', UserController.verifyOTP)
router.post('/sendSMSMail',UserController.sendSMSMail)

//EODB API's
 
router.post('/list/login',IndustrialController.industLogin)
router.post('/list/dateFetch',verifyToken,IndustrialController.dateFetchData)
router.post('/list/ammend',verifyToken,IndustrialController.amendmentFirmDetails)

//Legacy Data save API
router.get('/list/:type/getLegacydata/:identifier',IndustrialController.getLegacyFirmDetails)
router.post('/department/dataEntryLegacy', isLogin, isAdmin,firmDocsUpload, IndustrialController.FirmLegacyDataEntry);

//Mis Report
router.get('/list/misReport',IndustrialController.misReport)

//RTGS API
router.get('/list/getRtgsData',verifyToken,IndustrialController.getRtgsReport)

//Legacy
router.get('/list/firmData', IndustrialController.getFirmDetail);
router.post('/department/dataEntryUser',firmDocsUpload, IndustrialController.firmUserLegacyData);

router.get('/list/fraName/:firmName', IndustrialController.getFirmsName);

//Legacy Data Routes
router.get('/list/saveData',IndustrialController.savePostgresData)
//0 */1 * * * *
// cron.schedule('* 14 18 * * *', async () => {
//     console.log("Before starting the process::::::::", new Date());
//     let result = await IndustrialController.savePostgresData();
//     console.log("After completing the process::::::::", new Date());
//     console.log("After completing the process::::::::", result);
// });

router.get('/list/fetch',IndustrialController.getPostgresDataFetch)

export default router;

