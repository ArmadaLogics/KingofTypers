/* Chapter V overworld: subdued Chapter I texture, moonlit colors and fungi. */
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
 const pineKey='tree1@lamplit-moonlit';
 const pineTiles=[[7,8],[33,9],[15,17]];
 const pineReady=()=>IMG.lvPine?.complete&&IMG.lvPine.naturalWidth===1536&&IMG.lvPine.naturalHeight===256;
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
 const rockVariant=(x,y)=>(x*13+y*7)%5;
 // Some authored rock slots render mushrooms. Keep those slots.
 const mushroomSlot=(x,y)=>[1,2].includes(rockVariant(x,y));
 const removedScenery=(key,x,y)=>{
  const base=folBase(key);
  return base==='tower'||base.startsWith('tree')||base.startsWith('wrock')||
   (base.startsWith('rock')&&!mushroomSlot(x,y));
 };
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
  const k=it.k,box=folBox(it),cx=box.x+box.w/2,foot=it.foot-4;
  if(k.startsWith('rock')){
   const id=rockVariant(it.x,it.y)===1?6:5;
   return {id,cx,foot,width:Math.round(Math.max(30,Math.min(64,box.w+4))*.65)};
  }
  if(k.startsWith('bush'))return {id:5,cx,foot,width:Math.round(Math.min(64,box.w)*.65)};
  return null;
 }
 function drawProp(ctx,it){
  const p=props.get(it);if(!p)return native.blit(ctx,it,0);
  if(p.lit)ctx.drawImage(p.lit,p.left,p.top);
  else sprite(ctx,p.id,p.cx,p.foot,p.width);
  return true;
 }
 const stageProps=new WeakSet();
 folBlit=function(ctx,it,frame){return (active(over)||API.enabled&&stageProps.has(it))&&props.has(it)?drawProp(ctx,it):native.blit(ctx,it,frame);};
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
  for(const light of lights)glow(field,light,'39,149,237');
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
 /* Chapter V stages (Keyward Environment 03) match the overworld: its moonlit atlas, its blue pines and its
    mushrooms (every rock or bush slot draws as a mushroom, as on the overworld). No crystals, stones or
    water rocks. Matched by name, like the Chapter III swamp stages. Fire bowls, darkness and words are unchanged. */
 const isVaultStage=def=>/^s5_\d+$/.test(def?.name||'');
 // A lighter grade than the overworld's: stages already sit under the chapter's darkness, so the floor
 // only shifts toward moon blue; it is never dimmed.
 function gradeStage(ctx){
  const {width,height}=ctx.canvas,image=ctx.getImageData(0,0,width,height),px=image.data;
  for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;px[i]*=.84;px[i+1]*=.92;px[i+2]=Math.min(255,px[i+2]*1.06);}
  ctx.putImageData(image,0,0);
 }
 function buildVaultStage(def){
  const previousBlit=folBlit,oldLo=IMG['tm'+def.lo],oldHi=IMG['tm'+def.hi];
  if(pineReady())FOL_CACHE[pineKey]=IMG.lvPine;
  folBlit=function(ctx,it,frame){
   if(ctx===g)return previousBlit(ctx,it,frame);
   const p=appearance(it);
   if(!p)return previousBlit(ctx,it,frame);
   props.set(it,p);stageProps.add(it);
   // Give the native collision builder the same bounds as the visible mushroom, as the overworld does.
   const [, , sw,sh]=rects[p.id],height=Math.round(p.width*sh/sw);
   it.px=Math.round(p.cx-p.width/2);it.py=Math.round(p.foot-height);
   it.sp=[p.width,height,1,0,0,0,p.width,height];
   return drawProp(ctx,it);
  };
  IMG['tm'+def.lo]=IMG.lvTerrain;IMG['tm'+def.hi]=IMG.lvTerrain;
  try{
   const m=native.build({...def,d:def.d.map(row=>row.replace(/w/g,' '))});
   gradeStage(m.canvas.getContext('2d'));
   return m;
  }finally{folBlit=previousBlit;IMG['tm'+def.lo]=oldLo;IMG['tm'+def.hi]=oldHi;}
 }
 /* Chapter V stages light with the overworld's blue lantern in place of the fire bowl (Keyward Environment 03).
    Same tiles, light radius, gutter warning and snuffing: only the lamp and the colour of its light change.
    js/01-game.js asks API.lampWash() for the colour of the glow under each lit lamp. */
 const nativeLampBowl=drawLampBowl;
 const lanternStage=()=>API.enabled&&FOL_CH==='V'&&!FOL_OVER&&isVaultStage(W?.def)&&lanternReady();
 API.lampWash=()=>lanternStage()?'51,171,255':null;
 drawLampBowl=function(L,index){
  if(!lanternStage())return nativeLampBowl(L,index);
  // Lit: lantern and halo. Guttering: the halo fades over the warning. Out: the lantern with no halo.
  const fade=L.out>0?0:L.tele>0?Math.max(.12,Math.min(1,L.tele/GUT_TELE)):1;
  const x=Math.round(L.x),y=Math.round(L.y+8);
  g.save();
  if(fade>0){g.globalCompositeOperation='lighter';glow(g,{x:x+12,y:y-32,radius:lanternHaloRadius,strength:.28*fade},'51,171,255');}
  g.globalCompositeOperation='source-over';g.imageSmoothingEnabled=false;
  g.translate(x,y);
  g.fillStyle='rgba(9,15,28,.5)';g.beginPath();g.ellipse(0,1,11,4,0,0,Math.PI*2);g.fill();
  // Always the lantern in its own colours; only its glow fades while guttering and is gone when out (user, 26 Nov).
  g.drawImage(IMG.lvLantern,-16,-51,39,51);
  g.restore();
 };
 buildMap=function(def){
  if(API.enabled&&FOL_CH==='V'&&!FOL_OVER&&isVaultStage(def)&&readyArt())return buildVaultStage(def);
  if(!API.enabled||FOL_CH!=='V'||!FOL_OVER||!readyArt())return native.build(def);
  const previousBlit=folBlit,oldLo=IMG['tm'+def.lo],oldHi=IMG['tm'+def.hi],oldDress=FOL_DRESS[def.name],items=[];
  // Filter removed scenery before collision, lighting and reflection caches are built.
  const cleanDef={...def,sea:'#060e19',t:platformTerrain,d:def.d.map((row,y)=>
   row.replace(/[HCTSwr]/g,(cell,x)=>cell==='r'&&mushroomSlot(x,y)?'r':' '))};
  FOL_DRESS[def.name]=(oldDress||[]).filter(([key,x,y])=>!woodenScenery(key)&&!removedScenery(key,x,y));
  if(pineReady()){
   // Use Chapter I's native tree1 frame, bounds and trunk collision with the blue atlas.
   FOL_CACHE[pineKey]=IMG.lvPine;
   const occupied=new Set([...def.road,...lanternTiles,...FOL_DRESS[def.name].map(([,x,y])=>[x,y])].map(tile=>tile.join(',')));
   for(const [x,y] of pineTiles){
    if(cleanDef.t[y]?.[x]==='.'&&cleanDef.t[y-1]?.[x]!=='#'&&cleanDef.d[y]?.[x]===' '&&!occupied.has(x+','+y)){
     FOL_DRESS[def.name].push([pineKey,x,y]);
    }
   }
  }
  folBlit=function(ctx,it,frame){
   if(ctx===g)return previousBlit(ctx,it,frame);
   items.push(it);
   const p=appearance(it);
   if(p){
    props.set(it,p);
    // Give the native collision builder the same bounds as the visible sprite.
    const [, , sw,sh]=rects[p.id],height=Math.round(p.width*sh/sw);
    it.px=Math.round(p.cx-p.width/2);it.py=Math.round(p.foot-height);
    it.sp=[p.width,height,1,0,0,0,p.width,height];
   }
   return true;
  };
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
  for(const lantern of lanterns)lights.push({x:lantern.x+(lantern.flip?-9:9),y:lantern.y-7,radius:lanternLightRadius,strength:.53});
  const lightField=makeLightField(m.canvas,lights);
  shadeSurface(ctx,lightField);
  for(const it of items){
   const p=props.get(it);
   if(p){shadeProp(p,lightField);count++;}
   else if(it.key===pineKey)count++;
   drawProp(ctx,it);
  }
  for(const lantern of lanterns)drawLantern(ctx,lantern);
  maps.set(m,{props:count,lights,lanterns,lightField,roads:readyRoadArt()?(def.road?.length||0):0});return m;
 };
 drawWater=function(m,V){
  if(!active(m))return native.water(m,V);
  const old=foamOn;
  g.save();g.globalAlpha*=.50;
  try{if(reduced.matches)foamOn=false;native.water(m,V);}finally{foamOn=old;g.restore();}
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
  woodenScenery:false,largeCrystals:false,crystals:false,blueLanterns:maps.get(over)?.lanterns.length||0,lanternLightRadius,
  animated:active(over)&&!reduced.matches,platformShapes:6});
 if(location.hash==='#lamplit-vaults'){
  const boot=setInterval(()=>{if(!ready||loaded<total)return;clearInterval(boot);enterChapter(4);S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;},60);
 }
})();
