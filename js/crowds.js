/* crowds mod: the town reacts as a crowd, hooked fans form a conga line, NPCs steer around buildings,
   and three mega-lung bosses show up as the vape count drops. Talks to the game only through window.TMV.
   Runs after the core think() each frame ('frame' event) and post-corrects positions/poses; positions are
   snapshotted in 'prerender' so a frozen or conga NPC can undo the core's movement for that frame. */
(()=>{const X=window.TMV;if(!X){console.warn('[crowds] window.TMV missing');return}
const {T,npcs,cols,scene,rand,pick,clamp,lerp}=X,PI=Math.PI;
const V1=new T.Vector3(),V2=new T.Vector3(),TMP={x:0,z:0},L1=[],L2=[];
let now=0,fc=0;
const isHuman=n=>n.A&&n.A.length===2&&n.A[0].k&&n.A[1].k;
const turn=(n,x,z,k)=>{const p=n.g.position;let a=Math.atan2(x-p.x,z-p.z)-n.g.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));n.g.rotation.y+=a*Math.min(1,k)};
const back=n=>{if(n._ox!==undefined){n.g.position.x=n._ox;n.g.position.z=n._oz}};
const pose=(n,mv,arms,face,t,dt)=>{if(X.pose)try{X.pose(n,mv,arms,face,t,dt)}catch(e){}};

/* ---------- static obstacle grid (building/car/tree AABBs), rebuilt only if cols grows ---------- */
const CS=12,cg=new Map();let cgN=-1;
function buildCG(){cg.clear();cgN=cols.length;for(const c of cols)for(let ix=Math.floor((c.a-2)/CS);ix<=Math.floor((c.b+2)/CS);ix++)for(let iz=Math.floor((c.c-2)/CS);iz<=Math.floor((c.d+2)/CS);iz++){const k=ix*4096+iz;let L=cg.get(k);if(!L)cg.set(k,L=[]);L.push(c)}}
function boxAt(x,z,m){const L=cg.get(Math.floor(x/CS)*4096+Math.floor(z/CS));if(L)for(const c of L)if(x>c.a-m&&x<c.b+m&&z>c.c-m&&z<c.d+m)return c;return null}
// which way to slide around box c when heading (dx,dz) from p: along the face we're approaching, toward the side we already lean to (or the nearer end)
function tangent(c,p,dx,dz){const cx=(c.a+c.b)/2,cz=(c.c+c.d)/2,ox=(p.x-cx)/((c.b-c.a)/2+.01),oz=(p.z-cz)/((c.d-c.c)/2+.01);
  if(Math.abs(ox)>Math.abs(oz)){const s=Math.abs(dz)>.25?Math.sign(dz):(p.z>=cz?1:-1);return[0,s]}const s=Math.abs(dx)>.25?Math.sign(dx):(p.x>=cx?1:-1);return[s,0]}
// sticky per NPC: once it picks a way around a box it keeps it for 3s, so it doesn't dither at the corner
function avoid(n,c,p,dx,dz){if(n._avb!==c||now-n._avbT>3){n._avb=c;n._avs=tangent(c,p,dx,dz)}n._avbT=now;return n._avs}

/* ---------- dynamic NPC buckets, rebuilt 5x/sec ---------- */
const NS=8,ng=new Map();let ngT=0;
function buildNG(){for(const L of ng.values())L.length=0;for(const n of npcs){const p=n.g.position,k=Math.floor(p.x/NS)*4096+Math.floor(p.z/NS);let L=ng.get(k);if(!L)ng.set(k,L=[]);L.push(n)}}
function near(x,z,r,out){out.length=0;const r2=r*r;for(let ix=Math.floor((x-r)/NS);ix<=Math.floor((x+r)/NS);ix++)for(let iz=Math.floor((z-r)/NS);iz<=Math.floor((z+r)/NS);iz++){const L=ng.get(ix*4096+iz);if(L)for(const n of L){const p=n.g.position;if((p.x-x)**2+(p.z-z)**2<r2)out.push(n)}}return out}

/* ================= CROWD REACTIONS ================= */
const GASP={_:['OH MY GOD','he vaped GARY','is that LEGAL??','RUN','not AGAIN','somebody call somebody','I saw nothing. NOTHING.','my CHILDREN','that man has a container'],
  grandma:['Lord have mercy!','Harold, LOOK!','not in front of the pigeons!'],kid:['WHOA','do me next— wait no','MOOOM'],cop:['HEY!','that is a CITATION','STOP RIGHT THERE'],
  gym:['BRO?!','sick form bro'],jogger:['oh no oh no oh no'],worker:['I am filing a REPORT','not on company time!'],dog:['BORF!?'],cat:['HSSS'],pigeon:['COO!?'],chicken:['BAWK!?'],cow:['moo?!'],baby:['ga!?']};
