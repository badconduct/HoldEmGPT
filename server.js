import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { createGame, act, startHand, view } from './lib/game.js';
import { characters } from './lib/characters.js';
import { playerCharacters } from './lib/player-characters.js';
import { configuration, checkConnection, decision } from './lib/ai.js';
import { newWallet, BUY_IN, tableFinished, cashOut, buyTable } from './lib/bankroll.js';
import { publishQuote, publishWins } from './lib/table-talk.js';
const root=fileURLToPath(new URL('.',import.meta.url));
const esc=v=>String(v ?? '').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const attrs=obj=>Object.entries(obj).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('');
export function stateXml(g,config,extra={}) {
  const wallet=extra.wallet || newWallet();
  const s=g?view(g):{hand:0,phase:'waiting',actor:-1,board:[],players:[],history:[],revision:0};
  let xml='<?xml version="1.0" encoding="UTF-8"?><game'+attrs({hand:s.hand,phase:s.phase,actor:s.actor,dealer:s.dealer,sb:s.sb,bb:s.bb,pot:s.pot || 0,revision:s.revision,busy:g?.busy?1:0,canNext:s.canNext?1:0,mode:config.mode,cash:wallet.cash,buyin:BUY_IN,wins:wallet.wins,paid:g?.paid?1:0,canBuy:g?.paid && tableFinished(g) && wallet.cash>=BUY_IN?1:0})+'>';
  const status=extra.error || g?.error || (g?.busy?(s.players[s.actor]?.name || 'Dealer')+' is thinking...':s.phase==='complete'?s.result:s.phase==='waiting'?'Take a seat. Press Play Game.':s.actor===0?'Your turn.':s.players[s.actor]?.name+' to act.');
  xml+='<status>'+esc(status)+'</status><save>'+esc(extra.save || '')+'</save><result>'+esc(s.result || '')+'</result><board>';
  for(const c of s.board) xml+='<card>'+c+'</card>';
  xml+='</board><players>';
  for(const [i,p] of s.players.entries()) { const c=characters.find(c=>c.id===p.id), avatar=playerCharacters.find(c=>c.id===p.portrait); xml+='<player'+attrs({seat:i,id:p.id,name:p.name,portrait:p.portrait,stack:p.stack,bet:p.bet,folded:p.folded?1:0,out:p.out?1:0,title:c?.title || avatar?.title || 'Your seat',style:c?.style || 'Make your own luck',action:p.lastAction,actionStreet:p.actionStreet,actionHand:p.actionHand})+'>'; for(const card of p.cards) xml+='<card>'+card+'</card>'; xml+='</player>'; }
  xml+='</players>';
  if(s.legal && !g.busy && !g.error) xml+='<legal'+attrs(s.legal)+'/>';
  xml+='<history>'; for(const h of s.history) xml+='<event>'+esc(h)+'</event>';
  xml+='</history><dialogue>';
  for(const q of g?.dialogue || [])xml+='<quote'+attrs({id:q.id,seat:q.seat,name:q.name,portrait:q.portrait,hand:q.hand,street:q.street,action:q.action,replyToSeat:q.replyToSeat,kind:q.kind || 'move',amount:q.amount || 0})+'>'+esc(q.text)+'</quote>';
  return xml+'</dialogue><error>'+esc(extra.error || g?.error || '')+'</error></game>';
}
export function createApp(config,{saveDir=process.env.SAVE_DIR || join(root,'data','saves'),publicOrigin=process.env.PUBLIC_ORIGIN,secureCookies=process.env.COOKIE_SECURE==='true'}={}) {
  if(publicOrigin) {
    let origin; try { origin=new URL(publicOrigin); } catch { throw new Error('Invalid PUBLIC_ORIGIN.'); }
    if(!['http:','https:'].includes(origin.protocol) || origin.origin!==publicOrigin) throw new Error('PUBLIC_ORIGIN must be an HTTP(S) origin without a path.');
  }
  const sessions=new Map();
  async function pump(g,wallet) {
    if(g.busy || g.error || g.actor<1 || g.phase==='complete') return;
    g.busy=true;
    try {
      while(g.actor>0 && g.phase!=='complete' && !g.closed) {
        const i=g.actor;
        await new Promise(r=>setTimeout(r,350));
        if(g.closed) break;
        const d=await decision(g,i,config);
        if(g.closed) break;
        act(g,i,d.action,d.amount);
        g.players[i].memory.push(d.memory); g.players[i].memory=g.players[i].memory.slice(-12);
        publishQuote(g,i,d);
      }
    } catch { if(!g.closed) g.error='Opponent could not act. Press Retry to try the same turn again.'; }
    finally {g.busy=false;if(!g.closed)cashOut(g,wallet);}
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/healthz' && (req.method==='GET' || req.method==='HEAD')) {
        res.setHeader('Content-Type','application/json; charset=utf-8');
        return res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',service:'holdemgpt',mode:config.mode}));
      }
      if(!url.pathname.startsWith('/api/')) {
        if(req.method!=='GET' && req.method!=='HEAD') {res.writeHead(405); return res.end();}
        const allowed={'/':'public/index.html','/table.html':'public/table.html','/client.js':'public/client.js','/lobby.js':'public/lobby.js','/music.js':'public/music.js','/style.css':'public/style.css','/images/table-room.jpg':'public/images/table-room.jpg','/music/midnight-ledger.mid':'public/music/midnight-ledger.mid'};
        const file=allowed[url.pathname] || (/^\/portraits\/(rail|ruby|dusty|ada|ace|nell|jack|pearl)\.jpg$/.test(url.pathname) || /^\/portraits\/players\/(drifter|heiress|pilot|reporter|crooner)\.jpg$/.test(url.pathname)?'public'+url.pathname:null);
        if(!file) {res.writeHead(404); return res.end('Not found');}
        const content=await readFile(join(root,file)); res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.mid')?'audio/midi':'image/jpeg');
        if(file.endsWith('.jpg') || file.endsWith('.mid')) {res.setHeader('Cache-Control','public, max-age=86400');res.setHeader('Expires',new Date(Date.now()+86400000).toUTCString());}
        res.setHeader('Content-Length',content.length);
        return res.end(req.method==='HEAD'?undefined:content);
      }
      res.setHeader('Content-Type','text/xml; charset=utf-8');
      const cookie=/(?:^|;\s*)holdem=([a-f0-9]{48})(?:;|$)/.exec(req.headers.cookie || '');
      let id=cookie?.[1], session=id?sessions.get(id):null;
      if(!session) {
        if(sessions.size>=500) {res.writeHead(503);return res.end('<error>Table capacity reached.</error>');}
        id=randomBytes(24).toString('hex'); session={game:null,wallet:newWallet(),at:Date.now()}; sessions.set(id,session);
        res.setHeader('Set-Cookie','holdem='+id+'; Path=/; HttpOnly; SameSite=Lax'+(secureCookies?'; Secure':''));
      }
      session.at=Date.now();
      if(req.method==='GET' && url.pathname==='/api/state') {if(session.game)publishWins(session.game);return res.end(stateXml(session.game,config,{wallet:session.wallet}));}
      if(req.method!=='POST') {res.writeHead(405);return res.end(stateXml(session.game,config,{error:'Use POST for game actions.'}));}
      // Same-origin form requests work in IE6; modern origin headers are also checked.
      const origins=publicOrigin?[publicOrigin]:['http://'+req.headers.host,'https://'+req.headers.host];
      if(req.headers['x-holdem-request']!=='1' || (req.headers.origin && !origins.includes(req.headers.origin))) {res.writeHead(403);return res.end(stateXml(session.game,config,{error:'Invalid request origin.'}));}
      let body='', bytes=0;
      for await(const chunk of req) {bytes+=chunk.length; if(bytes>4096) {res.writeHead(413);res.end();return;} body+=chunk;}
      const form=new URLSearchParams(body); let g=session.game;
      if(g?.busy && url.pathname!=='/api/new') throw new Error('Wait for the current decision to finish.');
      let extra={};
      switch(url.pathname) {
        case '/api/new': {
          const wallet=newWallet(), next=buyTable(wallet,null,{name:form.get('name') ?? 'You',portrait:form.get('portrait') ?? 'drifter'});
          if(g) g.closed=true; g=next; session.game=g; session.wallet=wallet; void pump(g,wallet); break;
        }
        case '/api/buy': {
          if(!g) throw new Error('Start a game first.');
          cashOut(g,session.wallet);
          const next=buyTable(session.wallet,g,{name:g.players[0].name,portrait:g.players[0].portrait || 'drifter'});
          g.closed=true;g=next;session.game=g;void pump(g,session.wallet);break;
        }
        case '/api/action':
          if(!g || g.error) throw new Error('Start a game or retry the pending opponent first.');
          if(Number(form.get('revision'))!==g.revision) throw new Error('The table changed. Choose your action again.');
          act(g,0,form.get('action'),Number(form.get('amount'))); publishWins(g);cashOut(g,session.wallet);void pump(g,session.wallet); break;
        case '/api/next':
          if(!g) throw new Error('Start a game first.'); startHand(g); publishWins(g);cashOut(g,session.wallet);void pump(g,session.wallet); break;
        case '/api/retry':
          if(!g) throw new Error('Start a game first.'); g.error=''; void pump(g,session.wallet); break;
        case '/api/save': {
          if(!g) throw new Error('Start a game first.');
          const code=randomBytes(18).toString('hex');
          await mkdir(saveDir,{recursive:true});
          cashOut(g,session.wallet);
          const path=join(saveDir,code+'.json'); await writeFile(path+'.tmp',JSON.stringify({version:2,game:g,wallet:session.wallet}),{flag:'wx'}); await rename(path+'.tmp',path);
          extra.save=code; break;
        }
        case '/api/load': {
          const code=form.get('code') || ''; if(!/^[a-f0-9]{36}$/.test(code)) throw new Error('Enter a valid save code.');
          let saved; try {saved=JSON.parse(await readFile(join(saveDir,code+'.json'),'utf8'));} catch {throw new Error('That save could not be found.');}
          if(![1,2].includes(saved.version) || !saved.game?.players || saved.game.players.length!==5) throw new Error('Unsupported save.');
          const wallet=saved.version===1?{cash:2000,wins:0}:saved.wallet;
          if(!wallet || !Number.isSafeInteger(wallet.cash) || wallet.cash<0 || !Number.isSafeInteger(wallet.wins) || wallet.wins<0) throw new Error('Invalid saved bankroll.');
          if(g) g.closed=true; g=saved.game; g.id=randomBytes(16).toString('hex'); g.busy=false; g.closed=false; g.error=''; g.revision++; session.game=g;session.wallet=wallet;cashOut(g,wallet); void pump(g,wallet); break;
        }
        default: res.writeHead(404); extra.error='Unknown game action.';
      }
      res.end(stateXml(g,config,{...extra,wallet:session.wallet}));
    } catch(error) {
      if(res.headersSent) {res.end();return;}
      res.writeHead(400,{'Content-Type':'text/xml; charset=utf-8'});
      // Game rule errors contain no credentials or hidden cards.
      const message=error.code?'Server storage or file operation failed.':error.message;
      res.end('<?xml version="1.0"?><failure>'+esc(message)+'</failure>');
    }
  });
  const cleanup=setInterval(()=>{for(const [id,s] of sessions) if(Date.now()-s.at>24*60*60*1000) {if(s.game)s.game.closed=true;sessions.delete(id);}},60000); cleanup.unref();server.on('close',()=>{clearInterval(cleanup);for(const s of sessions.values())if(s.game)s.game.closed=true;});
  return server;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let config;
  try { config=configuration(); await checkConnection(config); }
  catch(error) { console.error('Startup failed: '+(error.message.startsWith('AI ') || error.message.startsWith('API ') || error.message.startsWith('Configured AI ') || error.message.startsWith('Could not read AI_TOKEN_FILE')?error.message:'Check server configuration and AI provider availability.')); process.exit(1); }
  const port=Number(process.env.PORT || 3083),host=process.env.HOST || '0.0.0.0';
  if(!Number.isInteger(port) || port<1 || port>65535) throw new Error('PORT must be between 1 and 65535.');
  const app=createApp(config);
  for(const signal of ['SIGTERM','SIGINT']) process.once(signal,()=>{
    app.close(()=>process.exit(0));
    setTimeout(()=>process.exit(0),10000).unref();
  });
  app.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port '+port+' is already in use. Set PORT in .env to an available port.':'Server could not listen: '+error.code);process.exitCode=1;});
  app.listen(port,host,()=>console.log('HoldEmGPT: http://localhost:'+port+' / '+config.mode+' opponents'));
}
