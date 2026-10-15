(function () {
  var busy=false;
  function el(id) { return document.getElementById(id); }
  function text(n) { return n ? (typeof n.text!=='undefined'?n.text:n.textContent) : ''; }
  function say(s) { el('notice').innerHTML=String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function xhr() { if(window.XMLHttpRequest)return new XMLHttpRequest();try{return new ActiveXObject('Msxml2.XMLHTTP');}catch(e){return new ActiveXObject('Microsoft.XMLHTTP');} }
  function request(path,body) {
    if(busy)return;busy=true;
    var req,done=false,timer,buttons=document.getElementsByTagName('button'),disabled=[],i;
    for(i=0;i<buttons.length;i++){disabled[i]=buttons[i].disabled;buttons[i].disabled=true;}
    function finish(message) {if(done)return;done=true;window.clearTimeout(timer);busy=false;for(var j=0;j<buttons.length;j++)buttons[j].disabled=disabled[j];if(message)say(message);}
    try {
      req=xhr();req.open('POST',path,true);req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');req.setRequestHeader('X-Holdem-Request','1');
      req.onreadystatechange=function(){if(req.readyState!==4 || done)return;try{
        var doc=req.responseXML,g=doc && doc.getElementsByTagName('game')[0];
        if(req.status!==200 || !g){finish(doc && doc.documentElement?text(doc.documentElement):'Could not read the server reply.');return;}
        if(path==='/api/save') {el('snapshotcode').value=text(g.getElementsByTagName('save')[0]);el('campaignsavepanel').style.display='block';el('snapshotcode').focus();el('snapshotcode').select();finish('Snapshot saved. Keep its code.');return;}
        finish();window.location.href=path==='/api/campaign/new'?'/intro.html':path==='/api/campaign/stake'?'/map.html':g.getAttribute('destination') || '/map.html';
      }catch(e){finish('Could not read the server reply.');}};
      timer=window.setTimeout(function(){finish('The server did not respond. Try again; use Continue to check your table.');req.abort();},20000);req.send(body);
    }catch(e){finish('Could not connect to the dealer.');}
  }
  var forms=document.getElementsByTagName('form'),i;
  for(i=0;i<forms.length;i++)if(forms[i].className==='campaignpost')forms[i].onsubmit=function(){
    var fields=this.elements,body=[],j;
    for(j=0;j<fields.length;j++)if(fields[j].name)body.push(encodeURIComponent(fields[j].name)+'='+encodeURIComponent(fields[j].value));
    request(this.getAttribute('action').replace(/^https?:\/\/[^\/]+/,''),body.join('&'));return false;
  };
  if(el('campaignsave'))el('campaignsave').onclick=function(){request('/api/save','');};
}());
