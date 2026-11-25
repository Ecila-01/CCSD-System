const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeEmail,fingerprint,acquire,rejection,checkRecent}=require('../utils/submissionGuard');
const fields=[{name:'concern',type:'textarea'},{name:'email',type:'email'}];
const body={serviceId:'service1',studentName:'Ana Cruz',requiresSchedule:true,appointmentDate:'2026-12-01',timeSlot:'09:00',requestData:{concern:'Help please',email:'Ana@example.com'}};
test('fingerprints normalize formatting, ignore junk, and distinguish different students, services and schedules',()=>{
 const email=normalizeEmail(' ANA@example.com ');
 assert.equal(email,'ana@example.com');
 const hash=fingerprint(body,fields,email);
 assert.equal(hash,fingerprint({...body,requestData:{junk:'random',email:' ana@EXAMPLE.com ',concern:'Help   please'}},fields,email));
 for(const change of [{serviceId:'service2'},{studentName:'Another Student'},{timeSlot:'10:00'},{appointmentDate:'2026-12-02'}])assert.notEqual(hash,fingerprint({...body,...change},fields,email));
 assert.notEqual(hash,fingerprint(body,fields,'other@example.com'));
});
test('concurrent same-email submission is blocked and failure release allows retry',()=>{
 const release=acquire('a@example.com');
 assert.equal(acquire('a@example.com'),null);
 const other=acquire('b@example.com');assert.equal(typeof other,'function');other();
 release();const retry=acquire('a@example.com');assert.equal(typeof retry,'function');retry();
});
test('repeat takes precedence over cooldown; returns useful retry windows',()=>{
 const now=Date.parse('2026-11-25T06:00:00Z');
 const saved={createdAt:new Date(now-30000)};
 assert.equal(rejection(saved,saved,now).code,'REPEATED_SUBMISSION');
 assert.equal(rejection(saved,null,now).retryAfter,270);
 assert.equal(rejection(null,saved,now).retryAfter,30);
 assert.equal(rejection(null,null,now),null);
});
test('database lookback uses strict 60s/5min windows and treats referrer email as submitter',async()=>{
 const queries=[];
 const Model={findOne(query){queries.push(query);return {sort(){return this;},select(){return Promise.resolve(null);}};}};
 const now=Date.parse('2026-11-25T06:00:00Z');
 assert.equal(await checkRecent(Model,'faculty+tag@example.com','hash',now),null);
 assert.equal(queries[0].createdAt.$gt.getTime(),now-300000);
 assert.equal(queries[1].createdAt.$gt.getTime(),now-60000);
 assert.equal(queries[1].$or[2].referrerEmail.test(' FACULTY+TAG@example.com '),true);
 assert.equal(queries[1].$or[2].referrerEmail.test('facultyXtag@example.com'),false);
});
