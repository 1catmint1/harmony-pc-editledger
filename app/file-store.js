// New EditLedger module, MIT.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const codec=require('./file-codec');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function error(code,message){const e=new Error(message);e.code=code;throw e;}
function inspect(filePath){
  try {const stat=fs.lstatSync(filePath);if(!stat.isFile()||stat.isSymbolicLink())error('NOT_REGULAR','Choose a regular file');if(stat.size>codec.LIMIT)error('SIZE_LIMIT','File exceeds 8 MiB');const bytes=fs.readFileSync(filePath);if(bytes.length>codec.LIMIT)error('SIZE_LIMIT','File exceeds 8 MiB');return {exists:true,sha256:sha(bytes),mode:stat.mode,bytes};}
  catch(e){if(e.code==='ENOENT')return {exists:false,sha256:null,mode:0o600};throw e;}
}
function read(filePath){const state=inspect(filePath);if(!state.exists)error('ENOENT','File no longer exists');const doc=codec.decode(state.bytes);return {content:doc.text,format:doc.format,sha256:doc.sha256};}
function save(filePath,content,format,expectedSha){
  const target=path.resolve(filePath),initial=inspect(target);
  if(initial.sha256!==expectedSha)error('CONFLICT','File changed externally; reopen or choose another destination');
  const bytes=codec.encode(content,format);
  const temporary=path.join(path.dirname(target),'.editledger-'+process.pid+'-'+crypto.randomBytes(8).toString('hex')+'.tmp');
  let fd=null,committed=false;
  try{
    fd=fs.openSync(temporary,'wx',initial.mode&0o777);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=null;
    if(inspect(target).sha256!==expectedSha)error('CONFLICT','File changed while saving; original preserved');
    fs.renameSync(temporary,target);committed=true;
    return {sha256:sha(bytes),format,bytes:bytes.length};
  } finally {if(fd!==null)fs.closeSync(fd);if(!committed){try{fs.unlinkSync(temporary);}catch(e){if(e.code!=='ENOENT')throw e;}}}
}
module.exports={inspect,read,save};
