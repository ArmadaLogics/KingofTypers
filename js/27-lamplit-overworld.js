/* Chapter V overworld: approved crystal-mine artwork on the authored map. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),maps=new WeakMap(),props=new WeakMap();
 const native={build:buildMap,blit:folBlit,water:drawWater,sky:drawSky,minimap,road:drawMapRoadAtlas};
 const API=window.LamplitVaults={enabled:true};
 const active=m=>API.enabled&&S.scene==='over'&&S.chapter===4&&maps.has(m);
 const readyArt=()=>[['lvTerrain',576,384],['lvProps',512,512]].every(([key,w,h])=>IMG[key]?.complete&&IMG[key].naturalWidth===w&&IMG[key].naturalHeight===h);
 const readyRoadArt=()=>IMG.lvRoads?.complete&&IMG.lvRoads.naturalWidth===256&&IMG.lvRoads.naturalHeight===256;
 drawMapRoadAtlas=function(ctx,def){
  if(!API.enabled||FOL_CH!=='V'||!FOL_OVER||!readyArt()||!readyRoadArt())return native.road(ctx,def);
  const on=new Set(def.road.map(([x,y])=>x+','+y));
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const [x,y]of def.road){
   const mask=(on.has(x+','+(y-1))?1:0)|(on.has((x+1)+','+y)?2:0)
    |(on.has(x+','+(y+1))?4:0)|(on.has((x-1)+','+y)?8:0);
   ctx.drawImage(IMG.lvRoads,(mask%4)*64,Math.floor(mask/4)*64,64,64,x*T,y*T,T,T);
  }
  ctx.restore();return true;
 };
 // Sprite content rectangles are from the approved 512px object atlas, with alpha padding removed.
 const rects=[[21,8,85,112],[150,29,84,91],[288,57,63,63],[423,80,50,40],
  [8,153,112,95],[163,201,58,47],[286,180,68,68],[403,183,90,65],
  [8,285,112,91],[142,273,100,103],[302,269,36,107],[404,294,88,82],
  [31,392,66,112],[136,443,112,61],[266,392,108,112],[432,392,31,112]];
 const sprite=(ctx,id,cx,foot,width)=>{
  const [sx,sy,sw,sh]=rects[id],h=Math.round(width*sh/sw),x=Math.round(cx-width/2),y=Math.round(foot-h);
  ctx.drawImage(IMG.lvProps,sx,sy,sw,sh,x,y,width,h);
 };
 function appearance(it){
  const k=it.k,box=folBox(it),cx=box.x+box.w/2,foot=it.foot+(k.startsWith('wrock')?4:-4);
  if(k==='castle')return {id:8,cx,foot,width:Math.min(304,box.w),torches:true};
  if(k==='house')return {id:it.x===11?9:8,cx,foot,width:Math.min(112,box.w),torch:true,cart:it.x===11};
  if(k==='tower')return {id:0,cx,foot,width:Math.min(116,box.w),torch:true};
  if(k.startsWith('tree'))return {id:0,cx,foot,width:Math.min(116,box.w)};
  if(k.startsWith('wrock'))return {id:2,cx,foot,width:Math.max(26,Math.min(46,box.w+4))};
  if(k.startsWith('rock')){
   const pick=(it.x*13+it.y*7)%5,id=pick===0?1:pick===1?6:pick===2?5:pick===3?4:3;
   return {id,cx,foot,width:Math.max(30,Math.min(64,box.w+4))};
  }
  if(k.startsWith('bush'))return {id:5,cx,foot,width:Math.min(64,box.w)};
  if(k.startsWith('stump')||k==='wood')return {id:7,cx,foot,width:Math.min(64,box.w)};
  if(k==='torch')return {id:15,cx,foot,width:23};
  return null;
 }
 function drawProp(ctx,it){
  const p=props.get(it);if(!p)return native.blit(ctx,it,0);
  sprite(ctx,p.id,p.cx,p.foot,p.width);
  if(p.torches){
   sprite(ctx,10,p.cx-p.width*.44,p.foot,26);sprite(ctx,10,p.cx+p.width*.44,p.foot,26);
   sprite(ctx,15,p.cx-p.width*.32,p.foot-2,20);sprite(ctx,15,p.cx+p.width*.32,p.foot-2,20);
  }else if(p.torch)sprite(ctx,15,p.cx-p.width*.34,p.foot+2,16);
  if(p.cart)sprite(ctx,11,p.cx+8,p.foot+2,68);
  return true;
 }
 folBlit=function(ctx,it,frame){return active(over)&&props.has(it)?drawProp(ctx,it):native.blit(ctx,it,frame);};
 function light(ctx,p){
  const crystal=p.id<=2,flame=p.torch||p.torches||p.id===15;if(!crystal&&!flame)return;
  const radius=crystal?Math.max(40,p.width*1.2):92,color=crystal?'34,166,198':'239,176,67';
  const glow=ctx.createRadialGradient(p.cx,p.foot-10,0,p.cx,p.foot-10,radius);
  glow.addColorStop(0,`rgba(${color},.13)`);glow.addColorStop(1,`rgba(${color},0)`);
  ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=glow;ctx.fillRect(p.cx-radius,p.foot-10-radius,radius*2,radius*2);ctx.restore();
 }
 function caps(m,ctx){
  const elevated=(x,y)=>m.def.t[y]?.[x]==='#';
  // The generated atlas has bottom caps; use those instead of extending a middle tile over the lip.
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(elevated(x,y)){
   const west=elevated(x-1,y),east=elevated(x+1,y),north=elevated(x,y-1),south=elevated(x,y+1);
   const col=west&&east?6:east?5:west?7:8,row=north&&south?1:south?0:north?2:3;
   ctx.drawImage(IMG.lvTerrain,col*T,row*T,T,T,x*T,y*T,T,T);
  }
  // Redraw each authored pair last so the cap cannot cover its upper ramp connection.
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.def.t[y][x]==='/'){
   ctx.drawImage(IMG.lvTerrain,0,4*T,T,T,x*T,(y-1)*T,T,T);
   ctx.drawImage(IMG.lvTerrain,0,5*T,T,T,x*T,y*T,T,T);
  }
 }
 buildMap=function(def){
  if(!API.enabled||FOL_CH!=='V'||!FOL_OVER||!readyArt())return native.build(def);
  const previousBlit=folBlit,oldLo=IMG['tm'+def.lo],oldHi=IMG['tm'+def.hi],items=[];
  // Keep native DSPEC/FOL_KIT and map inputs: collision and authored anchors are unchanged.
  folBlit=function(ctx,it,frame){if(ctx!==g){items.push(it);return true;}return previousBlit(ctx,it,frame);};
  IMG['tm'+def.lo]=IMG.lvTerrain;IMG['tm'+def.hi]=IMG.lvTerrain;
  let m;
  try{m=native.build(def);}finally{folBlit=previousBlit;IMG['tm'+def.lo]=oldLo;IMG['tm'+def.hi]=oldHi;}
  const ctx=m.canvas.getContext('2d');ctx.imageSmoothingEnabled=false;caps(m,ctx);
  let count=0;
  for(const it of items){const p=appearance(it);if(p){props.set(it,p);light(ctx,p);count++;}}
  for(const it of items)drawProp(ctx,it);
  maps.set(m,{props:count,items,roads:readyRoadArt()?(def.road?.length||0):0});return m;
 };
 drawWater=function(m,V){
  // Keep the original sea and foam renderer; the added scrolling texture was too costly.
  if(!active(m)||!reduced.matches)return native.water(m,V);
  const old=foamOn;
  try{foamOn=false;return native.water(m,V);}finally{foamOn=old;}
 };
 drawSky=function(m){if(!active(m))return native.sky(m);};
 minimap=function(m){
  if(!active(m))return native.minimap(m);
  const scale=4,w=m.w*scale,h=m.h*scale,ox=VW-14-w,oy=VH-14-h;
  g.fillStyle='rgba(10,16,20,.72)';g.fillRect(ox-5,oy-5,w+10,h+10);
  g.strokeStyle='rgba(240,195,74,.55)';g.strokeRect(ox-4.5,oy-4.5,w+9,h+9);
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=m.grid[y][x];g.fillStyle=c.t==='water'?'#12313d':c.t==='cliff'?'#1c2e42':c.t==='elevated'?'#2c5360':'#204450';g.fillRect(ox+x*scale,oy+y*scale,scale,scale);}
  g.fillStyle='#887965';for(const [x,y]of m.def.road)g.fillRect(ox+x*scale,oy+y*scale,scale,scale);
  NODES().forEach((n,i)=>{g.fillStyle=i===9?'#b03a30':i<PR().cleared?'#68b250':i<PRU()?'#5f9fe0':'#2a3440';g.beginPath();g.arc(ox+n[0]*scale+2,oy+n[1]*scale+2,i===9?4:3,0,7);g.fill();});
  const post=POST();if(post){g.fillStyle='#c9963f';g.fillRect(ox+post[0]*scale,oy+post[1]*scale,scale+1,scale+1);}
  g.fillStyle='#fff';g.beginPath();g.arc(ox+P.x/T*scale,oy+P.y/T*scale,3,0,7);g.fill();
 };
 API.snapshot=()=>({active:active(over),assetsReady:readyArt(),props:maps.get(over)?.props||0,
  approvedRamps:'Teal-Grass-Ramps-v1',terrain:'assets/biomes/lamplit-vaults/terrain.png',
  waterStyle:'original',
  roadAtlas:'assets/biomes/lamplit-vaults/roads.png',roadTiles:maps.get(over)?.roads||0,
  animated:active(over)&&!reduced.matches,authoredLayoutPreserved:true});
 if(location.hash==='#lamplit-vaults'){
  const boot=setInterval(()=>{if(!ready||loaded<total)return;clearInterval(boot);enterChapter(4);S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;},60);
 }
})();
