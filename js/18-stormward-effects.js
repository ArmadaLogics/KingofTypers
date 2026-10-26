/* Approved Chapter IV lightning and field shock, using the native storm and boss targeting. */
(() => {
  const D=window.StormwardFX={ready:false,error:null,impacts:[],fieldDelay:.24,
    images:{},stats:{bolt:0,field:0,warning:0},frames:{bolt:[],field:[]}};
  const specs={
    bolt:{src:'assets/effects/stormward/lightning-v2.png',times:[.055,.055,.080,.065,.075,.110],
      anchors:[[135.66427712451394,236.29377058744205],[133.13246994856442,235.42324962820533],[136.7632313243997,237.0436873674937],[141.4552200351569,227.34387251502744],[133.49948872558534,224.88562718386004],[133.52900355550744,224.7766256971141]]},
    field:{src:'assets/effects/stormward/field-shock.png',times:[.060,.060,.080,.070,.080,.120],
      anchors:[[128.62111118192493,137.88172812616907],[128.89099671429815,137.8895811979965],[128.81489482846976,141.85919385589568],[128.84923111296266,128.0300445963687],[129.43966387644159,128.00488841547426],[131.5919704312081,127.33617146630208]]}
  };
  const byStrike=new WeakMap();let lastMap=null,lastTime=S.t;
  D.active=()=>D.ready&&S.chapter===3&&S.scene==='stage';
  function sync(){
    if(W!==lastMap||S.t<lastTime||S.chapter!==3||S.scene!=='stage')D.impacts=[];
    lastMap=W;lastTime=S.t;
  }
  D.fieldReady=function(strike){
    sync();if(!D.active())return true;
    let impact=byStrike.get(strike);
    if(!impact){
      impact={x:strike.x,y:strike.y,born:S.t,fieldBorn:null,strike};
      byStrike.set(strike,impact);D.impacts.push(impact);
      if(window.StormwardThunder)StormwardThunder.strike(strike);
      else{blip(90,.35,'sawtooth',.10,40);noise(.28,.09,900);}
    }
    return S.t-impact.born+1e-9>=D.fieldDelay;
  };
  D.queueStrike=function(x,y,onField){
    if(!D.active())return false;
    const strike={x,y,t:0,onStormField:onField};S.strikes.push(strike);D.fieldReady(strike);return strike;
  };
  D.warningViews=function(){
    if(!D.active())return [];
    const boss=window.Bosses?.cur;
    const rings=boss?.key==='SM'&&!boss.m.dead?boss.st.rings.filter(ring=>!ring.done):[];
    return [...S.strikes.filter(strike=>!strike.done),...rings].map(strike=>{
      const impact=byStrike.get(strike),phase=impact?'field':'thunder';
      const duration=impact?D.fieldDelay:nodeTele();
      const remaining=Math.max(0,impact?D.fieldDelay-(S.t-impact.born):strike.t);
      return {x:strike.x,y:strike.y,radius:nodeRing(),groundRatio:STK_K,phase,duration,remaining,
        turned:!!strike.turned,fraction:Math.max(0,Math.min(1,remaining/duration))};
    });
  };
  function frameAt(kind,time){
    const times=specs[kind].times;if(time<0)return -1;
    for(let frame=0;frame<times.length;frame++){time-=times[frame];if(time<0)return frame;}
    return -1;
  }
  function stamp(kind,frame,x,y,width,height){
    if(frame<0)return;
    const anchor=specs[kind].anchors[frame];
    g.save();g.imageSmoothingEnabled=false;
    g.drawImage(D.images[kind],frame*256,0,256,256,x-anchor[0]/256*width,y-anchor[1]/256*height,width,height);
    g.restore();D.stats[kind]++;
    if(!D.frames[kind].includes(frame))D.frames[kind].push(frame);
  }
  D.drawGround=function(cam){
    sync();if(!D.active())return;
    for(const warning of D.warningViews()){
      const radius=warning.radius,color=warning.turned?'#e8adf5':warning.phase==='thunder'?'#ffd46b':'#ffad59';
      g.save();g.translate(warning.x-cam.x,warning.y-cam.y);g.scale(1,warning.groundRatio);
      g.fillStyle=warning.turned?'rgba(232,173,245,.09)':'rgba(255,185,58,.09)';
      g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.fill();
      g.strokeStyle='rgba(35,24,8,.9)';g.lineWidth=6;
      g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.stroke();
      g.strokeStyle=color;g.lineWidth=3;
      g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.stroke();
      g.strokeStyle='#fff1bf';g.lineWidth=2.5;
      g.beginPath();g.arc(0,0,Math.max(3,radius*warning.fraction),0,Math.PI*2);g.stroke();
      g.restore();D.stats.warning++;
    }
    for(const impact of D.impacts){
      if(impact.fieldBorn==null)continue;
      const size=nodeRing()*2.10;
      stamp('field',frameAt('field',S.t-impact.fieldBorn),impact.x-cam.x,impact.y-cam.y,size,size);
    }
  };
  D.drawAir=function(cam){
    if(!D.active())return;
    for(const impact of D.impacts)stamp('bolt',frameAt('bolt',S.t-impact.born),impact.x-cam.x,impact.y-cam.y,300,300);
  };
  const nativeStorm=stormTick;
  stormTick=function(dt){
    sync();nativeStorm(dt);
    for(const impact of D.impacts)if(impact.strike.done&&impact.fieldBorn==null){
      impact.fieldBorn=S.t;
      const onField=impact.strike.onStormField;impact.strike.onStormField=null;
      if(onField)onField();
    }
    D.impacts=D.impacts.filter(impact=>S.t-impact.born<D.fieldDelay+.55);
  };
  Promise.all(Object.entries(specs).map(([kind,spec])=>new Promise((resolve,reject)=>{
    const image=D.images[kind]=new Image();image.onload=resolve;image.onerror=()=>reject(Error('Cannot load '+spec.src));image.src=spec.src;
  }))).then(()=>{D.ready=true;}).catch(error=>{
    D.error=error.message;console.warn('Stormward sprites unavailable; native storm effects remain active.',error);
  });
})();
