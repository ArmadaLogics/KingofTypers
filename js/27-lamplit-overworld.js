/* Chapter V overworld: subdued Chapter I texture, moonlit colors and natural crystal/rock/fungi scenery. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),maps=new WeakMap(),props=new WeakMap();
 const native={build:buildMap,blit:folBlit,water:drawWater,sky:drawSky,minimap,road:drawMapRoadAtlas};
 const API=window.LamplitVaults={enabled:true};
 // Six authored raised footprints in the original 40 × 22 road and shoreline layout.
 const platformTerrain=[
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~..###..........######........~~~~~~~',
  '~~~~..###...#####...#####/....##.~~~~~~~',
  '~~~~./###../###.........././####....~~~~',
  '~~~../...../.............../.........~~~',
  '~~~...........~~~~~~~~~~~~...........~~~',
  '~~~...........~~~~~~~~~~~~...........~~~',
  '~~~.........~~~~~~~~~~~~~~~..........~~~',
  '~~~.........~~~~~~~~~~~~~~~..........~~~',
  '~~~...####.~~~~~~~~~~~~~~~~~..######.~~~',
  '~~~~~./###.~~~~~~~~~~~~~~~~~.#######/~~~',
  '~~~~~./###..~~~~~~~~~~~~~~~..###..../~~~',
  '~~~.....##...~~~~~~~~~~~~~~..........~~~',
  '~~~.............~~~~~~~..............~~~',
  '~~~..................................~~~',
  '~~~~...............................~~~~~',
  '~~~~~..............................~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
 ];
 const active=m=>API.enabled&&S.scene==='over'&&S.chapter===4&&maps.has(m);
 const actorKeys=new Set(['arIdle','arRun','arShoot','fletchIdle']),actorTints=new WeakMap();
 const lanternLightRadius=300,lanternHaloRadius=108;
 const lanternTiles=[[5,8],[11,8],[17,4],[27,4],[31,8],[27,15],[21,17],[4,14]];
 const lanternReady=()=>IMG.lvLantern?.complete&&IMG.lvLantern.naturalWidth===28&&IMG.lvLantern.naturalHeight===37;
 const readyArt=()=>[['lvTerrain',576,384],['lvProps',512,512]].every(([key,w,h])=>IMG[key]?.complete&&IMG[key].naturalWidth===w&&IMG[key].naturalHeight===h);
 const readyRoadArt=()=>IMG.lvRoads?.complete&&IMG.lvRoads.naturalWidth===256&&IMG.lvRoads.naturalHeight===256;
 const nativeCliff=drawMapCliffVariant;
 drawMapCliffVariant=function(ctx,atlas,column,row,x,y){
  const variant=IMG.lvCliffVariant;
  if(API.enabled&&FOL_CH==='V'&&FOL_OVER&&atlas===IMG.lvTerrain&&column===ELEV_C.m&&
     (row===CLIFF_LAND||row===CLIFF_WATER)&&variant?.complete&&
     variant.naturalWidth===64&&variant.naturalHeight===128&&folHash('lamplit-cliff:'+x+','+y)%100<42){
   const sourceY=row===CLIFF_WATER?64:0;
   ctx.drawImage(variant,0,sourceY,64,64,x*T,y*T,T,T);
   return true;
  }
  return nativeCliff(ctx,atlas,column,row,x,y);
 };
 const woodenScenery=key=>['house','castle','wood','torch','bkBar','bkArc','bkTow'].includes(folBase(key))||folBase(key).startsWith('stump');
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
  if(k==='tower')return {id:0,cx,foot,width:Math.min(116,box.w)};
  if(k.startsWith('tree'))return {id:0,cx,foot,width:Math.min(116,box.w)};
  if(k.startsWith('wrock'))return {id:2,cx,foot,width:Math.max(26,Math.min(46,box.w+4))};
  if(k.startsWith('rock')){
   const pick=(it.x*13+it.y*7)%5,id=pick===0?1:pick===1?6:pick===2?5:pick===3?4:3;
   return {id,cx,foot,width:Math.max(30,Math.min(64,box.w+4))};
  }
  if(k.startsWith('bush'))return {id:5,cx,foot,width:Math.min(64,box.w)};
  return null;
 }
 function drawProp(ctx,it){
  const p=props.get(it);if(!p)return native.blit(ctx,it,0);
  if(p.lit)ctx.drawImage(p.lit,p.left,p.top);
  else sprite(ctx,p.id,p.cx,p.foot,p.width);
  return true;
 }
 folBlit=function(ctx,it,frame){return active(over)&&props.has(it)?drawProp(ctx,it):native.blit(ctx,it,frame);};
 function crystalLight(p){
  const radius=Math.max(54,p.width*(p.id===2?2.4:2.85));
  return {x:p.cx,y:p.foot-8,radius,strength:p.id===0?1:p.id===1?.75:.53,crystal:true};
 }
 function glow(ctx,{x,y,radius,strength},color){
  const light=ctx.createRadialGradient(x,y,0,x,y,radius);
  light.addColorStop(0,`rgba(${color},${strength})`);
  light.addColorStop(.16,`rgba(${color},${strength*.76})`);
  light.addColorStop(.42,`rgba(${color},${strength*.32})`);
  light.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=light;
  ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
 }
 function makeLightField({width,height},lights){
  const lightField=document.createElement('canvas');
  lightField.width=Math.ceil(width/4);lightField.height=Math.ceil(height/4);
  const field=lightField.getContext('2d');
  field.scale(.25,.25);
  field.globalCompositeOperation='lighter';
  for(const light of lights)glow(field,light,light.crystal?'18,199,244':'39,149,237');
  return field.getImageData(0,0,lightField.width,lightField.height);
 }
 function lightIndex(field,x,y){
  const col=x>>2,row=y>>2;
  return col>=0&&col<field.width&&row>=0&&row<field.height?(row*field.width+col)*4:-1;
 }
 function shadePixel(pixels,i,alpha,red,green,blue){
  const detail=Math.min(1,(pixels[i]+pixels[i+1]+pixels[i+2])/225);
  const spill=alpha*detail,ambient=.73+.27*alpha;
  pixels[i]=pixels[i]*.43*ambient+red*spill*.36;
  pixels[i+1]=pixels[i+1]*.53*ambient+green*spill*.93;
  pixels[i+2]=pixels[i+2]*.69*ambient+blue*spill*.78;
 }
 function shadeSurface(ctx,lightField,left=0,top=0){
  const {width,height}=ctx.canvas;
  const image=ctx.getImageData(0,0,width,height),pixels=image.data;
  const lightPixels=lightField.data;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4;
   if(!pixels[i+3])continue;
   const j=lightIndex(lightField,x+left,y+top);
   if(j<0)shadePixel(pixels,i,0,0,0,0);
   else shadePixel(pixels,i,lightPixels[j+3]/255,lightPixels[j],lightPixels[j+1],lightPixels[j+2]);
  }
  ctx.putImageData(image,0,0);
 }
 function shadeProp(p,lightField){
  const [sx,sy,sw,sh]=rects[p.id];
  const canvas=document.createElement('canvas');
  canvas.width=p.width;canvas.height=Math.round(p.width*sh/sw);
  p.left=Math.round(p.cx-canvas.width/2);p.top=Math.round(p.foot-canvas.height);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.drawImage(IMG.lvProps,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  shadeSurface(ctx,lightField,p.left,p.top);
  p.lit=canvas;
 }
 function placeLanterns(m,items){
  if(!lanternReady())return [];
  const reserved=new Set([...m.def.road,...items.map(it=>[it.x,it.y])].map(tile=>tile.join(',')));
  return lanternTiles.filter(([x,y])=>m.grid[y][x].t==='flat'&&m.grid[y][x].walk&&!reserved.has(x+','+y))
   .map(([x,y],i)=>({x:(x+.5)*T,y:(y+.6)*T,flip:i%2===1}));
 }
 function drawLantern(ctx,{x,y,flip}){
  ctx.save();ctx.globalCompositeOperation='source-atop';
  glow(ctx,{x:x+(flip?-12:12),y:y-32,radius:lanternHaloRadius,strength:.28},'51,171,255');
  ctx.restore();
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='rgba(9,15,28,.5)';ctx.beginPath();ctx.ellipse(0,1,11,4,0,0,Math.PI*2);ctx.fill();
  if(flip)ctx.scale(-1,1);
  ctx.drawImage(IMG.lvLantern,-16,-51,39,51);
  ctx.restore();
 }
 function paintReflections(m,lights){
  const canvas=document.createElement('canvas');canvas.width=m.w*T;canvas.height=m.h*T;
  const ctx=canvas.getContext('2d');ctx.save();ctx.beginPath();
  for(const [y,row] of m.grid.entries())for(const [x,cell] of row.entries()){
   if(cell.t==='water')ctx.rect(x*T,y*T,T,T);
  }
  ctx.clip();
  for(const [i,light] of lights.entries()){
   if(!light.crystal)continue;
   const {x,y,radius,strength}=light;
   ctx.save();ctx.translate(x,y);ctx.scale(.46,1);
   glow(ctx,{x:0,y:0,radius:radius*.9,strength:strength*.40},'10,130,197');
   ctx.restore();
   const rows=Math.round(radius/5);
   for(let j=-rows;j<=rows;j++){
    const falloff=(1-Math.abs(j)/(rows+1))**1.5;
    const width=falloff*(9+folHash('reflection:'+i+','+j)%29);
    ctx.fillStyle=`rgba(55,194,235,${strength*falloff*.58})`;
    ctx.fillRect(Math.round(x-width/2+Math.sin(j*2+i)*5),Math.round(y+j*5),Math.round(width),j%3===0?2:1);
   }
  }
  ctx.restore();return canvas;
 }
 buildMap=function(def){
  if(!API.enabled||FOL_CH!=='V'||!FOL_OVER||!readyArt())return native.build(def);
  const previousBlit=folBlit,oldLo=IMG['tm'+def.lo],oldHi=IMG['tm'+def.hi],oldDress=FOL_DRESS[def.name],items=[];
  // Remove wooden placements before the native build so their collision footprints disappear too.
  const cleanDef={...def,sea:'#060e19',t:platformTerrain,d:def.d.map(row=>row.replace(/[HC]/g,' '))};
  FOL_DRESS[def.name]=(oldDress||[]).filter(it=>!woodenScenery(it[0]));
  folBlit=function(ctx,it,frame){if(ctx!==g){items.push(it);return true;}return previousBlit(ctx,it,frame);};
  IMG['tm'+def.lo]=IMG.lvTerrain;IMG['tm'+def.hi]=IMG.lvTerrain;
  let m;
  try{m=native.build(cleanDef);}finally{
   folBlit=previousBlit;IMG['tm'+def.lo]=oldLo;IMG['tm'+def.hi]=oldHi;
   if(oldDress===undefined)delete FOL_DRESS[def.name];else FOL_DRESS[def.name]=oldDress;
  }
  // The converted atlas uses native cell semantics. Keep buildMap's rim and
  // left/right two-tile ramp decisions; the former cap redraw duplicated ramps.
  const ctx=m.canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const lights=[],lanterns=placeLanterns(m,items);
  let count=0;
  for(const it of items){
   const p=appearance(it);
   if(!p)continue;
   props.set(it,p);count++;
   if(p.id<=2)lights.push(crystalLight(p));
  }
  for(const lantern of lanterns)lights.push({x:lantern.x+(lantern.flip?-9:9),y:lantern.y-7,radius:lanternLightRadius,strength:.53});
  const lightField=makeLightField(m.canvas,lights);
  shadeSurface(ctx,lightField);
  for(const it of items){
   const p=props.get(it);
   if(p&&p.id>2)shadeProp(p,lightField);
   drawProp(ctx,it);
  }
  for(const lantern of lanterns)drawLantern(ctx,lantern);
  maps.set(m,{props:count,lights,lanterns,lightField,
   reflections:paintReflections(m,lights),roads:readyRoadArt()?(def.road?.length||0):0});return m;
 };
 drawWater=function(m,V){
  if(!active(m))return native.water(m,V);
  const old=foamOn;
  g.save();g.globalAlpha*=.50;
  try{if(reduced.matches)foamOn=false;native.water(m,V);}finally{foamOn=old;g.restore();}
  g.drawImage(maps.get(m).reflections,0,0);
 };
 API.actorLight=(x,y)=>{
  if(!active(over))return;
  const {lights,lightField}=maps.get(over);
  const i=lightIndex(lightField,x,y),pixels=lightField.data;
  const strength=i<0?0:pixels[i+3]/255;
  let strongest=0,dx=0,dy=0;
  for(const light of lights){
   const offsetX=light.x-x,offsetY=light.y-y;
   const local=Math.max(0,1-Math.hypot(offsetX,offsetY)/light.radius)*light.strength;
   if(local<=strongest)continue;
   strongest=local;dx=offsetX;dy=offsetY;
  }
  const horizontal=Math.abs(dx)>=Math.abs(dy);
  return {strength,red:pixels[i]||0,green:pixels[i+1]||0,blue:pixels[i+2]||0,
   x:horizontal?Math.sign(dx):0,y:horizontal?0:Math.sign(dy)};
 };
 API.litActor=(key,source,x,y,flip)=>{
  if(!actorKeys.has(key)||source.naturalWidth<2)return;
  const light=API.actorLight(x,y);
  if(!light)return;
  const step=Math.round(light.strength*24),dirX=flip?-light.x:light.x,dirY=light.y;
  const [lightRed,lightGreen,lightBlue]=[light.red,light.green,light.blue].map(value=>Math.round(value/16)*16);
  const cacheKey=step?[step,lightRed,lightGreen,lightBlue,dirX,dirY].join(','):'ambient';
  if(!actorTints.has(source))actorTints.set(source,new Map());
  const variants=actorTints.get(source);
  if(variants.has(cacheKey))return variants.get(cacheKey);
  const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
  const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
  const {width,height}=canvas,frameSize=SHEET[key].fs;
  const image=ctx.getImageData(0,0,width,height),pixels=image.data,spill=step/24;
  // Grade the whole body like the scenery, then add reflected light to the metal rim.
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
   const i=(py*width+px)*4;
   if(!pixels[i+3])continue;
   const red=pixels[i],green=pixels[i+1],blue=pixels[i+2],luma=red*.213+green*.715+blue*.072;
   if(green>red*1.18&&green>blue*1.35&&green<155){
    // The sprite sheet includes a ground shadow, which stays slate under blue light.
    pixels[i]=luma*.24;pixels[i+1]=luma*.32;pixels[i+2]=luma*.50;
    continue;
   }
   shadePixel(pixels,i,spill,lightRed,lightGreen,lightBlue);
   if(!step)continue;
   const localX=px%frameSize;
   const facing=Math.max(.13,Math.min(1,.49+(dirX*(localX-frameSize*.5)+dirY*(py-frameSize*.43))/54));
   const edgeX=localX+dirX*4,edgeY=py+dirY*4;
   const rim=edgeX<0||edgeX>=frameSize||edgeY<0||edgeY>=height?1:
    1-pixels[((edgeY*width+px+dirX*4)*4)+3]/255;
   const metal=1-Math.min(1,(Math.max(red,green,blue)-Math.min(red,green,blue))/65);
   const highlight=spill*facing*Math.min(1,luma/100)*metal*(.14+rim*.7);
   pixels[i]+=lightRed*highlight*.22;
   pixels[i+1]+=lightGreen*highlight*.57;
   pixels[i+2]+=lightBlue*highlight*.63;
  }
  ctx.putImageData(image,0,0);
  // Keep only the recent combinations as the player crosses overlapping light pools.
  if(variants.size>=24)variants.delete(variants.keys().next().value);
  variants.set(cacheKey,canvas);
  return canvas;
 };
 drawSky=function(m){if(!active(m))return native.sky(m);};
 minimap=function(m){
  if(!active(m))return native.minimap(m);
  const scale=4,w=m.w*scale,h=m.h*scale,ox=VW-14-w,oy=VH-14-h;
  g.fillStyle='rgba(10,16,20,.72)';g.fillRect(ox-5,oy-5,w+10,h+10);
  g.strokeStyle='rgba(240,195,74,.55)';g.strokeRect(ox-4.5,oy-4.5,w+9,h+9);
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=m.grid[y][x];g.fillStyle=c.t==='water'?'#131c26':c.t==='cliff'?'#344354':c.t==='elevated'?'#53677c':'#465770';g.fillRect(ox+x*scale,oy+y*scale,scale,scale);}
  g.fillStyle=readyRoadArt()?'#6e757f':'#887965';for(const [x,y]of m.def.road)g.fillRect(ox+x*scale,oy+y*scale,scale,scale);
  NODES().forEach((n,i)=>{g.fillStyle=i===9?'#b03a30':i<PR().cleared?'#68b250':i<PRU()?'#5f9fe0':'#2a3440';g.beginPath();g.arc(ox+n[0]*scale+2,oy+n[1]*scale+2,i===9?4:3,0,7);g.fill();});
  const post=POST();if(post){g.fillStyle='#c9963f';g.fillRect(ox+post[0]*scale,oy+post[1]*scale,scale+1,scale+1);}
  g.fillStyle='#fff';g.beginPath();g.arc(ox+P.x/T*scale,oy+P.y/T*scale,3,0,7);g.fill();
 };
 API.snapshot=()=>({active:active(over),assetsReady:readyArt(),props:maps.get(over)?.props||0,
  approvedRamps:'ChapterI-texture/Moonlit',terrain:'assets/biomes/lamplit-vaults/terrain.png',
  textureReference:'Chapter I fine pixel clusters; reduced bright marks',
  terrainSource:'Assets/Terrain/Tileset/NewThemes/DarkOptions/Tilemap_dark_moonlit.png',
  waterStyle:'original',
  roadAtlas:'assets/biomes/lamplit-vaults/roads.png',roadTiles:maps.get(over)?.roads||0,
  woodenScenery:false,blueLanterns:maps.get(over)?.lanterns.length||0,lanternLightRadius,
  animated:active(over)&&!reduced.matches,platformShapes:6});
 if(location.hash==='#lamplit-vaults'){
  const boot=setInterval(()=>{if(!ready||loaded<total)return;clearInterval(boot);enterChapter(4);S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;},60);
 }
})();
