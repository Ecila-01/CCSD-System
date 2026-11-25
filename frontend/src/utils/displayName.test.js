import test from 'node:test';
import assert from 'node:assert/strict';
import {personName} from './displayName.js';
import {matchesStudent} from './caseQueue.js';
test('separate names retain compound surnames and first names, abbreviating each middle-name word',()=>{
 const request={studentName:'Juan Miguel Dela Santos Dela Cruz',requestData:{studentFirstName:'Juan Miguel',studentLastName:'Dela Cruz',studentMiddleName:'Dela Santos'}};
 assert.equal(personName(request),'Dela Cruz, Juan Miguel D.S');
 assert.equal(matchesStudent(request,'Juan Miguel Dela Santos'),true);
 assert.equal(matchesStudent(request,'Dela Cruz, Juan Miguel'),true);
 assert.equal(personName({...request,requestData:{...request.requestData,studentMiddleName:''}}),'Dela Cruz, Juan Miguel');
 assert.equal(personName({studentName:'Gorospe, Leann C.'}),'Gorospe, Leann C.');
 assert.equal(personName({requestData:{referrerFirstName:'José',referrerLastName:'Cruz',referrerMiddleName:'Ángel Santos'}},'referrer'),'Cruz, José Á.S');
});
