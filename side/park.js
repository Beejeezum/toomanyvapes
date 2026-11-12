/* Too Many Vapes · side-scroller prototype · Tuesday: "The Anthem" (the park)
   A long photographed clay diorama (side/img/park_*.jpg) with a shallow walkable band of depth. Sprites are clay frames
   (side/img/<name>.png + .json {w,h,n}) cut from generated sheets.
   Day: the Mayor's morning announcement (reshoot clips) -> out from Cloud Kingz -> win La Diva on the top notes of her
   anthem -> hook 5 grandmas -> lead the conga home past the Mayor's sprinklers, a scooter kid and a loose terrier
   -> Sal counts them in -> the evening clips.
   Moving things are posed on twos (12 fps) with a little clay boil; the camera stays smooth.
   Add #mute to the URL to silence everything (testing). */
(()=>{'use strict';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const H=1080,VW=1920;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[(Math.random()*a.length)|0],PI=Math.PI;
const touch=matchMedia('(pointer:coarse)').matches;if(touch)document.body.classList.add('touch');
const MUTED=/mute/.test(location.hash);

/* ---------------- assets ---------------- */
const IMG={},META={};
const SPR=['bro_walk','bro_side','gran_walk','gran_pose','diva','sal','pigeon','puff','sprinkler','dog','tuba','scooter'];
let STRIP=null;const TILES=[];
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
async function load(){
  STRIP=await (await fetch('img/park.json')).json();
  const jobs=[];for(let k=0;k<STRIP.n;k++)jobs.push(loadImg(`img/park_${k}.jpg`).then(i=>TILES[k]=i));
  for(const n of SPR){jobs.push(loadImg(`img/${n}.png`).then(i=>IMG[n]=i));jobs.push(fetch(`img/${n}.json`).then(r=>r.ok?r.json():null).then(j=>META[n]=j).catch(()=>{}))}
  await Promise.all(jobs)}

/* ---------------- audio ---------------- */
let AC=null,MASTER=null;const BUF={};
const SFX=['inhale_1','exhale_1','exhale_2','cough_1','cough_2','perfect_sting','fail_sting','fanfare','pigeon_1','pigeon_2','grandma_1','mmph_1','pickup','tuba','bark_1','bark_2','yelp_f_1','yelp_f_2'];
const VO=['be_sal_call_2','diva_again','diva_won','sal_alr_1','sal_alr_2','sal_n1','sal_n2','sal_n3','sal_n4','sal_n5','sal_clear'];
const LOCAL={aria:'audio/diva_aria.mp3',sprinkler:'audio/sprinkler.mp3',bell:'audio/scooter_bell.mp3'};
async function audioInit(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=MUTED?0:.9;MASTER.connect(AC.destination);
  const get=(k,p)=>fetch(p).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(d=>BUF[k]=d).catch(()=>{});
  await Promise.all([...SFX.map(k=>get(k,`../audio/sfx/${k}.mp3`)),...VO.map(k=>get(k,`../audio/vo/${k}.mp3`)),...Object.entries(LOCAL).map(([k,p])=>get(k,p))])}
function play(k,vol=1,rate=1){if(!AC||!BUF[k])return null;const s=AC.createBufferSource();s.buffer=BUF[k];s.playbackRate.value=rate;const g=AC.createGain();g.gain.value=vol;s.connect(g).connect(MASTER);s.start();return{s,g}}
const decks=[];function music(src,vol){const a=new Audio(src);a.loop=true;a.muted=MUTED;a.volume=vol;a.dataset.v=vol;a.play().catch(()=>{});decks.push(a);return a}
function musicVol(k){for(const a of decks)a.volume=clamp(+a.dataset.v*k,0,1)}
// La Diva's anthem: one long take, looped; her top notes (read from the recording) are the only moments she'll take a puff
const ARIA={len:29.6,tops:[[1.70,2.20],[6.20,7.00],[11.95,12.95],[18.15,18.95],[20.95,21.95],[24.20,25.20]],breaths:[[5.55,6.05],[17.55,18.05],[23.55,24.05]],src:null,g:null,t0:0};
function ariaStart(){if(!AC||!BUF.aria||ARIA.src)return;const s=AC.createBufferSource();s.buffer=BUF.aria;s.loop=true;s.loopEnd=ARIA.len;const g=AC.createGain();g.gain.value=.4;s.connect(g).connect(MASTER);s.start();ARIA.src=s;ARIA.g=g;ARIA.t0=AC.currentTime}
function ariaStop(cut){if(!ARIA.src)return;const g=ARIA.g,s=ARIA.src;g.gain.setTargetAtTime(0,AC.currentTime,cut?.02:.3);s.stop(AC.currentTime+(cut?.2:1.5));ARIA.src=null;ARIA.g=null}
function ariaTime(){return AC&&ARIA.src?(AC.currentTime-ARIA.t0)%ARIA.len:(performance.now()/1000)%ARIA.len}
function divaPhase(){const a=ariaTime();let ph=0;for(const[s,e]of ARIA.tops){if(a>=s&&a<e)ph=2;else if(a>=s-1.1&&a<s&&!ph)ph=1}
  if(!ph)for(const[s,e]of ARIA.breaths)if(a>=s&&a<e)ph=3;return ph}

/* ---------------- captions + speech bubbles ---------------- */
let capT=0;function say(who,text,vo){const c=$('cap');c.innerHTML=(who?`<b>${who}</b>`:'')+text;c.classList.add('on');
  let dur=Math.max(2.6,text.length*.055);if(vo){const p=play(vo,1);if(p)dur=Math.max(dur,p.s.buffer.duration+.4)}capT=dur}
const bubs=[];function bub(o,text,dur=2.2){for(let i=bubs.length-1;i>=0;i--)if(bubs[i].o===o)bubs.splice(i,1);bubs.push({o,text,t:0,dur,rot:rand(-2.5,2.5)})}

/* ---------------- world layout (strip coordinates) ---------------- */
const Y0=785,Y1=968;
const depth=y=>(y-Y0)/(Y1-Y0),scaleAt=y=>lerp(.74,1,clamp(depth(y),0,1));
let WW=8804;
const SHOP={x:660,y:908,door:440,dy:886,zone:1080};
const DIVA_X=8216,DIVA_Y=846;
// solid set pieces [x0,x1,y0,y1] in feet coordinates: fences and ponds wall off the back of the path, flower beds and the
// front bench sit in the walkway, the gazebo and the shop are solid
const SOLID=[[300,1000,0,874],[1960,2170,0,830],[2201,3434,0,858],[3494,3954,862,915],[4221,4569,0,856],[4975,5575,0,836],[5575,6035,846,908],[6302,6640,0,852],[6936,7483,0,842],[7095,7400,852,896],[7960,8470,0,880],[8360,8490,900,935]];
function collide(o,r=26){for(const[x0,x1,y0,y1]of SOLID){if(o.x>x0-r&&o.x<x1+r&&o.y>y0-4&&o.y<y1+4){
  const pl=o.x-(x0-r),pr=(x1+r)-o.x,pu=y0>Y0-50?o.y-(y0-4):1e9,pd=(y1+4)-o.y,m=Math.min(pl,pr,pu,pd);
  if(m===pl)o.x=x0-r;else if(m===pr)o.x=x1+r;else if(m===pu)o.y=y0-4;else o.y=y1+4}}}

/* ---------------- entities ---------------- */
const P={x:1200,y:920,face:1,walk:0,stun:0,vx:0};
const SEATS=[[3560,800],[3700,800],[4630,799],[4730,799],[5660,806],[5790,806],[7720,852]];
const grans=SEATS.map(([x,y],i)=>({id:i,x,y,hx:x,hy:y,stand:i===6,state:'frozen',t:rand(0,1),face:i%2?-1:1,cool:0,lag:0,startle:0,walk:0}));
const conga=[];const trail=[];
const pigeons=[];for(const cx of[2350,4200,6250])for(let i=0;i<5;i++)pigeons.push({x:cx+rand(-110,110),y:rand(905,955),face:Math.random()<.5?1:-1,state:'peck',t:rand(0,2),vy:0,vx:0,alt:0});
const puffs=[];
const DIVA={state:'sing',t:0,phase:0,wins:0,scold:0};
const SAL={f:0,t:0};
const TUBA={x:7250,y:874,state:'sit',t:0,cool:0,walk:0,face:1,startle:0,lag:0,helper:true,blastT:0};
const DOG={x:6150,y:930,state:'idle',t:0,face:-1,calm:false,gone:false,cool:0};
const SPRINK=[[6720,905,0],[5300,935,2.1],[4120,935,1.1],[2620,935,3.0]].map(([x,y,o])=>({x,y,o,on:false,f:0,warn:false}));
const KID={active:false,x:0,y:0,dir:1,t:0,next:9,hit:new Set()};
let sprinklersOn=false,delivered=0,bonus=0,mode='card',time=0,camX=0,deliverBusy=false;
const lung={on:false,v:0,target:null,snd:null};

/* ---------------- input ---------------- */
const K={};addEventListener('keydown',e=>{K[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(mode==='cine'&&(e.code==='Escape'||e.code==='Enter'))cine.skip()});
addEventListener('keyup',e=>{K[e.code]=false});
let stick={x:0,y:0},puffHeld=false,mouseHeld=false;
cv.addEventListener('mousedown',()=>mouseHeld=true);addEventListener('mouseup',()=>mouseHeld=false);
{const st=$('stick'),kn=st.querySelector('i');let id=null,cx=0,cy=0;
  st.addEventListener('pointerdown',e=>{id=e.pointerId;const r=st.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;st.setPointerCapture(id);mv(e)});
  const mv=e=>{if(e.pointerId!==id)return;let dx=(e.clientX-cx)/50,dy=(e.clientY-cy)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}stick={x:dx,y:dy};kn.style.transform=`translate(${dx*38}px,${dy*38}px)`};
  st.addEventListener('pointermove',mv);const up=e=>{if(e.pointerId!==id)return;id=null;stick={x:0,y:0};kn.style.transform=''};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  const pb=$('puffbtn');pb.addEventListener('pointerdown',e=>{puffHeld=true;pb.setPointerCapture(e.pointerId)});pb.addEventListener('pointerup',()=>puffHeld=false);pb.addEventListener('pointercancel',()=>puffHeld=false)}
const holding=()=>!!(K.Space||K.KeyJ||mouseHeld||puffHeld);

/* ---------------- targets ---------------- */
function reachOf(x,y,r,dzMax=80){const dx=(x-P.x)*P.face,dz=Math.abs(y-P.y);if(dx<-40||dx>r||dz>dzMax)return 1e9;return Math.abs(dx)+dz*1.5}
function nearestTarget(){let best=null,bd=1e9;const c=(d,t)=>{if(d<bd){bd=d;best=t}};
  if(DIVA.state!=='won')c(reachOf(DIVA_X,P.y,380),{kind:'diva'});
  for(const g of grans)if((g.state==='frozen'||g.state==='waiting')&&g.cool<=0)c(reachOf(g.x,g.y,230,g.y<815?150:80),{kind:'gran',g}); // grandmas on a bench can be reached across the flower beds
  if(TUBA.state==='sit'||TUBA.state==='stand')c(reachOf(TUBA.x,TUBA.y,230,110),{kind:'tuba'});
  if(!DOG.calm&&!DOG.gone)c(reachOf(DOG.x,DOG.y,200),{kind:'dog'});
  return best}
function addPuff(x,y,s,vx=0,vy=-30){puffs.push({x,y,s,life:0,max:rand(1.1,1.7),vx:vx+rand(-12,12),vy:vy+rand(-10,6),k:(Math.random()*4)|0,rot:rand(-.3,.3)})}

/* ---------------- puffing ---------------- */
const GREEN0=.56,GREEN1=.8,FILL=1/1.45;
const HOOKED=['Ooh! Is that mango?','Lead on, dear!',"Don't tell my son.",'Like the old days!','Mmm, cloudy.'];
function release(){const t=lung.target,v=lung.v;lung.on=false;lung.v=0;$('lung').classList.remove('on');
  if(lung.snd){try{lung.snd.g.gain.setTargetAtTime(0,AC.currentTime,.03);lung.snd.s.stop(AC.currentTime+.2)}catch(e){}lung.snd=null}
  if(!t)return;const good=v>=GREEN0&&v<=GREEN1,over=v>GREEN1;
  const hx=P.x+P.face*120,hy=P.y-scaleAt(P.y)*270;
  if(t.kind==='diva'){
    if(good&&DIVA.phase===2){DIVA.wins++;play('perfect_sting',.7);play('exhale_1',.8);for(let i=0;i<4;i++)addPuff(DIVA_X-20,DIVA_Y-210,.8,rand(-40,10),-20);
      if(DIVA.wins<3)bub(DIVA,DIVA.wins===1?'Ooh!':'Mmm… mango?');
      else{DIVA.state='won';DIVA.t=0;ariaStop(true);musicVol(1);say('LA DIVA','Bravissima! BRAVISSIMA! Darling… does it come in MANGO?','diva_won');
        for(const g of grans){g.state='waiting';g.t=rand(0,.8)}setGoal('HOOK 5 GRANDMAS','then walk them home, nice and slow');
        setTimeout(()=>{if(mode!=='play')return;sprinklersOn=true;say('SAL',"Kid! The Mayor's turned the park sprinklers on! Don't let 'em soak my grandmas!")},5200)}
    }else{play(over?'cough_1':'fail_sting',.6);if(DIVA.scold<=0){say('LA DIVA','Ah-ah-ah, darling. Not yet. Wait for the top of the phrase!','diva_again');DIVA.scold=6}else bub(DIVA,'Ah-ah-ah!')}
    return}
  if(t.kind==='tuba'){if(good){TUBA.state='blast';TUBA.t=0;play('tuba',.8);bub(TUBA,'That is going IN the solo.',2.6);for(let i=0;i<5;i++)addPuff(TUBA.x+40,TUBA.y-230,1.3,rand(20,90),-40)}
    else{play('mmph_1',.6);bub(TUBA,'Zzz… hm?')}return}
  if(t.kind==='dog'){if(good){DOG.calm=true;DOG.state='calm';play('exhale_2',.6);addPuff(DOG.x,DOG.y-120,.6);bub(DOG,'*happy huff*')}else{play('bark_1',.7);DOG.state='bark';DOG.t=0}return}
  const g=t.g;
  if(g.state==='frozen'){play('mmph_1',.6);g.startle=.6;bub(g,pick(["Shh! She's singing!",'Not during the anthem!','Shh!']));return}
  if(good){g.state='puffing';g.t=0;play('exhale_2',.7);addPuff(g.x+g.face*30,g.y-scaleAt(g.y)*240,1.1,g.face*20,-25)}
  else if(over){play('cough_2',.7);g.cool=1.6;g.startle=.8;addPuff(hx,hy,.8,P.face*60,-10);bub(g,'Too much, dear!')}
  else{play('mmph_1',.5);addPuff(hx,hy,.5,P.face*40,-10);bub(g,'Is that it?')}}

function setGoal(a,b){$('goal').innerHTML=`${a}<small>${b}</small>`}
// a dropped follower stops where she is and sulks for a moment; a fresh puff brings her back
const DROPS=[];function dropFromLine(g,line,snd='grandma_1'){const i=conga.indexOf(g);if(i<0)return;DROPS.push(Math.round(time*10)/10+' '+(g.helper?'tuba':'gran'+g.id)+' '+line+' @'+Math.round(g.x));conga.splice(i,1);g.state=g.helper?'stand':'waiting';g.cool=1.4;g.walk=0;g.lag=0;g.wet=0;play(snd,.6);bub(g,line,2.2);updCount()}

/* ---------------- update ---------------- */
function update(dt){time+=dt;
  // ---- player
  let ix=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0)+stick.x,iy=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0)+stick.y;
  ix=clamp(ix,-1,1);iy=clamp(iy,-1,1);
  const hold=holding()&&mode==='play';P.stun=Math.max(0,P.stun-dt);
  const run=!!(K.ShiftLeft||K.ShiftRight)||Math.hypot(stick.x,stick.y)>.95;let sp=hold||P.stun>0||mode!=='play'?0:run?500:300;
  if(SPRINK.some(s=>inSpray(s,P.x,P.y)))sp*=.55; // wading through the spray
  P.x=clamp(P.x+ix*sp*dt,180,WW-260);P.y=clamp(P.y+iy*sp*.42*dt,Y0,Y1);
  if(P.vx){P.x=clamp(P.x+P.vx*dt,180,WW-260);P.vx*=Math.exp(-dt*6);if(Math.abs(P.vx)<5)P.vx=0}
  collide(P,30);
  if(Math.abs(ix)>.1&&sp>0)P.face=ix>0?1:-1;
  const moving=(Math.abs(ix)+Math.abs(iy))>.1&&sp>0;P.walk=moving?P.walk+dt:0;
  const last=trail[trail.length-1];if(!last||Math.hypot(P.x-last.x,(P.y-last.y)*1.6)>8){trail.push({x:P.x,y:P.y});if(trail.length>900)trail.shift()}
  // ---- puffing
  if(mode==='play'){
    if(hold&&!lung.on){lung.target=nearestTarget();lung.on=true;lung.v=0;$('lung').classList.add('on');lung.snd=play('inhale_1',.6)}
    if(lung.on&&hold){lung.v=Math.min(1.08,lung.v+dt*FILL);if(lung.v>=1.08)release()}
    if(lung.on&&!hold)release();
    $('lung').querySelector('i').style.width=(Math.min(1,lung.v)*100)+'%'}
  // ---- La Diva follows her recording: hand to chest before a top note, fan up on it, a breath in the gaps
  DIVA.t+=dt;DIVA.scold=Math.max(0,DIVA.scold-dt);
  if(DIVA.state==='sing'){DIVA.phase=divaPhase();
    if(ARIA.g){const near=1-clamp(Math.abs(P.x-DIVA_X)/4200,0,1);ARIA.g.gain.value=lerp(.1,.95,near);musicVol(lerp(1,.25,near))}}
  // ---- grandmas + tuba
  for(const g of grans){g.t+=dt;g.cool=Math.max(0,g.cool-dt);g.startle=Math.max(0,g.startle-dt);
    if(g.state==='puffing'&&g.t>.7){g.state='hooked';g.t=0;play('grandma_1',.5);bub(g,pick(HOOKED))}
    else if(g.state==='hooked'&&g.t>.9){g.state='conga';g.lag=0;conga.push(g);play('pickup',.5);updCount()}
    else if(g.state==='lost'&&walkTo(g,g.hx,g.hy,120,dt))g.state='waiting'}
  TUBA.t+=dt;TUBA.cool=Math.max(0,TUBA.cool-dt);TUBA.startle=Math.max(0,TUBA.startle-dt);
  if(TUBA.state==='blast'&&TUBA.t>1.4){TUBA.state='conga';TUBA.lag=0;conga.push(TUBA);updCount()}
  
  // ---- conga: each follower walks to the trail point behind the one in front, at grandma pace
  {let need=0;
    for(let i=0;i<conga.length;i++){const g=conga[i];need+=i===0?130:100;
      let acc=0,j=trail.length-1,tp=trail[j];while(j>0&&acc<need){const a=trail[j],b=trail[j-1];acc+=Math.hypot(a.x-b.x,a.y-b.y);j--;tp=trail[j]}
      const dx=tp.x-g.x,dy=tp.y-g.y,d=Math.hypot(dx,dy),spd=g.startle>0?0:d>200?360:290; // a startled grandma stops, then hurries to catch up
      if(d>4){const st=Math.min(d,spd*dt);g.x+=dx/d*st;g.y+=dy/d*st;g.face=dx>.5?1:dx<-.5?-1:g.face;g.walk+=dt}else g.walk=0;
      g.lag=d>300&&g.startle<=0?g.lag+dt:Math.max(0,g.lag-dt*2)}
    for(let i=conga.length-1;i>=0;i--){const g=conga[i];if(g.lag>1.8){dropFromLine(g,g.helper?'Wait for the band!':'Oof, my hip. Slow down, dear!');break}}}
  // ---- delivery at Cloud Kingz: they peel off the line one at a time
  if(P.x<SHOP.zone&&conga.length&&!deliverBusy){deliverBusy=true;const g=conga.shift();g.state='home';g.t=0;updCount()}
  for(const g of [...grans,TUBA])if(g.state==='home'&&!g.inside&&walkTo(g,SHOP.door,SHOP.dy,230,dt)){g.inside=true;deliverBusy=false;SAL.t=0;SAL.f=2;
    if(g.helper){bonus++;play('sal_alr_2',1);bub(SAL,'A TUBA GUY?! Alright!',2.4)}else{delivered++;play(delivered===1?'sal_alr_1':'sal_n'+Math.min(5,delivered),1)}
    updCount();if(delivered>=5)win()}
  // ---- the Mayor's sprinklers (on after La Diva falls): wobble and tick, then sweep left, up, right; a soaked grandma goes home
  for(const s of SPRINK){const c=sprinklersOn?((time+s.o)%8):-1;const was=s.on;s.on=c>=3.0&&c<5.4;s.warn=c>=2.3&&c<3.0; // ~5 s dry gap: room for a whole line to cross
    s.f=s.on?1+Math.floor((c-3.0)/.42)%3:0;if(s.on&&!was&&Math.abs(s.x-P.x)<1500)play('sprinkler',.5);
    if(s.on)for(const g of[...conga]){if(inSpray(s,g.x,g.y)){g.wet=(g.wet||0)+dt;if(g.wet>.7)dropFromLine(g,g.helper?'My valves!':pick(['My SET!','Oh! My perm!','Soaked to the girdle!']),'yelp_f_1')}else g.wet=0}}
  // ---- the scooter kid: a bell, then he comes straight down your lane
  if(sprinklersOn&&mode==='play'){KID.next-=dt;if(!KID.active&&KID.next<=0&&conga.length){KID.active=true;KID.dir=P.face>0?-1:1;KID.y=clamp(P.y+rand(-30,30),Y0+10,Y1-6);
      KID.x=camX+(KID.dir>0?-260:VW+260);KID.t=0;KID.took=false;KID.turned=false;KID.hit.clear();play('bell',.8);KID.next=rand(16,24)}
    if(KID.active){KID.t+=dt;if(KID.t>1.0){KID.x+=KID.dir*680*dt;
        if(TUBA.state==='conga'&&!KID.turned&&Math.abs(KID.x-TUBA.x)<620){KID.turned=true;KID.dir*=-1;TUBA.cool=4;TUBA.blastT=.8;play('tuba',.7);bub(TUBA,'HONK!',1.1);bub(KID,'AAH!',1.1)} // the tuba in your line honks him away
        for(const g of[...conga])if(!KID.hit.has(g)&&Math.abs(g.x-KID.x)<55&&Math.abs(g.y-KID.y)<40){KID.hit.add(g);g.startle=1.2;g.y=clamp(g.y+(g.y<KID.y?-26:26),Y0,Y1);
          if(!KID.took&&!g.helper){KID.took=true;dropFromLine(g,'Watch it, young man!','yelp_f_2')}else{play('mmph_1',.5);bub(g,g.helper?'Hey!':'Oh!',1.2)}} // one knocked out per pass; the rest spin and catch up
        if(!KID.hit.has(P)&&Math.abs(P.x-KID.x)<60&&Math.abs(P.y-KID.y)<40){KID.hit.add(P);P.stun=.5;P.vx=KID.dir*420;play('yelp_f_1',.4);bub(KID,'Sorry!!')}}
      if((KID.dir>0&&KID.x>camX+VW+300)||(KID.dir<0&&KID.x<camX-300))KID.active=false}}
  // ---- the loose terrier: charges the back of the line and barks; a good puff calms him for good
  DOG.t+=dt;DOG.cool=Math.max(0,DOG.cool-dt);
  if(!DOG.gone&&!DOG.calm&&DOG.state!=='flee'){const tgt=conga.length?conga[conga.length-1]:null;
    if(DOG.state==='bark'){if(DOG.t>.9)DOG.state='idle'}
    else if(tgt&&Math.abs(tgt.x-DOG.x)<700){DOG.state='run';walkTo(DOG,tgt.x+(DOG.x<tgt.x?-90:90),tgt.y,380,dt);
      if(Math.abs(tgt.x-DOG.x)<150&&DOG.cool<=0){DOG.state='bark';DOG.t=0;DOG.cool=3;play(Math.random()<.5?'bark_1':'bark_2',.8);
        for(const g of conga)if(Math.abs(g.x-DOG.x)<260)g.startle=Math.max(g.startle,1.3);bub(tgt,'Shoo! SHOO!',1.6)}}
    else DOG.state='idle'}
  if(DOG.state==='flee'){DOG.x+=520*dt;DOG.face=1;if(DOG.x>WW+200)DOG.gone=true}
  // ---- the tuba (in the line) blasts away whatever comes for it
  if(TUBA.state==='conga'&&TUBA.cool<=0){const dogNear=!DOG.gone&&!DOG.calm&&DOG.state!=='flee'&&Math.abs(DOG.x-TUBA.x)<420;
    const pigs=pigeons.filter(b=>b.state==='peck'&&!b.gone&&Math.abs(b.x-TUBA.x)<480);
    if(dogNear||pigs.length){TUBA.cool=4;TUBA.blastT=.8;play('tuba',.7);for(let i=0;i<3;i++)addPuff(TUBA.x+TUBA.face*50,TUBA.y-220,1,TUBA.face*80,-30);
      for(const b of pigs)scare(b,TUBA.x);if(dogNear){DOG.state='flee';bub(DOG,'Yip!',1.2)}}}
  if(TUBA.blastT)TUBA.blastT=Math.max(0,TUBA.blastT-dt);
  // ---- pigeons: peck until something comes close, then burst up and startle the grandmas near them
  for(const b of pigeons){if(b.gone)continue;b.t+=dt;if(b.state==='peck'){const near=[P,...conga].some(o=>Math.abs(o.x-b.x)<130&&Math.abs(o.y-b.y)<60);
      if(near){scare(b,P.x);for(const g of conga)if(Math.abs(g.x-b.x)<220)g.startle=Math.max(g.startle,.9)}
      else if(b.t>rand(1.2,2.6)){b.t=0;b.x+=rand(-24,24);b.face=Math.random()<.5?1:-1}}
    else{b.alt+=-b.vy*dt;b.x+=b.vx*dt;b.vy+=60*dt;if(b.alt>900)b.gone=true}}
  // ---- puffs, bubbles, camera, captions
  for(const p of puffs){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy-=6*dt}for(let i=puffs.length-1;i>=0;i--)if(puffs[i].life>puffs[i].max)puffs.splice(i,1);
  for(let i=bubs.length-1;i>=0;i--){bubs[i].t+=dt;if(bubs[i].t>bubs[i].dur)bubs.splice(i,1)}
  const want=clamp(P.x-VW*.42+P.face*120,0,WW-VW);camX=lerp(camX,want,1-Math.exp(-dt*4));
  if(capT>0){capT-=dt;if(capT<=0)$('cap').classList.remove('on')}
  SAL.t+=dt;if(SAL.t>1.6)SAL.f=conga.length&&P.x<2600?1:0}
