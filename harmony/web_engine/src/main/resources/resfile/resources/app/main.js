// SPDX-License-Identifier: MIT
'use strict';
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('fs'),path=require('path'),store=require('./file-store'),{commandFor}=require('./shortcut-policy');let base;
const checked=n=>{if(typeof n!=='string'||!n.trim()||n.length>100||/[\\/:*?"<>|\x00-\x1f]/.test(n)||n==='.'||n==='..'||n.endsWith('.')||n.endsWith(' '))throw Error('璇疯緭鍏ユ湁鏁堟枃浠跺悕');return path.join(base,n);};
app.setName('EditLedger');app.disableHardwareAcceleration();
app.whenReady().then(()=>{base=path.join(app.getPath('userData'),'documents-v1');fs.mkdirSync(base,{recursive:true});const win=new BrowserWindow({width:1440,height:940,minWidth:1000,minHeight:700,webPreferences:{nodeIntegration:true,contextIsolation:false,webSecurity:true,webviewTag:false,nodeIntegrationInSubFrames:false}});win.setMenu(null);let shortcutScope='editor';ipcMain.on('editor:shortcut-scope',(event,scope)=>{if(event.sender===win.webContents&&['editor','text','notice'].includes(scope))shortcutScope=scope;});win.webContents.on('before-input-event',(event,input)=>{const command=commandFor(input);if(command&&shortcutScope!=='notice'&&!(shortcutScope==='text'&&['undo','redo'].includes(command))){event.preventDefault();win.webContents.send('editor:shortcut',command);}});win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile('index.html');});
function handle(name,fn){ipcMain.handle(name,async(e,...a)=>{try{return {success:true,...await fn(...a)};}catch(x){return {success:false,error:x.message};}});}
handle('files:list',()=>({files:fs.readdirSync(base).filter(n=>{try{return !n.startsWith('.')&&fs.lstatSync(checked(n)).isFile()&&!fs.lstatSync(checked(n)).isSymbolicLink();}catch{return false;}}).slice(0,500).sort()}));
handle('files:read',n=>store.read(checked(n)));
handle('files:save',(n,text,format,expected)=>store.save(checked(n),text,format,expected));
app.on('window-all-closed',()=>app.quit());
