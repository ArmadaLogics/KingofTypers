/* Cast lifetime and continuous poison exposure have separate clocks. */
(function(root){
  class FieldPoisonSkill {
    constructor(){this.release=3;this.duration=4;this.clipDuration=3.42;this.reset();}
    reset(){this.age=Infinity;}
    cast(){if(this.busy)return false;this.age=0;return true;}
    update(dt){
      if(!Number.isFinite(this.age))return {fieldSeconds:0};
      const before=this.age;
      this.age+=Math.max(0,dt);
      // Only the part of this frame after release and before expiry is exposure.
      return {fieldSeconds:Math.max(0,Math.min(this.age,this.release+this.duration)-Math.max(before,this.release))};
    }
    get casting(){return this.age<this.clipDuration-1e-9;}
    get warning(){return this.age<this.release-1e-9;}
    get warningRemaining(){return this.warning?Math.max(0,Math.round((this.release-this.age)*1e6)/1e6):0;}
    get charge(){return this.busy?Math.min(1,this.age/this.release):0;}
    get active(){return this.age+1e-9>=this.release&&this.busy;}
    get busy(){return this.age<this.release+this.duration-1e-9;}
    get remaining(){return this.active?Math.max(0,Math.round((this.release+this.duration-this.age)*1e6)/1e6):0;}
    get frame(){
      // Lift both hands, hold the summon pose during the warning, then release at zero.
      const durations=[.12,.10,.10,.12,this.release-.44,.10,.10,.10,.12];
      let time=this.age;
      for(let i=0;i<durations.length;i++){time-=durations[i];if(time<-1e-9)return i;}
      return 8;
    }
    static coverage(map){
      const cells=[];
      for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
        const c=map.grid[y][x];
        if((c.walk||c.prop)&&c.t!=='water'&&!(c.t==='door'&&c.shut))cells.push([x,y]);
      }
      return cells;
    }
  }
  class PoisonExposure {
    constructor({state={bliT:0,bliHit:0},grace=1,interval=1.4,onDamage=()=>{}}={}){
      this.state=state;this.grace=grace;this.interval=interval;this.onDamage=onDamage;
      if(!Number.isFinite(state.bliT))state.bliT=0;
      if(!Number.isInteger(state.bliHit)||state.bliHit<0)state.bliHit=0;
    }
    value(setting){return typeof setting==='function'?setting():setting;}
    get elapsed(){return this.state.bliT;}
    get nextHitIn(){return Math.max(0,this.value(this.grace)+(this.state.bliHit+1)*this.value(this.interval)-this.elapsed);}
    reset(){this.state.bliT=0;this.state.bliHit=0;}
    step(dt,exposed){
      if(!exposed){this.reset();return;}
      if(!(dt>0))return;
      this.state.bliT+=dt;
      const grace=this.value(this.grace),interval=this.value(this.interval);
      if(!(interval>0))throw Error('Poison damage interval must be positive');
      while(this.state.bliT+1e-9>=grace+(this.state.bliHit+1)*interval){
        const index=++this.state.bliHit;
        if(this.onDamage({index,exposureTime:Math.round((grace+index*interval)*1e6)/1e6})===false)break;
      }
    }
    updateSources(dt,{cloud=false,fieldSeconds=0,fieldAtEnd=false}={}){
      if(cloud){this.step(dt,true);return;} // Overlap never counts a frame twice.
      if(fieldSeconds>0){
        if(fieldAtEnd&&fieldSeconds<dt-1e-9)this.reset(); // Clean time before activation.
        this.step(fieldSeconds,true);
        if(!fieldAtEnd)this.reset(); // Field cleared and no cloud remains.
      }else this.reset();
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={FieldPoisonSkill,PoisonExposure};
  else Object.assign(root,{FieldPoisonSkill,PoisonExposure});
})(typeof window!=='undefined'?window:globalThis);
