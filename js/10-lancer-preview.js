
if(location.hash==='#lancer-demo'){
 const lancerDemoTimer=setInterval(()=>{
  if(!window.__K||!ready) return;
  clearInterval(lancerDemoTimer);
  __K.reset(); enterChapter(6); for(const p of S.prog)p.unlocked=10;
  enterStage(9); S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;
  mobs=mobs.filter(m=>m.door);arrows=[];S.wave=2;S.spawnQ=[];
  S.ward=S.maxWard;S.quiv=QV_CAP;S.supT=999;S.arrT=999;
  queueWave(); S.spawnQ=[];
  const previewBoss=spawnMob('LC');
  if(previewBoss){
    const angles=[Math.PI,0,Math.PI/2,-Math.PI/2];
    const angle=angles.find(a=>[[0,0],[13,0],[-13,0],[0,6],[0,-6]].every(([dx,dy])=>lancerFloor(previewBoss.x+Math.cos(a)*120+dx,previewBoss.y+Math.sin(a)*120+dy,previewBoss.level)));
    if(angle!==undefined){P.x=previewBoss.x+Math.cos(angle)*120;P.y=previewBoss.y+Math.sin(angle)*120;P.level=previewBoss.level;}
    lancerState(previewBoss);previewBoss.lance.angle=Math.atan2(P.y-previewBoss.y,P.x-previewBoss.x);
    lancerStart(previewBoss,'spinWind',LANCER.SPIN_WIND);
  }
  S.msg='Reaping Spin — wind and blue electricity are charging. Leave the ring before the swing, or Freeze it (3). Arrow keys move; type the boss name.';S.msgT=6;
 },100);
}
