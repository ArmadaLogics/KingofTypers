/* Save-isolated shortcut into the normal Chapter III final wave. */
if(location.hash==='#blightmother-demo'){
 const panel=document.createElement('section');panel.id='blightmother-encounter';
 panel.setAttribute('aria-label','Blightmother encounter preview');
 panel.style.cssText='position:fixed;bottom:12px;left:50%;transform:translateX(-50%);width:min(92vw,680px);text-align:center;color:#dfdfc7;background:#111c20e8;padding:8px;border:1px solid #62794c;font:12px system-ui;z-index:5;box-sizing:border-box';
 const retry=document.createElement('button');retry.textContent='Retry encounter';
 const pause=document.createElement('button');pause.textContent='Pause';
 for(const b of [retry,pause]){b.style.cssText='background:#293b2e;color:#e7eccd;border:1px solid #6c8153;border-radius:3px;padding:5px 12px;margin:0 4px;cursor:pointer';panel.append(b);}
 const status=document.createElement('output');status.id='encounter-status';status.style.cssText='display:block;margin-top:5px';panel.append(status);document.body.append(panel);
 const restart=()=>{
  __K.reset();enterChapter(2);S.taught["card:"+SUPPLY_CARD.name]=1;S.taught["card:"+QUIVER_CARD.name]=1;enterStage(9);
  S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;S.tq=[];
  mobs=mobs.filter(m=>m.door);arrows=[];S.wave=2;S.spawnQ=[];queueWave();
  S.msg='BLIGHTMOTHER · Arrow keys move · type enemy names · 2 selects Freeze';S.msgT=5;
 };
 retry.onclick=()=>{restart();document.activeElement?.blur();};
 pause.onclick=()=>{if(S.card)cardClose();else if(S.scene==='stage')showCard({name:'Encounter paused',sheet:null,lines:['Press Enter or click Resume to continue.']});document.activeElement?.blur();};
 const timer=setInterval(()=>{
  if(!window.__K||!ready||loaded<total)return;clearInterval(timer);restart();
  setInterval(()=>{
   const c=Blightmother.current,b=c?.m,k=Blightmother.skill;
   pause.textContent=S.card?'Resume':'Pause';
   const phase=k.warning?'Casting '+k.warningRemaining.toFixed(1)+'s':k.active?'Poison field '+k.remaining.toFixed(1)+'s':Blightmother.attacks?.cast?({projectile:'Poison bolt',meteor:'Poison meteor',bounce:'Bouncing poison'}[Blightmother.attacks.cast.kind]):Blightmother.attacks?.bounces.length?'Bouncing poison':'Floating';
   status.textContent='HP '+Math.ceil(S.ward)+' / '+S.maxWard+' · '+(b&&!b.dead?phase:S.scene==='summary'?'Encounter finished':'Boss approaching')+' · Arrow keys move; type names to attack';
   status.dataset.snapshot=JSON.stringify({scene:S.scene,card:!!S.card,time:S.t,hp:S.ward,exposure:S.bliT,hitIndex:S.bliHit,field:k.active,warning:k.warning,age:Number.isFinite(k.age)?k.age:null,
    attacks:Blightmother.attacks?{cast:Blightmother.attacks.cast?.kind,counts:Blightmother.attacks.counts,projectiles:Blightmother.attacks.projectiles.length,meteors:Blightmother.attacks.meteors.length,bounces:Blightmother.attacks.bounces.map(b=>({hop:b.hop,age:b.age,target:b.to,pose:Blightmother.attacks.bouncePose(b)}))}:null,player:{x:P.x,y:P.y,level:P.level},boss:b?{x:b.x,y:b.y,hp:b.hp,dead:b.dead,last:c.last,lastN:c.lastN}:null,
    enemies:mobs.filter(m=>!m.dead&&!m.door&&!m.supply&&!m.sheep).map(m=>({tier:m.tier,word:m.word,hp:m.hp,x:m.x,y:m.y})),images:{float:IMG.bmFloat?.naturalWidth,cast:IMG.bmCast?.naturalWidth}});
  },100);
 },100);
}
