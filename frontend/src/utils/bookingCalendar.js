export function bookingSettings(value={}) {
 const start=Number(value.businessHoursStart),end=Number(value.businessHoursEnd),interval=Number(value.slotIntervalMinutes);
 return {businessHoursStart:Number.isInteger(start)&&start>=0&&start<24?start:8,businessHoursEnd:Number.isInteger(end)&&end>start&&end<=24?end:Math.max(16,(Number.isInteger(start)?start:8)+1),slotIntervalMinutes:Number.isInteger(interval)&&interval>0&&interval<=1440?interval:30,workingDays:Array.isArray(value.workingDays)?value.workingDays.filter(d=>Number.isInteger(d)&&d>=0&&d<=6):[1,2,3,4,5]};
}
export const minutes=value=>{const [h,m]=String(value).split(':').map(Number);return h*60+m;};
export const dateKey=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
export function slotClosed(date,time,closures,interval) {
 const at=minutes(time);
 return closures.some(c=>c.date===date && (c.allDay!==false || (at<minutes(c.endTime) && at+interval>minutes(c.startTime))));
}
export function calendarSlots(settings) {
 const s=bookingSettings(settings),slots=[];
 for(let at=s.businessHoursStart*60;at<s.businessHoursEnd*60;at+=s.slotIntervalMinutes){const h=Math.floor(at/60),m=String(at%60).padStart(2,'0');slots.push({value:String(h).padStart(2,'0')+':'+m,label:(h%12||12)+':'+m+' '+(h>=12?'PM':'AM')});}
 return slots;
}
