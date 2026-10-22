
/* KEYWARD v129 — THE FIVE BOSSES (Chapters IV–VIII), built from the five proposal documents:
   Stormward-, Last-Lamp-, Last-Ember-, Gatehouse- and Muster-Boss-Proposal.html.
   One module, hooks only: it wraps game functions by name and never edits the base loop.
   Shared shape for all five: a boss bar at the top, a halfway turn, and a last heart that is three
   names typed in a row (a slip restarts only the current name). Counter words (TURN, MEND, GATE,
   DRUM, the ember's name) are typed like WISP and CONJURE: only between locked names.
   Every open decision in the documents takes the recommended option. */
const Bosses=window.Bosses={cur:null,words:[],msg:'',msgT:0};
(function(B){
'use strict';
const CH={SR:2,SM:3,SK:4,LZ:5,LC:6,TR:7};   /* v130: + the Spider */
const NAME={SR:['XXX · THE WEB ROT','SPIDER'],SM:['XL · THE STORMWARD','SHAMAN'],SK:['L · THE LAST LAMP','SKULL'],LZ:['LX · THE LAST EMBER','LIZARD'],LC:['LXX · THE GATEHOUSE','REAPER'],TR:['LXXX · THE MUSTER','TROLL']};
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const say=(t,s)=>{B.msg=t;B.msgT=s||2.4;};
const stageOn=()=>S.scene==='stage'&&!S.endless;
const live2=()=>mobs.filter(m=>!m.dead&&!m.sheep&&!m.supply&&!m.door&&MOBDEF[m.tier]);
function word(m,tier){const w=pick(tier,[m.word])||pick('T3',[m.word])||pick('T1',[m.word]);if(w){m.word=w;m.wtier=tierOf(w)||tier;}}
function walkable(x,y,level){const c=cellAt(W,x,y);return !!c&&c.walk&&!c.shut&&!c.prop&&c.level===level&&!['water','door','blight'].includes(c.t);}
function spotNear(cx,cy,level,rMin,rMax,awayFrom){const out=[];
  for(let y=1;y<W.h-1;y++)for(let x=1;x<W.w-1;x++){const px=x*T+T/2,py=y*T+T/2;if(!walkable(px,py,level))continue;
    const d=Math.hypot(px-cx,py-cy);if(d<rMin||d>rMax)continue;if(awayFrom&&Math.hypot(px-awayFrom.x,py-awayFrom.y)<T*2)continue;out.push({x:px,y:py});}
  return out[(Math.random()*out.length)|0]||null;}

/* ================= shared shape ================= */
function cur(){const c=B.cur;if(!c||!stageOn()||c.m.dead&&c.done)return null;return c;}
function begin(m,key){const c={m,key,ch:CH[key],last:false,lastN:0,lastHp:m.hp,half:false,done:false,t:0,st:{}};B.cur=c;return c;}
function halfOf(m){return Math.ceil(hpOf(m.tier)/2);}
function enterLast(c){const m=c.m;c.last=true;c.lastN=3;m.hp=1;word(m,'T4');S.shake=Math.max(S.shake,10);
  blip(160,.3,'sawtooth',.1,90);blip(110,.4,'square',.07,60);
  toast('ITS LAST HEART IS THREE NAMES — a slip only restarts the one you are on.',3.4);
  if(c.onLast)c.onLast();}
/* the kill branch marks it dead; this hands it its next name instead */
const oKill=FirstJob.arrowKill;FirstJob.arrowKill=function(m,a){const c=cur();
  if(c&&m===c.m&&c.last&&c.lastN>1&&!c.done){c.lastN--;m.dead=false;m.hp=1;m.doomed=false;S.kills=Math.max(0,S.kills-1);
    word(m,'T4');m.stagger=Math.max(m.stagger||0,.8);m.shake=.5;blip(520,.08,'triangle',.06,700);say('LAST WORD '+(4-c.lastN)+' OF 3',2);return;}
  return oKill(m,a);};
function sharedTick(c,dt){const m=c.m;c.t+=dt;if(B.msgT>0)B.msgT-=dt;
  if(m.dead){if(!c.done){c.done=true;if(c.onDead)c.onDead();}return false;}
  /* v126 rule kept: skills can finish. A full heart of skill damage during the last word counts as one name. */
  if(c.last&&m.hp<=0){if(c.lastN>1){c.lastN--;m.hp=1;word(m,'T4');m.stagger=Math.max(m.stagger||0,.8);say('LAST WORD '+(4-c.lastN)+' OF 3',2);}
    else{c.done=true;m.dead=true;S.kills++;if(c.onDead)c.onDead();return false;}}
  if(!c.last&&m.hp<=HP_FIN){c.lastHp=m.hp;enterLast(c);}
  if(!c.half&&m.hp<=halfOf(m)){c.half=true;S.shake=Math.max(S.shake,5);blip(160,.22,'sawtooth',.07,90);if(c.onHalf)c.onHalf();}
  if(m.hp>c.lastHp)c.lastHp=m.hp;   /* v130: a regrown heart resets the count */
  if(m.hp<c.lastHp){const was=c.lastHp;c.lastHp=m.hp;if(m.hp<=HP_FIN&&!c.last)enterLast(c);else if(!c.last&&c.onHeart){const n=Math.min(3,Math.ceil(was-1e-6)-Math.ceil(m.hp-1e-6));for(let i=0;i<n;i++)c.onHeart(was);}}   /* v130: once per whole heart crossed */
  return true;}
/* ---- counter words: typed between locked names, like WISP ---- */
B.addWord=function(w,on,opts){const o={w:w.toLowerCase(),typed:'',on,...(opts||{})};B.words.push(o);return o;};
B.dropWord=function(o){B.words=B.words.filter(x=>x!==o);};
const oKey=keyLetter;keyLetter=function(ch){const c=cur();
  if(c&&B.words.length){for(const o of B.words){if(o.off&&o.off())continue;
      if(!o.typed&&(S.lock||ch!==o.w[0]||live().some(x=>readable(x)&&wof(x)[0]===ch)))continue;
      if(ch===o.w[o.typed.length])o.typed+=ch;else o.typed='';
      if(o.typed===o.w){o.typed='';B.dropWord(o);o.on(o);}
      return;}}
  return oKey(ch);};
/* new names never start with an active counter word's letter */
const oPick=pick;pick=function(tier,avoid){const extra=B.words.map(o=>o.w);return oPick(tier,extra.length?[...(avoid||[]),...extra]:avoid);};
/* ---- drawing ---- */
function bar(c,line){const w=440,x=Math.round(VW/2-w/2),y=12,m=c.m;g.save();
  g.fillStyle='rgba(11,20,29,.93)';g.fillRect(x,y,w,74);g.strokeStyle='#4a5a3a';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,73);
  g.font='600 11px system-ui';g.textAlign='left';g.textBaseline='alphabetic';g.fillStyle='#e7dcc2';g.fillText(NAME[c.key][0],x+10,y+16);g.textAlign='right';g.fillText(NAME[c.key][1],x+w-10,y+16);
  g.textAlign='left';g.font='13px system-ui';const max=hpOf(m.tier),hp=m.dead?0:Math.max(0,Math.ceil(m.hp));let hs='';for(let i=0;i<max;i++)hs+=i<hp?'♥':'♡';g.fillStyle='#ff6a6a';g.fillText(hs,x+10,y+33);
  g.fillStyle=line[2];g.font='600 11px system-ui';g.fillText(line[0],x+10,y+50);g.fillStyle='#8aa0ab';g.font='10px system-ui';g.fillText(line[1],x+10,y+66);
  if(B.msgT>0){g.globalAlpha=Math.min(1,B.msgT/.4);g.font='600 12px system-ui';g.textAlign='center';const tw=g.measureText(B.msg).width+20;g.fillStyle='rgba(11,20,29,.9)';g.fillRect(VW/2-tw/2,y+82,tw,22);g.fillStyle='#f5e9b6';g.fillText(B.msg,VW/2,y+97);g.globalAlpha=1;}
  g.restore();}
function label(t,wx,wy,col){const V=viewFor(W);const sx=V.ox+wx*V.z,sy=V.oy+wy*V.z;g.save();g.font='bold 15px Georgia';g.textAlign='center';g.textBaseline='alphabetic';const ww=g.measureText(t).width+18;g.fillStyle='#182730ee';g.fillRect(sx-ww/2,sy-16,ww,22);g.fillStyle=col||'#f5e9b6';g.fillText(t,sx,sy);g.restore();}
function typedLabel(o,t,wx,wy,col){label(t+'  '+o.typed.toUpperCase(),wx,wy,col);}
const lastLine=c=>['LAST WORD '+(4-c.lastN)+' OF 3','three names in a row — a slip restarts only that one','#ff6a4a'];

/* ================= III · THE WEB ROT (v130) ================= */
/* The Spider was the one boss outside this module: 7 hearts and a brood at half, over in 15s.
   Three things give it a fight: a brood RING at 5 hearts (3 eggs, 6s to hatch), WEB ROT from
   the halfway turn (every tile it crosses turns to blight for 6s; a burning Spider leaves no
   rot), and a last word where the rot lingers 12s. The base brood at half still comes. */
const SR={EGGS:3,HATCH:6,ROT:6,ROT_LAST:12,STEP:40,FIRST:5};
SR.start=function(c){const m=c.m,st=c.st;Object.assign(st,{rot:new Map(),lx:m.x,ly:m.y,brood1:false,rotN:0});
  c.onHeart=(was)=>{if(!st.brood1&&m.hp<=SR.FIRST){st.brood1=true;SR.lay(c,SR.EGGS);}};
  c.onHalf=()=>{say('WEB ROT — the ground it crosses rots for 6s · Burn it and it leaves none',3.4);
    teach('webrot','WEB ROT: every tile the Spider crosses turns to blight for six seconds. A BURNING Spider leaves no rot, so Burn is how you keep your ground.');};
  c.onLast=()=>{say('THE LAST WEB — its rot lingers 12s · stay on clean ground',3.4);};
  c.onDead=()=>{SR.clear(st);m.shield=0;};
  toast('THE WEB ROT — at five hearts it lays a ring of eggs and closes its name until they are typed. From half, the ground it walks on rots; Burn it to stop the rot.',6);};
SR.sites=function(m,n){const out=[];
  for(let y=1;y<W.h-1;y++)for(let x=1;x<W.w-1;x++){const c=W.grid[y][x],px=x*T+T/2,py=y*T+T/2;
    if(!c.walk||c.level!==m.level||c.t!=='flat'||c.shut)continue;
    const d=Math.hypot(px-m.x,py-m.y);if(d<T*1.3||d>T*3.2)continue;
    if(Math.hypot(px-P.x,py-P.y)<110)continue;
    if(mobs.some(o=>!o.dead&&Math.hypot(px-o.x,py-o.y)<56))continue;
    out.push({x:px,y:py,a:Math.atan2(py-m.y,px-m.x)});}
  out.sort((a,b)=>a.a-b.a);const picks=[];
  for(let i=0;i<n&&out.length;i++){const want=-Math.PI+(i+.5)*2*Math.PI/n;let best=null,bd=9;for(const o of out){if(picks.includes(o))continue;const dd=Math.abs(Math.atan2(Math.sin(o.a-want),Math.cos(o.a-want)));if(dd<bd){bd=dd;best=o;}}if(best)picks.push(best);}
  return picks;};
SR.lay=function(c,n){const m=c.m;let k=0;
  for(const p of SR.sites(m,n)){const egg=spawnMob('BE');if(!egg)continue;
    Object.assign(egg,{x:p.x,y:p.y,level:m.level,broodOwner:m.uid,broodEgg:true,broodAge:0,broodDuration:SR.HATCH*((S.paceRun|0)<0?1.25:1),hp:1,spd:0,afx:null,guard:false,healer:false,strict:false,armour:false,shield:0,atk:null,big:false,mark:false,radius:25,sep:42});
    k++;fx.push({k:'dust',x:egg.x,y:egg.y-12,f:0});}
  if(k){m.stagger=Math.max(m.stagger||0,1);blip(350,.15,'triangle',.05,190);say('A RING OF EGGS — '+SR.HATCH+'s to hatch · Freeze buys time',3);
    teach('brood','the SPIDER is laying eggs — type their short names before they hatch. Freeze buys more time.');}};
SR.burning=m=>!!((m.jobBurn&&m.jobBurn.left>0)||(m.lit>0)||(m.burnLeft>0));
SR.dirty=()=>{W.__stainN=-1;W.__blightN=-1;};
SR.clear=function(st){for(const [k,r] of st.rot){const cell=W.grid[r.y]&&W.grid[r.y][r.x];if(cell&&cell.t==='blight'&&r.orig)cell.t=r.orig;const i=W.spread.findIndex(p=>p[0]===r.x&&p[1]===r.y);if(i>=0)W.spread.splice(i,1);}
  st.rot.clear();SR.dirty();};
SR.tick=function(c,dt){const m=c.m,st=c.st;
  /* BROODING: while its eggs are unhatched it wraps itself in silk; the eggs are the way in */
  const eggs=mobs.some(x=>!x.dead&&x.broodEgg&&x.broodOwner===m.uid);
  if(eggs&&!st.brooding){st.brooding=true;say('BROODING — its name is closed until the eggs are typed or hatch',3);}
  if(!eggs&&st.brooding){st.brooding=false;say('ITS NAME IS OPEN',2);}
  m.shield=st.brooding&&!c.last?.25:0;
  /* expire */
  let changed=false;
  for(const [k,r] of st.rot){if(S.t>=r.until){const cell=W.grid[r.y][r.x];if(cell.t==='blight')cell.t=r.orig;const i=W.spread.findIndex(p=>p[0]===r.x&&p[1]===r.y);if(i>=0)W.spread.splice(i,1);st.rot.delete(k);changed=true;}}
  if(c.half&&!m.dead&&!(m.frzT>0)){
    const moved=Math.hypot(m.x-st.lx,m.y-st.ly);
    if(moved>=SR.STEP){st.lx=m.x;st.ly=m.y;
      const x=Math.floor(m.x/T),y=Math.floor(m.y/T),cell=W.grid[y]&&W.grid[y][x];
      if(cell&&cell.walk&&cell.t==='flat'&&cell.level===m.level&&!SR.burning(m)){
        const k=x+','+y;if(!st.rot.has(k)){st.rot.set(k,{x,y,orig:cell.t,until:S.t+(c.last?SR.ROT_LAST:SR.ROT)});cell.t='blight';W.spread.push([x,y]);st.rotN++;changed=true;}}}}
  if(changed)SR.dirty();};
SR.ground=function(c){const st=c.st;if(!st.rot.size)return;g.save();g.strokeStyle='rgba(214,190,240,.55)';g.lineWidth=1.5;
  for(const [k,r] of st.rot){const left=Math.max(0,r.until-S.t);const a=Math.min(1,left/2);g.globalAlpha=.35+.45*a;const cx=r.x*T+T/2,cy=r.y*T+T/2;
    g.beginPath();for(let i=0;i<3;i++){const rr=8+i*9;g.moveTo(cx-rr,cy);g.lineTo(cx,cy-rr*.6);g.lineTo(cx+rr,cy);g.lineTo(cx,cy+rr*.6);g.closePath();}g.stroke();}
  g.restore();};
SR.hud=function(c){const m=c.m,st=c.st;const eggs=mobs.filter(x=>!x.dead&&x.broodEgg).length;
  const line=c.last?['LAST WORD '+(4-c.lastN)+' OF 3 · ITS ROT LINGERS 12s','three names in a row · stand on clean ground','#ff6a4a']
    :eggs?['BROODING · '+eggs+' EGG'+(eggs>1?'S':'')+' · TYPE THEM TO OPEN ITS NAME','a hatched egg is a spiderling · Freeze stops the hatch clock','#c6b0dd']
    :c.half?[SR.burning(m)?'BURNING · IT LEAVES NO ROT':'WEB ROT · THE GROUND IT CROSSES ROTS 6s','Burn it to keep your ground · '+st.rot.size+' tile'+(st.rot.size===1?'':'s')+' rotting','#b48cff']
    :m.hp>SR.FIRST?['AT FIVE HEARTS IT LAYS A RING OF EGGS','the blight is its ground · keep yours clean','#c6b0dd']
    :['BROOD MOTHER · its second brood comes at half','from half its path rots the floor','#c6b0dd'];
  bar(c,line);};
SR.tag=function(c,m){if(m===c.m){if(c.last)return ['LAST WORD '+(4-c.lastN)+' / 3','#ff6a4a'];if(c.st.brooding)return ['BROODING · TYPE THE EGGS','#c6b0dd'];if(c.half)return [SR.burning(m)?'BURNING · NO ROT':'WEB ROT · BURN IT','#b48cff'];if(m.hp>SR.FIRST)return ['EGGS AT 5 HEARTS','#c6b0dd'];return ['BROOD MOTHER','#c6b0dd'];}return null;};

/* ================= IV · THE STORMWARD ================= */
const SM={};
SM.start=function(c){const st=c.st;Object.assign(st,{callT:3,cast:0,rings:[],turnNext:false,gap:5,stormGap:S.stormGap});
  c.onHalf=()=>{st.gap=4;say('TWO TONGUES — two strikes a call, and it moves after every heart',3.4);};
  c.onHeart=()=>{if(c.half)SM.relocate(c);};
  c.onLast=()=>{st.gap=3;};
  c.onDead=()=>{S.stormGap=st.stormGap;};
  toast('THE SHAMAN SPEAKS THE STORM — every strike has a name. Type it before the ring fills to turn it onto the Shaman.',6);};
SM.relocate=function(c){const m=c.m;const p=spotNear(P.x,P.y,m.level,T*3.6,T*4.6,m);if(!p)return;
  iceBurst(m.x,m.y,10);m.x=p.x;m.y=p.y;S.skFx.push({k:'ring',x:m.x,y:m.y,r:40,col:'232,173,245',t:.45,T:.45});say('IT MOVES — four tiles out, a new side',2.2);};
SM.tick=function(c,dt){const m=c.m,st=c.st;S.stormGap=0;              /* the stage timer is its now */
  if(m.stun>0||m.frzT>0||window.FirstJob?.stopped(m)){st.callT=Math.max(st.callT,.5);return;}
  if(st.cast>0){st.cast-=dt;if(st.cast<=0)SM.call(c);}
  else{st.callT-=dt;if(st.callT<=0){st.cast=1.5;st.callT=st.gap;}}
  for(const r of st.rings){r.t-=dt;
    if(!r.turned&&r.turnWord&&r.turnWord.done){r.turned=true;}
    if(r.t<=0&&!r.done){r.done=true;if(r.w)B.dropWord(r.w);
      if(r.turned){SM.turnedStrike(c,r);}else SM.land(c,r);}}
  st.rings=st.rings.filter(r=>!r.done);};
SM.call=function(c){const m=c.m,st=c.st;const tier=c.half?'T3':'T2';
  const make=(cx,cy)=>{const r={x:cx,y:cy,t:nodeTele(),turned:false,done:false};
    const w=pick(tier,[])||pick('T2',[])||'clap';r.word=w;r.w=B.addWord(w,()=>{r.turned=true;blip(1500,.08,'sine',.05,2100);say('TURNED — the strike goes to the Shaman',1.6);});
    if(st.turnNext){st.turnNext=false;r.turned=true;B.dropWord(r.w);r.w=null;}
    st.rings.push(r);};
  const cx=(Math.floor(P.x/T)+.5)*T,cy=(Math.floor(P.y/T)+.5)*T;make(cx,cy);blip(1900,.1,'sine',.035,2400);
  if(c.half){const p=spotNear(P.x,P.y,P.level,STK_R*2.2,STK_R*4,null);if(p)make(p.x,p.y);}
  m.cast=.6;};
SM.land=function(c,r){s_land(r.x,r.y);};
function s_land(x,y){S.shake=Math.max(S.shake,9);blip(90,.35,'sawtooth',.1,40);noise(.28,.09,900);
  for(let i=0;i<4;i++)fx.push({k:'dust',x:x+(Math.random()-.5)*70,y:y+(Math.random()-.5)*50,f:i*1.2});
  S.strikes.push({x,y,t:0,done:true,flash:.35});
  if(onGround(P.x,P.y,x,y,nodeRing(),STK_K)&&S.iframe<=0){sWard();S.flash=.6;S.iframe=.8;loseWard('the storm took you',DMG_HAZ.storm);}
  for(const mb of mobs){if(mb.dead)continue;if(onGround(mb.x,mb.y,x,y,nodeRing(),STK_K)){mb.stun=Math.max(mb.stun||0,nodeStun());mb.shake=Math.max(mb.shake,.3);}}}
SM.turnedStrike=function(c,r){const m=c.m;s_land(m.x,m.y);m.stun=Math.max(m.stun||0,2);m.shake=.6;
  if(m.hp>HP_FIN+.5){m.hp=Math.max(1,m.hp-.5);}
  S.flash=Math.max(S.flash||0,.15);say('THE STORM STRUCK THE SHAMAN — stunned 2s',2.2);
  if(c.last){c.st.forgive=true;say('TURNED — your next slip on its name is forgiven',2.4);}};
SM.ground=function(c){const st=c.st;g.save();for(const r of st.rings){const f=1-Math.max(0,r.t)/nodeTele();
    g.strokeStyle=r.turned?'rgba(232,173,245,.9)':'rgba(242,216,87,.9)';g.lineWidth=3;g.beginPath();g.ellipse(r.x,r.y,nodeRing(),nodeRing()*STK_K,0,0,7);g.stroke();
    g.fillStyle=r.turned?'rgba(232,173,245,.18)':'rgba(242,216,87,.18)';g.beginPath();g.ellipse(r.x,r.y,nodeRing()*f,nodeRing()*STK_K*f,0,0,7);g.fill();}
  g.restore();};
SM.hud=function(c){const st=c.st,m=c.m;
  for(const r of st.rings)if(!r.turned&&r.w)typedLabel(r.w,'TURN · '+r.word.toUpperCase(),r.x,r.y-nodeRing()*STK_K-14,'#ffe08a');
  if(st.cast>0)label('STORMCALL · '+st.cast.toFixed(1)+'s',m.x,m.y-200,'#e8adf5');
  const line=c.last?lastLine(c):st.cast>0?['STORMCALL · a ring is coming to your tile','type its name before it fills, or walk','#e8adf5']
    :c.half?['TWO TONGUES · two strikes a call','turn either one · it moves after every heart','#ff9a5a']
    :['IT SPEAKS THE STORM · every strike has a name','type the name to turn it · moving always works','#e8adf5'];
  bar(c,line);};
/* Thunder on the Shaman turns the next ring without typing */
const oImpact=FirstJob.impact;FirstJob.impact=function(key,src,cd){const c=cur();if(c&&c.key==='SM'&&src===c.m&&key==='thunder'){c.st.turnNext=true;say('THUNDER — the next strike is turned',2);}return oImpact(key,src,cd);};
/* the healer's slip-forgiveness in the last word */
const oFumble=fumble;fumble=function(lose){const c=cur();if(c&&c.key==='SM'&&c.last&&c.st.forgive&&S.lock===c.m){c.st.forgive=false;say('SLIP FORGIVEN',1.6);return;}return oFumble(lose);};

/* ================= V · THE LAST LAMP ================= */
const SK={MAXCH:4,FLARE:2,STAG:1.2,WISP_EVERY:10};
SK.start=function(c){const m=c.m,st=c.st;Object.assign(st,{chains:[],flare:0,lightR:LAMP_R,wisps:[],wispT:SK.WISP_EVERY,open:false,mend:null});
  m.lastAlive=false;m.shield=0;
  st.lamp={tx:Math.floor(m.x/T),ty:Math.floor(m.y/T),x:m.x,y:m.y,out:0,tele:0,skull:true,r:st.lightR};S.lamps.push(st.lamp);
  SK.chain(c);
  c.onHeart=()=>{SK.chain(c);};
  c.onHalf=()=>{st.wispT=0;say('IT WEAKENS — Wisps and the Mend are coming',3);};
  c.onLast=()=>{for(const x of mobs)x.llChain=false;st.chains=[];m.shield=0;for(const L of S.lamps){if(L.skull)continue;L.snuffed=false;L.out=0;L.tele=0;L.relit=.6;}say('THE LAMPS RELIGHT',3);};
  c.onDead=()=>{for(const L of S.lamps){if(L.skull)continue;L.snuffed=false;L.out=0;}S.lamps=S.lamps.filter(L=>!L.skull);for(const s2 of mobs)s2.snuffTarget=null;};
  toast('THE LAST LAMP — it carries the only light. Stand in it to read. Snap its four chains, then type its name.',6);};
SK.chain=function(c){const m=c.m,st=c.st;for(const x of mobs)x.llChain=false;
  st.chains=live2().filter(x=>x!==m&&x.level===m.level).sort((a,b)=>D(a,m)-D(b,m)).slice(0,SK.MAXCH);
  for(const x of st.chains)x.llChain=true;st.open=!st.chains.length;
  say(st.chains.length?'CHAINED TO '+st.chains.length+' — kill them to open its name':'ITS NAME IS OPEN — type it',3);};
SK.snap=function(c){const m=c.m,st=c.st;m.stagger=Math.max(m.stagger||0,SK.STAG);st.flare=SK.FLARE;
  blip(420,.12,'square',.08,160);blip(1500,.08,'sine',.05,2100);S.shake=Math.max(S.shake,4);
  if(st.chains.length)say('CHAIN SNAPPED — the room lights for 2s · '+st.chains.length+' left',2.2);else{st.open=true;m.shield=0;say('ALL CHAINS DOWN — ITS NAME IS OPEN',3);}};
SK.wisps=function(c){const m=c.m,st=c.st;let n=0;for(let i=0;i<2;i++){const a=Math.random()*Math.PI*2,r=st.lightR*.8;const w=spawnMob('T2');if(!w)continue;
    w.x=m.x+Math.cos(a)*r;w.y=m.y+Math.sin(a)*r*.7;w.level=m.level;if(!walkable(w.x,w.y,m.level)){w.x=m.x;w.y=m.y+40;}
    w.hp=1;w.llWisp=true;word(w,'T2');st.wisps.push(w);n++;if(st.chains.length<SK.MAXCH){st.chains.push(w);w.llChain=true;st.open=false;}}
  if(n){say('IT RAISES WISPS — one word each, and they chain it again',3);blip(260,.2,'sawtooth',.07,120);}};
SK.tick=function(c,dt){const m=c.m,st=c.st;
  if(!c.last&&c.t<4&&st.chains.length<SK.MAXCH){const free=live2().filter(x=>x!==m&&!x.llChain&&x.level===m.level);if(free.length)SK.chain(c);}   /* the escorts arrive over the first seconds */
  st.lamp.x=m.x;st.lamp.y=m.y;st.lamp.tx=Math.floor(m.x/T);st.lamp.ty=Math.floor(m.y/T);st.lamp.r=st.lightR;
  if(!c.last)for(const L of S.lamps){if(L.skull||L.snuffed)continue;if(D(L,m)<T*1.1){L.snuffed=true;L.out=9999;L.tele=0;st.lightR=Math.min(T*3,st.lightR+T/2);say('IT TOOK A LAMP — its light grows',2.2);blip(140,.26,'triangle',.06,80);}}
  if(!c.last){const dead=st.chains.filter(x=>x.dead||!mobs.includes(x));st.chains=st.chains.filter(x=>!x.dead&&mobs.includes(x));for(const x of dead)SK.snap(c);m.shield=st.chains.length?.25:0;if(!st.chains.length)st.open=true;}else m.shield=0;
  if(st.flare>0)st.flare-=dt;
  if(c.half&&!c.last){st.wispT-=dt;if(st.wispT<=0){st.wispT=SK.WISP_EVERY;SK.wisps(c);}}
  st.wisps=st.wisps.filter(w=>!w.dead&&mobs.includes(w));
  /* Bone Mend: the word MEND breaks it */
  const d=SkullCleave.states.get(m);const mending=d&&d.healing&&!d.healResult;
  if(mending&&!st.mend){st.mend=B.addWord('mend',()=>{const d2=SkullCleave.states.get(m);if(d2&&d2.healing&&!d2.healResult){d2.healResult='INTERRUPTED';d2.t=3;}st.mend=null;say('MEND BROKEN',2);blip(900,.1,'square',.07,1300);});}
  if(!mending&&st.mend){B.dropWord(st.mend);st.mend=null;}};
SK.ground=function(c){const m=c.m,st=c.st,R=st.lightR;g.save();
  if(!c.last){const gr=g.createRadialGradient(m.x,m.y-10,10,m.x,m.y-10,R);gr.addColorStop(0,'rgba(140,255,110,'+(st.flare>0?.08:.2)+')');gr.addColorStop(.7,'rgba(140,255,110,.06)');gr.addColorStop(1,'rgba(140,255,110,0)');
    g.fillStyle=gr;g.beginPath();g.ellipse(m.x,m.y-10,R,R*.62,0,0,7);g.fill();g.strokeStyle='rgba(170,255,140,.35)';g.lineWidth=2;g.setLineDash([5,6]);g.beginPath();g.ellipse(m.x,m.y-10,R,R*.62,0,0,7);g.stroke();g.setLineDash([]);}
  g.lineWidth=3;for(const e of st.chains){if(e.dead)continue;g.strokeStyle=st.flare>0?'rgba(255,214,120,.95)':'rgba(200,214,220,.85)';
    const dx=e.x-m.x,dy=e.y-m.y,L=Math.hypot(dx,dy),n=Math.max(4,Math.floor(L/14));g.beginPath();for(let i=0;i<=n;i++){const t=i/n,sag=Math.sin(t*Math.PI)*18;const x=m.x+dx*t,y=m.y-30+dy*t+sag;if(i===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();
    g.fillStyle='rgba(230,238,240,.9)';for(let i=1;i<n;i+=2){const t=i/n,sag=Math.sin(t*Math.PI)*18;g.fillRect(Math.round(m.x+dx*t)-2,Math.round(m.y-30+dy*t+sag)-2,4,4);}}
  g.restore();};
SK.hud=function(c){const m=c.m,st=c.st;if(st.flare>0){g.save();g.globalAlpha=.14*Math.min(1,st.flare/.4);g.fillStyle='#c8ffb0';g.fillRect(0,0,VW,VH);g.restore();}
  const d=SkullCleave.states.get(m),mending=d&&d.healing&&!d.healResult;
  const line=c.last?lastLine(c):mending?['BONE MEND · TYPE MEND TO STOP IT','or wound it — poison blocks the mend','#ff9a5a']
    :st.flare>0?['CHAIN SNAPPED · THE ROOM LIGHTS FOR 2S','read every name, choose the next','#c8ffb0']
    :st.chains.length?['CHAINED TO '+st.chains.length+' · KILL THEM TO OPEN ITS NAME','stand in its light to read · step out to be safe','#daf0be']
    :['ITS NAME IS OPEN · TYPE IT FOR A HEART','then it chains four more','#8fe0a0'];
  bar(c,line);if(mending&&st.mend)typedLabel(st.mend,'MEND',m.x,m.y-215,'#ffe08a');};
SK.tag=function(c,m){const st=c.st;if(m===c.m){if(c.last)return ['LAST WORD '+(4-c.lastN)+' / 3','#ff6a4a'];const d=SkullCleave.states.get(m);if(d&&d.healing&&!d.healResult)return ['BONE MEND · TYPE MEND','#a5ff75'];
    return st.chains.length?['CHAINED TO '+st.chains.length+' · KILL THEM FIRST','#daf0be']:['OPEN · TYPE ITS NAME','#8fe0a0'];}
  return null;};

/* ================= VI · THE LAST EMBER ================= */
const LZ={LIFE:10,HOLD:4,EAT:1.5,EAT2:1,KEEP:3};   /* v130: the ember holds 4s before it drifts back; keep 3 and the last word stays lit */
LZ.start=function(c){const st=c.st;Object.assign(st,{embers:[],dark:false});
  c.onHeart=(was)=>{for(const e of st.embers)if(!e.dead&&!e.claimed&&e.eat>0){e.eat=0;say('THE MEAL IS INTERRUPTED',2);}LZ.drop(c);};   /* v130: a wound stops the meal */
  c.onHalf=()=>{say('HUNGER — it eats faster, and its orbs snuff embers',3.2);};
  c.onLast=()=>{for(const e of st.embers)if(!e.claimed)e.dead=true;const kept=st.embers.filter(e=>e.claimed&&!e.dead).length;
    if(kept>=LZ.KEEP){st.dark=false;say('THREE EMBERS KEPT — its glow holds for the last word',4);}else{st.dark=true;say('ITS GLOW GOES OUT — read it in your beam, or from an ember you claimed'+(kept?' ('+kept+' kept)':''),4);}};
  c.onDead=()=>{S.lamps=S.lamps.filter(L=>!L.ember);for(const s2 of mobs)s2.snuffTarget=null;};
  toast('THE LAST EMBER — every heart you take falls out as an ember. Type its name to keep it as a lamp, before the Lizard eats it back. Keep three and its last word stays lit.',6);};
LZ.drop=function(c){const m=c.m,st=c.st;const p=spotNear(m.x,m.y,m.level,T*.8,T*1.6,null)||{x:m.x,y:m.y};
  const w=pick('T2',[])||pick('T1',[])||'coal';
  const e={x:p.x,y:p.y,t:LZ.LIFE,word:w,claimed:false,dead:false,eat:0,lamp:{tx:Math.floor(p.x/T),ty:Math.floor(p.y/T),x:p.x,y:p.y,out:0,tele:0,ember:true,r:LAMP_R*.6}};
  e.w=B.addWord(w,()=>{e.claimed=true;e.lamp.r=LAMP_R;e.lamp.snuffed=false;e.lamp.out=0;say('EMBER CLAIMED — it lights the room for the rest of the stage',2.6);blip(1200,.1,'sine',.06,1800);});
  S.lamps.push(e.lamp);st.embers.push(e);fireBurst(p.x,p.y,18);say('AN EMBER IS LOOSE — '+w.toUpperCase()+' · claim it, or it eats it back',3);};
LZ.tick=function(c,dt){const m=c.m,st=c.st;const d=Glowburst.states.get(m);
  for(const e of st.embers){if(e.dead)continue;
    if(e.lamp.snuffed||e.lamp.out>0){e.dead=true;say('AN EMBER WAS PUT OUT',2);continue;}      /* a Snuffer took it */
    if(e.claimed)continue;
    e.t-=dt;
    /* the ember drifts back to the Lizard; it eats on arrival */
    const busy=d&&d.phase;const dist=D(e,m);
    if(e.t>LZ.LIFE-LZ.HOLD){/* v130: it lies where it fell for 4s */}
    else if(!m.stun&&!(m.frzT>0)){const spd=Math.max(30,dist/Math.max(.5,e.t-2))*(m.chill>0?.5:1);if(dist>28){const k=Math.min(1,spd*dt/dist);e.x+=(m.x-e.x)*k;e.y+=(m.y-e.y)*k;e.lamp.x=e.x;e.lamp.y=e.y;e.lamp.tx=Math.floor(e.x/T);e.lamp.ty=Math.floor(e.y/T);}
      else{e.eat+=dt;if(e.eat>=(c.half?LZ.EAT2:LZ.EAT)){e.dead=true;if(!window.FirstJob?.poisoned?.(m)){m.hp=Math.min(hpOf(m.tier),m.hp+1);c.lastHp=m.hp;say('IT ATE THE EMBER — a heart regrows',2.6);}else say('POISONED — it ate the ember and gained nothing',2.4);blip(140,.3,'sawtooth',.08,70);}}}
    if(e.t<=0&&!e.dead&&e.eat<=0){e.dead=true;say('THE EMBER WENT COLD',1.8);}
    if(e.lit>0)e.lit-=dt;}
  /* a wound while eating stops the meal */
  if(m.hp<c.lastHp){}
  /* released orbs snuff embers they pass, from half */
  if(c.half&&Glowburst.haunts)for(const o of Glowburst.haunts){if(o.dead)continue;for(const e of st.embers)if(!e.dead&&!e.claimed&&D(o,e)<30){e.dead=true;say('AN ORB SNUFFED THE EMBER',2);}}
  for(const e of st.embers)if(e.dead){B.dropWord(e.w);const i=S.lamps.indexOf(e.lamp);if(i>=0){S.lamps.splice(i,1);for(const s2 of mobs){if(s2.snuffTarget===i)s2.snuffTarget=null;else if(s2.snuffTarget>i)s2.snuffTarget--;}}}   /* v129.1: keep Snuffer targets in step */
  st.embers=st.embers.filter(e=>!e.dead);
  /* fire on the ember's tile guards it for 3s */
  for(const e of st.embers)if(!e.claimed&&!e.lit){for(const z of (FirstJob.zones||[]))if((z.key==='fireWall')&&D(z,e)<T*1.5){e.lit=3;}}};
LZ.ground=function(c){const st=c.st;g.save();for(const e of st.embers){const a=e.claimed?1:Math.max(.25,e.t/LZ.LIFE);
    const gr=g.createRadialGradient(e.x,e.y,4,e.x,e.y,e.lamp.r);gr.addColorStop(0,'rgba(255,154,60,'+(.45*a)+')');gr.addColorStop(1,'rgba(255,154,60,0)');g.fillStyle=gr;g.beginPath();g.ellipse(e.x,e.y,e.lamp.r,e.lamp.r*.62,0,0,7);g.fill();
    g.fillStyle=e.claimed?'#ffd36b':'#ff9a3c';g.beginPath();g.arc(e.x,e.y,7,0,7);g.fill();g.fillStyle='#fff1a1';g.beginPath();g.arc(e.x,e.y,3,0,7);g.fill();
    if(!e.claimed&&e.eat>0){g.strokeStyle='#b7ff4d';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,14,-Math.PI/2,-Math.PI/2+Math.PI*2*e.eat/(c.half?LZ.EAT2:LZ.EAT));g.stroke();}}
  g.restore();};
LZ.hud=function(c){const m=c.m,st=c.st;const loose=st.embers.filter(e=>!e.claimed);
  for(const e of loose)typedLabel(e.w,e.word.toUpperCase(),e.x,e.y-26,e.eat>0?'#b7ff4d':'#ffd36b');
  if(loose.some(e=>e.eat>0))label('EATING',m.x,m.y-200,'#b7ff4d');
  const kept=st.embers.filter(e=>e.claimed&&!e.dead).length,ks='EMBERS KEPT '+kept+'/'+LZ.KEEP+' · ';
  const line=c.last?lastLine(c):loose.length?['AN EMBER IS LOOSE · CLAIM IT, OR IT EATS IT BACK',ks+'it lies 4s, then drifts back · a wound stops the meal','#ff9a3c']
    :c.half?['HUNGER · it eats in 1s · its orbs snuff embers',ks+'keep three and its last word stays lit','#ff9a5a']
    :['EVERY HEART YOU TAKE FALLS OUT AS AN EMBER',ks+'claim it for light · keep three and its last word stays lit','#b7ff4d'];
  bar(c,line);};
B.lizardDark=function(m){const c=cur();return !!(c&&c.key==='LZ'&&c.st.dark&&m===c.m);};
const oRead=canRead;canRead=function(m){const c=cur();
  if(c&&c.key==='SK'&&c.st.flare>0&&m&&!m.dead)return true;
  if(c&&c.key==='LZ'&&c.st.dark&&m===c.m){if(S.lock===m)return true;return (S.dim!==LAMP_DIM&&inTorch(m.x,m.y))||inLight(P.x,P.y);}
  return oRead(m);};
const oLit=mobLit;mobLit=function(m){const c=cur();if(c&&c.key==='LZ'&&c.st.dark&&m===c.m)return inTorch(m.x,m.y);return oLit(m);};
const oLight=inLight;inLight=function(px,py){const c=cur();if(!c||(c.key!=='SK'&&c.key!=='LZ'))return oLight(px,py);if(!dark())return true;
  for(const L of S.lamps){if(L.out>0)continue;const r=L.r||LAMP_R;if((px-L.x)*(px-L.x)+(py-L.y)*(py-L.y)<=r*r)return true;}return false;};

/* ================= VII · THE GATEHOUSE ================= */
const LC={REC:2.0,REC_PAIR:2.2,REC_FAN:1.6,REC_LAST:2.0,SWEEP:160};
LC.start=function(c){const st=c.st;Object.assign(st,{gates:[],gateT:0,gateWord:null,open:0});
  c.onHalf=()=>{say('THE GATES — its reap throws a gate open · type GATE to shut it',3.4);};
  c.onHeart=()=>{if(c.half)LC.openGate(c);};
  c.onLast=()=>{say('THE LAST REAP — it no longer walks',3);};
  c.onDead=()=>{if(st.gateWord)B.dropWord(st.gateWord);};
  toast('THE GATEHOUSE REAPER PARRIES while it charges and swings. Type while it walks or recovers — the bar says OPEN.',6);};
LC.parrying=function(m){const b=m.lance;if(!b)return false;return ['spinWind','spin','fanWind','fan','returnWalk'].includes(b.phase);};
LC.openGate=function(c){const st=c.st;st.open=Math.min(2,st.open+1);st.gateT=Math.min(st.gateT||8,3);
  if(!st.gateWord)st.gateWord=B.addWord('gate',()=>{st.open=0;st.gateWord=null;say('THE GATE IS SHUT',2.2);blip(300,.18,'triangle',.06,160);});
  say('A GATE IS OPEN — Harriers every 8s until you type GATE',3);};
LC.tick=function(c,dt){const m=c.m,st=c.st;
  if(LC.parrying(m)&&!c.last||LC.parrying(m)){m.shield=.25;m.lit=0;}else m.shield=0;
  if(st.open>0){st.gateT-=dt;if(st.gateT<=0){st.gateT=8;for(let i=0;i<st.open;i++){const h=spawnMob('HR');if(h){const p=spotNear(P.x,P.y,P.level,T*5,T*8,null);if(p){h.x=p.x;h.y=p.y;h.level=P.level;}}}say('HARRIERS THROUGH THE GATE',2);}}
  if(c.last){const b=m.lance;if(b&&b.phase==='walk'&&!(m.stagger>0||m.stun>0||m.frzT>0)){b.angle=Math.atan2(P.y-m.y,P.x-m.x);b.chain=0;
      if(D(P,m)<=LANCER.RADIUS+35)lancerStart(m,'spinWind',LANCER.SPIN_WIND);else lancerStart(m,'fanWind',LANCER.FAN_WIND);}}};
const oLStart=lancerStart;lancerStart=function(m,phase,t){const c=cur();
  if(c&&c.key==='LC'&&m===c.m&&phase==='recover'){const b=m.lance;const from=b&&b.phase;t=c.last?LC.REC_LAST:from==='fan'||from==='fanWind'?LC.REC_FAN:b&&b.chain===2?LC.REC_PAIR:LC.REC;if(b&&b.broke>0)t+=0;}
  return oLStart(m,phase,t);};
const oSpinHit=lancerSpinHit;lancerSpinHit=function(m){const c=cur();
  if(c&&c.key==='LC'&&m===c.m&&c.half){const b=m.lance;if(b&&b.chain===2&&!b.hit&&P.level===m.level&&D(P,m)<=LC.SWEEP+13&&lancerSight(m,P.x,P.y)){if(lancerDamage("the Reaper's sweeping spin",m))b.hit=true;return;}}
  return oSpinHit(m);};
LC.hud=function(c){const m=c.m,st=c.st,b=m.lance||{};const par=LC.parrying(m);
  const left=b.phase==='recover'?Math.max(0,b.t):b.phase==='walk'?null:0;
  const line=c.last?lastLine(c):par?['IT PARRIES · '+(b.phase==='spin'?'SWINGING':'CHARGING'),'leave the ring, cross the fan — do not finish a name now','#ff6a4a']
    :['OPEN'+(left!=null?' · '+left.toFixed(1)+'s':' · WHILE IT WALKS')+(st.open?' · A GATE IS OPEN':''),'type now · '+(c.half?'the second spin reaches 2.5 tiles':'Freeze breaks a charge'),'#8fe0a0'];
  bar(c,line);if(st.open&&st.gateWord)typedLabel(st.gateWord,'GATE',m.x,m.y-200,'#ffd36b');};
LC.tag=function(c,m){if(m!==c.m)return null;if(c.last)return ['LAST WORD '+(4-c.lastN)+' / 3','#ff6a4a'];if(LC.parrying(m))return ['PARRIES · WAIT','#ff6a4a'];const b=m.lance;return [b&&b.phase==='recover'?'OPEN · '+Math.ceil(b.t)+'s':'OPEN','#8fe0a0'];};

/* ================= VIII · THE MUSTER ================= */
const TR={BEAT:9,BEAT2:6,BEAT3:5,CAST:2,SILENCE:12};
TR.start=function(c){const m=c.m,st=c.st;Object.assign(st,{waiting:true,beatT:TR.BEAT,cast:0,drumWord:null,silence:0,lastBeatHp:m.hp,stand:false,width:TROLL.WIDTH});
  c.onHalf=()=>{TROLL.WIDTH=10;say('THE WAR MARCH — two levies a beat, and the Slam gap narrows',3.4);};
  c.onLast=()=>{st.stand=true;say('THE STAND — it plants and beats without pause',3.4);};
  c.onDead=()=>{TROLL.WIDTH=st.width;if(st.drumWord)B.dropWord(st.drumWord);};
  st.drumWord=B.addWord('drum',()=>{st.silence=TR.SILENCE;st.drumWord=null;say('THE DRUMS ARE SILENT — 12s',2.6);blip(300,.2,'triangle',.07,120);});
  toast('BREAK THE DRUMS, THEN FACE THE DRUMMER. Type DRUM to silence the Marshals for 12s. The Troll waits until both fall.',6);};
TR.marshals=()=>mobs.filter(x=>!x.dead&&x.tier==='MS');
TR.tick=function(c,dt){const m=c.m,st=c.st;
  if(st.silence>0)st.silence-=dt;
  if(!st.drumWord&&st.silence<=0&&TR.marshals().length)st.drumWord=B.addWord('drum',()=>{st.silence=TR.SILENCE;st.drumWord=null;say('THE DRUMS ARE SILENT — 12s',2.6);});
  if(st.drumWord&&!TR.marshals().length){B.dropWord(st.drumWord);st.drumWord=null;}
  if(st.waiting){if(TR.marshals().length||c.t<4){m.stagger=Math.max(m.stagger||0,.3);return;}st.waiting=false;say('THE TROLL TAKES UP THE DRUM — CHASE IN',3);S.shake=Math.max(S.shake,6);}
  if(st.stand){m.stagger=Math.max(m.stagger||0,.3);}
  const gap=st.stand?TR.BEAT3:c.half?TR.BEAT2:TR.BEAT;
  if(st.cast>0){m.stagger=Math.max(m.stagger||0,.3);if(m.hp<st.lastBeatHp){st.cast=0;say('THE BEAT IS BROKEN',2);blip(900,.1,'square',.07,1300);}
    else{st.cast-=dt;if(st.cast<=0){TR.levy(c,c.half?2:1);st.beatT=gap;}}}
  else{st.beatT-=dt;if(st.beatT<=0&&!(m.frzT>0||m.stun>0)){st.cast=TR.CAST;st.lastBeatHp=m.hp;blip(140,.16,'square',.05,90);}}
  if(st.cast<=0)st.lastBeatHp=m.hp;};
TR.levy=function(c,n){const m=c.m;for(let i=0;i<n;i++){const lv=spawnMob('LV');if(!lv)continue;
    const used=c.st.used||(c.st.used=new Set());const slip=(S.ledger||[]).filter(x=>!used.has(x.w)&&x.w&&/^[a-z]{3,12}$/.test(x.w)&&!mobs.some(o=>!o.dead&&o.word===x.w))[0];
    if(slip){lv.word=slip.w;lv.wtier=tierOf(slip.w)||'T3';lv.yourSlip=true;used.add(slip.w);}
    lv.leviedBy=m.uid;}
  say(n>1?'THE DRUM CALLS TWO':'THE DRUM CALLS A LEVY',2);};
const oMuster=musterTick;musterTick=function(dt){const c=cur();if(c&&c.key==='TR'&&c.st.silence>0)return;return oMuster(dt);};
/* a clean kill of a slip forgives it; a repeat slip raises it */
const oFumble2=fumble;fumble=function(lose){const c=cur();if(c&&c.key==='TR'&&S.lock&&S.lock.yourSlip&&!S.lock.raisedOnce){const m=S.lock;m.raisedOnce=true;const at=TIERS.indexOf(m.wtier);const w=at>=0&&at<TIERS.length-1?pick(TIERS[at+1],[m.word]):null;if(w){m.word=w;m.wtier=TIERS[at+1];m.growFx=1;}c.st.beatT=Math.max(0,c.st.beatT-2);say('A SLIP ON A SLIP — its name grows, the next beat comes sooner',2.4);}return oFumble2(lose);};
const oKill2=FirstJob.arrowKill;FirstJob.arrowKill=function(m,a){const c=cur();if(c&&c.key==='TR'&&m.yourSlip&&S.wordFumbles===0){ledgerRetire(m.word);say('SLIP FORGIVEN — '+m.word.toUpperCase(),2);}return oKill2(m,a);};
TR.hud=function(c){const m=c.m,st=c.st;
  const line=c.last?lastLine(c):st.waiting?['BREAK THE DRUMS · THE TROLL WATCHES','type DRUM to silence the Marshals 12s · kill them both','#e0a050']
    :st.cast>0?['IT BEATS THE DRUM · '+st.cast.toFixed(1)+'s','an arrow stops the beat · the muster calls your slips','#ffb347']
    :c.half?['THE WAR MARCH · two levies a beat','the Slam gap is narrower · a repeat slip raises the name','#ff9a5a']
    :['THE DRUMMER · a levy every 9s wears a name you slipped on','type it clean and the slip is forgiven','#ffb347'];
  bar(c,line);if(st.cast>0)label('DRUM · '+st.cast.toFixed(1)+'s',m.x,m.y-215,'#ffb347');
  if(st.drumWord){const ms=TR.marshals()[0];if(ms)typedLabel(st.drumWord,'DRUM',ms.x,ms.y-150,'#ffd36b');}
  if(st.silence>0)label('SILENCED · '+Math.ceil(st.silence)+'s',m.x,m.y-240,'#e0a050');};
TR.tag=function(c,m){if(m.yourSlip&&!m.dead)return ['YOUR SLIP','#e0a050'];if(m===c.m){if(c.last)return ['LAST WORD '+(4-c.lastN)+' / 3','#ff6a4a'];if(c.st.waiting)return ['WATCHING','#e0a050'];if(c.st.cast>0)return ['DRUM · WOUND IT','#ffb347'];}return null;};

/* ================= wiring ================= */
const IMPL={SR,SM,SK,LZ,LC,TR};
function detect(){if(B.cur&&(B.cur.m.dead&&B.cur.done||!mobs.includes(B.cur.m)))B.cur=null;if(B.cur)return;
  if(!stageOn())return;for(const key in CH){if(S.chapter!==CH[key])continue;const m=mobs.find(x=>!x.dead&&x.tier===key);if(m){const c=begin(m,key);IMPL[key].start(c);}}}
const oTick=skFxTick;skFxTick=function(dt){oTick(dt);if(!stageOn())return;detect();const c=cur();if(!c)return;if(!sharedTick(c,dt))return;IMPL[c.key].tick(c,dt);};
const oEnter=enterStage;enterStage=function(...a){if(B.cur){if(B.cur.onDead)try{B.cur.onDead();}catch(e){}B.cur=null;}B.words=[];return oEnter(...a);};
const oGround=folDrawLayer;folDrawLayer=function(m){oGround(m);const c=cur();if(c&&IMPL[c.key].ground&&!c.m.dead)IMPL[c.key].ground(c);};
const oHud=hud;hud=function(){oHud();const c=cur();if(c&&S.scene==='stage')IMPL[c.key].hud(c);};
const oTag=tagFor;tagFor=function(m){const c=cur();if(c){const I=IMPL[c.key];if(I.tag){const t=I.tag(c,m);if(t)return t;}if(c.key==='SK'&&m.llChain&&!m.dead){const t=oTag(m);return ['CHAINED'+(t?' · '+t[0]:''),'#daf0be'];}if(m===c.m&&c.last)return ['LAST WORD '+(4-c.lastN)+' / 3','#ff6a4a'];}return oTag(m);};
})(Bosses);

