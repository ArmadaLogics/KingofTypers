/* Direct, save-isolated art preview in Chapter V's final arena. */
(() => {
 if(location.hash!=='#wraith-demo') return;

 const chapter=4, stage=9;
 // Higgsfield-Cast-v1: 16 poses, 4 columns, each held for 160 ms.
 const cellWidth=384, cellHeight=320, cols=4, poses=16, hold=.16;
 const absorb=11*hold, cycle=6.2, scale=.7;
 const walkPoses=14, walkHold=.1;
 const sheet=new Image();
 sheet.src='assets/bosses/threefold-wraith/teal-cast.png';
 const walkSheet=new Image();
 walkSheet.src='assets/bosses/threefold-wraith/teal-float-walk.png';
 const walkFirst=new URLSearchParams(location.search).get('wraith')==='float';
 const walkReady=()=>walkSheet.naturalWidth===cellWidth*cols&&walkSheet.naturalHeight===cellHeight*4;
 const panel=document.createElement('section');
 panel.id='wraith-preview';
 panel.setAttribute('aria-label','Threefold Wraith encounter preview');
 const title=document.createElement('strong');
 title.textContent='Threefold Wraith';
 const replay=document.createElement('button');
 replay.type='button';
 replay.textContent='Replay cast';
 replay.disabled=true;
 const walk=document.createElement('button');
 walk.type='button';
 walk.textContent='Float walk';
 walk.disabled=true;
 const reset=document.createElement('button');
 reset.type='button';
 reset.textContent='Reset arena';
 reset.disabled=true;
 const status=document.createElement('span');
 status.textContent='Loading boss preview…';
 panel.append(title,walk,replay,reset,status);
 document.body.append(panel);

 let arena=null, boss=null, lamp=null, castAt=0, drained=false;
 let homeX=0, walkAt=null, walkFacing=1;
 const active=()=>arena!==null&&W===arena&&S.scene==='stage'&&S.chapter===chapter&&S.stage===stage&&S.lamps.includes(lamp);
 function replayCast(delay=0){
  walkAt=null;
  boss.x=homeX;
  lamp.out=0;
  lamp.tele=0;
  lamp.relit=0;
  drained=false;
  castAt=S.t+delay;
 }
 function startWalk(){
  replayCast();
  walkAt=S.t;
  walkFacing=1;
 }
 function restart(){
  if(S.chapter!==chapter||!stageMaps[stage]) enterChapter(chapter);
  enterStage(stage);
  S.card=null; S.cardQ=[]; S.cardHold=null; S.cardAfter=0;
  S.hint=null; S.tq=[]; S.msgT=0; S.waveFlashT=0;
  S.wave=DEF().stages[stage].waves.length-1;
  S.spawnQ=[]; S.obj=null; S.gutGap=0; S.supT=Infinity;
  mobs=mobs.filter(m=>m.door);
  const row=W.def.d.findIndex(line=>line.includes('b'));
  const col=W.def.d[row].indexOf('b');
  boss={x:(col+.5)*T,y:(row+.5)*T};
  homeX=boss.x;
  lamp=S.lamps.reduce((nearest,candidate)=>
   Math.hypot(candidate.x-boss.x,candidate.y-boss.y)<
   Math.hypot(nearest.x-boss.x,nearest.y-boss.y)?candidate:nearest);
  arena=W;
  if(walkFirst&&walkReady()) startWalk();
  else replayCast(1.1);
  walk.disabled=!walkReady();
  replay.disabled=false;
 }
 reset.onclick=()=>{restart();reset.blur();};
 replay.onclick=()=>{
  if(!active()) restart();
  replayCast();
  replay.blur();
 };
 walk.onclick=()=>{if(!active()) restart();startWalk();walk.blur();};

 const nativeUpdate=update;
 update=function(dt){
  nativeUpdate(dt);
  if(!active()) return;
  if(walkAt!==null){
   const phase=(S.t-walkAt)*Math.PI/4;
   boss.x=homeX+74*Math.sin(phase);
   walkFacing=Math.cos(phase)<0?-1:1;
   status.textContent='Floating walk · Arrow keys move';
   return;
  }
  if(S.t-castAt>=cycle) replayCast();
  const age=S.t-castAt;
  if(age>=absorb&&!drained){
   lamp.tele=0;
   lamp.out=2.8;
   drained=true;
  } else if(!drained&&age>.48){
   lamp.tele=GUT_TELE*(1-(age-.48)/(absorb-.48));
  }
  status.textContent=age<0?'Dummy boss · Arrow keys move':
   age<absorb?'Drawing light from the lantern':
   lamp.out>0?'The lantern is dark':'Dummy boss · Arrow keys move';
 };

 function draw(cam){
  const age=S.t-castAt;
  const walking=walkAt!==null;
  const frame=walking?Math.floor((S.t-walkAt)/walkHold)%walkPoses:
   age>=0&&age<poses*hold?Math.floor(age/hold):0;
  const x=Math.round(boss.x-cam.x), y=Math.round(boss.y-cam.y);
  const flip=walking?walkFacing:lamp.x<boss.x?-1:1;
  const bob=walking?0:Math.round(2*Math.sin(S.t*2.8));
  g.save();
  g.fillStyle='rgba(7,12,25,.46)';
  g.beginPath();g.ellipse(x,y,29,9,0,0,Math.PI*2);g.fill();
  g.translate(x,y+bob);
  g.scale(flip,1);
  g.imageSmoothingEnabled=false;
  g.drawImage(walking?walkSheet:sheet,frame%cols*cellWidth,Math.floor(frame/cols)*cellHeight,cellWidth,cellHeight,
   -Math.round(cellWidth*scale/2),-Math.round(286*scale),Math.round(cellWidth*scale),Math.round(cellHeight*scale));
  g.restore();
  if(walking||age<.64||age>=absorb) return;
  // Carry the arena's blue light toward the extended hand before the lamp goes out.
  const sourceX=lamp.x-cam.x+12, sourceY=lamp.y-cam.y-24;
  const handX=x+flip*(frame>=5&&frame<=9?62:43), handY=y+bob-104;
  g.save();
  for(let i=0;i<8;i++){
   const travel=((age-.64)*2+i/8)%1;
   const px=Math.round(sourceX+(handX-sourceX)*travel);
   const py=Math.round(sourceY+(handY-sourceY)*travel-16*Math.sin(Math.PI*travel));
   g.fillStyle=i%3?'#75caff':'#d1f8ff';
   g.fillRect(px,py,i%3?2:3,i%3?2:3);
  }
  g.restore();
 }

 window.WraithDemo={active,actor:()=>active()?boss:null,draw};
 const boot=setInterval(()=>{
  if(!ready||loaded<total||!sheet.complete||!walkSheet.complete) return;
  clearInterval(boot);
  if(sheet.naturalWidth!==1536||sheet.naturalHeight!==1280){
   status.textContent='The wraith’s sprite sheet could not load.';
   return;
  }
  reset.disabled=false;
  restart();
 },60);
})();
