const test=require('node:test'),assert=require('node:assert/strict');
const Department=require('../models/Department'),User=require('../models/User'),Request=require('../models/ServiceRequest'),Notification=require('../models/Notification'),Service=require('../models/Service');
const handler=require('../routes/departments').stack.find(l=>l.route?.methods.put).route.stack.at(-1).handle;
test('department rename updates staff, cases, notification routing and static template keys in one transaction',async t=>{
 const session={withTransaction:async fn=>fn(),endSession:async()=>{}};t.mock.method(Department,'startSession',async()=>session);
 const dept={name:'SIT',save:async()=>{}};t.mock.method(Department,'findById',()=>({session:async()=>dept}));
 const calls=[];for(const Model of [User,Request,Notification])t.mock.method(Model,'updateMany',async(q,u,o)=>calls.push({q,u,o}));
 const service={fields:[{name:'department',options:['SIT','SON']},{optionsMap:{SIT:['BSCS']}}],markModified:()=>{},save:async()=>{}};t.mock.method(Service,'find',()=>({session:async()=>[service]}));
 let status=200,result;const res={status(n){status=n;return this;},json(v){result=v;}};
 await handler({params:{id:'test'},body:{name:'SCIT'}},res);
 assert.equal(status,200);assert.equal(result.name,'SCIT');assert.equal(calls.length,3);assert.ok(calls.every(c=>c.o.session===session));assert.equal(calls[0].q.assignedDepartments.test(' sit '),true);assert.equal(calls[1].u.$set['requestData.department'],'SCIT');assert.deepEqual(service.fields[0].options,['SCIT','SON']);assert.deepEqual(service.fields[1].optionsMap,{SCIT:['BSCS']});
});
