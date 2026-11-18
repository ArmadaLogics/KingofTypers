/* Chapter VI concept buildings and separate sconce animation. */
(() => {
  'use strict';
  // Native DSPEC bounds and cup positions are recorded with the exported artwork.
  const specs={
    castle:[352,264,1,4,8,8,336,248],
    tower:[122,244,1,4,8,8,106,228],
    house:[197,214,1,4,8,8,181,198]
  };
  const sconces=[[113,173],[242,173]];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const keys={castle:'gvCastle',tower:'gvTower',house:'gvHouse'};
  const litSprites=new WeakMap(), shadows=new WeakMap();
  window.GutteredStructures={specs,litSprite};

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
  function softenOutline(frame){
    const {data,width,height}=frame;
    const colors=new Uint8ClampedArray(data);
    const inset=new Uint8Array(width*height);
    for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
      const i=y*width+x;
      if(data[i*4+3]>=128)inset[i]=Math.min(6,1+inset[i-1],1+inset[i-width]);
    }
    for(let y=height-2;y>0;y--)for(let x=width-2;x>0;x--){
      const i=y*width+x;
      inset[i]=Math.min(inset[i],1+inset[i+1],1+inset[i+width]);
    }
    const directions=[-1,1,-width,width];
    for(let y=6;y<height-6;y++)for(let x=6;x<width-6;x++){
      const i=y*width+x,depth=inset[i],offset=i*4;
      if(depth<2||depth>5||colors[offset+1]>48)continue;
      // Leave the outermost ink pixel. Borrow the lit material just inside the edge
      // so fewer rows of dark pixels read as the outline.
      let sample=-1;
      for(let step=1;step<=5&&sample<0;step++){
        for(const direction of directions){
          const inner=i+direction*step,innerOffset=inner*4;
          if(inset[inner]>depth&&colors[innerOffset+1]>colors[offset+1]+14){
            sample=innerOffset;break;
          }
        }
      }
      if(sample<0)continue;
      const blend=depth===2?.62:.83;
      for(let c=0;c<3;c++)data[offset+c]+=(colors[sample+c]-colors[offset+c])*blend;
    }
  }
  function litSprite(it){
    if(!isStructure(it)||!active())return;
    const source=IMG[keys[it.k]],moonlight=window.GutteredVaults?.lightAt;
    if(!source?.naturalWidth||!moonlight)return;
    if(litSprites.has(it))return litSprites.get(it);
    const canvas=document.createElement('canvas');
    canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(source,0,0);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height),p=frame.data;
    const light=Math.min(1,moonlight((it.x+.5)*T,it.foot));
    for(let y=0;y<canvas.height;y++){
      const exposure=.84+(1-y/canvas.height)*.16;
      for(let x=0;x<canvas.width;x++){
        const i=(y*canvas.width+x)*4;
        if(!p[i+3])continue;
        const r=p[i],g=p[i+1],b=p[i+2],luma=.213*r+.715*g+.072*b;
        // Hold the flame and amber window cores while cooling the stone and timber.
        const ember=Math.max(0,Math.min(1,(r-154)/82,(r-b-75)/98,(g-54)/56));
        const grade=exposure*(1-ember),spill=grade*light*luma;
        const soft=.28*(1-ember);
        p[i]=(r*(ember+.52*grade)+spill*.09)*(1-soft)+34*soft;
        p[i+1]=(g*(ember+.64*grade)+spill*.20)*(1-soft)+48*soft;
        p[i+2]=(b*(ember+.79*grade)+spill*.28+luma*grade*.085)*(1-soft)+66*soft;
      }
    }
    softenOutline(frame);
    ctx.putImageData(frame,0,0);
    litSprites.set(it,canvas);
    return canvas;
  }
  function buildContactShadow(map,it,source){
    const [width,height,,,,top,,bodyHeight]=it.sp;
    const depth=it.k==='castle'?56:44;
    const {stamp,margin,top:sourceY}=GutteredVaults.footingShadow(source,width,height,top+bodyHeight,depth,8);
    const x=it.px-margin,y=it.py+sourceY;
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
  function drawContactShadow(ctx,map,it){
    const source=IMG[keys[it.k]];
    if(!source?.naturalWidth||!window.GutteredVaults?.footingShadow)return;
    if(!shadows.has(it))shadows.set(it,buildContactShadow(map,it,source));
    const {stamp,x,y}=shadows.get(it);
    ctx.drawImage(stamp,x,y);
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
    for(const it of buildings)drawContactShadow(g,m,it);
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
