// Local author/reviewer fixtures only. Not copied into the runtime container.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { newCampaign, enterTable, settleCampaign, validateCampaignSave } from '../lib/campaign.js';
import { casinos } from '../lib/campaign-catalog.js';
import { advanceStory, sceneToken, accuse, successorVictim } from '../lib/story.js';
import { buildCase } from '../lib/story-cases.js';
import { act } from '../lib/game.js';
import { newDeck } from '../lib/cards.js';
import { createApp } from '../server.js';
import { configuration } from '../lib/ai.js';
const args=process.argv.slice(2),option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const directory=resolve(option('--save-dir','artifacts/story-preview-saves'));
await mkdir(directory,{recursive:true});
function readScenes(s){while(s.campaign.story.scene)advanceStory(s,sceneToken(s.campaign.story));}
function win(s){
  const g=s.game,hands=['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td'].map(s=>s.split(' ')),runout='4d 2c 3h 7s 5d 8c 6d 9d'.split(' ');
  g.players.forEach((p,i)=>p.cards=hands[i]);const used=[...hands.flat(),...runout];g.deck=newDeck().filter(c=>!used.includes(c)).concat(runout.slice().reverse());
  while(g.phase!=='complete')act(g,g.actor,'allin');settleCampaign(s);
}
function campaign(id='last-cashout'){return newCampaign({name:'Review Player',portrait:'pilot'},{caseId:id});}
function finish(s){readScenes(s);for(const c of casinos)for(const t of c.tables){enterTable(s,c.id,t.id);win(s);readScenes(s);}return s;}
const fixtures=[];
async function save(label,s){
  const code=randomBytes(18).toString('hex'),data={version:3,kind:'snapshot',game:s.game,campaign:s.campaign,wallet:s.wallet};validateCampaignSave(data);
  await writeFile(join(directory,code+'.json'),JSON.stringify(data));fixtures.push({label,code});console.log(label+': '+code);
}
await save('Opening',campaign());
const reveal=campaign();readScenes(reveal);for(const t of casinos[0].tables){enterTable(reveal,casinos[0].id,t.id);win(reveal);}await save('First evidence reveal',reveal);
const dossier=finish(campaign());await save('Complete dossier and accusation',dossier);
await save('Staged-death dossier',finish(campaign('own-photograph-5')));
const correct=structuredClone(dossier);accuse(correct,buildCase(correct.campaign.story).solution);await save('Successful ending',correct);readScenes(correct);await save('Open-ended circuit',correct);
const wrong=structuredClone(dossier);accuse(wrong,{...buildCase(wrong.campaign.story).solution,weapon:'w1'});await save('Ambiguous failed ending',wrong);
const next=newCampaign({name:'New Arrival',portrait:'nurse'},{predecessor:successorVictim(wrong)});await save('Next character and inherited victim',next);
const table=campaign();readScenes(table);enterTable(table,casinos[0].id,'table-1');await save('Live poker table',table);
const codesFile=resolve(option('--codes-file','artifacts/story-preview-codes.json'));
await mkdir(resolve(codesFile,'..'),{recursive:true});await writeFile(codesFile,JSON.stringify(fixtures,null,2)+'\n');
if(args.includes('--serve')) {
  const port=Number(option('--port','4183'));
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid preview port.');
  const app=createApp(configuration({AI_MODE:'local'}),{saveDir:directory,turnDelay:50});
  app.listen(port,'127.0.0.1',()=>console.log('Local review: http://127.0.0.1:'+port+'/ — Load any code above. No deployment or external model connection.'));
  app.on('error',error=>{console.error('Preview server: '+error.code);process.exitCode=1;});
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close(()=>process.exit(0)));
}
