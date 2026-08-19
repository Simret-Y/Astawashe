const s=require("../services/reminderService"),{assertAdmin}=require("../services/accessService"),{sendError}=require("./be02ControllerHelpers");
const processDueReminders=async(q,r)=>{try{assertAdmin(q.user);const reminders=await s.processDueReminders(q.body.now||new Date());r.json({message:"Due reminders processed",reminders})}catch(e){sendError(r,"Process reminders",e)}};
const getReminders=async(q,r)=>{try{r.json({reminders:await s.listReminders(q.user,q.query)})}catch(e){sendError(r,"Get reminders",e)}};
const getReminder=async(q,r)=>{try{r.json({reminder:await s.getReminder(q.params.id,q.user)})}catch(e){sendError(r,"Get reminder",e)}};
const acknowledgeReminder=async(q,r)=>{try{r.json({message:"Reminder acknowledged",reminder:await s.acknowledgeReminder(q.params.id,q.user)})}catch(e){sendError(r,"Acknowledge reminder",e)}};
module.exports={processDueReminders,getReminders,getReminder,acknowledgeReminder};
