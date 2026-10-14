(function () {
  var busy=false, hasGame=false;
  function el(id) { return document.getElementById(id); }
  function text(n) { return n ? (typeof n.text!=='undefined'?n.text:n.textContent) : ''; }
  function say(message) { el('notice').innerHTML=String(message).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function xhr() { if(window.XMLHttpRequest) return new XMLHttpRequest();try{return new ActiveXObject('Msxml2.XMLHTTP');}catch(e){return new ActiveXObject('Microsoft.XMLHTTP');} }
  function radios() { return el('avatars').getElementsByTagName('input'); }
  function highlight() {var cells=el('avatars').getElementsByTagName('td'),i;for(i=0;i<cells.length;i++)cells[i].className=cells[i].getElementsByTagName('input')[0].checked?'avatar selected':'avatar';}
  function request(path,body) {
    if(busy)return;busy=true;el('play').disabled=true;el('load').disabled=true;
    var req,timeout,done=false;
    function finish(message) {if(done)return;done=true;window.clearTimeout(timeout);busy=false;el('play').disabled=false;el('load').disabled=false;if(message)say(message);}
    try {
      req=xhr();req.open(body===null?'GET':'POST',path+(body===null?'?t='+new Date().getTime():''),true);
      if(body!==null){req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');req.setRequestHeader('X-Holdem-Request','1');}
      req.onreadystatechange=function(){if(req.readyState!==4 || done)return;try{
        var doc=req.responseXML,g=doc && doc.getElementsByTagName('game')[0];
        if(req.status===200 && g){hasGame=Number(g.getAttribute('hand'))>0;el('resume').style.display=hasGame?'inline':'none';if(body!==null){finish();window.location.href='/table.html';return;}if(hasGame)say('Your table is available. Resume it, load a save, or start fresh.');finish();}
        else finish(doc && doc.documentElement?text(doc.documentElement):'Could not connect to the dealer.');
      }catch(e){finish('Could not read the dealer reply.');}};
      timeout=window.setTimeout(function(){finish('Dealer did not respond. Try again.');req.abort();},15000);req.send(body);
    }catch(e){finish('Could not connect to the dealer.');}
  }
  var list=radios(),i;for(i=0;i<list.length;i++)list[i].onclick=highlight;
  el('play').onclick=function(){var name=el('playername').value.replace(/^\s+|\s+$/g,''),portrait='drifter',r=radios(),j;if(!name){say('Enter your name.');el('playername').focus();return;}if(hasGame && !window.confirm('Start fresh with $3,000? Save your current table first to keep it.'))return;for(j=0;j<r.length;j++)if(r[j].checked)portrait=r[j].value;request('/api/new','name='+encodeURIComponent(name)+'&portrait='+encodeURIComponent(portrait));};
  el('load').onclick=function(){request('/api/load','code='+encodeURIComponent(el('savecode').value.replace(/^\s+|\s+$/g,'')));};
  request('/api/state',null);
}());
