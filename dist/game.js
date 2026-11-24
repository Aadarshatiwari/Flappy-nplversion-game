import {makeAudio} from './audio.js';
import {makeScenery} from './scenery.js?v=tour';
import {makeProfile} from './profile.js';
import {districts} from './districts.js?v=tour';

const byId = id => document.getElementById(id);
const canvas = byId('scene'), ctx = canvas.getContext('2d', {alpha:false});
const scenery = makeScenery(ctx);
const portrait = new Image();
const TAU = Math.PI*2;
const HEIGHT = 720, STEP = 1/120;
const MODES = {
  Easy: {speed:184,gap:274,gravity:805,lift:300,spacing:340},
  Normal: {speed:224,gap:230,gravity:930,lift:326,spacing:325},
  Hard: {speed:264,gap:194,gravity:1030,lift:347,spacing:310},
  Extreme: {speed:318,gap:164,gravity:1150,lift:365,spacing:305}
};
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const rnd = (min,max) => min+Math.random()*(max-min);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = 'skywake.arcade.v1';
let saved;
try {saved=JSON.parse(localStorage.getItem(storageKey)) || {};} catch {saved={};}
const settings={difficulty:'Normal',music:42,effects:70,muted:false,...saved.settings};
if(!Object.hasOwn(MODES,settings.difficulty))settings.difficulty='Normal';
const records=Array.isArray(saved.records)?saved.records:[];
const audio=makeAudio(settings);
const gatesPerDistrict=3;
const lastDistrict=districts.length-1;
let unlocked=Number.isInteger(saved.unlocked)?Math.max(0,Math.min(lastDistrict,saved.unlocked)):0;
let tourComplete=saved.tourComplete===true, completedFlight=false;
let district=unlocked, previousDistrict=null, entryTime=0, districtGates=0;
let profile=saved.profile;
const profileEditor=makeProfile(profile, newProfile=>{
  profile=newProfile;applyProfile();save();audio.unlock();show('home');
});
let width=960, scale=1, renderScale=1, state='profile', focusState='home';
let lastFrame=0, accumulator=0, ambient=0, menuTravel=0, shake=0;
let y=HEIGHT*.48, velocity=0, tilt=0, distance=0, elapsed=0, score=0, coins=0;
let shield=0, grace=0, best=0, center=HEIGHT*.52, nextGate=0;
let gates=[], particles=[];
const xPilot=()=>clamp(width*.27,76,300);
const currentMode=()=>MODES[settings.difficulty];
const recordForMode=()=>Math.max(0,...records.filter(record=>record.mode===settings.difficulty).map(record=>record.score));
function applyProfile(){
  if(profile?.photo)portrait.src=profile.photo;
  else portrait.removeAttribute('src');
  byId('pilot-greeting').textContent=profile?.name ? `Ready to fly, ${profile.name}?` : '';
}
function save(){
  try {localStorage.setItem(storageKey,JSON.stringify({settings,records,profile,unlocked,tourComplete}));} catch {}
}
function resize(){
  const oldWidth=width;
  const rect=canvas.getBoundingClientRect();
  if(!rect.width || !rect.height)return;
  scale=rect.height/HEIGHT;
  width=rect.width/scale;
  const dpr=Math.min(window.devicePixelRatio || 1,2);
  renderScale=scale*dpr;
  canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
  if(gates.length){
    const oldX=clamp(oldWidth*.27,76,300), delta=xPilot()-oldX;
    for(const gate of gates)gate.x+=delta;
    nextGate+=delta;
  }
}
window.addEventListener('resize',resize);
resize();

