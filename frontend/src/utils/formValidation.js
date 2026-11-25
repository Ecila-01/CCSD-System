const clean = v => typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
function validName(value) {
 return typeof value === 'string' && value.trim().length <= 100 && /^[\p{L}\p{M}]+(?:\.(?=\s|$)|[ ’'\-][\p{L}\p{M}]+)*$/u.test(clean(value));
}
function nameRole(field) {
 return field.nameRole || (/referring|referrer/i.test(field.label || '') ? 'referrer' : 'student');
}
function namePart(field) {
 return field.namePart || (/\bfirst\s*name\b/i.test(field.label) ? 'first' : /\bmiddle\s*(name|initial)\b/i.test(field.label) ? 'middle' : /\b(last|family|sur)\s*name\b/i.test(field.label) ? 'last' : '');
}
function isLegacyName(field) {
 return ['text','name'].includes(field.type) && !namePart(field) && /\b(full\s*name|student\s*name|name of the student|student to be referred)\b/i.test(field.label || '');
}
function normalizeNameFields(fields) {
 const result=[];
 for (const source of fields) {
  const field = source.toObject ? source.toObject() : {...source};
  if (isLegacyName(field)) {
   const role=nameRole(field);
   for(const part of ['first','middle','last']) result.push({
    name:`${role}${part[0].toUpperCase()+part.slice(1)}Name`,
    label:`${role==='referrer'?'Referrer':'Student'} ${part[0].toUpperCase()+part.slice(1)} Name`,
    type:'text',nameRole:role,namePart:part,required:part!=='middle',options:[],section:field.section
   });
  } else {
   const part=namePart(field);
   result.push(part ? {...field,namePart:part,nameRole:nameRole(field),type:'text',required:part!=='middle'} : field);
  }
 }
 if (new Set(result.map(f=>f.name)).size!==result.length) throw new Error('Each form field must have a unique name.');
 return result;
}
function fullName(fields,data,role) {
 const parts=['first','middle','last'].map(part=>{
  const f=fields.find(f=>namePart(f)===part && nameRole(f)===role);
  return f ? clean(data[f.name]) : '';
 });
 return parts.filter(Boolean).join(' ');
}
function validateAnswers(fields,data) {
 if (!data || typeof data!=='object' || Array.isArray(data)) return 'Complete the request form.';
 for(const f of fields) {
  if (f.type==='info') continue;
  const value=data[f.name];
  const text=clean(value);
  if (f.required && !text && !(typeof value==='number' && Number.isFinite(value))) return `${f.label} is required.`;
  if (value===undefined || value===null || value==='') continue;
  if (!['string','number'].includes(typeof value)) return `${f.label} has an invalid answer.`;
  if ((namePart(f)||isLegacyName(f)) && text && !validName(value)) return `${f.label}: use letters, spaces, apostrophes, periods or hyphens (maximum 100 characters).`;
  if (f.type==='email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return `${f.label}: enter a valid email address.`;
  if (f.type==='number' && !Number.isFinite(Number(value))) return `${f.label}: enter a valid number.`;
  if (f.type==='date' && text) {
   const date=new Date(`${text}T00:00:00Z`);
   if (!/^\d{4}-\d{2}-\d{2}$/.test(text)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==text) return `${f.label}: enter a valid date.`;
  }
  if (f.type==='time' && text && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) return `${f.label}: select a valid time.`;
  if (f.type==='select' && /^Other\s*:/i.test(text) && !text.replace(/^Other\s*:/i,'').trim()) return `${f.label}: please specify Other.`;
  if (f.type==='select' && text && !f.isSystemLinked) {
   const parent=fields.find(p=>p.label===f.dependsOnLabel);
   const options=(parent && f.optionsMap?.[data[parent.name]]) || f.options || [];
   const other=options.some(v=>/^Other:?$/i.test(v));
   if (options.length && !options.includes(text) && !(other && /^Other\s*:\s*\S/i.test(text))) return `${f.label}: select one of the available options.`;
  }
 }
 return null;
}
export {validName,nameRole,namePart,isLegacyName,normalizeNameFields,fullName,validateAnswers};


export const basicInfoFields = () => [
 {name:'email',label:'Email Address',type:'email',required:true,options:[]},
 ...['first','middle','last'].map(part=>({name:`student${part[0].toUpperCase()+part.slice(1)}Name`,label:`${part[0].toUpperCase()+part.slice(1)} Name`,type:'text',namePart:part,nameRole:'student',required:part!=='middle',options:[]}))
];
