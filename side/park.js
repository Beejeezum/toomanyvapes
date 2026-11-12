/* Too Many Vapes · side-scroller prototype · Tuesday: "The Anthem" (the park)
   A long photographed clay diorama (side/img/park_*.jpg, stitched from four panels) with a shallow walkable band of
   depth. Sprites are green-screen clay frames cut by scratchpad/side/cut.py (side/img/<name>.png + .json {w,h,n}).
   Loop: out from Cloud Kingz (left) -> win La Diva at the gazebo (right) -> hook 5 grandmas -> lead them back to the shop.
   Everything that moves is stepped on twos (12 fps) with a little clay boil; the camera stays smooth. */
(()=>{'use strict';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const H=1080,VW=1920; // world units: the strip is 1080 tall; the view is 16:9
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a),PI=Math.PI;
const touch=matchMedia('(pointer:coarse)').matches;if(touch)document.body.classList.add('touch');

/* ---------------- assets ---------------- */
const IMG={},META={};
const SPR=['bro_walk','bro_act','gran_walk','gran_pose','diva','sal','pigeon','puff'];
let STRIP=null;const TILES=[];
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
async function load(){
  STRIP=await (await fetch('img/park.json')).json();
  const jobs=[];for(let k=0;k<STRIP.n;k++)jobs.push(loadImg(`img/park_${k}.jpg`).then(i=>TILES[k]=i));
  for(const n of SPR){jobs.push(loadImg(`img/${n}.png`).then(i=>IMG[n]=i));jobs.push(fetch(`img/${n}.json`).then(r=>r.json()).then(j=>META[n]=j))}
  await Promise.all(jobs)}

/* ---------------- audio ---------------- */
let AC=null,MASTER=null;const BUF={};
const SFX=['inhale_1','exhale_1','exhale_2','cough_1','cough_2','perfect_sting','fail_sting','fanfare','pigeon_1','pigeon_2','grandma_1','mmph_1','pickup'];
const VO=['be_sal_call_2','diva_again','diva_won','sal_alr_1','sal_n1','sal_n2','sal_n3','sal_n4','sal_n5','sal_clear'];
async function audioInit(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=.9;MASTER.connect(AC.destination);
  const get=(k,p)=>fetch(p).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(d=>BUF[k]=d).catch(()=>{});
  await Promise.all([...SFX.map(k=>get(k,`../audio/sfx/${k}.mp3`)),...VO.map(k=>get(k,`../audio/vo/${k}.mp3`))]);
  music('../audio/score/05_word_of_mouth.mp3',.28);music('../audio/amb/park.mp3',.22)}
function play(k,vol=1,rate=1){if(!AC||!BUF[k])return null;const s=AC.createBufferSource();s.buffer=BUF[k];s.playbackRate.value=rate;const g=AC.createGain();g.gain.value=vol;s.connect(g).connect(MASTER);s.start();return{s,g}}
const decks=[];function music(src,vol){const a=new Audio(src);a.loop=true;a.volume=vol;a.play().catch(()=>{});decks.push(a)}
function duck(){}

/* ---------------- captions ---------------- */
let capT=0;function say(who,text,vo){const c=$('cap');c.innerHTML=(who?`<b>${who}</b>`:'')+text;c.classList.add('on');
  let dur=Math.max(2.2,text.length*.055);if(vo){const p=play(vo,1);if(p)dur=Math.max(dur,p.s.buffer.duration+.4)}capT=dur}

/* ---------------- world layout ---------------- */
const Y0=785,Y1=968;                 // feet line: back of the walkable band .. front
const depth=y=>(y-Y0)/(Y1-Y0),scaleAt=y=>lerp(.74,1,clamp(depth(y),0,1));
let WW=9224;                         // world width (from park.json)
const SHOP={x:660,y:905,door:450,dy:900,zone:1000};
const DIVA_X=8590,DIVA_Y=806;
const BENCHES=[3771,4960,5993,7675];

/* ---------------- entities ---------------- */
const P={x:1150,y:900,vx:0,face:1,anim:0,act:0,walk:0};
const grans=[];BENCHES.forEach((bx,i)=>{for(const off of[-46,48]){if(grans.length>=7)break;
  grans.push({x:bx+off,y:Y0+18+rand(0,8),hx:bx+off,hy:Y0+18,state:'frozen',t:rand(0,1),face:off<0?1:-1,f:0,cool:0,lag:0,startle:0,boil:0})}});
const conga=[];               // grandmas following, in order
const trail=[];               // player path samples {x,y}
const pigeons=[];for(const cx of[2650,5350,6900])for(let i=0;i<4;i++)pigeons.push({x:cx+rand(-90,90),y:rand(Y0+40,Y1-30),face:Math.random()<.5?1:-1,state:'peck',t:rand(0,2),vy:0,alt:0,f:0});
const puffs=[];               // cotton puffs {x,y,s,life,max,vx,vy,k}
const DIVA={state:'sing',t:0,phase:0,wins:0,f:0,scold:0};
const SAL={f:0,t:0};
let delivered=0,mode='card',time=0,camX=0,winT=0;
const lung={on:false,v:0,target:null};

/* ---------------- input ---------------- */
const K={};addEventListener('keydown',e=>{K[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>{K[e.code]=false});
let stick={x:0,y:0},puffHeld=false,mouseHeld=false;
cv.addEventListener('mousedown',()=>mouseHeld=true);addEventListener('mouseup',()=>mouseHeld=false);
{const st=$('stick'),kn=st.querySelector('i');let id=null,cx=0,cy=0;
  st.addEventListener('pointerdown',e=>{id=e.pointerId;const r=st.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;st.setPointerCapture(id);mv(e)});
  const mv=e=>{if(e.pointerId!==id)return;let dx=(e.clientX-cx)/50,dy=(e.clientY-cy)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}stick={x:dx,y:dy};kn.style.transform=`translate(${dx*38}px,${dy*38}px)`};
  st.addEventListener('pointermove',mv);const up=e=>{if(e.pointerId!==id)return;id=null;stick={x:0,y:0};kn.style.transform=''};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  const pb=$('puffbtn');pb.addEventListener('pointerdown',e=>{puffHeld=true;pb.setPointerCapture(e.pointerId)});pb.addEventListener('pointerup',()=>puffHeld=false);pb.addEventListener('pointercancel',()=>puffHeld=false)}
const holding=()=>!!(K.Space||K.KeyJ||mouseHeld||puffHeld);

/* ---------------- helpers ---------------- */
function nearestTarget(){let best=null,bd=1e9;
  const reach=(x,y,r)=>{const dx=(x-P.x)*Math.sign(P.face||1),dz=Math.abs(y-P.y);if(dx<-40||dx>r||dz>70)return 1e9;return Math.abs(dx)+dz*1.5};
  if(DIVA.state!=='won'){const d=reach(DIVA_X,P.y,330);if(d<bd){bd=d;best={kind:'diva'}}}
  for(const g of grans){if(g.state==='conga'||g.state==='puffing'||g.state==='hooked'||g.state==='home')continue;const d=reach(g.x,g.y,230);if(d<bd){bd=d;best={kind:'gran',g}}}
  return best}
function addPuff(x,y,s,vx=0,vy=-30){puffs.push({x,y,s,life:0,max:rand(1.1,1.7),vx:vx+rand(-12,12),vy:vy+rand(-10,6),k:(Math.random()*4)|0,rot:rand(-.3,.3)})}

/* ---------------- game logic ---------------- */
const GREEN0=.56,GREEN1=.8,FILL=1/1.45;
function release(){const t=lung.target,v=lung.v;lung.on=false;lung.v=0;$('lung').classList.remove('on');
  if(lung.snd){try{lung.snd.g.gain.setTargetAtTime(0,AC.currentTime,.03);lung.snd.s.stop(AC.currentTime+.2)}catch(e){}lung.snd=null}
  if(!t)return;const good=v>=GREEN0&&v<=GREEN1,over=v>GREEN1;
  const hx=P.x+P.face*110,hy=P.y-scaleAt(P.y)*250;
  if(t.kind==='diva'){
    if(good&&DIVA.phase===2){DIVA.wins++;play('perfect_sting',.7);play('exhale_1',.8);for(let i=0;i<4;i++)addPuff(DIVA_X-30,DIVA_Y-200,.8,rand(-40,10),-20);
      if(DIVA.wins>=3){DIVA.state='won';DIVA.t=0;duck(false);say('LA DIVA','Bravissima! BRAVISSIMA! Darling… does it come in MANGO?','diva_won');
        for(const g of grans){g.state='waiting';g.t=rand(0,.8)}setGoal('HOOK 5 GRANDMAS','then walk them back to Cloud Kingz, nice and slow')}
    }else{play(over?'cough_1':'fail_sting',.6);if(DIVA.scold<=0){say('LA DIVA','Ah-ah-ah, darling. Not yet. Wait for the top of the phrase!','diva_again');DIVA.scold=5}}
    return}
  const g=t.g;
  if(g.state==='frozen'){play('mmph_1',.6);g.startle=.6;return}           // hands over ears: she won't take it while the anthem plays
  if(good){g.state='puffing';g.t=0;play('exhale_2',.7);addPuff(g.x+g.face*30,g.y-scaleAt(g.y)*240,1.1,g.face*20,-25)}
  else if(over){play('cough_2',.7);g.cool=1.6;g.startle=.8;addPuff(hx,hy,.8,P.face*60,-10)}
  else{play('mmph_1',.5);addPuff(hx,hy,.5,P.face*40,-10)}}

function setGoal(a,b){$('goal').innerHTML=`${a}<small>${b}</small>`}

function update(dt){time+=dt;
  // ---- player
  let ix=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0)+stick.x,iy=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0)+stick.y;
  ix=clamp(ix,-1,1);iy=clamp(iy,-1,1);
  const hold=holding()&&mode==='play';
  const run=!!(K.ShiftLeft||K.ShiftRight)||Math.hypot(stick.x,stick.y)>.95;const sp=hold?0:run?500:300;P.vx=ix*sp;P.x=clamp(P.x+ix*sp*dt,180,WW-260);P.y=clamp(P.y+iy*sp*.42*dt,Y0,Y1);
  if(Math.abs(ix)>.1)P.face=ix>0?1:-1;
  const moving=(Math.abs(ix)+Math.abs(iy))>.1&&!hold;P.walk=moving?P.walk+dt:0;
  // trail for the conga line
  const last=trail[trail.length-1];if(!last||Math.hypot(P.x-last.x,(P.y-last.y)*1.6)>8){trail.push({x:P.x,y:P.y});if(trail.length>900)trail.shift()}
  // ---- puffing (hold to fill the lung meter, release to give)
  if(mode==='play'){
    if(hold&&!lung.on){lung.target=nearestTarget();lung.on=true;lung.v=0;$('lung').classList.add('on');lung.snd=play('inhale_1',.6)}
    if(lung.on&&hold){lung.v=Math.min(1.08,lung.v+dt*FILL);if(lung.v>=1.08)release()}
    if(lung.on&&!hold)release();
    $('lung').querySelector('i').style.width=(Math.min(1,lung.v)*100)+'%'}
  // ---- La Diva: phrases of 3 s; the top of each phrase (fan raised) is the only moment she'll accept a puff
  DIVA.t+=dt;DIVA.scold=Math.max(0,DIVA.scold-dt);
  if(DIVA.state==='sing'){const ph=DIVA.t%3.2;DIVA.phase=ph<1.7?(ph<.85?0:1):ph<2.55?2:3}
  // ---- grandmas
  for(const g of grans){g.t+=dt;g.cool=Math.max(0,g.cool-dt);g.startle=Math.max(0,g.startle-dt);
    if(g.state==='puffing'&&g.t>.7){g.state='hooked';g.t=0;play('grandma_1',.5)}
    else if(g.state==='hooked'&&g.t>.9){g.state='conga';g.lag=0;conga.push(g);play('pickup',.5);updCount()}
    else if(g.state==='lost'){ // wanders back to her bench
      const dx=g.hx-g.x,dy=g.hy-g.y,d=Math.hypot(dx,dy);if(d>6){g.x+=dx/d*120*dt;g.y+=dy/d*120*dt;g.face=dx>0?1:-1;g.walk=(g.walk||0)+dt}else{g.state='waiting';g.walk=0}}}
  // conga: each follower walks to the trail point (i+1)*spacing behind the player, at grandma pace
  {let need=0,j=trail.length-1;
    for(let i=0;i<conga.length;i++){const g=conga[i];need+=i===0?120:96;
      let acc=0;j=trail.length-1;let tp=trail[j];while(j>0&&acc<need){const a=trail[j],b=trail[j-1];acc+=Math.hypot(a.x-b.x,a.y-b.y);j--;tp=trail[j]}
      const dx=tp.x-g.x,dy=tp.y-g.y,d=Math.hypot(dx,dy),spd=g.startle>0?0:290;
      if(d>4){const st=Math.min(d,spd*dt);g.x+=dx/d*st;g.y+=dy/d*st;g.face=dx>.5?1:dx<-.5?-1:g.face;g.walk=(g.walk||0)+dt}else g.walk=0;
      g.lag=d>260?g.lag+dt:Math.max(0,g.lag-dt*2)}
    // rush and the slowest falls off the back of the line
    for(let i=conga.length-1;i>=0;i--){const g=conga[i];if(g.lag>1.8){conga.splice(i,1);g.state='lost';g.lag=0;play('grandma_1',.6);say('','Oof, my hip. Slow down, dear!');updCount();break}}}
  // ---- delivery at Cloud Kingz: they peel off the line one at a time
  if(P.x<SHOP.zone&&conga.length&&!deliverBusy){deliverBusy=true;const g=conga.shift();g.state='home';g.t=0;updCount()}
  for(const g of grans)if(g.state==='home'){const dx=SHOP.door-g.x,dy=SHOP.dy-g.y,d=Math.hypot(dx,dy);
    if(d>12){g.x+=dx/d*230*dt;g.y+=dy/d*230*dt;g.face=dx>0?1:-1;g.walk=(g.walk||0)+dt}else if(!g.inside){g.inside=true;delivered++;deliverBusy=false;SAL.t=0;SAL.f=2;
      play(delivered===1?'sal_alr_1':'sal_n'+Math.min(5,delivered),1);updCount();if(delivered>=5)win()}}
  // ---- pigeons: peck until something comes close, then burst up (and startle the grandmas near them)
  for(const b of pigeons){b.t+=dt;if(b.state==='peck'){const near=[P,...conga].some(o=>Math.abs(o.x-b.x)<130&&Math.abs(o.y-b.y)<60);
      if(near){b.state='fly';b.vy=-rand(260,360);b.vx=rand(-160,160);play(Math.random()<.5?'pigeon_1':'pigeon_2',.5);for(const g of conga)if(Math.abs(g.x-b.x)<220)g.startle=Math.max(g.startle,.9)}
      else if(b.t>rand(1.2,2.6)){b.t=0;b.x+=rand(-24,24);b.face=Math.random()<.5?1:-1}}
    else{b.alt+= -b.vy*dt;b.x+=b.vx*dt;b.vy+=60*dt;if(b.alt>900)b.gone=true}}
  // ---- puffs
  for(const p of puffs){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy-=6*dt}for(let i=puffs.length-1;i>=0;i--)if(puffs[i].life>puffs[i].max)puffs.splice(i,1);
  // ---- camera: smooth, leading the way you face
  const want=clamp(P.x-VW*.42+P.face*120,0,WW-VW);camX=lerp(camX,want,1-Math.exp(-dt*4));
  if(capT>0){capT-=dt;if(capT<=0)$('cap').classList.remove('on')}
  SAL.t+=dt;if(SAL.t>1.6)SAL.f=conga.length&&P.x<2600?1:0;
  if(mode==='won'){winT+=dt}}