const screens=['profile','home','settings','leaderboard','help','route','paused','over'];
function show(next, moveFocus=true){
  state=next;
  for(const screen of screens)byId(screen).hidden=screen!==next;
  byId('hud').hidden=!['ready','running'].includes(next);
  byId('pause').hidden=!['ready','running','paused'].includes(next);
  byId('pause').textContent=next==='paused'?'▶':'Ⅱ';
  byId('pause').setAttribute('aria-label',next==='paused'?'Resume':'Pause');
  byId('cue').hidden=next!=='ready';
  byId('district-display').hidden=!['ready','running'].includes(next);
  if(next==='home')updateTourMenu();
  if(moveFocus && next==='profile'){
    byId('pilot-name').focus({preventScroll:true});
  }else if(moveFocus && screens.includes(next)){
    byId(next).querySelector('button').focus({preventScroll:true});
  } else if(moveFocus) {
    document.activeElement?.blur();
  }
}
function updateHUD(){
  byId('score').textContent=score;byId('best').textContent=Math.max(score,best);
  byId('coins').textContent=coins;byId('power').hidden=shield<=0;
  byId('shield').textContent=`${Math.ceil(shield)}s`;
}
function updateTourMenu(){
  byId('play-label').textContent=tourComplete?'Replay tour':unlocked?'Continue tour':'Play';
  byId('tour-progress').textContent=`${unlocked+1} of ${districts.length} districts visited`;
}
function enterDistrict(index, crossfade=false){
  previousDistrict=crossfade?districts[district]:null;
  district=index;
  entryTime=elapsed;
  districtGates=0;
  const site=districts[district];
  byId('district-welcome').textContent=`Welcome to ${site.name}`;
  byId('district-route-count').textContent=`${site.province} · District ${district+1} of ${districts.length}`;
  byId('district-landmark').textContent=site.landmark;
  byId('district-banner').classList.remove('settled');
  byId('district-landmark').style.opacity=crossfade?'0':'1';
  if(district>unlocked){unlocked=district;save();}
}
function start(index=tourComplete?0:unlocked){
  completedFlight=false;
  y=HEIGHT*.48;velocity=0;tilt=0;distance=0;elapsed=0;score=0;coins=0;
  shield=0;grace=0;center=HEIGHT*.49;nextGate=xPilot()+326;
  shake=0;gates=[];particles=[];best=recordForMode();
  enterDistrict(index);updateHUD();show('ready');
}
function burst(x,y,color,count,force=135){
  for(let i=0;i<count && particles.length<260;i++){
    const angle=rnd(0,TAU), speed=rnd(force*.25,force), life=rnd(.22,.75);
    particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,max:life,color,size:rnd(1.5,4.5)});
  }
}
function lift(){
  if(state==='ready')show('running');
  if(state!=='running')return;
  audio.unlock();audio.play('lift');
  velocity=-currentMode().lift;
  burst(xPilot()-18,y+13,'#ffc883',9,100);
}
function togglePause(){
  if(state==='paused'){show(focusState);return;}
  if(['ready','running'].includes(state)){focusState=state;show('paused');}
}
function fillStats(items){
  byId('stats').replaceChildren(...items.map(([label,value])=>{
    const block=document.createElement('div'), small=document.createElement('small'), strong=document.createElement('b');
    small.textContent=label;strong.textContent=value;block.append(small,strong);return block;
  }));
}
function finish(completed=false){
  completedFlight=completed;
  const record=score>best;
  if(completed){
    tourComplete=true;save();
  }else{
    shake=reducedMotion.matches?0:.24;
    burst(xPilot(),y,'#ffb47a',30,240);audio.play('hit');
  }
  if(score || coins){
    records.push({name:profile.name,mode:settings.difficulty,score,coins});
    records.sort((a,b)=>b.score-a.score || b.coins-a.coins);
    for(const mode of Object.keys(MODES)){
      const indices=records.map((entry,i)=>entry.mode===mode?i:-1).filter(i=>i>=0);
      for(const i of indices.slice(10).reverse())records.splice(i,1);
    }
    save();
  }
  byId('result-label').textContent=completed?'NEPAL TOUR COMPLETE':record?'NEW HIGH SCORE':'FLIGHT COMPLETE';
  byId('result-district').textContent=completed?`All ${districts.length} districts visited`:`Checkpoint · ${districts[district].name}`;
  byId('retry').textContent=completed?'Replay tour':'Try Again';
  if(record || completed){
    audio.play('record');
    for(const color of ['#ffc882','#8df3f1','#f7a4bf','#ffffcf']){
      burst(width*.23,HEIGHT*.42,color,23,375);
      burst(width*.77,HEIGHT*.42,color,23,375);
    }
  }
  fillStats([['SCORE',score],['BEST',Math.max(score,best)],['COINS',coins],['TIME',`${Math.floor(elapsed)}s`]]);
  show('over');
}
function leaderboard(){
  const container=byId('records');
  container.replaceChildren();
  const ranked=records.slice(0,8);
  if(!ranked.length){container.textContent='Complete a scoring flight to set a record.';return;}
  ranked.forEach((entry,index)=>{
    const row=document.createElement('div');row.className='record';
    for(const label of [`${index+1}. ${entry.name || 'Pilot'} · ${entry.mode}`,`${entry.score} pts`,`${entry.coins} coins`]){
      const cell=document.createElement('span');cell.textContent=label;row.append(cell);
    }
    container.append(row);
  });
}
function openRoute(){
  byId('route-progress').textContent=tourComplete?'Nepal tour complete':`Districts visited: ${unlocked+1} of ${districts.length}`;
  const entries=districts.map((site,index)=>{
    const item=document.createElement('li');
    const name=document.createElement('span');
    const landmark=document.createElement('small');
    name.textContent=site.name;landmark.textContent=site.landmark;
    const destination=document.createElement(index<=unlocked?'button':'div');
    destination.className='route-stop';
    if(index<=unlocked){
      destination.type='button';
      destination.dataset.action='district';
      destination.dataset.district=index;
    }else destination.classList.add('locked');
    destination.append(name,landmark);item.append(destination);return item;
  });
  byId('route-list').replaceChildren(...entries);
}
function gateAt(x){
  const mode=currentMode(), challenge=Math.min(score,32);
  const gap=mode.gap-challenge*1.22;
  center=clamp(center+rnd(-114,114),gap/2+87,HEIGHT-gap/2-83);
  const ordinal=gates.length ? gates.at(-1).ordinal+1 : 1;
  gates.push({x,top:center-gap/2,bottom:center+gap/2,width:64,ordinal,
    item:ordinal%5===3?'shield':'coin', itemY:center+rnd(-gap*.16,gap*.16), cleared:false, hit:false});
}
function hitsRect(px,py,r,x,top,w,bottom){
  const dx=px-clamp(px,x,x+w),dy=py-clamp(py,top,bottom);
  return dx*dx+dy*dy<r*r;
}
function update(dt){
  elapsed+=dt;
  const mode=currentMode(), speed=mode.speed+Math.min(score,40)*2.2;
  const advance=speed*dt;
  distance+=advance;
  velocity=Math.min(620,velocity+mode.gravity*dt);y+=velocity*dt;
  tilt+=(clamp(velocity/520,-.51,1.04)-tilt)*Math.min(1,dt*9);
  const before=Math.ceil(shield);
  shield=Math.max(0,shield-dt);grace=Math.max(0,grace-dt);
  if(before!==Math.ceil(shield))updateHUD();
  for(const gate of gates)gate.x-=advance;
  nextGate-=advance;
  const lead=Math.max(width+80,xPilot()+455);
  while(nextGate<lead){
    gateAt(nextGate);
    nextGate+=mode.spacing+rnd(-17,30)+Math.min(score,40)*1.15;
  }
  const px=xPilot(), radius=19;
  if(y<radius || y>HEIGHT-radius){y=clamp(y,radius,HEIGHT-radius);finish();return;}
  for(const gate of gates){
    const cx=gate.x+gate.width/2;
    if(gate.item && Math.hypot(px-cx,y-gate.itemY)<radius+14){
      if(gate.item==='coin'){coins++;audio.play('coin');burst(cx,gate.itemY,'#ffcf73',22);}
      else{shield=6;audio.play('shield');burst(cx,gate.itemY,'#7fffe7',26);}
      gate.item=null;updateHUD();
    }
    const collided=hitsRect(px,y,radius,gate.x,0,gate.width,gate.top)
      || hitsRect(px,y,radius,gate.x,gate.bottom,gate.width,HEIGHT);
    if(!gate.hit && grace<=0 && collided){
      if(shield<=0){finish();return;}
      shield=0;grace=.63;gate.hit=true;updateHUD();audio.play('shield');
      burst(px,y,'#9afcec',30,220);
    }
    if(!gate.cleared && gate.x+gate.width<px-radius){
      gate.cleared=true;score++;updateHUD();audio.play('gate');
      burst(px+10,y,'#fff4be',13);
      if(++districtGates===gatesPerDistrict){
        if(district===lastDistrict){finish(true);return;}
        enterDistrict(district+1,true);
      }
    }
  }
  gates=gates.filter(gate=>gate.x+gate.width>-25);
}
function gateColumn(x,edge,w,top,t,hit){
  const from=top?0:edge, h=top?edge:HEIGHT-edge;
  const trim=top?edge-15:edge;
  ctx.globalAlpha=hit?.57:1;
  const metal=ctx.createLinearGradient(x,0,x+w,0);
  metal.addColorStop(0,'#0b2433');metal.addColorStop(.1,'#3d6471');
  metal.addColorStop(.22,'#203b4d');metal.addColorStop(.68,'#122a3a');
  metal.addColorStop(.86,'#385366');metal.addColorStop(1,'#0a1c2c');
  ctx.fillStyle=metal;ctx.fillRect(x,from,w,h);
  ctx.fillStyle='#98c4c54a';ctx.fillRect(x+8,from,2,h);
  ctx.fillStyle='#071d2b';ctx.fillRect(x+w-10,from,3,h);
  for(let iy=from+23;iy<from+h-19;iy+=35){
    ctx.fillStyle='#9ec0be28';ctx.fillRect(x+13,iy,w-26,1);
    ctx.fillStyle='#050f1a';ctx.fillRect(x+18,iy+8,w-36,4);
    ctx.fillStyle='#65bcb160';ctx.fillRect(x+19,iy+8,6,2);
  }
  ctx.fillStyle='#1a3240';ctx.fillRect(x,trim,w,15);
  ctx.fillStyle='#517483';ctx.fillRect(x,trim,w,2);
  ctx.fillStyle='#151f2c';ctx.fillRect(x+7,trim+4,w-14,7);
  ctx.fillStyle=`rgba(121,255,225,${.72+.23*Math.sin(t*3+x*.016)})`;
  ctx.shadowBlur=9;ctx.shadowColor='#59ffe2';
  ctx.fillRect(x+13,trim+6,w-26,3);
  ctx.shadowBlur=0;ctx.globalAlpha=1;
}
function drawItem(gate,t){
  const x=gate.x+gate.width/2, y=gate.itemY+Math.sin(t*4+gate.ordinal)*3;
  ctx.save();ctx.translate(x,y);
  if(gate.item==='coin'){
    ctx.scale(.55+.45*Math.abs(Math.cos(t*3+gate.ordinal)),1);
    const gold=ctx.createLinearGradient(-9,-11,8,13);
    gold.addColorStop(0,'#fff8bd');gold.addColorStop(.5,'#f9b34c');gold.addColorStop(1,'#ad601d');
    ctx.shadowBlur=16;ctx.shadowColor='#ffc563';ctx.fillStyle=gold;
    ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#8e561b';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.stroke();
    ctx.fillStyle='#fff1a6';ctx.fillRect(-1.5,-6,3,12);
  }else{
    ctx.rotate(Math.sin(t*2)*.28);ctx.shadowBlur=17;ctx.shadowColor='#62ffe7';
    ctx.fillStyle='#b8fff0';ctx.strokeStyle='#39c6c8';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(13,-9);ctx.lineTo(11,6);
    ctx.quadraticCurveTo(8,13,0,17);ctx.quadraticCurveTo(-8,13,-11,6);
    ctx.lineTo(-13,-9);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
}
function drawPilot(x,y,angle,size,t){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  if(shield>0 || grace>0){
    ctx.strokeStyle=`rgba(139,255,240,${.59+.3*Math.sin(t*7)})`;
    ctx.fillStyle='#67ffdf20';ctx.shadowBlur=15;ctx.shadowColor='#7cffeb';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,size*.59,0,TAU);ctx.fill();ctx.stroke();
  }
  ctx.shadowBlur=14;ctx.shadowOffsetY=5;ctx.shadowColor='#071728a6';
  if(portrait.complete && portrait.naturalWidth){
    const imageWidth=size*portrait.naturalWidth/portrait.naturalHeight;
    ctx.drawImage(portrait,-imageWidth/2,-size/2,imageWidth,size);
  }else{
    ctx.fillStyle='#ffcf84';ctx.beginPath();ctx.ellipse(0,0,size*.51,size*.25,0,0,TAU);ctx.fill();
    ctx.fillStyle='#32788c';ctx.beginPath();ctx.ellipse(4,-5,size*.22,size*.16,0,0,TAU);ctx.fill();
  }
  ctx.restore();
}
let lastPhase='';
function render(){
  ctx.setTransform(renderScale,0,0,renderScale,0,0);
  const inFlight=['ready','running','paused','over'].includes(state);
  const t=ambient, night=inFlight?(1-Math.cos(elapsed*Math.PI/34))/2:0;
  const phase=night>.67?'STARLIGHT':night>.18?'TWILIGHT':'GOLDEN HOUR';
  if(phase!==lastPhase){byId('phase').textContent=phase;lastPhase=phase;}
  const age=elapsed-entryTime;
  const transition=!previousDistrict||reducedMotion.matches?1:clamp(age/1.6,0,1);
  if(inFlight && age>2.8)byId('district-banner').classList.add('settled');
  if(inFlight && previousDistrict){
    byId('district-landmark').style.opacity=String(transition);
    if(transition===1)previousDistrict=null;
  }
  scenery(width,HEIGHT,t,inFlight?distance:menuTravel,night,
    districts[inFlight?district:unlocked],inFlight?previousDistrict:null,transition);
  ctx.save();
  if(shake>0)ctx.translate(rnd(-18,18)*shake,rnd(-14,14)*shake);
  if(inFlight){
    for(const gate of gates){
      if(gate.x>width+20)continue;
      gateColumn(gate.x,gate.top,gate.width,true,t,gate.hit);
      gateColumn(gate.x,gate.bottom,gate.width,false,t,gate.hit);
      if(gate.item)drawItem(gate,t);
    }
    if(state!=='over')drawPilot(xPilot(),y+(state==='ready'?Math.sin(t*3)*7:0),tilt,59,t);
  }else if(state==='home'){
    const narrow=width<590, short=canvas.clientHeight<530;
    if(!short)drawPilot(narrow?width*.5:width*.78,narrow?HEIGHT*.20:HEIGHT*.51+Math.sin(t*2.4)*9,-.12+Math.sin(t*1.7)*.09,narrow?71:108,t);
  }
  for(const p of particles){
    ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill();
  }
  ctx.globalAlpha=1;ctx.restore();
}
function frame(now){
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.07):0;lastFrame=now;
  if(state!=='paused'){
    ambient+=reducedMotion.matches && !['ready','running'].includes(state)?0:dt;
    menuTravel+=dt*49;shake=Math.max(0,shake-dt);
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=125*dt;}
    particles=particles.filter(p=>p.life>0);
  }
  if(state==='running'){
    accumulator+=dt;
    while(accumulator>=STEP && state==='running'){update(STEP);accumulator-=STEP;}
  }else accumulator=0;
  render();requestAnimationFrame(frame);
}
function modeLabel(){byId('mode-label').textContent=settings.difficulty;}
function soundLabel(){
  byId('sound').textContent=settings.muted?'♩':'♪';
  byId('sound').setAttribute('aria-pressed',String(settings.muted));
}
for(const id of ['music','effects']){
  byId(id).value=settings[id];byId(id).addEventListener('input',event=>{
    settings[id]=Number(event.target.value);audio.unlock();audio.refresh();save();
  });
}
byId('difficulty').value=settings.difficulty;
byId('difficulty').addEventListener('change',event=>{settings.difficulty=event.target.value;modeLabel();save();});
byId('sound').addEventListener('click',()=>{
  settings.muted=!settings.muted;soundLabel();audio.unlock();audio.refresh();save();
});
byId('full').addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement){await document.exitFullscreen();}
    else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}
  }catch(error){console.warn('Fullscreen is unavailable.',error);}
});
if(!document.fullscreenEnabled)byId('full').hidden=true;
document.addEventListener('fullscreenchange',()=>byId('full').setAttribute('aria-pressed',String(!!document.fullscreenElement)));
byId('pause').addEventListener('click',togglePause);
byId('overlay').addEventListener('click',event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(!action)return;
  audio.unlock();
  if(action==='play')start(state==='over'||state==='paused'?(completedFlight?0:district):undefined);
  else if(action==='district'){
    const index=Number(event.target.closest('[data-district]').dataset.district);
    if(Number.isInteger(index)&&index>=0&&index<=unlocked)start(index);
  }
  else if(action==='resume')togglePause();
  else{
    if(action==='leaderboard')leaderboard();
    if(action==='route')openRoute();
    if(action==='profile')profileEditor.open();
    if(action==='home'){particles=[];shield=0;grace=0;}
    show(action);
  }
});
canvas.addEventListener('pointerdown',event=>{
  if(event.button===0 && ['ready','running'].includes(state)){event.preventDefault();lift();}
});
window.addEventListener('keydown',event=>{
  if(event.repeat)return;
  if(event.code==='Space' && ['ready','running'].includes(state) && !(event.target instanceof HTMLButtonElement)){
    event.preventDefault();lift();
  }
  if(event.code==='Escape' || event.code==='KeyP'){
    if(['ready','running','paused'].includes(state)){event.preventDefault();togglePause();}
    else if(['settings','leaderboard','help','route','over'].includes(state) && event.code==='Escape')show('home');
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden && ['ready','running'].includes(state))togglePause();});
modeLabel();soundLabel();applyProfile();show('profile',false);requestAnimationFrame(frame);
