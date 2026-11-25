import test from 'node:test';
import assert from 'node:assert/strict';
import { futureSlot } from './appointmentTime.js';
test('Philippine slots exclude past and current times and retain future dates',()=>{
 const now=Date.parse('2026-11-25T14:00:00+08:00');
 assert.equal(futureSlot('2026-11-25','08:00',now),false);
 assert.equal(futureSlot('2026-11-25','14:00',now),false);
 assert.equal(futureSlot('2026-11-25','14:30',now),true);
 assert.equal(futureSlot('2026-11-26','08:00',now),true);
 assert.equal(futureSlot('','14:30',now),false);
});
