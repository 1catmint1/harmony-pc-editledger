// SPDX-License-Identifier: MIT
(()=>{'use strict';const {ipcRenderer,clipboard}=require('electron'),{commandFor}=require('./shortcut-policy'),$=id=>document.getElementById(id),editor=CodeMirror.fromTextArea($('editor'),{lineNumbers:true,lineWrapping:false,indentUnit:2,tabSize:2,mode:'text/plain'});let dirty=false,loading=false,saving=false,current=null,stamp=null,mixed=false,revision=0,docId=0;
const status=(text,bad=false)=>{$('status').textContent=text;$('status').className=bad?'error':'';};
function mark(){dirty=true;revision++;$('dirty').textContent='有未保存的修改';}
function format(){return {encoding:$('encoding').value,bom:$('bom').checked,eol:{lf:'\n',crlf:'\r\n',cr:'\r'}[$('eol').value],mixed};}
function formatView(){const f=format();$('format-note').textContent=f.encoding.toUpperCase()+' · '+(f.bom?'BOM · ':'')+$('eol').value.toUpperCase()+(mixed?' · 混合换行，请选择换行以统一':'');}
async function list(){const r=await ipcRenderer.invoke('files:list');if(!r.success){status(r.error,true);return;}$('files').replaceChildren();for(const n of r.files){const b=document.createElement('button');b.textContent=n;b.className=n===current?'active':'';b.onclick=()=>open(n);$('files').append(b);}}
function canLeave(){return !dirty||confirm('文稿有未保存修改。放弃修改并继续？');}
async function open(n){if(saving){status('正在保存，请稍候');return;}if(!canLeave())return;const id=++docId,r=await ipcRenderer.invoke('files:read',n);if(id!==docId)return;if(!r.success){status(r.error,true);return;}loading=true;editor.setValue(r.content);loading=false;current=n;stamp=r.sha256;mixed=r.format.mixed;revision=0;dirty=false;$('filename').value=n;$('encoding').value=r.format.encoding;$('bom').checked=r.format.bom;$('eol').value={'\n':'lf','\r\n':'crlf','\r':'cr'}[r.format.eol]||'lf';$('dirty').textContent='已保存';formatView();syncChoices();editor.focus();status('已打开 '+n);await list();}
$('new').onclick=()=>{if(saving||!canLeave())return;++docId;loading=true;editor.setValue('');loading=false;current=null;stamp=null;mixed=false;dirty=false;revision=0;$('filename').value='notes.txt';$('encoding').value='utf8';$('bom').checked=false;$('eol').value='lf';$('dirty').textContent='新文稿';formatView();syncChoices();editor.focus();status('新文稿已准备');};
editor.on('change',()=>{if(!loading)mark();});editor.on('cursorActivity',()=>{const p=editor.getCursor();$('position').textContent=`第 ${p.line+1} 行 · 第 ${p.ch+1} 列`;});
$('filename').oninput=mark;$('encoding').onchange=()=>{if($('encoding').value!=='utf8')$('bom').checked=true;mark();formatView();};$('bom').onchange=()=>{mark();formatView();};$('eol').onchange=()=>{mixed=false;mark();formatView();};function syncChoices(){for(const b of document.querySelectorAll('[data-choice]'))b.setAttribute('aria-pressed',String($(b.dataset.choice).value===b.dataset.value));}
function changeChoice(field,value){
 const b=[...document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice===field&&b.dataset.value===value);if(!b)return;
 const old=$(field).value;$(field).value=value;
 try{if(field==='syntax')editor.setOption('mode',value);else $(field).dispatchEvent(new Event('change',{bubbles:true}));syncChoices();if(field==='syntax'){status('语法：'+b.textContent);editor.focus();}}
 catch(error){$(field).value=old;if(field==='syntax'){try{editor.setOption('mode',old);}catch{}}syncChoices();status('设置未完成：'+error.message,true);}
}
for(const b of document.querySelectorAll('[data-choice]'))b.addEventListener('click',()=>changeChoice(b.dataset.choice,b.dataset.value));
$('save').onclick=async()=>{if(saving)return;const name=$('filename').value.trim(),id=docId,rev=revision,text=editor.getValue(),f=format(),expected=name===current?stamp:null;saving=true;$('save').disabled=true;status('正在保存…');try{const r=await ipcRenderer.invoke('files:save',name,text,f,expected);if(!r.success){status(r.error,true);return;}if(id===docId){current=name;stamp=r.sha256;dirty=revision!==rev;$('dirty').textContent=dirty?'有未保存的修改':'已保存';status('已保存 '+name+' · '+r.bytes+' 字节');await list();}}catch(x){status(x.message,true);}finally{saving=false;$('save').disabled=false;}};
$('reopen').onclick=()=>current?open(current):status('请先保存文稿');
$('find-next').onclick=()=>{const q=$('find').value;if(!q)return;const text=editor.getValue(),from=editor.indexFromPos(editor.getCursor('to'));let p=text.indexOf(q,from);if(p<0)p=text.indexOf(q);if(p<0){status('没有找到匹配文本');return;}editor.setSelection(editor.posFromIndex(p),editor.posFromIndex(p+q.length));editor.focus();status('已定位匹配文本');};
$('replace-all').onclick=()=>{const q=$('find').value;if(!q)return;const text=editor.getValue(),parts=text.split(q),count=parts.length-1;if(count){editor.setValue(parts.join($('replace').value));}status('已替换 '+count+' 处');};

function editCommand(command){
 try {
  if(command==='a'){editor.execCommand('selectAll');status('已全选文稿');}
  else if(command==='c'||command==='x'){
   const selected=editor.getSelection();if(!selected){status('请先选择文本');return;}
   clipboard.writeText(selected);if(command==='x')editor.replaceSelection('','around','cut');
   status(command==='x'?'已剪切所选文本':'已复制所选文本');
  }else if(command==='v'){
   const text=clipboard.readText();if(!text){status('剪贴板中没有可粘贴的文本');return;}
   editor.replaceSelection(text,'end','paste');status('已粘贴文本');
  }else return;
  editor.focus();
 }catch(error){status('编辑操作未完成：'+error.message,true);}
}
for(const [id,key] of [['edit-select-all','a'],['edit-copy','c'],['edit-cut','x'],['edit-paste','v']])$(id).addEventListener('click',()=>editCommand(key));
function dispatchCommand(command){
 const target=document.activeElement;
 if($('release-notice-dialog').style.display==='flex')return false;
 if(['save','new','find','replace'].includes(command)){
  if(command==='save')$('save').click();else if(command==='new')$('new').click();else $(command==='find'?'find':'replace').focus();return true;
 }
 const input=target?.matches('input:not([type=checkbox]):not([type=hidden]),textarea')&&!target.closest('.CodeMirror')&&typeof target.selectionStart==='number';
 if(input){
  if(!['a','c','x','v'].includes(command))return false;
  try{if(command==='a')target.select();else if(command==='c'||command==='x'){const text=target.value.slice(target.selectionStart,target.selectionEnd);if(text){clipboard.writeText(text);if(command==='x'){target.setRangeText('');target.dispatchEvent(new Event('input',{bubbles:true}));}}}else{target.setRangeText(clipboard.readText(),target.selectionStart,target.selectionEnd,'end');target.dispatchEvent(new Event('input',{bubbles:true}));}}catch(error){status('编辑操作未完成：'+error.message,true);}return true;
 }
 if(['undo','redo'].includes(command)){editor[command]();editor.focus();return true;}
 if(['a','c','x','v'].includes(command)){editCommand(command);return true;}return false;
}
function syncShortcutScope(){const target=document.activeElement;const scope=$('release-notice-dialog').style.display==='flex'?'notice':target?.matches('input:not([type=checkbox]):not([type=hidden]),textarea')&&!target.closest('.CodeMirror')?'text':'editor';ipcRenderer.send('editor:shortcut-scope',scope);}
document.addEventListener('focusin',syncShortcutScope);new MutationObserver(syncShortcutScope).observe($('release-notice-dialog'),{attributes:true,attributeFilter:['style']});syncShortcutScope();
const heldModifiers=new Set(),modifier=key=>key==='Control'?'control':key==='Alt'?'alt':key==='Shift'?'shift':['Meta','OS','Super'].includes(key)?'meta':null;
document.addEventListener('keydown',event=>{const held=modifier(event.key);if(held){heldModifiers.add(held);return;}const command=commandFor({type:event.type,key:event.key,isComposing:event.isComposing,ctrlKey:event.ctrlKey||heldModifiers.has('control'),altKey:event.altKey||heldModifiers.has('alt'),metaKey:event.metaKey||heldModifiers.has('meta'),shiftKey:event.shiftKey||heldModifiers.has('shift')});if(command&&dispatchCommand(command)){event.preventDefault();event.stopImmediatePropagation();}},true);
document.addEventListener('keyup',event=>{const held=modifier(event.key);if(held)heldModifiers.delete(held);},true);window.addEventListener('blur',()=>heldModifiers.clear());
ipcRenderer.on('editor:shortcut',(_event,command)=>dispatchCommand(command));

window.addEventListener('beforeunload',e=>{if(dirty&&!confirm('文稿尚未保存。关闭并放弃修改？'))e.returnValue=false;});formatView();syncChoices();editor.focus();list();
})();
