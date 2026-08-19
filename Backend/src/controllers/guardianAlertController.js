const s=require("../services/guardianAlertService"),{sendError}=require("./be02ControllerHelpers");
const getGuardianAlerts=async(q,r)=>{try{if(q.user.role_id!==4)return r.status(403).json({message:"Only guardians can access this resource"});r.json({guardian_alerts:await s.listForGuardian(q.user.user_id)})}catch(e){sendError(r,"Get guardian alerts",e)}};
const markAlertRead=async(q,r)=>{try{if(q.user.role_id!==4)return r.status(403).json({message:"Only guardians can access this resource"});r.json({message:"Guardian alert marked as read",guardian_alert:await s.markRead(q.params.id,q.user.user_id)})}catch(e){sendError(r,"Read guardian alert",e)}};
module.exports={getGuardianAlerts,markAlertRead};
