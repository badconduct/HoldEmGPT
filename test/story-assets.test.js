import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evidenceForms, storyAssets, sceneImages } from '../lib/story-catalog.js';
import { createApp } from '../server.js';
import { configuration } from '../lib/ai.js';
function jpegInfo(bytes) {
  assert.equal(bytes.readUInt16BE(0),0xffd8);let at=2;
  while(at<bytes.length) {
    assert.equal(bytes[at++],0xff);let marker=bytes[at++];while(marker===0xff)marker=bytes[at++];
    if(marker===0xc0 || marker===0xc2)return {baseline:marker===0xc0,height:bytes.readUInt16BE(at+3),width:bytes.readUInt16BE(at+5)};
    const length=bytes.readUInt16BE(at);assert(length>=2);at+=length;
  }
  throw new Error('JPEG size marker missing.');
}
test('all story artwork has exact small dimensions, baseline JPEG encoding and bounded byte sizes',async()=>{
  assert.equal(evidenceForms.length,25);assert.equal(storyAssets.size,58);let total=0;
  for(const path of storyAssets) {
    const bytes=await readFile(new URL('../public'+path,import.meta.url)),info=jpegInfo(bytes),thumb=path.endsWith('-thumb.jpg'),rook=path===sceneImages.rook,form=evidenceForms.some(f=>f.image===path);
    assert(info.baseline,path+' is progressive');
    assert.deepEqual([info.width,info.height],thumb?[72,48]:rook?[72,90]:form?[240,160]:[740,250],path);
    assert(bytes.length<(thumb?4000:form||rook?15000:50000),path+' exceeds its export budget');total+=bytes.length;
  }
  assert(total<550000,'Artwork exports exceed the aggregate budget');
});
test('every story artwork route serves a cached JPEG and the public export manifest contains no local source paths',async()=>{
  const app=createApp(configuration({AI_MODE:'local'}));await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
  try {
    for(const path of storyAssets) {
      const r=await fetch(base+path);assert.equal(r.status,200,path);assert.equal(r.headers.get('content-type'),'image/jpeg');assert.equal(r.headers.get('cache-control'),'public, max-age=86400');await r.arrayBuffer();
    }
    const manifest=JSON.parse(await readFile(new URL('../docs/design/story-artwork.json',import.meta.url),'utf8'));assert.equal(manifest.assets.length,58);assert(!JSON.stringify(manifest).includes('C:\\'));
    const r=await fetch(base+'/docs/design/story-artwork.json');assert.equal(r.status,404);await r.text();
  }finally{await new Promise(r=>app.close(r));}
});
