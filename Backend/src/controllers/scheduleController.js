const s=require("../services/prescriptionService"),{assertAdmin}=require("../services/accessService"),{sendError}=require("./be02ControllerHelpers");
const createSchedule=async(q,r)=>{try{assertAdmin(q.user);r.status(201).json({message:"Schedule created successfully",schedule:await s.addSchedule(q.params.prescriptionId,q.body)})}catch(e){sendError(r,"Create schedule",e)}};
const getSchedules=async(q,r)=>{try{r.json({schedules:await s.listSchedules(q.params.prescriptionId,q.user)})}catch(e){sendError(r,"Get schedules",e)}};
const updateSchedule=async(q,r)=>{try{r.json({message:"Schedule updated successfully",schedule:await s.updateSchedule(q.params.id,q.body,q.user)})}catch(e){sendError(r,"Update schedule",e)}};
const deactivateSchedule=async(q,r)=>{try{r.json({message:"Schedule deactivated successfully",schedule:await s.deactivateSchedule(q.params.id,q.user)})}catch(e){sendError(r,"Deactivate schedule",e)}};
module.exports={createSchedule,getSchedules,updateSchedule,deactivateSchedule};
