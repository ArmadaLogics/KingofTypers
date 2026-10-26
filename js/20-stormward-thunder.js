/* Stormward rolling thunder: distant ambience and a heavier roll at each lightning strike. */
(() => {
  const thunder=window.StormwardThunder={enabled:true,output:null};
  const voices=new Set(),heard=new WeakSet(),distantHeard=new WeakSet(),buffers=new Map();
  const counts={ambient:0,strike:0};
  let lastStrike=-Infinity,lastGameTime=S.t,focused=true,serial=0;
  function allowed(){
    return thunder.enabled&&window.StormwardWeather?.active()&&!S.mute&&!S.card&&!S.panel&&
      !window.StormwardFX?.paused&&!document.hidden&&focused;
  }
  // Filtered noise, several slow swells and a long decay make a roll rather than a pitched buzz.
  // This private random stream never consumes the gameplay random sequence.
  thunder.makeBuffer=function(context,kind,variant=0){
    const near=kind==='strike'||kind==='overworld',duration=near?5.8:6.6,rate=context.sampleRate;
    const buffer=context.createBuffer(2,Math.ceil(rate*duration),rate);
    const coefficient=hz=>1-Math.exp(-2*Math.PI*hz/rate);
    const bassK=coefficient(165),deepK=coefficient(55),airK=coefficient(1400),dcK=coefficient(24);
    let peak=0;
    for(let channel=0;channel<2;channel++){
      const data=buffer.getChannelData(channel);
      let state=(0x6d2b79f5+variant*104729+channel*7919)>>>0,bass=0,deep=0,air=0,dc=0;
      for(let i=0;i<data.length;i++){
        state^=state<<13;state^=state>>>17;state^=state<<5;
        const noise=(state>>>0)/2147483648-1,time=i/rate;
        bass+=bassK*(noise-bass);deep+=deepK*(noise-deep);air+=airK*(noise-air);
        let value=bass*4.4+deep*3.2;
        if(near)value+=air*2.2*Math.exp(-time*9);
        dc+=dcK*(value-dc);value-=dc;
        const roll=.38+.34*(.5+.5*Math.sin(time*3.9+variant))+.28*(.5+.5*Math.sin(time*7.1+channel*.3));
        const attack=1-Math.exp(-time/(near?.018:.42)),tail=Math.pow(Math.max(0,1-time/duration),1.9);
        data[i]=value*roll*attack*tail;peak=Math.max(peak,Math.abs(data[i]));
      }
    }
    const scale=peak>.00001?.82/peak:1;
    for(let channel=0;channel<2;channel++){
      const data=buffer.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]*=scale;
    }
    return buffer;
  };
  function stopVoice(voice){
    voices.delete(voice);
    const now=voice.source.context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);
    voice.gain.gain.linearRampToValueAtTime(0,now+.05);voice.source.stop(now+.06);
  }
  function hush(){for(const voice of [...voices])stopVoice(voice);}
  thunder.play=function(kind,pan=0){
    if(!allowed()||!AC||AC.state!=='running')return false;
    if(!thunder.output){thunder.output=AC.createGain();thunder.output.gain.value=.9;thunder.output.connect(AC.destination);}
    // Twin strikes share a roll; sustained combat can never accumulate an unbounded audio bed.
    if(voices.size>=3)stopVoice([...voices].find(voice=>voice.kind==='ambient')||voices.values().next().value);
    const profile=kind==='ambient'&&S.scene==='over'?'overworld':kind;
    const variant=serial++%3,key=profile+':'+variant+':'+AC.sampleRate;
    if(!buffers.has(key))buffers.set(key,thunder.makeBuffer(AC,profile,variant));
    const source=AC.createBufferSource(),gain=AC.createGain(),panner=AC.createStereoPanner();
    source.buffer=buffers.get(key);gain.gain.value=profile==='overworld'?.34:kind==='strike'?.38:.22;panner.pan.value=Math.max(-.65,Math.min(.65,pan));
    source.connect(gain).connect(panner).connect(thunder.output);
    const voice={kind,source,gain,panner};voices.add(voice);
    source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();panner.disconnect();};
    source.start();counts[kind]++;return voice;
  };
  thunder.strike=function(strike){
    if(heard.has(strike))return false;heard.add(strike);
    window.StormwardWeather?.lightning?.strike(strike);
    if(S.t-lastStrike<.35)return false;
    lastStrike=S.t;
    return thunder.play('strike',(strike.x-P.x)/(T*10));
  };
  thunder.sync=function(){
    if(S.t<lastGameTime){hush();lastStrike=-Infinity;}
    lastGameTime=S.t;
    if(!allowed()){
      hush();
      for(const event of window.StormwardWeather?.lightning?.events||[])distantHeard.add(event);
    }
  };
  thunder.tick=function(){
    thunder.sync();
    if(!allowed()||!AC||AC.state!=='running')return;
    for(const event of window.StormwardWeather?.lightning?.events||[]){
      if(event.kind!=='distant'||distantHeard.has(event))continue;
      const late=S.t-event.born-event.soundDelay;if(late<0)continue;
      distantHeard.add(event);
      if(late<.5)thunder.play('ambient',(event.direction-.5)*.9);
    }
  };
  thunder.snapshot=()=>({active:!!allowed(),unlocked:!!AC&&AC.state==='running',voices:voices.size,
    nextAt:window.StormwardWeather?.lightning?.nextAt??null,counts:{...counts},playing:[...voices].map(voice=>voice.kind)});
  function unlock(){
    if(!allowed())return;
    const context=ac();
    if(context.state==='suspended')context.resume().then(()=>thunder.tick()).catch(()=>{});
    else thunder.tick();
  }
  addEventListener('pointerdown',unlock,{capture:true});addEventListener('keydown',unlock,{capture:true});
  addEventListener('blur',()=>{focused=false;thunder.sync();});
  addEventListener('focus',()=>{focused=true;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)thunder.sync();});
  const nativeUpdate=update;
  update=function(dt){nativeUpdate(dt);thunder.tick();};
  const nativeSky=drawSky;
  // Render still runs while the preview is paused, so the audio can fade out immediately.
  drawSky=function(m){thunder.sync();nativeSky(m);};
})();