let deliverBusy=false;
function updCount(){$('cn').textContent=delivered+(conga.length?` +${conga.length}`:'')}
function win(){mode='won';winT=0;play('fanfare',.7);setTimeout(()=>say('SAL',"That's the district, kid! Look at 'em all! LOOK at 'em!",'sal_clear'),900);
  setTimeout(()=>{const c=$('card');c.querySelector('h1').textContent='TUESDAY · CLEAR';c.querySelectorAll('p')[0].textContent='Five grandmas in the door. Word of mouth is about to do the rest.';c.querySelectorAll('p')[1].hidden=true;$('go').textContent='PLAY AGAIN';c.hidden=false},4200)}

/* ---------------- drawing ---------------- */
// stop motion: every moving thing is posed on a 12 fps clock with a little clay boil; the camera stays smooth
const STEP=1/12;let stepT=0,tick=0;const POSE=new Map();
function posed(o,x,y){let p=POSE.get(o);if(!p||p.tick!==tick){if(!p||tickChanged(p)){p={x,y,b:1+rand(-.012,.012),r:rand(-.006,.006),tick}}POSE.set(o,p)}return p}
function tickChanged(p){return p.tick!==tick}
function frame(name,i,x,y,h,flip,alpha=1,b=1,r=0){const im=IMG[name],m=META[name];if(!im||!m)return;i=((i%m.n)+m.n)%m.n;
  const w=m.w*h/m.h*b,hh=h*b;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(r)ctx.rotate(r);if(flip)ctx.scale(-1,1);
  ctx.drawImage(im,i*m.w,0,m.w,m.h,-w/2,-hh,w,hh);ctx.restore()}
