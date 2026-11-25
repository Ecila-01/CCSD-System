const test=require('node:test');
const assert=require('node:assert/strict');
const {validName,normalizeNameFields,validateAnswers,fullName}=require('../utils/formValidation');
test('names support Unicode and legitimate punctuation but reject digits, emoji and blank answers',()=>{
 for(const name of ['José','Ma. Elena','Dela Cruz',"O’Connor",'Anne-Marie','李明','A'])assert.equal(validName(name),true,name);
 for(const name of ['12345 6 7','Ana3','😊','---',' ','<script>','A'.repeat(101)])assert.equal(validName(name),false,name);
});
test('migration separates referral identities, preserves unrelated fields and is idempotent',()=>{
 const fields=[{name:'studentName',label:'FULL NAME (Referring Faculty/ Staff)',type:'text',required:true},
 {name:'studentName_1',label:'Name of the Student to be referred',type:'text',required:true},
 {name:'remarks',label:'Remarks',type:'textarea'}];
 const normalized=normalizeNameFields(fields);
 assert.equal(normalized.length,7);assert.deepEqual(normalizeNameFields(normalized),normalized);
 assert.deepEqual(normalized.at(-1),fields.at(-1));
 assert.equal(normalized.filter(f=>f.namePart==='middle').every(f=>!f.required),true);
 const data={studentFirstName:'Ana',studentLastName:'Cruz',referrerFirstName:'José',referrerLastName:"O’Connor"};
 assert.equal(fullName(normalized,data,'student'),'Ana Cruz');
 assert.equal(fullName(normalized,data,'referrer'),"José O’Connor");
 assert.equal(validateAnswers(normalized,data),null);
 assert.match(validateAnswers(normalized,{...data,studentFirstName:'123'}),/Student First Name/);
 assert.match(validateAnswers(normalized,{...data,studentLastName:'   '}),/required/);
});
test('required and typed validation covers dates, email, zero, whitespace and dropdown Other',()=>{
 assert.match(validateAnswers([{name:'d',label:'Birth date',type:'date',required:true}],{}),/required/);
 assert.match(validateAnswers([{name:'d',label:'Date',type:'date'}],{d:'2026-02-30'}),/valid date/);
 assert.match(validateAnswers([{name:'e',label:'Email',type:'email',required:true}],{e:'bad'}),/valid email/);
 assert.equal(validateAnswers([{name:'n',label:'Number',type:'number',required:true}],{n:0}),null);
 assert.match(validateAnswers([{name:'q',label:'Concern',type:'textarea',required:true}],{q:'  '}),/required/);
 assert.equal(validateAnswers([{name:'i',label:'Instructions',type:'info',required:true}],{}),null);
 const f=[{name:'s',label:'Select',type:'select',required:true,options:['Yes','Other']}];
 assert.match(validateAnswers(f,{s:'Other: '}),/specify/);
 assert.match(validateAnswers(f,{s:'Bogus'}),/available options/);
 assert.equal(validateAnswers(f,{s:'Other: detail'}),null);
});
