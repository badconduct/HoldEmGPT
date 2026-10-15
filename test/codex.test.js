import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {configuration,checkConnection,decision,contextFor} from '../lib/ai.js';
import {codexCommand,localCodex} from '../lib/codex.js';
import {createGame,act,legal} from '../lib/game.js';
import {createApp} from '../server.js';

// A real child process exercises stdin, argv, output files and process failures
// without network calls, a CLI installation, or account credentials in CI.
async function fakeCli() {
  const directory=await mkdtemp(join(tmpdir(),'holdem-cli-test-'));
  const script=join(directory,'fake cli.mjs'),log=join(directory,'calls.jsonl');
  await writeFile(script,`
    import {readFile,writeFile,appendFile} from 'node:fs/promises';
    const args=process.argv.slice(2),log=${JSON.stringify(log)};
    let input='';for await(const chunk of process.stdin)input+=chunk;
    await appendFile(log,JSON.stringify({args,input,cwd:process.cwd()})+'\\n');
    if(args[0]==='login')process.exit(0);
    const model=args[args.indexOf('--model')+1];
    if(model==='fail'){console.error('private CLI detail');process.exit(9);}
    if(model==='timeout')await new Promise(resolve=>setTimeout(resolve,10000));
    const output=args[args.indexOf('--output-last-message')+1];
    if(model==='bad-json'){await writeFile(output,'private malformed response');process.exit(0);}
    const state=JSON.parse(input.slice(input.indexOf('\\n\\n')+2));
    const reply={action:state.legal.check?'check':'fold',amount:0,memory:'Respect the public raise.',say:'I will wait for a better spot.',replyToSeat:null};
    await writeFile(output,JSON.stringify({text:JSON.stringify(reply)}));
  `);
  return {directory,script,log,config:configuration({AI_MODE:'chatgpt',CODEX_JS_PATH:script}),close:()=>rm(directory,{recursive:true,force:true})};
}

test('ChatGPT CLI is an opt-in alias; API and offline defaults stay independent',()=>{
  const config=configuration({AI_MODE:'chatgpt'});
  assert.equal(config.mode,'codex');assert.equal(config.timeout,180000);assert.equal(config.model,'default');
  assert.equal(configuration({AI_MODE:'codex'}).mode,'codex');
  assert.equal(configuration({}).mode,'local');assert.equal(configuration({}).timeout,60000);
  assert.equal(configuration({AI_MODE:'api',AI_MODEL:'example',AI_URL:'http://localhost/v1/chat/completions'}).mode,'api');
  assert.equal(configuration({AI_MODE:'codex',AI_TIMEOUT_MS:'120000'}).timeout,120000);
  assert.throws(()=>configuration({AI_MODE:'unknown'}),/AI_MODE/);
});

