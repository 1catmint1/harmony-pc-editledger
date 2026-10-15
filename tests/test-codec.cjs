const assert=require('assert/strict');
const {decode,encode}=require('../app/file-codec');
const cases=[];
function test(name,body){body();cases.push({name,status:'PASS'});}
const text='甲😀\nline\n';
for(const encoding of ['utf8','utf16le','utf16be'])for(const eol of ['\n','\r\n','\r'])for(const bom of encoding==='utf8'?[false,true]:[true]){
 test(encoding+'/'+JSON.stringify(eol)+'/'+bom,()=>{
  const bytes=encode(text,{encoding,bom,eol,mixed:false});const result=decode(bytes);
  assert.equal(result.text,text);assert.equal(result.format.encoding,encoding);assert.equal(result.format.eol,eol);assert.equal(result.format.bom,bom);assert(encode(result.text,result.format).equals(bytes));
 });
}
test('empty valid',()=>assert.equal(decode(Buffer.alloc(0)).text,''));
test('invalid UTF8 rejected',()=>assert.throws(()=>decode(Buffer.from([0xc0,0xaf])),{code:'UNKNOWN_ENCODING'}));
test('UTF16 odd bytes rejected',()=>assert.throws(()=>decode(Buffer.from([0xff,0xfe,0x61])),{code:'INVALID_UNICODE'}));
test('unpaired UTF16 surrogate rejected',()=>assert.throws(()=>decode(Buffer.from([0xff,0xfe,0x00,0xd8])),{code:'INVALID_UNICODE'}));
test('NUL rejected',()=>assert.throws(()=>decode(Buffer.from('a\0b')),{code:'BINARY_TEXT'}));
test('mixed EOL blocked',()=>{const r=decode(Buffer.from('a\r\nb\n'));assert(r.format.mixed);assert.throws(()=>encode(r.text,r.format),{code:'MIXED_EOL'});});
test('oversized input rejected',()=>assert.throws(()=>decode(Buffer.alloc(8*1024*1024+1,65)),{code:'SIZE_LIMIT'}));
test('invalid Unicode write rejected',()=>assert.throws(()=>encode('\ud800'),{code:'INVALID_UNICODE'}));
test('UTF16 without BOM rejected',()=>assert.throws(()=>encode('text',{encoding:'utf16le',bom:false,eol:'\n',mixed:false}),{code:'INVALID_FORMAT'}));
console.log('EDITLEDGER_CODEC|passed='+cases.length+'|total=21');assert.equal(cases.length,21);
