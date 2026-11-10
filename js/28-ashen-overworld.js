/* Chapter II only: reviewed whole snowy platforms, separate buildings and clean scenery. */
(() => {
 'use strict';
 const native={build:buildMap,blit:folBlit,water:drawWater,sky:drawSky,minimap};
 const maps=new WeakMap(),props=new WeakMap(),masks=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const API=window.AshenReachSnow={enabled:true,version:3,shadowsEnabled:true,shadowStyle:'platform-silhouette',propShadowsEnabled:true,roadStyle:'connected-blob-47'},sheets=ASHEN_SNOW_ART.sheets;
 const active=m=>API.enabled&&S.scene==='over'&&S.chapter===1&&maps.has(m);
 const artReady=()=>Object.values(sheets).every(s=>IMG[s.key]?.complete&&IMG[s.key].naturalWidth===s.size[0]&&IMG[s.key].naturalHeight===s.size[1]);
 const frame=(group,name)=>sheets[group].frames[name];
 function blit(ctx,group,name,x,y,w,h,sub){const r=sub||frame(group,name).rect;ctx.drawImage(IMG[sheets[group].key],...r,Math.round(x),Math.round(y),Math.round(w??r[2]),Math.round(h??r[3]));}
 function alphaMask(name){
  if(masks.has(name))return masks.get(name);
  const r=frame('whole',name).rect,c=document.createElement('canvas');c.width=r[2];c.height=r[3];const x=c.getContext('2d');x.drawImage(IMG[sheets.whole.key],...r,0,0,c.width,c.height);
  const rgba=x.getImageData(0,0,c.width,c.height).data,alpha=new Uint8Array(c.width*c.height);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
  const result={alpha,width:c.width,height:c.height};masks.set(name,result);return result;
 }
 const shapes={
  small:{name:'small_curved_stairs',lip:580,contentWidth:1250,stairs:[{points:[[680,370],[605,580],[515,1000]],toe:1038,half:110}]},
  long:{name:'long_two_stairs',lip:520,contentWidth:1530,stairs:[{points:[[430,390],[350,520],[310,735]],toe:766,half:70},{points:[[1290,390],[1225,520],[1200,735]],toe:766,half:70}]},
  castle:{name:'castle_base_straight_stairs',lip:515,contentWidth:1313,stairs:[{points:[[690,495],[690,650],[690,790]],toe:817,half:110}]}
 };
 const xAt=(points,y)=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(y<=b[1])return a[0]+(b[0]-a[0])*Math.max(0,Math.min(1,(y-a[1])/(b[1]-a[1])));}return points.at(-1)[0];};
 function platformsFor(m){
  const seen=new Set(),result=[];
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
   if(m.def.t[y][x]!=='#'||seen.has(x+','+y))continue;
   const q=[[x,y]],cells=[];seen.add(x+','+y);while(q.length){const[a,b]=q.pop();cells.push([a,b]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=a+dx,yy=b+dy,k=xx+','+yy;if(m.def.t[yy]?.[xx]==='#'&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}}
   const xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]),left=Math.min(...xs),right=Math.max(...xs),bottom=Math.max(...ys),width=right-left+1;
   const type=width>=8?'long':width>=7?'castle':'small',shape=shapes[type],scale=width*T/shape.contentWidth,origin=[left*T-32*scale,(bottom+1)*T-shape.lip*scale],r=frame('whole',shape.name).rect;
   const p={id:result.length,type,name:shape.name,scale,origin,lip:shape.lip,frontY:(bottom+1)*T,sourceRect:r,worldRect:[...origin,r[2]*scale,r[3]*scale],mask:alphaMask(shape.name),stairs:[]};
   for(const s of shape.stairs){
    const upper=[s.points[0][0],s.points[0][1]-45],lower=[s.points.at(-1)[0],s.toe+55],points=[upper,...s.points,[s.points.at(-1)[0],s.toe],lower],world=points.map(([xx,yy])=>[origin[0]+xx*scale,origin[1]+yy*scale]),probeY=(shape.lip+s.toe)/2,probeX=xAt(s.points,probeY);
    // Extend through the final opaque pixel row into transparent padding. Otherwise
    // fractional footprint probes classify the rounded stair toe as a one-pixel cliff.
    p.stairs.push({id:result.length+'-'+p.stairs.length,platform:result.length,points:world,halfWidth:s.half*scale,upperLevel:1,lowerLevel:0,sourcePoints:s.points,sourceStart:s.points[0][1],sourceEnd:s.toe+10,sourceHalf:s.half,sideProbes:[-1,1].map(side=>[origin[0]+(probeX+side*(s.half+55))*scale,origin[1]+probeY*scale])});
   }result.push(p);
  }return result;
 }
 function drawPlatformShadows(m,ctx,platforms){
  if(!API.shadowsEnabled)return;
  const silhouette=document.createElement('canvas');silhouette.width=m.w*T;silhouette.height=m.h*T;
  const mask=silhouette.getContext('2d');mask.imageSmoothingEnabled=false;
  // Copy each complete platform's actual contour, including its rock columns
  // and attached stair foot. There are no repeated shadow tiles or grid stamps.
  for(const p of platforms)blit(mask,'whole',p.name,...p.worldRect);
  mask.globalCompositeOperation='source-in';mask.fillStyle='rgba(22,28,46,.26)';mask.fillRect(0,0,silhouette.width,silhouette.height);
  // A tight six-pixel drop stays attached to the exact cliff/stair silhouette.
  // Source-atop preserves the ground alpha and clips the shape at the shore.
  ctx.save();ctx.globalCompositeOperation='source-atop';ctx.drawImage(silhouette,0,6);ctx.restore();
 }
 function terrain(m,ctx){
  const has=(x,y)=>!!m.def.t[y]?.[x]&&m.def.t[y][x]!=='~',nine=frame('ground','flat_nine_slice').rect;
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(has(x,y)){
   const w=has(x-1,y),e=has(x+1,y),n=has(x,y-1),s=has(x,y+1),col=w&&e?1:e?0:w?2:3,row=n&&s?1:s?0:n?2:3;
   if(col===1&&row===1){const pick=(Math.imul(x+13,374761393)^Math.imul(y+29,668265263))>>>0;blit(ctx,'ground','snow_fill_'+pick%16,x*T,y*T,T,T);}
   else if(col===3&&row===3)blit(ctx,'ground','flat_single',x*T,y*T,T,T);
   else if(col===3){const r=frame('ground','flat_vertical').rect;blit(ctx,'ground',null,x*T,y*T,T,T,[r[0],r[1]+row*T,T,T]);}
   else if(row===3){const r=frame('ground','flat_horizontal').rect;blit(ctx,'ground',null,x*T,y*T,T,T,[r[0]+col*T,r[1],T,T]);}
   else blit(ctx,'ground',null,x*T,y*T,T,T,[nine[0]+col*T,nine[1]+row*T,T,T]);
  }
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(!has(x,y)){
   const n=has(x,y-1),e=has(x+1,y),s=has(x,y+1),w=has(x-1,y);
   if(n&&w)blit(ctx,'ground','inside_nw',x*T-4,y*T-4,16,16);if(n&&e)blit(ctx,'ground','inside_ne',(x+1)*T-12,y*T-4,16,16);
   if(s&&e)blit(ctx,'ground','inside_se',(x+1)*T-12,(y+1)*T-12,16,16);if(s&&w)blit(ctx,'ground','inside_sw',x*T-4,(y+1)*T-12,16,16);
  }
  const roads=new Set((m.def.road||[]).map(p=>p.join(',')));
  for(const[x,y]of m.def.road||[]){
   let mask=0;for(const[dx,dy,bit]of[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8],[1,-1,16],[1,1,32],[-1,1,64],[-1,-1,128]])if(roads.has((x+dx)+','+(y+dy)))mask|=bit;
   // Diagonal road cells merge the shared interior corner of a filled area.
   // Without this, two adjacent lanes render as ladders with snowy holes.
   if((mask&3)!==3)mask&=~16;if((mask&6)!==6)mask&=~32;
   if((mask&12)!==12)mask&=~64;if((mask&9)!==9)mask&=~128;
   blit(ctx,'roads','road_'+mask,x*T,y*T,T,T);
  }
  const platforms=platformsFor(m);drawPlatformShadows(m,ctx,platforms);for(const p of platforms)blit(ctx,'whole',p.name,...p.worldRect);return platforms;
 }
 function applyTopology(m,platforms){
  const base=m.grid.map(row=>row.map(c=>['elevated','stair','cliff'].includes(c.t)?{...c,t:'flat',level:0,walk:!c.prop}:{...c}));
  m.sampleCell=(px,py)=>{
   const x=Math.floor(px/T),y=Math.floor(py/T),c=base[y]?.[x];if(!c)return null;
   for(const p of platforms){const xx=(px-p.origin[0])/p.scale,yy=(py-p.origin[1])/p.scale;
    if(xx<0||yy<0||xx>=p.mask.width||yy>=p.mask.height)continue;
    for(const s of p.stairs)if(yy>=s.sourceStart&&yy<=s.sourceEnd&&Math.abs(xx-xAt(s.sourcePoints,yy))<=s.sourceHalf)return {walk:true,level:0,t:'stair'};
    if(p.mask.alpha[Math.floor(yy)*p.mask.width+Math.floor(xx)]<128)continue;
    return yy<p.lip?{...c,t:'elevated',level:1,walk:!c.prop}:{walk:false,level:-1,t:'cliff'};
   }return c;
  };
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)m.grid[y][x]={...m.sampleCell((x+.5)*T,(y+.5)*T)};
 }
 function appearance(it){
  const box=folBox(it),cx=box.x+box.w/2,foot=it.foot-3;let group,name;
  if(['castle','house','tower'].includes(it.k))return {group:'buildings',name:'snow_'+it.k,frame:true};
  if(it.k.startsWith('tree')){group='vegetation';name='snow_tree';}
  else if(it.k.startsWith('bush')){group='vegetation';name='snow_shrub';}
  else if(it.k.startsWith('stump')){group='props';name='snow_boulder';}
  else if(it.k.startsWith('wrock')){group='props';name='snow_boulder';}
  else if(it.k.startsWith('rock')){group='props';name=box.w>36?'snow_boulder':'snow_pebble';}
  else if(it.k==='wood'){group='props';name='snow_log';}
  if(!name)return null;return {group,name,cx,foot,width:Math.round(box.w)};
 }
 function drawPropShadows(m,ctx,items){
  if(!API.propShadowsEnabled)return [];
  const layer=document.createElement('canvas');layer.width=m.w*T;layer.height=m.h*T;
  const paint=layer.getContext('2d'),shade=paint.createImageData(layer.width,layer.height),jobs=[];
  for(const it of items){
   const p=props.get(it);if(!p)continue;
   const f=frame(p.group,p.name),b=f.bounds,tree=p.name==='snow_tree',building=p.frame;
   const width=building?b[2]:p.width,cx=building?it.px+b[0]+b[2]/2:p.cx,foot=building?it.py+b[1]+b[3]:p.foot;
   const anchor=m.sampleCell(cx,foot-2);if(!anchor||!['flat','elevated'].includes(anchor.t))continue;
   const band=Math.max(4,Math.round(b[3]*(building ? .2 : tree ? .09 : .35))),scale=building?1:width/b[2];
   const height=Math.max(2,Math.round(band*scale)),drop=building?4:tree?3:2,left=Math.round(cx-width/2),top=Math.round(foot-height+drop),w=Math.round(width);
   // Keep the lower contour at the sprite's original scale, then shift it a few
   // pixels down. Curved foundations and roots stay attached along their base.
   const stamp=document.createElement('canvas');stamp.width=w;stamp.height=height;const sc=stamp.getContext('2d');sc.imageSmoothingEnabled=false;
   sc.drawImage(IMG[sheets[p.group].key],f.rect[0]+b[0],f.rect[1]+b[1]+b[3]-band,b[2],band,0,0,w,height);
   const alpha=sc.getImageData(0,0,w,height).data;let pixels=0;
   for(let y=0;y<height;y++)for(let x=0;x<w;x++){
    const xx=left+x,yy=top+y,a=Math.round(alpha[(y*w+x)*4+3]*.20);if(!a||xx<0||yy<0||xx>=layer.width||yy>=layer.height)continue;
    const ground=m.sampleCell(xx+.5,yy+.5);if(!ground||!['flat','elevated'].includes(ground.t)||ground.level!==anchor.level)continue;
    // A black source-atop mask multiplies existing ground brightness; it cannot
    // brighten a dark outline. Maximum alpha avoids stacked overlap darkness.
    const j=(yy*layer.width+xx)*4;if(a>shade.data[j+3])shade.data[j+3]=a;pixels++;
   }
   if(pixels)jobs.push({group:p.group,name:p.name,rect:[left,top,w,height],level:anchor.level,pixels});
  }
  paint.putImageData(shade,0,0);ctx.save();ctx.globalCompositeOperation='source-atop';ctx.drawImage(layer,0,0);ctx.restore();return jobs;
 }
 function drawProp(ctx,it,fr=0){
  const p=props.get(it);if(!p)return native.blit(ctx,it,fr);
  if(p.frame){const r=frame(p.group,p.name).rect;blit(ctx,p.group,p.name,it.px,it.py,r[2],r[3]);return true;}
  const f=frame(p.group,p.name),b=f.bounds,r=[f.rect[0]+b[0],f.rect[1]+b[1],b[2],b[3]],h=p.width*b[3]/b[2];blit(ctx,p.group,null,p.cx-p.width/2,p.foot-h,p.width,h,r);return true;
 }
 folBlit=function(ctx,it,fr){return active(over)&&props.has(it)?drawProp(ctx,it,fr):native.blit(ctx,it,fr);};
 buildMap=function(def){
  if(!API.enabled||FOL_CH!=='II'||!FOL_OVER||!artReady())return native.build(def);
  const previous=folBlit,items=[];
  folBlit=function(ctx,it,fr){if(ctx!==g){
   if(it.k==='castle'){it.py-=64;it.foot-=64;}
   if(it.k==='tower'){it.x+=2;it.px+=128;}
   // Move this rock and its native base collider together off the new curved landing.
   if(it.k.startsWith('rock')&&it.x===31&&it.y===4){it.x++;it.y--;it.px+=T;it.py-=T;it.foot-=T;}
   items.push(it);return true;}return previous(ctx,it,fr);};
  let m;try{m=native.build(def);}finally{folBlit=previous;}m.def={...def,sea:'#14445b'};
  const ctx=m.canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,m.canvas.width,m.canvas.height);const platforms=terrain(m,ctx);applyTopology(m,platforms);
  const land=document.createElement('canvas');land.width=m.canvas.width;land.height=m.canvas.height;land.getContext('2d').drawImage(m.canvas,0,0);
  const band=document.createElement('canvas');band.width=land.width;band.height=land.height;const bc=band.getContext('2d');for(let i=0;i<16;i++){const a=i*Math.PI/8;bc.drawImage(land,Math.round(Math.cos(a)*8),Math.round(Math.sin(a)*8));}bc.globalCompositeOperation='destination-out';bc.drawImage(land,0,0);
  const foam=document.createElement('canvas');foam.width=land.width;foam.height=land.height;
  for(const it of items){const p=appearance(it);if(p)props.set(it,p);}
  const propShadowPlacements=drawPropShadows(m,ctx,items);
  for(const it of [...items].sort((a,b)=>a.foot-b.foot||a.x-b.x))drawProp(ctx,it);
  maps.set(m,{platforms,stairPaths:platforms.flatMap(p=>p.stairs),items,band,foam,foamFrame:-1,propShadowPlacements});return m;
 };
 drawWater=function(m,V){
  if(!active(m))return native.water(m,V);g.fillStyle='#14445b';g.fillRect(-V.ox/V.z,-V.oy/V.z,VW/V.z,VH/V.z);
  const state=maps.get(m),time=reduced.matches?0:Math.floor(S.t*8)%16;
  if(state.foamFrame!==time){const f=state.foam.getContext('2d');f.clearRect(0,0,state.foam.width,state.foam.height);f.globalCompositeOperation='source-over';for(const[x,y,phase]of m.shore)blit(f,'foam','shore_foam_'+((time+phase)%16),x*T-64,y*T-64,192,192);f.globalCompositeOperation='destination-in';f.drawImage(state.band,0,0);state.foamFrame=time;}
  g.save();g.globalAlpha=.65;g.drawImage(state.foam,0,0);g.restore();
 };
 drawSky=function(m){if(!active(m))return native.sky(m);};
 minimap=function(m){
  if(!active(m))return native.minimap(m);const scale=4,w=m.w*scale,h=m.h*scale,ox=VW-14-w,oy=VH-14-h;
  g.fillStyle='rgba(10,24,36,.84)';g.fillRect(ox-5,oy-5,w+10,h+10);g.strokeStyle='rgba(163,207,231,.65)';g.strokeRect(ox-4.5,oy-4.5,w+9,h+9);
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=m.grid[y][x];g.fillStyle=c.t==='water'?'#14445b':c.t==='cliff'?'#587d9e':c.t==='elevated'?'#f0f9ff':'#d5ecf8';g.fillRect(ox+x*scale,oy+y*scale,scale,scale);}
  g.fillStyle='#c7c6c7';for(const[x,y]of m.def.road)g.fillRect(ox+x*scale,oy+y*scale,scale,scale);
  NODES().forEach((p,i)=>{g.fillStyle=i===9?'#b03a30':i<PR().cleared?'#68b250':i<PRU()?'#5f9fe0':'#2a3440';g.beginPath();g.arc(ox+p[0]*scale+2,oy+p[1]*scale+2,i===9?4:3,0,Math.PI*2);g.fill();});const post=POST();if(post){g.fillStyle='#c9963f';g.fillRect(ox+post[0]*scale,oy+post[1]*scale,5,5);}g.fillStyle='#fff';g.beginPath();g.arc(ox+P.x/T*scale,oy+P.y/T*scale,3,0,Math.PI*2);g.fill();
 };
 API.snapshot=()=>{const state=maps.get(over);return {version:3,roadStyle:API.roadStyle,shadowsEnabled:API.shadowsEnabled,shadowStyle:API.shadowStyle,propShadowsEnabled:API.propShadowsEnabled,propShadowPlacements:state?.propShadowPlacements||[],active:active(over),assetsReady:artReady(),atlas:sheets.whole.file,atlasSha256:sheets.whole.sha256,supportAtlases:Object.fromEntries(Object.entries(sheets).filter(([k])=>k!=='whole').map(([k,s])=>[k,s.file])),platforms:state?.platforms.map(({mask,stairs,...p})=>({...p,stairs:stairs.map(({sourcePoints,...s})=>s)}))||[],stairPaths:state?.stairPaths||[],stairs:state?.stairPaths.map(s=>s.points[2].map(v=>Math.floor(v/T)))||[],props:state?.items.filter(it=>props.has(it)).length||0,castleShiftY:-64,towerShiftX:128,previewStorage:location.hash==='#ashen-reach',reducedMotion:reduced.matches};};
 if(location.hash==='#ashen-reach'){const boot=setInterval(()=>{if(!ready||loaded<total)return;clearInterval(boot);enterChapter(1);S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;},60);}
})();