function walkTo(o,x,y,spd,dt){const dx=x-o.x,dy=y-o.y,d=Math.hypot(dx,dy);if(d<8){o.walk=0;return true}o.x+=dx/d*Math.min(d,spd*dt);o.y+=dy/d*Math.min(d,spd*dt);o.face=dx>0?1:-1;o.walk=(o.walk||0)+dt;return false}
function scare(b,fromX){if(b.state!=='peck')return;b.state='fly';b.vy=-rand(260,360);b.vx=(b.x>fromX?1:-1)*rand(80,200);b.face=b.vx>0?1:-1;play(Math.random()<.5?'pigeon_1':'pigeon_2',.5)}
function inSpray(s,x,y){if(!s.on||Math.abs(y-s.y)>120)return false;const dx=x-s.x;return s.f===1?dx>-300&&dx<20:s.f===3?dx<300&&dx>-20:Math.abs(dx)<170}
function updCount(){$('cn').textContent=delivered+(conga.some(g=>!g.helper)?` +${conga.filter(g=>!g.helper).length}`:'')}
function win(){mode='won';play('fanfare',.7);setTimeout(()=>say('SAL',"That's the district, kid! Look at 'em all! LOOK at 'em!",'sal_clear'),900);
  setTimeout(()=>cine.play(EVENING,()=>{const c=$('card');c.querySelector('h1').textContent='TUESDAY · CLEAR';c.querySelectorAll('p')[0].textContent=`Five grandmas in the door${bonus?' (and the tuba guy)':''}. Word of mouth is about to do the rest.`;c.querySelectorAll('p')[1].hidden=true;$('go').textContent='PLAY AGAIN';c.hidden=false}),4600)}