const STARE=['uh…','is he—','oh no','is that a vape','👀','don\'t look'];
const WHAT=['what? WHAT?','why is everyone running','RUN!','go go go','I don\'t know why we\'re running','THE VAPE GUY'];
const SKIT={pigeon:1,chicken:1,cat:1};
const canGawk=o=>o.state==='wander'&&!o.hooked&&!o.boss&&o!==X.held&&!o._cw&&!o._cj;
function gawk(o,x,z,dur,gen,src){o._cw={x,z,until:now+dur,gen,src,flee:!o.t.brave};o._pt=now}
// victim n is being vaped (staring=true on grab) or just got vaped (release)
function react(n,r,staring){const p=n.g.position;let sN=0,eN=0;
  for(const o of near(p.x,p.z,r,L1)){if(o===n||o.boss)continue;let fresh=false;
    if(o._cw&&o._cw.src===n){if(staring)continue;o._cw.until=Math.min(o._cw.until,now+rand(.15,.8))}
    else if(canGawk(o)){if(SKIT[o.type]&&!staring){o.state='flee';o.tm=rand(2,3.5);o._pt=now;o._pg=2;continue}gawk(o,p.x,p.z,staring?6:rand(.35,1.1),1,n);fresh=true}
    else continue;
    const m=X.mouth(o,V1),y=m.y+.55;
    if(staring){if(fresh&&eN<3){eN++;X.emo('👀',m.x,y,m.z,0,.6,0,.38)}if(fresh&&sN<1&&Math.random()<.5){sN++;X.say(o,pick(STARE),1.8)}}
    else{if(eN<6){eN++;X.emo(o.type==='cop'?'🚨':'❗',m.x,y,m.z,0,1.2,0,.5)}if(sN<2&&Math.random()<.6){sN++;X.say(o,pick(GASP[o.type]||GASP._),2)}
      if(o.type==='cop')X.heat=Math.min(1,X.heat+.02)}}}
function doGawk(n,dt,t){const c=n._cw;if(n.state!=='wander'||n.hooked||n===X.held){n._cw=null;return false}
  back(n);n.g.position.y=0;turn(n,c.x,c.z,dt*8);pose(n,0,0,3,t,dt);
  if(isHuman(n)){const k=Math.min(1,dt*12),A=n.A;// right arm points at the scene, left hand to mouth (gasp)
    A[1].rotation.x=lerp(A[1].rotation.x,-1.55,k);A[1].rotation.z=lerp(A[1].rotation.z,.12,k);A[1].k.rotation.x=lerp(A[1].k.rotation.x,-.05,k);
    A[0].rotation.x=lerp(A[0].rotation.x,-2.5,k);A[0].rotation.z=lerp(A[0].rotation.z,.45,k);A[0].k.rotation.x=lerp(A[0].k.rotation.x,-2,k)}
  if(now>=c.until){n._cw=null;if(c.flee){n.state='flee';n.tm=rand(2.5,4.5);n._pt=now;n._pg=c.gen}}return true}
// panic spreads person to person: a fresh runner spooks wanderers within 6m, up to 3 hops from the victim
function spread(){let eN=0;for(const n of npcs){if(n.state!=='flee'||n.boss||n.hooked)continue;
  if(!n._pt||now-n._pt>6){n._pt=now;n._pg=X.heat>.4?2:3}
  if(n._pg>=3||now-n._pt>2.5)continue;const p=n.g.position;
  for(const o of near(p.x,p.z,6,L2)){if(!canGawk(o)||now-(o._pt||-99)<8||Math.random()>.55)continue;
    gawk(o,p.x,p.z,rand(.25,.6),n._pg+1,null);if(eN<4){eN++;const m=X.mouth(o,V1);X.emo('❓',m.x,m.y+.5,m.z,0,1,0,.4)}if(Math.random()<.12)X.say(o,pick(WHAT),1.5)}}}

/* ================= STEERING (post-correct the core's move) =================
   A feeler ahead of each moving NPC (checked every 3rd frame, round-robin) looks up the obstacle grid;
   on a hit it pushes along the blocking face for a moment, so they veer around corners instead of grinding into walls. */
function steerPost(n,i,d,dt){const p=n.g.position,ty=n.t;let spd=0,dx=0,dz=0;
  if((n.hooked&&d<30)||(X.act.free>0&&d<60)){if(d>1.7+n.r){spd=ty.speed*.85;dx=X.px-p.x;dz=X.pz-p.z}}
  else if(n.type==='cop'&&X.heat>.3&&d<48&&n.state!=='flee'){spd=ty.speed;dx=X.px-p.x;dz=X.pz-p.z}
  else if(n.state==='flee'){spd=ty.speed*.8;dx=p.x-X.px;dz=p.z-X.pz}
  else if(n.state==='wander'){if(n.tx!==n._ltx||n.tz!==n._ltz){if(boxAt(n.tx,n.tz,n.r+.3)){TMP.x=n.tx;TMP.z=n.tz;X.collide(TMP,n.r+.4);n.tx=TMP.x;n.tz=TMP.z}n._ltx=n.tx;n._ltz=n.tz}
    dx=n.tx-p.x;dz=n.tz-p.z;if(dx*dx+dz*dz>.16)spd=ty.speed*(ty.roam?.62:.3)}
  if(!spd){n._av=null;return}
  if((fc+i)%3===0){const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;const f=n.r+1.5,c=boxAt(p.x+dx*f,p.z+dz*f,n.r+.15);if(c){const tg=avoid(n,c,p,dx,dz);n._av=[tg[0],tg[1],.6]}}
  const a=n._av;if(!a)return;a[2]-=dt;if(a[2]<=0)n._av=null}

