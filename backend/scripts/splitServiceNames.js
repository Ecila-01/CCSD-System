// Dry-run by default. Deploy compatible form code before applying.
const path=require('node:path');
const fs=require('node:fs/promises');
const dns=require('node:dns');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const {MongoClient,BSON:{EJSON}}=require('mongodb');
const {normalizeNameFields}=require('../utils/formValidation');
async function main(){
 if(process.env.MONGODB_DNS_SERVERS)dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(s=>s.trim()).filter(Boolean));
 const client=new MongoClient(process.env.MONGO_URI,{serverSelectionTimeoutMS:20000});
 try{
  await client.connect();const db=client.db();const collection=db.collection('services');
  const services=await collection.find().toArray();
  const changes=services.map(s=>({service:s,fields:normalizeNameFields(s.fields||[])})).filter(c=>JSON.stringify(c.fields)!==JSON.stringify(c.service.fields));
  console.log(JSON.stringify({database:db.databaseName,services:changes.map(c=>({name:c.service.name,before:c.service.fields.length,after:c.fields.length}))}));
  if(!process.argv.includes('--apply')){console.log('Read-only check. No database changes.');return;}
  if(!changes.length)return;
  const dir=path.resolve(__dirname,'../../../database-backups');await fs.mkdir(dir,{recursive:true});
  const backup=path.join(dir,`service-names-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  await fs.writeFile(backup,EJSON.stringify({database:db.databaseName,collection:'services',records:changes.map(c=>c.service)},null,2),{flag:'wx',mode:0o600});
  let modified=0;
  for(const c of changes){
   const result=await collection.updateOne({_id:c.service._id,fields:c.service.fields},{$set:{fields:c.fields}});
   if(!result.matchedCount)throw new Error('A service changed during migration. Rerun the dry check.');
   modified+=result.modifiedCount;
  }
  console.log(JSON.stringify({modified,backup}));
 }finally{await client.close();}
}
main().catch(e=>{console.error('Migration failed:',e.code||e.name);process.exitCode=1;});
