/* v131.11: original v9 Fletcher artwork at the current meat-for-arrows post. */
(function(){
 'use strict';
 const node=()=>POST();
 function drawVendor(cam){
  const f=node();if(!f)return;const x=f[0]*T+T/2-cam.x,y=f[1]*T+T/2-cam.y;
  sprite('fletchIdle',Math.floor(S.t*6),x,y,false);
  g.save();g.translate(x,y-100);g.fillStyle='rgba(18,22,26,.85)';g.beginPath();g.arc(0,0,15,0,7);g.fill();
  g.fillStyle='#c9963f';g.strokeStyle='#7a5a1e';g.lineWidth=2;g.beginPath();g.arc(0,0,12,0,7);g.fill();g.stroke();
  g.strokeStyle='#2b2013';g.lineCap='round';g.lineWidth=2.2;g.beginPath();g.moveTo(-6,5);g.lineTo(6,-6);g.stroke();
  g.lineWidth=1.8;g.beginPath();g.moveTo(6,-6);g.lineTo(1.5,-5);g.moveTo(6,-6);g.lineTo(5,-1.5);g.moveTo(-6,5);g.lineTo(-2,6);g.moveTo(-6,5);g.lineTo(-7,1);g.stroke();g.restore();
 }
 window.Fletcher={node,drawVendor};
})();
