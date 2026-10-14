// Original, deterministic GM piano composition. No samples or external music service.
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const PPQ=192, BPM=76, BAR=PPQ*4, events=[];
function event(at,bytes,priority=1){events.push({at:Math.round(at),bytes,priority});}
function note(at,pitch,length,velocity){event(at,[0x90,pitch,velocity]);event(at+length,[0x80,pitch,0],0);}
function meta(at,type,bytes){event(at,[0xff,type,...vlq(bytes.length),...bytes]);}
function vlq(n){const bytes=[n&127];while((n>>=7)>0)bytes.unshift((n&127)|128);return bytes;}
meta(0,0x03,[...Buffer.from('Midnight Ledger - original quiet piano')]);
const tempo=Math.round(60000000/BPM);meta(0,0x51,[(tempo>>16)&255,(tempo>>8)&255,tempo&255]);
meta(0,0x58,[4,2,24,8]);meta(0,0x59,[0,0]);
event(0,[0xc0,0]); // General MIDI acoustic grand piano.
event(0,[0xb0,7,52]);event(0,[0xb0,11,94]);event(0,[0xb0,10,64]);event(0,[0xb0,91,22]);
// Root, close left-hand voicing, and a gentle melodic contour for each harmony.
const C={root:48,chord:[52,55,59],melody:[72,71,67,64]}, A={root:45,chord:[49,55,60],melody:[69,67,64,61]},
 D={root:50,chord:[53,57,60],melody:[65,69,72,69]}, G={root:43,chord:[53,55,59],melody:[67,69,71,67]},
 E={root:52,chord:[55,59,62],melody:[67,71,74,71]}, F={root:41,chord:[52,57,60],melody:[69,72,76,72]},
 Fm={root:41,chord:[51,56,60],melody:[68,72,75,72]};
const progression=[C,A,D,G,C,E,D,G,F,Fm,E,A,D,G,C,G,C,A,D,G,C,E,D,G,F,Fm,E,A,D,G,C,G];
progression.forEach((h,index)=>{
  const at=index*BAR, variation=Math.floor(index/8), chordVelocity=29+(index%3), melodyVelocity=43+(index%4);
  note(at,h.root,PPQ*1.65,31);h.chord.forEach((pitch,j)=>note(at+PPQ*0.12+j*5,pitch,PPQ*1.55,chordVelocity));
  note(at+PPQ*2,h.root+12,PPQ*1.45,28);h.chord.filter(pitch=>pitch!==h.root+12).forEach((pitch,j)=>note(at+PPQ*2.15+j*4,pitch,PPQ*1.35,chordVelocity-2));
  // A lightly swung phrase with rests instead of a constant busy melody.
  const positions=variation%2===0?[0.55,1.3,2.7]:[0.7,1.7,3.0];
  positions.forEach((beat,j)=>note(at+PPQ*beat,h.melody[(j+variation)%4],PPQ*(j===2?0.65:0.55),melodyVelocity-(j===1?4:0)));
});
const end=progression.length*BAR;
event(end-2,[0xb0,64,0]);event(end-1,[0xb0,123,0]);meta(end,0x2f,[]);
events.sort((a,b)=>a.at-b.at || a.priority-b.priority);
let last=0;const track=[];for(const e of events){track.push(...vlq(e.at-last),...e.bytes);last=e.at;}
const header=Buffer.from([0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,0,PPQ]);
const trackHeader=Buffer.alloc(8);trackHeader.write('MTrk');trackHeader.writeUInt32BE(track.length,4);
const dir=fileURLToPath(new URL('../public/music/',import.meta.url));await mkdir(dir,{recursive:true});
await writeFile(new URL('../public/music/midnight-ledger.mid',import.meta.url),Buffer.concat([header,trackHeader,Buffer.from(track)]));
console.log('Midnight Ledger: 32 bars, '+BPM+' BPM, '+Math.round(32*4*60/BPM)+' seconds, '+(track.length+22)+' bytes.');
