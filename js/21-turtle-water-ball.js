/* Downpour keeps its original three falling volleys; each water ball now freezes. */
(()=>{
 const D=window.TurtleBall={};
 const FREEZE=.8;
 D.frozen=()=>S.scene==='stage'&&(S.tw?.freeze||0)>0;
 D.start=function(owner){
  const tw=S.tw||(S.tw=twNew());
  tw.rain={per:TT.SU_PER[owner.boss?.last?1:0],waves:TT.SU_WAVES,t:-TT.SU_WIND-TT.SU_GEY,
   plan:[],hits:0,dim:0,streaks:[],owner};
  return tw.rain;
 };
 D.tick=function(dt){
  const tw=S.tw;if(!tw)return;
  const cancelled=S.scene!=='stage'||tw.rain?.owner.dead;
  if(cancelled){
   tw.rain=null;tw.up=null;
   for(const ball of tw.balls)if(ball.kind==='rain')ball.ring.done=true;
   tw.balls=tw.balls.filter(ball=>ball.kind!=='rain');tw.rings=tw.rings.filter(r=>r.kind!=='rain');
   tw.freeze=0;tw.freezeOwner=null;return;
  }
  if(tw.freezeOwner?.dead){tw.freeze=0;tw.freezeOwner=null;}
  if(tw.freeze>0){
   tw.freeze=Math.max(0,tw.freeze-dt);
   if(!tw.freeze){iceBurst(P.x,P.y,10,true);tw.freezeOwner=null;}
  }
 };
 D.impact=function(ball){
  const tw=S.tw,rn=tw.rain,x=ball.tx,y=ball.ty;
  iceBurst(x,y,12,false);twAdd({k:'frostBurst',x,y,t:.45,T:.45});
  if(!rn||rn.owner.dead||rn.hits>=TT.SU_CAP||S.iframe>0||S.drownT>0||Math.hypot(P.x-x,P.y-y)>=TT.RING+6)return;
  rn.hits++;S.flash=.4;
  if(loseWard("the Turtle's freezing Downpour",TT.SU_DMG,rn.owner))return;
  tw.freeze=FREEZE;tw.freezeOwner=rn.owner;S.iframe=Math.max(S.iframe,FREEZE+.4);
  iceBurst(P.x,P.y,14,false);blip(780,.18,'triangle',.05,260);
  toast('FROZEN — keep typing! Movement returns in a moment.',1.2);
 };
 D.ground=function(cam){
  const rn=S.tw?.rain,p=rn?.pocket;if(!p||rn.over)return;
  g.save();g.strokeStyle='rgba(162,247,186,.8)';g.lineWidth=2;
  g.fillStyle='rgba(117,231,169,.12)';g.beginPath();g.ellipse(p.x-cam.x,p.y-cam.y,20,10,0,0,Math.PI*2);g.fill();g.stroke();
  g.restore();
 };
 function orb(x,y,scale,phase,alpha=1){
  g.save();g.translate(x,y);g.scale(scale,scale);g.globalAlpha=alpha;
  const glow=g.createRadialGradient(0,0,18,0,0,62);glow.addColorStop(0,'rgba(91,212,255,.38)');glow.addColorStop(1,'rgba(91,212,255,0)');
  g.fillStyle=glow;g.fillRect(-62,-62,124,124);
  const fill=g.createRadialGradient(-14,-17,3,2,3,44);fill.addColorStop(0,'#e3ffff');fill.addColorStop(.28,'#85e7fb');fill.addColorStop(.65,'#279bcf');fill.addColorStop(1,'#154e91');
  g.fillStyle=fill;g.strokeStyle='#b8f7ff';g.lineWidth=2.5;
  g.beginPath();
  for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,r=40+Math.sin(a*5+phase)*1.8;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();g.stroke();
  // Moving water bands and fixed ice facets keep this readable as a freezing orb.
  g.save();g.rotate(phase*.35);g.strokeStyle='rgba(222,254,255,.8)';g.lineWidth=4;
  g.beginPath();g.ellipse(0,0,33,16,-.4,.1,Math.PI*1.45);g.stroke();
  g.strokeStyle='rgba(132,232,255,.8)';g.lineWidth=3;g.beginPath();g.ellipse(0,0,31,26,.6,Math.PI,Math.PI*1.9);g.stroke();g.restore();
  g.fillStyle='rgba(232,255,255,.75)';
  for(const [xx,yy,s]of [[-19,-23,12],[25,-5,9],[-9,27,8]]){g.beginPath();g.moveTo(xx,yy-s);g.lineTo(xx+s*.6,yy+3);g.lineTo(xx-4,yy+s*.6);g.closePath();g.fill();}
  g.strokeStyle='#f2ffff';g.lineWidth=3;g.beginPath();g.arc(-9,-10,20,Math.PI*1.1,Math.PI*1.6);g.stroke();
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2+phase*.5,r=47+Math.sin(phase*2+i)*5;g.fillStyle=i%2?'#d6fcff':'#70d5fa';g.fillRect(Math.cos(a)*r-2,Math.sin(a)*r-2,4,4);}
  g.restore();
 }

 // A light vapor layer follows the opposite of the ball's flight direction.
 // The orb itself, projectile path and damage remain independent of the mist.
 function mist(x,y,phase,scale,dx,dy){
  g.save();g.translate(x,y);g.rotate(Math.atan2(dy,dx)-Math.PI/2);g.scale(scale,scale);
  for(let i=0;i<5;i++){
   const u=(i/5+phase*.045)%1;
   const xx=Math.sin(u*5+phase*.18)*7,yy=-16-u*48,r=9+u*8;
   const opacity=.20*Math.sin(Math.PI*u);
   const fog=g.createRadialGradient(xx,yy,0,xx,yy,r);
   fog.addColorStop(0,'rgba(208,244,250,'+opacity+')');
   fog.addColorStop(.45,'rgba(208,244,250,'+(opacity*.55)+')');
   fog.addColorStop(1,'rgba(208,244,250,0)');
   g.fillStyle=fog;g.fillRect(xx-r,yy-r,r*2,r*2);
  }
  g.strokeStyle='rgba(211,246,252,.20)';g.lineWidth=1.6;
  g.beginPath();g.moveTo(0,-27);
  g.bezierCurveTo(-11,-35,12,-40,Math.sin(phase*.25)*6,-52);g.stroke();
  g.restore();
 }
 D.ball=function(x,y,phase,scale=.65,dx=0,dy=1){
  mist(x,y,phase,scale,dx,dy);orb(x,y,scale,phase);
 };
 D.top=function(cam){
  const tw=S.tw;
  for(const p of tw?.fx||[]){
   if(p.k!=='frostBurst')continue;
   const k=1-p.t/p.T,x=p.x-cam.x,y=p.y-cam.y;
   g.save();g.globalAlpha=1-k;g.fillStyle='rgba(148,235,255,.3)';g.strokeStyle='#d9fcff';g.lineWidth=2;
   g.beginPath();g.ellipse(x,y,15+k*70,8+k*35,0,0,Math.PI*2);g.fill();g.stroke();
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=15+k*65,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.5;g.beginPath();g.moveTo(xx,yy-15*(1-k));g.lineTo(xx+5,yy+4);g.lineTo(xx-4,yy+3);g.closePath();g.fillStyle='#c7f7ff';g.fill();}g.restore();
  }
  if(D.frozen()){
   const x=P.x-cam.x,y=P.y-cam.y;
   g.save();g.fillStyle='rgba(115,212,245,.38)';g.strokeStyle='#d1faff';g.lineWidth=2;
   g.beginPath();g.moveTo(x-23,y+5);g.lineTo(x-28,y-31);g.lineTo(x-11,y-64);g.lineTo(x+19,y-57);g.lineTo(x+29,y-22);g.lineTo(x+22,y+5);g.closePath();g.fill();g.stroke();
   g.beginPath();g.moveTo(x-11,y-64);g.lineTo(x+3,y-23);g.lineTo(x-23,y+5);g.moveTo(x+3,y-23);g.lineTo(x+22,y+5);g.stroke();
   g.font='bold 11px system-ui';g.textAlign='center';g.fillStyle='#e1fcff';g.fillText('FROZEN '+S.tw.freeze.toFixed(1)+'s',x,y+22);g.restore();
  }
 };
})();
