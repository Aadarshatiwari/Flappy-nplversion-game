// Stylized illustrations of Nepal's architecture and natural landmarks.
export function makeLandmarks(ctx, stupa, pagoda) {
  const images = new Map();
  function makeIcon(site) {
    const canvas=document.createElement('canvas');
    canvas.width=340;canvas.height=240;
    const paint=canvas.getContext('2d');
    paint.translate(170,213);paint.scale(1.36,1.36);
    const variant=[...site.landmark].reduce((seed,c)=>Math.imul(seed,31)+c.charCodeAt(0)>>>0,113);
    const stone=['#b8a68b','#aeb0a0','#d2ba9b','#d5c6a6'][variant%4];
    const wall=['#914d39','#ae6c4d','#c38355','#d0ae84'][variant%4];
    const dark='#243338', gold='#dfb566';
    const rect=(x,y,w,h,color)=>{paint.fillStyle=color;paint.fillRect(x,y,w,h);};
    function poly(points,color){
      paint.beginPath();for(const [x,y] of points)paint.lineTo(x,y);
      paint.closePath();paint.fillStyle=color;paint.fill();
    }
    function oval(x,y,rx,ry,color){
      paint.beginPath();paint.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      paint.fillStyle=color;paint.fill();
    }
    function roof(y,width,height){
      poly([[-width,y],[-width*.27,y-height],[width*.27,y-height],[width,y]],'#573a36');
      poly([[-width,y],[width,y],[width*.86,y+4],[-width*.86,y+4]],gold);
    }
    function base(w){
      rect(-w,-6,2*w,7,'#526458');rect(-w+5,-11,2*w-10,5,stone);
    }
    function spire(x,y,w,h){
      poly([[x-w,y],[x-w*.77,y-h*.49],[x-w*.28,y-h*.88],[x,y-h],
        [x+w*.28,y-h*.88],[x+w*.77,y-h*.49],[x+w,y]],stone);
      for(let i=1;i<6;i++)rect(x-w*(1-i*.13),y-i*h/7,w*(2-i*.26),2,gold);
      oval(x,y-h,3.5,3,gold);
    }
    function houses(){
      for(let i=0;i<5;i++){
        const x=-98+i*39, y=-18-(variant>>i&7)*3;
        rect(x,y-29,33,29,i%2?wall:stone);
        poly([[x-4,y-28],[x+16,y-47],[x+37,y-28]],i%2?'#804c41':'#415461');
        rect(x+6,y-17,5,7,dark);rect(x+21,y-17,5,7,dark);
      }
    }
    function peak(height=126){
      const top=-(variant%27)-height;
      const split=site.landmark==='Machhapuchhre';
      const shape=[[-115,0],[-83,-33],[-57,-51],[-27,top*.68],[-7,top+10],
        [7,split?top+29:top],[23,split?top:top+23],[37,top*.65],[58,-60],[109,0]];
      poly(shape,'#9aafbd');
      poly([[-57,-51],...shape.slice(3,9),[45,-49],[20,-68],[12,-41],[-4,-76],[-29,-51]],'#eaf0e8');
      poly([[7,split?top+29:top],[23,split?top:top+23],[37,top*.65],[58,-60],
        [109,0],[46,-22],[24,-64]],'#687e97');
    }

    switch(site.style){
      case 'stupa': stupa(paint,0,0,1.32);break;
      case 'pagoda':
        if(site.landmark==='Nyatapola Temple'){
          base(64);
          for(let i=0;i<5;i++){
            const w=50-i*8,y=-18-i*19;
            rect(-w*.59,y-1,w*1.18,20,wall);
            rect(-4,y+4,8,10,dark);roof(y,w,12);
          }
          rect(-1,-112,2,9,gold);
        }else{
          pagoda(paint,0,0,wall,variant%2+2);
        }
        break;
      case 'durbar': {
        base(75);
        const seven=site.name==='Nuwakot', tiers=seven?7:3;
        const height=seven?15:24;
        rect(seven?-49:-66,-16-tiers*height,seven?98:132,tiers*height,wall);
        for(let i=0;i<tiers;i++){
          const y=-15-(i+1)*height;
          rect(seven?-50:-67,y,seven?100:134,3,stone);
          for(let j=-2;j<=2;j++){
            rect(j*17-4,y+6,8,7,dark);
            rect(j*17-5,y+5,10,2,gold);
          }
        }
        roof(-16-tiers*height,seven?60:76,15);
        rect(-6,-31,12,20,dark);
        break;
      }
      case 'shikhara':
        base(65);rect(-39,-45,78,34,wall);spire(-26,-42,18,48);
        spire(26,-42,18,48);spire(0,-38,25,80);rect(-6,-31,12,20,dark);break;
      case 'janaki': case 'palace': {
        const janaki=site.style==='janaki';
        base(100);rect(-88,-56,176,45,janaki?'#eee2cb':'#cfd7d1');
        rect(-31,-76,62,65,janaki?'#eee2cb':'#b9cdcf');
        for(const x of [-75,-50,-25,0,25,50,75]){
          const y=Math.abs(x)<=25?-46:-39;
          oval(x,y,6,8,'#42666e');rect(x-6,y,12,19,'#42666e');
        }
        if(janaki){for(const x of [-73,-42,0,42,73]){oval(x,x?-57:-82,x?12:22,x?11:15,gold);rect(x-1,x?-73:-102,2,7,gold);}}
        else{rect(-99,-58,198,5,'#52696f');rect(-39,-78,78,5,'#52696f');}
        break;
      }
      case 'shrine': case 'monastery': case 'sanctuary':
        base(67);rect(-52,-56,104,45,site.style==='sanctuary'?'#f3ead2':wall);
        rect(-15,-50,30,39,dark);rect(-44,-44,15,18,'#314f54');rect(29,-44,15,18,'#314f54');
        if(site.style==='sanctuary'){rect(-58,-61,116,7,'#decca6');rect(70,-80,5,70,stone);}
        else if(site.style==='monastery'){rect(-58,-60,116,9,'#703e39');rect(-39,-68,78,9,gold);}
        else{roof(-55,62,24);spire(0,-78,7,16);}
        break;
      case 'fort': case 'ruins': {
        const fort=site.style==='fort';
        if(site.name==='Okhaldhunga'){
          oval(0,-14,50,13,'#a4a896');oval(0,-31,50,20,stone);oval(0,-36,34,11,'#52605d');break;
        }
        base(95);
        for(let i=0;i<10;i++){
          const x=-90+i*18, height=fort?35+(i%4===0?24:0):13+((variant>>i)&7)*3;
          rect(x,-height-9,17,height,i%2?stone:'#928877');
          rect(x+2,-height+3,13,1,'#6d6e65');
        }
        if(fort){rect(-15,-34,30,25,dark);oval(0,-34,15,13,dark);}
        break;
      }
      case 'pillar':
        base(38);rect(-10,-111,20,102,stone);rect(-11,-111,6,102,'#d8cbb1');
        rect(-15,-115,30,7,gold);oval(0,-119,7,5,stone);break;
      case 'mound': oval(0,-7,86,10,'#4e624f');oval(0,-15,60,24,'#8e9a68');oval(0,-11,54,14,'#9fa26e');break;
      case 'peak': peak();break;
      case 'lake': case 'river': {
        if(site.terrain==='high')peak(80);
        if(site.style==='lake'){
          oval(0,-8,103,25,'#32808a');
          oval(-9,-12,85,14,'#569ea0');
          oval(-18,-11,59,2,'#b3d1bc');
          oval(35,-4,42,1.5,'#a0beba');
        }else{
          poly([[-102,-9],[-62,-16],[-25,-19],[5,-36],[-22,-44],[22,-51],[49,-44],
            [25,-36],[39,-22],[15,-8],[-23,4]],'#68a6a9');
          poly([[-90,-8],[-49,-15],[-19,-13],[9,-20],[-11,-3]],'#b0d1c5');
        }
        break;
      }
      case 'falls': case 'cave':
        poly([[-91,0],[-83,-54],[-57,-89],[37,-99],[72,-70],[86,0]],stone);
        poly([[-70,0],[-60,-61],[-41,-77],[43,-88],[68,-57],[64,0]],'#6d7773');
        if(site.style==='falls'){
          poly([[-5,-94],[17,-94],[11,-63],[20,-21],[29,0],[-26,0],[-11,-33]],'#c8e7e5');
          poly([[1,-93],[9,-91],[2,-52],[10,-6],[-6,-6],[-3,-48]],'#79b2cb');
          oval(0,0,48,6,'#a4ced0');
        }else{
          rect(-37,-40,73,40,dark);oval(0,-40,36,26,dark);rect(-10,-15,20,14,gold);
        }
        break;
      case 'bridge':
        for(const x of [-91,91])rect(x-4,-71,8,73,stone);
        paint.strokeStyle='#d7c9a4';paint.lineWidth=3;
        for(const shift of [-10,8]){
          paint.beginPath();paint.moveTo(-91,-60+shift);paint.quadraticCurveTo(0,-8+shift,91,-60+shift);paint.stroke();
        }
        for(let x=-76;x<=76;x+=12)rect(x,-44-25*(x/91)**2,1.5,18,'#c9bba5');
        break;
      case 'grove':
        oval(0,-5,108,13,'#73935f');
        for(let i=0;i<13;i++){
          const x=-95+i*15,y=-13-(variant>>i&7)*6;
          rect(x-2,y,4,-y,'#71644e');oval(x,y,13,9,'#536e4d');oval(x-4,y-4,10,9,'#8da46b');
        }
        break;
      case 'terraces':
        for(let i=0;i<6;i++)oval(7+i*4,-9-i*8,100-i*12,19,i%2?'#8da557':'#547951');
        if(site.name==='Ilam')houses();
        break;
      case 'village': houses();break;
    }
    return canvas;
  }

  return (site,w,h,night,alpha) => {
    if(!site || alpha<=0)return;
    if(!images.has(site.name))images.set(site.name,makeIcon(site));
    const icon=images.get(site.name);
    const width=Math.min(w*.53,h*.32), height=width*icon.height/icon.width;
    const x=w*(w<h*.68?.69:.75), ground=h*.845;
    ctx.save();ctx.globalAlpha=alpha*(1-night*.39);
    ctx.drawImage(icon,x-width/2,ground-height*213/240,width,height);
    ctx.restore();
  };
}
