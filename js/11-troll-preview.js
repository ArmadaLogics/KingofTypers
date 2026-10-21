if(location.hash==='#troll-demo'){
 const TrollDemo=window.TrollDemo={solo:true};
 TrollDemo.restart=function(solo=true){
  TrollDemo.solo=solo;__K.reset();enterChapter(7);for(const p of S.prog)p.unlocked=10;enterStage(9);
  S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;S.skCard=null;S.tq=[];S.wave=DEF().stages[9].waves.length-1;S.waveFlashT=0;S.hitstop=0;S.opt=false;S.lock=null;S.typed=0;
  mobs=mobs.filter(m=>m.door);arrows=[];fx=[];S.ward=S.maxWard;S.quiv=QV_CAP;S.supT=999;S.arrT=999;
  for(const u of Object.values(HINT_UNIT))S.taught['hint:'+u.kind]=1;
  queueWave();S.spawnQ=S.spawnQ.filter(t=>t!=='TR');if(solo)S.spawnQ=[];S.spawnT=3;
  const boss=spawnMob('TR');if(!boss)throw Error('Troll test spawn failed');boss.afx=null;boss.hp=5;
  if(solo){const clearings=[];for(let y=2;y<W.h-2;y++)for(let x=2;x<W.w-2;x++){const px=x*T+T/2,py=y*T+T/2;if(!trollClear(px,py,0,boss,false))continue;let open=0;const old={x:boss.x,y:boss.y,level:boss.level};boss.x=px;boss.y=py;boss.level=0;for(let i=0;i<16;i++){const a=i*Math.PI/8;if(trollRay(boss,px+Math.cos(a)*180,py+Math.sin(a)*180))open++;}Object.assign(boss,old);clearings.push({x:px,y:py,score:open*100-Math.hypot(px-W.w*T/2,py-W.h*T/2)});}clearings.sort((a,b)=>b.score-a.score);if(clearings[0])Object.assign(boss,{x:clearings[0].x,y:clearings[0].y,level:0});}
  // Give the player room to see the opening run and retreat before the first Slam.
  const points=[],entryFlow=buildFlow(W,boss.x,boss.y,boss.level);for(let y=1;y<W.h-1;y++)for(let x=1;x<W.w-1;x++){const px=x*T+T/2,py=y*T+T/2,d=Math.hypot(px-boss.x,py-boss.y);if(d>=350&&d<=600&&entryFlow[y*W.w+x]>=0&&trollClear(px,py,boss.level,boss,false))points.push({x:px,y:py,d:Math.abs(d-460)+Math.hypot(px-W.w*T/2,py-W.h*T/2)*.08});}points.sort((a,b)=>a.d-b.d);if(points[0]){P.x=points[0].x;P.y=points[0].y;P.level=boss.level;}
  trollState(boss);S.msg='CHASE IN: watch the orange ring. The Troll runs for 3.5 seconds, then rests for 1 second. SLAM: use the green gap. WAR MARCH buffs ally speed. BATTLE FURY buffs ally damage, marked by amber rings and sword-plus icons. Land an arrow to interrupt either cast.';S.msgT=7;TrollDemo.boss=boss;window.__trollDemoReady=true;
 };
 TrollDemo.previewSlam=function(){
  TrollDemo.restart(true);const boss=TrollDemo.boss;
  for(let i=0;i<32;i++){const a=i*Math.PI/16,x=boss.x+Math.cos(a)*115,y=boss.y+Math.sin(a)*115;if(!trollClear(x,y,boss.level,boss,false)||!trollRay(boss,x,y))continue;P.x=x;P.y=y;P.level=boss.level;if(trollStart(boss,'slam')){S.msg='SLAM PREVIEW: watch the impact and expanding splash. Move into the green opening to dodge. Preview Slam replays it.';S.msgT=4;return true;}}
  S.msg='No clear Slam position here. Restart the fight to try a new arena.';S.msgT=4;return false;
 };
 TrollDemo.previewAllies=function(){
  TrollDemo.restart(true);const boss=TrollDemo.boss,aim=Math.atan2(P.y-boss.y,P.x-boss.x);let count=0;
  for(const [index,tier]of ['T3','SD','HD'].entries()){
   for(let i=0;i<32;i++){const a=aim+[Math.PI,Math.PI/2,-Math.PI/2][index]+i*Math.PI/16,x=boss.x+Math.cos(a)*180,y=boss.y+Math.sin(a)*180;if(!trollClear(x,y,boss.level,boss)||!trollRay(boss,x,y)||mobs.some(m=>!m.dead&&Math.hypot(m.x-x,m.y-y)<90))continue;const ally=spawnMob(tier);if(!ally)break;Object.assign(ally,{x,y,level:boss.level,afx:null});count++;break;}
  }
  return count;
 };
 TrollDemo.previewWarMarch=function(){const count=TrollDemo.previewAllies();TrollDemo.boss.hp=2;trollStart(TrollDemo.boss,'rally');S.msg='WAR MARCH: hit the Troll to interrupt its 3-second cast. Nearby allies gain +35% movement for 6 seconds. Gold rings and labels show who is buffed.';S.msgT=9;return count;};
 TrollDemo.previewBattleFury=function(){const count=TrollDemo.previewAllies();trollStart(TrollDemo.boss,'fury');S.msg='BATTLE FURY: after the 3-second cast, amber rings and sword-plus icons mark allies dealing +25% DAMAGE for 6 seconds. Their speed stays normal. Hit the Troll to interrupt.';S.msgT=9;return count;};
 const panel=document.createElement('div');panel.style.cssText='position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:20000;background:#132327ef;color:#e7d6b9;padding:9px 14px;border:1px solid #9f8666;border-radius:7px;font:13px system-ui;text-align:center;max-width:95vw';
 const title=document.createElement('div');title.textContent='CHAPTER VIII · TROLL TEST · Arrow keys move; type names to shoot';panel.appendChild(title);
 for(const [text,action]of [['Preview Slam',()=>TrollDemo.previewSlam()],['Preview War March',()=>TrollDemo.previewWarMarch()],['Preview Battle Fury',()=>TrollDemo.previewBattleFury()],['Restart fight',()=>TrollDemo.restart(TrollDemo.solo)],['With army',()=>TrollDemo.restart(false)],['Boss only',()=>TrollDemo.restart(true)],['Full game',()=>location.href='/game']]){const b=document.createElement('button');b.textContent=text;b.style.cssText='margin:6px;padding:6px 10px;background:#e4cfaa;color:#25312e;border:0;border-radius:4px;cursor:pointer';b.onclick=action;panel.appendChild(b);}
 const note=document.createElement('small');note.textContent='Progress is not saved in this test';panel.appendChild(note);document.body.appendChild(panel);
 const timer=setInterval(()=>{if(!ready)return;clearInterval(timer);TrollDemo.restart(true);},100);
}
