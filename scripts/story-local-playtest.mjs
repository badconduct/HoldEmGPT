// Bounded, unforced local-policy tables. No provider credentials, live saves or
// campaign shortcuts. This produces a pacing/transcript sample, not balance proof.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createGame, view, legal, act, startHand, observationsFor } from '../lib/game.js';
import { tableFinished } from '../lib/bankroll.js';
import { casinos, characterFor, assetUrl } from '../lib/campaign-catalog.js';
import { newCampaign } from '../lib/campaign.js';
import { storyBoss } from '../lib/story.js';
import { buildCase } from '../lib/story-cases.js';
import { configuration, decision, localDecision } from '../lib/ai.js';
import { prepareStoryTalk, commitStoryTalk } from '../lib/story-talk.js';
import { publishQuote, publishWins } from '../lib/table-talk.js';
const option=(name,fallback)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=')[1] || fallback;
const maxHands=Number(option('max-hands',80)),maxMs=Number(option('max-ms',90000));
if(!Number.isInteger(maxHands)||maxHands<1||maxHands>500||!Number.isInteger(maxMs)||maxMs<1000||maxMs>300000)throw Error('Use max-hands 1..500 and max-ms 1000..300000.');
const config=configuration({AI_MODE:'local'}),campaign=newCampaign({name:'Policy Reader',portrait:'pilot'},{caseId:option('case','last-cashout')}).campaign;
const file=buildCase(campaign.story),started=Date.now(),tables=[];
for(const [index,casino] of casinos.entries()){
  const host=storyBoss(campaign,casino),opponents=[...casino.regulars.filter(p=>p.portrait!==host.portrait).slice(0,3),host];
  const g=createGame(campaign.profile,{opponents,campaign:{casinoId:casino.id,tableId:'boss',entry:casino.tables[4].entry,prize:casino.tables[4].prize,background:assetUrl(casino.tables[4].background),settled:false}});
  g.storyTalk={version:2,seenHand:0,count:0,lastHand:-10,plan:null,recent:[],log:[],categories:file.exhibits.filter(e=>casinos.findIndex(c=>c.id===e.awardCasino)<index).map(e=>e.category)};
  const actions=[],at=Date.now();
  while(!tableFinished(g) && g.hand<=maxHands && Date.now()-started<maxMs){
    if(g.phase==='complete'){if(g.hand>=maxHands)break;startHand(g);continue;}
    const i=g.actor,street=g.phase,hand=g.hand,options=legal(g,i),boardBefore=g.board.slice(),potBefore=g.players.reduce((n,p)=>n+p.total,0);let move,spoken=null;
    if(i===0){
      const publicState=view(g),state={hand:g.hand,seat:0,ownCards:publicState.players[0].cards,board:publicState.board,street:g.phase,pot:g.players.reduce((n,p)=>n+p.total,0),legal:options,
        players:publicState.players.map((p,seat)=>({...p,seat,wager:p.bet})),recentPlays:g.publicPlays || [],observedPatterns:observationsFor(g),recentConversation:g.dialogue || []};
      move=localDecision({user:JSON.stringify(state)},characterFor('ada'));
    }else{prepareStoryTalk(g);move=await decision(g,i,config);}
    act(g,i,move.action,move.amount);
    if(i>0){const line=commitStoryTalk(g,i,move.storyLineId);spoken=publishQuote(g,i,line?{...move,say:line.text,replyToSeat:line.replyToSeat}:move,{story:!!line}).text;}
    publishWins(g);
    const total=g.players.reduce((n,p)=>n+p.stack+(g.phase==='complete'?0:p.total),0);assert.equal(total,5000,'Chip conservation failed');
    actions.push({hand,street,seat:i,name:g.players[i].name,action:move.action,amount:move.amount || 0,publicAction:g.lastPlay.action,paid:g.lastPlay.paid,boardBefore,boardAfter:g.board.slice(),potBefore,legal:options,quote:spoken});
    assert(actions.length<20000,'Action limit exceeded');
  }
  const row={casino:casino.id,host:host.name,completed:tableFinished(g),playerWon:tableFinished(g)&&g.players[0].stack>0,hands:g.hand,actions:actions.length,elapsedMs:Date.now()-at,storyLines:g.storyTalk.log,stacks:g.players.map(p=>({name:p.name,stack:p.stack})),transcript:actions};
  tables.push(row);console.log(JSON.stringify({...row,transcript:undefined,stacks:undefined,storyLines:row.storyLines.length}));
}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/story-local-playtest.json',JSON.stringify({provider:'built-in local only',caseId:campaign.story.caseId,hero:'Ada-style local policy using only its cards and public state',maxHands,maxMs,elapsedMs:Date.now()-started,tables},null,2)+'\n');
