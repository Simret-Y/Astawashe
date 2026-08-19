const s=require("../services/notificationService"),{sendError}=require("./be02ControllerHelpers");
const getNotifications=async(q,r)=>{try{r.json({notifications:await s.listForUser(q.user.user_id)})}catch(e){sendError(r,"Get notifications",e)}};
const getNotification=async(q,r)=>{try{r.json({notification:await s.getForUser(q.params.id,q.user.user_id)})}catch(e){sendError(r,"Get notification",e)}};
module.exports={getNotifications,getNotification};
