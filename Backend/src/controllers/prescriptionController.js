const s=require("../services/prescriptionService"),{sendError}=require("./be02ControllerHelpers");
const createPrescription=async(q,r)=>{try{const x=await s.createPrescription(q.body,q.user);r.status(201).json({message:"Prescription created successfully",...x});}catch(e){sendError(r,"Create prescription",e)}};
const getPrescriptions=async(q,r)=>{try{r.json({prescriptions:await s.listPrescriptions(q.user,q.query.patient_id)})}catch(e){sendError(r,"Get prescriptions",e)}};
const getPrescription=async(q,r)=>{try{r.json({prescription:await s.getPrescription(q.params.id,q.user)})}catch(e){sendError(r,"Get prescription",e)}};
const updatePrescription=async(q,r)=>{try{r.json({message:"Prescription updated successfully",prescription:await s.updatePrescription(q.params.id,q.body,q.user)})}catch(e){sendError(r,"Update prescription",e)}};
const cancelPrescription=async(q,r)=>{try{r.json({message:"Prescription cancelled successfully",prescription:await s.cancelPrescription(q.params.id,q.user)})}catch(e){sendError(r,"Cancel prescription",e)}};
module.exports={createPrescription,getPrescriptions,getPrescription,updatePrescription,cancelPrescription};
