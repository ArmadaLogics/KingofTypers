/* Stormward rainy weather: scenery pass, below actors, warnings and word plaques. */
(() => {
  const weather=window.StormwardWeather={enabled:true,stats:{passes:0,stagePasses:0,overPasses:0},last:null};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const groundCache=new WeakMap();
  const fract=n=>n-Math.floor(n);
  const seed=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
  const wrap=(n,size)=>((n%size)+size)%size;
  weather.active=()=>weather.enabled&&S.chapter===3&&S.sky&&(S.scene==='stage'||S.scene==='over');
  const lightning=weather.lightning={enabled:true,events:[],nextAt:null,stats:{distant:0,nearby:0,draws:0}};
  let lightningScene=null,lightningTime=S.t,lightningSerial=0;
  lightning.tick=function(){
    const scene=S.chapter+':'+S.scene+':'+S.stage;
    if(scene!==lightningScene||S.t<lightningTime){lightning.events=[];lightning.nextAt=null;lightningScene=scene;}
    lightningTime=S.t;
    if(!weather.active()){lightning.events=[];lightning.nextAt=null;return;}
    lightning.events=lightning.events.filter(event=>S.t-event.born<3);
    if(S.card||S.panel||window.StormwardFX?.paused||document.hidden)return;
    if(lightning.nextAt==null)lightning.nextAt=S.t+2;
    if(S.t>=lightning.nextAt){
      const variation=lightningSerial++;
      lightning.events.push({kind:'distant',born:S.t,direction:seed(variation+1700)>.5?.9:.1,
        soundDelay:.8+seed(variation+1800)*.5});
      lightning.stats.distant++;lightning.nextAt=S.t+10+seed(variation+1900)*6;
    }
  };
  lightning.strike=function(strike){
    lightning.tick();if(!weather.active())return;
    // A nearby strike supplies the light and sound; discard any distant roll still waiting to sound.
    lightning.events=lightning.events.filter(event=>event.kind!=='distant'||S.t-event.born>=event.soundDelay);
    const V=viewFor(S.scene==='over'?over:W);
    lightning.events.push({kind:'nearby',born:S.t,direction:Math.max(.05,Math.min(.95,(strike.x*V.z+V.ox)/VW)),soundDelay:0});
    lightning.stats.nearby++;lightning.nextAt=S.t+9+seed(2000+lightningSerial++)*5;
  };
  lightning.flashState=function(time=S.t){
    let strength=0,direction=.5,kind=null;
    if(!weather.active()||!lightning.enabled||reduced.matches)return {strength,direction,kind};
    for(const event of lightning.events){
      const age=time-event.born;if(age<0||age>.85)continue;
      const peak=event.kind==='nearby'?.22:.17;
      const value=peak*Math.min(1,age/.035)*Math.exp(-Math.max(0,age-.035)/.19);
      if(value>strength){strength=value;direction=event.direction;kind=event.kind;}
    }
    return {strength,direction,kind};
  };
  // Pure positions use the game clock, so pausing also freezes the rain.
  weather.dropPose=function(index,time,width,height){
    const speed=390+seed(index+73)*240,depth=seed(index+91);
    return {
      x:wrap(seed(index+1)*(width+80)-time*speed*.23,width+80)-40,
      y:wrap(seed(index+31)*(height+80)+time*speed,height+80)-40,
      length:10+depth*16,depth
    };
  };
  function groundPoints(m){
    if(groundCache.has(m))return groundCache.get(m);
    const cells=[];
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      const cell=m.grid[y]?.[x];
      if(cell&&(cell.walk||cell.t==='water'))cells.push({x,y});
    }
    const points=[];
    for(let i=0;i<Math.min(180,cells.length*2);i++){
      const cell=cells[Math.floor(seed(i+700)*cells.length)];
      points.push({x:(cell.x+.15+seed(i+800)*.7)*T,y:(cell.y+.15+seed(i+900)*.7)*T,phase:seed(i+1000)});
    }
    groundCache.set(m,points);return points;
  }
  weather.draw=function(m,V){
    const left=-V.ox/V.z,top=-V.oy/V.z,width=VW/V.z,height=VH/V.z;
    g.save();
    // Cool, lower-value terrain gives the existing blue lightning a stormy setting.
    g.globalCompositeOperation='multiply';g.globalAlpha=.40;g.fillStyle='#a3b6c9';
    g.fillRect(left,top,width,height);
    g.globalCompositeOperation='source-over';g.globalAlpha=1;
    const shade=g.createLinearGradient(0,top,0,top+height);
    shade.addColorStop(0,'rgba(28,49,72,.23)');shade.addColorStop(1,'rgba(43,68,88,.12)');
    g.fillStyle=shade;g.fillRect(left,top,width,height);
    let ripples=0;
    for(const point of groundPoints(m)){
      if(point.x<left||point.x>left+width||point.y<top||point.y>top+height)continue;
      const age=fract(S.t*(reduced.matches ? .35 : 1.25)+point.phase);
      if(age>.48)continue;
      const progress=age/.48,radius=(1.4+progress*4.2)/V.z;
      g.strokeStyle='rgba(185,215,229,'+((1-progress)*.31).toFixed(3)+')';
      g.lineWidth=1/V.z;g.beginPath();g.ellipse(point.x,point.y,radius,radius*.34,0,0,Math.PI*2);g.stroke();
      ripples++;
    }
    // Screen-sized rain keeps a fine, consistent texture when the stage is fitted down.
    g.translate(left,top);g.scale(1/V.z,1/V.z);
    const drops=reduced.matches?90:260,time=reduced.matches?S.t*.35:S.t;
    for(let layer=0;layer<2;layer++){
      g.strokeStyle=layer?'rgba(204,227,240,.46)':'rgba(150,185,208,.26)';
      g.lineWidth=layer?1.25:1;g.beginPath();
      for(let i=layer;i<drops;i+=2){
        const p=weather.dropPose(i,time,VW,VH),length=p.length*(reduced.matches ? .6 : 1);
        g.moveTo(p.x,p.y);g.lineTo(p.x-length*.23,p.y+length);
      }
      g.stroke();
    }
    const flash=lightning.flashState();
    if(flash.strength>0){
      g.save();g.globalCompositeOperation='screen';g.globalAlpha=flash.strength;
      g.fillStyle='#bad9ff';g.fillRect(0,0,VW,VH);
      const glow=g.createRadialGradient(VW*flash.direction,-VH*.15,0,VW*flash.direction,-VH*.15,VW*.95);
      glow.addColorStop(0,'rgba(235,246,255,.65)');glow.addColorStop(.45,'rgba(158,198,247,.2)');glow.addColorStop(1,'rgba(158,198,247,0)');
      g.fillStyle=glow;g.fillRect(0,0,VW,VH);g.restore();lightning.stats.draws++;
    }
    g.restore();
    weather.stats.passes++;weather.stats[S.scene==='stage'?'stagePasses':'overPasses']++;
    weather.last={drops,ripples,scene:S.scene,chapter:S.chapter,reducedMotion:reduced.matches,time:S.t,lightning:flash};
  };
  const nativeUpdate=update;
  update=function(dt){nativeUpdate(dt);lightning.tick();};
  const nativeSky=drawSky;
  drawSky=function(m){
    nativeSky(m);
    if(weather.active())weather.draw(m,viewFor(m));
  };
})();
