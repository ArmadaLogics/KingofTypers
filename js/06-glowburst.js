const Glowburst=window.Glowburst=window.FrillGlare=window.OrbitOrbs={states:new Map(),radius:92,core:12,speed:1.35};
(function(C){
C.lock=m=>!!C.states.get(m)?.phase;
C.ray=(x,y,a,level,max=80)=>{for(let r=4;r<=max;r+=4){const c=cellAt(W,x+Math.cos(a)*r,y+Math.sin(a)*r);if(!c||!c.walk||c.shut||c.level!==level)return r-4;}return max;};
C.chargeProgress=d=>Math.max(0,Math.min(1,d.t/1.3));C.orbSize=d=>d.phase==='charge'?8+32*C.chargeProgress(d)**2:40;C.point=(d,i,offset=0)=>{const a=d.angle+i*Math.PI*2/3+offset;const radius=d.phase==='charge'?26+66*C.chargeProgress(d):C.radius;return{x:d.x+Math.cos(a)*radius,y:d.y+Math.sin(a)*radius*.65,a};};
C.valid=(m,d,p)=>C.ray(d.x,d.y,Math.atan2(p.y-d.y,p.x-d.x),m.level,Math.hypot(p.x-d.x,p.y-d.y))>=Math.hypot(p.x-d.x,p.y-d.y)-4;
C.tick=dt=>{for(const[m,d]of C.states)if(m.dead||!mobs.includes(m)){m.spd=d.speed;C.states.delete(m);}for(const m of mobs){if(m.dead||m.tier!=='LZ'||window.FirstJob?.stopped(m))continue;let d=C.states.get(m);if(!d){d={phase:'',wait:1.5,t:0,speed:m.spd};C.states.set(m,d);}if(d.phase){m.hit=false;m.wind=0;m.swing=0;m.windCd=.5;m.spd=0;}if(m.frzT>0||m.stun>0||m.doomed||supFrozen()||window.FirstJob?.stopped(m))continue;
if(!d.phase){if(C.haunts?.some(o=>!o.dead&&o.owner===m))continue;d.wait-=dt;if(d.wait>0)continue;Object.assign(d,{phase:'charge',t:0,x:m.x,y:m.y,hp:m.hp,angle:0,hitCd:0,cancel:false,released:false});m.spd=0;m.wind=0;m.swing=0;m.hit=false;}
d.visualT=(d.visualT||0)+dt;d.t+=dt;d.hitCd=Math.max(0,d.hitCd-dt);
if(d.phase==='charge'){d.angle+=dt*.5;if(m.hp<d.hp){d.phase='recover';d.t=0;d.cancel=true;}else if(d.t>=1.3){d.phase='orbit';d.t=0;}}
else if(d.phase==='orbit'){const steps=Math.max(1,Math.ceil(dt/.016));for(let j=0;j<steps;j++){d.angle+=C.speed*dt/steps;for(let i=0;i<3;i++){const p=C.point(d,i);if(d.hitCd<=0&&S.iframe<=0&&P.level===m.level&&C.valid(m,d,p)&&Math.hypot(P.x-p.x,(P.y-30)-(p.y-30))<=C.core+10){loseWard('the Lizard orbiting glow orb',15,m);S.iframe=Math.max(nodeIframe(),1);d.hitCd=1;S.flash=.15;}}}if(d.t>=5){C.release(m,d);d.released=true;d.phase='recover';d.t=0;}}
else if(d.t>=2){d.phase='';d.wait=7;m.spd=d.speed;m.windCd=.5;}
}};
C.pin=()=>{for(const[m,d]of C.states)if(d.phase&&!m.dead){m.x=d.x;m.y=d.y;}};
C.body=(m,x,y)=>{const d=C.states.get(m);if(!d?.phase||m.frzT>0||m.hitT>0)return false;const recover=d.phase==='recover',idle=recover&&d.t>.6,f=d.phase==='charge'?Math.min(3,Math.floor(d.t/1.3*4)):recover?Math.min(8,6+Math.floor(d.t*5)):4;g.save();g.globalAlpha=1;g.shadowColor='#b7ff4d';g.shadowBlur=15;sprite(idle?'lzIdle':'lzAtk',idle?Math.floor(S.t*7)%7:f,x,y,false);g.restore();return true;};
C.orbArt=new Image();C.orbArt.src='assets/images/image-d73ac8c9b467a558.png';
C.scatter=[[.12,45,5],[.38,63,3],[.91,51,7],[1.16,70,4],[1.83,47,3],[2.02,59,6],[2.48,72,3],[2.8,49,5],[3.36,64,4],[3.61,46,7],[4.03,74,3],[4.52,53,5],[4.71,67,3],[5.23,46,4],[5.67,61,6],[5.95,76,3]];
C.drawOrb=(m,d,i)=>{if(d.released)return;const p=C.point(d,i);if(!C.valid(m,d,p))return;const fade=d.phase==='charge'?(.4+.6*C.chargeProgress(d)):d.phase==='recover'?Math.max(0,1-d.t/.4):1;if(!fade||!C.orbArt.complete||!C.orbArt.naturalWidth)return;
const t=d.visualT||0,size=C.orbSize(d),x=p.x,y=p.y-30;g.save();g.globalAlpha=fade;g.translate(x,y);g.save();g.rotate(t*Math.PI*2/2.5);g.imageSmoothingEnabled=false;g.drawImage(C.orbArt,-size/2,-size/2,size,size);g.restore();
// Decorative small orbs mirror the approved preview; damage remains on the main core.
C.scatter.forEach(([a,r,s],j)=>{const angle=a+t*Math.PI*2/6;const radius=r/100*size;const alpha=.725+.275*Math.sin((t+j*.31)*Math.PI/1.8);g.globalAlpha=fade*alpha;g.fillStyle='#eaffae';g.shadowColor='#a8ff43';g.shadowBlur=4;g.beginPath();g.arc(Math.cos(angle)*radius,Math.sin(angle)*radius,Math.max(.75,s/320*size/2),0,Math.PI*2);g.fill();});g.restore();C.approvedOrbDraws=(C.approvedOrbDraws||0)+1;
};
C.ground=()=>{for(const[m,d]of C.states){if(!d.phase)continue;if(d.phase==='charge'){g.save();g.globalAlpha=.3;g.strokeStyle='#afff59';g.setLineDash([4,9]);g.beginPath();g.ellipse(d.x,d.y,C.radius,C.radius*.65,0,0,Math.PI*2);g.stroke();g.restore();}for(let i=0;i<3;i++)if(C.point(d,i).y<d.y)C.drawOrb(m,d,i);}};
C.top=()=>{for(const[m,d]of C.states){if(!d.phase)continue;for(let i=0;i<3;i++)if(C.point(d,i).y>=d.y)C.drawOrb(m,d,i);g.save();g.globalAlpha=1;g.fillStyle='#102414';g.fillRect(d.x-110,d.y-220,220,26);g.fillStyle='#d3ff9b';g.font='bold 15px sans-serif';g.textAlign='center';g.fillText(d.phase==='charge'?'GLOW ORBS · FORMING':d.phase==='orbit'?'GLOW ORBS':d.cancel?'INTERRUPTED':'RECOVERING',d.x,d.y-202);g.restore();}};
})(Glowburst);
;
;

