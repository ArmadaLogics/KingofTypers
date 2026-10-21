/* Chapter IV spirit controller. Timings in seconds; distances in world pixels. */
const SpiritBoss=window.SpiritBoss={states:new Map(),shotSpeed:165,damage:20};
(function(B){
const durations=[1,1,4,1.4],names=['Spirit Volley','Spirit Orb','Spirit Channel','Spirit Sweep'];
const floor=(x,y,l)=>{const c=cellAt(W,x,y);return c&&c.walk&&!c.shut&&c.level===l;};
const eligible=m=>S.chapter===3&&!S.endless&&m.tier==='SM';
B.owns=eligible;
B.reset=()=>B.states.clear();
B.tick=function(dt){
 for(const [m] of B.states)if(m.dead||!mobs.includes(m)||!eligible(m))B.states.delete(m);
 for(const m of mobs){if(m.dead||!eligible(m))continue;
 let d=B.states.get(m);if(!d){d={boss:m,skill:0,t:0,shots:[],zones:[],bursts:[],sent:false,typed:'',hit:false,orb:null,ended:null,interrupted:false,angle:Math.atan2(P.y-m.y,P.x-m.x)};B.states.set(m,d);}
 if(m.frzT>0||m.stun>0||m.doomed||supFrozen()||window.FirstJob?.stopped(m))continue;
 const step=dt*(m.chill>0?.5:1);d.t+=step;d.bursts=d.bursts.filter(b=>(b.left-=step)>0);
 m.cast=!d.interrupted&&d.t<durations[d.skill]?.6:0;m.smT=99;
 if(!d.sent&&d.t>=durations[d.skill]){d.sent=true;d.flash=.3;
 if(d.skill===0||d.skill===3){const offsets=d.skill===3?[-.36,-.18,0,.18,.36]:[-.36,0,.36];for(const a of offsets)d.shots.push({x:m.x,y:m.y-40,a:d.angle+a,life:2.6});}
 if(d.skill===1)d.orb={x:m.x,y:m.y-40,life:5};
 if(d.skill===2&&!d.interrupted){for(const z of d.zones){d.bursts.push({x:z.x,y:z.y-20,left:.55});if(Math.hypot(P.x-z.x,(P.y-z.y)/.6)<z.r)damage(d);}d.ended=d.t;}
 }
 if(d.skill===2&&!d.zones.length&&!d.sent&&!d.interrupted){const pts=[{x:P.x,y:P.y},{x:P.x-145,y:P.y},{x:P.x+145,y:P.y}];d.zones=pts.filter(z=>floor(z.x,z.y,m.level)).map(z=>({...z,r:55}));}
 if(d.orb){const o=d.orb,dx=P.x-o.x,dy=P.y-30-o.y,len=Math.hypot(dx,dy);o.life-=step;if(len<20){damage(d);endOrb(d);}else if(o.life<=0)endOrb(d);else{o.x+=dx/len*85*step;o.y+=dy/len*85*step;}}
 for(const s of d.shots){s.life-=step;const ox=s.x,oy=s.y;s.x+=Math.cos(s.a)*(d.skill===3?165:250)*step;s.y+=Math.sin(s.a)*(d.skill===3?165:250)*step;const vx=s.x-ox,vy=s.y-oy,k=Math.max(0,Math.min(1,((P.x-ox)*vx+(P.y-30-oy)*vy)/(vx*vx+vy*vy||1)));if(Math.hypot(P.x-ox-vx*k,P.y-30-oy-vy*k)<20){damage(d);s.life=0;d.bursts.push({x:s.x,y:s.y,left:.55});}if(!floor(s.x,s.y+30,m.level))s.life=0;}
 d.shots=d.shots.filter(s=>s.life>0);
 if(d.sent&&!d.shots.length&&!d.orb&&d.ended===null)d.ended=d.t;
 if(d.ended!==null&&d.t-d.ended>=3){d.skill=(d.skill+1)%4;Object.assign(d,{t:0,shots:[],zones:[],sent:false,typed:'',hit:false,orb:null,ended:null,interrupted:false,angle:Math.atan2(P.y-30-(m.y-40),P.x-m.x)});}
 }
};
function damage(d){if(d.hit)return;d.hit=true;if(S.iframe>0)return;S.flash=.25;S.shake=3;loseWard('a Shaman spirit',B.damage,d.boss);S.iframe=nodeIframe();}
function endOrb(d){d.bursts.push({x:d.orb.x,y:d.orb.y,left:.55});d.orb=null;d.ended=d.t;}
B.key=function(ch){if(S.scene!=='stage'||S.card||S.opt)return false;for(const d of B.states.values()){if(d.boss.dead||d.boss.frzT>0||d.boss.stun>0)continue;const word=d.orb?'wisp':d.skill===2&&!d.sent&&!d.interrupted?'conjure':null;if(!word)continue;if(!d.typed&&(S.lock||ch!==word[0]))continue;if(ch===word[d.typed.length])d.typed+=ch;else d.typed='';if(d.typed===word){if(d.orb)endOrb(d);else{d.interrupted=true;d.sent=true;d.ended=d.t;d.zones=[];d.boss.cast=0;}d.typed='';}return true;}return false;};
B.ground=function(){for(const d of B.states.values())for(const z of d.zones){if(d.sent)continue;g.save();g.strokeStyle='#e8adf5';g.fillStyle='#db98ee25';g.lineWidth=2;g.setLineDash([6,5]);g.beginPath();g.ellipse(z.x,z.y,z.r,z.r*.6,0,0,7);g.fill();g.stroke();g.restore();}};
function effect(key,f,x,y,s){g.save();g.translate(x,y);g.scale(s,s);sprite(key,f,0,0,false);g.restore();}
B.top=function(){for(const d of B.states.values()){const m=d.boss;if(m.dead)continue;
 const age=d.t-durations[d.skill],charge=age<0&&!d.interrupted;const x=m.x+(m.x>P.x?55:-55),y=m.y-112;
 g.save();if(charge){const q=d.t/durations[d.skill];for(let i=0;i<9;i++){const k=(d.t*.8+i/9)%1,a=i*2.399+d.t*.7,r=12+(1-k)*62;g.globalAlpha=.3+k*.6;g.fillStyle='#efb0ff';g.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r*.7),4,4);}g.globalAlpha=.8;effect('smShot',d.t*10,x,y+12,.16+q*.19);}else if(age>=0&&age<.3&&!d.interrupted){g.globalAlpha=1-age/.3;g.fillStyle='#fff0fa';g.fillRect(x-15,y-2,30,4);g.fillRect(x-2,y-15,4,30);}g.restore();
 for(const s of d.shots)effect('smShot',d.t*10,s.x,s.y,.6);
 if(d.orb){effect('smShot',d.t*10,d.orb.x,d.orb.y,.7);label('WISP '+d.typed.toUpperCase(),d.orb.x,d.orb.y-65);}
 for(const b of d.bursts){effect('smBoom',Math.min(8,((.55-b.left)*16)|0),b.x,b.y,.6);g.save();g.globalAlpha=b.left/.55;g.fillStyle='#eeb0fa';for(let i=0;i<8;i++){const a=i*Math.PI/4,r=12+(.55-b.left)*90;g.fillRect(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r*.6,4,4);}g.restore();}
 if(charge)label(d.skill===2?'CONJURE '+d.typed.toUpperCase():names[d.skill],m.x,m.y-175);
}};
function label(t,x,y){g.save();g.font='bold 16px Georgia';g.textAlign='center';const w=g.measureText(t).width+20;g.fillStyle='#182730ee';g.fillRect(x-w/2,y-17,w,24);g.fillStyle='#f5ccff';g.fillText(t,x,y);g.restore();}
})(SpiritBoss);
