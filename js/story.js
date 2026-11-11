/* story mod: the run is five chapters (see docs/story-bible.md, assets/story/script.json).
   Each chapter: "in" cutscene → chapter title card → gameplay goal in one district → "out" cutscene → next chapter.
   Ch1-4: hook N townsfolk inside that chapter's district (and beat its boss, if any). Ch5: empty the container.
   Cutscenes are full-screen stills (or short muted clips, shot.vid) with a 16mm film treatment, VO + subtitles.
   Missing art/VO is tolerated: soft placeholder backdrop, caption held ~3.5 s.
   Events for other mods: chapter(n, 'in'|'play'|'out'), cutscene(true|false).
   TMV.story = {chapter, phase, goal, progress, play(shots, done)}. #dbg: window.tmvs = {chapter(n), win(), skip()}. */
(()=>{const X=window.TMV;if(!X)return;const $=X.$,T=X.T,PI=Math.PI,clamp=X.clamp,rand=X.rand;
const RMq=matchMedia('(prefers-reduced-motion: reduce)');

/* ================= SCRIPT (fetched; inline copy if that fails) ================= */
const L=(img,who,vo,cap,hold)=>({img,who,vo,cap,hold});
let S={chapters:[
  {id:1,title:'The Typo',district:'downtown',in:[{img:'ch1_in_1',hold:3},L('ch1_in_2','SAL','sal_ch1_in_2','Fifty. I ordered FIFTY. Who orders five THOUSAND vapes?!'),L('ch1_in_3','BRO','bro_ch1_in_3',"Duuude. That's like… a lot of vapes."),L('ch1_in_4','SAL','sal_ch1_in_4','Invoice is due Friday, kid. Get this town hooked, or I lose the shop.')],
   out:[L('ch1_out_1','SAL','sal_ch1_out_1',"They're… coming back? They're coming BACK!")]},
  {id:2,title:'Word of Mouth',district:'park',in:[L('ch2_in_1','BRO','bro_ch2_in_1',"Park's full of grandmas, man. Grandmas love me.")],out:[L('ch2_out_1','SAL','sal_ch2_out_1',"Kid! I sold out of mango! I've never sold out of ANYTHING!")]},
  {id:3,title:'Home Turf',district:'beach',in:[L('ch3_in_1','BRO','bro_ch3_in_1','My beach, bro. Home turf.'),L('ch3_in_2','SAL','sal_ch3_in_2','Watch out for cops. And the big guy at the gym.')],out:[L('ch3_out_1','SAL','sal_ch3_out_1',"Two chains, kid. TWO. We're franchising.")]},
  {id:4,title:'Fresh Lungs',district:'farm',in:[L('ch4_in_1','SAL','sal_ch4_in_1',"We're out of people, kid. …What about the cows?"),L('ch4_in_2','BRO','bro_ch4_in_2','…The cows, dude?')],out:[L('ch4_out_1','BRO','bro_ch4_out_1',"Can't even see the waves anymore, man.")]},
  {id:5,title:'Zero',district:'square',in:[L('ch5_in_1','SAL','sal_ch5_in_1','Last stretch! EMPTY THE CONTAINER!')],out:[]}],
 end:[L('end_1','SAL','sal_end_1','Zero. You did it, kid… So, uh. I ordered fifty thousand.'),L('end_2','BRO','bro_end_2','…Bro.')],
 districts:{downtown:{x0:-62,x1:62,z0:-62,z1:62},park:{x0:-142,x1:-66,z0:-76,z1:76},beach:{x0:-150,x1:150,z0:-150,z1:-78},farm:{x0:70,x1:134,z0:-52,z1:52},square:{x0:-16,x1:16,z0:-16,z1:16}}};
const CH=n=>S.chapters.find(c=>c.id===n)||S.chapters[n-1]||{in:[],out:[]};
const DIST=k=>(S.districts&&S.districts[k])||{x0:-1e9,x1:1e9,z0:-1e9,z1:1e9};
const inD=(k,x,z)=>{const d=DIST(k);return x>=d.x0&&x<=d.x1&&z>=d.z0&&z<=d.z1};
fetch('assets/story/script.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.chapters)&&j.chapters.length>=5){S=j;preload()}}).catch(()=>{});

/* ================= TUNING =================
   goal: townsfolk to hook in the district. floor: the container can't drop below this during the chapter
   (so ch1-4 can't accidentally empty it). cap: on chapter clear the count drops to at most this
   ("they're coming back" - word of mouth sells the rest through the shop). Ch5 drains at mult× and
   everything nearby swarms you. Count path ≈ 5000 → 4400 → 3600 → 2800 → 2000 → 0. */
const PLAN={
 1:{goal:8, boss:null,     floor:3700,cap:4400,mood:'scared',col:0xff3fa4,at:[0,0],     extra:[]},
 2:{goal:10,boss:'diva',   floor:2900,cap:3600,mood:'happy', col:0xb6ff3c,at:[-104,4],  extra:[['grandma',6],['jogger',3],['dog',2]]},
 3:{goal:10,boss:'prime',  floor:2100,cap:2800,mood:'happy', col:0x5fd4ff,at:[0,-100],  extra:[['gym',3],['jogger',3],['cop',2],['dog',3]]},
 4:{goal:10,boss:null,     floor:1300,cap:2000,mood:'greedy',col:0xffb02e,at:[102,-6],  extra:[['cat',3],['dog',3],['chicken',2],['cow',1]]},
 5:{goal:0, boss:'detecto',floor:0,   cap:0,   mood:'greedy',col:0xff3fa4,at:[0,-6],    extra:[['worker',6],['grandma',3],['kid',3],['dog',2]]}};
const START=[5000,5000,4400,3600,2800,2000];   // count ceiling when a chapter is entered (debug jumps)
const DETECTO_FLOOR=250;                         // in ch5 the last 250 only go once Detecto is beaten (his defeat drains 700)

/* ================= CSS + DOM ================= */
const css=document.createElement('style');css.textContent=`
#st{position:absolute;inset:0;z-index:30;background:#120d0a;overflow:hidden;cursor:pointer;opacity:0;transition:opacity .35s}
#st.on{opacity:1}
#st .fr{position:absolute;inset:-6px;overflow:hidden;filter:sepia(.12) saturate(.9) contrast(.95) blur(.5px);will-change:transform}
#st.lite .fr{filter:sepia(.12) saturate(.9) contrast(.95)}
#st .ph{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#f3c9a8 0%,#c98a7a 38%,#5a3a4a 75%,#2a1a24 100%);animation:stph 12s ease-in-out infinite alternate}
@keyframes stph{from{transform:scale(1.04)}to{transform:scale(1.12) translate(1%,-1%)}}
#st img,#st video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 40%}
#st img.kb{animation:stkb 9s ease-out forwards}
#st img.soft{filter:blur(7px) brightness(.72) saturate(.8);transform:scale(1.08)}
@keyframes stkb{from{transform:scale(1.1) translate(1.5%,1%)}to{transform:scale(1) translate(0,0)}}
#st canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#st .gr{mix-blend-mode:overlay;opacity:.16}
#st .du{opacity:.7}
#st .vg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 52%,rgba(18,10,6,.38) 78%,rgba(10,6,4,.72) 100%)}
#st .cap{position:absolute;left:50%;bottom:calc(7vh + 18px);transform:translateX(-50%);width:min(900px,90vw);text-align:center;font:800 clamp(16px,2.6vw,26px)/1.25 system-ui,sans-serif;color:#fff;text-shadow:2px 2px 0 #000,-2px 2px 0 #000,2px -2px 0 #000,-2px -2px 0 #000,0 3px 8px rgba(0,0,0,.8);text-wrap:balance}
#st .cap b{color:var(--hot,#ff3fa4);margin-right:.4em}
#st .sk{position:absolute;right:16px;top:calc(7vh + 10px);font:700 16px system-ui,sans-serif;color:#fff;opacity:.45}
#st .bars:before,#st .bars:after{content:'';position:absolute;left:0;right:0;height:7vh;background:#000;z-index:2}
#st .bars:before{top:0}#st .bars:after{bottom:0}
#stt{position:absolute;inset:0;z-index:25;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;text-align:center;opacity:0}
#stt b{font-family:var(--display,Impact,sans-serif);font-weight:400;font-size:clamp(90px,24vw,230px);line-height:.85;color:var(--paper,#fff7ea);text-shadow:6px 6px 0 var(--hot,#ff3fa4),10px 10px 0 var(--ink,#140f1c)}
#stt i{font-style:normal;font-family:var(--display,Impact,sans-serif);font-size:clamp(26px,6vw,58px);color:var(--lime,#b6ff3c);text-shadow:3px 3px 0 var(--ink,#140f1c);margin-top:10px;rotate:-2deg}
#stt.go{animation:sttc 2.2s ease-out forwards;background:radial-gradient(ellipse at center,rgba(20,15,28,.55),rgba(20,15,28,0) 70%)}
#stt.go b{animation:stts 2.2s cubic-bezier(.2,.9,.3,1.15) forwards}
@keyframes sttc{0%{opacity:0}10%{opacity:1}82%{opacity:1}100%{opacity:0}}
@keyframes stts{0%{transform:scale(2.6) rotate(-8deg)}14%{transform:scale(.94) rotate(-3deg)}22%{transform:scale(1) rotate(-3deg)}100%{transform:scale(1.04) rotate(-3deg)}}
@media (prefers-reduced-motion:reduce){#stt.go b{animation:none}#st img.kb,#st .ph{animation:none}}
#stch{font-weight:800;font-size:9px;letter-spacing:.06em;padding:1px 4px;border:1.5px solid var(--lime,#b6ff3c);color:var(--lime,#b6ff3c);margin-right:2px}
#intro .loc{font:800 13px system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:var(--lime,#b6ff3c);opacity:.9}
#mPick,#mPickBg,#mInst,#mTip,#news,#hint,#right,#vape,#prompt,#toast,#bubs{display:none!important}
`;
document.head.appendChild(css);

const el=document.createElement('div');el.id='st';el.hidden=true;if(X.touch)el.classList.add('lite');
el.innerHTML='<div class="fr"><div class="ph"></div><img alt=""><video muted playsinline preload="auto" hidden></video></div><canvas class="gr"></canvas><canvas class="du"></canvas><div class="vg"></div><div class="bars"></div><div class="cap"></div><div class="sk">▸</div>';
X.game.appendChild(el);
const fr=el.querySelector('.fr'),im=el.querySelector('img'),vid=el.querySelector('video'),capEl=el.querySelector('.cap'),vg=el.querySelector('.vg');
vid.muted=true;vid.playsInline=true;vid.setAttribute('playsinline','');vid.setAttribute('webkit-playsinline','');
const card=document.createElement('div');card.id='stt';card.innerHTML='<b></b><i></i>';X.game.appendChild(card);
// tiny chapter tag beside the HOOKED bar
const chEl=document.createElement('span');chEl.id='stch';{const p=$('panic');if(p)p.insertBefore(chEl,p.firstChild)}

/* ================= 16mm FILM TREATMENT (grain, dust, hair, gate weave, flicker) ================= */
const gr=el.querySelector('.gr'),du=el.querySelector('.du'),GW=X.touch?320:480,GH=Math.round(GW*9/16);
gr.width=du.width=GW;gr.height=du.height=GH;const gx=gr.getContext('2d'),dx=du.getContext('2d');
const TILES=[...Array(4)].map(()=>{const c=document.createElement('canvas');c.width=c.height=128;const k=c.getContext('2d'),d=k.createImageData(128,128),a=d.data;
  for(let i=0;i<a.length;i+=4){const v=128+((Math.random()+Math.random()-1)*110)|0;a[i]=a[i+1]=a[i+2]=v;a[i+3]=255}k.putImageData(d,0,0);return gx.createPattern(c,'repeat')});
let filmT=0,filmRaf=0,filmLast=0;
function filmTick(now){filmRaf=el.hidden?0:requestAnimationFrame(filmTick);if(now-filmLast<83)return;filmLast=now;// ~12 fps
  gx.save();gx.translate(-rand(0,128),-rand(0,128));gx.fillStyle=X.pick(TILES);gx.fillRect(0,0,GW+128,GH+128);gx.restore();
  dx.clearRect(0,0,GW,GH);
  if(Math.random()<.4){const n=1+(Math.random()*3|0);for(let i=0;i<n;i++){const lt=Math.random()<.3;dx.fillStyle=lt?'rgba(255,248,230,.55)':'rgba(24,16,10,.7)';dx.beginPath();dx.ellipse(rand(0,GW),rand(0,GH),rand(.4,1.8),rand(.4,1.4),rand(0,3),0,7);dx.fill()}}
  if(Math.random()<.035){dx.strokeStyle='rgba(24,16,10,.6)';dx.lineWidth=.6;dx.beginPath();const x=rand(0,GW),y=rand(0,GH);dx.moveTo(x,y);dx.bezierCurveTo(x+rand(-20,20),y+rand(-20,20),x+rand(-30,30),y+rand(-10,30),x+rand(-25,25),y+rand(10,40));dx.stroke()}
  if(!RMq.matches){fr.style.transform=`translate(${rand(-1,1).toFixed(2)}px,${rand(-1,1).toFixed(2)}px)`;vg.style.opacity=(.93+Math.random()*.07).toFixed(3)}else fr.style.transform=''}
function filmOn(){if(!filmRaf){filmLast=0;filmRaf=requestAnimationFrame(filmTick)}}

/* ================= CUTSCENE PLAYER ================= */
const IMG=n=>'assets/story/clay/'+n+'.jpg',VID=n=>'assets/story/clay/'+n+'.mp4',VO=n=>'audio/vo/'+n+'.mp3';
const FALL={downtown:'loc_downtown',park:'loc_park',beach:'loc_gym',farm:'loc_farm',square:'loc_square'};
const okImg={};// url → true/false once known
function probe(u){if(u in okImg)return;okImg[u]=undefined;const i=new Image();i.onload=()=>okImg[u]=true;i.onerror=()=>okImg[u]=false;i.src=u}
function preload(){for(const c of S.chapters)for(const f of[...(c.in||[]),...(c.out||[])])if(f.img)probe(IMG(f.img));for(const f of S.end||[])if(f.img)probe(IMG(f.img));for(const k in FALL)probe('assets/clay/'+FALL[k]+'.jpg')}
preload();
function showStill(f){im.onerror=null;im.classList.remove('kb','soft');im.hidden=false;
  const fb='assets/clay/'+(FALL[f._d]||'loc_shop_int')+'.jpg';
  const soft=()=>{if(okImg[fb]===false){im.hidden=true;return}im.onerror=()=>{im.hidden=true};im.classList.remove('kb');im.classList.add('soft');im.src=fb};
  if(!f.img||okImg[IMG(f.img)]===false){soft();return}
  im.onerror=soft;im.src=IMG(f.img);void im.offsetWidth;im.classList.add('kb')}
let au=null;
function speak(n,done){if(au){au.pause();au=null}if(!n||X.muted){done(0);return}
  const a=new Audio(VO(n));a.volume=.95;au=a;let fired=false;const f=d=>{if(!fired){fired=true;done(d)}};
  a.onloadedmetadata=()=>f(isFinite(a.duration)?a.duration:0);a.onerror=()=>f(0);a.play().catch(()=>f(0))}
const capHTML=f=>f.cap?(f.who?'<b>'+f.who+'</b>':'')+f.cap:'';
let seq=null;
function play(shots,done,dk){shots=(shots||[]).map(f=>Object.assign({_d:dk},f));
  if(seq)finish(true);if(!shots.length){done&&done();return}
  seq={shots,i:-1,done,tm:0};el.hidden=false;filmOn();requestAnimationFrame(()=>el.classList.add('on'));
  if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock();X.emit('cutscene',true);next()}
function finish(silent){const s=seq;if(!s)return;seq=null;clearTimeout(s.tm);if(au){au.pause();au=null}vid.pause();
  el.classList.remove('on');setTimeout(()=>{if(!seq){el.hidden=true;vid.removeAttribute('src');vid.hidden=true}},350);
  X.emit('cutscene',false);if(!silent)setTimeout(()=>s.done&&s.done(),360)}
function next(){const s=seq;if(!s)return;clearTimeout(s.tm);s.i++;if(s.i>=s.shots.length){finish();return}
  const f=s.shots[s.i],my=s.i,t0=performance.now();
  showStill(f);vid.pause();vid.hidden=true;vid.oncanplay=vid.onerror=vid.onloadedmetadata=null;
  let voD=-1,vd=0;const hold=(f.hold||Math.max(3.5,(f.cap||'').length*.055))*1000;
  const arm=()=>{if(seq!==s||s.i!==my||voD<0)return;clearTimeout(s.tm);const el2=performance.now()-t0;
    const want=voD>0?(voD+.7)*1000:Math.max(hold,vd?(vd+.4)*1000:0);s.tm=setTimeout(next,Math.max(300,want-el2))};
  if(f.vid){vid.onloadedmetadata=()=>{vd=isFinite(vid.duration)?vid.duration:0;arm()};vid.oncanplay=()=>{if(seq===s&&s.i===my){vid.hidden=false;vid.play().catch(()=>{})}};
    vid.onerror=()=>{vid.hidden=true};vid.src=VID(f.vid);try{vid.load()}catch(e){}}else vid.removeAttribute('src');
  capEl.innerHTML=capHTML(f);capEl.hidden=!f.cap;
  speak(f.vo,d=>{voD=d;arm()})}
el.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();next()});
addEventListener('keydown',e=>{if(e.repeat)return;if(seq&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape')){e.stopPropagation();e.preventDefault();next()}
  else if(cardCb&&(e.code==='Space'||e.code==='Enter')){e.stopPropagation();e.preventDefault();endCard()}},true);

/* ================= CHAPTER TITLE CARD ================= */
let cardCb=null,cardTm=0;
function showCard(n,cb){const c=CH(n);card.firstChild.textContent=n;card.lastChild.textContent=c.title||'';card.classList.remove('go');void card.offsetWidth;card.classList.add('go');
  cardCb=cb;clearTimeout(cardTm);cardTm=setTimeout(endCard,2200)}
function endCard(){clearTimeout(cardTm);card.classList.remove('go');const f=cardCb;cardCb=null;f&&f()}

/* ================= STATE ================= */
const st={run:0,ch:0,phase:'idle',goal:0,got:0,c5:0,mult:1,acc:0,mood:null};
let credited=new Set(),onIntro=null,introSeen=false;
const coreStart=X.start,coreReset=$('again').onclick;
X.on('introdone',()=>{const f=onIntro;onIntro=null;f&&f()});
const BOSSES=()=>X.crowds&&X.crowds.BOSS;
const bossCfg=n=>{const B=BOSSES(),k=PLAN[n].boss;return k&&B?B[k]:null};
const bossDone=n=>{const k=PLAN[n].boss;if(!k||!BOSSES())return true;const c=BOSSES()[k];return !c||!c.n||!!c.n.boss.dead};
function progress(){const n=st.ch;if(!n)return 0;
  if(n===5)return st.phase==='end'?1:st.phase==='play'&&st.c5>0?clamp((st.c5-X.count)/st.c5,0,1):0;
  if(st.phase==='out')return 1;if(st.phase!=='play')return 0;
  const hb=!!PLAN[n].boss,u=st.goal+(hb?2:0);return clamp((Math.min(st.got,st.goal)+(hb&&bossDone(n)?2:0))/u,0,1)}
function floor(){if(st.phase==='end'||st.phase==='idle'||!st.ch)return 0;if(st.ch<5)return PLAN[st.ch].floor;
  const c=bossCfg(5);return c&&c.n&&!c.n.boss.dead?DETECTO_FLOOR:0}
let hkShown='';
function hud(){const p=progress(),w=(p*100).toFixed(1)+'%',b=$('panicv'),h=$('hookp');if(b&&b.style.width!==w)b.style.width=w;
  const s=Math.floor(p*100)+'%';if(h&&h.textContent!==s)h.textContent=s;const c=st.ch?st.ch+'/5':'';if(chEl.textContent!==c){chEl.textContent=c;chEl.hidden=!c}}
function setMood(){const s=X.sal;if(s&&typeof s.setMood==='function'&&st.mood&&(s._stMood!==st.mood)){try{s.setMood(st.mood);s._stMood=st.mood}catch(e){}}}

// remove vapes without anyone smoking them (word of mouth sells them through the shop between chapters)
function capCount(cap){const d=X.count-cap;if(d<=0)return;X.count=cap;X.used=X.used+d;
  let r=d,g=0;while(r>0&&g++<1e5){const i=X.ri(X.STOCK.length);if(X.STOCK[i]>0){X.STOCK[i]--;r--}else if(!X.STOCK.some(v=>v>0))break}
  try{X.setFlav(X.fi,1)}catch(e){}}

/* ---------- district population ---------- */
const P2={x:0,z:0},spawned={};
function spot(dk){for(let k=0;k<30;k++){let x,z;
    if(dk==='park'){x=rand(-136,-72);z=rand(-66,66);if(Math.hypot((x+98)/15,(z+8)/11.5)<1.2)continue}
    else if(dk==='beach'){x=rand(-42,42);z=rand(-118,-80)}
    else if(dk==='farm'){x=rand(76,128);z=rand(-46,46)}
    else if(dk==='square'){const a=rand(0,PI*2),r=rand(14,34);x=Math.cos(a)*r;z=-6+Math.sin(a)*r}
    else{const d=DIST(dk);x=rand(d.x0+6,d.x1-6);z=rand(d.z0+6,d.z1-6)}
    P2.x=x;P2.z=z;X.collide(P2,1.2);return[P2.x,P2.z]}
  return[PLAN[st.ch]?PLAN[st.ch].at[0]:0,PLAN[st.ch]?PLAN[st.ch].at[1]:0]}
function populate(n){if(spawned[n])return;spawned[n]=1;const dk=CH(n).district;
  for(const[ty,k]of PLAN[n].extra)for(let i=0;i<k;i++){if(!X.BUILD[ty])continue;const[x,z]=spot(dk);try{X.spawn(ty,x,z)}catch(e){console.warn('[story] spawn',ty,e);continue}
    const c=X.npcs[X.npcs.length-1];c._home=dk;c.hooked=false;try{X.setCrave(c)}catch(e){}}}
function unhook(n){n.hooked=false;if(n.H&&n.H.Wh)for(const wm of n.H.Wh)wm.material=X.M(0xffffff)}
function prep(n){populate(n);
  if(n===3)for(const c of X.npcs)if(c.type==='gym'&&!c.boss&&c.hooked&&!credited.has(c)&&inD('beach',c.hx,c.hzz))unhook(c);// gym bros start hooked; make them earnable
  if(n===5){// everyone already hooked comes back for seconds: they pour into the square during the cutscene
    let k=0;for(const c of X.npcs){if(!c.hooked||c.boss||k>=36||c.state==='held')continue;const[x,z]=spot('square');c.g.position.set(x,0,z);c.state='wander';c.cool=0;c.tm=0;c.tx=x;c.tz=z;k++}}}

/* ---------- beacon: a tall coloured cotton-cloud column + orbiting vapes over the target district ---------- */
let bc=null;const SPH=new T.SphereGeometry(1,10,8),VBX=new T.BoxGeometry(.9,1.3,.55);
function beaconOn(n){beaconOff(true);const P=PLAN[n];if(n===1)return;
  const g=new T.Group(),m=new T.MeshBasicMaterial({color:P.col,transparent:true,opacity:0,depthWrite:false,fog:false}),
    mw=new T.MeshBasicMaterial({color:0xfff7ea,transparent:true,opacity:0,depthWrite:false,fog:false}),cubes=[];
  for(let i=0;i<15;i++){const s=new T.Mesh(SPH,i%3?m:mw),r=2+i*.12+rand(0,.8);s.scale.set(r,r*1.2,r);s.position.set(rand(-.8,.8),5+i*4.2,rand(-.8,.8));s.userData.y0=s.position.y;s.userData.ph=rand(0,6);g.add(s)}
  for(let i=0;i<8;i++){const s=new T.Mesh(SPH,i%2?m:mw),r=rand(4.5,7.5);s.scale.set(r,r*.7,r);const a=i/8*PI*2;s.position.set(Math.cos(a)*6,68+rand(-2,3),Math.sin(a)*6);s.userData.y0=s.position.y;s.userData.ph=rand(0,6);g.add(s)}
  const vm=new T.MeshBasicMaterial({color:P.col,transparent:true,opacity:0,depthWrite:false,fog:false});
  for(let i=0;i<10;i++){const c=new T.Mesh(VBX,vm);c.userData.a=i/10*PI*2;c.userData.y=48+(i%3)*5;g.add(c);cubes.push(c)}
  g.position.set(P.at[0],0,P.at[1]);g.scale.setScalar(1.4);g.renderOrder=2;X.scene.add(g);bc={g,mats:[m,mw,vm],cubes,o:0,n,dk:CH(n).district,on:true}}
function beaconOff(now){if(!bc)return;if(now){X.scene.remove(bc.g);bc=null}else bc.on=false}
function beaconStep(dt,t){if(!bc)return;const inside=inD(bc.dk,X.px,X.pz),tg=bc.on&&st.phase==='play'&&!inside?.42:0;
  bc.o+=clamp(tg-bc.o,-dt*.8,dt*.8);if(!bc.on&&bc.o<=0.001){beaconOff(true);return}
  bc.g.visible=bc.o>.003;if(!bc.g.visible)return;bc.mats[0].opacity=bc.o;bc.mats[1].opacity=bc.o*.8;bc.mats[2].opacity=Math.min(1,bc.o*2);
  bc.g.rotation.y=t*.08;for(const s of bc.g.children){if(s.userData.y0!==undefined)s.position.y=s.userData.y0+Math.sin(t*.9+s.userData.ph)*.8}
  for(const c of bc.cubes){const a=c.userData.a+t*.5;c.position.set(Math.cos(a)*9,c.userData.y+Math.sin(t*1.3+c.userData.a*3)*1.5,Math.sin(a)*9);c.rotation.set(t*1.1+c.userData.a,t*.7,0)}}

/* ================= FLOW ================= */
function freeze(){if(X.held)try{X.release(X.held,'ok')}catch(e){}if(X.mode==='play'||X.mode==='paused')X.mode='cutscene';X.keys.Space=0;
  if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock()}
function ensureStarted(n,cb){const m=X.mode;
  if(m==='intro'){$('intro').hidden=true;coreStart();
    if(n===1&&!introSeen&&X.playIntro){introSeen=true;X.playIntro();if(X.cine){onIntro=cb;return}}
    if(X.mode==='play')X.mode='cutscene';cb();return}
  if(m==='won'){$('win').hidden=true;coreReset();if(X.mode==='play')X.mode='cutscene';cb();return}
  cb()}
function enter(n){const tok=st.run,P=PLAN[n];st.ch=n;st.phase='in';st.got=0;st.goal=P.goal;st.mood=P.mood;setMood();
  if(X.mode==='play'||X.mode==='paused')freeze();X.emit('chapter',n,'in');prep(n);hud();
  play(CH(n).in,()=>{if(tok!==st.run)return;ensureStarted(n,()=>{if(tok!==st.run)return;
    if(X.mode==='play')X.mode='cutscene';hud();showCard(n,()=>{if(tok===st.run)begin(n)})})},CH(n).district)}
function begin(n){st.phase='play';if(X.mode==='cutscene'&&!X.cine)X.mode='play';
  if(n===5){st.c5=Math.max(1,X.count);st.mult=clamp(st.c5/900,1.4,2.4);st.acc=0}
  const k=PLAN[n].boss;if(k&&X.crowds&&X.crowds.spawnBoss)try{X.crowds.spawnBoss(k)}catch(e){console.warn('[story] boss',e)}
  beaconOn(n);X.emit('chapter',n,'play');hud()}
function clear(){const n=st.ch,tok=st.run;st.phase='out';X.emit('chapter',n,'out');beaconOff();hud();
  setTimeout(()=>{if(tok!==st.run||st.phase!=='out')return;freeze();capCount(PLAN[n].cap);
    play(CH(n).out,()=>{if(tok===st.run)enter(n+1)},CH(n).district)},1400)}
function newRun(){st.run++;credited=new Set();st.phase='idle';st.ch=0;onIntro=null;if(cardCb){cardCb=null;clearTimeout(cardTm);card.classList.remove('go')}beaconOff(true);freeHide(false)}

$('go').onclick=()=>{$('intro').hidden=true;newRun();enter(1)};
$('again').onclick=()=>{$('win').hidden=true;newRun();enter(1)};

/* ---------- game hooks ---------- */
X.on('start',()=>{X.twist=true});// the story has its own twist (the end): no surprise second container mid-run
// a creature counts for the chapter when it becomes hooked inside the chapter's district
X.on('release',n=>{if(st.phase!=='play'||st.ch<1||st.ch>4||n.boss||n.hooked||credited.has(n))return;
  if(!(n.times>=n.t.hook))return;const dk=CH(st.ch).district,p=n.g.position;
  if(!inD(dk,p.x,p.z)&&!inD(dk,X.px,X.pz))return;credited.add(n);st.got++;hud()});
X.on('vape',()=>{const f=floor();if(X.count<f){X.count=f;X.used=Math.max(0,X.used-1);return}
  if(st.ch===5&&st.phase==='play'){st.acc+=st.mult-1;while(st.acc>=1&&X.count>f){X.count--;X.used=X.used+1;st.acc--}}});
// ch5: free samples for everyone (hide that power-up's icon: it's the chapter, not a pickup)
let freeEl=null;function freeHide(v){if(!freeEl){const i=Object.keys(X.PW||{}).indexOf('free'),p=$('powers');if(i>=0&&p)freeEl=p.children[i]}if(freeEl)freeEl.style.visibility=v?'hidden':''}
X.on('frame',(dt)=>{
  if(st.phase==='play'){
    if(st.ch>=1&&st.ch<=4&&st.got>=st.goal&&bossDone(st.ch))clear();
    if(st.ch===5){X.act.free=Math.max(X.act.free,1.5);freeHide(true)}}
  // spawned roamers (joggers) stay in their district
  for(const n of X.npcs){if(!n._home||n.state!=='wander'||(n.tx===n._sx&&n.tz===n._sz))continue;if(!inD(n._home,n.tx,n.tz)){const[x,z]=spot(n._home);n.tx=x;n.tz=z}n._sx=n.tx;n._sz=n.tz}
  hud()});
let moodT=0;
X.on('prerender',(dt,t)=>{beaconStep(Math.min(.05,dt||.016),performance.now()/1000);moodT-=dt||.016;if(moodT<0){moodT=.5;setMood()}});
// ending: after the final-vape slow-mo (juice), the end cutscene, then the win screen
X.on('win',()=>{const tok=st.run,t0=performance.now();st.phase='end';if(st.ch)X.emit('chapter',st.ch,'out');beaconOff();freeHide(false);hud();
  const wait=()=>{if(tok!==st.run||X.mode!=='won')return;const w=$('win');
    if(!w.hidden||performance.now()-t0>4600){w.hidden=true;play(S.end||[],()=>{if(tok===st.run&&X.mode==='won')w.hidden=false},'square')}else setTimeout(wait,120)};
  setTimeout(wait,600)});

/* ================= API ================= */
X.story={get chapter(){return st.ch},get phase(){return st.phase},get goal(){return st.ch===5?st.c5:st.goal},
  get progress(){return progress()},get hooked(){return st.got},play:(shots,done)=>play(shots,done),get script(){return S}};

if(location.hash==='#dbg')window.tmvs={
  chapter(n){n=clamp(n|0,1,5);if(seq)finish(true);newRun();
    if(X.mode==='intro'){$('intro').hidden=true;introSeen=true;coreStart()}else if(X.mode==='won'){$('win').hidden=true;coreReset()}
    const B=BOSSES();if(B)for(const k in B){const c=B[k];if(k!==PLAN[n].boss&&c.n&&!c.n.boss.dead&&X.crowds.despawn)X.crowds.despawn(c)}
    capCount(START[n]);enter(n)},
  win(){if(st.phase!=='play')return 'not in play';const k=PLAN[st.ch].boss,B=BOSSES();
    if(k&&B&&B[k].n&&!B[k].n.boss.dead&&X.crowds.defeat)X.crowds.defeat(B[k].n);
    if(st.ch<5){st.got=Math.max(st.got,st.goal);return 'ch'+st.ch+' goal met'}
    if(X.count>0){X.count=1;X.drain(2)}return 'emptied'},
  skip(){if(seq){finish();return 'cutscene'}if(cardCb){endCard();return 'card'}if(X.cine){dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK'}));return 'intro'}return 'nothing'},
  get s(){return{ch:st.ch,phase:st.phase,got:st.got,goal:st.goal,count:X.count,floor:floor(),mode:X.mode,progress:progress()}}};
})();