/* ---------------- cutscenes: the reshoot's Tuesday clips ---------------- */
const MORNING=[{vid:'be_t1',who:'MAYOR',cap:'Good morning, Coral Vista. Today, for your health, our town soprano will sing the anthem in the park. All day. Walking out would be… rude. Breathe easy.'},{vid:'be_t2'}];
const EVENING=[{vid:'be_t3'},{vid:'be_t4'},{vid:'be_t5',who:'SAL',cap:"Kid! I sold out of mango! I've never sold out of ANYTHING!"}];
const cine=(()=>{const box=$('cine'),v=$('cinev');let list=[],i=0,done=null,prev='play';
  function show(){const s=list[i];if(!s)return end();v.muted=MUTED;v.src=`../assets/story/clay/${s.vid}.mp4`;v.volume=s.who?1:.55;v.play().catch(()=>{});
    if(s.cap){$('cap').innerHTML=`<b>${s.who}</b>${s.cap}`;$('cap').classList.add('on');capT=0}else $('cap').classList.remove('on')}
  function end(){if(mode!=='cine')return;v.pause();v.removeAttribute('src');try{v.load()}catch(e){}box.hidden=true;$('cap').classList.remove('on');musicVol(1);mode=prev;const d=done;done=null;if(d)d()}
  v.addEventListener('ended',()=>{i++;show()});v.addEventListener('error',()=>{i++;show()});
  $('cineskip').addEventListener('click',e=>{e.stopPropagation();end()});box.addEventListener('click',()=>{i++;show()});
  return{play(l,cb){list=l;i=0;done=cb;prev=mode==='won'?'won':'play';mode='cine';box.hidden=false;musicVol(.12);show()},skip:end}})();

