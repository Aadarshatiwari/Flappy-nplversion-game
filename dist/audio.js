export function makeAudio(settings) {
  let context, music, effects, next, note = 0;
  const phrase = [57,64,69,72,69,64,55,62,67,71,67,62,53,60,65,69,65,60,55,62,67,74,67,62];
  const frequency = pitch => 440 * 2 ** ((pitch-69)/12);
  function tone(bus, start, from, to, length, level, type = 'sine') {
    const oscillator=context.createOscillator(), envelope=context.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(from,start);
    oscillator.frequency.exponentialRampToValueAtTime(to,start+length);
    envelope.gain.setValueAtTime(.0001,start);
    envelope.gain.exponentialRampToValueAtTime(level,start+.012);
    envelope.gain.exponentialRampToValueAtTime(.0001,start+length);
    oscillator.connect(envelope).connect(bus);
    oscillator.start(start);oscillator.stop(start+length+.01);
  }
  function refresh(){
    if(!context)return;
    music.gain.setTargetAtTime(settings.muted?0:settings.music/100,context.currentTime,.04);
    effects.gain.setTargetAtTime(settings.muted?0:settings.effects/100,context.currentTime,.04);
  }
  function schedule(){
    if(context.state!=='running')return;
    if(next<context.currentTime)next=context.currentTime+.03;
    while(next<context.currentTime+.26){
      const hz=frequency(phrase[note%phrase.length]);
      tone(music,next,hz,hz,.47,.055,'triangle');
      if(note%6===0)tone(music,next,hz/2,hz/2,1.55,.12);
      next+=.27;note++;
    }
  }
  return {
    refresh,
    unlock(){
      if(!context){
        const Audio=window.AudioContext || window.webkitAudioContext;
        if(!Audio)return;
        context=new Audio();music=context.createGain();effects=context.createGain();
        music.connect(context.destination);effects.connect(context.destination);
        next=context.currentTime;setInterval(schedule,110);refresh();
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
    },
    play(name){
      if(!effects || context.state!=='running')return;
      const t=context.currentTime;
      const sounds={lift:[[270,490,.13,.13,'triangle']],gate:[[520,740,.15,.15],[780,1030,.21,.1]],coin:[[880,1200,.13,.16],[1320,1600,.21,.1]],shield:[[420,1000,.35,.18,'triangle']],hit:[[130,42,.44,.31,'triangle']],record:[[522,524,.28,.17],[659,661,.3,.16],[784,786,.55,.16]]};
      sounds[name].forEach(([a,b,d,v,type],i)=>tone(effects,t+i*.09,a,b,d,v,type));
    }
  };
}