/* ================= CONGA LINE =================
   The player's path is kept as a breadcrumb ring buffer (one point per 0.4m). Hooked followers are ordered by
   when they joined and each walks to its own slot further back along that path, facing the one in front. */
const TN=320,STEP=.4,TRx=new Float32Array(TN),TRz=new Float32Array(TN);let ti=0,tn=0,congaN=0,congaBest=0,chantT=4;
function trailPush(x,z){ti=(ti+1)%TN;TRx[ti]=x;TRz[ti]=z;if(tn<TN)tn++}
function trail(){const px=X.px,pz=X.pz;if(!tn){trailPush(px,pz);return}let lx=TRx[ti],lz=TRz[ti],dx=px-lx,dz=pz-lz,d=Math.hypot(dx,dz);
  if(d>25){tn=0;trailPush(px,pz);return}while(d>=STEP){lx+=dx/d*STEP;lz+=dz/d*STEP;trailPush(lx,lz);d-=STEP}}
const CHANT=['CON-GA!','da da da da da da da HEY','*conga noises*','one more puff ✨','LEFT FOOT, VAPE FOOT','we follow the cloud','🎶 vape vape vape 🎶'];
function conga(list,dt,t){list.sort((a,b)=>a._cj-b._cj);let L=1.2,prev=null;const n0=list.length;
  for(let i=0;i<n0;i++){const n=list[i],p=n.g.position;L+=n.r+(prev?prev.r+.45:0);const k=Math.min(Math.round(L/STEP),tn-1),j=(ti-k+TN)%TN,tx=TRx[j],tz=TRz[j];
    back(n);let dx=tx-p.x,dz=tz-p.z;const d=Math.hypot(dx,dz);let mv=0;
    if(d>.15){const sp=Math.min(d*3,Math.max(4.6,n.t.speed*(d>5?1.35:1)));dx/=d;dz/=d;const f=n.r+1.2,c=boxAt(p.x+dx*f,p.z+dz*f,n.r+.1);
      if(c){const tg=avoid(n,c,p,dx,dz);dx=dx*.3+tg[0];dz=dz*.3+tg[1];const l=Math.hypot(dx,dz);dx/=l;dz/=l}
      p.x+=dx*sp*dt;p.z+=dz*sp*dt;X.collide(p,n.r);n.ph+=sp*dt*3.2;mv=1}
    if(prev)turn(n,prev.g.position.x,prev.g.position.z,dt*8);else turn(n,X.px,X.pz,dt*8);
    if(!n.t.lift)p.y=Math.abs(Math.sin(t*7-i*.7))*.13;pose(n,mv,n.A&&n.A.length?2:0,0,t,dt);prev=n}
  if(n0>congaBest){if(n0>=3&&(congaBest<3||n0%5===0))X.toast('CONGA LINE ×'+n0,1.4);congaBest=n0}congaN=n0;
  chantT-=dt;if(chantT<0&&n0>=3){chantT=rand(3,6);X.say(pick(list),pick(CHANT),1.8)}}

