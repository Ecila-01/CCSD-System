const crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const MAX_BYTES=60*1024*1024;
async function encrypt(payload,password) {
 if(typeof password!=='string'||password.length<12)throw Error('Use a backup password of at least 12 characters.');
 const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12),key=await scrypt(password,salt,32);
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const metadata={system:'UB CCSD',format:'encrypted-recovery-v1',models:Object.keys(payload.data)};
 cipher.setAAD(Buffer.from(JSON.stringify(metadata)));
 const plaintext=Buffer.from(JSON.stringify(payload));
 if(plaintext.length>MAX_BYTES)throw Error('Recovery backup exceeds 60 MB. Use a managed database and media backup for this dataset.');
 const data=Buffer.concat([cipher.update(plaintext),cipher.final()]);
 return {...metadata,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:data.toString('base64')};
}
async function decrypt(envelope,password) {
 try {
  if(typeof password!=='string'||password.length<12)throw Error();
  const salt=Buffer.from(envelope.salt,'base64'),iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64'),data=Buffer.from(envelope.ciphertext,'base64');
  if(salt.length!==16||iv.length!==12||tag.length!==16||data.length>MAX_BYTES)throw Error();
  const key=await scrypt(password,salt,32),cipher=crypto.createDecipheriv('aes-256-gcm',key,iv);cipher.setAuthTag(tag);
  cipher.setAAD(Buffer.from(JSON.stringify({system:envelope.system,format:envelope.format,models:envelope.models})));
  return JSON.parse(Buffer.concat([cipher.update(data),cipher.final()]).toString());
 }catch{throw Error('The backup password is incorrect or the file is damaged.');}
}
function urlsIn(value,result=new Set()) {
 if(typeof value==='string' && /^https:\/\/res\.cloudinary\.com\//i.test(value))result.add(value);
 else if(Array.isArray(value))value.forEach(v=>urlsIn(v,result));
 else if(value && typeof value==='object')Object.values(value).forEach(v=>urlsIn(v,result));
 return result;
}
async function captureAssets(data) {
 const assets=[];let total=0;
 for(const url of urlsIn(data)) {
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('A Cloudinary image could not be backed up. No complete backup was produced.');
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;total+=chunk.length;if(size>10*1024*1024||total>35*1024*1024)throw Error('Media exceeds the recovery backup size limit. Use a managed media backup.');chunks.push(chunk);}
  assets.push({url,base64:Buffer.concat(chunks).toString('base64')});
 }
 return assets;
}
function replaceUrls(value,replacements) {
 if(typeof value==='string')return replacements.get(value)||value;
 if(Array.isArray(value))return value.map(v=>replaceUrls(v,replacements));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceUrls(v,replacements)]));
 return value;
}
module.exports={encrypt,decrypt,captureAssets,replaceUrls};
