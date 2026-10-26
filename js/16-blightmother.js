/* Chapter III Blightmother. Native campaign AI/hazard/render hooks; no loop replacement. */
(() => {
  const poison=new FieldPoisonSkill();
  const OPENING_DELAY=12,SUPER_COOLDOWN=20;
  let attacks=null,current=null,exposure=null,map=null,coverageMask,poisonLayer,poisonTiles=[],clouds=[];
  const D=window.Blightmother={get current(){return current;},get attacks(){return attacks;},skill:poison};
  const stage=()=>S.scene==='stage'&&S.chapter===2&&!S.endless;
  const alive=()=>stage()&&current&&!current.m.dead&&mobs.includes(current.m);
  function clear(){attacks?.clear();attacks=null;poison.reset();current=null;map=null;coverageMask=null;poisonLayer=null;clouds=[];}
  function start(c){
    clear();current=c;c.st.bm={wait:OPENING_DELAY,moveAge:0,normalAtLast:0};
    attacks=new BlightmotherAttacks({owner:c.m,player:()=>P,damage:normalDamage,canTravel:(x,y,level)=>{const cell=cellAt(W,x,y);return !!cell&&cell.walk&&!cell.shut&&cell.level===level;}});
    c.onDead=()=>{poison.reset();attacks?.clear();};
    toast('BLIGHTMOTHER — dodge the bouncing poison landings and aimed bolts, leave the meteor marker, and watch for the occasional arena-wide poison warning.',3);
  }
  function tick(m,dt){
    if(m.tier!=='BM')return false;
    m.wind=m.swing=0;
    if(!alive()||m!==current.m)return true;
    if(m.stagger>0)m.stagger=Math.max(0,m.stagger-dt);
    if(poison.casting||attacks?.busy||m.stagger>0||m.stun>0||m.frzT>0)return true;
    const st=current.st.bm;st.moveAge+=dt;
    let [dx,dy]=flowStep(W,m);
    // Approach through the native collision/flow field, stopping clear of the player.
    if(m.level===P.level&&Math.hypot(m.x-P.x,m.y-P.y)<140){dx=0;dy=0;}
    for(const other of mobs){if(other===m||other.dead||other.door||other.supply||other.level!==m.level)continue;
      const x=m.x-other.x,y=m.y-other.y,d=Math.hypot(x,y),r=Math.max(m.sep||54,other.sep||34);
      if(d>.001&&d<r){dx+=x/d*(r-d)/r*.45;dy+=y/d*(r-d)/r*.45;}}
    const length=Math.hypot(dx,dy)||1;m.dirx=dx/length;m.diry=dy/length;
    const scale=(m.chill>0?nodeFrzMul():1)*(m.lit>0?nodeBurnMul():1)*(typeof beadMul==='function'?beadMul(m):1);
    moveEntity(W,m,m.dirx*m.spd*scale*dt,m.diry*m.spd*scale*dt,11,false);
    return true;
  }
  function poisonTick(dt){
    if(!stage()){if(current)clear();return false;}
    if(current&&!alive()){poison.reset();attacks?.clear();}
    if(!exposure||exposure.state!==S)exposure=new PoisonExposure({state:S,grace:nodeGrace,interval:nodeTick,onDamage:()=>{
      sWard();S.flash=.4;S.shake=Math.max(S.shake||0,4);blip(150,.22,'sawtooth',.06,90);
      return !loseWard('Blightmother poison',DMG_HAZ.blight)&&S.scene==='stage';
    }});
    let span=0;
    if(alive()){
      const m=current.m,st=current.st.bm;
      // Freeze/interrupts hold a pending cast. A released field keeps its lifetime.
      const held=(m.jobStop||0)>S.t||m.frzT>0||m.stun>0||m.stagger>0;
      if(poison.busy){if(!poison.warning||!held)span=poison.update(dt).fieldSeconds;}
      else {
        if(!held)st.wait=Math.max(0,st.wait-dt);
      }
      attacks.update(dt,{canCast:!poison.busy&&st.wait>3,held});
      // Reserve the last three recharge seconds for hazards to clear. The super
      // never replaces the normal rotation or starts over a bolt/meteor.
      if(!poison.busy&&!held&&st.wait<=1e-9&&!attacks.busy&&!attacks.hazards&&attacks.started-st.normalAtLast>=2){
        poison.cast();st.wait=SUPER_COOLDOWN;st.normalAtLast=attacks.started;blip(240,.3,'triangle',.06,90);
      }
    }
    const c=cellAt(W,P.x,P.y),covered=!!c&&(c.walk||c.prop)&&c.t!=='water'&&!(c.t==='door'&&c.shut);
    exposure.updateSources(dt,{cloud:c?.t==='blight',fieldSeconds:covered?span:0,fieldAtEnd:covered&&poison.active});
    return true;
  }
  function normalDamage(cause,amount){
    if(!alive()||S.iframe>0||S.ward<=0)return;
    sWard();S.flash=.4;S.shake=Math.max(S.shake||0,5);S.iframe=nodeIframe();
    loseWard(cause,amount,current.m);
  }
  function body(m,x,y){
    if(m.tier!=='BM')return false;
    const st=current?.m===m?current.st.bm:null;
    const casting=!!st&&poison.casting,basic=attacks?.cast;
    const key=casting?'bmCast':basic?(basic.kind==='meteor'?'bmCast':'bmBoltCast'):'bmFloat';
    const frame=casting?poison.frame:basic?attacks.frame:Math.floor((st?.moveAge||0)/.17)%16;
    const pose=m.frzT>0&&m.frzPose?m.frzPose:{key,frame,dx:0,dy:0,flip:basic?m.x>basic.target.x:m.x>P.x};
    if(!(m.frzT>0))m.icePose={...pose};
    g.save();g.fillStyle='rgba(10,14,12,.25)';g.beginPath();g.ellipse(x,y-2,38,11,0,0,Math.PI*2);g.fill();g.restore();
    sprite(pose.key,pose.frame,x+pose.dx,y+pose.dy,pose.flip);return true;
  }
  function status(c){
    if(poison.warning)return ['POISON FIELD IN '+poison.warningRemaining.toFixed(1)+'s','Arena-wide poison · lasts 4 seconds · type or Freeze her','#f1d392'];
    if(poison.active)return ['POISON FIELD ACTIVE · '+poison.remaining.toFixed(1)+'s','Continuous exposure · overlapping clouds never double damage','#c8ef79'];
    if(attacks?.cast?.kind==='bounce')return ['BOUNCING POISON · '+(attacks.cast.released?'RELEASED':'CASTING'),'Three hops · move clear before the ball lands','#c7f181'];
    if(attacks?.cast){const a=attacks.cast,meteor=a.kind==='meteor';return [meteor?'POISON METEOR · IMPACT IN '+Math.max(0,1.8-a.age).toFixed(1)+'s':'POISON BOLT · '+(a.released?'RELEASED':'CASTING'),meteor?'Leave the marked circle · the target stays where it was aimed':'Dodge the projectile · it does not home','#d5e991'];}
    if(attacks?.meteors.length)return ['POISON METEOR · IMPACT IN '+Math.max(0,.6-attacks.meteors[0].age).toFixed(1)+'s','Leave the marked circle','#e8c97a'];
    if(attacks?.bounces.length){const b=attacks.bounces[0];return ['BOUNCING POISON · HOP '+b.hop+' / 3','Next landing in '+Math.max(0,.72-b.age).toFixed(1)+'s · it aims again after landing','#c7f181'];}
    if(c.last)return ['LAST WORD '+(4-c.lastN)+' OF 3','Type all three names · another poison cast is still possible','#ff9577'];
    return ['FLOATING · NEXT NORMAL CAST IN '+Math.max(0,attacks?.wait||0).toFixed(1)+'s','Super recharge: '+Math.max(0,c.st.bm.wait).toFixed(1)+'s · 3-second warning before release','#a0b18c'];
  }
  function meter(){
    if(!alive()||!poison.busy)return;
    const w=440,x=Math.round(VW/2-w/2);g.save();
    g.fillStyle=poison.warning?'#f1d392':'#b2dc65';
    g.fillRect(x+1,83,(w-2)*(poison.warning?poison.charge:poison.remaining/poison.duration),3);g.restore();
  }
  function preparePoison(){
    poisonTiles=FieldPoisonSkill.coverage(W);
    coverageMask=document.createElement('canvas');coverageMask.width=W.w*T;coverageMask.height=W.h*T;
    const mask=coverageMask.getContext('2d');mask.fillStyle='#fff';
    for(const [x,y] of poisonTiles)mask.fillRect(x*T,y*T,T,T);
    poisonLayer=document.createElement('canvas');poisonLayer.width=coverageMask.width;poisonLayer.height=coverageMask.height;
    clouds=[];
    for(let i=1;i<=11;i++){
      const image=IMG['poisonCloud'+String(i).padStart(2,'0')];
      if(!image?.naturalWidth)continue;
      const texture=document.createElement('canvas');texture.width=image.naturalWidth;texture.height=image.naturalHeight;
      const ctx=texture.getContext('2d');ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,texture.width,texture.height).data;
      let left=texture.width,top=texture.height,right=-1,bottom=-1;
      for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++)if(pixels[(y*texture.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      ctx.globalCompositeOperation='source-in';ctx.fillStyle='#b2d64e';ctx.fillRect(0,0,texture.width,texture.height);
      if(right>=left){const crop=document.createElement('canvas');crop.width=right-left+1;crop.height=bottom-top+1;crop.getContext('2d').drawImage(texture,left,top,crop.width,crop.height,0,0,crop.width,crop.height);clouds.push(crop);}
    }
  }
  function drawPoison(){
    if(!poison.active)return;
    const p=poisonLayer.getContext('2d'),time=S.t;
    p.clearRect(0,0,poisonLayer.width,poisonLayer.height);
    p.fillStyle='rgba(84,128,24,.55)';p.fillRect(0,0,poisonLayer.width,poisonLayer.height);
    // Native cloud art moves over a continuous floor wash, clipped to the arena's land.
    if(clouds.length){
      p.globalAlpha=.4;p.imageSmoothingEnabled=false;
      for(let y=0;y<poisonLayer.height;y+=100)for(let x=0;x<poisonLayer.width;x+=130){
        const index=(Math.floor(x/130)*7+Math.floor(y/100)*3)%clouds.length;
        const dx=Math.sin(time*1.4+x*.013+y*.007)*18,dy=Math.cos(time*1.1+y*.011)*13;
        p.drawImage(clouds[index],x-70+dx,y-65+dy,250,190);
      }
      p.globalAlpha=1;
    }
    // Staggered rising plumes give the release a visible eruption instead of only a tint.
    if(clouds.length)for(let i=0;i<poisonTiles.length;i+=7){
      const [x,y]=poisonTiles[i],age=poison.age-poison.release,phase=(age*1.8+i*.137)%1;
      const size=60+phase*45;
      p.globalAlpha=.5*Math.sin(Math.PI*phase);
      p.drawImage(clouds[i%clouds.length],(x+.5)*T-size/2,(y+.5)*T-25-phase*38,size,size*.85);
    }
    p.globalAlpha=1;p.globalCompositeOperation='destination-in';p.drawImage(coverageMask,0,0);p.globalCompositeOperation='source-over';
    g.drawImage(poisonLayer,0,0);
    // Scattered native poison-bubble frames stay below the boss and vanish with the field.
    if(IMG.poisonBubbles?.naturalWidth){
      for(let i=0;i<poisonTiles.length;i+=7){
        const [x,y]=poisonTiles[i],phase=(time*1.2+i*.173)%1,frame=Math.min(3,Math.floor(phase*4));
        const size=20+phase*18;
        g.save();g.globalAlpha=.8*(1-phase*.5);
        g.drawImage(IMG.poisonBubbles,frame*64,0,64,64,(x+.5)*T-size/2,(y+.5)*T-size/2-phase*16,size,size);g.restore();
      }
    }
  }

  function drawChargeGround(b){
    if(!poison.warning)return;
    const charge=poison.charge,time=S.t;
    g.save();g.translate(b.x,b.y);g.scale(1,.4);
    g.strokeStyle='#d4ee84';g.lineWidth=2;g.globalAlpha=.65+charge*.3;
    for(const [radius,spin]of [[76,1],[57,-1]]){
      g.save();g.rotate(time*.45*spin);g.setLineDash([18,9]);g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.stroke();g.restore();
    }
    g.setLineDash([]);g.strokeStyle='#f1d392';g.lineWidth=3;
    g.beginPath();g.arc(0,0,84,-Math.PI/2,-Math.PI/2+Math.PI*2*charge);g.stroke();
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5+time*.2,x=Math.cos(a)*67,y=Math.sin(a)*67;
      g.save();g.translate(x,y);g.rotate(a);g.strokeRect(-4,-4,8,8);g.restore();
    }
    g.restore();
  }
  function drawChargeAir(b,lift){
    if(!poison.warning)return;
    const charge=poison.charge,time=S.t,cx=b.x,cy=b.y-192-lift;
    g.save();g.imageSmoothingEnabled=false;
    // Angular orbiting motes spiral into the orb above the raised hands.
    for(let i=0;i<26;i++){
      const phase=(time*.7+i/26)%1,a=i*2.399+time*1.8,radius=(1-phase)*(95-charge*20)+9;
      const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.55+(1-phase)*85;
      g.globalAlpha=.25+phase*.7;g.fillStyle=i%3?'#b9ef65':'#f2e7a2';
      const size=phase>.7?4:3;g.fillRect(Math.round(x),Math.round(y),size,size);
    }
    g.globalAlpha=1;
    const size=25+charge*39;
    g.fillStyle='rgba(48,75,20,.9)';g.strokeStyle='#d7ff8a';g.lineWidth=2;
    g.beginPath();g.arc(cx,cy,size*.36,0,Math.PI*2);g.fill();g.stroke();
    if(IMG.poisonBubbles?.naturalWidth)g.drawImage(IMG.poisonBubbles,(Math.floor(time*9)%4)*64,0,64,64,cx-size/2,cy-size/2,size,size);
    g.strokeStyle='#d9ffa4';g.lineWidth=2;g.setLineDash([6,5]);
    g.beginPath();g.ellipse(cx,cy,size*.68,size*.25,time*.8,0,Math.PI*2);g.stroke();g.restore();
  }
  function drawRelease(b){
    if(!poison.active)return;
    const age=poison.age-poison.release;
    if(age>.65)return;
    g.save();g.translate(b.x,b.y);g.scale(1,.6);
    for(let i=0;i<3;i++){
      const phase=Math.max(0,age-i*.07)/.65;
      if(phase<=0)continue;
      g.globalAlpha=Math.max(0,1-phase)*.9;g.lineWidth=10*(1-phase)+2;g.strokeStyle=i%2?'#e4ffb6':'#a8e253';
      g.beginPath();g.arc(0,0,38+phase*1500,0,Math.PI*2);g.stroke();
    }
    g.restore();
  }


  function meteorMarker(x,y,charge){
    g.save();g.translate(x,y);g.strokeStyle='#e5c86c';g.fillStyle='rgba(128,166,36,.18)';g.lineWidth=2;
    g.beginPath();g.arc(0,0,76,0,Math.PI*2);g.fill();g.stroke();
    g.strokeStyle='#e6ff8d';g.lineWidth=4;g.beginPath();g.arc(0,0,76,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,charge));g.stroke();
    g.rotate(S.t*.8);g.setLineDash([12,8]);g.lineWidth=2;g.beginPath();g.arc(0,0,58,0,Math.PI*2);g.stroke();
    g.setLineDash([]);g.beginPath();g.moveTo(-12,0);g.lineTo(12,0);g.moveTo(0,-12);g.lineTo(0,12);g.stroke();g.restore();
  }
  function drawNormalGround(){
    const a=attacks?.cast;if(a?.kind==='meteor')meteorMarker(a.target.x,a.target.y,a.age/1.8);
    for(const m of attacks?.meteors||[])meteorMarker(m.x,m.y,(1.2+m.age)/1.8);
    for(const b of attacks?.bounces||[]){
      const p=attacks.bouncePose(b),size=24*(1-p.height/220);
      g.save();g.fillStyle='rgba(10,24,8,.35)';g.beginPath();g.ellipse(p.x,p.y,size,size*.36,0,0,Math.PI*2);g.fill();g.restore();
    }
  }
  function poisonGlob(x,y,progress){
    const im=IMG.poisonBubbles;if(!im?.naturalWidth)return;
    const landing=Math.max(0,(progress-.8)/.2),w=160*(1+landing*.25),h=160*(1-landing*.22),frame=Math.floor(S.t*8)%2;
    g.save();g.imageSmoothingEnabled=false;g.drawImage(im,frame*64,0,64,64,x-w/2,y-h/2,w,h);g.restore();
  }
  function effect(key,frame,x,y,px,py,scale=1,angle=0){
    const im=IMG[key];if(!im?.naturalWidth)return;
    g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);g.imageSmoothingEnabled=false;
    g.drawImage(im,frame*192,0,192,192,-px,-py,192,192);g.restore();
  }
  function drawNormalAir(){
    if(!attacks)return;
    const a=attacks.cast;if(a?.kind==='projectile'&&!a.released){const m=current.m,dir=a.target.x<m.x?-1:1;
      effect('bmBoltLaunch',Math.min(3,Math.floor(a.age/.2)),m.x+dir*42,m.y-74,136,96,.7,dir<0?Math.PI:0);}
    if(a?.kind==='bounce'&&!a.released)poisonGlob(a.origin.x,a.origin.y-64,0);
    for(const b of attacks.bounces){const p=attacks.bouncePose(b);poisonGlob(p.x,p.y-p.height,p.progress);}
    for(const p of attacks.projectiles){const launch=p.age<.32,key=launch?'bmBoltLaunch':'bmBoltFlight';
      const f=launch?Math.min(3,Math.floor(p.age/.08)):Math.floor((p.age-.32)/.08)%8;
      effect(key,f,p.x,p.y-55,136,96,.8,Math.atan2(p.dy,p.dx));}
    for(const m of attacks.meteors){const k=Math.min(1,m.age/.6);effect('bmMeteorFall',Math.floor(m.age/.04)%8,m.x-(1-k)*150,m.y-(1-k)*280,136,144,1.1);}
    for(const b of attacks.bursts){if(b.kind==='meteor')effect('bmMeteorImpact',Math.min(7,Math.floor(b.age/.06)),b.x,b.y,96,142,1.1);
      else if(b.kind==='bounce'){const f=b.age<.06?0:b.age<.14?1:b.age<.24?2:3;effect('bmBoltImpact',f,b.x,b.y,96,96,.65);}
      else {const f=b.age<.06?0:b.age<.14?1:b.age<.24?2:3;effect('bmBoltImpact',f,b.x,b.y-55,96,96,.8);}}
  }

  function ground(){if(!alive())return;if(map!==W||!coverageMask){preparePoison();map=W;}
    drawPoison();drawChargeGround(current.m);drawRelease(current.m);drawNormalGround();}
  function air(){if(alive()){drawChargeAir(current.m,0);drawNormalAir();}}
  Object.assign(D,{start,tick,poisonTick,body,status,meter,ground,air,clear});
  const oldEnter=enterStage;enterStage=function(...args){clear();exposure=null;return oldEnter(...args);};
})();
