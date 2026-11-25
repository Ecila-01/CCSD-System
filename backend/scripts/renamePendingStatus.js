// Run from backend: node scripts/renamePendingStatus.js [--apply]
// Apply only after the Pending-compatible backend and frontend are deployed.
const path = require('node:path');
const fs = require('node:fs/promises');
const dns = require('node:dns');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { MongoClient, BSON: { EJSON } } = require('mongodb');
async function main() {
 if (process.env.MONGODB_DNS_SERVERS) dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(v => v.trim()).filter(Boolean));
 const client = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
 try {
  await client.connect();
  const db = client.db();
  const collection = db.collection('servicerequests');
  const filter = {$or: [{status:'Pending Review'}, {'statusUpdates.status':'Pending Review'}]};
  const affected = await collection.find(filter, {projection:{status:1,statusUpdates:1,updatedAt:1}}).toArray();
  console.log(JSON.stringify({database:db.databaseName, affectedDocuments:affected.length,
   currentStatuses:affected.filter(r=>r.status==='Pending Review').length,
   historyEntries:affected.reduce((n,r)=>n+(r.statusUpdates||[]).filter(h=>h.status==='Pending Review').length,0)}));
  if (!process.argv.includes('--apply')) {console.log('Read-only check. No database changes.');return;}
  if (!affected.length) return;
  const backupDir=path.resolve(__dirname,'../../../database-backups');
  await fs.mkdir(backupDir,{recursive:true});
  const backup=path.join(backupDir,`pending-status-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  await fs.writeFile(backup,EJSON.stringify({database:db.databaseName,collection:'servicerequests',records:affected},null,2),{flag:'wx',mode:0o600});
  // Atomic per document; preserve timestamps, notes, authors and all other fields.
  const result=await collection.updateMany(filter,[{$set:{
   status:{$cond:[{$eq:['$status','Pending Review']},'Pending','$status']},
   statusUpdates:{$map:{input:{$ifNull:['$statusUpdates',[]]},as:'entry',in:
    {$mergeObjects:['$$entry',{status:{$cond:[{$eq:['$$entry.status','Pending Review']},'Pending','$$entry.status']}}]}}}
  }}]);
  console.log(JSON.stringify({modifiedDocuments:result.modifiedCount,remainingLegacy:await collection.countDocuments(filter),backup}));
 } finally {await client.close();}
}
main().catch(error=>{console.error('Migration failed:',error.code || error.name);process.exitCode=1;});
