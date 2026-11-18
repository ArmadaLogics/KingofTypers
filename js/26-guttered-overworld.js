/* Guttered Vaults: reviewed overworld scenery, separate from stage torch/combat rules. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),maps=new WeakMap();
  const native={build:buildMap,img:folImg,water:drawWater,minimap};
  const imageKeys={house:'gvHouse',tower:'gvTower',castle:'gvCastle',tree1:'gvTree',rock1:'gvRock1',rock2:'gvRock2',bush1:'gvBush1',bush2:'gvBush2'};
  const specs={
    house:[256,256,1,4,8,31,240,217],tower:[144,224,1,4,8,28,128,188],
    castle:[352,224,1,4,8,18,336,198],tree1:[192,256,1,11,39,51,114,190],
    rock1:[64,64,1,4,8,15,48,41],rock2:[64,64,1,4,8,31,48,25],
    bush1:[96,80,1,4,8,20,80,52],bush2:[96,80,1,4,8,11,80,61]
  };
  const API=window.GutteredVaults={enabled:true,originalTiles:null};
  const active=m=>API.enabled&&S.scene==='over'&&S.chapter===5&&!S.hub&&maps.has(m);
  // Tile, horizontal offset, inset from the south edge, and visible scale in world pixels.
  const shorePlants=[
    // West bank. Exposed roots and a pair of low plants frame the entry clearing.
    ['gvRootStump',4,5,-4,9,65],
    ['gvGrass',4,6,6,12,33],
    ['gvFern',4,13,0,15,48],
    ['gvGrass',4,14,1,26,35],
    ['gvRootRock',5,16,-8,11,67],
    ['gvFungi',6,16,-10,14,26],
    // Northern shelf. A broken root and low ferns trace the point facing the channel.
    ['gvFern',10,4,4,10,54],
    ['gvRootStump',14,3,14,11,65],
    ['gvGrass',15,3,11,17,37],
    ['gvFern',18,3,-8,14,52],
    ['gvRootRock',20,3,-12,8,67],
    ['gvRootRock',17,6,-6,12,62],
    ['gvFern',17,8,-10,21,45],
    ['gvGrass',22,8,14,19,36],
    // Eastern ledges. Leave a clear approach around the spire and the citadel.
    ['gvRootStump',29,4,-13,14,60],
    ['gvFern',30,4,-4,9,50],
    ['gvGrass',32,4,-11,14,37],
    ['gvFern',35,5,10,18,48],
    ['gvRootRock',36,13,2,13,66],
    ['gvFungi',36,14,-6,34,28],
    ['gvFern',34,17,-8,14,49],
    ['gvGrass',35,17,-2,9,38],
    ['gvRootStump',36,17,-2,9,59],
    // Pool and southern ledge. Leave the pine silhouettes and the middle bank open.
    ['gvFern',17,18,10,15,46],
    ['gvGrass',18,18,10,11,35],
    ['gvRootRock',19,19,8,14,65],
    ['gvFungi',20,19,8,20,28],
    ['gvRootStump',11,19,10,13,65],
    ['gvGrass',12,19,15,13,35],
    ['gvFern',25,18,1,12,52],
    ['gvGrass',26,18,-3,14,35],
  ];
  let prepared=null;
  function prepare(){
    if(prepared)return prepared;
    const required=['gvTerrain','gvTrail',...Object.values(imageKeys),'gvGrass','gvFern','gvMoss','gvFungi','gvRootRock','gvRootStump'];
    if(required.some(k=>!IMG[k]?.complete||IMG[k].naturalWidth<8))return null;
    const foam=document.createElement('canvas');foam.width=IMG.foam.width;foam.height=IMG.foam.height;
    const f=foam.getContext('2d');f.drawImage(IMG.foam,0,0);f.globalCompositeOperation='source-in';f.fillStyle='#214957';f.fillRect(0,0,foam.width,foam.height);foam.complete=true;
    const stillFoam=document.createElement('canvas');stillFoam.width=foam.width;stillFoam.height=foam.height;
    const sf=stillFoam.getContext('2d');for(let frame=0;frame<16;frame++)sf.drawImage(foam,0,0,192,192,frame*192,0,192,192);stillFoam.complete=true;
    return prepared={foam,stillFoam};
  }
  folImg=function(key){return key.endsWith('@vault')?IMG[imageKeys[folBase(key)]]||native.img(key):native.img(key);};
  function authoredMap(def){
    const t=def.t.map(row=>[...row]),d=def.d.map(row=>[...row]);
    // Only the reviewed castle shelf is levelled; no island or route cell is relocated.
    for(let y=12;y<=14;y++)for(let x=30;x<=33;x++)if(t[y]?.[x]&&t[y][x]!=='~')t[y][x]='.';
    for(const row of d)for(let x=0;x<row.length;x++)if(row[x]==='H')row[x]=' ';
    d[17][11]='H';
    for(const [x,y]of [[5,7],[16,17],[34,8],[22,18]]){
      if(t[y]?.[x]!=='.'||d[y][x]!==' ')continue;
      if(def.road.some(p=>Math.hypot(p[0]-x,p[1]-y)<1.7))continue;
      d[y][x]='T';
    }
    // Give authored trees and buildings clearance from their nearest overlapping props.
    for(const [x,y,tx,ty] of [[9,5,9,6],[35,8,36,9],[10,13,11,13],[15,16,14,17],[16,16,16,19]]){
      const mark=d[y][x];
      if((mark==='r'||mark==='b')&&d[ty][tx]===' '&&'.#'.includes(t[ty][tx])){
        d[y][x]=' ';
        d[ty][tx]=mark;
      }
    }
    return {...def,t:t.map(row=>row.join('')),d:d.map(row=>row.join(''))};
  }
  function footingShadow(source,width,height,bottom,depth,drop){
    const top=bottom-depth;
    const footing=document.createElement('canvas');
    footing.width=width;footing.height=depth;
    const mask=footing.getContext('2d');
    mask.imageSmoothingEnabled=false;
    mask.drawImage(source,0,-top,width,height);
    const pixels=mask.getImageData(0,0,width,depth);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
    mask.putImageData(pixels,0,0);

    const margin=drop/2,stamp=document.createElement('canvas');
    stamp.width=width+2*margin;stamp.height=depth+drop;
    const shade=stamp.getContext('2d');
    // Blighted Span offsets the foundation silhouette and uses Green March's shadow ink.
    for(const [dx,dy] of [[-3,3],[3,3],[-4,5],[0,5],[4,5],[-2,8],[2,8]]){
      shade.drawImage(footing,margin+Math.round(dx*drop/8),Math.round(dy*drop/8));
    }
    shade.globalCompositeOperation='source-in';
    shade.fillStyle='rgba(22,28,46,0.27)';
    shade.fillRect(0,0,stamp.width,stamp.height);
    return {stamp,margin,top};
  }
  API.footingShadow=footingShadow;

  function paintFoliageShadow(ctx,map,shadow,x,y,level,flip=false){
    const {stamp,margin,top}=shadow;
    const left=x-margin,upper=y+top;
    const surface=new Path2D();
    for(let row=Math.floor(upper/T);row<=Math.floor((upper+stamp.height-1)/T);row++){
      for(let col=Math.floor(left/T);col<=Math.floor((left+stamp.width-1)/T);col++){
        const cell=map.grid[row]?.[col];
        if(cell?.level===level&&(cell.t==='flat'||cell.t==='elevated'))surface.rect(col*T,row*T,T,T);
      }
    }
    ctx.save();
    ctx.clip(surface);
    ctx.globalCompositeOperation='source-atop';
    if(flip){ctx.translate(left+stamp.width,0);ctx.scale(-1,1);}
    ctx.drawImage(stamp,flip?0:left,upper);
    ctx.restore();
  }
  function groundLighting(ctx,it,radius,color,alpha){
    if(!it)return;const x=it.x*T+T/2,y=it.foot+9;
    ctx.save();ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(x,y,0,x,y,radius);glow.addColorStop(0,`rgba(${color},${alpha})`);glow.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();
  }
  function decorate(m,items){
    const ctx=m.canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const road=new Set(m.def.road.map(n=>n.join(','))),nearRoad=(x,y,gap=1.2)=>m.def.road.some(p=>Math.hypot(p[0]-x,p[1]-y)<gap);
    const roadSafe=(x,y)=>NODES().every(p=>Math.hypot(p[0]-x,p[1]-y)>1.6)&&!nearRoad(x,y);
    for(const [x,y]of m.def.road){
      let mask=0;if(road.has(x+','+(y-1)))mask|=1;if(road.has((x+1)+','+y))mask|=2;if(road.has(x+','+(y+1)))mask|=4;if(road.has((x-1)+','+y))mask|=8;
      ctx.drawImage(IMG.gvTrail,mask%4*T,Math.floor(mask/4)*T,T,T,x*T,y*T,T,T);
    }
    const house=m.stand.find(it=>it.k==='house'),castle=m.stand.find(it=>it.k==='castle');
    groundLighting(ctx,house,100,'207,116,49',.18);groundLighting(ctx,castle,100,'204,105,42',.13);
    for(const it of m.stand.filter(it=>it.k==='tower'))groundLighting(ctx,it,64,'204,105,42',.12);
    const plantShadows=new Map();
    function plantShadow(source,width,height,bottom,depth,drop){
      if(!plantShadows.has(source))plantShadows.set(source,footingShadow(source,width,height,bottom,depth,drop));
      return plantShadows.get(source);
    }
    for(const it of items){
      const tree=it.k==='tree1',bush=it.k==='bush1'||it.k==='bush2';
      if(!it.key.endsWith('@vault')||(!tree&&!bush))continue;
      const [width,height,,,,top,,bodyHeight]=it.sp;
      const shadow=plantShadow(folImg(it.key),width,height,top+bodyHeight,tree?18:12,tree?6:4);
      paintFoliageShadow(ctx,m,shadow,it.px,it.py,m.grid[it.y][it.x].level,it.flip);
    }
    // Repaint native props above the trail and lights, so the road never lies over a sprite.
    for(const it of items)folBlit(ctx,it,0);
    const land=(x,y)=>m.def.t[y]?.[x]&&m.def.t[y][x]!=='~';
    const occupied=items.map(folBox);
    const ramps=[];
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      if(m.grid[y][x].t==='stair')ramps.push([x,y]);
    }
    let props=items.length;
    for(const [key,x,y,offset,inset,width] of shorePlants){
      const cell=m.grid[y]?.[x];
      if(!cell?.walk||cell.t!=='flat'||!roadSafe(x,y)||ramps.some(([rx,ry])=>Math.hypot(rx-x,ry-y)<1.5))continue;
      const im=IMG[key],height=Math.round(width*im.height/im.width);
      const left=Math.round((x+.5)*T+offset-width/2),foot=(y+1)*T-inset,top=foot-height;
      const supported=[left+width*.18,left+width*.82].every(px=>{
        const support=m.grid[Math.floor((foot-5)/T)]?.[Math.floor(px/T)];
        return support?.t==='flat'&&support.walk;
      });
      if(!supported||occupied.some(b=>left<b.x+b.w+8&&left+width+8>b.x&&top<b.y+b.h+8&&foot+8>b.y))continue;
      if(key.startsWith('gvRoot')){
        ctx.drawImage(IMG.gvMoss,left+Math.round(width*.12),foot-18,Math.round(width*.76),18);
      }
      const bottom=height-Math.round(10*width/im.width);
      const shadow=plantShadow(im,width,height,bottom,Math.min(12,bottom),4);
      paintFoliageShadow(ctx,m,shadow,left,top,cell.level);
      ctx.drawImage(im,left,top,width,height);
      occupied.push({x:left,y:top,w:width,h:height});
      props++;
    }
    // A short cliff skirt sits in water, behind the original shoreline alpha. It never changes collision.
    const composite=document.createElement('canvas');composite.width=m.canvas.width;composite.height=m.canvas.height;
    const c=composite.getContext('2d');c.imageSmoothingEnabled=false;
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(land(x,y)&&!land(x,y+1)){
      const left=land(x-1,y)&&!land(x-1,y+1),right=land(x+1,y)&&!land(x+1,y+1),col=left&&right?6:right?5:left?7:8;
      c.drawImage(IMG.gvTerrain,col*T,5*T,T,T,x*T,(y+1)*T-5,T,34);
    }
    c.drawImage(m.canvas,0,0);
    c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,18,30,.14)';c.fillRect(0,0,composite.width,composite.height);c.restore();m.canvas=composite;
    return {house,castle,props,trees:items.filter(it=>it.k.startsWith('tree')).length};
  }
  buildMap=function(def){
    if(!API.enabled||FOL_CH!=='VI'||!FOL_OVER||!prepare())return native.build(def);
    const authored=authoredMap(def),oldKit=FOL_KIT.VI,oldAtlas=IMG.tm3,oldSpecs={},oldBlit=folBlit,items=[];
    for(const [key,spec]of Object.entries({...specs,...window.GutteredStructures?.specs})){oldSpecs[key]=DSPEC[key];DSPEC[key]=spec;}
    FOL_KIT.VI={...oldKit,H:['house@vault'],C:['castle@vault'],S:['tower@vault'],T:['tree1@vault'],r:['rock1@vault','rock2@vault'],b:['bush1@vault','bush2@vault']};
    IMG.tm3=IMG.gvTerrain;
    // Capture the native prop list while it creates the authoritative collision map.
    folBlit=function(ctx,it,frame){if(ctx!==g)items.push(it);return oldBlit(ctx,it,frame);};
    let m;
    try{m=native.build({...authored,road:[]});}
    finally{FOL_KIT.VI=oldKit;IMG.tm3=oldAtlas;folBlit=oldBlit;for(const [key,spec]of Object.entries(oldSpecs))DSPEC[key]=spec;}
    m.def=authored;API.originalTiles=def.t.slice();
    const data=decorate(m,items);maps.set(m,data);return m;
  };
  drawWater=function(m,V){
    if(!active(m))return native.water(m,V);
    const art=prepare(),previous=IMG.foam;
    try{IMG.foam=reduced.matches?art.stillFoam:art.foam;return native.water(m,V);}
    finally{IMG.foam=previous;}
  };
  const ambient = [.63,.80,1.04];
  const bounce = [.46,.94,1.23];
  // Elliptical moonlight over the channel, with spill on the west approach and vault.
  const lights = [
    {x:20.4,y:9.7,rx:8.7,ry:15.5,angle:-.31,strength:1.04},
    {x:25,y:13,rx:12,ry:4.8,angle:-.29,strength:.40},
    {x:32.3,y:12.6,rx:6.9,ry:5,angle:.05,strength:.43},
    {x:7.5,y:9,rx:8.4,ry:6.2,angle:.21,strength:.19},
  ].map(light => ({...light, cos:Math.cos(light.angle), sin:Math.sin(light.angle)}));
  const mistBanks = [
    [10.4,5.0,5.3,.82,-.11,.11],
    [17.3,6.4,4.6,.58,.32,.11],
    [18.9,9.9,4.1,.64,.38,.14],
    [24.5,8.2,3.6,.68,-.40,.13],
    [25.3,10.1,3.6,.54,-.18,.08],
    [19.3,14.7,4.1,.55,-.22,.12],
    [27.9,17.9,4.9,.66,-.19,.11],
    [32.7,11.9,3.9,.48,-.14,.11],
    [34.5,15.9,4.4,.66,.14,.08],
  ];

  function lightAt(x,y){
    let total = 0;
    for(const light of lights){
      const dx=x-light.x, dy=y-light.y;
      const u=(dx*light.cos+dy*light.sin)/light.rx;
      const v=(-dx*light.sin+dy*light.cos)/light.ry;
      const falloff=Math.max(0,1-u*u-v*v);
      total+=light.strength*falloff*falloff;
    }
    return Math.min(1.26,total);
  }

  function tintTerrain(source){
    const lit=document.createElement("canvas");
    lit.width=source.width;
    lit.height=source.height;
    const ctx=lit.getContext("2d");
    ctx.drawImage(source,0,0);
    const frame=ctx.getImageData(0,0,lit.width,lit.height);
    const pixels=frame.data;
    const step=16;
    const stride=Math.ceil(lit.width/step)+1;
    const rows=Math.ceil(lit.height/step)+1;
    const field=new Float32Array(stride*rows);
    for(let row=0;row<rows;row++)for(let col=0;col<stride;col++){
      field[row*stride+col]=lightAt(col*step/T,row*step/T);
    }
    for(let y=0;y<lit.height;y++){
      const row=Math.floor(y/step)*stride;
      const fy=(y%step)/step;
      for(let x=0;x<lit.width;x++){
        const i=(y*lit.width+x)*4;
        if(!pixels[i+3])continue;
        const cell=row+Math.floor(x/step), fx=(x%step)/step;
        const top=field[cell]*(1-fx)+field[cell+1]*fx;
        const below=field[cell+stride]*(1-fx)+field[cell+stride+1]*fx;
        const light=top*(1-fy)+below*fy;
        const r=pixels[i], green=pixels[i+1], b=pixels[i+2];
        const luma=.213*r+.715*green+.072*b;
        const strength=light*(.69+.31*Math.min(1,luma/85));
        const vivid=Math.max(r,green,b)-Math.min(r,green,b);
        const preserve=Math.max(0,Math.min(.9,(vivid-43)/104));
        const fire=Math.max(0,Math.min(.35,(r-b-32)/170));
        for(let channel=0;channel<3;channel++){
          const base=pixels[i+channel];
          const cooled=base*ambient[channel]+luma*strength*bounce[channel];
          const flame=base*(1-fire)+luma*fire;
          pixels[i+channel]=Math.round(cooled*(1-preserve)+flame*preserve);
        }
      }
    }
    ctx.putImageData(frame,0,0);
    return lit;
  }

  function addMist(lit){
    const fog=document.createElement("canvas");
    fog.width=lit.width;
    fog.height=lit.height;
    const ctx=fog.getContext("2d");
    for(const [x,y,rx,ry,angle,strength] of mistBanks){
      ctx.save();
      ctx.translate(x*T,y*T);
      ctx.rotate(angle);
      ctx.scale(rx*T,ry*T);
      const soft=ctx.createRadialGradient(0,0,0,0,0,1);
      soft.addColorStop(0,"rgba(134,194,228,"+strength+")");
      soft.addColorStop(.46,"rgba(111,176,218,"+strength*.55+")");
      soft.addColorStop(1,"rgba(91,150,198,0)");
      ctx.fillStyle=soft;
      ctx.fillRect(-1,-1,2,2);
      ctx.restore();
    }
    ctx.globalCompositeOperation="destination-in";
    ctx.drawImage(lit,0,0);
    ctx.globalCompositeOperation="destination-over";
    ctx.drawImage(lit,0,0);
    return fog;
  }

  const actorSheets = new Set(["arIdle", "arRun", "arShoot", "fletchIdle"]);
  const actorTints = new WeakMap();

  function litActor(key,source,x,y){
    if(!actorSheets.has(key)||!source.naturalWidth||!active(over))return;
    // Quantize local light to keep a bounded sprite cache while walking.
    const step=Math.round(Math.min(1,lightAt(x/T,y/T))*5);
    let variants=actorTints.get(source);
    if(!variants){variants=new Map();actorTints.set(source,variants);}
    if(variants.has(step))return variants.get(step);

    const canvas=document.createElement("canvas");
    canvas.width=source.naturalWidth;
    canvas.height=source.naturalHeight;
    const ctx=canvas.getContext("2d");
    ctx.drawImage(source,0,0);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    const pixels=frame.data, light=step/5;
    for(let i=0;i<pixels.length;i+=4){
      if(!pixels[i+3])continue;
      const red=pixels[i],green=pixels[i+1],blue=pixels[i+2];
      const luma=.213*red+.715*green+.072*blue;
      const chroma=Math.max(red,green,blue)-Math.min(red,green,blue);
      const neutral=1-Math.min(1,chroma/90);
      const mix=.18+.10*light;
      const shine=light*(.07+.14*neutral)*luma;
      pixels[i]=(red+(luma-red)*mix)*.78+shine*.36;
      pixels[i+1]=(green+(luma-green)*mix)*.84+luma*.022+shine*.98;
      pixels[i+2]=(blue+(luma-blue)*mix)*.94+luma*.102+shine*1.42;
    }
    ctx.putImageData(frame,0,0);
    variants.set(step,canvas);
    return canvas;
  }

  const litSurfaces = new WeakMap();
  API.lightAt = (x,y) => lightAt(x/T,y/T);
  API.litActor = litActor;
  API.litTerrain = (map, surface) => {
    if (!active(map)) return;
    let layers = litSurfaces.get(surface);
    if (!layers) {
      const lit = tintTerrain(surface);
      layers = {lit, mist: addMist(lit)};
      litSurfaces.set(surface, layers);
    }
    return S.sky ? layers.mist : layers.lit;
  };
  const nativeSkyOver = drawSkyOver;
  drawSkyOver = map => {
    if (!active(map)) nativeSkyOver(map);
  };
  minimap=function(m){
    if(!active(m))return native.minimap(m);
    const scale=4,width=m.w*scale,height=m.h*scale,ox=VW-14-width,oy=VH-14-height;
    g.fillStyle='rgba(10,16,20,.72)';g.fillRect(ox-5,oy-5,width+10,height+10);
    g.strokeStyle='rgba(240,195,74,.55)';g.lineWidth=1;g.strokeRect(ox-4.5,oy-4.5,width+9,height+9);
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      const cell=m.grid[y][x];g.fillStyle=cell.t==='water'?'#173943':cell.t==='cliff'?'#26374c':cell.t==='elevated'?'#675848':cell.t==='stair'?'#87704e':'#45423d';
      g.fillRect(ox+x*scale,oy+y*scale,scale,scale);
    }
    g.fillStyle='#a08255';for(const [x,y]of m.def.road)g.fillRect(ox+x*scale,oy+y*scale,scale,scale);
    for(let i=0;i<NODES().length;i++){
      const n=NODES()[i];g.fillStyle=i===9?'#b03a30':i<PR().cleared?'#68b250':i<PRU()?'#5f9fe0':'#2a3440';
      g.beginPath();g.arc(ox+n[0]*scale+2,oy+n[1]*scale+2,i===9?4:3,0,7);g.fill();
    }
    const post=POST();if(post){g.fillStyle='#c9963f';g.fillRect(ox+post[0]*scale,oy+post[1]*scale,scale+1,scale+1);}
    g.fillStyle='#fff';g.beginPath();g.arc(ox+P.x/T*scale,oy+P.y/T*scale,3,0,7);g.fill();
  };
  API.snapshot=function(){
    const data=maps.get(over),it=data?.house,castle=data?.castle;
    const inset=it&&folBox(it),land=(x,y)=>over?.def.t[Math.floor(y/T)]?.[Math.floor(x/T)]==='.';
    return {active:active(over),animated:active(over)&&!reduced.matches,mistAlpha:Math.max(...mistBanks.map(bank=>bank[5])),mistSource:'moonlight',harmless:true,
      clouds:data?mistBanks.length:0,torches:data?2:0,flameColor:'blue',trailTiles:16,props:data?.props||0,trees:data?.trees||0,
      house:it?{x:it.x,y:it.y,height:it.sp[7],inland:land(inset.x,it.foot+20)&&land(inset.x+inset.w,it.foot+20)}:null,
      castle:castle?{x:castle.x,y:castle.y,grounded:land(castle.x*T,castle.foot+20)&&land((castle.x+1)*T,castle.foot+20)}:null};
  };
  // Optional direct-review URL uses the normal playable game with isolated preview storage.
  // A normal launch keeps the player's progress and usual chapter-selection flow.
  if(location.hash==='#guttered-vaults'){
    const boot=setInterval(()=>{
      if(!ready||loaded<total)return;clearInterval(boot);enterChapter(5);
      S.card=null;S.cardQ=[];S.cardHold=null;S.hint=null;
    },60);
  }
})();
