
/* KEYWARD v82 — Brood Hatch. Tunables are seconds/world pixels. */
const BROOD=Object.freeze({wind:1.2,hatch:7.8,crack:5,emerge:6.6,cap:2,safe:160,speed:92});
MOBDEF.BE={...MOBDEF.T1,label:'Egg sac',sheet:'srRun',atk:null,words:['T1'],spd:0,radius:25,sep:42,big:false,mark:false,strict:false};
MOBDEF.BH={...MOBDEF.BE,label:'Spiderling',atk:'srAtk',spd:BROOD.speed,radius:19,sep:28};
HP.BE=1;HP.BH=1;DMG.BH=12;
const broodArt=new Image(),broodRects=[];broodArt.src='assets/images/image-613bfa795224142f.png';
broodArt.onload=()=>{
 const cv=document.createElement('canvas');cv.width=broodArt.width;cv.height=broodArt.height;
 const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(broodArt,0,0);const data=cx.getImageData(0,0,cv.width,cv.height).data;
 for(let i=0;i<16;i++){
  const x0=Math.round(i%4*cv.width/4),x1=Math.round((i%4+1)*cv.width/4),y0=Math.round(Math.floor(i/4)*cv.height/4),y1=Math.round((Math.floor(i/4)+1)*cv.height/4);
  let l=x1,r=x0,t=y1,b=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*cv.width+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  broodRects.push({x:l,y:t,w:r-l+1,h:b-t+1});
 }
};
function broodSites(boss){
 const sites=[];
 for(let y=1;y<W.h-1;y++)for(let x=1;x<W.w-1;x++){
  const c=W.grid[y][x],px=x*T+T/2,py=y*T+T/2;
  if(!c.walk||c.level!==boss.level||c.t==='blight'||c.t==='stair'||c.shut)continue;
  if(Math.hypot(px-P.x,py-P.y)<BROOD.safe)continue;
  if(mobs.some(m=>!m.dead&&Math.hypot(px-m.x,py-m.y)<70))continue;
  // Leave narrow bridges and their exits clear.
  if(![[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>{const a=W.grid[y+dy][x+dx];return a.walk&&a.level===c.level&&!a.shut;}))continue;
  sites.push({x:px,y:py,score:Math.abs(Math.hypot(px-boss.x,py-boss.y)-140)});
 }
 sites.sort((a,b)=>a.score-b.score);const chosen=[];
 for(const p of sites)if(chosen.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>120)){chosen.push(p);if(chosen.length===BROOD.cap)break;}
 return chosen;
}
function broodSpawn(boss){
 const active=mobs.filter(m=>!m.dead&&m.broodOwner===boss.uid).length;
 let count=0;
 for(const p of broodSites(boss).slice(0,BROOD.cap-active)){
  const egg=spawnMob('BE');if(!egg)continue;
  Object.assign(egg,{x:p.x,y:p.y,level:boss.level,broodOwner:boss.uid,broodEgg:true,broodAge:0,broodDuration:BROOD.hatch*((S.paceRun|0)<0?1.25:1),hp:1,spd:0,afx:null,guard:false,healer:false,strict:false,armour:false,shield:0,atk:null,big:false,mark:false,radius:25,sep:42});
  count++;fx.push({k:'dust',x:egg.x,y:egg.y-12,f:0});
 }
 return count;
}
function broodBossTick(m,dt){
 if(m.tier!=='SR'||S.chapter!==2||S.endless||m.broodOwner||m.dead)return false;
 if(!m.brood){if(m.hp>2||m.doomed)return false;m.brood={phase:'lay',left:BROOD.wind,done:false};m.wind=0;m.swing=0;teach('brood','the SPIDER is laying eggs — type their short names before they hatch. Freeze buys more time.');}
 const b=m.brood;if(b.done)return false;
 if(m.frzT>0||m.stun>0||m.doomed)return true;
 b.left-=dt;m.f+=dt*FPS*.35;
 if(b.left<=0){const n=broodSpawn(m);if(n){b.done=true;b.phase='spent';m.stagger=Math.max(m.stagger||0,1);m.windCd=1;blip(350,.15,'triangle',.05,190);}else{b.attempts=(b.attempts||0)+1;if(b.attempts>=3){b.done=true;b.phase='spent';m.windCd=1;}else b.left=1;}}
 return true;
}
function broodEggTick(m,dt){
 if(!m.broodEgg||m.dead)return false;
 // A finished name owns its target until the committed arrow arrives.
 if(m.doomed||m.frzT>0||m.stun>0)return true;
 m.broodAge+=dt*(m.chill>0?.5:1);m.f=0;m.wind=0;m.swing=0;
 if(m.broodAge>=m.broodDuration){
  (S.broodHusks||(S.broodHusks=[])).push({x:m.x,y:m.y,left:1.6});
  // Transform the same object: lock, partial letters, health and word all survive.
  Object.assign(m,{tier:'BH',label:'Spiderling',broodEgg:false,broodBaby:true,sheet:'srRun',atk:'srAtk',spd:BROOD.speed,radius:19,sep:28,f:0,windCd:.8,stagger:.45});
  blip(610,.08,'triangle',.04,790);
 }
 return true;
}
function broodCleanup(){
 const owners=new Set(mobs.filter(m=>!m.dead&&m.tier==='SR'&&!m.broodOwner).map(m=>m.uid));
 for(const m of mobs)if(m.broodOwner&&!owners.has(m.broodOwner)&&!m.dead){
  m.dead=true;m.hp=0;m.doomed=false;m.wind=0;
  if(S.lock===m){S.lock=null;S.typed=0;}
 }
}
function broodArtDraw(frame,x,y,alpha=1){
 const r=broodRects[frame];g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;
 if(r){const scale=.31;g.drawImage(broodArt,r.x,r.y,r.w,r.h,Math.round(x-r.w*scale/2),Math.round(y-r.h*scale),Math.round(r.w*scale),Math.round(r.h*scale));}
 else{g.fillStyle='#dfd2b6';g.beginPath();g.ellipse(x,y-30,22,30,0,0,7);g.fill();}
 g.restore();
}
function broodDrawBody(m,x,y){
 if(m.broodEgg){
  if(m.dead)return true;
  const age=m.broodAge*BROOD.hatch/m.broodDuration;
  const f=age<BROOD.crack?Math.floor(age*3)%4:age<BROOD.emerge?4+Math.min(3,Math.floor((age-BROOD.crack)/.4)):8+Math.min(3,Math.floor((age-BROOD.emerge)/.3));
  broodArtDraw(f,x,y);return true;
 }
 if(m.broodBaby){
  if(m.dead)return true;
  const pose=m.frzT>0?(m.broodPose||(m.broodPose={key:m.sheet,f:m.f})):null;if(!pose)m.broodPose=null;
  g.save();g.translate(x,y);g.scale(.5,.5);sprite(pose?pose.key:m.swing>0?'srAtk':'srRun',pose?pose.f:m.f,0,0,m.x>P.x);g.restore();return true;
 }
 return false;
}
function broodGround(){
 for(const m of mobs){
  if(m.dead)continue;
  if(m.brood&&!m.brood.done){
   g.save();g.strokeStyle='#c6b0dd';g.lineWidth=3;g.setLineDash([5,5]);g.beginPath();g.ellipse(m.x,m.y-3,50,21,0,0,7);g.stroke();g.restore();
  }
  if(m.broodEgg){
   g.save();g.strokeStyle=m.frzT>0?'#8fd3e8':'#c6b0dd';g.lineWidth=3;g.beginPath();g.ellipse(m.x,m.y-3,32,12,0,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,1-m.broodAge/m.broodDuration));g.stroke();g.restore();
  }
 }
 for(const h of S.broodHusks||[])broodArtDraw(15,h.x,h.y,Math.min(1,h.left));
}
function broodTag(m){
 if(m.broodEgg)return [m.frzT>0?'EGG · FROZEN':'HATCHES IN '+Math.max(1,Math.ceil(m.broodDuration-m.broodAge))+'s','#c6b0dd'];
 if(m.broodBaby)return ['SPIDERLING · ONE WORD','#c6b0dd'];
 if(m.tier==='SR'&&S.chapter===2&&!S.endless){return [m.brood&&!m.brood.done?'LAYING EGGS':m.brood?'BROOD MOTHER':'BROOD AT HALF HEALTH','#c6b0dd'];}
 return null;
}
function broodTestStart(){
 if(!BROOD_TEST)return;
 S.chapter=2;buildChapter(2);enterStage(9);S.wave=2;S.spawnQ=[];S.spawnT=999;S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;S.waveFlashT=0;S.hitstop=0;
 mobs.length=0;arrows.length=0;S.quiv=Math.max(S.quiv,35);S.ward=S.maxWard;
 const b=spawnMob('SR');b.hp=2;b.stagger=1.2;S.msg='Type egg names to stop the hatch. Defeat the Spider to clear its brood.';S.msgT=6;S.tq=[];
 window.__broodTestReady=true;
}
(function(){
 const button=document.createElement('button');button.id='brood-entry';button.textContent=BROOD_TEST?'Restart Spider test':'Try Chapter III · Brood Hatch';
 Object.assign(button.style,{position:'fixed',right:'18px',bottom:'20px',zIndex:10000,padding:'10px 15px',background:'#dcd0b5',color:'#282b28',border:'1px solid #74634c',borderRadius:'5px',cursor:'pointer',font:'14px system-ui'});
 button.onclick=()=>{if(BROOD_TEST)broodTestStart();else{location.hash='brood-test';location.reload();}};if(BROOD_TEST)document.body.appendChild(button);   /* v123: no Brood Hatch button on the title */
 if(BROOD_TEST){const note=document.createElement('div');note.textContent='v82 · Spider combat test · Progress is not saved';Object.assign(note.style,{position:'fixed',bottom:'20px',left:'18px',zIndex:10000,padding:'9px',background:'#172b2ded',color:'#e2d7bd',font:'12px system-ui'});document.body.appendChild(note);
 const full=document.createElement('button');full.textContent='Full game';full.style.cssText=button.style.cssText;full.style.bottom='64px';full.onclick=()=>{location.hash='';location.reload();};document.body.appendChild(full);}
 const timer=setInterval(()=>{button.style.display=BROOD_TEST?'block':'none';if(BROOD_TEST&&!window.__broodTestReady&&ready&&broodRects.length===16)broodTestStart();},150);
})();

