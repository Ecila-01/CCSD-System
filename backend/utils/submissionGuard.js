const { createHash } = require('node:crypto');
const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const canonical = value => {
 if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ').toLowerCase();
 if (Array.isArray(value)) return value.map(canonical);
 if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
};
function fingerprint(body, fields, email) {
 // Ignore unconfigured client properties so adding random keys cannot evade detection.
 const answers=Object.fromEntries(fields.filter(f=>f.type!=='info').map(f=>[f.name,body.requestData?.[f.name] ?? '']));
 return createHash('sha256').update(JSON.stringify(canonical({serviceId:String(body.serviceId),email,
  studentName:body.studentName,studentIdNumber:body.studentIdNumber || '',
  appointmentDate:body.requiresSchedule ? body.appointmentDate : '',
  timeSlot:body.requiresSchedule ? body.timeSlot : '',answers}))).digest('hex');
}
const inFlight = new Set();
function acquire(email) {
 if (inFlight.has(email)) return null;
 inFlight.add(email);
 return () => inFlight.delete(email);
}
function rejection(duplicate, latest, now = Date.now()) {
 if (duplicate) return {status:409,code:'REPEATED_SUBMISSION',retryAfter:Math.max(1,Math.ceil((new Date(duplicate.createdAt).getTime()+300000-now)/1000)),message:'This request was already submitted. Please check your email for its tracking link.'};
 if (latest) return {status:429,code:'SUBMISSION_COOLDOWN',retryAfter:Math.max(1,Math.ceil((new Date(latest.createdAt).getTime()+60000-now)/1000)),message:'Please wait a minute after your last submission before sending another request.'};
 return null;
}
async function checkRecent(Model, email, hash, now = Date.now()) {
 const escaped=email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const emailPattern=new RegExp(`^\\s*${escaped}\\s*$`,'i');
 const [duplicate,latest]=await Promise.all([
  Model.findOne({submissionFingerprint:hash,createdAt:{$gt:new Date(now-300000)}}).select('createdAt'),
  Model.findOne({$or:[{submitterEmailNormalized:email},
   {$and:[{studentEmail:emailPattern},{serviceName:{$not:/^\s*referral\s*$/i}}]},
   {referrerEmail:emailPattern}],createdAt:{$gt:new Date(now-60000)}}).sort({createdAt:-1}).select('createdAt')
 ]);
 return rejection(duplicate,latest,now);
}
module.exports={normalizeEmail,fingerprint,acquire,rejection,checkRecent};
