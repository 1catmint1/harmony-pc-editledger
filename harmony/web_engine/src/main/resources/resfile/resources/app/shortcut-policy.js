// SPDX-License-Identifier: MIT
'use strict';
const direct={a:'a',c:'c',x:'x',v:'v',z:'undo',y:'redo',s:'save',n:'new',f:'find',h:'replace'};
function commandFor(input){
 if(!input||input.isComposing||input.type&&input.type!=='keyDown'&&input.type!=='keydown')return null;
 if(input.meta||input.metaKey||input.alt||input.altKey||!(input.control||input.ctrlKey))return null;
 const key=typeof input.key==='string'?input.key.toLowerCase():'';
 if(input.shift||input.shiftKey)return key==='z'?'redo':null;
 return direct[key]||null;
}
module.exports={commandFor};
