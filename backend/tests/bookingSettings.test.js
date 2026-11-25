const test=require('node:test'),assert=require('node:assert/strict');
const {settingsError}=require('../utils/bookingSettings');
const valid={businessHoursStart:8,businessHoursEnd:17,slotIntervalMinutes:30,workingDays:[1,2,3,4,5],maxActivePerService:2};
test('reject settings that freeze calendars or remove the booking window',()=>{assert.equal(settingsError(valid),null);for(const invalid of [{slotIntervalMinutes:0},{slotIntervalMinutes:-30},{slotIntervalMinutes:0.5},{businessHoursEnd:8},{businessHoursStart:-1},{workingDays:[7]},{workingDays:[]},{maxActivePerService:1.5}])assert.ok(settingsError({...valid,...invalid}),JSON.stringify(invalid));});
