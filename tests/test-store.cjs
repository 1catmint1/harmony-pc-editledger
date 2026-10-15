const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const app='../app/';
const store=require(app+'file-store'),codec=require(app+'file-codec');
const base=path.resolve(__dirname,'store-tests');fs.mkdirSync(base,{recursive:true});
const root=fs.mkdtempSync(path.join(base,'case-')),cases=[];
function test(name,body){body();cases.push({name,status:'PASS'});}
try {
 const file=path.join(root,'utf16.txt'),format={encoding:'utf16le',bom:true,eol:'\r\n',mixed:false};
 const original=codec.encode('甲😀\nline\n',format);fs.writeFileSync(file,original);
 test('unchanged UTF16 byte preservation',()=>{const doc=store.read(file);store.save(file,doc.content,doc.format,doc.sha256);assert(fs.readFileSync(file).equals(original));});
 test('edited UTF16 BOM/CRLF preservation',()=>{const doc=store.read(file);store.save(file,doc.content+'新\n',doc.format,doc.sha256);const updated=codec.decode(fs.readFileSync(file));assert.equal(updated.format.encoding,'utf16le');assert(updated.format.bom);assert.equal(updated.format.eol,'\r\n');assert(updated.text.endsWith('新\n'));});
 test('external conflict preserves bytes',()=>{const doc=store.read(file);const changed=codec.encode('external\n',format);fs.writeFileSync(file,changed);assert.throws(()=>store.save(file,'mine',doc.format,doc.sha256),{code:'CONFLICT'});assert(fs.readFileSync(file).equals(changed));});
 test('new file expected absent',()=>{const p=path.join(root,'new.txt');const saved=store.save(p,'new\n',{encoding:'utf8',bom:false,eol:'\n',mixed:false},null);assert.equal(store.read(p).sha256,saved.sha256);});
 test('unexpected existing file rejected',()=>{const before=fs.readFileSync(file);assert.throws(()=>store.save(file,'overwrite',format,null),{code:'CONFLICT'});assert(fs.readFileSync(file).equals(before));});
 test('directory rejected',()=>assert.throws(()=>store.read(root),{code:'NOT_REGULAR'}));
 test('invalid Unicode preserves old file',()=>{const doc=store.read(file),before=fs.readFileSync(file);assert.throws(()=>store.save(file,'\ud800',format,doc.sha256),{code:'INVALID_UNICODE'});assert(fs.readFileSync(file).equals(before));});
 test('mixed endings preserve old file',()=>{const p=path.join(root,'mixed.txt'),before=Buffer.from('a\r\nb\n');fs.writeFileSync(p,before);const doc=store.read(p);assert.throws(()=>store.save(p,doc.content,doc.format,doc.sha256),{code:'MIXED_EOL'});assert(fs.readFileSync(p).equals(before));});
 test('read absent explicit error',()=>assert.throws(()=>store.read(path.join(root,'absent.txt')),{code:'ENOENT'}));
 test('fsync failure preserves original',()=>{const doc=store.read(file),before=fs.readFileSync(file),sync=fs.fsyncSync;fs.fsyncSync=()=>{const e=Error('injected fsync fault');e.code='EIO';throw e;};try{assert.throws(()=>store.save(file,'changed',format,doc.sha256),{code:'EIO'});assert(fs.readFileSync(file).equals(before));}finally{fs.fsyncSync=sync;}});
 test('temporary artifacts cleaned',()=>assert(!fs.readdirSync(root).some(n=>n.startsWith('.editledger-'))));
  console.log('EDITLEDGER_STORE|passed='+cases.length+'|total=11');assert.equal(cases.length,11);
} finally {
 const target=path.resolve(root);
 if(!target.startsWith(base+path.sep)||fs.lstatSync(target).isSymbolicLink())throw Error('Cleanup scope rejected');
 fs.rmSync(target,{recursive:true,force:false});
}
