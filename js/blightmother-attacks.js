/* Pure timing/collision for Blightmother's normal attacks. The native controller owns HP and drawing. */
(function(root){
 class BlightmotherAttacks{
  constructor({owner,player,damage,canTravel}){Object.assign(this,{owner,player,damage,canTravel});this.clear();}
  clear(){this.cast=null;this.projectiles=[];this.meteors=[];this.bounces=[];this.bursts=[];this.wait=2;this.next='bounce';this.started=0;this.counts={projectile:0,meteor:0,bounce:0};}
  get busy(){return !!this.cast;}
  get hazards(){return !!(this.projectiles.length||this.meteors.length||this.bounces.length);}
  begin(){const p=this.player(),dx=p.x-this.owner.x,dy=p.y-this.owner.y,len=Math.hypot(dx,dy)||1;
   const origin={x:this.owner.x+dx/len*35,y:this.owner.y+dy/len*35,level:this.owner.level};
   this.cast={kind:this.next,age:0,released:false,target:{x:p.x,y:p.y,level:p.level},origin,duration:this.next==='meteor'?1.62:1.35};
   if(this.next==='bounce')this.cast.landing=this.landing(origin,p);
   this.next={bounce:'projectile',projectile:'meteor',meteor:'bounce'}[this.next];this.started++;
  }
  get frame(){if(!this.cast)return 0;const times=this.cast.kind!=='meteor'?[.12,.1,.1,.48,.1,.1,.1,.12,.13]:[.12,.1,.1,.12,.76,.1,.1,.1,.12];let age=this.cast.age;for(let i=0;i<times.length;i++){age-=times[i];if(age<-1e-9)return i;}return 8;}
  landing(from,target){
   const dx=target.x-from.x,dy=target.y-from.y,len=Math.hypot(dx,dy),distance=Math.min(190,len),n=Math.max(1,Math.ceil(distance/6));
   let last=this.canTravel(from.x,from.y,from.level)?{x:from.x,y:from.y}:null;
   for(let i=1;i<=n;i++){const k=len?distance/len*i/n:0,x=from.x+dx*k,y=from.y+dy*k;if(!this.canTravel(x,y,from.level))break;last={x,y};}
   return last;
  }
  bouncePose(b){const k=Math.min(1,b.age/.72);return {x:b.from.x+(b.to.x-b.from.x)*k,y:b.from.y+(b.to.y-b.from.y)*k,height:Math.sin(Math.PI*k)*76+(b.hop===1?64*(1-k):0),progress:k};}
  release(c){c.released=true;this.counts[c.kind]++;
   if(c.kind==='projectile'){const dx=c.target.x-this.owner.x,dy=c.target.y-this.owner.y,len=Math.hypot(dx,dy)||1;this.projectiles.push({x:this.owner.x+dx/len*35,y:this.owner.y+dy/len*35,level:this.owner.level,dx:dx/len,dy:dy/len,age:0});}
   else if(c.kind==='bounce'){if(c.landing)this.bounces.push({from:{...c.origin},to:{...c.landing},level:c.origin.level,age:0,hop:1});}
   else this.meteors.push({...c.target,age:0,hit:false});
  }
  update(dt,{canCast=true,held=false}={}){let left=Math.max(0,dt);while(left>1e-9){const step=Math.min(.02,left);this.step(step,canCast,held);left-=step;}}
  step(dt,canCast,held){
   this.bursts=this.bursts.filter(b=>(b.age+=dt)<(b.kind==='meteor'?.48:.36));
   const player=this.player();
   this.bounces=this.bounces.filter(b=>{
    b.age+=dt;if(b.age<.72-1e-9)return true;
    this.bursts.push({kind:'bounce',x:b.to.x,y:b.to.y,age:0});
    if(player.level===b.level&&Math.hypot(player.x-b.to.x,player.y-b.to.y)<=48){this.damage('Blightmother bouncing poison',10);return false;}
    if(b.hop>=3)return false;
    b.from={...b.to,level:b.level};b.to=this.landing(b.from,player);if(!b.to)return false;
    b.age=Math.max(0,b.age-.72);b.hop++;return true;
   });
   this.projectiles=this.projectiles.filter(p=>{
    p.age+=dt;const x=p.x+p.dx*240*dt,y=p.y+p.dy*240*dt;
    if(!this.canTravel(x,y,p.level)||p.age>4.5){this.bursts.push({kind:'projectile',x:p.x,y:p.y,age:0});return false;}
    const vx=x-p.x,vy=y-p.y,len=vx*vx+vy*vy,q=len?Math.max(0,Math.min(1,((player.x-p.x)*vx+(player.y-p.y)*vy)/len)):0;
    if(player.level===p.level&&Math.hypot(player.x-(p.x+vx*q),player.y-(p.y+vy*q))<=23){this.damage('Blightmother poison projectile',10);this.bursts.push({kind:'projectile',x:player.x,y:player.y,age:0});return false;}
    p.x=x;p.y=y;return true;
   });
   this.meteors=this.meteors.filter(m=>{m.age+=dt;if(m.age+1e-9>=.6&&!m.hit){m.hit=true;
     this.bursts.push({kind:'meteor',x:m.x,y:m.y,age:0});
     if(player.level===m.level&&Math.hypot(player.x-m.x,player.y-m.y)<=76)this.damage('Blightmother poison meteor',20);
    }return m.age<.6-1e-9;});
   if(this.cast){if(held)return;const c=this.cast;c.age+=dt;
    if(!c.released&&c.age+1e-9>=(c.kind==='meteor'?1.2:.8))this.release(c);
    if(c.age+1e-9>=c.duration){this.cast=null;this.wait=3;}return;
   }
   if(!canCast||held)return;
   this.wait-=dt;if(this.wait<=1e-9)this.begin();
  }
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={BlightmotherAttacks};else root.BlightmotherAttacks=BlightmotherAttacks;
})(typeof window!=='undefined'?window:globalThis);
