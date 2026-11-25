import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { basicInfoFields, validateAnswers, fullName, normalizeNameFields } from './formValidation.js';
const backend=createRequire(import.meta.url)('../../../backend/utils/formValidation.js');
test('Quick Add provides distinct required first/last and optional middle fields',()=>{
 const fields=basicInfoFields();
 assert.deepEqual(fields.map(f=>f.name),['email','studentFirstName','studentMiddleName','studentLastName']);
 assert.equal(fields.find(f=>f.namePart==='middle').required,false);
 assert.deepEqual(normalizeNameFields(fields),backend.normalizeNameFields(fields));
 const valid={email:'test@example.com',studentFirstName:'Ma. Elena',studentLastName:'Dela Cruz'};
 for(const data of [valid,{...valid,studentFirstName:'12345'}, {...valid,email:''}, {...valid,studentLastName:'   '}]){
  assert.equal(validateAnswers(fields,data),backend.validateAnswers(fields,data));
  assert.equal(fullName(fields,data,'student'),backend.fullName(fields,data,'student'));
 }
});