/* ---------------- drawing ---------------- */
const STEP=1/12;let stepT=0,tick=0;const POSE=new Map();
function posed(o,x,y){let p=POSE.get(o);if(!p||p.tick!==tick){p={x,y,b:1+rand(-.012,.012),r:rand(-.006,.006),tick};POSE.set(o,p)}return p}
function frame(name,i,x,y,h,flip,alpha=1,b=1,r=0){const im=IMG[name],m=META[name];if(!im||!m)return;i=((i%m.n)+m.n)%m.n;
  const w=m.w*h/m.h*b,hh=h*b;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(r)ctx.rotate(r);if(flip)ctx.scale(-1,1);
  ctx.drawImage(im,i*m.w,0,m.w,m.h,-w/2,-hh,w,hh);ctx.restore()}
function shadow(x,y,w){ctx.save();ctx.fillStyle='rgba(28,18,8,.30)';ctx.filter='blur(6px)';ctx.beginPath();ctx.ellipse(x,y-2,w,w*.22,0,0,PI*2);ctx.fill();ctx.restore()}
const GRAIN=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const k=c.getContext('2d'),d=k.createImageData(256,256);
  for(let i=0;i<d.data.length;i+=4){const v=128+(Math.random()-.5)*90;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}k.putImageData(d,0,0);return c})();
