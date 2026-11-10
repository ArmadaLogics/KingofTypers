/* Reuses the eleven original Blighted Span alpha textures. No generated art.
   Keep one emitter and feed an absolute clock; actor action changes do not
   create, stop, restart or reset it. */
(function(root){
 const PERIOD=8800,INTERVAL=100;
 function random(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
 function makeSchedule(){
  const anchors=[
   {x:156,y:389,dx:-28,layer:'back'}, {x:185,y:305,dx:-24,layer:'back'},
   {x:375,y:318,dx:24,layer:'back'}, {x:490,y:430,dx:20,layer:'back'},
   {x:190,y:378,dx:-18,layer:'front'}, {x:360,y:402,dx:18,layer:'front'},
   {x:249,y:448,dx:-18,layer:'back'}, {x:362,y:424,dx:22,layer:'back'}
  ];
  const shapes=[];let previous=-1;
  for(let round=0;round<8;round++){
   const rng=random(2458+round*981),bag=Array.from({length:11},(_,i)=>i);
   for(let i=10;i>0;i--){const j=Math.floor(rng()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
   if(bag[0]===previous)[bag[0],bag[1]]=[bag[1],bag[0]];
   if(round===7&&bag[10]===shapes[0])[bag[9],bag[10]]=[bag[10],bag[9]];
   shapes.push(...bag);previous=bag[10];
  }
  return shapes.map((image,i)=>{const r=random(769+i*197),a=anchors[i%anchors.length];return{
   id:i,image,startMs:i*INTERVAL,lifeMs:1580+r()*580,
   x:a.x+(r()-.5)*13,y:a.y+(r()-.5)*9,outward:a.dx+(r()-.5)*10,
   rise:48+r()*38,size:(a.layer==='front'?125:155)+r()*45,stretch:.75+r()*.2,
   angle:(r()-.5)*.6,spin:(r()-.5)*.3,mirror:r()<.5?-1:1,
   alpha:a.layer==='front'?.62+r()*.14:.86+r()*.12,phase:r()*Math.PI*2,layer:a.layer
  };});
 }

 const allParticles=()=>makeSchedule().map(p=>({...p,region:'body'}));

 class PassiveChillEmitter{
  constructor(textures){if(textures.length!==11)throw Error('Expected all eleven existing cloud textures');this.textures=textures;this.particles=allParticles();}
  static schedule(){return allParticles();}
  static get periodMs(){return PERIOD;}
  sample(timeMs){
   const active=[];
   for(const p of this.particles){const age=((timeMs-p.startMs)%PERIOD+PERIOD)%PERIOD;if(age>=p.lifeMs)continue;
    const u=age/p.lifeMs,grow=.67+.55*u;
    active.push({...p,ageMs:age,progress:u,
     px:p.x+p.outward*u+(Math.sin(u*Math.PI*1.6+p.phase)-Math.sin(p.phase))*7,
     py:p.y-p.rise*u+Math.sin(u*Math.PI)*3,
     width:p.size*grow,height:p.size*grow*p.stretch,
     rotation:p.angle+p.spin*u,opacity:p.alpha*Math.pow(Math.sin(Math.PI*u),.8)
    });
   }
   return active;
  }
  draw(ctx,timeMs,layer){
   ctx.clearRect(0,0,640,640);ctx.imageSmoothingEnabled=true;
   for(const p of this.sample(timeMs)){
    if(p.layer!==layer||p.opacity<=0)continue;
    ctx.save();ctx.globalAlpha=p.opacity;ctx.translate(p.px,p.py);ctx.rotate(p.rotation);ctx.scale(p.mirror,1);
    ctx.drawImage(this.textures[p.image],-p.width/2,-p.height/2,p.width,p.height);ctx.restore();
   }
   // Keep the body clouds off the feet and floor, with a soft lower edge.
   const lower=ctx.getImageData(0,450,640,190),data=lower.data;
   for(let y=0;y<190;y++){
    const t=Math.max(0,Math.min(1,y/30)),fade=1-t*t*(3-2*t);
    for(let x=0;x<640;x++)data[(y*640+x)*4+3]=Math.round(data[(y*640+x)*4+3]*fade);
   }
   ctx.putImageData(lower,0,450);
   if(layer==='front'){
    // Fog crosses the entire foreground. A soft opacity limit keeps the
    // actor legible without clipping the clouds to a small shell/foot mask.
    const image=ctx.getImageData(0,0,640,640),pixels=image.data;
    for(let y=0;y<640;y++)for(let x=0;x<640;x++){
     const i=(y*640+x)*4;if(!pixels[i+3])continue;
     const r=Math.hypot((x-500)/90,(y-390)/130);
     let protection=Math.max(0,Math.min(1,(1-r)/.3));protection=protection*protection*(3-2*protection);
     const cap=Math.round(90-40*protection);pixels[i+3]=Math.min(pixels[i+3],cap);
    }
    ctx.putImageData(image,0,0);

   }
  }
  snapshot(timeMs){return this.sample(timeMs).filter(p=>p.opacity>.001).map(p=>({id:p.id,region:p.region,foot:p.foot,cloudType:p.image+1,ageMs:Math.round(p.ageMs),opacity:p.opacity,x:p.px,y:p.py}));}
 }
 root.PassiveChillEmitter=PassiveChillEmitter;
})(globalThis);
