/* Chapter VI: original building artwork under shared moonlight, with grounded shadows. */
(() => {
  'use strict';
  // Native DSPEC bounds and cup positions are recorded with the exported artwork.
  const specs={
    castle:[352,264,1,4,8,8,336,248],
    tower:[122,244,1,4,8,8,106,228],
    house:[197,214,1,4,8,8,181,198]
  };
  const sconces=[[113,173],[242,173]];
  const shadowProjection={
    house:{shear:.23,depth:.31},
    tower:{shear:.205,depth:.34,blur:2.8,fadeLength:64,footOffset:5},
    castle:{shear:.174,depth:.29,blur:2.8,fadeLength:64}
  };
  const amber=[255,169,61],blue=[66,164,255];
  // Source-pixel anchors correspond to actual lit panes, lanterns and flame cores.
  // Ground reach is a separate footprint below each wall, not a floating halo.
  const lamps={
    house:[
      {x:90,y:142,rx:34,ry:39,power:.42,color:amber,groundRx:60,groundRy:30,groundPower:.30},
      {x:153,y:145,rx:30,ry:37,power:.34,color:amber,groundRx:44,groundRy:25,groundPower:.22}
    ],
    tower:[
      {x:60,y:69,rx:30,ry:34,power:.32,color:amber,groundRx:61,groundRy:29,groundPower:.11},
      {x:60,y:105,rx:32,ry:37,power:.42,color:amber,groundRx:54,groundRy:28,groundPower:.18},
      {x:56,y:204,rx:20,ry:24,power:.25,color:amber,groundRx:28,groundRy:18,groundPower:.10}
    ],
    castle:[
      {x:67,y:117,rx:33,ry:43,power:.35,color:amber,groundRx:44,groundRy:27,groundPower:.19},
      {x:286,y:117,rx:33,ry:43,power:.35,color:amber,groundRx:44,groundRy:27,groundPower:.19},
      {x:113,y:159,rx:46,ry:52,power:.48,color:blue,groundRx:61,groundRy:31,groundPower:.30},
      {x:242,y:159,rx:46,ry:52,power:.48,color:blue,groundRx:61,groundRy:31,groundPower:.30}
    ]
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const keys={castle:'gvCastle',tower:'gvTower',house:'gvHouse'};
  const litSprites=new WeakMap(),shadows=new WeakMap(),groundSurfaces=new WeakMap();
  window.GutteredStructures={specs,litSprite,groundSurface,illuminateGround,lightAtGround};

  // The standalone build lacks the split game's full Chapter VI terrain adapter.
  // Match its reviewed building foundations without changing the standalone terrain art.
  if(!window.GutteredVaults){
    const nativeBuild=buildMap,nativeImg=folImg;
    folImg=function(key){return key.endsWith('@floodlock')?IMG[keys[folBase(key)]]:nativeImg(key);};
    buildMap=function(def){
      if(!FOL_OVER||FOL_CH!=='VI'||!Object.values(keys).every(k=>IMG[k]?.complete&&IMG[k].naturalWidth>1))
        return nativeBuild(def);
      const terrain=def.t.map(r=>[...r]),decor=def.d.map(r=>[...r]);
      for(let y=12;y<=14;y++)for(let x=30;x<=33;x++)if(terrain[y]?.[x]&&terrain[y][x]!=='~')terrain[y][x]='.';
      for(const row of decor)for(let x=0;x<row.length;x++)if(row[x]==='H')row[x]=' ';
      decor[16][9]='H';
      const oldKit=FOL_KIT.VI,oldSpecs={};
      for(const [key,spec]of Object.entries(specs)){oldSpecs[key]=DSPEC[key];DSPEC[key]=spec;}
      FOL_KIT.VI={...oldKit,H:['house@floodlock'],C:['castle@floodlock'],S:['tower@floodlock']};
      try{return nativeBuild({...def,t:terrain.map(r=>r.join('')),d:decor.map(r=>r.join(''))});}
      finally{FOL_KIT.VI=oldKit;for(const [key,spec]of Object.entries(oldSpecs))DSPEC[key]=spec;}
    };
  }

  const isStructure=it=>!!keys[it?.k]&&(it.key===it.k+'@vault'||it.key===it.k+'@floodlock');
  const active=()=>S.scene==='over'&&S.chapter===5&&!S.hub;
  function litSprite(it){
    if(!isStructure(it)||!active())return;
    const source=IMG[keys[it.k]],lightScenery=window.GutteredVaults?.litScenery;
    if(!source?.naturalWidth||!lightScenery)return;
    if(litSprites.has(it))return litSprites.get(it);
    const canvas=lightScenery(source,it.px,it.py);
    illuminateMaterial(canvas,it);
    litSprites.set(it,canvas);
    return canvas;
  }
  function illuminateMaterial(canvas,it){
    const ctx=canvas.getContext('2d'),frame=ctx.getImageData(0,0,canvas.width,canvas.height),p=frame.data;
    for(const lamp of lamps[it.k]){
      const left=Math.max(0,Math.floor(lamp.x-lamp.rx)),right=Math.min(canvas.width,Math.ceil(lamp.x+lamp.rx));
      const top=Math.max(0,Math.floor(lamp.y-lamp.ry)),bottom=Math.min(canvas.height,Math.ceil(lamp.y+lamp.ry));
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
        const i=(y*canvas.width+x)*4;if(!p[i+3])continue;
        const distance=((x-lamp.x)/lamp.rx)**2+((y-lamp.y)/lamp.ry)**2;if(distance>=1)continue;
        const luma=.213*p[i]+.715*p[i+1]+.072*p[i+2];
        const reflected=.28+.72*Math.min(1,luma/105),power=(1-distance)**2*lamp.power*reflected;
        for(let c=0;c<3;c++)p[i+c]=Math.round(255-(255-p[i+c])*(1-power*lamp.color[c]/255));
      }
    }
    if(it.k==='house'||it.k==='tower')softenStructureContrast(p);
    ctx.putImageData(frame,0,0);
  }
  function softenStructureContrast(pixels){
    for(let i=0;i<pixels.length;i+=4){
      if(!pixels[i+3])continue;
      const red=pixels[i],green=pixels[i+1],blue=pixels[i+2];
      // Keep the amber fixture cores at their existing intensity.
      if(red>=180&&red-blue>=95&&green>=85)continue;
      const luma=.213*red+.715*green+.072*blue;
      const adjustment=(50-luma)*.10;
      for(let channel=0;channel<3;channel++)pixels[i+channel]+=adjustment;
    }
  }
  function receivesLight(cell,level){
    return cell?.level===level&&(cell.t==='flat'||cell.t==='elevated');
  }
  function groundLampX(it,lamp){
    return it.px+(it.flip?it.sp[0]-lamp.x:lamp.x);
  }
  function groundPowerAt(lamp,dx,dy){
    const falloff=Math.max(0,1-(dx/lamp.groundRx)**2-(dy/lamp.groundRy)**2);
    return falloff**2*lamp.groundPower;
  }
  function lightAtGround(map,x,y){
    const transmission=[1,1,1];
    if(!active()||map!==over)return [0,0,0];
    const cell=map.grid[Math.floor(y/T)]?.[Math.floor(x/T)];
    for(const it of map.stand){
      if(!isStructure(it)||!receivesLight(cell,map.grid[it.y][it.x].level))continue;
      for(const lamp of lamps[it.k]){
        const power=groundPowerAt(lamp,x-groundLampX(it,lamp),y-it.foot-9);
        for(let c=0;c<3;c++)transmission[c]*=1-power*lamp.color[c]/255;
      }
    }
    return transmission.map(value=>1-value);
  }
  function illuminateGround(map,source){
    if(!active()||map!==over)return source;
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height),p=frame.data;
    for(const it of map.stand.filter(isStructure)){
      const level=map.grid[it.y][it.x].level;
      for(const lamp of lamps[it.k]){
        const cx=groundLampX(it,lamp),cy=it.foot+9;
        const left=Math.max(0,Math.floor(cx-lamp.groundRx)),right=Math.min(canvas.width,Math.ceil(cx+lamp.groundRx));
        const top=Math.max(0,Math.floor(cy-lamp.groundRy)),bottom=Math.min(canvas.height,Math.ceil(cy+lamp.groundRy));
        for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
          const cell=map.grid[Math.floor(y/T)]?.[Math.floor(x/T)];
          if(!receivesLight(cell,level))continue;
          const i=(y*canvas.width+x)*4;if(!p[i+3])continue;
          const power=groundPowerAt(lamp,x-cx,y-cy);if(!power)continue;
          for(let c=0;c<3;c++)p[i+c]=Math.round(255-(255-p[i+c])*(1-power*lamp.color[c]/255));
        }
      }
    }
    ctx.putImageData(frame,0,0);
    for(const it of map.stand.filter(isStructure)){
      const projection=shadowProjection[it.k],source=IMG[keys[it.k]];
      if(projection&&source?.naturalWidth)drawProjectedShadow(ctx,map,it,source,projection);
    }
    return canvas;
  }
  function drawProjectedShadow(ctx,map,it,source,{shear,depth,blur=2.3,fadeLength,footOffset=0}){
    const [width,height,,,,top,,bodyHeight]=it.sp;
    const bottom=top+bodyHeight;
    const left=Math.round(it.px),foot=Math.round(it.py+bottom);
    const shadowX=left-64,shadowY=foot-94;
    const silhouette=document.createElement('canvas');
    silhouette.width=width;silhouette.height=height;
    const mask=silhouette.getContext('2d');
    if(it.flip){mask.translate(width,0);mask.scale(-1,1);}
    mask.drawImage(source,0,0);
    const pixels=mask.getImageData(0,0,width,height);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
    mask.putImageData(pixels,0,0);

    const stamp=document.createElement('canvas');
    stamp.width=width+78;stamp.height=106+footOffset;
    const shadow=stamp.getContext('2d');
    shadow.save();
    shadow.filter=`blur(${blur}px)`;
    shadow.setTransform(1,0,shear,depth,left-shadowX-shear*bottom,foot+footOffset-shadowY-depth*bottom);
    shadow.drawImage(silhouette,0,0);
    shadow.restore();
    shadow.globalCompositeOperation='source-in';
    const fade=shadow.createLinearGradient(0,94+footOffset-(fadeLength??bottom*depth),0,94+footOffset);
    fade.addColorStop(0,'rgba(7,13,24,.23)');
    fade.addColorStop(.63,'rgba(7,13,24,.46)');
    fade.addColorStop(1,'rgba(7,13,24,.63)');
    shadow.fillStyle=fade;
    shadow.fillRect(0,0,stamp.width,stamp.height);

    // Apply after the fixture spill so the narrow foundation shadow still reads.
    const receiving=new Path2D(),level=map.grid[it.y][it.x].level;
    for(let row=Math.floor(shadowY/T);row<=Math.floor((shadowY+stamp.height-1)/T);row++){
      for(let col=Math.floor(shadowX/T);col<=Math.floor((shadowX+stamp.width-1)/T);col++){
        if(receivesLight(map.grid[row]?.[col],level))receiving.rect(col*T,row*T,T,T);
      }
    }
    ctx.save();
    ctx.clip(receiving);
    ctx.globalCompositeOperation='source-atop';
    ctx.drawImage(stamp,shadowX,shadowY);
    ctx.restore();
  }
  function buildContactShadow(map,it,source){
    const [width,height,,,,top,,bodyHeight]=it.sp;
    const bottom=top+bodyHeight,margin=8;
    const stamp=document.createElement('canvas');stamp.width=width+margin*2;stamp.height=24;
    const shade=stamp.getContext('2d');
    // Compress only the foundation into a shallow ground footprint. A tall slice
    // of the facade would cast a wall-shaped stain around the building instead.
    const footing=document.createElement('canvas');footing.width=width;footing.height=24;
    const mask=footing.getContext('2d');
    if(it.flip){mask.translate(width,0);mask.scale(-1,1);}
    mask.drawImage(source,0,bottom-24,width,24,0,0,width,24);
    const pixels=mask.getImageData(0,0,width,24);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
    mask.putImageData(pixels,0,0);
    shade.filter='blur(1px)';shade.globalAlpha=.10;
    shade.drawImage(footing,margin-5,5,width,12);
    shade.filter='none';shade.globalAlpha=.32;
    shade.drawImage(footing,0,12,width,12,margin,0,width,8);
    shade.globalAlpha=1;shade.globalCompositeOperation='source-in';
    shade.fillStyle='#161c2e';shade.fillRect(0,0,stamp.width,stamp.height);
    // Match the receiving tile grid to avoid half-pixel clip bleed at cliff rims.
    const x=Math.round(it.px-margin),y=Math.round(it.py+bottom-4);
    const surface=new Path2D(),level=map.grid[it.y][it.x].level;
    for(let row=Math.floor(y/T);row<=Math.floor((y+stamp.height-1)/T);row++){
      for(let col=Math.floor(x/T);col<=Math.floor((x+stamp.width-1)/T);col++){
        const cell=map.grid[row]?.[col];
        if(cell?.level===level&&(cell.t==='flat'||cell.t==='elevated'))surface.rect(col*T-x,row*T-y,T,T);
      }
    }
    // Keep the stamp on the same elevation and respect the terrain's shoreline alpha.
    const clipped=document.createElement('canvas');
    clipped.width=stamp.width;clipped.height=stamp.height;
    const ctx=clipped.getContext('2d');
    ctx.clip(surface);
    ctx.drawImage(stamp,0,0);
    ctx.globalCompositeOperation='destination-in';
    ctx.drawImage(map.canvas,-x,-y);
    return {stamp:clipped,x,y};
  }
  function groundSurface(map,source){
    if(!active()||map!==over)return source;
    let cache=groundSurfaces.get(map);
    if(!cache){cache=new WeakMap();groundSurfaces.set(map,cache);}
    if(cache.has(source))return cache.get(source);
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
    for(const it of map.stand.filter(isStructure)){
      if(shadowProjection[it.k])continue; // Projected shadows are composited with the lit ground.
      const art=IMG[keys[it.k]];if(!art?.naturalWidth)continue;
      if(!shadows.has(it))shadows.set(it,buildContactShadow(map,it,art));
      const {stamp,x,y}=shadows.get(it);ctx.drawImage(stamp,x,y);
    }
    cache.set(source,canvas);return canvas;
  }
  function drawFlames(ctx,it,castLight){
    const sprite=IMG.gvSconceFlame;
    if(!sprite?.complete||sprite.naturalWidth!==256)return;
    const base=reduced.matches?0:(Math.floor(S.t*12)%8+8)%8;
    ctx.save();ctx.imageSmoothingEnabled=false;
    for(const [i,[sx,sy]]of sconces.entries()){
      const x=it.px+sx,y=it.py+sy,frame=(base+4*i)%8;
      if(castLight){
        const glow=ctx.createRadialGradient(x,y-10,1,x,y-10,32);
        glow.addColorStop(0,'rgba(60,155,240,.13)');glow.addColorStop(1,'rgba(40,125,245,0)');
        ctx.globalCompositeOperation='screen';ctx.fillStyle=glow;
        ctx.fillRect(x-32,y-42,64,64);ctx.globalCompositeOperation='source-over';
      }
      // Trim the part below the exported attachment point so the cup's rim stays in front.
      ctx.drawImage(sprite,frame*32,0,32,42,x-16,y-42,32,42);
    }
    ctx.restore();
  }
  const nativeLayer=folDrawLayer,nativeBlit=folBlit;
  folDrawLayer=function(m){
    nativeLayer(m);
    if(!active()||m!==over)return;
    const buildings=m.stand.filter(isStructure);
    // The sea props are drawn by nativeLayer; the taller buildings must sit in front of them.
    for(const it of buildings)if(!m.live.includes(it))folBlit(g,it,0);
  };
  folBlit=function(ctx,it,fr){
    if(!isStructure(it))return nativeBlit(ctx,it,fr);
    // Stand objects still enter the native collision pass; only their canvas bake is skipped.
    if(ctx!==g)return true;
    const drawn=nativeBlit(ctx,it,fr);
    // The canopy redraw carries the flame at the building's current alpha too.
    if(drawn&&active()&&it.k==='castle')drawFlames(ctx,it,ctx.globalAlpha===1);
    return drawn;
  };
})();
