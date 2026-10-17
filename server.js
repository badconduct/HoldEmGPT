import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { act, startHand, view } from './lib/game.js';
import { playerCharacters } from './lib/player-characters.js';
import { configuration, checkConnection, decision } from './lib/ai.js';
import { newWallet, BUY_IN, tableFinished, cashOut, buyTable } from './lib/bankroll.js';
import { publishQuote, publishWins } from './lib/table-talk.js';
import { characterFor, campaignAssets, casinoFor, tableFor } from './lib/campaign-catalog.js';
import { newCampaign, enterTable, settleCampaign, houseStake, retryTable, validateCampaignSave, campaignDestination } from './lib/campaign.js';
import { campaignPage, campaignPagePaths } from './lib/campaign-pages.js';
import { saveStore } from './lib/save-store.js';
import { storyAssets } from './lib/story-catalog.js';
import { advanceStory, accuse, recordTheory, successorVictim, storyLost, requireStoryForm } from './lib/story.js';
import { prepareStoryTalk, commitStoryTalk } from './lib/story-talk.js';
const root=fileURLToPath(new URL('.',import.meta.url));
const esc=v=>String(v ?? '').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const attrs=obj=>Object.entries(obj).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('');
export function stateXml(g,config,extra={}) {
  const wallet=extra.wallet || newWallet(),campaign=extra.campaign;
  const s=g?view(g):{hand:0,phase:'waiting',actor:-1,board:[],players:[],history:[],revision:0};
  let xml='<?xml version="1.0" encoding="UTF-8"?><game'+attrs({hand:s.hand,phase:s.phase,actor:s.actor,dealer:s.dealer,sb:s.sb,bb:s.bb,pot:s.pot || 0,revision:s.revision,busy:g?.busy?1:0,canNext:s.canNext?1:0,mode:config.mode,cash:wallet.cash,buyin:g?.campaign?.entry || BUY_IN,wins:wallet.wins,paid:g?.paid?1:0,canBuy:!campaign && g?.paid && tableFinished(g) && wallet.cash>=BUY_IN?1:0,campaign:campaign?1:0,story:campaign?.story?1:0,finished:g && tableFinished(g)?1:0,background:g?.campaign?.background || '/images/table-room.jpg',destination:extra.destination || campaignDestination({game:g,campaign}),recoveryCode:campaign?.recoveryCode || '',casinoName:casinoFor(g?.campaign?.casinoId)?.name || '',tableName:tableFor(g?.campaign?.casinoId,g?.campaign?.tableId)?.name || '',prize:g?.campaign?.prize || 5000})+'>';
  const status=extra.error || g?.error || (g?.busy?(s.players[s.actor]?.name || 'Dealer')+' is thinking...':s.phase==='complete'?s.result:s.phase==='waiting'?(campaign?'Choose a casino and table.':'Take a seat. Press Play Game.'):s.actor===0?'Your turn.':s.players[s.actor]?.name+' to act.');
  xml+='<status>'+esc(status)+'</status><save>'+esc(extra.save || '')+'</save><result>'+esc(s.result || '')+'</result><board>';
  for(const c of s.board) xml+='<card>'+c+'</card>';
  xml+='</board><players>';
  for(const [i,p] of s.players.entries()) {
    const c=characterFor(p.id),avatar=playerCharacters.find(c=>c.id===p.portrait),image=i===0?(avatar?.portraitUrl || '/portraits/players/drifter.jpg'):c?.portraitUrl;
    xml+='<player'+attrs({seat:i,id:p.id,name:p.name,portrait:p.portrait,stack:p.stack,bet:p.bet,folded:p.folded?1:0,out:p.out?1:0,title:c?.title || avatar?.title || 'Your seat',style:c?.style || 'Make your own luck',action:p.lastAction,actionStreet:p.actionStreet,actionHand:p.actionHand,image})+'>';
    for(const card of p.cards) xml+='<card>'+card+'</card>';xml+='</player>';
  }
  xml+='</players>';
  if(s.legal && !g.busy && !g.error) xml+='<legal'+attrs(s.legal)+'/>';
  xml+='<history>';for(const h of s.history)xml+='<event>'+esc(h)+'</event>';
  xml+='</history><dialogue>';
  for(const q of g?.dialogue || [])xml+='<quote'+attrs({id:q.id,seat:q.seat,name:q.name,portrait:q.portrait,hand:q.hand,street:q.street,action:q.action,replyToSeat:q.replyToSeat,kind:q.kind || 'move',amount:q.amount || 0})+'>'+esc(q.text)+'</quote>';
  return xml+'</dialogue><error>'+esc(extra.error || g?.error || '')+'</error></game>';
}
export function createApp(config,{saveDir=process.env.SAVE_DIR || join(root,'data','saves'),publicOrigin=process.env.PUBLIC_ORIGIN,secureCookies=process.env.COOKIE_SECURE==='true',turnDelay=350}={}) {
  if(publicOrigin) {
    let origin;try{origin=new URL(publicOrigin);}catch{throw new Error('Invalid PUBLIC_ORIGIN.');}
    if(!['http:','https:'].includes(origin.protocol) || origin.origin!==publicOrigin)throw new Error('PUBLIC_ORIGIN must be an HTTP(S) origin without a path.');
  }
  const sessions=new Map(),owners=new Map(),store=saveStore(saveDir);
  const snapshot=(s,kind='autosave')=>({version:s.campaign?3:2,kind,game:s.game?{...s.game,busy:false,closed:false}:null,wallet:s.wallet,...(s.campaign?{campaign:s.campaign}:{})});
  const persist=s=>s.campaign?store.write(s.campaign.recoveryCode,snapshot(s)):Promise.resolve();
  function detach(s) {if(s.game)s.game.closed=true;if(s.campaign && owners.get(s.campaign.recoveryCode)===s)owners.delete(s.campaign.recoveryCode);}
  function settle(s) {if(!s.game)return;publishWins(s.game);if(s.campaign)settleCampaign(s);else cashOut(s.game,s.wallet);}
  async function pump(s) {
    const g=s.game;
    if(!g || storyLost(s) || g.busy || g.error || g.actor<1 || g.phase==='complete')return;
    g.busy=true;
    try {
      while(g.actor>0 && g.phase!=='complete' && !g.closed) {
        const i=g.actor;
        await new Promise(r=>setTimeout(r,turnDelay));if(g.closed)break;
        prepareStoryTalk(g);
        const d=await decision(g,i,config);if(g.closed)break;
        act(g,i,d.action,d.amount);g.players[i].memory.push(d.memory);g.players[i].memory=g.players[i].memory.slice(-12);
        const storyLine=commitStoryTalk(g,i,d.storyLineId);
        publishQuote(g,i,storyLine?{...d,say:storyLine.text,replyToSeat:storyLine.replyToSeat}:d,{story:!!storyLine});settle(s);await persist(s);
      }
    } catch {if(!g.closed)g.error='Opponent could not act or autosave could not finish. Press Retry to try this turn again.';}
    finally {
      g.busy=false;
      if(!g.closed && s.game===g) {settle(s);try{await persist(s);}catch{g.error='Could not save progress. Press Retry to save again.';}}
    }
  }
  function sessionFor(req,res) {
    const cookie=/(?:^|;\s*)holdem=([a-f0-9]{48})(?:;|$)/.exec(req.headers.cookie || '');
    let id=cookie?.[1],s=id?sessions.get(id):null;
    if(!s) {
      if(sessions.size>=500)throw new Error('Table capacity reached.');
      id=randomBytes(24).toString('hex');s={game:null,campaign:null,wallet:newWallet(),csrf:randomBytes(24).toString('hex'),at:Date.now()};sessions.set(id,s);
      res.setHeader('Set-Cookie','holdem='+id+'; Path=/; HttpOnly; SameSite=Lax'+(secureCookies?'; Secure':''));
    }
    s.at=Date.now();return s;
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    let locked=null;
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/healthz' && ['GET','HEAD'].includes(req.method)) {res.setHeader('Content-Type','application/json; charset=utf-8');return res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',service:'holdemgpt',mode:config.mode}));}
      if(!url.pathname.startsWith('/api/')) {
        if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
        if(campaignPagePaths.has(url.pathname)) {
          const page=campaignPage(url,sessionFor(req,res));
          if(page.redirect){res.writeHead(302,{Location:page.redirect});return res.end();}
          res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(req.method==='HEAD'?undefined:page.html);
        }
        if(url.pathname==='/table.html') {
          const session=sessionFor(req,res);
          if(session.campaign?.story && (storyLost(session) || !session.game || tableFinished(session.game) && session.campaign.story.scene)) {
            res.writeHead(302,{Location:campaignDestination(session)});return res.end();
          }
        }
        const allowed={'/freeplay.html':'public/freeplay.html','/table.html':'public/table.html','/client.js':'public/client.js','/lobby.js':'public/lobby.js','/campaign.js':'public/campaign.js','/campaign.css':'public/campaign.css','/music.js':'public/music.js','/style.css':'public/style.css','/images/table-room.jpg':'public/images/table-room.jpg','/music/midnight-ledger.mid':'public/music/midnight-ledger.mid'};
        const file=allowed[url.pathname] || (campaignAssets.has(url.pathname)||storyAssets.has(url.pathname)?'public'+url.pathname:null);
        if(!file){res.writeHead(404);return res.end('Not found');}
        const data=await readFile(join(root,file));res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.mid')?'audio/midi':'image/jpeg');
        if(file.endsWith('.jpg') || file.endsWith('.mid')){res.setHeader('Cache-Control','public, max-age=86400');res.setHeader('Expires',new Date(Date.now()+86400000).toUTCString());}
        res.setHeader('Content-Length',data.length);return res.end(req.method==='HEAD'?undefined:data);
      }
      res.setHeader('Content-Type','text/xml; charset=utf-8');
      const s=sessionFor(req,res);
      const response=extra=>stateXml(s.game,config,{wallet:s.wallet,campaign:s.campaign,...extra});
      if(req.method==='GET' && url.pathname==='/api/state'){if(s.game)publishWins(s.game);return res.end(response());}
      if(req.method!=='POST'){res.writeHead(405);return res.end(response({error:'Use POST for game actions.'}));}
      const origins=publicOrigin?[publicOrigin]:['http://'+req.headers.host,'https://'+req.headers.host];
      if(req.headers.origin && !origins.includes(req.headers.origin)){res.writeHead(403);return res.end(response({error:'Invalid request origin.'}));}
      if(s.locked)throw new Error('The previous request is still being saved. Try again.');
      s.locked=true;locked=s;
      let body='',bytes=0;
      for await(const chunk of req){bytes+=chunk.length;if(bytes>8192){res.writeHead(413);res.end();return;}body+=chunk;}
      const form=new URLSearchParams(body);let g=s.game,extra={},run=false;
      const nativeForm=req.headers['x-holdem-request']!=='1';
      if(nativeForm && (!s.csrf || form.get('csrf')!==s.csrf)){res.writeHead(403);return res.end(response({error:'Invalid request origin.'}));}
      if(g?.busy && !['/api/new','/api/campaign/new'].includes(url.pathname))throw new Error('Wait for the current decision to finish.');
      if(storyLost(s) && ['/api/action','/api/next','/api/retry','/api/campaign/buy','/api/campaign/stake','/api/campaign/restart'].includes(url.pathname))throw new Error('This character\'s story has ended. Start a new game from the main menu.');
      switch(url.pathname) {
        case '/api/campaign/new': {
          const next=newCampaign({name:form.get('name') ?? 'You',portrait:form.get('portrait') ?? 'drifter'},{predecessor:successorVictim(s)});
          detach(s);Object.assign(s,next);owners.set(s.campaign.recoveryCode,s);break;
        }
        case '/api/campaign/buy':enterTable(s,form.get('casino'),form.get('table'));run=true;break;
        case '/api/campaign/stake':houseStake(s);break;
        case '/api/campaign/restart':retryTable(s);run=true;break;
        case '/api/story/advance':advanceStory(s,form.get('scene'));break;
        case '/api/story/theory':requireStoryForm(s,form.get('case'));recordTheory(s,Object.fromEntries(form));extra.destination='/evidence.html?section=notes';break;
        case '/api/story/accuse':
          requireStoryForm(s,form.get('case'));
          if(form.get('confirm')!=='yes')throw new Error('Review your selections before confirming the final accusation.');
          accuse(s,{boss:form.get('boss'),hotel:form.get('hotel'),weapon:form.get('weapon')});break;
        case '/api/new': {
          const wallet=newWallet(),next=buyTable(wallet,null,{name:form.get('name') ?? 'You',portrait:form.get('portrait') ?? 'drifter'});
          detach(s);Object.assign(s,{game:next,wallet,campaign:null});run=true;break;
        }
        case '/api/buy': {
          if(s.campaign)throw new Error('Choose your next campaign table from its casino.');
          if(!g)throw new Error('Start a game first.');cashOut(g,s.wallet);
          const next=buyTable(s.wallet,g,{name:g.players[0].name,portrait:g.players[0].portrait || 'drifter'});g.closed=true;s.game=next;run=true;break;
        }
        case '/api/action':
          if(!g || g.error)throw new Error('Start a game or retry the pending opponent first.');
          if(Number(form.get('revision'))!==g.revision)throw new Error('The table changed. Choose your action again.');
          act(g,0,form.get('action'),Number(form.get('amount')));settle(s);run=true;break;
        case '/api/next':if(!g)throw new Error('Start a game first.');startHand(g);settle(s);run=true;break;
        case '/api/retry':if(!g)throw new Error('Start a game first.');g.error='';run=true;break;
        case '/api/save': {
          if(!g && !s.campaign)throw new Error('Start a game first.');settle(s);
          const code=randomBytes(18).toString('hex');await store.write(code,snapshot(s,'snapshot'));extra.save=code;break;
        }
        case '/api/load': {
          const code=form.get('code') || '',saved=await store.read(code);
          if(![1,2,3].includes(saved.version))throw new Error('Unsupported save.');
          if(saved.version===3)validateCampaignSave(saved);
          else if(!saved.game?.players || saved.game.players.length!==5 || saved.game.campaign)throw new Error('Unsupported save.');
          const wallet=saved.version===1?{cash:2000,wins:0}:saved.wallet;
          if(!wallet || !Number.isSafeInteger(wallet.cash) || wallet.cash<0 || !Number.isSafeInteger(wallet.wins) || wallet.wins<0)throw new Error('Invalid saved bankroll.');
          detach(s);
          const campaign=saved.version===3?saved.campaign:null;
          if(campaign) {
            campaign.recoveryCode=saved.kind==='autosave'?code:randomBytes(18).toString('hex');
            const owner=owners.get(campaign.recoveryCode);
            if(owner && owner!==s){detach(owner);owner.game=null;owner.campaign=null;owner.wallet=newWallet();}
            owners.set(campaign.recoveryCode,s);
          }
          Object.assign(s,{game:saved.game,campaign,wallet});g=s.game;
          if(g){g.busy=false;g.closed=false;g.error='';g.revision++;}settle(s);run=true;break;
        }
        default:res.writeHead(404);extra.error='Unknown game action.';
      }
      await persist(s);if(run)void pump(s);
      if(nativeForm){res.writeHead(303,{Location:extra.destination || campaignDestination(s)});return res.end();}
      res.end(response(extra));
    } catch(error) {
      if(res.headersSent){res.end();return;}
      res.writeHead(400,{'Content-Type':'text/xml; charset=utf-8'});
      res.end('<?xml version="1.0"?><failure>'+esc(error.code?'Server storage or file operation failed.':error.message)+'</failure>');
    } finally {if(locked)locked.locked=false;}
  });
  const cleanup=setInterval(()=>{for(const [id,s] of sessions)if(Date.now()-s.at>24*60*60*1000){detach(s);sessions.delete(id);}},60000);cleanup.unref();
  server.on('close',()=>{clearInterval(cleanup);for(const s of sessions.values())detach(s);});
  return server;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let config;
  try{config=configuration();await checkConnection(config);}
  catch(error){console.error('Startup failed: '+(error.message.startsWith('AI ') || error.message.startsWith('API ') || error.message.startsWith('Configured AI ') || error.message.startsWith('Could not read AI_TOKEN_FILE')?error.message:'Check server configuration and AI provider availability.'));process.exit(1);}
  const port=Number(process.env.PORT || 3083),host=process.env.HOST || '0.0.0.0';
  if(!Number.isInteger(port) || port<1 || port>65535)throw new Error('PORT must be between 1 and 65535.');
  const app=createApp(config);
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{app.close(()=>process.exit(0));setTimeout(()=>process.exit(0),10000).unref();});
  app.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port '+port+' is already in use. Set PORT in .env to an available port.':'Server could not listen: '+error.code);process.exitCode=1;});
  app.listen(port,host,()=>console.log('Fortune Row: http://localhost:'+port+' / '+config.mode+' opponents'));
}
