/* Save-isolated shortcut to the real Chapter II Turtle encounter. */
if(['#turtle-ball-demo','#turtle-wall-demo'].includes(location.hash)){
 const demo=window.TurtleBallDemo={};
 demo.restart=function(special=true){
  __K.reset();enterChapter(1);enterStage(9);
  S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;S.skCard=null;S.tq=[];
  S.hitstop=0;S.wave=2;S.spawnQ=[];S.waveFlashT=0;S.opt=false;keys.clear();
  mobs=mobs.filter(m=>m.door);arrows=[];fx=[];S.supT=999;S.arrT=999;
  for(const u of Object.values(HINT_UNIT))S.taught['hint:'+u.kind]=1;
  S.taught.tuball=1;
  const boss=spawnMob('TU');if(!boss)throw Error('Turtle preview spawn failed');
  boss.afx=null;
  const flow=buildFlow(W,P.x,P.y,P.level),spots=[];
  for(let row=1;row<W.h-1;row++)for(let col=1;col<W.w-1;col++){
   const x=(col+.5)*T,y=(row+.5)*T,c=cellAt(W,x,y);
   if(c.walk&&c.level===P.level&&flow[row*W.w+col]>=0&&twRoom(x,y)&&Math.hypot(x-P.x,y-P.y)>200)
    spots.push({x,y,score:Math.hypot(x-W.w*T/2,y-T*2)});
  }
  spots.sort((a,b)=>a.score-b.score);
  if(spots[0])Object.assign(boss,{x:spots[0].x,y:spots[0].y,level:P.level});
  turtTick(boss,0);demo.boss=boss;
  if(special)turtWaterBall(boss,boss.boss);
  S.msg='FREEZING DOWNPOUR · Arrow keys move · Shift sprints · type the turtle name to attack';S.msgT=6;
  window.__turtleBallReady=true;
 };
 const panel=document.createElement('section');panel.id='turtle-ball-preview';
 panel.setAttribute('aria-label','Turtle freezing Downpour preview');
 panel.style.cssText='position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:20000;box-sizing:border-box;width:min(720px,96vw);padding:10px 14px;background:#102a36f2;color:#e1f6ff;border:1px solid #83d1e5;border-radius:7px;font:13px system-ui;text-align:center';
 const title=document.createElement('strong');title.textContent='TURTLE · FREEZING DOWNPOUR';panel.appendChild(title);
 const help=document.createElement('div');help.textContent='Arrow keys move · Shift sprints · dodge the falling balls · type names to shoot';help.style.margin='6px 0';panel.appendChild(help);
 const status=document.createElement('div');status.id='turtle-ball-status';panel.appendChild(status);
 for(const [label,action]of [['Replay freezing Downpour',()=>demo.restart(true)],['Full turtle fight',()=>demo.restart(false)],['Pause / Resume',()=>{if(S.card)cardClose();else showCard({name:'Water ball preview paused',sheet:null,lines:['Press Enter or Pause / Resume to continue.']});}]]){
  const button=document.createElement('button');button.textContent=label;
  button.style.cssText='margin:7px 4px 4px;padding:7px 10px;border:1px solid #87c8d8;border-radius:4px;background:#ccebf2;color:#153241;cursor:pointer';
  button.onclick=()=>{action();document.activeElement?.blur();};panel.appendChild(button);
 }
 const note=document.createElement('small');note.textContent='Preview progress is not saved';note.style.display='block';panel.appendChild(note);document.body.appendChild(panel);
 const timer=setInterval(()=>{
  if(!window.__K||!ready||loaded<total)return;clearInterval(timer);demo.restart();
  setInterval(()=>{
   const w=S.tw?.rain;
   status.textContent='HP '+Math.ceil(S.ward)+' / '+S.maxWard+' · '+(TurtleBall.frozen()?'FROZEN '+S.tw.freeze.toFixed(1)+'s':w&&!w.over?w.t<0?'Drawing water · three waves incoming':'DOWNPOUR · wave '+w.plan.length+' / 3 · '+w.per+' shots per wave':demo.boss.dead?'Turtle defeated':'Type while the turtle recovers');
  },100);
 },100);
}
