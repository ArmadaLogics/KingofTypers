/* Guttered Vaults: reviewed overworld scenery, separate from stage torch/combat rules. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),maps=new WeakMap();
  const native={build:buildMap,img:folImg,water:drawWater,sky:drawSky,minimap};
  const imageKeys={house:'gvHouse',tower:'gvTower',castle:'gvCastle',tree1:'gvTree',rock1:'gvRock1',rock2:'gvRock2',bush1:'gvBush1',bush2:'gvBush2'};
  const specs={
    house:[256,256,1,4,8,31,240,217],tower:[144,224,1,4,8,28,128,188],
    castle:[352,224,1,4,8,18,336,198],tree1:[192,256,1,11,39,51,114,190],
    rock1:[64,64,1,4,8,15,48,41],rock2:[64,64,1,4,8,31,48,25],
    bush1:[96,80,1,4,8,20,80,52],bush2:[96,80,1,4,8,11,80,61]
  };
  const API=window.GutteredVaults={enabled:true,originalTiles:null};
  const active=m=>API.enabled&&S.scene==='over'&&S.chapter===5&&maps.has(m);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  let prepared=null;
  function prepare(){
    if(prepared)return prepared;
    const required=['gvTerrain','gvWater','gvTrail',...Object.values(imageKeys),'gvGrass','gvFern','gvMoss','gvFungi','gvRootRock','gvRootStump'];
    if(required.some(k=>!IMG[k]?.complete||IMG[k].naturalWidth<8))return null;
    const foam=document.createElement('canvas');foam.width=IMG.foam.width;foam.height=IMG.foam.height;
    const f=foam.getContext('2d');f.drawImage(IMG.foam,0,0);f.globalCompositeOperation='source-in';f.fillStyle='#214957';f.fillRect(0,0,foam.width,foam.height);foam.complete=true;
    const stillFoam=document.createElement('canvas');stillFoam.width=foam.width;stillFoam.height=foam.height;
    const sf=stillFoam.getContext('2d');for(let frame=0;frame<16;frame++)sf.drawImage(foam,0,0,192,192,frame*192,0,192,192);stillFoam.complete=true;
    const clouds=[];
    for(const key of ['poisonCloud01','poisonCloud03','poisonCloud05']){
      const im=IMG[key];if(!im?.complete||im.naturalWidth<8)continue;
      const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
      const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#d9dfe3';x.fillRect(0,0,c.width,c.height);clouds.push(c);
    }
    return prepared={foam,stillFoam,clouds,water:g.createPattern(IMG.gvWater,'repeat')};
  }
  folImg=function(key){return key.endsWith('@vault')?IMG[imageKeys[folBase(key)]]||native.img(key):native.img(key);};
  function authoredMap(def){
    const t=def.t.map(row=>[...row]),d=def.d.map(row=>[...row]);
    // Only the reviewed castle shelf is levelled; no island or route cell is relocated.
    for(let y=12;y<=14;y++)for(let x=30;x<=33;x++)if(t[y]?.[x]&&t[y][x]!=='~')t[y][x]='.';
    for(const row of d)for(let x=0;x<row.length;x++)if(row[x]==='H')row[x]=' ';
    d[16][9]='H';
    for(const [x,y]of [[5,7],[16,17],[34,8],[22,18]]){
      if(t[y]?.[x]!=='.'||d[y][x]!==' ')continue;
      if(def.road.some(p=>Math.hypot(p[0]-x,p[1]-y)<1.7))continue;
      d[y][x]='T';
    }
    return {...def,t:t.map(row=>row.join('')),d:d.map(row=>row.join(''))};
  }
  const blitProp=(ctx,key,x,foot,width)=>{
    const im=IMG[key],height=Math.round(width*im.height/im.width);
    ctx.drawImage(im,Math.round(x-width/2),Math.round(foot-height),width,height);
  };
  function groundLighting(ctx,it,radius,color,alpha){
    if(!it)return;const x=it.x*T+T/2,y=it.foot+9;
    ctx.save();ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(x,y,0,x,y,radius);glow.addColorStop(0,`rgba(${color},${alpha})`);glow.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();
  }
  function paintRaisedSurfaces(m,ctx=m.canvas.getContext('2d')){
    const raised=(x,y)=>m.def.t[y]?.[x]==='#',land=(x,y)=>!!m.def.t[y]?.[x]&&m.def.t[y][x]!=='~';
    const surface=document.createElement('canvas');surface.width=m.canvas.width;surface.height=m.canvas.height;
    const x=surface.getContext('2d');x.imageSmoothingEnabled=false;
    for(let ty=0;ty<m.h;ty++)for(let tx=0;tx<m.w;tx++)if(raised(tx,ty)){
      // Rebuild over flat soil so a transparent ramp cut reveals the lower ground,
      // rather than leaving the old rectangular raised tile underneath it.
      const l=land(tx-1,ty),r=land(tx+1,ty),n=land(tx,ty-1),s=land(tx,ty+1);
      ctx.clearRect(tx*T,ty*T,T,T);
      ctx.drawImage(IMG.gvTerrain,(l&&r?1:r?0:l?2:3)*T,(n&&s?1:s?0:n?2:3)*T,T,T,tx*T,ty*T,T,T);
      const left=raised(tx-1,ty),right=raised(tx+1,ty),north=raised(tx,ty-1);
      // Rows 2/3 include a short blue face. The native cliff already supplies
      // the full face below this cell, so those caps would create a second band.
      const col=left&&right?6:right?5:left?7:8,row=north?1:0;
      x.drawImage(IMG.gvTerrain,col*T,row*T,T,T,tx*T,ty*T,T,T);
    }
    const shadow=document.createElement('canvas');shadow.width=surface.width;shadow.height=surface.height;
    const sx=shadow.getContext('2d');sx.drawImage(surface,0,0);sx.globalCompositeOperation='source-in';sx.fillStyle='#071018';sx.fillRect(0,0,shadow.width,shadow.height);
    // Shadow follows the assembled alpha silhouette, not rectangular per-tile strokes.
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.85;
    for(const [dx,dy]of [[-2,0],[2,0],[0,-2],[0,2]])ctx.drawImage(shadow,dx,dy);
    ctx.globalAlpha=1;ctx.drawImage(surface,0,0);
    for(let ty=0;ty<m.h;ty++)for(let tx=0;tx<m.w;tx++)if(m.def.t[ty][tx]==='/'){
      // Replace the upper cell after the plateau outline is complete. Cutting
      // a hole in that outline would draw an L-shaped rim around the diagonal.
      ctx.drawImage(IMG.gvTerrain,T,T,T,T,tx*T,(ty-1)*T,T,T);
      const slope=document.createElement('canvas');slope.width=T;slope.height=T*2;
      const rx=slope.getContext('2d');rx.imageSmoothingEnabled=false;
      rx.drawImage(IMG.gvTerrain,0,4*T,T,T,0,0,T,T);
      rx.drawImage(IMG.gvTerrain,0,5*T,T,T,0,T,T,T);
      const cut=document.createElement('canvas');cut.width=T;cut.height=T*2;
      const cx=cut.getContext('2d');cx.drawImage(slope,0,0);cx.globalCompositeOperation='source-in';cx.fillStyle='#071018';cx.fillRect(0,0,T,T*2);
      ctx.save();ctx.beginPath();ctx.rect(tx*T,(ty-1)*T,T,T*2);ctx.clip();ctx.globalAlpha=.85;
      ctx.drawImage(cut,tx*T-4,(ty-1)*T);ctx.drawImage(cut,tx*T,(ty-1)*T-4);
      ctx.globalAlpha=1;ctx.drawImage(slope,tx*T,(ty-1)*T);ctx.restore();
    }
    ctx.restore();
  }
  API.paintRaisedSurfaces=paintRaisedSurfaces;
  function decorate(m,items){
    const ctx=m.canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    paintRaisedSurfaces(m,ctx);
    const road=new Set(m.def.road.map(n=>n.join(','))),nearRoad=(x,y,gap=1.2)=>m.def.road.some(p=>Math.hypot(p[0]-x,p[1]-y)<gap);
    const roadSafe=(x,y)=>NODES().every(p=>Math.hypot(p[0]-x,p[1]-y)>1.6)&&!nearRoad(x,y);
    for(const [x,y]of m.def.road){
      let mask=0;if(road.has(x+','+(y-1)))mask|=1;if(road.has((x+1)+','+y))mask|=2;if(road.has(x+','+(y+1)))mask|=4;if(road.has((x-1)+','+y))mask|=8;
      ctx.drawImage(IMG.gvTrail,mask%4*T,Math.floor(mask/4)*T,T,T,x*T,y*T,T,T);
    }
    const house=m.stand.find(it=>it.k==='house'),castle=m.stand.find(it=>it.k==='castle');
    groundLighting(ctx,house,100,'207,116,49',.18);groundLighting(ctx,castle,100,'204,105,42',.13);
    for(const it of m.stand.filter(it=>it.k==='tower'))groundLighting(ctx,it,64,'204,105,42',.12);
    // Repaint native props above the trail and lights, so the road never lies over a sprite.
    for(const it of items)folBlit(ctx,it,0);
    const land=(x,y)=>m.def.t[y]?.[x]&&m.def.t[y][x]!=='~';
    const buildings=m.stand.filter(it=>['house','tower','castle'].includes(it.k));
    const blocked=(cx,foot,width,height)=>buildings.some(it=>{const b=folBox(it);return cx+width/2>b.x-16&&cx-width/2<b.x+b.w+16&&foot>b.y-10&&foot-height<b.y+b.h+12;});
    let props=items.length;
    const mist=[];
    for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++){
      if(!land(x,y)||m.grid[y][x].t==='cliff'||m.grid[y][x].t==='stair')continue;
      const rim=!land(x-1,y)||!land(x+1,y)||!land(x,y-1)||!land(x,y+1),q=hash(x,y);
      if(rim&&q>.38&&roadSafe(x,y)){
        const key=q>.92?'gvRootRock':q>.84?'gvRootStump':q>.68?'gvFern':'gvGrass';
        const width=key.startsWith('gvRoot')?72:key==='gvFern'?56:42,cx=(x+.5)*T,foot=(y+1)*T-10;
        const im=IMG[key],height=width*im.height/im.width;
        if(!blocked(cx,foot,width,height)){blitProp(ctx,'gvMoss',cx,foot+3,74);blitProp(ctx,key,cx,foot,width);props+=2;
          if(q>.93&&!blocked(cx+30,foot,34,45)){blitProp(ctx,'gvFungi',cx+30,foot,34);props++;}}
      }
      if(q>.80&&m.grid[y][x].walk&&m.grid[y][x].level===0&&roadSafe(x,y)&&!blocked((x+.5)*T,(y+.5)*T,200,160)
        &&mist.every(p=>Math.hypot(p.x-(x+.5)*T,p.y-(y+.5)*T)>T*3.5))
        mist.push({x:(x+.5)*T,y:(y+.5)*T,phase:q*6.283,image:mist.length%3,width:210+q*45});
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
    const ground=new Path2D(),clear=new Path2D();
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(land(x,y))ground.rect(x*T,y*T,T,T);
    for(const [x,y]of m.def.road)clear.rect(x*T+8,y*T+8,T-16,T-16);
    // POST is derived from `over`, which is assigned only after this build returns.
    // The supplier already sits inside the protected authored road strip.
    for(const [x,y]of NODES()){clear.moveTo((x+.5)*T+52,(y+.5)*T);clear.arc((x+.5)*T,(y+.5)*T,52,0,Math.PI*2);}
    for(const it of buildings){const b=folBox(it);clear.rect(b.x-12,b.y-12,b.w+24,b.h+36);}
    return {house,castle,props,mist:mist.slice(0,10),ground,clear,trees:items.filter(it=>it.k.startsWith('tree')).length};
  }
  buildMap=function(def){
    if(!API.enabled||FOL_CH!=='VI'||!FOL_OVER||!prepare())return native.build(def);
    const authored=authoredMap(def),oldKit=FOL_KIT.VI,oldAtlas=IMG.tm3,oldSpecs={},oldBlit=folBlit,items=[];
    for(const [key,spec]of Object.entries(specs)){oldSpecs[key]=DSPEC[key];DSPEC[key]=spec;}
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
    const art=prepare(),previous=IMG.foam,time=reduced.matches?0:S.t;
    art.water.setTransform(new DOMMatrix().translate(time*1.4,0));
    // Fill the entire visible ocean, including space beyond the map on wide displays.
    g.fillStyle=art.water;g.fillRect(-V.ox/V.z,-V.oy/V.z,VW/V.z,VH/V.z);
    try{IMG.foam=reduced.matches?art.stillFoam:art.foam;return native.water({...m,def:{...m.def,sea:art.water}},V);}
    finally{IMG.foam=previous;}
  };
  drawSky=function(m){
    if(!active(m))return native.sky(m);
    const data=maps.get(m),art=prepare(),time=reduced.matches?0:S.t;
    // Harmless scenery only. No reference to the poison spread, Ward drain or combat torch state.
    if(S.sky&&art.clouds.length){
      g.save();g.clip(data.ground);g.imageSmoothingEnabled=true;g.globalAlpha=.075;
      for(const f of data.mist){const x=f.x+Math.sin(time*.22+f.phase)*8,y=f.y+Math.sin(time*.15+f.phase)*4;
        g.drawImage(art.clouds[f.image%art.clouds.length],x-f.width/2,y-f.width*.38,f.width,f.width*.76);}
      g.restore();g.save();g.clip(data.clear);g.drawImage(m.canvas,0,0);g.restore();
    }
    if(data.castle){
      const it=data.castle,amount=.10+(reduced.matches?0:.012*Math.sin(time*4));
      g.save();g.globalCompositeOperation='screen';
      for(const x of [it.px+76,it.px+276]){
        const y=it.py+115,glow=g.createRadialGradient(x,y,1,x,y,43);
        glow.addColorStop(0,`rgba(55,150,250,${amount})`);glow.addColorStop(1,'rgba(40,125,245,0)');g.fillStyle=glow;g.fillRect(x-43,y-43,86,86);
      }g.restore();
    }
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
    return {active:active(over),animated:active(over)&&!reduced.matches,mistAlpha:.075,mistSource:'poisonCloud',harmless:true,
      clouds:data?.mist.length||0,torches:data?2:0,flameColor:'blue',trailTiles:16,props:data?.props||0,trees:data?.trees||0,
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
