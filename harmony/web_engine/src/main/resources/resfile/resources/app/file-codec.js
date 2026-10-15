// Copyright (c) 2026 EditLedger contributors. New module licensed under MIT.
'use strict';
const crypto = require('crypto');
const LIMIT = 8 * 1024 * 1024;
function failure(code, message) { const error = new Error(message); error.code = code; throw error; }
function validateText(text) {
  if (text.includes('\0')) failure('BINARY_TEXT', 'NUL bytes are not accepted as editable text');
  for (let i=0;i<text.length;i++) {
    const c=text.charCodeAt(i);
    if (c>=0xd800&&c<=0xdbff) {
      const next=text.charCodeAt(++i);
      if (!(next>=0xdc00&&next<=0xdfff)) failure('INVALID_UNICODE', 'Unpaired UTF-16 surrogate');
    } else if (c>=0xdc00&&c<=0xdfff) failure('INVALID_UNICODE', 'Unpaired UTF-16 surrogate');
  }
}
function decode(bytes) {
  if (!Buffer.isBuffer(bytes)) failure('INVALID_INPUT', 'Expected file bytes');
  if (bytes.length>LIMIT) failure('SIZE_LIMIT', 'File exceeds 8 MiB');
  let body=bytes,encoding='utf8',bom=false;
  if (bytes.subarray(0,3).equals(Buffer.from([0xef,0xbb,0xbf]))) {bom=true;body=bytes.subarray(3);}
  else if (bytes.subarray(0,2).equals(Buffer.from([0xff,0xfe]))) {encoding='utf16le';bom=true;body=bytes.subarray(2);}
  else if (bytes.subarray(0,2).equals(Buffer.from([0xfe,0xff]))) {encoding='utf16be';bom=true;body=bytes.subarray(2);}
  let text;
  if (encoding==='utf8') {
    text=body.toString('utf8');
    if (!Buffer.from(text,'utf8').equals(body)) failure('UNKNOWN_ENCODING', 'Invalid UTF-8; supported inputs are UTF-8 or BOM-marked UTF-16');
  } else {
    if (body.length%2) failure('INVALID_UNICODE', 'Truncated UTF-16 code unit');
    text=(encoding==='utf16be'?Buffer.from(body).swap16():body).toString('utf16le');
  }
  validateText(text);
  const endings=new Set(text.match(/\r\n|\r|\n/g)||[]);
  const mixed=endings.size>1;
  const eol=endings.size===1?[...endings][0]:'\n';
  return {text:text.replace(/\r\n|\r/g,'\n'),format:{encoding,bom,eol,mixed},sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
}
function encode(text,format={encoding:'utf8',bom:false,eol:'\n',mixed:false}) {
  if (typeof text!=='string') failure('INVALID_INPUT', 'Expected editor text');
  validateText(text);
  if (format.mixed) failure('MIXED_EOL', 'Mixed line endings require an explicit normalization choice before saving');
  if (!['utf8','utf16le','utf16be'].includes(format.encoding)||!['\n','\r\n','\r'].includes(format.eol)||typeof format.bom!=='boolean') failure('INVALID_FORMAT', 'Unsupported file format');
  if (format.encoding!=='utf8'&&!format.bom) failure('INVALID_FORMAT', 'UTF-16 saves require an explicit BOM');
  const logical=text.replace(/\r\n|\r/g,'\n').replace(/\n/g,format.eol);
  let bytes=Buffer.from(logical,format.encoding==='utf8'?'utf8':'utf16le');
  if (format.encoding==='utf16be') bytes.swap16();
  if (format.bom) bytes=Buffer.concat([Buffer.from(format.encoding==='utf8'?[0xef,0xbb,0xbf]:format.encoding==='utf16le'?[0xff,0xfe]:[0xfe,0xff]),bytes]);
  if (bytes.length>LIMIT) failure('SIZE_LIMIT', 'Encoded file exceeds 8 MiB');
  return bytes;
}
module.exports={decode,encode,validateText,LIMIT};