function shadow(x,y,w){ctx.save();ctx.fillStyle='rgba(28,18,8,.30)';ctx.filter='blur(6px)';ctx.beginPath();ctx.ellipse(x,y-2,w,w*.22,0,0,PI*2);ctx.fill();ctx.restore()}
const GRAIN=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const k=c.getContext('2d'),d=k.createImageData(256,256);
  for(let i=0;i<d.data.length;i+=4){const v=128+(Math.random()-.5)*90;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}k.putImageData(d,0,0);return c})();
let grainPat=null;
function felts(){ // soft felt mounds in the foreground, out of focus, hiding the panel joins
  ctx.save();ctx.filter='blur(10px)';for(const jx of (STRIP.joins||[])){for(const [ox,w,h,c] of [[-60,260,95,'#1f4f26'],[90,190,70,'#2a6430']]){
    const x=camX+(jx+ox-camX)*1.18;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,H+10,w,h,0,PI,0);ctx.fill()}}ctx.restore()}

function draw(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#120d09';ctx.fillRect(0,0,VW,H);
  ctx.translate(-Math.round(camX),0);
  // the set
  const TW=STRIP.tile;for(let k=0;k<STRIP.n;k++){const x0=k*TW;if(x0>camX+VW||x0+TW<camX)continue;const im=TILES[k];if(im)ctx.drawImage(im,x0,0)}
  // depth-sorted cast
  const L=[];
  // Sal outside the shop door
  L.push({y:SHOP.y,d(){const s=scaleAt(SHOP.y);const p=posed(SAL,SHOP.x,SHOP.y);shadow(p.x,p.y,62*s);frame('sal',SAL.f,p.x,p.y,262*s,false,1,p.b,p.r)}});
  // La Diva on the gazebo stage
  L.push({y:DIVA_Y,d(){const p=posed(DIVA,DIVA_X,DIVA_Y);let f;if(DIVA.state==='won')f=DIVA.t<2.2?4:5;else f=[0,2,1,3][DIVA.phase];
    if(DIVA.state==='sing'&&tick%2&&DIVA.phase<2)f=f===0?2:0;frame('diva',f,p.x,p.y,282,false,1,p.b,p.r);
    // the anthem: a few cotton notes drifting off while she sings
    }});
  for(const g of grans){if(g.inside)continue;L.push({y:g.y,d(){const s=scaleAt(g.y),p=posed(g,g.x,g.y);let name='gran_pose',f=2,h=292*s;
      if(g.state==='frozen'){f=(Math.floor(g.t*1.4)%2);h=252*s}
      else if(g.state==='waiting'){f=g.cool>0||g.startle>0?2:4}
      else if(g.state==='puffing')f=3;else if(g.state==='hooked')f=g.t<.45?4:5;
      else if((g.state==='conga'||g.state==='lost'||g.state==='home')&&g.walk>0){name='gran_walk';f=Math.floor(g.walk*10)}
      else if(g.state==='conga')f=4;
      const flip=name==='gran_pose'&&g.state==='frozen'?g.face<0:g.face<0;
      const shake=g.startle>0?Math.sin(time*40)*4:0;
      shadow(p.x,p.y,52*s);frame(name,f,p.x+shake,p.y,h,flip,1,p.b,p.r)}})}
  for(const b of pigeons){if(b.gone)continue;L.push({y:b.y,d(){const s=scaleAt(b.y),p=posed(b,b.x,b.y-b.alt);const f=b.state==='fly'?2+(tick%2):(b.t%1.2<.5?0:1);
    if(b.alt<20)shadow(b.x,b.y,24*s);frame('pigeon',f,p.x,p.y,78*s,b.face>0,1,p.b,0)}})}
  // the Bro
  L.push({y:P.y,d(){const s=scaleAt(P.y),p=posed(P,P.x,P.y);let name='bro_walk',f=0,h=372*s;
    if(lung.on){name='bro_act';f=lung.v>.5?2:1;h=378*s}else if(mode==='won'){name='bro_act';f=4;h=378*s}else if(P.walk>0)f=Math.floor(P.walk*11);else{name='bro_act';f=0;h=378*s}
    shadow(p.x,p.y,60*s);frame(name,f,p.x,p.y,h,P.face<0,1,p.b,p.r)}});
  L.sort((a,b)=>a.y-b.y);for(const o of L)o.d();
  // cotton puffs
  for(const p of puffs){const k=p.life/p.max,a=Math.min(1,k*8)*(1-k*k);const pp=posed(p,p.x,p.y);frame('puff',p.k,pp.x,pp.y+60*p.s,(90+130*k)*p.s,false,a*.95,pp.b,p.rot)}
  felts();
  // lens + film: vignette and grain in screen space
  ctx.setTransform(1,0,0,1,0,0);
  const vg=ctx.createRadialGradient(VW/2,H*.48,H*.35,VW/2,H*.5,H*1.05);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,6,2,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,VW,H);
  if(!grainPat)grainPat=ctx.createPattern(GRAIN,'repeat');ctx.save();ctx.globalAlpha=.07;ctx.globalCompositeOperation='overlay';ctx.translate((tick*37)%256,(tick*91)%256);ctx.fillStyle=grainPat;ctx.fillRect(-256,-256,VW+512,H+512);ctx.restore()}

