/* Approved poison fog in normal gameplay. Art is loaded by the native preloader. */
(() => {
  const BUBBLE_DENSITY=.3, maps=new WeakMap();
  const D={ready:false,map:null,enabled:false,textures:[],patches:[],bubbles:[],shapeBags:[[],[],[]],lastImage:-1,spawnClock:0};
  const active=(map=W)=>D.enabled&&D.map===map&&S.scene==='stage';
  function prepare(){
    if(D.ready)return true;
    const images=Array.from({length:11},(_,i)=>IMG['poisonCloud'+String(i+1).padStart(2,'0')]);
    const bubble=IMG.poisonBubbles;
    if(images.some(im=>!im?.complete||im.naturalWidth<2)||!bubble?.complete||bubble.naturalWidth!==256)return false;
    D.textures=images.map(greenCloud);D.bubbleTexture=bubble;D.ready=true;return true;
  }
  function greenCloud(image){
    const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
    const ctx=source.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,source.width,source.height).data;
    let left=source.width,top=source.height,right=-1,bottom=-1;
    for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(pixels[(y*source.width+x)*4+3]){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    const cloud=document.createElement('canvas'),width=right-left+1,height=bottom-top+1;
    cloud.width=cloud.height=Math.max(width,height)+32;
    const tint=cloud.getContext('2d');
    const offsetX=Math.floor((cloud.width-width)/2)-left,offsetY=Math.floor((cloud.height-height)/2)-top;
    tint.drawImage(image,offsetX,offsetY);
    tint.globalCompositeOperation='source-in';tint.fillStyle='#a3c64b';tint.fillRect(0,0,cloud.width,cloud.height);
    cloud.bubbleSites=[];
    for(let y=top;y<=bottom;y+=4)for(let x=left;x<=right;x+=4)if(pixels[(y*source.width+x)*4+3]>=16)
      cloud.bubbleSites.push([(x+offsetX+.5)/cloud.width-.5,(y+offsetY+.5)/cloud.height-.5]);
    return cloud;
  }
  function cloudPose(f,time=S.t){
    const age=Math.max(0,time-f.born),t=age*f.motionRate;
    return {
      x:f.x+Math.sin(t*.62+f.phase)*9+Math.sin(t*.27+f.phase*1.7)*3,
      y:f.y+Math.sin(t*.48+f.phase+.8)*6+Math.sin(t*.21+f.phase*.7)*2,
      width:f.width*(1+.06*Math.sin(t*.65+f.phase)),height:f.height*(1+.05*Math.sin(t*.52+f.phase+1.6)),
      angle:f.angle+.025*Math.sin(t*.36+f.phase),alpha:f.alpha*Math.min(1,age/.55)*(.94+.06*Math.sin(t*.55+f.phase+.6))
    };
  }
  const bubbleInterval=f=>(.7+Math.random()*.5)*Math.max(.7,Math.min(1.2,192/f.size))/BUBBLE_DENSITY;
  function emitBubble(f){
    const sites=D.textures[f.image].bubbleSites;if(!sites.length)return;
    const [u,v]=sites[Math.floor(Math.random()*sites.length)],pose=cloudPose(f);
    const lx=u*pose.width*f.mirror,ly=v*pose.height,c=Math.cos(pose.angle),s=Math.sin(pose.angle);
    D.bubbles.push({cloud:f.id,x:pose.x+lx*c-ly*s,y:pose.y+lx*s+ly*c,size:44+Math.random()*16,
      rise:24+Math.random()*12,phase:Math.random()*Math.PI*2,born:S.t,life:1.35+Math.random()*.35});
  }
  function nextShape(group){
    const bag=D.shapeBags[group];
    if(!bag.length){
      for(let i=0;i<D.textures.length;i++)bag.push(i);
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
    }
    if(bag.length>1&&bag[bag.length-1]===D.lastImage)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
    return D.lastImage=bag.pop();
  }
  function start(map){
    D.map=map;D.enabled=false;D.patches=[];D.bubbles=[];D.shapeBags=[[],[],[]];D.lastImage=-1;D.spawnClock=0;
    if(!prepare())return; // Missing art retains the original visible hazard and native spread.
    let data=maps.get(map);
    if(!data){
      const seeds=[];
      for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++)
        if(map.def.t[y][x]==='%'||map.grid[y][x].t==='blight')seeds.push([x,y]);
      data={seeds,cleanCanvas:null};maps.set(map,data);
    }
    if(!data.seeds.length)return;
    if(!data.cleanCanvas)data.cleanCanvas=buildMap({...map.def,t:map.def.t.map(row=>row.replace(/%/g,'.'))}).canvas;
    for(const row of map.grid)for(const cell of row)if(cell.t==='blight')cell.t='flat';
    map.spread=[];delete map.__blight;delete map.__blightN;delete map.__stain;delete map.__stainN;
    S.spreadOn=false;S.bliT=0;S.bliHit=0;smokeFx=[];D.enabled=true;
  }
  function spawnOne(){
    const tiles=blightTiles(W),floor=[];
    for(let y=0;y<W.h;y++)for(let x=0;x<W.w;x++)
      if(W.grid[y][x].t==='flat'||W.grid[y][x].t==='blight')floor.push([x,y]);
    const pressure=epress('blight'),cap=pressure?PRESS.bcap(S.wave):BLI_CAP;
    if(tiles.length>=Math.floor(floor.length*cap))return;
    let candidates;
    if(!tiles.length)candidates=maps.get(W).seeds.filter(([x,y])=>W.grid[y]?.[x]?.t==='flat');
    else{
      const frontier=new Map();
      for(const [x,y] of tiles)for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])
        if(W.grid[ny]?.[nx]?.t==='flat')frontier.set(nx+','+ny,[nx,ny]);
      candidates=[...frontier.values()];
    }
    const keepMe=pressure||r('root')>=1,keepLane=pressure||r('root')>=2;
    const lanes=keepLane?new Set((W.def.lanes||[]).map(l=>l[0]+','+l[1])):null;
    candidates=candidates.filter(([x,y])=>!(lanes?.has(x+','+y))&&(!keepMe||Math.hypot((x+.5)*T-P.x,(y+.5)*T-P.y)>=T*1.6));
    candidates.sort((a,b)=>Math.hypot((a[0]+.5)*T-P.x,(a[1]+.5)*T-P.y)-Math.hypot((b[0]+.5)*T-P.x,(b[1]+.5)*T-P.y));
    if(!candidates.length)return;
    const [tx,ty]=candidates[0],id=D.patches.length,group=id%3;
    W.grid[ty][tx].t='blight';W.spread.push([tx,ty]);delete W.__blight;delete W.__blightN;
    const size=[192,128,256][group]*(.85+Math.random()*.25),stretch=.78+Math.random()*.5;
    const cloud={id,tile:[tx,ty],group,image:nextShape(group),x:(tx+.5)*T,y:(ty+.5)*T,size,width:size*stretch,height:size/stretch,
      angle:Math.random()*Math.PI*2,mirror:Math.random()<.5?-1:1,alpha:.5+Math.random()*.18,phase:Math.random()*Math.PI*2,motionRate:.8+Math.random()*.4,born:S.t};
    cloud.nextBubble=S.t+bubbleInterval(cloud);D.patches.push(cloud);
    if(Math.random()<3*BUBBLE_DENSITY)emitBubble(cloud);
    if(tiles.length)teach('creep','the blight is spreading. The ground you picked will not stay clean — keep a clean tile in mind before you need one.');
  }
  function tick(dt){
    if(!active()){
      if(S.scene!=='stage'){D.enabled=false;D.patches=[];D.bubbles=[];}
      return false;
    }
    D.bubbles=D.bubbles.filter(b=>S.t<b.born+b.life);
    const cadence=2*nodeCreep()/BLI_SPREAD*(epress('blight')?PRESS.creep(S.wave):1);
    // The first supply lesson pauses hazards while its gold name is being read.
    if(!supFrozen() && S.drownT<=0){
      D.spawnClock+=dt;
      if(D.spawnClock>=cadence-1e-6){D.spawnClock=0;spawnOne();}
    }
    const counts=new Map();for(const b of D.bubbles)counts.set(b.cloud,(counts.get(b.cloud)||0)+1);
    for(const cloud of D.patches)if(S.t>=cloud.nextBubble){
      if((counts.get(cloud.id)||0)<4)emitBubble(cloud);
      cloud.nextBubble=S.t+bubbleInterval(cloud);
    }
    return true;
  }
  function draw(cam){
    if(!active())return;
    g.save();g.imageSmoothingEnabled=true;
    for(const f of D.patches){
      const pose=cloudPose(f);g.globalAlpha=pose.alpha;
      g.save();g.translate(pose.x-cam.x,pose.y-cam.y);g.rotate(pose.angle);g.scale(f.mirror,1);
      g.drawImage(D.textures[f.image],-pose.width/2,-pose.height/2,pose.width,pose.height);g.restore();
    }
    g.imageSmoothingEnabled=false;
    for(const b of D.bubbles){
      const age=S.t-b.born;if(age<0||age>=b.life)continue;
      const p=age/b.life,frame=p<.25?0:p<.62?1:p<.82?2:3;
      const size=b.size*(.85+.18*Math.min(1,p/.62));
      const x=b.x-cam.x+Math.sin(age*3+b.phase)*3,y=b.y-cam.y-b.rise*p;
      g.globalAlpha=.82*(p>.82?(1-p)/.18:1);
      g.drawImage(D.bubbleTexture,frame*64,0,64,64,x-size/2,y-size/2,size,size);
    }
    g.restore();
  }
  window.PoisonFog={start,tick,draw,active,terrain:map=>active(map)?maps.get(map).cleanCanvas:map.canvas,
    snapshot:()=>({ready:D.ready,active:active(),bubbleDensity:BUBBLE_DENSITY,clouds:D.patches.length,bubbles:D.bubbles.length,
      patches:D.patches.map(f=>({id:f.id,tile:[...f.tile],image:f.image,group:f.group,size:f.size,pose:cloudPose(f)})),
      bubbleClouds:D.bubbles.map(b=>b.cloud)})};
})();
