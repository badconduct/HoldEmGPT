import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parse} from 'acorn';

test('piano MIDI is small, quiet, valid format 0 and ends with no held notes',async()=>{
  const midi=await readFile(new URL('../public/music/midnight-ledger.mid',import.meta.url));
  assert.equal(midi.toString('ascii',0,4),'MThd');assert.equal(midi.readUInt32BE(4),6);assert.equal(midi.readUInt16BE(8),0);assert.equal(midi.readUInt16BE(10),1);assert.equal(midi.readUInt16BE(12),192);
  assert.equal(midi.toString('ascii',14,18),'MTrk');assert.equal(midi.readUInt32BE(18),midi.length-22);assert(midi.length<5000);
  let offset=22,ticks=0,tempo=0,notes=0,end=false,program=-1;const held=new Set();
  function vlq(){let v=0,b;do{b=midi[offset++];v=(v<<7)|(b&127);}while(b&128);return v;}
  while(offset<midi.length){ticks+=vlq();const status=midi[offset++];
    if(status===0xff){const type=midi[offset++],len=vlq();if(type===0x51)tempo=midi.readUIntBE(offset,3);if(type===0x2f){assert.equal(held.size,0);end=true;}offset+=len;continue;}
    const kind=status&0xf0,first=midi[offset++];assert(first<128);if(kind===0xc0){program=first;continue;}const second=midi[offset++];assert(second<128);
    if(kind===0x90 && second>0){assert(!held.has(first),'Overlapping piano note '+first);held.add(first);notes++;assert(second<=46);}
    if(kind===0x80 || (kind===0x90 && second===0)){assert(held.has(first),'Unmatched note-off');held.delete(first);}
  }
  assert.equal(offset,midi.length);assert(end);assert.equal(program,0);assert(notes>250);assert(ticks/192*tempo/1e6>100 && ticks/192*tempo/1e6<102);
});

test('legacy music toggle starts softly, stops immediately, and honors its saved off preference',async()=>{
  const source=await readFile(new URL('../public/music.js',import.meta.url),'utf8');parse(source,{ecmaVersion:3});
  function setup(cookie='',supported=true){const button={},sound=supported?{loop:1,volume:0,src:''}:{},children=[],document={cookie,getElementById:()=>button,createElement:()=>sound,getElementsByTagName:()=>[{appendChild:child=>children.push(child)}]};vm.runInNewContext(source,{document});return {button,sound,document,children};}
  const active=setup();assert.equal(active.sound.loop,-1);assert.equal(active.sound.src,'/music/midnight-ledger.mid');assert.equal(active.button.innerHTML,'Music: On');assert.equal(active.children.length,1);
  active.button.onclick();assert.equal(active.sound.src,'');assert.equal(active.sound.volume,-10000);assert.equal(active.button.innerHTML,'Music: Off');assert(active.document.cookie.includes('holdemmusic=off'));
  const restored=setup('holdemmusic=off; holdemview=classic');assert.equal(restored.sound.src,'');assert.equal(restored.button.innerHTML,'Music: Off');restored.button.onclick();assert.equal(restored.sound.src,'/music/midnight-ledger.mid');assert(restored.document.cookie.includes('holdemmusic=on'));
  const unsupported=setup('',false);assert.equal(unsupported.button.disabled,true);assert.equal(unsupported.children.length,0);assert.equal(unsupported.button.innerHTML,'Music: MIDI');
});
