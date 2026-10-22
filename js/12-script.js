
/* v125 BOSS RESISTANCE AND CONTROL STRIP. Introduces each boss's resistance when it first appears
   in a stage (toast + Library line) and draws a small strip under the boss bar: the element it
   resists, and its control state (held / fatigue pips / UNBREAKABLE). */
window.BossRes=(()=>{
  const COL={fire:'#f59049',ice:'#8fd3e8',electric:'#eacb67',poison:'#a6d955',wind:'#a6d9f5'};
  const NAME={fire:'FIRE',ice:'ICE',electric:'ELECTRIC',poison:'POISON',wind:'WIND'};
  const SKILLS={fire:'Burn',ice:'Freeze',electric:'Thunder',poison:'Venom Arrow',wind:'Gust Arrow'};
  const BARRED=new Set(['MN','TU','LC']);   /* these three draw their own bar at y=14 */
  let seen=new WeakSet(), stageKey='', seenTier=new Set();
  try{ const R=window.FirstJob?.RESIST||{}; for(const k in R){ const e=BESTIARY?.[k]; if(e&&e.rule&&!/RESISTS/.test(e.rule)) e.rule+=" RESISTS "+NAME[R[k]]+": "+SKILLS[R[k]]+(['MN','TU','SR','SM','SK','LZ','LC','TR'].includes(k)?" does half damage and cannot stun or hold it.":" does half."); } }catch(e){}
  function draw(){
    const J=window.FirstJob; if(!J||S.endless) return;
    const key=S.chapter+':'+S.stage; if(key!==stageKey){stageKey=key;seen=new WeakSet();}
    const b=mobs.find(m=>!m.dead&&J.isBoss(m)&&J.resistOf(m)&&MOBDEF[m.tier]?.mark);
    for(const u of mobs){ if(u.dead||J.isBoss(u)) continue; const re=J.resistOf(u); if(re&&!seenTier.has(u.tier)){ seenTier.add(u.tier); try{teach('res_'+u.tier,(MOBDEF[u.tier]?.label||'This enemy').toUpperCase()+' RESISTS '+NAME[re]+': '+SKILLS[re]+' works at half strength on it.');}catch(e){} } }
    if(!b) return;
    const el=J.resistOf(b), label=(MOBDEF[b.tier]?.label||'Boss').toUpperCase();
    if(!seen.has(b)){ seen.add(b); toast('THE '+label+' RESISTS '+NAME[el]+' · '+SKILLS[el]+' does half damage and cannot stun or hold it.',6);
      try{teach('resist'+el,'RESISTANCE: '+SKILLS[el]+' does half damage to this boss, half the slow, and never stuns or holds it. Your other skills work in full.');}catch(e){} }
    if(window.Bosses&&Bosses.cur) return;   /* v129.1: the five-boss bar owns the top of the screen */
    const imm=(b.ctlImmune||0)>S.t, held=(b.jobStop||0)>S.t, n=((b.ctlLast||-99)>S.t-6)?(b.ctlN||0)+1:0;
    const w=410, x=Math.round(VW/2-w/2+6), inBar=BARRED.has(b.tier), y=inBar?14:14, h=20;
    g.save(); g.textBaseline='middle'; g.font='bold 11px system-ui';
    if(inBar){   /* inside the boss's own bar, on the empty right side of its first line */
      g.textAlign='right'; g.fillStyle=COL[el]; g.fillText('RESISTS '+NAME[el],x+w-62-(imm?54:0),y+11);
    } else {
      g.fillStyle='rgba(10,14,18,.82)'; g.fillRect(x,y,w,h); g.fillStyle=COL[el]; g.fillRect(x,y,4,h);
      g.textAlign='left'; g.fillStyle=COL[el]; g.fillText('RESISTS '+NAME[el],x+12,y+h/2+1);
    }
    g.textAlign='right';
    const cy=inBar?y+11:y+h/2;
    if(imm){ g.fillStyle='#ff8a5a'; g.fillText((inBar?'':'UNBREAKABLE · ')+Math.max(0,b.ctlImmune-S.t).toFixed(1)+'s'+(inBar?' UNBREAKABLE':''),x+w-10,cy+1); }
    else { if(!inBar){ g.fillStyle='#9fb0b8'; g.fillText(held?'HELD':'CONTROL',x+w-62,cy+1); }
      for(let i=0;i<3;i++){ g.beginPath(); g.arc(x+w-46+i*14,cy,4,0,Math.PI*2); g.fillStyle=i<n?'#ff8a5a':'rgba(159,176,184,.35)'; g.fill(); } }
    g.restore();
  }
  return {draw};
})();
