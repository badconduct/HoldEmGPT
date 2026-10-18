/* ES3 / IE6: one cached PCM voice, bounded queue, no playback in the rules. */
(function () {
  var durations={call:174,raise:375,allin:835,check:267,fold:460};
  var button=document.getElementById('soundtoggle');
  var enabled=!/(?:^|;\s*)holdemsound=off(?:;|$)/.test(document.cookie || '');
  var output=document.createElement('audio'),modern=typeof output.play==='function' && typeof output.canPlayType==='function';
  var queue=[],timer=null,table='',last=-1,started=false,blocked=false,generation=0;
  if(!modern){output=document.createElement('bgsound');if(typeof output.volume==='undefined')output=null;}
  if(output){output.id='turnsound';if(modern){output.preload='none';output.volume=0.7;}else{output.loop=1;output.volume=-650;}document.getElementsByTagName('head')[0].appendChild(output);}
  function label(){if(button){button.disabled=!output;button.innerHTML=output?(blocked && enabled?'Sound: Enable':'Sound: '+(enabled?'On':'Off')):'Sound: Unavailable';}}
  function stop(){generation++;queue=[];if(timer!==null)window.clearTimeout(timer);timer=null;if(output){if(modern)output.pause();else output.src='';}}
  function remember(){document.cookie='holdemsound='+(enabled?'on':'off')+'; path=/; expires='+new Date(new Date().getTime()+31536000000).toUTCString();}
  function failed(error,version){
    if(version!==generation)return;
    stop();blocked=true;label();
  }
  function pump(){
    timer=null;if(!enabled || blocked || !output || !queue.length)return;
    var name=queue.shift(),promise,version=++generation;
    try{
      if(modern){output.pause();output.volume=0.7;output.src='/sounds/'+name+'.wav';promise=output.play();if(promise && typeof promise['catch']==='function')promise['catch'](function(error){failed(error,version);});}
      else {output.src='';output.src='/sounds/'+name+'.wav';}
      timer=window.setTimeout(function(){timer=null;if(queue.length)pump();},durations[name]+50);
    }catch(e){failed(e,version);}
  }
  function enqueue(name){if(!enabled || blocked || !output || !durations[name] || queue.length>=8)return;queue.push(name);if(timer===null)pump();}
  function unlock(){
    if(!enabled || !output)return;
    blocked=false;label();
    if(!modern || timer!==null)return;
    // Prime the same voice inside a real click. A stale promise must never
    // pause a later accepted move or mark an intentionally stopped cue blocked.
    var version=++generation,promise;
    try{
      output.volume=0;output.src='/sounds/check.wav';promise=output.play();
      if(promise && typeof promise.then==='function')promise.then(function(){if(version===generation){output.pause();output.volume=0.7;}},function(){if(version===generation){output.volume=0.7;blocked=true;label();}});
      else {output.pause();output.volume=0.7;}
    }catch(e){output.volume=0.7;blocked=true;label();}
  }
  function update(game){
    var id=game.getAttribute('tableId'),events=game.getElementsByTagName('event'),max=-1,i,seq,action,silent;
    if(!id)return;
    for(i=0;i<events.length;i++){seq=Number(events[i].getAttribute('id'));if(seq>max)max=seq;}
    silent=!started || id!==table || max<last || document.hidden===true;
    if(silent)stop();
    if(!silent)for(i=0;i<events.length;i++){seq=Number(events[i].getAttribute('id'));action=events[i].getAttribute('sound');if(seq>last && action)enqueue(action);}
    table=id;last=max;started=true;
  }
  if(button)button.onclick=function(){if(blocked){enabled=true;unlock();}else{enabled=!enabled;if(!enabled)stop();else unlock();}remember();label();};
  if(document.addEventListener)document.addEventListener('visibilitychange',function(){if(document.hidden)stop();},false);
  window.HoldemSounds={update:update,unlock:unlock};label();
}());
