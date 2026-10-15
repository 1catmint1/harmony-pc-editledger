// SPDX-License-Identifier: MIT
const fs=require('fs'),path=require('path');
const upstream=path.resolve(process.argv[2]||''),json5=require(process.argv[3]||'json5');
const hap=path.join(upstream,'ohos_hap'),app=path.join(hap,'web_engine/src/main/resources/resfile/resources/app');
if(!process.argv[2]||!fs.existsSync(app+'/renderer.js')||!fs.readFileSync(app+'/renderer.js','utf8').includes('saveCapturedTab'))throw Error('Apply frontend.patch to the pinned upstream first');
const own=path.resolve(__dirname,'../app');
for(const name of ['file-codec.js','file-store.js','vendor'])fs.cpSync(own+'/'+name,app+'/'+name,{recursive:true});
const update=(file,fn)=>{const o=json5.parse(fs.readFileSync(file,'utf8'));fn(o);fs.writeFileSync(file,JSON.stringify(o,null,2)+'\n');};
update(hap+'/AppScope/app.json5',o=>o.app.bundleName='org.editledger.pc');
update(hap+'/build-profile.json5',o=>{delete o.app.signingConfigs;for(const p of o.app.products){delete p.signingConfig;p.compatibleSdkVersion='6.0.2(22)';p.targetSdkVersion='6.0.2(22)';}});
for(const rel of ['oh-package.json5','hvigor/hvigor-config.json5'])update(hap+'/'+rel,o=>o.modelVersion='5.1.0');
for(const module of ['electron','web_engine'])update(hap+'/'+module+'/src/main/module.json5',o=>{o.module.requestPermissions=(o.module.requestPermissions||[]).filter(p=>p.name==='ohos.permission.PREPARE_APP_TERMINATE');delete o.module.definePermissions;});
console.log('Public integration layer installed; upstream runtime and personal signing remain separate prerequisites.');