/* ================= BOSSES ================= */
const css=document.createElement('style');css.textContent=`
#bosscard{position:absolute;left:50%;top:26%;transform:translateX(-50%) rotate(-2deg);pointer-events:none;text-align:center;background:var(--panel,rgba(20,15,28,.85));border:4px solid var(--hot,#ff3fa4);box-shadow:6px 6px 0 var(--lime,#b6ff3c);padding:10px 22px 12px;width:min(560px,88vw);box-sizing:border-box;opacity:0;z-index:5}
#bosscard.go{animation:bcard 4.2s ease-out forwards}
#bosscard small{display:block;font-weight:800;letter-spacing:.2em;font-size:11px;color:var(--lime,#b6ff3c)}
#bosscard b{display:block;font-family:var(--display,Impact,sans-serif);font-weight:400;font-size:clamp(26px,6.5vw,52px);line-height:1;color:var(--hot,#ff3fa4);text-shadow:3px 3px 0 var(--ink,#140f1c);margin:4px 0}
#bosscard span{display:block;font-weight:600;font-size:clamp(13px,2.6vw,17px)}#bosscard em{display:block;font-style:normal;font-weight:800;font-size:12px;letter-spacing:.12em;margin-top:6px;color:var(--sky,#5fd4ff)}
@keyframes bcard{0%{opacity:0;translate:-60vw 0}10%{opacity:1;translate:0 0}84%{opacity:1;translate:0 0}100%{opacity:0;translate:60vw 0}}
#bossbar{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:min(380px,72vw);box-sizing:border-box;pointer-events:none;background:var(--panel,rgba(20,15,28,.8));padding:5px 10px 6px;border-left:6px solid var(--hot,#ff3fa4)}
#bossbar .bn{display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:12px;letter-spacing:.06em;white-space:nowrap}#bossbar .bn b{font-family:var(--display,Impact,sans-serif);font-weight:400;color:var(--hot,#ff3fa4);overflow:hidden;text-overflow:ellipsis}
#bossbar .bb{position:relative;height:14px;margin-top:4px;background:rgba(255,255,255,.15);border:2px solid var(--paper,#fff7ea)}
#bossbar .bb i{display:block;height:100%;background:linear-gradient(90deg,var(--hot,#ff3fa4),var(--fire,#ff7a1a));transition:width .3s}
#bossbar .bb::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(100%/var(--n) - 2px),var(--ink,#140f1c) calc(100%/var(--n) - 2px) calc(100%/var(--n)))}
#bossbar small{display:block;font-weight:800;font-size:10px;letter-spacing:.14em;margin-top:3px;color:var(--lime,#b6ff3c)}
#bossbar.hit .bb{animation:bhit .35s}@keyframes bhit{0%,100%{translate:0 0}25%{translate:-5px 0}75%{translate:5px 0}}
@media (max-width:520px){#bossbar{top:92px}}`;document.head.appendChild(css);
const card=document.createElement('div');card.id='bosscard';X.game.appendChild(card);
const bar=document.createElement('div');bar.id='bossbar';bar.hidden=true;bar.innerHTML='<div class="bn"><b></b><span></span></div><div class="bb"><i></i></div><small></small>';X.game.appendChild(bar);
const barN=bar.querySelector('b'),barW=bar.querySelector('.bn span'),barI=bar.querySelector('.bb i'),barS=bar.querySelector('small');
let cardT=0;
function showCard(top,name,sub,where){card.innerHTML=`<b>${name}</b>`;card.classList.remove('go');void card.offsetWidth;card.classList.add('go');cardT=4.4}
const fanfare=()=>{if(!X.clip('sfx/slam',{vol:.7}))X.beep(110,.6,'sawtooth',.07);[392,523,659,784].forEach((f,i)=>X.beep(f,.22,'square',.035,.25+i*.12))};

// builders: the core human()/BUILD helpers, scaled up, with props in the same toon materials (spawn() inkifies them)
const gold=0xffd23c,whiteC=new T.Color(1,1,1);
const BUILD={
 diva:()=>{const b=X.human({w:.82,depth:.55,head:.46,skirt:1,pants:0xc2253a,shirt:0xc2253a,sleeve:0xffe0e8,hair:'long',hairC:0xd9b45a,extra:(U,H,A)=>{const d=H.d;
    X.dome(H.h,d*1.14,d*.95,d*1.14,0xc9ccd6,0,d*.18,0);for(const s of[-1,1]){const h=X.cone(H.h,d*.22,d*.7,d*.22,0xfff7ea,s*d*.62,d*.55,0);h.rotation.z=-s*.7;X.cyl(H.h,d*.16,d*.9,d*.16,0xd9b45a,s*d*.5,-d*.55,d*.05)}
    for(const s of[-1,1])X.ball(U,.24,.24,.2,0xc9ccd6,s*.17,1.24,.2);for(let i=-3;i<=3;i++)X.ball(U,.06,.06,.06,gold,i*.07,1.44-Math.abs(i)*.02,.24);
    if(A[1]&&A[1].k){X.cyl(A[1].k,.05,1.9,.05,0x9a6a48,0,-.3,.1).rotation.x=PI/2;X.cone(A[1].k,.14,.32,.06,0xc9ccd6,0,-.3,1.1).rotation.x=PI/2}}});
   const gown=X.mk('v',b.g,1.5,1.05,1.5,0xc2253a,0,.52,0);gown.rotation.x=PI;X.cyl(b.g,1.55,.1,1.55,gold,0,.06,0);b.g.scale.setScalar(1.75);b.r=.75;return b},
 prime:()=>{const b=X.BUILD.gym();const H=b.H,d=H.d;X.box(H.h,d*.95,d*.2,d*.1,0x111111,0,d*.08,d*.5);for(const s of[-1,1])X.box(H.h,d*.36,d*.22,d*.06,0x3c8cff,s*d*.22,d*.08,d*.54);
   for(let i=0;i<5;i++)X.cone(H.h,d*.18,d*.32,d*.18,gold,(i-2)*d*.22,d*.78,0);X.cyl(H.h,d*1.12,d*.16,d*1.12,gold,0,d*.55,0);
   for(let i=-4;i<=4;i++)X.ball(b.g,.11,.11,.08,gold,i*.08,1.42-Math.abs(i)*.035,.24);b.g.scale.setScalar(2.05);b.r=.6;return b},
 detecto:()=>{const b=X.human({w:.9,depth:.6,head:.9,pants:0xf2f2f2,shirt:0xf2f2f2,sleeve:0xf2f2f2,arm:.2,skin:0xf7e7d0,hair:'bald',shoe:0xe0244a,extra:(U,H,A,b)=>{const d=H.d;
    X.cyl(H.h,d*1.5,d*.28,d*1.5,0xf7f7f7,0,d*.52,0);X.cyl(H.h,d*1.2,d*.1,d*1.2,0xd8d8de,0,d*.68,0);for(let i=0;i<8;i++){const a=i/8*PI*2;X.box(H.h,d*.04,d*.05,d*.3,0x8a8a92,Math.cos(a)*d*.38,d*.73,Math.sin(a)*d*.38).rotation.y=-a}
    b.led=X.ball(H.h,d*.16,d*.16,d*.16,new T.MeshBasicMaterial({color:0xff2020}),d*.32,d*.74,d*.32);
    X.box(U,.12,.75,.05,0xe0244a,0,1.15,.31).rotation.z=.6;for(const a of A)if(a.k)X.ball(a.k,.42,.42,.42,0xffffff,0,-.38,0)}});b.g.scale.setScalar(2.15);b.r=.7;return b}};
