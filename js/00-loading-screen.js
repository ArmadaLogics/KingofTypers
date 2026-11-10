/* Parchment and sprite loading screen. Works before game globals exist. Preview: #loading-preview. */
window.LoadingScreen=(()=>{
  'use strict';
  const screen=document.getElementById('loading-screen');
  const track=screen.querySelector('[role="progressbar"]');
  const fill=screen.querySelector('.loading-fill');
  const preview=location.hash==='#loading-preview';
  let previous=-1,finished=false;
  const canvas=screen.querySelector('.loading-paper'),paper=new Image();
  function paintPaper(){
    if(finished||!paper.complete||!paper.naturalWidth)return;
    const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#b5a486';ctx.fillRect(0,0,w,h);
    const x=14,y=14,pw=Math.max(105,w-28),ph=Math.max(89,h-28);
    const draw=(sx,sy,sw,sh,dx,dy,dw,dh)=>ctx.drawImage(paper,sx,sy,sw,sh,x+dx,y+dy,dw,dh);
    draw(12,20,52,44,0,0,52,44);draw(256,20,52,44,pw-52,0,52,44);
    draw(12,256,52,44,0,ph-44,52,44);draw(256,256,52,44,pw-52,ph-44,52,44);
    draw(138,20,4,44,52,0,pw-104,44);draw(140,256,4,44,52,ph-44,pw-104,44);
    draw(12,140,52,4,0,44,52,ph-88);draw(256,131,52,4,pw-52,44,52,ph-88);
    draw(148,128,4,4,52,44,pw-104,ph-88);
  }
  paper.onload=paintPaper;paper.src='assets/images/image-4a91bbde509af741.png';
  addEventListener('resize',paintPaper);
  function update(complete,total){
    if(finished)return;
    const value=preview?64:Math.max(0,Math.min(100,Math.floor(total>0?complete/total*100:0)));
    if(value===previous)return;
    previous=value;
    track.setAttribute('aria-valuenow',String(value));
    fill.style.width=value+'%';
  }
  function finish(){
    if(preview||finished)return;
    update(1,1);finished=true;screen.hidden=true;
    removeEventListener('resize',paintPaper);
  }
  update(0,1);
  return {update,finish};
})();
