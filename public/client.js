(function () {
  var revision = 0, requestBusy = false, timer = null, amountRevision = -1, pollNeeded = false, lastState = '', historyNodes = null;
  var seatTalk = [];
  var perspectiveView = true;
  function el(id) { return document.getElementById(id); }
  function escape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function value(node) { return node ? (typeof node.text !== 'undefined' ? node.text : node.textContent) : ''; }
  function tag(node, name) { return value(node.getElementsByTagName(name)[0]); }
  function attr(node, name) { return node.getAttribute(name); }
  function xhr() { if (window.XMLHttpRequest) return new XMLHttpRequest(); try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) { return new ActiveXObject('Microsoft.XMLHTTP'); } }
  function card(code) {
    if (code === '??') return '<div class="card back"><span class="backpattern">+ +<br>+ +</span></div>';
    var suit = code.charAt(1), rank = code.charAt(0), symbols = { c: '&#9827;', d: '&#9830;', h: '&#9829;', s: '&#9824;' };
    return '<div class="card' + (suit === 'd' || suit === 'h' ? ' red' : '') + '">' + (rank === 'T' ? '10' : escape(rank)) + '<br>' + symbols[suit] + '</div>';
  }
  // Real table cells and block frames keep IE6 card borders out of inline text layout.
  function cards(node) { var list = node.getElementsByTagName('card'), html = '', i; for (i = 0; i < list.length; i++) html += '<td>'+card(value(list[i]))+'</td>'; return html?'<table class="handcards" cellpadding="0" cellspacing="0" align="center" summary="Playing cards"><tr>'+html+'</tr></table>':''; }
  function disableActions() { var ids = ['fold','check','call','raise','allin','next','retry','save','buy'], i; for (i=0;i<ids.length;i++) el(ids[i]).disabled=true; }
  function render(doc) {
    var g=doc.getElementsByTagName('game')[0]; if(!g) { el('notice').innerHTML=escape(value(doc.documentElement) || 'The server returned an invalid reply.'); return; }
    var busy=attr(g,'busy')==='1', players=g.getElementsByTagName('player'), legal=g.getElementsByTagName('legal')[0];
    pollNeeded=busy || (Number(attr(g,'actor'))>0 && !tag(g,'error'));
    var signature=attr(g,'revision')+'|'+attr(g,'busy')+'|'+attr(g,'cash')+'|'+tag(g,'status')+'|'+attr(g,'hand');
    if(signature===lastState && !tag(g,'save')) return;
    lastState=signature;
    var status=tag(g,'status'), thinkingSeat=Number(attr(g,'actor'));
    if(busy && players[thinkingSeat] && !tag(g,'error')) status=attr(players[thinkingSeat],'name')+' is thinking...';
    revision=Number(attr(g,'revision')); el('notice').innerHTML=escape(status);
    if(!players.length) {window.location.href='/';return;}
    el('bankroll').innerHTML='Cash $'+attr(g,'cash')+' &nbsp; | &nbsp; Wins '+attr(g,'wins');
    receiveQuotes(g);
    var currentMoves=moveLabels(g,players);
    renderTable(g,players,currentMoves,'');
    renderTable(g,players,currentMoves,'p');
    disableActions();
    el('save').disabled=busy || !players.length; el('next').disabled=busy || attr(g,'canNext')!=='1'; el('retry').disabled=busy || !tag(g,'error');
    el('retry').style.display=tag(g,'error')?'inline':'none';
    el('buy').disabled=busy || attr(g,'canBuy')!=='1';
    el('buy').style.display=attr(g,'canBuy')==='1'?'inline':'none';
    el('next').style.display=attr(g,'canNext')==='1'?'inline':'none';
    if(legal && !busy) {
      el('fold').disabled=false; el('check').disabled=attr(legal,'check')!=='true'; el('call').disabled=Number(attr(legal,'toCall'))===0; el('call').innerHTML='Call $'+attr(legal,'call');
      el('raise').disabled=attr(legal,'raise')!=='true'; el('allin').disabled=attr(legal,'allin')!=='true';
      if(amountRevision!==revision) {el('amount').value=attr(legal,'min'); amountRevision=revision;}
      el('limits').innerHTML=attr(legal,'raise')==='true'?'Raise TO $'+attr(legal,'min')+' through $'+attr(legal,'max')+'.':'Check, call, or fold as available.';
    } else el('limits').innerHTML=busy?'Waiting for independent opponent decisions.':'';
    historyNodes=g.getElementsByTagName('event');
    fitChat();
    if(el('historypanel').style.display!=='none') renderHistory();
    if(tag(g,'save')) {el('savecode').value=tag(g,'save');el('savepanel').style.display='block';el('savecode').focus();el('savecode').select();}
  }
  function renderTable(g,players,currentMoves,prefix) {
    var i,p,seat,html;
    for(i=0;i<5;i++) { el(prefix+'seat'+i).innerHTML=i===0?'Your seat': '<span class="occupation">OPEN SEAT</span><p>The house is waiting.</p>'; el(prefix+'seat'+i).className=i===0?'human':'seat';el(prefix+'quote'+i).innerHTML='';el(prefix+'quote'+i).title='';el(prefix+'quote'+i).className='seatquote';el(prefix+'holes'+i).innerHTML='';el(prefix+'holes'+i).style.visibility='visible'; }
    for(i=0;i<players.length;i++) {
      p=players[i]; seat=Number(attr(p,'seat')); html='';
      var speech=seatTalk[seat];el(prefix+'quote'+seat).innerHTML=escape(speech?speech.text:'');el(prefix+'quote'+seat).title=speech?speech.text:'';el(prefix+'quote'+seat).className=speech?'seatquote speaking':'seatquote';
      html+='<div class="name" title="'+escape(attr(p,'name'))+' / '+escape(attr(p,'style'))+'">'+escape(attr(p,'name'))+'</div>';
      html+='<table class="seatinfo" cellpadding="0" cellspacing="0" summary="Portrait and chips"><tr><td class="facecell"><img class="portrait" src="/portraits/'+(seat===0?'players/':'')+escape(attr(p,'portrait') || (seat===0?'drifter':attr(p,'id')))+'.jpg" width="32" height="40" alt=""></td><td>';
      html+='<div class="stack">'+(seat===0 && attr(g,'paid')==='1'?'Paid $':'$')+attr(p,'stack')+'</div>';
      html+='<div class="badge">'+(seat===Number(attr(g,'dealer'))?'D &nbsp; ':'')+(seat===Number(attr(g,'sb'))?'SB $10':seat===Number(attr(g,'bb'))?'BB $20':'')+'</div></td></tr></table>';
      html+='<div class="action">'+escape(currentMoves[seat] || '')+(Number(attr(p,'bet'))>0?' &nbsp; / &nbsp; $'+attr(p,'bet')+' wagered':'')+'</div>';
      el(prefix+'seat'+seat).innerHTML=html; el(prefix+'seat'+seat).className=(seat===0?'human':'seat')+(seat===Number(attr(g,'actor'))?' active':'')+(attr(p,'folded')==='1'?' folded':'');
      el(prefix+'holes'+seat).innerHTML=cards(p);
      el(prefix+'holes'+seat).style.visibility=prefix==='p' && seat!==0 && attr(p,'folded')==='1'?'hidden':'visible';
    }
    el(prefix+'board').innerHTML=cards(g.getElementsByTagName('board')[0]); el(prefix+'pot').innerHTML='POT $'+attr(g,'pot');
    el(prefix+'handlabel').innerHTML=Number(attr(g,'hand'))?'HAND '+attr(g,'hand')+' &nbsp; / &nbsp; '+escape(attr(g,'phase')).toUpperCase():'YOUR TABLE AWAITS';
  }
  function request(path, body) {
    if(requestBusy) return; requestBusy=true; if(timer) window.clearTimeout(timer);
    var req, done=false, timeout;
    function finish(message) { if(done) return; done=true; window.clearTimeout(timeout); requestBusy=false; if(message) {el('notice').innerHTML=escape(message);pollNeeded=true;lastState='';} if(pollNeeded) timer=window.setTimeout(function(){request('/api/state',null);},1500); }
    try {
      req=xhr(); req.open(body===null?'GET':'POST',path+(body===null?'?t='+new Date().getTime():''),true);
      if(body!==null) {req.setRequestHeader('Content-Type','application/x-www-form-urlencoded'); req.setRequestHeader('X-Holdem-Request','1'); disableActions();lastState='';}
      req.onreadystatechange=function(){if(req.readyState===4 && !done){try{if(req.responseXML && req.responseXML.documentElement) {render(req.responseXML); if(req.status!==200) {pollNeeded=true;lastState='';} finish();} else finish('Could not read the server reply.');}catch(e){finish('Connection interrupted. Trying again...');}}};
      timeout=window.setTimeout(function(){finish('Server did not respond. Reconnecting...'); req.abort();},15000); req.send(body);
    } catch(e) { finish('Could not connect to the dealer.'); }
  }
  function move(action) { request('/api/action','action='+action+'&amount='+encodeURIComponent(el('amount').value)+'&revision='+revision); }
  function moveLabels(g,players) {
    var labels=[],hand=attr(g,'hand'),street=attr(g,'phase'),events=g.getElementsByTagName('event'),i,j,m;
    if(street==='complete')for(i=events.length-1;i>=0;i--) {m=/^Hand ([0-9]+) \/ (preflop|flop|turn|river):/.exec(value(events[i]));if(m && m[1]===hand) {street=m[2];break;}}
    for(i=0;i<players.length;i++) {var p=players[i],seat=Number(attr(p,'seat'));labels[seat]='';if(attr(p,'actionHand')===hand && attr(p,'actionStreet')===street)labels[seat]=attr(p,'action') || '';}
    // Existing live dealers/saves have no street tag. Derive current moves from their public ledger.
    for(i=0;i<events.length;i++) {m=/^Hand ([0-9]+) \/ (preflop|flop|turn|river): (.*)$/.exec(value(events[i]));if(!m || m[1]!==hand || m[2]!==street)continue;
      for(j=0;j<players.length;j++) {var name=attr(players[j],'name');if(m[3].indexOf(name+' ')!==0)continue;var action=m[3].substring(name.length+1);if(/^(?:folds|checks|calls \$[0-9]+|raises to \$[0-9]+)(?: \(all-in\))?\.$/.test(action))labels[Number(attr(players[j],'seat'))]=action.substring(0,action.length-1);}
    }
    for(i=0;i<players.length;i++) {var player=players[i],s=Number(attr(player,'seat'));if(attr(player,'out')==='1' || (attr(g,'phase')==='complete' && Number(attr(player,'stack'))===0))labels[s]='Eliminated';else if(attr(player,'folded')==='1')labels[s]='Folded';else if(attr(g,'phase')!=='complete' && Number(attr(player,'stack'))===0)labels[s]='All-in';}
    return labels;
  }
  function receiveQuotes(g) {
    var quotes=g.getElementsByTagName('quote'), players=g.getElementsByTagName('player'), events=g.getElementsByTagName('event'), log=el('talklog'), atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<20, oldScroll=log.scrollTop, rows=[],seenSpeech={},html='',i,j,q,hasResult=false,settlement=-1;
    seatTalk=[];
    function add(name,action,text,hand,street,kind,seat) {var row={name:name,action:action,text:text,hand:hand,street:street,kind:kind,seat:seat,speech:''};rows.push(row);return row;}
    function speech(name,text,hand,street,seat,win) {
      seenSpeech[hand+'|'+street+'|'+name+'|'+text]=true;
      if(!win)for(var n=rows.length-1;n>=0;n--) {var row=rows[n];if(row.name===name && row.hand===hand && row.street===street && row.kind==='move' && !row.speech) {row.speech=text;return;}}
      add(name,win?'win':'says',text,hand,street,win?'win':'quote',seat);
    }
    // Use the dealer's public ledger for order and amounts; quotes are flavor attached to verified moves.
    for(i=0;i<events.length;i++) {
      var match=/^Hand ([0-9]+) \/ ([a-z]+): (.*)$/.exec(value(events[i]));if(!match)continue;
      var hand=match[1],street=match[2],body=match[3],speaker=null,rest='',seat=-1;
      for(j=0;j<players.length;j++) {var name=attr(players[j],'name');if(body.indexOf(name+' ')===0 && (!speaker || name.length>speaker.length)) {speaker=name;rest=body.substring(name.length+1);seat=Number(attr(players[j],'seat'));}}
      if(speaker && /^says "/.test(rest)) {speech(speaker,rest.substring(6).replace(/"\.$/,''),hand,street,seat,street==='result');continue;}
      if(speaker && /^(?:folds|checks|calls \$[0-9]+|raises to \$[0-9]+)(?: \(all-in\))?\.$/.test(rest)) {add(speaker,/\(all-in\)/.test(rest)?'all-in':rest.split(' ')[0],rest.charAt(0).toUpperCase()+rest.substring(1),hand,street,'move',seat);continue;}
      if(speaker && /^posts (?:small|big) blind \$[0-9]+\.$/.test(rest)) {add(speaker,'blind',rest.charAt(0).toUpperCase()+rest.substring(1),hand,street,'move',seat);continue;}
      if(speaker && /^shows /.test(rest)) {add(speaker,'showdown',rest.charAt(0).toUpperCase()+rest.substring(1),hand,'result','move',seat);continue;}
      if(/^New shuffled deck\./.test(body)) {add('Dealer','new hand','Shuffles a fresh deck and deals hole cards. '+body.substring(19),hand,'preflop','dealer',-1);continue;}
      if(/^Board: /.test(body)) {add('Dealer','new round','Burns a card and deals the '+street.toUpperCase()+'. New betting round.',hand,street,'dealer',-1);continue;}
      if(/^(?:Main pot|Side pot|Uncalled return) \$/.test(body)) {add('Dealer','settled',body,hand,'result','win',-1);if(hand===attr(g,'hand'))settlement=rows.length-1;}
    }
    for(i=0;i<quotes.length;i++) {
      q=quotes[i];var win=attr(q,'kind')==='result' || attr(q,'action')==='win',text=value(q),qHand=attr(q,'hand'),qStreet=attr(q,'street'),qName=attr(q,'name');
      if(!seenSpeech[qHand+'|'+qStreet+'|'+qName+'|'+text])speech(qName,text,qHand,qStreet,Number(attr(q,'seat')),win);
      if(qHand===attr(g,'hand')) {seatTalk[Number(attr(q,'seat'))]={text:text};if(win)hasResult=true;}
    }
    if(attr(g,'phase')==='complete') {
      var result=tag(g,'result');if(settlement>=0)rows[settlement].text=result;else add('Dealer','settled',result,attr(g,'hand'),'result','win',-1);
      // Older running dealers supply public settlement but no victory events; keep the current game intact.
      if(!hasResult) {
        var parts=result.split('. '),names=[],k,voice={rail:'A profitable journey.',ruby:'That deserves an encore.',dusty:'Found a little gold after all.',ada:'Profit recorded. Account settled.',ace:'And that concludes the act.',nell:'There is my headline.',jack:'I will take that pot.',pearl:'A most agreeable conclusion.'};
        for(j=0;j<parts.length;j++) {var pot=/^(?:Main pot|Side pot) \$[0-9]+: (.*?)(?:\.)?$/.exec(parts[j]);if(pot)names=names.concat(pot[1].split(' & '));}
        for(i=0;i<players.length;i++) {var p=players[i],pName=attr(p,'name'),found=false,duplicates=0;for(j=0;j<players.length;j++)if(attr(players[j],'name')===pName)duplicates++;for(k=0;k<names.length;k++)if(names[k]===pName)found=true;if(found && duplicates===1) {var message=Number(attr(p,'seat'))===0?'The pot is yours.':voice[attr(p,'id')];seatTalk[Number(attr(p,'seat'))]={text:message};add(pName,'win',message,attr(g,'hand'),'result','win',Number(attr(p,'seat')));}}
      }
    }
    for(i=Math.max(0,rows.length-120);i<rows.length;i++) {var item=rows[i],label=item.seat===0?'Player ('+item.name+')':item.name;html+='<div class="talkline '+item.kind+'"><span class="context">H'+escape(item.hand)+' / '+escape(item.street)+' / '+escape(item.action).toUpperCase()+'</span> &nbsp; <b>'+escape(label)+':</b> '+escape(item.text)+(item.speech?' <span class="spoken">&quot;'+escape(item.speech)+'&quot;</span>':'')+'</div>';}
    log.innerHTML=html || 'The table is waiting.';log.scrollTop=atBottom?log.scrollHeight:oldScroll;
  }
  function renderHistory() {var html='',i;if(historyNodes)for(i=historyNodes.length-1;i>=0;i--)html+='<div class="event">'+escape(value(historyNodes[i]))+'</div>';el('history').innerHTML=html;}
  function fitChat() {
    var viewport=(document.documentElement && document.documentElement.clientHeight) || (document.body && document.body.clientHeight);
    if(!viewport)return;
    var log=el('talklog'), item=log, top=0, follow=log.scrollHeight-log.scrollTop-log.clientHeight<20;
    while(item) {top+=item.offsetTop || 0;item=item.offsetParent;}
    log.style.height=Math.min(180,Math.max(96,viewport-top-14))+'px';
    if(follow)log.scrollTop=log.scrollHeight;
  }
  function toggle(id) {el(id).style.display=el(id).style.display==='none'?'block':'none';}
  // Keep both layout trees stable. IE6 can lose positioned descendants when the
  // same table cells are switched between absolute positioning and normal flow.
  function setView(perspective) {perspectiveView=perspective;el('classicview').style.display=perspective?'none':'block';el('perspectiveview').style.display=perspective?'block':'none';el('viewtoggle').innerHTML=perspective?'View: Perspective':'View: Classic';fitChat();}
  el('viewtoggle').onclick=function(){setView(!perspectiveView);document.cookie='holdemview='+(perspectiveView?'perspective':'classic')+'; path=/; max-age=31536000; expires='+new Date(new Date().getTime()+31536000000).toUTCString();};
  if(/(?:^|;\s*)holdemview=classic(?:;|$)/.test(document.cookie || ''))setView(false);
  el('roomimage').onerror=function(){setView(false);el('viewtoggle').title='Background unavailable. Classic view remains usable.';};
  el('showhistory').onclick=function(){toggle('historypanel');if(el('historypanel').style.display!=='none')renderHistory();};
  el('showhelp').onclick=function(){toggle('helppanel');};
  el('closesave').onclick=function(){el('savepanel').style.display='none';};
  el('buy').onclick=function(){request('/api/buy','');};
  el('save').onclick=function(){request('/api/save','');};
  el('fold').onclick=function(){move('fold');}; el('check').onclick=function(){move('check');}; el('call').onclick=function(){move('call');}; el('raise').onclick=function(){move('raise');};
  el('allin').onclick=function(){if(window.confirm('Commit your entire remaining stack?'))move('allin');}; el('next').onclick=function(){request('/api/next','');}; el('retry').onclick=function(){request('/api/retry','');};
  window.onresize=fitChat;
  disableActions(); request('/api/state',null);
}());