const TYPES={
 diva:{name:'opera diva',cap:3.4,rate:24,speed:2.2,cloud:3.4,hook:1e9,brave:1,stay:1,say:['LA LA LAAAAA-hff','*shatters a nearby window*','BRAVA! (to herself)','that was a HIGH C, darling'],want:['encore. ENCORE.','again, darling']},
 prime:{name:'Gym Bro Prime',cap:4.2,rate:30,speed:3.2,cloud:4,hook:1e9,brave:1,stay:1,say:['THAT WAS A WARMUP SET','LIGHTWEIGHT BABYYYY','*flexes the cloud out*','MY LUNGS HAVE LUNGS'],want:['SPOT ME, KING','one more set bro']},
 detecto:{name:'Detecto the mascot',cap:3.8,rate:34,speed:3.2,cloud:3.8,hook:1e9,brave:1,roam:1,say:['*BEEP BEEP BEEP*','SMOKE DETECTED. IT IS ME. I AM THE SMOKE.','*low battery chirp*','visit the Smoke Detector Outlet!'],want:['*hopeful chirp*','beep? (more)']}};
for(const k in BUILD){X.BUILD[k]=BUILD[k];X.TYPES[k]=TYPES[k]}
const knock={x:0,z:0},PV={x:0,z:0};
function shove(n,sp,st){const p=n.g.position,dx=X.px-p.x,dz=X.pz-p.z,d=Math.hypot(dx,dz)||1;knock.x=dx/d*sp;knock.z=dz/d*sp;X.stun=Math.max(X.stun,st)}
const BOSS={
 diva:{at:4300,x:-87.5,z:27.5,hp:4,reward:350,drops:['boost','chain'],emo:'🎶',col:0xc2253a,short:'THE DIVA',
  name:'LA DIVA LUNGAROTTI',sub:'Soprano. Four octaves. Lungs the size of a bass drum.',where:'📍 THE PARK GAZEBO',
  intro:'You dare interrupt my REHEARSAL?',hit:['MMMMM-AAAAAH ♪','*hits a note only dogs hear*','my DIAPHRAGM!','a lovely vintage…'],low:['my… final… aria…','the fat lady is about to sing'],
  over:['FORTISSIMO!!','*SONIC HIGH C*'],defeat:'…bravissimo. I am your fan now.',
  onHit(n){[1046,1318,1568,2093].forEach((f,i)=>X.beep(f,.18,'triangle',.03,i*.09));const m=X.mouth(n,V1);for(let i=0;i<6;i++)X.emo(pick(['🎶','🎵','🎼']),m.x,m.y,m.z,rand(-2,2),rand(1,2.5),rand(-2,2),.6);react(n,26,false)},
  onOver(n){X.toast('HIGH C SONIC BOOM',1.6);shove(n,15,.35);X.slide(1800,2400,.5,'square',.04);const m=X.mouth(n,V1);for(let i=0;i<24;i++){const a=i/24*PI*2;X.puff(m.x,m.y,m.z,Math.cos(a)*7,rand(-.5,.5),Math.sin(a)*7,whiteC,1.2,.3,1.4)}}},
 prime:{at:3200,x:0,z:-84,hp:5,reward:500,drops:['rush','dual','boost'],emo:'💪',col:0xe02a2a,short:'PRIME',
  name:'GYM BRO PRIME',sub:'Never skipped lung day. Spots himself.',where:'📍 MUSCLE BEACH (NO BEACH)',
  intro:'COME AT ME, BRO. I\'LL WAIT.',hit:['THAT ALL YOU GOT?','*flexes so hard a cloud comes out*','FEEL THE BURN BRO','DO YOU EVEN RIP'],low:['bro… I think I\'m… hooked bro','LAST SET. LAST SET.'],
  over:['SPOTTED.','*bench-presses you*'],defeat:'…respect, king. RESPECT.',
  onHit(n){X.beep(98,.25,'sawtooth',.06);X.beep(65,.4,'sawtooth',.06,.1);for(const o of near(n.g.position.x,n.g.position.z,30,L2))if(o.type==='gym'&&Math.random()<.6)X.say(o,pick(['PRIME! PRIME! PRIME!','THE KING RIPS','LET HIM COOK']),1.6)},
  onOver(n){X.toast('GYM BRO PRIME BENCH-PRESSED YOU',1.6);shove(n,20,.9);X.beep(70,.5,'sawtooth',.08)}},
 detecto:{at:2000,x:3,z:-11,hp:6,reward:700,drops:['free','fog','boost'],emo:'🚨',col:0xf2f2f2,short:'DETECTO',
  name:'DETECTO',sub:'Mascot of the Smoke Detector Outlet. Detects smoke. Is now smoke.',where:'📍 ROAMING THE STREETS',
  intro:'*BEEP* SMOKE DETECTED *BEEP*',hit:['*BEEP BEEP BEEP*','ALARM ALARM ALARM','*battery chirp of shame*','EVACUATE. NOT YOU. EVERYONE ELSE.'],low:['*sad 9-volt chirp*','beep… beep……'],
  over:['FIRE DEPARTMENT NOTIFIED','*MAXIMUM ALARM*'],defeat:'*soft chirp* (I love vapes now)',
  onHit(n){for(let i=0;i<3;i++)X.beep(3100,.09,'square',.035,i*.16);X.heat=Math.min(1,X.heat+.08);react(n,30,false)},
  onOver(n){X.toast('FIRE ALARM — EVERY COP IS COMING',1.8);X.heat=Math.min(1,X.heat+.3);for(let i=0;i<8;i++)X.beep(3100,.09,'square',.05,i*.13)}}};
