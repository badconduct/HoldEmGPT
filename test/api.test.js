import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configuration, checkConnection, decision } from '../lib/ai.js';
import { apiToken } from '../lib/credentials.js';
import { createGame } from '../lib/game.js';
import { createApp } from '../server.js';

test('API providers can use a custom prefix, either text format, and optional authentication',async()=>{
  const calls=[];
  const provider=http.createServer(async(req,res)=>{
    let body='';for await(const chunk of req)body+=chunk;
    calls.push({path:req.url,auth:req.headers.authorization,body:body?JSON.parse(body):null});
    res.setHeader('Content-Type','application/json');
    if(req.url==='/custom/models') return res.end(JSON.stringify({data:[{id:'example-model'}]}));
    const reply=JSON.stringify({action:'call',amount:0,memory:'Consider position.',say:'I will stay for this deal.'});
    res.end(JSON.stringify(req.url==='/custom/responses'?{output:[{type:'message',content:[{type:'output_text',text:reply}]}]}:{choices:[{message:{content:reply}}]}));
  });
  await new Promise(r=>provider.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+provider.address().port;
  try {
    for(const format of ['chat','responses']) {
      const config=configuration({AI_MODE:'api',AI_MODEL:'example-model',AI_URL:base+'/custom/'+format,AI_API_FORMAT:format});
      await checkConnection(config);assert.equal(calls.length,format==='chat'?0:1);
      const g=createGame();const result=await decision(g,g.actor,config);assert.equal(result.action,'call');
      const call=calls.at(-1);assert.equal(call.auth,undefined);assert.equal(call.path,'/custom/'+format);
      const messages=call.body[format==='chat'?'messages':'input'];assert.equal(messages[0].role,'system');assert.equal(messages[1].role,'user');assert.equal(call.body.model,'example-model');
    }
    const config=configuration({AI_MODE:'api',AI_MODEL:'example-model',AI_URL:base+'/custom/chat',AI_MODELS_URL:base+'/custom/models',AI_TOKEN:'example-credential'});
    await checkConnection(config);assert.equal(calls.at(-1).path,'/custom/models');assert.equal(calls.at(-1).auth,'Bearer example-credential');
    config.model='missing-model';await assert.rejects(checkConnection(config),/not offered/);
    assert.throws(()=>configuration({AI_MODE:'api',AI_URL:base}),/AI_MODEL/);
    assert.throws(()=>configuration({AI_MODE:'api',AI_MODEL:'example',AI_URL:'https://user:password@example.com/v1/chat/completions'}),/Invalid API URL/);
  } finally {await new Promise(r=>provider.close(r));}
});

test('credential files take precedence and errors do not disclose file contents or paths',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'holdem-credential-')), path=join(dir,'credential');
  try {
    await writeFile(path,'example-file-credential\n');
    assert.equal(await apiToken({AI_TOKEN_FILE:path,AI_TOKEN:'unused'}),'example-file-credential');
    await writeFile(path,'');await assert.rejects(apiToken({AI_TOKEN_FILE:path}),{message:'Could not read AI_TOKEN_FILE. Check its contents and permissions.'});
    await assert.rejects(apiToken({AI_TOKEN_FILE:join(dir,'missing')}),{message:'Could not read AI_TOKEN_FILE. Check its contents and permissions.'});
    await assert.rejects(apiToken({AI_TOKEN:'example\ncredential'}),/Invalid AI_TOKEN/);
    assert.equal(await apiToken({}),'');
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('AI endpoints do not follow redirects to another credential recipient',async()=>{
  let destinationCalls=0;
  const destination=http.createServer((req,res)=>{destinationCalls++;res.end('{}');});
  await new Promise(r=>destination.listen(0,'127.0.0.1',r));
  const provider=http.createServer((req,res)=>{res.writeHead(307,{Location:'http://127.0.0.1:'+destination.address().port+'/other'});res.end();});
  await new Promise(r=>provider.listen(0,'127.0.0.1',r));
  try {
    const config=configuration({AI_MODE:'api',AI_MODEL:'example',AI_URL:'http://127.0.0.1:'+provider.address().port,AI_TOKEN:'example-credential'});
    await checkConnection(config);const g=createGame();await assert.rejects(decision(g,g.actor,config));assert.equal(destinationCalls,0);
  } finally {await new Promise(r=>provider.close(r));await new Promise(r=>destination.close(r));}
});

test('health checks create no session and reverse proxy origin guards support HTTPS',async()=>{
  const app=createApp(configuration({AI_MODE:'local'}),{publicOrigin:'https://poker.example.com',secureCookies:true});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
  try {
    const health=await fetch(base+'/healthz');assert.equal(health.status,200);assert.equal(health.headers.get('set-cookie'),null);assert.deepEqual(await health.json(),{status:'ok',service:'holdemgpt',mode:'local'});
    const state=await fetch(base+'/api/state');assert(state.headers.get('set-cookie').includes('; Secure'));
    const headers={'X-Holdem-Request':'1',Origin:'https://poker.example.com'};
    assert.equal((await fetch(base+'/api/load',{method:'POST',headers,body:'code=invalid'})).status,400);
    assert.equal((await fetch(base+'/api/load',{method:'POST',headers:{...headers,Origin:'https://unrelated.example.com'},body:'code=invalid'})).status,403);
    const hidden=await fetch(base+'/.env');assert.equal(hidden.status,404);
    assert.equal((await fetch(base+'/data/saves/example.json')).status,404);
  } finally {await new Promise(r=>app.close(r));}
});
