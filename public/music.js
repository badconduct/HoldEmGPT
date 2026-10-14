(function () {
  var button=document.getElementById('musictoggle');if(!button)return;
  var sound=document.createElement('bgsound'), enabled=!/(?:^|;\s*)holdemmusic=off(?:;|$)/.test(document.cookie || '');
  var supported=typeof sound.loop!=='undefined' && typeof sound.volume!=='undefined';
  button.title='Quiet looping piano. Sound uses your computer\'s MIDI instrument.';
  if(!supported){button.disabled=true;button.innerHTML='Music: MIDI';button.title='This browser cannot play MIDI in the page. Open the Piano MIDI link in Help.';return;}
  sound.id='pianosound';sound.loop=-1;sound.volume=-600;
  document.getElementsByTagName('head')[0].appendChild(sound);
  function apply() {sound.volume=enabled?-600:-10000;sound.src=enabled?'/music/midnight-ledger.mid':'';button.innerHTML=enabled?'Music: On':'Music: Off';}
  button.onclick=function(){enabled=!enabled;apply();document.cookie='holdemmusic='+(enabled?'on':'off')+'; path=/; max-age=31536000; expires='+new Date(new Date().getTime()+31536000000).toUTCString();};
  apply();
}());
