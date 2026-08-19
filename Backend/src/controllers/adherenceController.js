const s=require("../services/adherenceService"),{assertAdmin}=require("../services/accessService"),{sendError}=require("./be02ControllerHelpers");
const takeDose=async(q,r)=>{try{r.json({message:"Dose recorded",dose_record:await s.actionDose(q.params.scheduleId,q.body,q.user,"TAKEN")})}catch(e){sendError(r,"Take dose",e)}};
const skipDose=async(q,r)=>{try{r.json({message:"Dose skipped",dose_record:await s.actionDose(q.params.scheduleId,q.body,q.user,"SKIPPED")})}catch(e){sendError(r,"Skip dose",e)}};
const processMissed=async(q,r)=>{try{assertAdmin(q.user);const dose_records=await s.processMissedDoses(q.body.now||new Date());r.json({message:"Missed doses processed",dose_records})}catch(e){sendError(r,"Process missed doses",e)}};
const getAdherence=async(q,r)=>{try{r.json({adherence:await s.getSummary(q.user,q.query)})}catch(e){sendError(r,"Get adherence",e)}};
module.exports={takeDose,skipDose,processMissed,getAdherence};
