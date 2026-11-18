/* Chapter II only: reviewed whole snowy platforms, separate buildings and clean scenery. */
(() => {
 'use strict';
 const native={build:buildMap,blit:folBlit,water:drawWater,sky:drawSky,skyOver:drawSkyOver,minimap};
 const maps=new WeakMap(),props=new WeakMap(),masks=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const API=window.AshenReachSnow={enabled:true,version:3,shadowsEnabled:true,shadowStyle:'platform-silhouette',propShadowsEnabled:true,roadStyle:'aligned-cardinal-16',shoreCornerStyle:'textured-curved-bank',waterStyle:'curved-native-foam'},sheets=ASHEN_SNOW_ART.sheets;
 const active=m=>API.enabled&&S.scene==='over'&&S.chapter===1&&maps.has(m);
 const artReady=()=>Object.values(sheets).every(s=>IMG[s.key]?.complete&&IMG[s.key].naturalWidth===s.size[0]&&IMG[s.key].naturalHeight===s.size[1]);
 API.weather='snowfall';
 drawSkyOver=function(m){
  if(!active(m))return native.skyOver(m);
  if(!S.sky)return;
  const V=viewFor(m),time=reduced.matches?0:S.t,count=Math.max(64,Math.min(150,Math.round(VW*VH/7000))),width=VW+32,height=VH+32;
  const wrap=(n,span)=>((n%span)+span)%span,px=P.x*V.z+V.ox,py=P.y*V.z+V.oy;
  const markers=NODES().map(([x,y])=>[(x*T+T/2)*V.z+V.ox,(y*T+T/2)*V.z+V.oy]);
  g.save();g.setTransform(1,0,0,1,0,0);
  for(let i=0;i<count;i++){
   const seed=Math.imul(i+17,2654435761)>>>0,near=i%3!==0,size=near?2:1;
   const x=Math.floor(wrap(seed%10007/10007*width+time*(near?8:4)+Math.sin(time*.35+i)*3+V.ox*.12,width)-16);
   const y=Math.floor(wrap((seed>>>8)%10009/10009*height+time*(14+i%5*3)+V.oy*.08,height)-16);
   if((Math.abs(x-px)<25&&y>py-70&&y<py+8)||markers.some(([mx,my])=>Math.abs(x-mx)<25&&Math.abs(y-my)<24))continue;
   g.globalAlpha=near?.75:.45;g.fillStyle=near?'#f4fbff':'#c6e1f1';g.fillRect(x,y,size,size);
   if(near&&i%7===0){g.globalAlpha=.6;g.fillRect(x-1,y+1,4,1);}
   if(near){g.globalAlpha=.28;g.fillStyle='#8fb9d2';g.fillRect(x+1,y+size,1,1);}
  }g.restore();
 };
 // Houses are drawn at the height the other chapters use (about 157px, 1.7x the idle archer).
 const HOUSE_HEIGHT=157; // the wider middle house steps 156px west: the map moved it two tiles east off the root build's ramp, and here it must keep clear of the round house
 const scaledFrames=new Map();
 const frame=(group,name)=>{
  const f=sheets[group].frames[name];
  if(group!=='buildings'||!/^snow_house\d$/.test(name))return f;
  if(scaledFrames.has(name))return scaledFrames.get(name);
  const k=HOUSE_HEIGHT/f.bounds[3],sc=a=>a.map(v=>Math.round(v*k));
  const out={...f,scale:k,srcBounds:f.bounds,srcAnchor:f.anchor,bounds:sc(f.bounds),anchor:sc(f.anchor),foundation:sc(f.foundation),drawOffset:sc(f.drawOffset||[0,0])};
  scaledFrames.set(name,out);return out;
 };
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
 function shorelineCurves(m){
  const land=(x,y)=>!!m.def.t[y]?.[x]&&m.def.t[y][x]!=='~',curves=[];
  for(let y=1;y<m.h;y++)for(let x=1;x<m.w;x++){
   const cells=[land(x-1,y-1),land(x,y-1),land(x-1,y),land(x,y)];if(cells.filter(Boolean).length!==3)continue;
   const water=cells.indexOf(false);curves.push({x:x*T,y:y*T,sx:water%2?-1:1,sy:water<2?1:-1,radius:48});
  }return curves;
 }
 function curveShorePixels(ctx,curves,record=false){
  // Bend the existing scalloped bank pixels and their animated foam together.
  // A quarter-circle joins the two banks tangentially; no painted arc replaces
  // the atlas texture. Read from an immutable copy so corners cannot smear.
  const w=ctx.canvas.width,h=ctx.canvas.height,coverage=record?new Map():null;
  const patches=curves.map(c=>{const r=c.radius,pad=24,left=c.x+(c.sx>0?-r:-pad),top=c.y+(c.sy>0?-r:-pad),sx=Math.max(0,c.x-r-32),sy=Math.max(0,c.y-r-32);return {c,left,top,source:ctx.getImageData(sx,sy,Math.min(2*r+64,w-sx),Math.min(2*r+64,h-sy)),sx,sy,pixels:ctx.getImageData(left,top,r+pad,r+pad)};});
  for(const {c,left,top,source,sx,sy,pixels} of patches){const r=c.radius,pad=24;
   for(let v=-r;v<pad;v++)for(let u=-r;u<pad;u++){
    const theta=Math.atan2(v+r+.5,u+r+.5),distance=Math.hypot(u+r+.5,v+r+.5)-r;
    const a=theta<=Math.PI/4?distance:-r+(Math.PI/2-theta)/(Math.PI/4)*(r-24);
    const b=theta<=Math.PI/4?-r+theta/(Math.PI/4)*(r-24):distance;
    const x=Math.floor(c.x+(u+.5)*c.sx),y=Math.floor(c.y+(v+.5)*c.sy),xx=Math.floor(c.x+a*c.sx),yy=Math.floor(c.y+b*c.sy);
    if(x<0||y<0||xx<0||yy<0||x>=w||y>=h||xx>=w||yy>=h)continue;
    const dst=((y-top)*pixels.width+x-left)*4,src=((yy-sy)*source.width+xx-sx)*4;for(let k=0;k<4;k++)pixels.data[dst+k]=distance < -24?0:source.data[src+k];
    if(record)coverage.set(y*w+x,pixels.data[dst+3]>=128);
   }
   ctx.putImageData(pixels,left,top);
  }return coverage;
 }
 function terrain(m,ctx,curves){
  const has=(x,y)=>!!m.def.t[y]?.[x]&&m.def.t[y][x]!=='~',nine=frame('ground','flat_nine_slice').rect;
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(has(x,y)){
   const w=has(x-1,y),e=has(x+1,y),n=has(x,y-1),s=has(x,y+1),col=w&&e?1:e?0:w?2:3,row=n&&s?1:s?0:n?2:3;
   if(col===1&&row===1){const pick=(Math.imul(x+13,374761393)^Math.imul(y+29,668265263))>>>0;blit(ctx,'ground','snow_fill_'+pick%16,x*T,y*T,T,T);}
   else if(col===3&&row===3)blit(ctx,'ground','flat_single',x*T,y*T,T,T);
   else if(col===3){const r=frame('ground','flat_vertical').rect;blit(ctx,'ground',null,x*T,y*T,T,T,[r[0],r[1]+row*T,T,T]);}
   else if(row===3){const r=frame('ground','flat_horizontal').rect;blit(ctx,'ground',null,x*T,y*T,T,T,[r[0]+col*T,r[1],T,T]);}
   else blit(ctx,'ground',null,x*T,y*T,T,T,[nine[0]+col*T,nine[1]+row*T,T,T]);
  }
  const shoreCoverage=curveShorePixels(ctx,curves,true);
  const roads=new Set((m.def.road||[]).map(p=>p.join(',')));
  for(const[x,y]of m.def.road||[]){
   let mask=0;for(const[dx,dy,bit]of[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(roads.has((x+dx)+','+(y+dy)))mask|=bit;
   blit(ctx,'roads','road_'+mask,x*T,y*T,T,T);
  }
  const platforms=platformsFor(m);drawPlatformShadows(m,ctx,platforms);for(const p of platforms)blit(ctx,'whole',p.name,...p.worldRect);return {platforms,shoreCoverage};
 }
 function applyTopology(m,platforms,shoreCoverage){
  const base=m.grid.map(row=>row.map(c=>['elevated','stair','cliff'].includes(c.t)?{...c,t:'flat',level:0,walk:!c.prop}:{...c}));
  m.sampleCell=(px,py)=>{
   const x=Math.floor(px/T),y=Math.floor(py/T),c=base[y]?.[x];if(!c)return null;
   for(const p of platforms){const xx=(px-p.origin[0])/p.scale,yy=(py-p.origin[1])/p.scale;
    if(xx<0||yy<0||xx>=p.mask.width||yy>=p.mask.height)continue;
    for(const s of p.stairs)if(yy>=s.sourceStart&&yy<=s.sourceEnd&&Math.abs(xx-xAt(s.sourcePoints,yy))<=s.sourceHalf)return {walk:true,level:0,t:'stair'};
    if(p.mask.alpha[Math.floor(yy)*p.mask.width+Math.floor(xx)]<128)continue;
    return yy<p.lip?{...c,t:'elevated',level:1,walk:!c.prop}:{walk:false,level:-1,t:'cliff'};
   }
   const shore=shoreCoverage.get(Math.floor(py)*m.w*T+Math.floor(px));
   if(shore!==undefined)return shore?{...c,t:'flat',level:0,walk:!c.prop}:{walk:false,level:-1,t:'water'};
   return c;
  };
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)m.grid[y][x]={...m.sampleCell((x+.5)*T,(y+.5)*T)};
 }
 function appearance(it){
  const box=folBox(it),cx=box.x+box.w/2,foot=it.foot-3;let group,name;
  if(it.k==='house')return {group:'buildings',name:it.y===16?'snow_house1':'snow_house2',frame:true};
  if(it.k==='castle'||it.k==='tower')return {group:'buildings',name:'snow_'+it.k,frame:true};
  if(it.k.startsWith('tree')){group='vegetation';name='snow_tree';}
  else if(it.k.startsWith('bush')){group='vegetation';name='snow_shrub';}
  else if(it.k.startsWith('stump')){group='props';name='snow_boulder';}
  else if(it.k.startsWith('wrock')){group='props';name='snow_boulder';}
  else if(it.k.startsWith('rock')){group='props';name=box.w>36?'snow_boulder':'snow_pebble';}
  else if(it.k==='wood'){group='props';name='snow_log';}
  if(!name)return null;return {group,name,cx,foot,width:Math.round(box.w)};
 }
 // Anchors are world pixels at the front of each foundation.
 const newBuildings=[
  {name:'snow_barracks',x:516,y:247},
  {name:'snow_archery',x:707,y:251},
  {name:'snow_monastery',x:1868,y:322},
  {name:'snow_house3',x:900,y:1100}
 ];
 function fitBuildings(m,items){
  const structures=[];
  for(const {name,x,y} of newBuildings){
   const [anchorX,anchorY]=frame('buildings',name).anchor;
   const it={k:name,x:Math.floor(x/T),y:Math.floor(y/T),px:x-anchorX,py:y-anchorY,foot:y,flip:false,fade:0};
   props.set(it,{group:'buildings',name,frame:true});
   items.push(it);
  }
  for(const it of items){
   const appearance=props.get(it);
   if(appearance?.group!=='buildings')continue;
   const f=frame('buildings',appearance.name);
   if(it.sp){
    const box=folBox(it);
    const nativeIndex=m.solShapes.findIndex(shape=>shape.r&&shape.x0===box.x+6&&shape.x1===box.x+box.w-6&&shape.y1===it.foot+2);
    if(nativeIndex!==-1)m.solShapes.splice(nativeIndex,1);
   }
   if(f.scale&&!it.scaledHouse){const a0=f.srcAnchor,s0=sheets.buildings.frames[appearance.name].drawOffset||[0,0];
    const gx=it.px+s0[0]+a0[0]+(appearance.name==='snow_house2'?-156:0),gy=it.py+s0[1]+a0[1];it.px=gx-f.drawOffset[0]-f.anchor[0];it.py=gy-f.drawOffset[1]-f.anchor[1];it.scaledHouse=true;}
   const [offsetX,offsetY]=f.drawOffset;
   const x=it.px+offsetX,y=it.py+offsetY;
   const [baseX,baseY,baseWidth,baseDepth]=f.foundation;
   const collider={r:1,x0:x+baseX,x1:x+baseX+baseWidth,y0:y+baseY,y1:y+baseY+baseDepth};
   m.solShapes.push(collider);
   const [left,top,width,height]=f.bounds;
   it.foot=y+top+height;
   it.sp=[Math.round(f.rect[2]*(f.scale||1)),Math.round(f.rect[3]*(f.scale||1)),1,0,left+offsetX,top+offsetY,width,height];
   if(!m.stand.includes(it))m.stand.push(it);
   structures.push({name:appearance.name,rect:[x+left,y+top,width,height],foundation:collider,foot:it.foot});
  }
  return structures;
 }
 function addScenery(m,items,platforms){
  // These frames already contain the user's PropsV3/snow artwork. Add missing
  // categories in open flat ground, keeping paths, landmarks and stairs clear.
  const rectFor=it=>{const p=props.get(it),f=frame(p.group,p.name),b=f.bounds,o=f.drawOffset||[0,0];if(p.frame)return[it.px+o[0]+b[0],it.py+o[1]+b[1],b[2],b[3]];const h=p.width*b[3]/b[2];return[p.cx-p.width/2,p.foot-h,p.width,h];};
  const reserved=items.filter(it=>props.has(it)).map(rectFor),roads=m.def.road||[],nodes=FOL_KEEP.map(k=>k.split(',').map(Number)),stairs=platforms.flatMap(p=>p.stairs.flatMap(s=>s.points)),extras=[];
  const overlap=(a,b,gap=8)=>a[0]<b[0]+b[2]+gap&&a[0]+a[2]+gap>b[0]&&a[1]<b[1]+b[3]+gap&&a[1]+a[3]+gap>b[1];
  const candidates=[];for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++){const seed=(Math.imul(x+7,19349663)^Math.imul(y+9,83492791))>>>0;candidates.push({x,y,cx:(x+.5)*T+(seed%17)-8,foot:(y+.72)*T+((seed>>>5)%13)-6,seed});}candidates.sort((a,b)=>a.seed-b.seed);
  const types=[['vegetation','snow_shore',6,32,false,true],['props','snow_ruin',2,42,true],['props','snow_special',4,48,true],['props','snow_log',3,70,true],['vegetation','snow_shrub',6,36,true],['vegetation','snow_ground',8,25,false]];
  const ground=m.canvas.getContext('2d');
  for(const[group,name,count,width,solid,coastal]of types){let placed=0;const b=frame(group,name).bounds,height=width*b[3]/b[2];
   for(const c of candidates){if(placed>=count)break;const {x,y,cx,foot}=c,cell=m.sampleCell(cx,foot-2),box=[cx-width/2,foot-height,width,height];
    if(!cell?.walk||cell.t!=='flat'||cell.level!==0)continue;
    if(coastal&&![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>m.def.t[y+dy]?.[x+dx]==='~'))continue;
    if(reserved.some(r=>overlap(box,r,12))||roads.some(([rx,ry])=>overlap(box,[rx*T+12,ry*T+12,40,40],24)))continue;
    if(nodes.some(([nx,ny])=>overlap(box,[nx*T-24,ny*T-72,112,132],20))||stairs.some(([sx,sy])=>Math.hypot(cx-sx,foot-sy)<85))continue;
    if(extras.some(it=>Math.hypot(cx-it.cx,foot-it.foot)<(solid?80:62)))continue;
    if([-width*.48,0,width*.48].some(dx=>{const g=m.sampleCell(cx+dx,foot-3);return !g?.walk||g.t!=='flat'||ground.getImageData(Math.floor(cx+dx),Math.floor(foot-3),1,1).data[3]<200;}))continue;
    const it={k:'snow_extra_'+name,x,y,px:box[0],py:box[1],foot,flip:false,fade:0,low:true,sp:[width,height,1,0,0,0,width,height]};
    props.set(it,{group,name,cx,foot,width});items.push(it);reserved.push(box);extras.push({name,group,cx,foot,width,height,solid,box});placed++;
    if(solid){m.solShapes.push({cx,cy:foot-5,rx:name==='snow_log'?width*.36:width*.3,ry:name==='snow_ruin'?10:7});m.stand.push(it);}
   }
  }return extras;
 }
 function drawPropShadows(m,ctx,items){
  if(!API.propShadowsEnabled)return [];
  const layer=document.createElement('canvas');layer.width=m.w*T;layer.height=m.h*T;
  const paint=layer.getContext('2d'),shade=paint.createImageData(layer.width,layer.height),jobs=[];
  for(const it of items){
   const p=props.get(it);if(!p)continue;
   const f=frame(p.group,p.name),b=f.bounds,tree=p.name==='snow_tree',building=p.frame;
   const offset=f.drawOffset||[0,0],width=building?b[2]:p.width,cx=building?it.px+offset[0]+b[0]+b[2]/2:p.cx,foot=building?it.py+offset[1]+b[1]+b[3]:p.foot;
   const anchor=m.sampleCell(cx,foot-2);if(!anchor||!['flat','elevated'].includes(anchor.t))continue;
   const band=Math.max(4,Math.round(b[3]*(building ? .2 : tree ? .09 : .35))),scale=building?1:width/b[2];
   const height=Math.max(2,Math.round(band*scale)),drop=building?9:tree?3:2,left=Math.round(cx-width/2),top=Math.round(foot-height+drop),w=Math.round(width);
   const opacity=building?.27:.20;
   // Keep the lower contour at the sprite's original scale, then shift it a few
   // pixels down. Curved foundations and roots stay attached along their base.
   const stamp=document.createElement('canvas');stamp.width=w;stamp.height=height;const sc=stamp.getContext('2d');sc.imageSmoothingEnabled=false;
   const sb=f.srcBounds||b,sband=Math.max(1,Math.round(band/(f.scale||1)));
   sc.drawImage(IMG[sheets[p.group].key],f.rect[0]+sb[0],f.rect[1]+sb[1]+sb[3]-sband,sb[2],sband,0,0,w,height);
   const alpha=sc.getImageData(0,0,w,height).data;let pixels=0;
   for(let y=0;y<height;y++)for(let x=0;x<w;x++){
    const xx=left+x,yy=top+y,a=Math.round(alpha[(y*w+x)*4+3]*opacity);if(!a||xx<0||yy<0||xx>=layer.width||yy>=layer.height)continue;
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
  if(p.frame){const f=frame(p.group,p.name),r=f.rect,offset=f.drawOffset||[0,0],k=f.scale||1;blit(ctx,p.group,p.name,it.px+offset[0],it.py+offset[1],r[2]*k,r[3]*k);return true;}
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
  const ctx=m.canvas.getContext('2d'),shoreCurves=shorelineCurves(m);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,m.canvas.width,m.canvas.height);const {platforms,shoreCoverage}=terrain(m,ctx,shoreCurves);applyTopology(m,platforms,shoreCoverage);
  const foam=document.createElement('canvas');foam.width=m.canvas.width;foam.height=m.canvas.height;
  for(const it of items){const p=appearance(it);if(p)props.set(it,p);}
  const structures=fitBuildings(m,items);
  const extras=addScenery(m,items,platforms);
  const propShadowPlacements=drawPropShadows(m,ctx,items);
  for(const it of [...items].sort((a,b)=>a.foot-b.foot||a.x-b.x))drawProp(ctx,it);
  maps.set(m,{platforms,stairPaths:platforms.flatMap(p=>p.stairs),items,foam,foamFrame:-1,propShadowPlacements,shoreCurves,extras,structures});return m;
 };
 drawWater=function(m,V){
  if(!active(m))return native.water(m,V);g.fillStyle='#14445b';g.fillRect(-V.ox/V.z,-V.oy/V.z,VW/V.z,VH/V.z);
  if(!foamOn)return;
  const state=maps.get(m),time=reduced.matches?0:Math.floor(S.t*8)%16;
  // Keep the native foam footprint and phase timing, bent through the same
  // coordinate mapping as the snow bank. Terrain covers its landward center.
  if(state.foamFrame!==time){const f=state.foam.getContext('2d');f.clearRect(0,0,state.foam.width,state.foam.height);for(const[x,y,phase]of m.shore)blit(f,'foam','shore_foam_'+((time+phase)%16),x*T-64,y*T-64,192,192);curveShorePixels(f,state.shoreCurves);state.foamFrame=time;}
  g.drawImage(state.foam,0,0);
 };
 drawSky=function(m){if(!active(m))return native.sky(m);};
 API.scenery=()=>maps.get(over)?.extras.map(it=>({...it}))||[];
 API.structures=()=>maps.get(over)?.structures.map(it=>({...it}))||[];
 minimap=function(m){
  if(!active(m))return native.minimap(m);const scale=4,w=m.w*scale,h=m.h*scale,ox=VW-14-w,oy=VH-14-h;
  g.fillStyle='rgba(10,24,36,.84)';g.fillRect(ox-5,oy-5,w+10,h+10);g.strokeStyle='rgba(163,207,231,.65)';g.strokeRect(ox-4.5,oy-4.5,w+9,h+9);
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=m.grid[y][x];g.fillStyle=c.t==='water'?'#14445b':c.t==='cliff'?'#587d9e':c.t==='elevated'?'#f0f9ff':'#d5ecf8';g.fillRect(ox+x*scale,oy+y*scale,scale,scale);}
  g.fillStyle='#c7c6c7';for(const[x,y]of m.def.road)g.fillRect(ox+x*scale,oy+y*scale,scale,scale);
  NODES().forEach((p,i)=>{g.fillStyle=i===9?'#b03a30':i<PR().cleared?'#68b250':i<PRU()?'#5f9fe0':'#2a3440';g.beginPath();g.arc(ox+p[0]*scale+2,oy+p[1]*scale+2,i===9?4:3,0,Math.PI*2);g.fill();});const post=POST();if(post){g.fillStyle='#c9963f';g.fillRect(ox+post[0]*scale,oy+post[1]*scale,5,5);}g.fillStyle='#fff';g.beginPath();g.arc(ox+P.x/T*scale,oy+P.y/T*scale,3,0,Math.PI*2);g.fill();
 };
 API.snapshot=()=>{const state=maps.get(over);return {version:3,roadStyle:API.roadStyle,shoreCornerStyle:API.shoreCornerStyle,waterStyle:API.waterStyle,shadowsEnabled:API.shadowsEnabled,shadowStyle:API.shadowStyle,propShadowsEnabled:API.propShadowsEnabled,propShadowPlacements:state?.propShadowPlacements||[],active:active(over),assetsReady:artReady(),atlas:sheets.whole.file,atlasSha256:sheets.whole.sha256,supportAtlases:Object.fromEntries(Object.entries(sheets).filter(([k])=>k!=='whole').map(([k,s])=>[k,s.file])),platforms:state?.platforms.map(({mask,stairs,...p})=>({...p,stairs:stairs.map(({sourcePoints,...s})=>s)}))||[],stairPaths:state?.stairPaths||[],stairs:state?.stairPaths.map(s=>s.points[2].map(v=>Math.floor(v/T)))||[],props:state?.items.filter(it=>props.has(it)).length||0,castleShiftY:-64,towerShiftX:128,previewStorage:location.hash==='#ashen-reach',reducedMotion:reduced.matches};};
 if(location.hash==='#ashen-reach'){const boot=setInterval(()=>{if(!ready||loaded<total)return;clearInterval(boot);enterChapter(1);S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;},60);}
})();