let grainPat=null;
function felts(){ctx.save();ctx.filter='blur(10px)';for(const jx of (STRIP.joins||[])){for(const [ox,w,h,c] of [[-60,260,95,'#1f4f26'],[90,190,70,'#2a6430']]){
    const x=camX+(jx+ox-camX)*1.18;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,H+10,w,h,0,PI,0);ctx.fill()}}ctx.restore()}
function drawBubble(b){const o=b.o;let x=o.x,y;const s=scaleAt(o.y||Y1);
  if(o===DIVA){x=DIVA_X;y=DIVA_Y-300}else if(o===SAL){x=SHOP.x;y=SHOP.y-275*s}else if(o===KID){y=KID.y-310*s}else if(o===DOG){y=DOG.y-170*s}else if(o===TUBA){y=TUBA.y-(TUBA.state==='sit'?280:330)*s}else y=o.y-(o.state==='frozen'?275:315)*s;
  const a=Math.min(1,b.t*8)*Math.min(1,(b.dur-b.t)*4);ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(b.rot*PI/180);
  ctx.font='800 26px Nunito, system-ui, sans-serif';const w=ctx.measureText(b.text).width+30,hh=44;
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(-w/2+4,-hh+4,w,hh);ctx.fillStyle='#f6eedc';ctx.fillRect(-w/2,-hh,w,hh);
  ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.lineTo(0,14);ctx.fill();ctx.fillStyle='#24180f';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.text,0,-hh/2+1);ctx.restore()}

