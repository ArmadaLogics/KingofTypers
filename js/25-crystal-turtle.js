/* Accepted crystal turtle sprites in the real encounter, enabled only by its preview URL. */
(()=>{
 if(location.hash!=='#crystal-turtle-demo')return;
 const D=window.CrystalTurtle={ready:false,source:'CrystalWalk-v3 / CrystalBite-v1 / CrystalDownpourSequence-v2 / CrystalPassiveChill-v8'};
 const SCALE=100/380,ROOT='assets/bosses/crystal-turtle/';
 const durations={walk:Array(8).fill(180),bite:[180,120,120,110,100,70,90,100,90,100,100,420],cast:[120,180,240,240,420,300,180,180,420]};
 const read=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Cannot load crystal turtle sprite: '+src));image.src=src;});
 const load=(folder,prefix,count)=>Promise.all(Array.from({length:count},(_,i)=>read(ROOT+folder+'/'+prefix+String(i+1).padStart(2,'0')+'.png')));
 const make=()=>Object.assign(document.createElement('canvas'),{width:640,height:640});
 const back=make(),front=make(),cache=new WeakMap();let images,emitter,effectFrame=-1;
 function frameAt(ms,ds,loop=false){const total=ds.reduce((a,b)=>a+b,0);ms=loop?((ms%total)+total)%total:Math.max(0,Math.min(total-1,ms));let sum=0;for(let i=0;i<ds.length;i++){sum+=ds[i];if(ms<sum)return i;}return ds.length-1;}
 function group(st){if(['snapW','neck'].includes(st))return'bite';if(['rear','spit','gurgle'].includes(st))return'spit';if(['suWind','suGey','suRain','winded'].includes(st))return'super';return st;}
 D.drawShadow=function(x,y,frame,flip){
  const sheet=SHEET.tuIn,image=IMG.tuIn;if(!image?.complete)return;
  const sourceFrame=sheet.n-1;
  if(!D.shadowAtlas){
   const atlas=document.createElement('canvas');atlas.width=atlas.height=sheet.fs;
   const ctx=atlas.getContext('2d');ctx.drawImage(image,sourceFrame*sheet.fs,0,sheet.fs,sheet.fs,0,0,sheet.fs,sheet.fs);
   const shadow=ctx.getImageData(0,0,atlas.width,atlas.height),pixels=shadow.data;
   // The closed-shell sprite exposes both edges of the original broad oval.
   // Restore the interior hidden by that body instead of copying disconnected
   // exposed fragments onto a differently shaped creature.
   for(let y=0;y<sheet.fs;y++){
    let left=sheet.fs,right=-1,rgba;
    for(let x=0;x<sheet.fs;x++){const i=(y*sheet.fs+x)*4;if(pixels[i+3]===69){left=Math.min(left,x);right=x;rgba=pixels.slice(i,i+4);}}
    for(let x=0;x<sheet.fs;x++){const i=(y*sheet.fs+x)*4;if(x>=left&&x<=right)pixels.set(rgba,i);else pixels[i+3]=0;}
   }
   ctx.putImageData(shadow,0,0);D.shadowAtlas=atlas;
  }
  // The crystal torso covers the native shadow at the old body's anchor.
  // Lower the same pixels to the crystal feet; leave their size and opacity intact.
  const groundOffset=12;
  g.save();g.translate(Math.round(x),Math.round(y)+groundOffset);if(flip)g.scale(-1,1);
  g.drawImage(D.shadowAtlas,-sheet.fs/2,-sheet.fs/2-sheet.foot);g.restore();
  return {source:'tuIn',sourceFrame,rgba:[22,28,46,69],groundOffset,restoredFootprint:true};
 };
 const facing=m=>m.x>P.x;
 D.mouth=(m,out)=>({x:m.x+(facing(m)?-1:1)*(out?59:55),y:m.y-28});
 D.body=function(m,x,y){
  if(!D.ready||!m.turt)return false;
  const st=m.boss?.st||'walk',kind=group(st);let pose=cache.get(m);
  if(!pose){pose={kind,start:S.t,frame:0,set:'walk',flip:m.x>P.x};cache.set(m,pose);}
  if(!(m.frzT>0)){
   if(pose.kind!==kind){pose.kind=kind;pose.start=S.t;}
   const elapsed=(S.t-pose.start)*1000;pose.set='walk';pose.frame=0;pose.flip=facing(m);
   if(st==='walk'&&!m.dead&&(Math.hypot(m.dirx||0,m.diry||0)>.01||m.moving))pose.frame=frameAt(elapsed,durations.walk,true);
   else if(kind==='bite'){pose.set='bite';const phase=Math.max(0,Math.min(1,1-(m.boss.t/(m.boss.t0||1))));pose.frame=frameAt(st==='snapW'?phase*630:630+phase*970,durations.bite);}
   else if(kind==='super'||kind==='spit'){
    const ms=kind==='spit'?(st==='rear'?Math.max(0,1-m.boss.t/(m.boss.t0||1))*1200:1200+Math.max(0,elapsed-600)):elapsed;
    if(ms<2280){pose.set='cast';pose.frame=frameAt(ms,durations.cast);}
   }
  }
  // One shared clock for the aura; changing attacks never restarts its emission.
  const effectMs=S.t*1000,ef=Math.floor(effectMs/100);
  if(ef!==effectFrame){emitter.draw(back.getContext('2d'),effectMs,'back');emitter.draw(front.getContext('2d'),effectMs,'front');effectFrame=ef;}
  const shadow=D.drawShadow(x,y,pose.set==='walk'?pose.frame:0,pose.flip);
  g.save();g.translate(Math.round(x),Math.round(y));g.scale(pose.flip?-SCALE:SCALE,SCALE);g.translate(-320,-530);
  g.drawImage(back,0,0);g.save();
  if(st==='belly'){g.translate(0,680);g.scale(1,-1);}
  if(pose.set==='cast'){
   // A fixed action transform keeps the casting feet on the walk's ground row.
   g.translate(320,530);g.scale(1.12,1.12);g.translate(-320,-500);
  }
  g.drawImage(images[pose.set][pose.frame],0,0);g.restore();g.drawImage(front,0,0);g.restore();
  D.lastDraw={state:st,set:pose.set,frame:pose.frame,frozen:m.frzT>0,effectMs,shadow};return true;
 };
 D.smokeFloorAlpha=function(){return [back,front].map(c=>{const d=c.getContext('2d').getImageData(0,480,640,160).data;let a=0;for(let i=3;i<d.length;i+=4)a+=d[i];return a;});};
 Promise.all([load('walk','turtle-walk-',8),load('bite','turtle-bite-',12),load('cast','turtle-super-',9),load('clouds','chill-cloud-',11)]).then(([walk,bite,cast,clouds])=>{images={walk,bite,cast};emitter=new PassiveChillEmitter(clouds);D.ready=true;}).catch(error=>{D.error=error.message;console.error(error);});
})();
