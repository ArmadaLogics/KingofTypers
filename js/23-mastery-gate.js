
/* v131.7 THE HUB FIRST. Arrow Mastery sits at the centre of the tree; every other rank waits for it at Lv 3.
   Wrapped last so it covers every buy path (the basic tree, the 1st Job tree and the old tab page). */
(()=>{const hubBuy=buyRank;buyRank=k=>{const S0=S;if(k!=='mastery'&&SKILL[k]&&((S0.ranks&&S0.ranks.mastery)|0)<3){toast('Arrow Mastery needs Lv 3 before any other skill');return false;}return hubBuy(k);};})();