function draw(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#120d09';ctx.fillRect(0,0,VW,H);
  ctx.translate(-Math.round(camX),0);
  const TW=STRIP.tile;for(let k=0;k<STRIP.n;k++){const x0=k*TW;if(x0>camX+VW||x0+TW<camX)continue;const im=TILES[k];if(im)ctx.drawImage(im,x0,0)}
  const L=[];
  L.push({y:SHOP.y,d(){const s=scaleAt(SHOP.y),p=posed(SAL,SHOP.x,SHOP.y);shadow(p.x,p.y,62*s);frame('sal',SAL.f,p.x,p.y,262*s,false,1,p.b,p.r)}});
  L.push({y:DIVA_Y,d(){const p=posed(DIVA,DIVA_X,DIVA_Y);const f=DIVA.state==='won'?(DIVA.t<2.2?4:5):[0,2,1,3][DIVA.phase];frame('diva',f,p.x,p.y,282,false,1,p.b,p.r)}});
  for(const g of grans){if(g.inside)continue;L.push({y:g.y,d(){const s=scaleAt(g.y),p=posed(g,g.x,g.y);let name='gran_pose',f=2,h=292*s;
      if(g.state==='frozen'){if(!g.stand){f=(Math.floor(g.t*1.4)%2);h=252*s}}
      else if(g.state==='waiting')f=g.cool>0||g.startle>0?2:4;
      else if(g.state==='puffing')f=3;else if(g.state==='hooked')f=g.t<.45?4:5;
      else if(g.walk>0){name='gran_walk';f=Math.floor(g.walk*10)}else f=g.startle>0?2:4;
      const shake=g.startle>0?Math.sin(time*40)*4:0;shadow(p.x,p.y,52*s);frame(name,f,p.x+shake,p.y,h,g.face<0,1,p.b,p.r)}})}
  if(!TUBA.inside)L.push({y:TUBA.y,d(){const s=scaleAt(TUBA.y),p=posed(TUBA,TUBA.x,TUBA.y);let f=2,h=300*s;
    if(TUBA.state==='sit'){f=0;h=262*s}else if(TUBA.state==='stand')f=2;else if(TUBA.state==='blast'){if(TUBA.t<.8){f=1;h=262*s}}else if(TUBA.blastT>0)f=2;else if(TUBA.walk>0)f=3+(Math.floor(TUBA.walk*8)%2);
    shadow(p.x,p.y,56*s);frame('tuba',f,p.x,p.y,h,TUBA.face<0,1,p.b,p.r)}});
  if(!DOG.gone)L.push({y:DOG.y,d(){const s=scaleAt(DOG.y),p=posed(DOG,DOG.x,DOG.y);const f=DOG.state==='bark'?1:(DOG.state==='run'||DOG.state==='flee')?(tick%2?0:2):0;
    shadow(p.x,p.y,44*s);frame('dog',f,p.x,p.y,(DOG.state==='calm'?110:128)*s,DOG.face<0,1,p.b,p.r)}});
  for(const sp of SPRINK)L.push({y:sp.y,d(){const s=scaleAt(sp.y),p=posed(sp,sp.x,sp.y);const wob=sp.warn?Math.sin(time*50)*3:0;frame('sprinkler',sp.on?sp.f:0,p.x+wob,p.y,(sp.on?260:95)*s,false,1,p.b,0)}});
  if(KID.active&&KID.t>1.0)L.push({y:KID.y,d(){const s=scaleAt(KID.y),p=posed(KID,KID.x,KID.y);shadow(p.x,p.y,60*s);frame('scooter',tick%3,p.x,p.y,280*s,KID.dir<0,1,p.b,0)}});
  for(const b of pigeons){if(b.gone)continue;L.push({y:b.y,d(){const s=scaleAt(b.y),p=posed(b,b.x,b.y-b.alt);const f=b.state==='fly'?2+(tick%2):(b.t%1.2<.5?0:1);
    if(b.alt<20)shadow(b.x,b.y,24*s);frame('pigeon',f,p.x,p.y,78*s,b.face>0,1,p.b,0)}})}
  L.push({y:P.y,d(){const s=scaleAt(P.y),p=posed(P,P.x,P.y);let name='bro_walk',f=0,h=372*s;
    if(lung.on){name='bro_side';f=lung.v>.5?2:1;h=380*s}else if(mode==='won'){name='bro_side';f=4;h=380*s}else if(P.walk>0)f=Math.floor(P.walk*11);else{name='bro_side';f=0;h=380*s}
    shadow(p.x,p.y,60*s);frame(name,f,p.x,p.y,h,P.face<0,1,p.b,p.r)}});
  L.sort((a,b)=>a.y-b.y);for(const o of L)o.d();
  for(const p of puffs){const k=p.life/p.max,a=Math.min(1,k*8)*(1-k*k);const pp=posed(p,p.x,p.y);frame('puff',p.k,pp.x,pp.y+60*p.s,(90+130*k)*p.s,false,a*.95,pp.b,p.rot)}
  for(const b of bubs)drawBubble(b);
  felts();
  ctx.setTransform(1,0,0,1,0,0);
  const vg=ctx.createRadialGradient(VW/2,H*.48,H*.35,VW/2,H*.5,H*1.05);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,6,2,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,VW,H);
  if(!grainPat)grainPat=ctx.createPattern(GRAIN,'repeat');ctx.save();ctx.globalAlpha=.07;ctx.globalCompositeOperation='overlay';ctx.translate((tick*37)%256,(tick*91)%256);ctx.fillStyle=grainPat;ctx.fillRect(-256,-256,VW+512,H+512);ctx.restore()}

