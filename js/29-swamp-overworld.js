/* Chapter III overworld: supplied swamp terrain and scenery on the native map. */
(() => {
 'use strict';
 const native={build:buildMap,skin:frameSkin,blit:folBlit,road:drawMapRoadAtlas},maps=new WeakSet();
 const houseKeys=['swampHouse1','swampHouse2'];
 const buildingKeys={S:'swampTower',C:'swampCastle'};
 const sagePineKey='tree2@swamp-sage';
 const buildingArt={
  swampHouse1:{left:8,top:63,visibleWidth:112,groundY:176,shadowRows:38,fitWidth:140,insetY:18},
  swampHouse2:{left:8,top:44,visibleWidth:112,groundY:176,shadowRows:42,fitWidth:144,insetY:24},
  swampTower:{left:8,top:38,visibleWidth:112,groundY:240,shadowRows:58,fitWidth:148,insetY:16},
  swampCastle:{left:39,top:16,visibleWidth:242,groundY:240,shadowRows:64,fitWidth:384,insetY:10}
 };
 const plantedBuildings=new WeakMap();
 const buildingShadows=new WeakMap();
 const litSurfaces=new WeakMap();
 const litActors=new WeakMap();
 const actorKeys=new Set(['arIdle','arRun','arShoot','fletchIdle']);
 let buildingBake=null;
 const API=window.SwampOverworld={enabled:true};
 API.sizeBuilding=it=>{
  const key=buildingBake?.slots.get(it.x+','+it.y);
  const image=IMG[key];
  if(!image?.complete||image.naturalWidth<=1)return;
  const art=buildingArt[key];
  const scale=art.fitWidth/art.visibleWidth;
  const left=Math.round(art.left*scale),top=Math.round(art.top*scale);
  const bottom=Math.round(art.groundY*scale);
  it.sp=[Math.round(image.naturalWidth*scale),Math.round(image.naturalHeight*scale),1,0,left,top,art.fitWidth,bottom-top];
  it.px=Math.round((it.x+.5)*T-art.fitWidth/2)-left;
  it.foot=(it.y+1)*T-art.insetY;
  it.py=it.foot-bottom;
  plantedBuildings.set(it,key);
 };
 const readyArt=()=>IMG.swampTerrain?.complete&&IMG.swampTerrain.naturalWidth===576&&IMG.swampTerrain.naturalHeight===384;
 function smooth(value,low,high){
  const t=Math.max(0,Math.min(1,(value-low)/(high-low)));
  return t*t*(3-2*t);
 }
 const isLitMap=map=>API.enabled&&S.scene==='over'&&S.chapter===2&&map===over&&maps.has(map)&&map.def.name==='the-blighted-span';
 API.litActor=(key,source)=>{
  if(!actorKeys.has(key)||!isLitMap(over)||source.naturalWidth<2)return source;
  if(!litActors.has(source)){
   const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
   const ctx=canvas.getContext('2d');
   // Keep the sprite's ink and equipment colors readable in amber light.
   ctx.filter='brightness(.88) saturate(.90) sepia(.24)';
   ctx.drawImage(source,0,0);
   litActors.set(source,canvas);
  }
  return litActors.get(source);
 };
 function amberSurface(map,source){
  const {width,height}=source,step=12,stride=Math.ceil(width/step)+1,rows=Math.ceil(height/step)+1;
  const light=new Float32Array(stride*rows);
  const keep=map.stand.find(it=>it.k==='castle');
  const roofX=keep?(keep.x+.5)*T-76:0,roofY=keep?keep.foot-238:0;
  for(let j=0;j<rows;j++)for(let i=0;i<stride;i++){
   const x=i*step,y=j*step;
   const roofDistance=((x-roofX)/163)**2+((y-roofY)/174)**2;
   const roof=keep?Math.max(0,1-roofDistance)**2*.91:0;
   light[j*stride+i]=Math.min(1,.20+roof);
  }
  const image=source.getContext('2d').getImageData(0,0,width,height),pixels=image.data;
  for(let y=0;y<height;y++){
   const row=Math.floor(y/step)*stride,fy=(y%step)/step;
   for(let x=0;x<width;x++){
    const k=(y*width+x)*4;
    if(!pixels[k+3])continue;
    const i=row+Math.floor(x/step),fx=(x%step)/step;
    const top=light[i]*(1-fx)+light[i+1]*fx,bottom=light[i+stride]*(1-fx)+light[i+stride+1]*fx;
    const r=pixels[k],g=pixels[k+1],b=pixels[k+2],luma=r*.2126+g*.7152+b*.0722;
    const moss=smooth(Math.min(r,g)-b,8,53),detail=smooth(luma,15,130);
    const strength=(top*(1-fy)+bottom*fy)*detail*(.54+.46*moss);
    const shade=.61+.24*smooth(luma,28,170);
    // Light the existing pixels, keeping their silhouettes, texture, and dark ink.
    pixels[k]=r*shade+8*moss*detail+strength*(78+r*.15);
    pixels[k+1]=g*shade+strength*(44+g*.12);
    pixels[k+2]=b*(shade+.06)-4*moss*detail+strength*7;
   }
  }
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  canvas.getContext('2d').putImageData(image,0,0);
  return canvas;
 }
 API.litTerrain=(map,source)=>{
  if(!isLitMap(map))return source;
  if(!litSurfaces.has(source))litSurfaces.set(source,amberSurface(map,source));
  return litSurfaces.get(source);
 };
 function getBuildingSlots(def){
  const slots=new Map();
  let house=0;
  for(const [y,row] of def.d.entries()){
   for(let x=0;x<row.length;x++){
    const marker=row[x];
    const key=marker==='H'?houseKeys[house++%houseKeys.length]:buildingKeys[marker];
    if(key)slots.set(x+','+y,key);
   }
  }
  return slots;
 }
 function getBuildingShadow(image,art){
  const cached=buildingShadows.get(image);
  if(cached)return cached;
  const footing=document.createElement('canvas');
  footing.width=image.naturalWidth;footing.height=art.shadowRows;
  const mask=footing.getContext('2d');
  const top=art.groundY-footing.height;
  mask.drawImage(image,0,top,footing.width,footing.height,0,0,footing.width,footing.height);
  const pixels=mask.getImageData(0,0,footing.width,footing.height);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
  mask.putImageData(pixels,0,0);

  const margin=4,drop=8;
  const stamp=document.createElement('canvas');
  stamp.width=footing.width+margin*2;stamp.height=footing.height+drop;
  const shade=stamp.getContext('2d');
  for(const [dx,dy] of [[-3,3],[3,3],[-4,5],[0,5],[4,5],[-2,8],[2,8]]){
   shade.drawImage(footing,margin+dx,dy);
  }
  // Chapter I's sprites use a single translucent ink for the whole footprint.
  shade.globalCompositeOperation='source-in';
  shade.fillStyle=`rgba(22,28,46,${69/255})`;
  shade.fillRect(0,0,stamp.width,stamp.height);
  const shadow={stamp,left:-margin,top};
  buildingShadows.set(image,shadow);
  return shadow;
 }
 function drawBuildingShadow(ctx,it,image,art,x,y,width,height){
  const {stamp,left,top}=getBuildingShadow(image,art);
  const sx=width/image.naturalWidth,sy=height/image.naturalHeight;
  const dx=x+Math.round(left*sx),dy=y+Math.round(top*sy);
  const dw=Math.round(stamp.width*sx),dh=Math.round(stamp.height*sy);
  const tiles=buildingBake.tiles;
  const raised=tiles[it.y][it.x]==='#';
  const surface=new Path2D();
  for(let ty=Math.floor(dy/T);ty<=Math.floor((dy+dh-1)/T);ty++){
   for(let tx=Math.floor(dx/T);tx<=Math.floor((dx+dw-1)/T);tx++){
    const tile=tiles[ty]?.[tx];
    const supportsShadow=raised?tile==='#':tile==='.'||tile==='%';
    if(supportsShadow)surface.rect(tx*T,ty*T,T,T);
   }
  }
  // Shade the receiving terrain, keeping the shoreline alpha and cliff faces intact.
  ctx.save();
  ctx.clip(surface);
  ctx.globalCompositeOperation='source-atop';
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(stamp,dx,dy,dw,dh);
  ctx.restore();
 }
 folBlit=function(ctx,it,frame){
  if(buildingBake?.map==='the-blighted-span'&&it.x===4&&it.y===11&&it.key==='tree2@blight'){
   const sage=IMG.swampSagePine;
   if(sage?.complete&&sage.naturalWidth===it.sp[0]&&sage.naturalHeight===it.sp[1]){
    FOL_CACHE[sagePineKey]=sage;
    it.key=sagePineKey;
   }
  }
  if(it.key===sagePineKey){if(FOL_CACHE[sagePineKey]!==IMG.swampSagePine)useSagePine();return native.blit(ctx,it,0);}
  const key=plantedBuildings.get(it);
  if(!key)return native.blit(ctx,it,frame);
  const image=IMG[key], [width,height]=it.sp;
  if(buildingBake)drawBuildingShadow(ctx,it,image,buildingArt[key],it.px,it.py,width,height);
  ctx.drawImage(image,it.px,it.py,width,height);
  return true;
 };
 function withAtlas(def,callback){
  const lo=IMG['tm'+def.lo],hi=IMG['tm'+def.hi];
  IMG['tm'+def.lo]=IMG.swampTerrain;IMG['tm'+def.hi]=IMG.swampTerrain;
  try{return callback();}finally{IMG['tm'+def.lo]=lo;IMG['tm'+def.hi]=hi;}
 }
 drawMapRoadAtlas=function(ctx,def){
  const road=IMG.swampRoad;
  if(!API.enabled||FOL_CH!=='III'||!FOL_OVER||def.name!=='the-blighted-span'
    ||!road?.complete||road.naturalWidth!==4*T||road.naturalHeight!==4*T)return native.road(ctx,def);
  const on=new Set(def.road.map(([x,y])=>x+','+y));
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const [x,y] of def.road){
   const mask=(on.has(x+','+(y-1))?1:0)|(on.has((x+1)+','+y)?2:0)
    |(on.has(x+','+(y+1))?4:0)|(on.has((x-1)+','+y)?8:0);
   ctx.drawImage(road,(mask%4)*T,Math.floor(mask/4)*T,T,T,x*T,y*T,T,T);
  }
  ctx.restore();return true;
 };
 /* Chapter III stages (Keyward Environment 01) use the same swamp atlas as the overworld. Matched by
    name so the poison fog's clean copy of a stage floor (built from the same def) matches too. */
 const isSwampStage=def=>/^s3_\d+$/.test(def?.name||'');
 const useSagePine=()=>{
  const sage=IMG.swampSagePine,spec=DSPEC.tree2;
  if(sage?.complete&&spec&&sage.naturalWidth===spec[0]&&sage.naturalHeight===spec[1])FOL_CACHE[sagePineKey]=sage;
 };
 buildMap=function(def){
  if(API.enabled&&FOL_CH==='III'&&!FOL_OVER&&isSwampStage(def)&&readyArt()){useSagePine();return withAtlas(def,()=>native.build(def));}
  if(!API.enabled||FOL_CH!=='III'||!FOL_OVER)return native.build(def);
  buildingBake={map:def.name,slots:getBuildingSlots(def),tiles:def.t};
  try{
   if(!readyArt())return native.build(def);
   const map=withAtlas(def,()=>native.build(def));maps.add(map);
   if(def.name==='the-blighted-span')map.def={...map.def,sea:'#183934'};
   return map;
  }finally{buildingBake=null;}
 };
 frameSkin=function(){
  if(!API.enabled||!over||!maps.has(over)||!readyArt())return native.skin();
  const key='swamp:'+over.def.lo;
  skinFor=skinFor===key?over.def.lo:-1;
  try{return withAtlas(over.def,()=>native.skin());}finally{skinFor=key;}
 };
 API.snapshot=()=>({active:API.enabled&&S.scene==='over'&&S.chapter===2&&maps.has(over),ready:!!readyArt(),
  terrain:'assets/biomes/swamp-overworld/terrain.png',source:'Assets/Terrain/Tileset/NewThemes/Tilemap_swamp.png',
  grid:[9,6],tileSize:64,cached:true});
 if(location.hash==='#swamp-overworld'){
  const boot=setInterval(()=>{if(!ready||loaded<total)return;clearInterval(boot);enterChapter(2);S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;},60);
 }
})();
