import {makeLandmarks} from './landmarks.js?v=tour';

const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;
const color = (a, b, t) => `rgb(${a.map((v, i) => Math.round(mix(v, b[i], t))).join(',')})`;
function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const TILE_WIDTH = 1600, TILE_HEIGHT = 500;

function makeLayer() {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_WIDTH;
  canvas.height = TILE_HEIGHT;
  return canvas;
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  for (const [x,y] of points) ctx.lineTo(x,y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function himalayas() {
  const canvas = makeLayer();
  const ctx = canvas.getContext('2d');
  const rnd = random(791);
  // Twin summit and steep shoulders evoke Machhapuchhre.
  const skyline = [
    [0,285],[41,265],[82,232],[115,241],[150,201],[176,188],
    [197,145],[213,134],[227,111],[244,145],[252,141],[264,103],
    [279,131],[295,145],[326,195],[343,198],[377,235],[401,230],
    [441,207],[471,211],[511,178],[542,164],[562,170],[588,151],
    [608,162],[630,167],[665,192],[693,195],[727,225],[754,232],
    [790,210],[822,207],[852,179],[881,168],[917,183],[940,182],
    [962,207],[994,218],[1020,213],[1063,177],[1092,168],[1120,140],
    [1149,158],[1164,152],[1188,175],[1209,184],[1245,224],
    [1280,213],[1300,201],[1327,208],[1351,184],[1394,172],
    [1428,202],[1453,208],[1490,238],[1537,251],[1600,285]
  ];
  const profile = skyline.flatMap(([x,y], index) => {
    if (!index) return [[x,y]];
    const [px,py] = skyline[index-1];
    const edge = [];
    for(let next=px+6;next<x;next+=6) {
      edge.push([next,mix(py,y,(next-px)/(x-px))+rnd()*5-2.5]);
    }
    return [...edge,[x,y]];
  });
  const gradient = ctx.createLinearGradient(0,110,0,410);
  gradient.addColorStop(0,'#fff0dd');
  gradient.addColorStop(.29,'#d7e1ea');
  gradient.addColorStop(.64,'#7896aa');
  gradient.addColorStop(1,'#546f88');
  polygon(ctx,[...profile,[TILE_WIDTH,TILE_HEIGHT],[0,TILE_HEIGHT]],gradient);
  ctx.save();
  ctx.clip();
  const faces = [
    [[227,111],[247,153],[257,169],[277,187],[298,251],[326,312],[274,278],[242,208]],
    [[264,103],[280,132],[295,145],[346,212],[385,261],[355,249],[327,235],[301,191],[287,171]],
    [[197,145],[214,182],[210,222],[231,269],[251,313],[205,301],[178,242]],
    [[588,151],[614,166],[654,185],[700,232],[728,286],[692,276],[638,236],[616,204]],
    [[881,168],[921,183],[959,208],[985,256],[949,241],[918,218]],
    [[1120,140],[1150,157],[1170,169],[1195,191],[1238,263],[1195,241],[1155,208]],
    [[1394,172],[1435,204],[1470,221],[1515,278],[1463,259],[1428,232]]
  ];
  faces.forEach((face,i)=>polygon(ctx,face,i%2 ? '#637d99b0' : '#536f90a3'));
  for(let i=0;i<profile.length-1;i++){
    const [x,y]=profile[i];
    const length=12+rnd()*79, drift=rnd()*26;
    polygon(ctx,[[x,y],[x+3+rnd()*5,y+4],[x+drift+9,y+length],[x+drift,y+length*.72]],
      i%3===0?'#ffe9d44e':'#526c8a35');
  }
  ctx.restore();
  return canvas;
}

function stupa(ctx,x,y,scale) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  const steps = [[-70,-5,140,8],[-61,-12,122,7],[-51,-18,102,6]];
  for(const [left,top,width,height] of steps){
    ctx.fillStyle='#aaac98';
    ctx.fillRect(left,top,width,height);
    ctx.fillStyle='#e9dfc5';
    ctx.fillRect(left,top,width,2);
  }
  const dome=ctx.createLinearGradient(-47,-60,42,-10);
  dome.addColorStop(0,'#fff0ce');dome.addColorStop(.58,'#e4d9bd');dome.addColorStop(1,'#9caba7');
  ctx.beginPath();
  ctx.ellipse(0,-18,48,34,0,Math.PI,TAU);
  ctx.closePath();
  ctx.fillStyle=dome;ctx.fill();
  ctx.fillStyle='#b6874c';ctx.fillRect(-15,-57,30,14);
  ctx.fillStyle='#e5bd64';ctx.fillRect(-14,-56,24,11);
  for(const x of [-8,5]){
    ctx.fillStyle='#34425a';ctx.beginPath();ctx.ellipse(x,-51,4,1.65,0,0,TAU);ctx.fill();
    ctx.fillStyle='#242e3e';ctx.fillRect(x-1,-52,2,2);
  }
  ctx.fillStyle='#9f5844';ctx.fillRect(-2,-48,3,3);
  for(let i=0;i<9;i++){
    const width=27-i*2.65;
    ctx.fillStyle=i%2?'#b27634':'#ebbc58';
    ctx.fillRect(-width/2,-59-i*2.7,width,3);
  }
  ctx.fillStyle='#e5ac52';ctx.fillRect(-1,-91,2,10);
  ctx.beginPath();ctx.arc(0,-91,3,0,TAU);ctx.fill();
  const flags=['#385e99','#e9e3d2','#9f494d','#577458','#dbb254'];
  for(const side of [-1,1]){
    const point=t=>[side*116*t,-86+67*t+8*Math.sin(Math.PI*t)];
    ctx.beginPath();
    for(let i=0;i<=24;i++)ctx.lineTo(...point(i/24));
    ctx.strokeStyle='#785d4d';ctx.lineWidth=.8;ctx.stroke();
    for(let i=1;i<11;i++){
      const [fx,fy]=point(i/11);
      polygon(ctx,[[fx,fy],[fx+side*6,fy+2],[fx+side*4,fy+9],[fx,fy+7]],flags[(i+(side+1)*2)%flags.length]);
    }
  }
  ctx.restore();
}

function pagoda(ctx,x,y,wall="#8e5143",tiers=3) {
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle='#9b8d79';ctx.fillRect(-49,-7,98,8);
  ctx.fillStyle='#c4aa89';ctx.fillRect(-41,-13,82,6);
  for(const [half,roof] of [[38,-29],[29,-48],[21,-66]].slice(0,tiers)){
    ctx.fillStyle=wall;ctx.fillRect(-half*.58,roof,half*1.16,17);
    for(const offset of [-.32,0,.32]){
      ctx.fillStyle='#322f33';ctx.fillRect(half*offset-2,roof+3,4,10);
    }
    polygon(ctx,[[-half,roof+2],[-half*.64,roof-3],[-half*.33,roof-15],
      [half*.33,roof-15],[half*.64,roof-3],[half,roof+2]],'#383d44');
    polygon(ctx,[[-half,roof+2],[-half*.73,roof-1],[half*.73,roof-1],[half,roof+2]],'#b28b52');
  }
  ctx.fillStyle='#ba945a';ctx.fillRect(-1,-31-tiers*19,2,10);
  ctx.restore();
}

function hill(index) {
  const canvas = makeLayer();
  const ctx = canvas.getContext('2d');
  const rnd = random(612+index);
  const palette = [['#91a7a1','#586f7b'],['#7e9871','#324f55'],['#69865a','#183936']][index];
  const crest = x => {
    const a=x/TILE_WIDTH*TAU;
    return [323,371,445][index] - [26,29,26][index]*Math.cos(a*(index+2)+[.6,2,-1.03][index])
      + 12*Math.sin(a*(index+4)) + 3*Math.sin(a*16);
  };
  const points = Array.from({length:201},(_,i)=>[i*8,crest(i*8)]);
  const gradient=ctx.createLinearGradient(0,290,0,TILE_HEIGHT);
  gradient.addColorStop(0,palette[0]);gradient.addColorStop(1,palette[1]);
  polygon(ctx,[...points,[TILE_WIDTH,TILE_HEIGHT],[0,TILE_HEIGHT]],gradient);
  ctx.save();ctx.clip();
  if(index>0){
    for(let terrace=5;terrace<106;terrace+=index===2?8:11){
      ctx.beginPath();
      for(let x=0;x<=TILE_WIDTH;x+=8){
        const depth=Math.min(1,terrace/65);
        const curve=mix(crest(x), 411+12*Math.sin(x/TILE_WIDTH*TAU*3),depth*.42);
        ctx.lineTo(x,curve+terrace+Math.sin(x/TILE_WIDTH*TAU*8+terrace*.035)*4);
      }
      ctx.lineWidth=index===2?2:1.3;ctx.strokeStyle=index===2?'#a9aa6e77':'#abbb9170';ctx.stroke();
      ctx.translate(0,2);ctx.lineWidth=2;ctx.strokeStyle='#1a3b3b65';ctx.stroke();ctx.translate(0,-2);
    }
  }
  for(let i=0;i<4900;i++){
    const x=rnd()*TILE_WIDTH,y=280+rnd()*235;
    ctx.fillStyle=i%2?'#d9e5a522':'#12353a26';
    ctx.fillRect(x,y,.7+rnd()*3,.7+rnd()*2);
  }
  ctx.restore();
  if(index===2){
    for(let i=0;i<156;i++){
      const x=rnd()*TILE_WIDTH;
      const y=crest(x)+rnd()*27, height=2+rnd()*11;
      polygon(ctx,[[x-height*.28,y],[x,y-height],[x+height*.33,y]],i%2?'#25473f':'#38563e');
    }
  }
  return canvas;
}

function tintLayer(canvas) {
  const night = makeLayer();
  const ctx = night.getContext('2d');
  ctx.drawImage(canvas,0,0);
  ctx.globalCompositeOperation='source-atop';
  ctx.fillStyle='#111c47ad';
  ctx.fillRect(0,0,TILE_WIDTH,TILE_HEIGHT);
  return night;
}
const elevations = {
  valley: [.64,.79,.75,.88],
  hills: [.73,.88,1,1],
  high: [1.10,1.02,.72,.68],
  plains: [.12,.27,.39,.49],
  dry: [.94,.86,.73,.76]
};

export function makeScenery(ctx) {
  const drawLandmark=makeLandmarks(ctx,stupa,pagoda);
  const layers = [himalayas(),hill(0),hill(1),hill(2)].map(day=>({day,night:tintLayer(day)}));
  const rnd = random(42);
  const stars = Array.from({length:105}, () => [rnd(), rnd()*.7, .25+rnd()*1.4, rnd()]);
  const clouds = Array.from({length:22}, () => [rnd(), .09+rnd()*.57, 50+rnd()*170, rnd()]);
  const cloud = document.createElement('canvas');
  cloud.width = 320; cloud.height = 100;
  const paint = cloud.getContext('2d');
  for(let i = 0; i < 30; i++){
    const x = 52+rnd()*215, y = 30+rnd()*45, r = 12+rnd()*38;
    const glow = paint.createRadialGradient(x,y,0,x,y,r);
    glow.addColorStop(0,'#fff1e593'); glow.addColorStop(1,'#fff1e500');
    paint.fillStyle = glow; paint.fillRect(x-r,y-r,r*2,r*2);
  }
  return (w,h,t,travel,night,site,previous,transition=1) => {
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,color([23,63,93],[8,13,36],night));
    sky.addColorStop(.48,color([128,119,146],[25,39,73],night));
    sky.addColorStop(.75,color([246,155,115],[58,63,101],night));
    sky.addColorStop(1,color([255,213,151],[83,101,128],night));
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    for(const [x,y,r,p] of stars){
      ctx.globalAlpha=night*(.45+.35*Math.sin(t*1.6+p*TAU));
      ctx.fillStyle='#e4edff';ctx.beginPath();ctx.arc(x*w,y*h,r,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
    const sunX=w*.77, sunY=h*.44, radius=Math.min(h,w)*.068;
    const halo=ctx.createRadialGradient(sunX,sunY,radius*.5,sunX,sunY,radius*4.4);
    halo.addColorStop(0,color([255,192,124],[129,179,248],night));
    halo.addColorStop(.28,night > .5 ? '#84b3ef42' : '#ffb87863');
    halo.addColorStop(1,'#ffba7800');
    ctx.globalAlpha=.76-night*.25;ctx.fillStyle=halo;ctx.fillRect(sunX-radius*4.4,sunY-radius*4.4,radius*8.8,radius*8.8);ctx.globalAlpha=1;
    ctx.fillStyle=color([255,233,177],[216,232,255],night);ctx.beginPath();ctx.arc(sunX,sunY,radius,0,TAU);ctx.fill();
    for(const [x,y,s,p] of clouds){
      const span=w+s*2, cx=((x*span-t*(5+p*9)-travel*.013)%span+span)%span-s;
      ctx.globalAlpha=(.26+p*.43)*(1-night*.6);
      ctx.drawImage(cloud,cx,y*h,s*1.7,s*.44);
    }
    ctx.globalAlpha=1;
    const from=elevations[previous?.terrain || site.terrain], to=elevations[site.terrain];
    for(let i=0;i<layers.length;i++){
      const elevation=mix(from[i],to[i],transition), top=h*(1-elevation);
      const span=Math.max(w*1.14,h*1.68);
      const offset=-(travel*[.035,.075,.14,.24][i]%span);
      for(let x=offset;x<w;x+=span){
        ctx.drawImage(layers[i].day,x,top,span+1,h*elevation);
        if(night>.015){
          ctx.globalAlpha=night;
          ctx.drawImage(layers[i].night,x,top,span+1,h*elevation);
          ctx.globalAlpha=1;
        }
      }
    }
    drawLandmark(previous,w,h,night,1-transition);
    drawLandmark(site,w,h,night,transition);
    const vignette=ctx.createRadialGradient(w*.5,h*.45,Math.min(w,h)*.24,w*.5,h*.49,Math.hypot(w,h)*.58);
    vignette.addColorStop(0,'#09142600');vignette.addColorStop(1,'#050e2092');
    ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  };
}