/* ---------------- loop ---------------- */
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;stepT+=dt;if(stepT>=STEP){stepT%=STEP;tick++}
  if(mode==='play'||mode==='won')update(dt);
  else{DIVA.t+=dt;if(DIVA.state==='sing')DIVA.phase=divaPhase();for(const g of grans)g.t+=dt}
  draw();requestAnimationFrame(loop)}

function reset(){delivered=0;bonus=0;conga.length=0;trail.length=0;deliverBusy=false;sprinklersOn=false;Object.assign(P,{x:1200,y:920,face:1,walk:0,stun:0,vx:0});
  grans.forEach(g=>Object.assign(g,{x:g.hx,y:g.hy,state:'frozen',inside:false,lag:0,walk:0,startle:0,cool:0,wet:0}));
  Object.assign(TUBA,{x:7250,y:874,state:'sit',inside:false,lag:0,walk:0,cool:0,blastT:0});Object.assign(DOG,{x:6150,y:930,state:'idle',calm:false,gone:false,cool:0});
  for(const b of pigeons){b.state='peck';b.alt=0;b.gone=false}Object.assign(DIVA,{state:'sing',t:0,wins:0,scold:0});Object.assign(KID,{active:false,next:9});
  bubs.length=0;setGoal('WIN OVER LA DIVA','then walk 5 grandmas to Cloud Kingz');updCount()}

async function start(){$('card').hidden=true;if(mode==='won'||delivered)reset();await audioInit();
  if(!decks.length){music('../audio/score/05_word_of_mouth.mp3',.26);music('../audio/amb/park.mp3',.2)}
  mode='play';cine.play(MORNING,()=>{mode='play';ariaStart();setTimeout(()=>say('SAL','Nobody walks out on the opera lady mid-song. Win her over, and every grandma in that park is ours. Then walk me five!','be_sal_call_2'),500)})}
$('go').addEventListener('click',start);

window.__park={P,DROPS,trail,grans,conga,DIVA,TUBA,DOG,SPRINK,KID,pigeons,lung,get mode(){return mode},set mode(v){mode=v},get camX(){return camX},reset,cine,
  get sprinklersOn(){return sprinklersOn},set sprinklersOn(v){sprinklersOn=v},win:()=>{DIVA.state='won';ariaStop(true);for(const g of grans)g.state='waiting'},ariaTime,divaPhase};

load().then(()=>{WW=STRIP.w;camX=0;updCount();requestAnimationFrame(loop)});
})();