/* ---------------- loop ---------------- */
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;stepT+=dt;if(stepT>=STEP){stepT%=STEP;tick++}
  if(mode==='play'||mode==='won')update(dt);else if(mode==='card'){DIVA.t+=dt;const ph=DIVA.t%3.2;DIVA.phase=ph<1.7?(ph<.85?0:1):ph<2.55?2:3;for(const g of grans)g.t+=dt}
  draw();requestAnimationFrame(loop)}

function reset(){delivered=0;conga.length=0;trail.length=0;deliverBusy=false;Object.assign(P,{x:1150,y:900,face:1,walk:0});
  grans.forEach(g=>{Object.assign(g,{x:g.hx,y:g.hy+rand(0,8),state:'frozen',inside:false,lag:0,walk:0,startle:0,cool:0})});
  for(const b of pigeons){b.state='peck';b.alt=0;b.gone=false}Object.assign(DIVA,{state:'sing',t:0,wins:0,scold:0});
  setGoal('WIN OVER LA DIVA','then walk 5 grandmas to Cloud Kingz');updCount()}

$('go').addEventListener('click',async()=>{$('card').hidden=true;if(mode==='won')reset();mode='play';await audioInit();
  setTimeout(()=>say('SAL','Nobody walks out on the opera lady mid-song. Win her over, and every grandma in that park is ours. Then walk me five!','be_sal_call_2'),600)});

window.__park={P,grans,conga,DIVA,get mode(){return mode},set mode(v){mode=v},get camX(){return camX},reset,lung,pigeons,
  win:()=>{DIVA.state='won';for(const g of grans)g.state='waiting'},hookAll:n=>{for(const g of grans.slice(0,n)){g.state='conga';g.x=P.x-80;g.y=P.y;conga.push(g)}updCount()}};

load().then(()=>{WW=STRIP.w;camX=0;updCount();requestAnimationFrame(loop)});
})();