test('installed CLI receives separate private seat context, structured output flags and no API request',async()=>{
  const cli=await fakeCli();
  try {
    await checkConnection(cli.config);
    const game=createGame();game.players.forEach((p,i)=>p.memory=['private memory '+i]);
    const seat=game.actor,config={...cli.config,model:'chosen-model',reasoning:'low'};
    const result=await decision(game,seat,config);act(game,seat,result.action,result.amount);
    const calls=(await readFile(cli.log,'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(calls[0].args,['login','status']);assert.equal(calls.length,2);
    const run=calls[1],args=run.args;
    assert.equal(args[0],'exec');assert.equal(args.at(-1),'-');
    assert(args.includes('--ephemeral'));assert(args.includes('--ignore-user-config'));
    assert.equal(args[args.indexOf('--sandbox')+1],'read-only');
    assert.equal(args[args.indexOf('--model')+1],'chosen-model');
    assert(args.includes('model_reasoning_effort="low"'));
    for(const feature of ['shell_tool','plugins','apps','multi_agent'])assert(args.some((a,i)=>a==='--disable' && args[i+1]===feature));
    const context=JSON.parse(run.input.slice(run.input.indexOf('\n\n')+2));
    assert.deepEqual(context.ownCards,game.players[seat].cards);
    assert.deepEqual(context.privateMemory,['private memory '+seat]);
    assert(context.players.every(p=>!('cards' in p)));assert(!('deck' in context));
    for(let i=0;i<5;i++)if(i!==seat)assert(!run.input.includes('private memory '+i));
    assert.notEqual(run.cwd,process.cwd());await assert.rejects(access(run.cwd));
    assert.equal(result.say,'I will wait for a better spot.');
  } finally {await cli.close();}
});

test('CLI calls serialize separate seats and recover after errors and timeouts',async()=>{
  const cli=await fakeCli();
  try {
    const game=createGame(),context=contextFor(game,game.actor);
    const invoke=config=>localCodex({...cli.config,...config},context.system,context.user);
    await assert.rejects(invoke({model:'fail'}),/^Error: Local Codex failed/);
    await assert.rejects(invoke({model:'bad-json'}),/^Error: Local Codex returned an invalid response/);
    await assert.rejects(invoke({model:'timeout',timeout:500}),/^Error: Local Codex timed out/);
    const replies=await Promise.all([invoke({model:'first'}),invoke({model:'second'})]);
    assert.equal(replies.length,2);assert(replies.every(reply=>legal(game)[JSON.parse(reply).action]));
    const calls=(await readFile(cli.log,'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(calls.slice(-2).map(c=>c.args[c.args.indexOf('--model')+1]),['first','second']);
    assert.equal(new Set(calls.map(c=>c.cwd)).size,calls.length);
    for(const call of calls)await assert.rejects(access(call.cwd));
    await assert.rejects(localCodex({...cli.config,codexJs:join(cli.directory,'missing-cli.mjs')},context.system,context.user),/Local Codex failed/);
  } finally {await cli.close();}
});

test('explicit Windows npm shims resolve beside the chosen CLI without a shell',{skip:process.platform!=='win32'},async()=>{
  const directory=await mkdtemp(join(tmpdir(),'holdem cli shim-'));
  try {
    const entry=join(directory,'node_modules','@openai','codex','bin','codex.js');
    await mkdir(join(directory,'node_modules','@openai','codex','bin'),{recursive:true});await writeFile(entry,'// npm entry');
    const cli=await codexCommand({codexCommand:join(directory,'codex.cmd')});
    assert.equal(cli.command,process.execPath);assert.deepEqual(cli.prefix,[entry]);
    await assert.rejects(codexCommand({codexCommand:join(directory,'missing','codex.cmd')}),/not found on PATH/);
  } finally {await rm(directory,{recursive:true,force:true});}
});

test('CLI-backed HTTP play saves, loads and retries the same failed seat without falling back',async()=>{
  const cli=await fakeCli(),config=cli.config,app=createApp(config,{saveDir:join(cli.directory,'saves'),turnDelay:0});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.address().port;let cookie='';
  async function request(path,body) {
    const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'X-Holdem-Request':'1','Content-Type':'application/x-www-form-urlencoded',...(cookie?{Cookie:cookie}:{})},body});
    cookie=response.headers.get('set-cookie')?.split(';')[0] || cookie;
    assert.equal(response.status,200);return response.text();
  }
  async function idle() {
    for(let n=0;n<200;n++) {
      const xml=await request('/api/state');if(xml.includes('busy="0"'))return xml;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    throw Error('CLI turn did not finish');
  }
  try {
    await checkConnection(config);
    await request('/api/new','name=CLI+Test&portrait=pilot');
    let xml=await idle();assert(xml.includes('mode="codex"'));assert(xml.includes('actor="0"'));assert(xml.includes('<quote'));
    assert.equal((xml.match(/<card>\?\?<\/card>/g)||[]).length,8);
    assert(!xml.includes('private memory'));assert(!xml.includes('<memory>'));
    const snapshot=await request('/api/save',''),code=/<save>([a-f0-9]{36})<\/save>/.exec(snapshot)[1];
    cookie='';xml=await request('/api/load','code='+code);assert(xml.includes('name="CLI Test"'));assert(xml.includes('mode="codex"'));
    config.model='fail';await request('/api/new','name=Retry+Test&portrait=pilot');
    xml=await idle();assert(xml.includes('Opponent could not act'));assert(!xml.includes('private CLI detail'));
    const seat=/\bactor="(\d+)"/.exec(xml)[1];assert(Number(seat)>0);
    const stateBefore=await request('/api/state');assert.equal(/\bactor="(\d+)"/.exec(stateBefore)[1],seat);
    config.model='default';await request('/api/retry','');
    xml=await idle();assert(xml.includes('mode="codex"'));assert(xml.includes('actor="0"'));assert(!xml.includes('Opponent could not act'));
  } finally {await new Promise(resolve=>app.close(resolve));await cli.close();}
});
