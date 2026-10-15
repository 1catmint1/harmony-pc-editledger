const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const file=process.env.EDITLEDGER_RENDERER || '../integration/renderer.js';
const source=fs.readFileSync(require('path').resolve(__dirname,file),'utf8');
const start=source.indexOf('async function saveFile() {'),end=source.indexOf('// ========== 查找替换',start);
assert(start>=0&&end>start);
function setup(){const a={id:1,path:'a.txt',name:'a.txt',content:'A',revision:0,modified:true,format:{encoding:'utf8',bom:false,eol:'\n',mixed:false},sha256:'old-a'},b={id:2,path:'b.txt',name:'b.txt',content:'B',revision:0,modified:true,format:{encoding:'utf8',bom:false,eol:'\n',mixed:false},sha256:'old-b'};const calls=[],alerts=[],status=[];let dialogResolve,writeResolve;const dialog=new Promise(r=>dialogResolve=r),write=new Promise(r=>writeResolve=r);const ctx={tabs:[a,b],activeTabId:1,path:require('path'),saveTabState(){},markTabModified(id,dirty){ctx.tabs.find(t=>t.id===id).modified=dirty},updateFileStatus(tab){status.push(tab.id)},showAlert:async text=>alerts.push(text),ipcRenderer:{invoke(name,...args){calls.push({name,args});return name==='dialog:saveFile'?dialog:write}}};Object.assign(ctx,Function('ctx','with(ctx) {'+source.slice(start,end)+'; return {saveFile,saveFileAs,saveCapturedTab};}')(ctx));return {ctx,a,b,calls,alerts,status,dialogResolve,writeResolve};}
const cases=[];
(async()=>{
 let x=setup(),task=x.ctx.saveFile();x.ctx.activeTabId=2;x.writeResolve({success:true,sha256:'new-a',format:x.a.format});await task;assert(x.b.modified);assert(!x.a.modified);assert.equal(x.calls[0].args[1],'A');assert.equal(x.status.length,0);cases.push('save switch keeps B dirty');
 x=setup();task=x.ctx.saveFileAs();x.ctx.activeTabId=2;x.dialogResolve({canceled:false,filePath:'renamed.txt',expectedSha:null});await Promise.resolve();x.writeResolve({success:true,sha256:'saved-a',format:x.a.format});await task;assert.equal(x.calls.find(c=>c.name==='file:write').args[1],'A');assert.equal(x.a.path,'renamed.txt');assert.equal(x.b.path,'b.txt');assert(x.b.modified);cases.push('Save As captures pre-dialog A');
 x=setup();task=x.ctx.saveFile();x.a.content='A2';x.a.revision++;x.writeResolve({success:true,sha256:'saved-a',format:x.a.format});await task;assert(x.a.modified);assert.equal(x.a.content,'A2');cases.push('edit during save stays dirty');
 x=setup();task=x.ctx.saveFileAs();x.ctx.tabs.splice(0,1);x.dialogResolve({canceled:false,filePath:'new.txt',expectedSha:null});await task;assert(!x.calls.some(c=>c.name==='file:write'));cases.push('closed tab is not written after dialog');
 x=setup();task=x.ctx.saveFile();await x.ctx.saveFile();assert.equal(x.calls.filter(c=>c.name==='file:write').length,1);assert.equal(x.alerts.length,1);x.writeResolve({success:true,sha256:'new-a',format:x.a.format});await task;cases.push('duplicate save serialized');
 x=setup();task=x.ctx.saveFile();x.writeResolve({success:false,error:'conflict'});await task;assert(x.a.modified);assert.equal(x.a.sha256,'old-a');assert(!x.a.saving);cases.push('failed save retains dirty and original stamp');
  console.log('EDITLEDGER_SAVE_BINDING|passed='+cases.length+'|total=6');
})().catch(e=>{console.error(e);process.exitCode=1;});