let bossCheckT=0;
function spawnBoss(key){const c=BOSS[key];if(!c)return null;if(c.n)return c.n;TMP.x=c.x;TMP.z=c.z;if(cgN!==cols.length)buildCG();X.collide(TMP,1.3);
  X.spawn(key,TMP.x,TMP.z);const n=npcs[npcs.length-1];if(!n||n.type!==key)return null;
  n.boss={cfg:c,key,hp:c.hp,dead:0,met:0,sing:2};n.g.rotation.order='YXZ';n._tilt=0;n._bend=0;n.hooked=false;n.cool=0;n.fem=key==='diva';n.vp=key==='diva'?1.25:key==='prime'?.8:1.05;n.emo=c.emo;
  n._ox=TMP.x;n._oz=TMP.z;if(X.setCrave)X.setCrave(n);
  c.beam=X.cyl(scene,1.6,70,1.6,new T.MeshBasicMaterial({color:c.col,transparent:true,opacity:.15,depthWrite:false}),TMP.x,35,TMP.z);
  c.crown=new T.Sprite(new T.SpriteMaterial({map:X.emoTex('👑'),transparent:true,depthWrite:false,fog:false}));c.crown.scale.set(1.1,1.1,1);scene.add(c.crown);
  c.n=n;c.spawned=1;showCard('⚠ A MEGA-LUNG HAS APPEARED ⚠',c.name,c.sub,c.where);fanfare();X.emit('boss',n,'spawn');return n}
function despawn(c){const n=c.n;if(n){scene.remove(n.g);if(n.cb)scene.remove(n.cb);const i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1)}if(c.beam)scene.remove(c.beam);if(c.crown)scene.remove(c.crown);c.n=c.beam=c.crown=null;c.spawned=0}
function bossHit(n,kind,match){const b=n.boss,c=b.cfg;n.times=0;
  let dmg=kind==='perfect'?1:kind==='ok'?.34:kind==='passive'?.12:-.5;if(match&&dmg>0)dmg+=.6;b.hp=clamp(b.hp-dmg,0,c.hp);
  bar.classList.remove('hit');void bar.offsetWidth;bar.classList.add('hit');
  if(b.hp<=0)return defeat(n);
  if(kind==='over'){X.say(n,pick(c.over),2.4);c.onOver(n);return}
  X.say(n,pick(b.hp<=1.01?c.low:c.hit),2.4);c.onHit(n,kind);
  if(kind==='perfect')X.toast('PERFECT RIP — '+c.short+' STAGGERS',1.3);else if(kind==='ok')X.toast('TOO SHALLOW — MEGA-LUNGS NEED PERFECT RIPS',1.5)}
function defeat(n){const b=n.boss,c=b.cfg,p=n.g.position;b.dead=1;n.hooked=true;for(const wm of n.H.Wh||[])wm.material=X.M(0xffc4c4);
  if(c.beam)c.beam.visible=false;if(c.crown)c.crown.visible=false;X.say(n,c.defeat,3.5);
  showCard('★ MEGA-LUNG DEFEATED ★',c.name,'−'+c.reward.toLocaleString()+' VAPES · dropped '+c.drops.length+' power-ups','');
  if(!X.clip('sfx/fanfare',{vol:.6}))[523,659,784,1046].forEach((f,i)=>X.beep(f,.3,'triangle',.05,i*.1));
  const m=X.mouth(n,V1);for(let i=0;i<14;i++)X.emo(pick(['🎉','✨',c.emo,'💨']),m.x,m.y,m.z,rand(-3,3),rand(1,4),rand(-3,3),.6);
  c.drops.forEach((k,i)=>{const a=i/c.drops.length*PI*2+.4;X.spawnPick(k,p.x+Math.cos(a)*3.5,p.z+Math.sin(a)*3.5)});
  X.combo+=5;X.drain(c.reward);react(n,30,false);X.emit('boss',n,'defeat')}
