const SkullCleave=window.SkullCleave={states:new Map(),image:new Image(),atlas:[{"frame":1,"x":0,"y":0,"w":314,"h":627,"offsetX":0,"offsetY":0},{"frame":2,"x":314,"y":0,"w":313,"h":627,"offsetX":0,"offsetY":0},{"frame":3,"x":627,"y":0,"w":313,"h":627,"offsetX":0,"offsetY":0},{"frame":4,"x":940,"y":0,"w":314,"h":627,"offsetX":0,"offsetY":0},{"frame":5,"x":0,"y":627,"w":314,"h":627,"offsetX":-20,"offsetY":54},{"frame":6,"x":314,"y":627,"w":313,"h":627,"offsetX":-10,"offsetY":54},{"frame":7,"x":627,"y":627,"w":313,"h":627,"offsetX":-9,"offsetY":54},{"frame":8,"x":940,"y":627,"w":314,"h":627,"offsetX":8,"offsetY":54}],config:{charge:1,release:1.2,end:2.8,recovery:2,speed:295,damage:20}};
SkullCleave.image.src="assets/images/image-d93a1a72eb78cea4.png";
(function(C){
 C.owns=m=>S.chapter===4&&!S.endless&&m.tier==='SK';
 C.attackLocked=m=>!!C.states.get(m)?.healing;
 C.reset=()=>{C.hauntHitCd=0;for(const [m,d]of C.states)m.spd=d.speed;C.states.clear();};
 const floor=(x,y,l)=>{const c=cellAt(W,x,y);return c&&c.walk&&!c.shut&&(c.level===l||c.t==='stair');};
 C.tick=function(dt){
 for(const [m,d]of C.states)if(m.dead||!mobs.includes(m)||!C.owns(m)){m.spd=d.speed;C.states.delete(m);}
 for(const m of mobs){if(m.dead||!C.owns(m))continue;let d=C.states.get(m);if(!d){d={t:0,wait:1.5,speed:m.spd,active:false,shot:null,sent:false,angle:0};C.states.set(m,d);}
 if(d.healing){m.hit=false;m.wind=0;m.swing=0;d.shot=null;}
 if(m.frzT>0||m.stun>0||m.doomed||supFrozen()||window.FirstJob?.stopped(m))continue;
 const step=dt*(m.chill>0?.5:1);
 if(!d.active&&!d.healUsed&&m.hp<=2&&m.hp>0){d.healUsed=true;d.healing=true;d.active=true;d.t=0;d.shot=null;m.hit=false;d.healHp=m.hp;d.anchor={x:m.x,y:m.y};d.healResult='';d.angle=Math.atan2(P.y-m.y,P.x-m.x);}
 if(d.healing){m.spd=0;m.wind=0;m.swing=0;m.windCd=99;m.x=d.anchor.x;m.y=d.anchor.y;
 if(!d.healResult&&m.hp<d.healHp){d.healResult='INTERRUPTED';d.t=3;}
 d.t+=step;
 if(d.t>=3&&!d.healResult){if(window.FirstJob?.poisoned(m))d.healResult='POISONED';else{m.hp=Math.min(HP.SK,m.hp+1);d.healResult='+1 HP';}}
 if(d.t>=4.5){d.healing=false;d.active=false;d.wait=2;m.spd=d.speed;m.windCd=.5;}
 continue;}

 if(!d.active){d.wait-=step;if(d.wait>0||Math.hypot(m.x-P.x,m.y-P.y)>480)continue;Object.assign(d,{active:true,t:0,sent:false,shot:null,angle:Math.atan2(P.y-30-(m.y-40),P.x-m.x)});m.swing=0;m.wind=0;}
 m.spd=0;m.windCd=99;m.swing=0;m.wind=0;d.t+=step;
 if(!d.sent&&d.t>=C.config.release){d.sent=true;d.shot={x:m.x+Math.cos(d.angle)*45,y:m.y-40+Math.sin(d.angle)*45,age:0,level:m.level};}
 if(d.shot){const p=d.shot;p.age+=step;const distance=C.config.speed*step,n=Math.max(1,Math.ceil(distance/8));for(let j=0;j<n&&d.shot;j++){p.x+=Math.cos(d.angle)*distance/n;p.y+=Math.sin(d.angle)*distance/n;if(!floor(p.x,p.y+30,p.level)){d.shot=null;break;}if(P.level===p.level&&Math.hypot(P.x-p.x,P.y-30-p.y)<25){if(!(S.iframe>0)){loseWard('the Skull spectral cleave',C.config.damage,m);S.iframe=nodeIframe();S.flash=.25;S.shake=3;}d.shot=null;break;}}if(p.age>=1.6)d.shot=null;}
 if(d.t>=C.config.end+C.config.recovery){d.active=false;d.wait=2;m.spd=d.speed;m.windCd=.5;d.shot=null;}
 }
 };
 C.body=function(m,x,y){const d=C.states.get(m);if(!d||!d.active||m.frzT>0)return false;if(d.healing){sprite(d.t<3?'skGuard':'skIdle',Math.floor(d.t*6),x,y,Math.cos(d.angle)<0);return true;}const swing=d.t>=1&&d.t<1.7;const f=swing?Math.min(6,Math.floor((d.t-1)*10)):Math.floor(d.t*6);sprite(swing?'skAtk':'skIdle',f,x,y,Math.cos(d.angle)<0);return true;};
 C.top=function(){for(const [m,d]of C.states){if(!d.active||m.dead)continue;if(d.healing){C.healFx(m,d);continue;}if(d.t<1){g.save();g.fillStyle='#daf0be';g.globalAlpha=.35+d.t*.5;const side=Math.cos(d.angle)<0?-1:1;for(let i=0;i<6;i++){const a=i+S.t*3;g.fillRect(m.x-side*25+Math.cos(a)*12,m.y-90+Math.sin(a)*12,3,3);}g.restore();}
 const p=d.shot;if(!p||!C.image.complete)continue;const age=p.age,f=age<.2?Math.min(1,Math.floor(age*10)):age<1.4?2+Math.floor((age-.2)*10)%4:Math.min(7,6+Math.floor((age-1.4)*10)),r=C.atlas[f];g.save();g.translate(p.x,p.y);g.rotate(d.angle);g.imageSmoothingEnabled=false;const z=.54;g.drawImage(C.image,r.x,r.y,r.w,r.h,(r.offsetX-276)*z,(r.offsetY-360)*z,r.w*z,r.h*z);g.restore();
 }};

 C.pin=function(){for(const [m,d]of C.states)if(d.healing&&!m.dead){m.x=d.anchor.x;m.y=d.anchor.y;}};
 C.healFx=function(m,d){
 const dir=Math.cos(d.angle)<0?-1:1,x=m.x+dir*25,y=m.y-64,q=Math.min(1,d.t/3),charging=d.t<3,age=Math.max(0,d.t-3),healed=d.healResult==='+1 HP';
 const snap=v=>Math.round(v/3)*3;
 g.save();g.imageSmoothingEnabled=false;
 if(charging||healed&&age<1.3){
  const fade=charging?1:Math.max(0,1-age/1.3);
  // Ground halo remains translucent so the original guard pose stays readable.
  g.globalAlpha=fade*(.12+q*.08);g.fillStyle='#39df45';g.beginPath();g.ellipse(m.x,m.y-3,62+q*22,20+q*7,0,0,Math.PI*2);g.fill();
  for(let ring=0;ring<2;ring++){g.globalAlpha=fade*(.45+ring*.15);g.strokeStyle=ring?'#c4ff91':'#26c93c';g.lineWidth=2;g.setLineDash([7,8]);g.lineDashOffset=d.t*(ring?28:-22);g.beginPath();g.ellipse(m.x,m.y-3,62+ring*17,20+ring*6,0,0,Math.PI*2);g.stroke();}g.setLineDash([]);
  // Three inward spiral streams gather at the shield.
  for(let i=0;i<32;i++){const k=(d.t*.65+i/32)%1,a=i*2.399+d.t*2.1,r=15+(1-k)*(90+q*24);g.globalAlpha=fade*(.2+k*.7);g.fillStyle=i%4?'#50ed45':'#d0ff9a';const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.7-(1-k)*25;const size=k>.65?5:3;g.fillRect(snap(px),snap(py),size,size);for(let j=1;j<4;j++){g.globalAlpha=fade*(.16-j*.035);g.fillRect(snap(x+Math.cos(a-j*.08)*(r+j*5)),snap(y+Math.sin(a-j*.08)*(r+j*5)*.7-(1-k)*25),3,3);}}
  // Rising motes frame rather than paint over the skeleton.
  for(let i=0;i<12;i++){const k=(d.t*.5+i/12)%1;g.globalAlpha=fade*Math.sin(k*Math.PI)*.65;g.fillStyle='#83ff5b';g.fillRect(snap(m.x+(i%2?1:-1)*(38+(i%3)*12)),snap(m.y-12-k*125),3,7);}
  for(let j=0;j<3;j++){g.globalAlpha=fade*(.18+j*.12);g.strokeStyle=j===2?'#c8ff8b':'#42e337';g.lineWidth=j===2?2:4;g.beginPath();g.arc(x,y,23+j*8+Math.sin(d.t*8+j)*3,d.t*(j%2?1:-1)+j,d.t*(j%2?1:-1)+j+Math.PI*1.45);g.stroke();}
 }
 if(charging){g.globalAlpha=.7;g.fillStyle='#d0ff91';const pulse=3+Math.sin(d.t*11)*2;g.fillRect(x-pulse,y-2,pulse*2,4);g.fillRect(x-2,y-pulse,4,pulse*2);}
 if(healed&&age<1.5){const fade=1-age/1.5;for(let j=0;j<2;j++){g.globalAlpha=fade*.75;g.strokeStyle=j?'#bfff80':'#43ee39';g.lineWidth=3-j;g.beginPath();g.ellipse(x,y,25+age*100+j*14,22+age*75+j*12,0,0,Math.PI*2);g.stroke();}for(let i=0;i<18;i++){const a=i*Math.PI*2/18,r=20+age*100;g.globalAlpha=fade;g.fillStyle=i%3?'#69f547':'#dcffad';g.fillRect(snap(x+Math.cos(a)*r),snap(y+Math.sin(a)*r*.7-age*22),4,4);}g.globalAlpha=fade;g.fillStyle='#8aff56';g.font='bold 25px Georgia';g.textAlign='center';g.fillText('+1 HP',m.x,m.y-118-age*26);}
 g.globalAlpha=1;g.fillStyle='#112910';g.fillRect(m.x-64,m.y-190,128,30);g.font='bold 15px Georgia';g.textAlign='center';g.fillStyle='#a5ff75';g.fillText(charging?'BONE MEND':d.healResult,m.x,m.y-170);g.fillStyle='#23451b';g.fillRect(m.x-54,m.y-153,108,7);g.fillStyle='#59ea38';g.fillRect(m.x-54,m.y-153,108*q,7);g.restore();
 };

})(SkullCleave);
if(location.hash==='#cleave-test'||location.hash==='#mend-test'){
 const boot=()=>{if(!window.__K||!ready){setTimeout(boot,100);return;}S.chapter=4;buildChapter(4);enterStage(9);mobs.length=0;arrows.length=0;S.spawnQ=[];S.card=null;S.hint=null;S.cardQ=[];S.cardHold=null;S.wave=2;S.msgT=0;S.tq=[];const m=spawnMob('SK');m.x=P.x+100;m.y=P.y;m.level=P.level;m.lastAlive=false;m.shield=0;if(location.hash==='#mend-test'){m.hp=2;}const c=cellAt(W,m.x,m.y);if(!c||!c.walk){m.x=P.x;m.y=P.y;}if(location.hash==='#mend-test'){const spots=[];for(let y=1;y<W.h-1;y++)for(let x=1;x<W.w-1;x++){const c=W.grid[y][x],px=x*T+T/2,py=y*T+T/2,dist=Math.hypot(px-P.x,py-P.y);if(c.walk&&!c.shut&&c.level===P.level&&dist>180&&dist<320)spots.push({x:px,y:py});}if(spots.length){spots.sort((a,b)=>Math.hypot(a.x-W.w*T/2,a.y-W.h*T/2)-Math.hypot(b.x-W.w*T/2,b.y-W.h*T/2));m.x=spots[0].x;m.y=spots[0].y;}if(S.lamps&&S.lamps.length){S.lamps[0].x=m.x;S.lamps[0].y=m.y;}S.waveFlashT=0;window.mendFocus=m;}S.msg='Skull skill test — progress is not saved';S.msgT=location.hash==='#mend-test'?0:6;};setTimeout(boot,100);
}