// a giant can't shrink to vape height: bend at the waist, then bow the whole body until the mouth is at eye level
// (the core pitches the camera toward the mouth, so the vape tip follows it down); never lift them off the ground
function bossHeld(n,dt){const p=n.g.position,g=n.g;X.armR.tip.getWorldPosition(V1);
  n._bend=lerp(n._bend,.75,Math.min(1,dt*6));if(n.P)n.P.rotation.x=n._bend;p.y=0;g.rotation.x=0;g.updateMatrixWorld(true);n.H.m.getWorldPosition(V2);
  const fx=Math.sin(g.rotation.y),fz=Math.cos(g.rotation.y),h=V2.y-p.y,f=(V2.x-p.x)*fx+(V2.z-p.z)*fz,R=Math.hypot(h,f)||1,a=clamp(Math.acos(clamp(Math.min(V1.y,1.7)/R,-1,1))-Math.atan2(f,h),0,1.25);
  n._tilt=lerp(n._tilt,a,Math.min(1,dt*8));g.rotation.x=n._tilt;g.updateMatrixWorld(true);n.H.m.getWorldPosition(V2);
  p.x+=V1.x-V2.x;p.z+=V1.z-V2.z;p.y+=clamp(V1.y-V2.y,-.5,0);
  if(n._hy0===undefined){n._hy0=n.hy;n._hz0=n.hz}n.hy=Math.min(V1.y,1.7)-p.y;n.hz=Math.max(.2,(V1.x-p.x)*fx+(V1.z-p.z)*fz);// core mouth()/camera pitch read hy/hz
  if(Math.random()<dt*3)X.emo(n.boss.cfg.emo,V2.x,V2.y+.6,V2.z,rand(-1,1),1.5,rand(-1,1),.5)}
function unTilt(n,dt){if(n._hy0!==undefined){const k=Math.min(1,dt*6);n.hy=lerp(n.hy,n._hy0,k);n.hz=lerp(n.hz,n._hz0,k)}if(n._tilt>.001){n._tilt=lerp(n._tilt,0,Math.min(1,dt*6));n.g.rotation.x=n._tilt}n._bend=lerp(n._bend||0,0,Math.min(1,dt*6))}
function bossFrame(n,d,dt,t){const b=n.boss,c=b.cfg,p=n.g.position;
  if(n.state==='flee'){n.state='wander';n.cool=Math.min(n.cool,1.6)}n.hooked=false;n.times=0;
  if(!b.met&&d<16&&n.state==='wander'){b.met=1;X.say(n,c.intro,3.2);X.toast(c.name+' — '+c.hp+' PERFECT RIPS TO TAKE DOWN',2.4)}
  if(n.state==='held'){bossHeld(n,dt);return}
  unTilt(n,dt);if(n.state!=='wander')return;
  const k=Math.min(1,dt*8);
  if(b.key==='prime'&&d<28&&d>2.6+n.r){back(n);let dx=X.px-p.x,dz=X.pz-p.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;const cc=boxAt(p.x+dx*2,p.z+dz*2,n.r+.1);if(cc){const tg=avoid(n,cc,p,dx,dz);dx=tg[0];dz=tg[1]}
    p.x+=dx*2.6*dt;p.z+=dz*2.6*dt;X.collide(p,n.r);n.ph+=2.6*dt*3.2;turn(n,X.px,X.pz,dt*6);pose(n,1,0,0,t,dt);
    b.sing-=dt;if(b.sing<0){b.sing=rand(4,7);X.say(n,pick(['COME AT ME BRO','I CAN SMELL THE MANGO','CARDIO IS FOR COWARDS']),1.8)}return}
  if(d<26)turn(n,X.px,X.pz,dt*3);
  if(isHuman(n)){const A=n.A;if(b.key==='prime'){// double-bicep flex while waiting
      for(let i=0;i<2;i++){const s=i?1:-1;A[i].rotation.x=lerp(A[i].rotation.x,0,k);A[i].rotation.z=lerp(A[i].rotation.z,s*1.5,k);A[i].k.rotation.x=lerp(A[i].k.rotation.x,-1.9-Math.sin(t*4)*.2,k)}}
    else if(b.key==='diva'){for(let i=0;i<2;i++){const s=i?1:-1;A[i].rotation.x=lerp(A[i].rotation.x,-.9,k);A[i].rotation.z=lerp(A[i].rotation.z,s*(1+Math.sin(t*1.5+i)*.25),k);A[i].k.rotation.x=lerp(A[i].k.rotation.x,-.3,k)}
      if(n.H.m&&n.ms)n.H.m.scale.y=lerp(n.H.m.scale.y,n.ms.y*(3+Math.sin(t*5)*.8),k);
      b.sing-=dt;if(b.sing<0&&d<30){b.sing=rand(3,5);const m=X.mouth(n,V1);X.emo(pick(['🎵','🎶']),m.x,m.y+.3,m.z,rand(-.6,.6),1.2,rand(-.6,.6),.55);if(d<22)[523,659,784,659].forEach((f,i)=>X.beep(f*(1+Math.random()*.02),.3,'triangle',.016*(1-d/22),i*.28))}}}
  if(b.key==='detecto'&&d<12){b.sing-=dt;if(b.sing<0){b.sing=rand(5,8);X.say(n,pick(['*chirp*','is someone… vaping?','I sense mango','*BEEP*']),1.6)}}}
function bossUI(){if(X.mode!=='play'){if(!bar.hidden)bar.hidden=true;return}let best=null,bd=1e9;
  for(const k in BOSS){const n=BOSS[k].n;if(!n||n.boss.dead)continue;const d=Math.hypot(n.g.position.x-X.px,n.g.position.z-X.pz);if(d<bd){bd=d;best=n}}
  const show=!!best&&(bd<45||X.held===best);if(bar.hidden===show)bar.hidden=!show;if(!show)return;
  const b=best.boss,c=b.cfg,cr=best.crave!=null&&X.FLAV[best.crave]?X.FLAV[best.crave][2]:'';
  if(barN.textContent!==c.name)barN.textContent=c.name;
  bar.style.setProperty('--n',c.hp);barI.style.width=b.hp/c.hp*100+'%';}
function radarMark(){const cv=X.$('radar');if(!cv||X.mode!=='play')return;const rc=cv.getContext('2d'),h=104,sc=h/62,sn=Math.sin(X.yaw),cs=Math.cos(X.yaw);
  for(const k in BOSS){const n=BOSS[k].n;if(!n||n.boss.dead)continue;const dx=n.g.position.x-X.px,dz=n.g.position.z-X.pz;let x=(dx*cs-dz*sn)*sc,y=(dx*sn+dz*cs)*sc;const l=Math.hypot(x,y);if(l>h-12){x*=(h-12)/l;y*=(h-12)/l}
    rc.fillStyle='#ffd23c';rc.strokeStyle='#140f1c';rc.lineWidth=3;rc.beginPath();rc.arc(h+x,h+y,9,0,7);rc.fill();rc.stroke();rc.font='13px sans-serif';rc.textAlign='center';rc.textBaseline='middle';rc.fillText('👑',h+x,h+y+1)}}

/* ================= WIRING ================= */
X.on('grab',n=>{if(!n.boss)react(n,15,true)});
X.on('release',(n,kind,match)=>{if(n.boss&&!n.boss.dead)bossHit(n,kind,match);react(n,kind==='passive'?8:15,false)});
X.on('start',()=>{for(const k in BOSS)despawn(BOSS[k]);now=0;tn=0;congaBest=0;knock.x=knock.z=0;for(const n of npcs){n._cw=null;n._cj=0;n._pt=0;n._av=null}});
const clist=[];
X.on('frame',(dt,t)=>{now+=dt;fc++;if(cgN!==cols.length)buildCG();ngT-=dt;if(ngT<=0){ngT=.2;buildNG()}
  if(knock.x||knock.z){PV.x=X.px+knock.x*dt;PV.z=X.pz+knock.z*dt;X.collide(PV,.45);X.px=PV.x;X.pz=PV.z;const f=Math.max(0,1-6*dt);knock.x*=f;knock.z*=f;if(Math.abs(knock.x)+Math.abs(knock.z)<.2)knock.x=knock.z=0}
  const px=X.px,pz=X.pz;trail();clist.length=0;const held=X.held;
  for(let i=0;i<npcs.length;i++){const n=npcs[i],p=n.g.position,d=Math.hypot(p.x-px,p.z-pz);if(d>130){n._cj=0;continue}
    if(n.boss){if(!n.boss.dead){bossFrame(n,d,dt,t);continue}if(n.state!=='held')unTilt(n,dt)}
    if(n.state==='held'||n.state==='exhale'||n===held){n._cj=0;n._cw=null;n._av=null;continue}
    if(n.hooked&&d<(n._cj?55:30)&&clist.length<36){if(!n._cj)n._cj=now+i*1e-4;n._cw=null;clist.push(n);continue}
    n._cj=0;
    if(n._cw&&doGawk(n,dt,t))continue;
    steerPost(n,i,d,dt)}
  if(clist.length)conga(clist,dt,t);else congaN=0;
  if(fc%18===0)spread();
  bossCheckT-=dt;cardT-=dt;if(bossCheckT<0){bossCheckT=.5;if(cardT<=0)for(const k in BOSS){const c=BOSS[k];if(!c.spawned&&X.count<=c.at){spawnBoss(k);break}}}});
X.on('prerender',t=>{for(const n of npcs){n._ox=n.g.position.x;n._oz=n.g.position.z}
  const tt=performance.now()/1000;
  for(const k in BOSS){const c=BOSS[k],n=c.n;if(!n)continue;const p=n.g.position;if(c.beam&&c.beam.visible){c.beam.position.set(p.x,35,p.z);c.crown.position.set(p.x,p.y+n.hy+1.9+Math.sin(tt*3)*.15,p.z)}
    if(n.led)n.led.material.color.setHex(!n.boss.dead&&Math.sin(tt*(n.state==='held'?30:6))>0?0xff2020:0x401010)}
  bossUI();radarMark()});
X.on('win',()=>{bar.hidden=true});
X.crowds={BOSS,spawnBoss,react,get conga(){return congaN}};
})();
