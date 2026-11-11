/* crowds mod: the town reacts as a crowd, hooked fans form a conga line, NPCs steer around buildings,
   and the three acts each chapter turns on (La Diva, Gym Bro Prime, Detecto; spawned by js/story.js via TMV.crowds.spawnBoss): won over,
   not beaten up. Talks to the game only through window.TMV.
   Runs after the core think() each frame ('frame' event) and post-corrects positions/poses; positions are
   snapshotted in 'prerender' so a frozen or conga NPC can undo the core's movement for that frame. */
(()=>{const X=window.TMV;if(!X){console.warn('[crowds] window.TMV missing');return}
const {T,npcs,cols,scene,rand,pick,clamp,lerp}=X,PI=Math.PI,RMQ=matchMedia('(prefers-reduced-motion: reduce)');
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
const canGawk=o=>o.state==='wander'&&!o.hooked&&!o.boss&&!o._pin&&o!==X.held&&!o._cw&&!o._cj;
function gawk(o,x,z,dur,gen,src){o._cw={x,z,until:now+dur,gen,src,flee:!o.t.brave};o._pt=now}
// victim n is being vaped (staring=true on grab) or just got vaped (release)
function react(n,r,staring){const p=n.g.position;let sN=0,eN=0;
  for(const o of near(p.x,p.z,r,L1)){if(o===n||o.boss)continue;let fresh=false;
    if(o._cw&&o._cw.src===n){if(staring)continue;o._cw.until=Math.min(o._cw.until,now+rand(.15,.8))}
    else if(canGawk(o)){if(SKIT[o.type]&&!staring){o.state='flee';o.tm=rand(2,3.5);o._pt=now;o._pg=2;continue}gawk(o,p.x,p.z,staring?6:rand(.35,1.1),1,n);fresh=true}
    else continue;
    const m=X.mouth(o,V1),y=m.y+.55;
    if(staring){if(fresh&&eN<2){eN++;X.emo('👀',m.x,y,m.z,0,.6,0,.38)}if(fresh&&sN<1&&Math.random()<.5){sN++;X.say(o,pick(STARE),1.8)}}
    else{if(eN<3){eN++;X.emo(o.type==='cop'?'🚨':'❗',m.x,y,m.z,0,1.2,0,.5)}if(sN<2&&Math.random()<.6){sN++;X.say(o,pick(GASP[o.type]||GASP._),2)}
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
    gawk(o,p.x,p.z,rand(.25,.6),n._pg+1,null);if(eN<2){eN++;const m=X.mouth(o,V1);X.emo('❓',m.x,m.y+.5,m.z,0,1,0,.4)}if(Math.random()<.12)X.say(o,pick(WHAT),1.5)}}}

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
   The player's path is kept as a breadcrumb ring buffer (one point per 0.4m). Hooked followers are ordered by when they joined.
   Walking, each gets a spot further back along that path with a comfortable gap: the first stands ~2 m behind you plus its own
   radius (a cow or a big act further), each next one ~1.3-1.8 m behind the one ahead (more for big bodies); where your path doubles
   back, a spot that would land on an earlier one (or on you) is skipped. Standing still, they gather in a loose staggered arc behind
   you instead (rows of 2, 3, 4...), laid out once so turning to look at them doesn't shuffle them.
   They ease into their spots (fast catch-up when far behind, slowing down on arrival), steer round buildings, each other and you:
   walk back through the line and they step off your line instead of bumping into the lens. */
const TN=320,STEP=.4,TRx=new Float32Array(TN),TRz=new Float32Array(TN);let ti=0,tn=0,congaN=0,congaBest=0,chantT=4;
function trailPush(x,z){ti=(ti+1)%TN;TRx[ti]=x;TRz[ti]=z;if(tn<TN)tn++}
function trail(){const px=X.px,pz=X.pz;if(!tn){trailPush(px,pz);return}let lx=TRx[ti],lz=TRz[ti],dx=px-lx,dz=pz-lz,d=Math.hypot(dx,dz);
  if(d>25){tn=0;trailPush(px,pz);return}while(d>=STEP){lx+=dx/d*STEP;lz+=dz/d*STEP;trailPush(lx,lz);d-=STEP}}
// the player's own motion: smoothed velocity and how long you've stood still (a teleport is not a step)
const PL={x:0,z:0,vx:0,vz:0,sp:0,still:0,arc:false,ax:0,az:1,cx:0,cz:0,n:-1};
function playerMotion(dt){const jx=X.px-PL.x,jz=X.pz-PL.z,k=Math.min(1,dt*10);PL.x=X.px;PL.z=X.pz;
  if(Math.abs(jx)+Math.abs(jz)>3||dt<=0){PL.vx=PL.vz=0}else{PL.vx=lerp(PL.vx,jx/dt,k);PL.vz=lerp(PL.vz,jz/dt,k)}
  PL.sp=Math.hypot(PL.vx,PL.vz);PL.still=PL.sp<.5?PL.still+dt:0}
// a body's reach: its collision radius undersells long animals (a cow's nose sticks out ~1.5 m from its middle) and arms
const REACH={cow:1.6,dog:1.6,cat:1.6,pigeon:1.3,chicken:1.25,kid:1.5},reach=n=>n.reach||(n.reach=n.r*(REACH[n.type]||1.2));
const lead=n=>1.6+reach(n),gapF=(a,b)=>Math.max(1.35,reach(a)+reach(b)+.45);// you → first follower; follower → the one ahead (centre to centre)
function trailSlots(L){let k=0,ax=X.px,az=X.pz,i=0;
  for(;i<L.length;i++){const n=L[i],need=i?gapF(L[i-1],n):lead(n),pr=lead(n)-.3;let ok=false;
    for(;k<tn;k++){const j=(ti-k+TN)%TN,x=TRx[j],z=TRz[j];
      if((x-ax)**2+(z-az)**2<need*need||(x-X.px)**2+(z-X.pz)**2<pr*pr)continue;
      let cl=true;for(let m=0;m<i-1;m++){const o=L[m],q=reach(o)+reach(n)+.2;if((x-o._slx)**2+(z-o._slz)**2<q*q){cl=false;break}}
      if(!cl)continue;n._slx=x;n._slz=z;ax=x;az=z;ok=true;break}
    if(!ok)break}
  // trail too short (just started, or after a teleport): the rest line up straight on behind, a little staggered
  if(i<L.length){let ex=ax-X.px,ez=az-X.pz,el=Math.hypot(ex,ez);if(el<.5){ex=Math.sin(X.yaw);ez=Math.cos(X.yaw);el=1}ex/=el;ez/=el;
    for(;i<L.length;i++){const n=L[i],need=i?gapF(L[i-1],n):lead(n),sd=i%2?.4:-.4;ax+=ex*need;az+=ez*need;n._slx=ax-ez*sd;n._slz=az+ex*sd}}}
const AR=[];
function arcSlots(L){const bx=PL.ax,bz=PL.az,qx=-bz,qz=bx,lat=n=>(n.g.position.x-X.px)*qx+(n.g.position.z-X.pz)*qz;PL.cx=X.px;PL.cz=X.pz;PL.n=L.length;
  let i=0,row=0,R=0,pm=0;
  while(i<L.length){const m=Math.min(row+2,L.length-i);let rm=0;AR.length=0;for(let j=0;j<m;j++){const n=L[i+j];rm=Math.max(rm,reach(n));AR.push(n)}
    R=row?R+Math.max(1.35,pm+rm+.45):1.6+rm;const s=Math.max(1.3,2*rm+.4);AR.sort((a,b)=>lat(a)-lat(b));// left stays left: nobody crosses over
    for(let j=0;j<m;j++){const a=(j-(m-1)/2)*s/R,c=Math.cos(a),sn=Math.sin(a),n=AR[j];TMP.x=X.px+(bx*c+qx*sn)*R;TMP.z=X.pz+(bz*c+qz*sn)*R;X.collide(TMP,n.r);n._slx=TMP.x;n._slz=TMP.z}
    pm=rm;i+=m;row++}}
// walk n toward its spot (sx,sz); returns its speed. Shared by the conga and the door queue.
const NB=[];let FOL=[];
function follow(n,sx,sz,dt){const p=n.g.position;let dx=sx-p.x,dz=sz-p.z,vx=0,vz=0;const d=Math.hypot(dx,dz),ux=p.x-X.px,uz=p.z-X.pz,du=Math.hypot(ux,uz)||1e-3,C=reach(n)+1.2;let kv=9;
  if(d>.08){// stragglers scurry to catch up (up to sprint speed), then slow down into their spot
    const sp=Math.min(d*2.4,Math.max(4.6,n.t.speed*(d>5?1.35:1),d>3?Math.min(12.5,4+d*.75):0));dx/=d;dz/=d;const f=n.r+1.2,c=boxAt(p.x+dx*f,p.z+dz*f,n.r+.1);
    if(c){const tg=avoid(n,c,p,dx,dz);dx=dx*.3+tg[0];dz=dz*.3+tg[1];const l=Math.hypot(dx,dz);dx/=l;dz/=l}
    // never straight through you: if the way to the spot runs at you, curve round you on the spot's side
    if(du<C+2.5){const at=-(ux*dx+uz*dz)/du;if(at>0){let tx=-uz/du,tz=ux/du;if(tx*(sx-X.px)+tz*(sz-X.pz)<0){tx=-tx;tz=-tz}const w=clamp((C+2.5-du)/2,0,1)*at*2;dx+=tx*w;dz+=tz*w;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l}}
    vx=dx*sp;vz=dz*sp}
  // personal space: nobody stands in your face, and when you walk at them they step off your line, to the side they're already on
  if(du<C){const k=(C-du)/C*7;vx+=ux/du*k;vz+=uz/du*k}
  if(PL.sp>1){// you're walking at them: look ahead along your heading and clear the corridor, to the side they're already on
    const hx=PL.vx/PL.sp,hz=PL.vz/PL.sp,al=ux*hx+uz*hz,la=ux*hz-uz*hx,W=C+.4,ahead=C+PL.sp*.8;
    if(al>-.3&&al<ahead&&Math.abs(la)<W){const sd=la>=0?1:-1,u=clamp(1-(al-C)/(ahead-C),.35,1),w=PL.sp*1.4*u*(1-Math.abs(la)/W)+1.5;vx+=hz*sd*w;vz+=-hx*sd*w;kv=16}}
  // and not in each other: a soft push apart before the core's hard separation pass has to step in
  const rep=o=>{if(o===n||o===X.held||!o.g.parent)return;const q=o.g.position,ox=p.x-q.x,oz=p.z-q.z,want=Math.max(n.r+o.r+.35,(reach(n)+reach(o))*.8);if(Math.abs(ox)>want||Math.abs(oz)>want)return;const dd=Math.hypot(ox,oz);if(dd>=want)return;
    const k=(want-dd)/want*4.5;if(dd<1e-3){vx+=k;return}vx+=ox/dd*k;vz+=oz/dd*k};
  for(const o of FOL)rep(o);for(const o of near(p.x,p.z,n.r+2.2,NB))if(!o._cj&&!o._in)rep(o);
  const k=Math.min(1,dt*kv);n._vx=lerp(n._vx||0,vx,k);n._vz=lerp(n._vz||0,vz,k);let v=Math.hypot(n._vx,n._vz);if(v>13){n._vx*=13/v;n._vz*=13/v;v=13}
  if(v>.05){p.x+=n._vx*dt;p.z+=n._vz*dt;X.collide(p,n.r);n.ph+=v*dt*3.2}
  return v}
const CHANT=['CON-GA!','da da da da da da da HEY','*conga noises*','one more puff ✨','LEFT FOOT, VAPE FOOT','we follow the cloud','🎶 vape vape vape 🎶'];
function conga(list,dt,t){list.sort((a,b)=>a._cj-b._cj);const n0=list.length,arc=PL.still>.6;
  if(arc){if(!PL.arc||PL.n!==n0||Math.hypot(X.px-PL.cx,X.pz-PL.cz)>.8){// gather behind you, on the side you came from
      if(!PL.arc||Math.hypot(X.px-PL.cx,X.pz-PL.cz)>.8){PL.ax=Math.sin(X.yaw);PL.az=Math.cos(X.yaw);for(let k=0;k<tn;k++){const j=(ti-k+TN)%TN,dx=TRx[j]-X.px,dz=TRz[j]-X.pz,d=Math.hypot(dx,dz);if(d>2.5){PL.ax=dx/d;PL.az=dz/d;break}}}
      arcSlots(list)}}
  else trailSlots(list);
  PL.arc=arc;let prev=null;
  for(let i=0;i<n0;i++){const n=list[i],p=n.g.position;back(n);const sx=n._slx,sz=n._slz;
    // a carried customer (n._carry, set by story.js) never drops out: one left far behind its spot pops back in there
    if(n._carry&&Math.hypot(sx-p.x,sz-p.z)>40){p.x=sx;p.z=sz;X.collide(p,n.r);n._ox=p.x;n._oz=p.z;n._vx=n._vz=0}
    const v=follow(n,sx,sz,dt);
    if(v>2.5)turn(n,p.x+n._vx,p.z+n._vz,dt*8);else if(prev&&!arc)turn(n,prev.g.position.x,prev.g.position.z,dt*6);else turn(n,X.px,X.pz,dt*6);
    if(!n.t.lift)p.y=Math.abs(Math.sin(t*7-i*.7))*.13;pose(n,v>.3?1:0,n.A&&n.A.length?2:0,0,t,dt);prev=n}
  if(n0>congaBest)congaBest=n0;congaN=n0;
  chantT-=dt;if(chantT<0&&n0>=3){chantT=rand(3,6);X.say(pick(list),pick(CHANT),1.8)}}

/* ================= WALK-IN (story.js delivers customers into Cloud Kingz) =================
   walkIn(n, [[x,z],...], done): n leaves the conga and joins a single-file queue that starts at path[0] and runs off along the shop
   front, on the side away from you, each spaced by its own size. The head of the queue walks the rest of the path once the doorway is
   clear (no collision on that leg so it can squeeze past Sal), squashes flat in a few held frames and is taken out of the world;
   done(n) fires then. n.cool stays high meanwhile so nobody can grab it on the way in. */
const gone=[],WQ=[],WD={x:1,z:0};
function walkIn(n,path,done){if(!n||!n.g||n._in||!path||!path.length)return false;
  if(!WQ.length){const a=path[0],b=path[path.length-1];let ix=b[0]-a[0],iz=b[1]-a[1],il=Math.hypot(ix,iz);if(il<.01){ix=0;iz=1;il=1}ix/=il;iz/=il;
    let lx=iz,lz=-ix;if(lx*(a[0]-X.px)+lz*(a[1]-X.pz)<0){lx=-lx;lz=-lz}// along the shop front, away from you, angled a little out from the wall
    WD.x=lx*.95-ix*.3;WD.z=lz*.95-iz*.3;const l=Math.hypot(WD.x,WD.z);WD.x/=l;WD.z/=l}
  n._in={path,i:0,st:0,sq:-1,done,s0:null,r0:n.r,t:0,k:0};n.state='wander';n.cool=99;n._cj=0;n._cw=null;n._av=null;WQ.push(n);return true}
function removeNpc(n){scene.remove(n.g);if(n.cb)scene.remove(n.cb);const i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1)}
// once a frame: give everyone in the queue a spot; the head goes in when nobody is in the doorway
function queuePlan(){for(let i=WQ.length-1;i>=0;i--)if(!WQ[i]._in||npcs.indexOf(WQ[i])<0)WQ.splice(i,1);if(!WQ.length)return;
  let busy=false,dw=null;for(const n of WQ){const w=n._in;if(w.st!==1)continue;if(w.sq<.32)busy=true;if(!dw||w.sq<0)dw=n}
  let k=0,ax=0,az=0,pr=null;
  for(const n of WQ){const w=n._in;if(w.st)continue;
    if(!k){ax=w.path[0][0];az=w.path[0][1];// the next one waits a body-length back while someone is still on the way in
      if(dw){const c=n.r+dw._in.r0+.3,dd=Math.hypot(dw.g.position.x-ax,dw.g.position.z-az);if(dd<c){ax+=WD.x*(c-dd);az+=WD.z*(c-dd)}}}
    else{const g=Math.max(1.25,pr.r+n.r+.45);ax+=WD.x*g;az+=WD.z*g}
    TMP.x=ax;TMP.z=az;X.collide(TMP,n.r);w.qx=TMP.x;w.qz=TMP.z;w.k=k;
    if(!k&&!busy&&Math.hypot(n.g.position.x-w.qx,n.g.position.z-w.qz)<.7){w.st=1;w.i=Math.min(1,w.path.length-1);w.t=0;n._vx=n._vz=0;busy=true;dw=n;continue}
    pr=n;k++}}
function walkStep(n,dt,t){const w=n._in,p=n.g.position;back(n);n.cool=99;
  if(w.sq>=0){// squeeze through the door: squash on held frames (5 steps), sliding into the doorway
    w.sq+=dt;const f=Math.min(5,Math.floor(w.sq/.42*5))/5,s=w.s0;n.g.scale.set(s.x*(1+.42*f),s.y*(1-.62*f),s.z*(1-.35*f));
    p.x=w.ex;p.z=w.ez+.2*f;p.y=0;pose(n,0,n.A&&n.A.length?2:0,0,t,dt);if(w.sq>=.42&&gone.indexOf(n)<0)gone.push(n);return}
  w.t+=dt;
  if(!w.st){// queueing: walk to your place in the line (stragglers hurry), wait your turn facing the door
    if(w.qx===undefined){w.qx=w.path[0][0];w.qz=w.path[0][1]}
    if(w.t>10+w.k*1.5&&Math.hypot(w.qx-p.x,w.qz-p.z)>1.5){p.x=w.qx;p.z=w.qz;n._vx=n._vz=0;w.t=0}// wedged somewhere: pop into line
    const v=follow(n,w.qx,w.qz,dt),e=w.path[w.path.length-1];
    if(v>1.5)turn(n,p.x+n._vx,p.z+n._vz,dt*10);else turn(n,e[0],e[1],dt*6);
    if(!n.t.lift)p.y=v>.3?Math.abs(Math.sin(t*9))*.12:0;pose(n,v>.3?1:0,n.A&&n.A.length?2:0,0,t,dt);return}
  for(const o of WQ)if(o!==n&&o._in&&o._in.sq>=0&&Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z)<w.r0+o._in.r0+.1){pose(n,0,n.A&&n.A.length?2:0,0,t,dt);return}// the one ahead is still squeezing in
  if(w.t>3){w.i=w.path.length-1;const e=w.path[w.i];p.x=e[0];p.z=e[1]}// wedged in the doorway: in you go
  const q=w.path[w.i],last=w.i===w.path.length-1;let dx=q[0]-p.x,dz=q[1]-p.z;const d=Math.hypot(dx,dz);
  if(d<.3){if(!last){w.i++;return}w.sq=0;w.s0=n.g.scale.clone();w.ex=q[0];w.ez=q[1];turn(n,q[0],q[1]+5,1);
    n.r=n.reach=.05;return}// squeezing past Sal: the core's unclip() mustn't shove it back out of the doorway
  const sp=Math.min(d*4+.5,Math.max(3.4,n.t.speed*1.15));dx/=d;dz/=d;
  if(!last){const r=w.r0||.5,c=boxAt(p.x+dx*(r+1),p.z+dz*(r+1),r+.1);if(c){const tg=avoid(n,c,p,dx,dz);dx=dx*.3+tg[0];dz=dz*.3+tg[1];const l=Math.hypot(dx,dz);dx/=l;dz/=l}}
  p.x+=dx*sp*dt;p.z+=dz*sp*dt;if(!last)X.collide(p,w.r0||.5);n.ph+=sp*dt*3.2;turn(n,q[0],q[1],dt*10);
  if(!n.t.lift)p.y=Math.abs(Math.sin(t*9))*.12;pose(n,1,n.A&&n.A.length?2:0,0,t,dt)}

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

// builders: the core human() clay puppet (the same lathed torso, capsule limbs, bead eyes and mitten hands as the townsfolk),
// dressed with the smooth clay kit (X.mk: 'S' sphere, 'C' tube, 'R' ring, 'Q' half ring, 'K' cone, 'B' rounded box). No ink hulls.
const gold=0xffd23c,whiteC=new T.Color(1,1,1);
const mk=(g)=>(p,w,h,d,c,x,y,z)=>X.mk(g,p,w,h,d,c,x||0,y||0,z||0);
const S_=mk('S'),C_=mk('C'),R_=mk('R'),Q_=mk('Q'),K_=mk('K'),B_=mk('B');
// La Diva's lace fan: cream card with a pricked lace pattern
const laceT=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const k=c.getContext('2d');k.fillStyle='#fbf1e4';k.fillRect(0,0,64,64);k.lineWidth=1.2;
  for(let y=4;y<64;y+=10)for(let x=(Math.round(y/10)%2)*6;x<70;x+=12){k.strokeStyle='rgba(150,110,90,.55)';k.beginPath();k.arc(x,y,3.2,0,7);k.stroke();k.fillStyle='rgba(160,120,100,.4)';k.beginPath();k.arc(x,y,1.2,0,7);k.fill()}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);return t})();
const laceM=new T.MeshToonMaterial({map:laceT,color:0xffffff,side:T.DoubleSide});laceM.userData.clayKind='cloth';
const FANG=new T.CylinderGeometry(.36,.36,.016,18,1,false,-1.05,2.1);
// ball gown: a lathed bell from the waist to the floor (points bottom to top)
const GOWNG=new T.LatheGeometry([[.6,0],[.635,.045],[.61,.12],[.53,.3],[.44,.5],[.36,.68],[.3,.82],[.27,.93],[.001,.96]].map(q=>new T.Vector2(q[0],q[1])),28);
const BUILD={
 // La Diva Lungarotti, as in the clips: claymation soprano, tall blonde updo with a small silver tiara, pearl necklace and earrings,
 // crimson gown with puffed short sleeves, a gold sweetheart trim and a gold hem, a lace fan in her left hand
 diva:()=>{const CR=0xb3203a,GO=0xe2b347,BL=0xf7dc5c,BLD=0xe6bd45,SK=0xf6d2b8,PE=0xf8f3ea,SI=0xdfe3ea;
  const b=X.human({w:.56,depth:.4,head:.47,skirt:1,dress:1,pants:CR,shirt:CR,sleeve:CR,short:1,arm:.1,skin:SK,hair:'top',hairC:BL,browC:0x9a6a34,shoeS:'dress',shoe:0x6a1020,
   eye:{lid:0x3a2016,cheekC:0xf2b3a4},extra:(U,H,A)=>{const d=H.d;
    // the updo: a big bun on top, a second tier and a sculpted ring of hair, face-framing curls
    S_(H.h,d*1.02,d*.86,d*.96,BL,0,d*.6,-d*.08);S_(H.h,d*.74,d*.62,d*.72,BL,0,d*.97,-d*.1);const rg=R_(H.h,d*.66,d*.66,d*.5,BLD,0,d*1.0,-d*.1);rg.rotation.x=PI/2;
    S_(H.h,d*.34,d*.3,d*.34,BL,0,d*1.27,-d*.1);for(const s of[-1,1])S_(H.h,d*.17,d*.42,d*.17,BL,s*d*.5,-d*.06,d*.12);
    // small silver tiara with five points and a blue stone
    const ti=Q_(H.h,d*.82,d*.5,d*.3,SI,0,d*.52,d*.2);ti.rotation.x=-.45;
    for(let i=-2;i<=2;i++){const k=Math.abs(i);K_(H.h,d*.08,d*(.24-k*.05),d*.08,SI,i*d*.15,d*(.8-k*.04),d*(.36-k*.07))}S_(H.h,d*.09,d*.09,d*.06,0x8fcfff,0,d*.72,d*.42);
    // pearl earrings, red lips round the mouth (it opens into an O when she sings)
    for(const s of[-1,1])S_(H.h,d*.11,d*.11,d*.11,PE,s*d*.52,-d*.25,d*.02);R_(H.h,d*.3,d*.24,d*.22,0xc8203c,0,-d*.26,d*.44);
    // scooped neckline: skin at the collarbone, a gold sweetheart trim, a pearl necklace
    S_(U,.27,.16,.08,SK,0,1.37,.16);const tr=Q_(U,.34,.2,.24,GO,0,1.33,.18);tr.rotation.set(-.3,0,PI);
    for(let i=-5;i<=5;i++){const a=i*.26;S_(U,.05,.05,.05,PE,Math.sin(a)*.16,1.44-Math.cos(a*.9)*.05+.02,Math.cos(a)*.15+.03)}
    // puffed short sleeves
    for(const a of A)S_(a,.3,.25,.3,CR,0,-.03,0);
    // folded lace fan, half open, held up in the left hand
    if(A[1]&&A[1].h){const f=new T.Group();f.position.set(0,-.2,.06);f.rotation.set(PI/2,0,.5);A[1].h.add(f);const w=new T.Mesh(FANG,laceM);f.add(w);
      for(let i=0;i<8;i++){const a=-1.05+i*.3,r=B_(f,.018,.02,.34,0xf3e2c8,Math.sin(a)*.17,.012,Math.cos(a)*.17);r.rotation.y=a}S_(f,.06,.05,.06,GO,0,.01,0)}}});
  // the gown sits on the body root; gold hem band with a row of scallops
  const gw=new T.Mesh(GOWNG,X.M(CR));b.g.add(gw);C_(b.g,1.29,.12,1.29,GO,0,.06,0);
  for(let i=0;i<22;i++){const a=i/22*PI*2;S_(b.g,.11,.07,.05,GO,Math.sin(a)*.615,.15,Math.cos(a)*.615).rotation.y=a}
  b.g.scale.setScalar(1.3);b.r=.5;return b},
 prime:()=>{const b=X.BUILD.gym();const H=b.H,d=H.d;
   // wraparound shades, a gold crown, and the gold chain he hands over (b.chain)
   B_(H.h,d*.98,d*.2,d*.12,0x15151a,0,d*.08,d*.5);for(const s of[-1,1])S_(H.h,d*.36,d*.22,d*.08,0x3c8cff,s*d*.22,d*.08,d*.55);
   C_(H.h,d*1.12,d*.16,d*1.12,gold,0,d*.55,0);for(let i=0;i<5;i++){const a=(i-2)*.55;K_(H.h,d*.18,d*.32,d*.18,gold,Math.sin(a)*d*.5,d*.78,Math.cos(a)*d*.5)}
   const ch=new T.Group();(b.U||b.g).add(ch);for(let i=-4;i<=4;i++){const l=R_(ch,.11,.11,.26,gold,i*.075,1.43-Math.abs(i)*.034-i*i*.002,.25-i*i*.004);l.rotation.y=i%2?PI/2:0}
   const md=C_(ch,.15,.04,.15,gold,0,1.22,.27);md.rotation.x=PI/2;b.chain=ch;b.g.scale.setScalar(1.8);b.r=.6;return b},
 detecto:()=>{const b=X.human({w:.9,depth:.6,head:.9,pants:0xf2f2f2,shirt:0xf2f2f2,sleeve:0xf2f2f2,arm:.2,skin:0xf7e7d0,hair:'bald',shoe:0xe0244a,extra:(U,H,A,b)=>{const d=H.d;
    C_(H.h,d*1.5,d*.28,d*1.5,0xf7f7f7,0,d*.52,0);C_(H.h,d*1.2,d*.1,d*1.2,0xd8d8de,0,d*.68,0);for(let i=0;i<8;i++){const a=i/8*PI*2;B_(H.h,d*.04,d*.05,d*.3,0x8a8a92,Math.cos(a)*d*.38,d*.73,Math.sin(a)*d*.38).rotation.y=-a}
    b.led=S_(H.h,d*.16,d*.16,d*.16,new T.MeshBasicMaterial({color:0xff2020}),d*.32,d*.74,d*.32);
    B_(U,.12,.75,.05,0xe0244a,0,1.15,.31).rotation.z=.6;for(const a of A)if(a.k)S_(a.k,.42,.42,.42,0xffffff,0,-.38,0)}});b.g.scale.setScalar(2.15);b.r=.7;return b}};
const TYPES={
 diva:{name:'opera diva',cap:3.4,rate:24,speed:2.2,cloud:3.4,hook:1e9,brave:1,stay:1,say:['LA LA LAAAAA'],want:['encore. ENCORE.']},
 prime:{name:'Gym Bro Prime',cap:4.2,rate:30,speed:3.2,cloud:4,hook:1e9,brave:1,stay:1,say:['THAT WAS A WARMUP SET','MY LUNGS HAVE LUNGS'],want:['SPOT ME, KING']},
 detecto:{name:'Detecto the mascot',cap:3.8,rate:34,speed:3.2,cloud:3.8,hook:1e9,brave:1,roam:1,say:['*BEEP BEEP BEEP*','SMOKE DETECTED. IT IS ME. I AM THE SMOKE.'],want:['*hopeful chirp*']}};
for(const k in BUILD){X.BUILD[k]=BUILD[k];X.TYPES[k]=TYPES[k]}
const knock={x:0,z:0},PV={x:0,z:0};
function shove(n,sp,st){const p=n.g.position,dx=X.px-p.x,dz=X.pz-p.z,d=Math.hypot(dx,dz)||1;knock.x=dx/d*sp;knock.z=dz/d*sp;X.stun=Math.max(X.stun,st)}
// voice lines go through the story player (ducking, mute); held back while Sal is on the phone
function line(n,wait){if(!n)return;const t0=performance.now(),go=()=>{const S=X.story;if(!S||!S.line)return;if(S.busy&&performance.now()-t0<(wait||12000)){setTimeout(go,600);return}S.line(n)};go()}
/* None of the three are villains you vape into submission (storyboard decisions):
   - La Diva (ch2) is a captive-audience problem: nobody walks out on an aria, so the park's grandmas are pinned to the benches (story.js).
     ONE puff timed to the top of her phrase (released in the lung meter's green; her note climbs with your inhale) turns her high C into a
     chain of cloud rings. She finishes in triumph, the grandmas are free to follow you, and she tags along as your hype-woman.
     A flat note just makes her laugh and carry on: no shove, no penalty.
   - Gym Bro Prime (ch3) runs a three-rep lung set: match his cloud in the green three times. Overdo it and he spots you back a step.
     On the third rep he bows and hands over his gold chain; his bros follow you.
   - Detecto (ch5) keeps the role (detecting smoke is his job) but not the beating: his alarm pulse clears the square; fill his sensor three
     times (good rips) and he chirps himself to sleep. goal = reps / fills; hp counts what's left. */
const BOSS={
 diva:{chapter:2,x:-90,z:29.4,goal:1,mode:'duet',reward:350,drops:['boost','chain'],emo:'🎶',col:0xc2253a,name:'LA DIVA LUNGAROTTI',noBar:1,vo:{won:'diva_won',again:'diva_again'}},
 prime:{chapter:3,x:0,z:-82,goal:3,mode:'set',reward:500,drops:['rush','dual','boost'],emo:'💪',col:0xe02a2a,name:'GYM BRO PRIME',vo:{intro:'prime_intro',won:'prime_won'}},
 detecto:{chapter:5,x:3,z:-11,goal:3,mode:'sensor',reward:700,drops:['free','fog','boost'],emo:'🚨',col:0xf2f2f2,name:'DETECTO',vo:{intro:'detecto_intro',won:'detecto_sleep'}}};
function spawnBoss(key){const c=BOSS[key];if(!c)return null;if(c.n)return c.n;TMP.x=c.x;TMP.z=c.z;if(cgN!==cols.length)buildCG();X.collide(TMP,1.3);
  X.spawn(key,TMP.x,TMP.z);const n=npcs[npcs.length-1];if(!n||n.type!==key)return null;n.t=Object.assign({},n.t);
  n.boss={cfg:c,key,hp:c.goal,dead:0,met:0,sing:2,blow:3,pulse:5,hum:0,hx:TMP.x,hz:TMP.z};n.g.rotation.order='YXZ';n._tilt=0;n._bend=0;n.hooked=false;n.cool=0;n.fem=key==='diva';n.vp=key==='diva'?1.25:key==='prime'?.8:1.05;n.emo=c.emo;
  if(key==='diva')n.g.rotation.y=PI;// facing the benches
  n._ox=TMP.x;n._oz=TMP.z;if(X.setCrave)X.setCrave(n);
  if(false&&!c.noBar)c.beam=X.cyl(/* no translucent light column over bosses (user: no beacons) */scene,1.6,70,1.6,new T.MeshBasicMaterial({color:c.col,transparent:true,opacity:.15,depthWrite:false}),TMP.x,35,TMP.z);
  c.crown=new T.Sprite(new T.SpriteMaterial({map:X.emoTex(key==='diva'?'🎶':'👑'),transparent:true,depthWrite:false,fog:false}));c.crown.scale.set(1.1,1.1,1);scene.add(c.crown);
  c.n=n;c.spawned=1;showCard('',c.name);fanfare();X.emit('boss',n,'spawn');return n}
function despawn(c){const n=c.n;if(n){scene.remove(n.g);if(n.cb)scene.remove(n.cb);const i=npcs.indexOf(n);if(i>=0)npcs.splice(i,1);if(n.boss&&n.boss.toss)scene.remove(n.boss.toss.g)}if(c.beam)scene.remove(c.beam);if(c.crown)scene.remove(c.crown);c.n=c.beam=c.crown=null;c.spawned=0}
// a wider sweet spot for the big lungs: an early release from SWEET of the lungful already counts
const SWEET=.55;
function bossHit(n,kind){const b=n.boss,c=b.cfg;n.times=0;if(kind==='passive')return;
  const fq=n.inh/(n.t.cap||1),good=kind==='perfect'||(kind==='ok'&&fq>=SWEET);
  bar.classList.remove('hit');void bar.offsetWidth;bar.classList.add('hit');
  if(c.mode==='duet'){if(good){b.hp=0;defeat(n);return}
    if(now-(b.againT==null?-99:b.againT)>9){b.againT=now;line(c.vo.again,4000)}[784,740,698].forEach((f,i)=>X.beep(f,.16,'triangle',.025,i*.12));return}
  if(c.mode==='set'){if(good){b.hp--;repFx(n);if(b.hp<=0){defeat(n);return}b.blow=1.6;return}
    if(kind==='over'){shove(n,7,.2);X.beep(70,.35,'sawtooth',.05)}// a spotter's push, not a punch
    return}
  if(good){b.hp--;sneeze(n);if(b.hp<=0)defeat(n);return}
  if(kind==='over')pulse(n)}
// Prime's rep: plate clank, the ring of bros chants
function repFx(n){X.beep(98,.25,'sawtooth',.06);X.beep(65,.4,'sawtooth',.06,.1);for(let i=0;i<3;i++){X.beep(150,.12,'sawtooth',.04,.35+i*.32);X.beep(190,.12,'sawtooth',.03,.5+i*.32)}}// (no icons: he's right in front of you)
// Detecto's sensor fills: a sneeze-beep and a cough of smoke out of his head
function sneeze(n){X.slide(700,1700,.3,'square',.03);for(let i=0;i<3;i++)X.beep(2600+i*300,.07,'square',.035,.38+i*.09);n.H.h.getWorldPosition(V1);
  for(let i=0;i<22;i++){const a=i/22*PI*2;X.puff(V1.x,V1.y+.6,V1.z,Math.cos(a)*3,rand(1,3),Math.sin(a)*3,whiteC,rand(1.2,2),.3,1.1)}}
// his alarm pulse: everyone near him scatters for a few seconds (hooked customers too)
function pulse(n){const p=n.g.position;for(let i=0;i<6;i++)X.beep(3100,.09,'square',.04,i*.15);n.boss.pulseFx=.6;
  for(const o of near(p.x,p.z,17,L1)){if(o.boss||o._pin||o._in||o===X.held)continue;o._scat=now+rand(2.2,3.2);o._sx=p.x;o._sz=p.z;o._cw=null}}
function defeat(n){const b=n.boss,c=b.cfg,p=n.g.position;if(b.dead)return;b.dead=1;b.hp=0;b.wonT=now;n.cool=1e9;// won over: not vaped again
  if(c.beam)c.beam.visible=false;if(c.crown)c.crown.visible=false;
  if(c.mode==='duet'){n.hooked=true;for(const wm of n.H.Wh||[])wm.material=X.M(0xffc4c4);b.rings=6;b.ringT=.15;b.sing=4}
  if(c.mode==='set'&&n.chain){// the chain comes off his neck and is tossed to you
    n.chain.updateMatrixWorld(true);const g=n.chain.clone();n.chain.getWorldPosition(V1);g.position.copy(V1);g.quaternion.copy(n.g.quaternion);g.scale.setScalar(n.g.scale.x);n.chain.visible=false;scene.add(g);b.toss={g,t:0,x:V1.x,y:V1.y,z:V1.z}}
  line(c.vo.won,6000);
  if(!X.clip('sfx/fanfare',{vol:.6}))[523,659,784,1046].forEach((f,i)=>X.beep(f,.3,'triangle',.05,i*.1));
  // no burst of icons: you're face to face with the boss when this lands
  c.drops.forEach((k,i)=>{const a=i/c.drops.length*PI*2+.4;X.spawnPick(k,p.x+Math.cos(a)*3.5,p.z+Math.sin(a)*3.5)});
  X.combo+=5;X.drain(c.reward);X.emit('boss',n,'defeat')}
// her high C: big cotton rings rolling out of her mouth toward you and up over the gazebo
function bigRing(n,i){const m=X.mouth(n,V1),ry=n.g.rotation.y,fx=Math.sin(ry),fz=Math.cos(ry),R=.32+i*.07,up=.9+i*.35;
  for(let j=0;j<16;j++){const a=j/16*PI*2,ox=fz*Math.cos(a),oy=Math.sin(a),oz=-fx*Math.cos(a);X.puff(m.x+ox*R,m.y+.1+oy*R,m.z+oz*R,fx*3+ox*1.1,up+oy*1.1,fz*3+oz*1.1,whiteC,3.2,.34,.95)}
  X.beep(1046*(1+i*.02),.25,'triangle',.03)}
function aria(n,d,v){const m=X.mouth(n,V1);X.emo(pick(['🎵','🎶']),m.x,m.y+.3,m.z,rand(-.6,.6),1.2,rand(-.6,.6),.55);if(d<24)[523,659,784,659,1046].forEach((f,i)=>X.beep(f*(1+Math.random()*.02),.3,'triangle',.018*(v||1)*(1-d/26),i*.28))}
// a giant can't shrink to vape height: bend at the waist, then bow the whole body until the mouth is at eye level
function bossHeld(n,dt){const p=n.g.position,g=n.g,b=n.boss;X.armR.tip.getWorldPosition(V1);if(n.inh>n.t.cap)n.inh=Math.max(n.t.cap,n.inh-dt*.45);
  n._bend=lerp(n._bend,.75,Math.min(1,dt*6));if(n.P)n.P.rotation.x=n._bend;p.y=0;g.rotation.x=0;g.updateMatrixWorld(true);n.H.m.getWorldPosition(V2);
  const fx=Math.sin(g.rotation.y),fz=Math.cos(g.rotation.y),h=V2.y-p.y,f=(V2.x-p.x)*fx+(V2.z-p.z)*fz,R=Math.hypot(h,f)||1,a=clamp(Math.acos(clamp(Math.min(V1.y,1.7)/R,-1,1))-Math.atan2(f,h),0,1.25);
  n._tilt=lerp(n._tilt,a,Math.min(1,dt*8));g.rotation.x=n._tilt;g.updateMatrixWorld(true);n.H.m.getWorldPosition(V2);
  p.x+=V1.x-V2.x;p.z+=V1.z-V2.z;p.y+=clamp(V1.y-V2.y,-.5,0);
  if(n._hy0===undefined){n._hy0=n.hy;n._hz0=n.hz}n.hy=Math.min(V1.y,1.7)-p.y;n.hz=Math.max(.2,(V1.x-p.x)*fx+(V1.z-p.z)*fz);
  // the duet: her note climbs with your inhale and tops out at high C right in the green
  if(b.key==='diva'){b.hum-=dt;if(b.hum<0){b.hum=.2;const fq=clamp(n.inh/n.t.cap,0,1.25);X.beep(392*Math.pow(2,fq*1.4),.22,'triangle',.032)}}
}
function unTilt(n,dt){if(n._hy0!==undefined){const k=Math.min(1,dt*6);n.hy=lerp(n.hy,n._hy0,k);n.hz=lerp(n.hz,n._hz0,k)}if(n._tilt>.001){n._tilt=lerp(n._tilt,0,Math.min(1,dt*6));n.g.rotation.x=n._tilt}n._bend=lerp(n._bend||0,0,Math.min(1,dt*6))}
// hold a boss on its spot (the core's wander would walk it off)
function home(n,dt){const b=n.boss,p=n.g.position;back(n);p.x=lerp(p.x,b.hx,Math.min(1,dt*3));p.z=lerp(p.z,b.hz,Math.min(1,dt*3));n.state='wander';n.tx=b.hx;n.tz=b.hz}
function bossFrame(n,d,dt,t){const b=n.boss,c=b.cfg,p=n.g.position;
  if(n.state==='flee'){n.state='wander';n.cool=Math.min(n.cool,1.6)}n.hooked=false;n.times=0;
  if(!b.met&&d<18&&n.state==='wander'){b.met=1;if(c.vo.intro)line(c.vo.intro)}
  if(n.state==='held'){bossHeld(n,dt);return}
  unTilt(n,dt);if(n.state!=='wander')return;
  const k=Math.min(1,dt*8);if(b.key!=='detecto')home(n,dt);
  if(d<26)turn(n,X.px,X.pz,dt*3);else if(b.key==='diva')turn(n,b.hx,b.hz-10,dt*2);
  if(isHuman(n)){const A=n.A;if(b.key==='prime'){// double-bicep flex while waiting; every few seconds he blows the cloud you have to match
      for(let i=0;i<2;i++){const s=i?1:-1;A[i].rotation.x=lerp(A[i].rotation.x,0,k);A[i].rotation.z=lerp(A[i].rotation.z,s*1.5,k);A[i].k.rotation.x=lerp(A[i].k.rotation.x,-1.9-Math.sin(t*4)*.2,k)}
      b.blow-=dt;if(b.blow<0&&d<18){b.blow=rand(4,5.5);const m=X.mouth(n,V1),ry=n.g.rotation.y;for(let i=0;i<34;i++){const sp=rand(2,5.5);X.puff(m.x,m.y,m.z,Math.sin(ry)*sp+rand(-.9,.9),rand(.6,2.4),Math.cos(ry)*sp+rand(-.9,.9),whiteC,rand(2.4,4),.3,rand(1.8,3.2))}
        if(!X.clip('sfx/exhale_1',{vol:.6}))X.slide(220,90,.8,'sawtooth',.04);X.beep(150,.12,'sawtooth',.035,.6);X.beep(190,.12,'sawtooth',.03,.75)}}
    else if(b.key==='diva'){for(let i=0;i<2;i++){const s=i?1:-1;A[i].rotation.x=lerp(A[i].rotation.x,-.9,k);A[i].rotation.z=lerp(A[i].rotation.z,s*(1+Math.sin(t*1.5+i)*.25),k);A[i].k.rotation.x=lerp(A[i].k.rotation.x,-.3,k)}
      if(n.H.m&&n.ms)n.H.m.scale.y=lerp(n.H.m.scale.y,n.ms.y*(3+Math.sin(t*5)*.8),k);
      b.sing-=dt;if(b.sing<0&&d<34){b.sing=rand(3,5);aria(n,d,1)}}}
  if(b.key==='detecto'){b.sing-=dt;b.pulse-=dt;if(b.pulse<0&&d<40){b.pulse=rand(7,9.5);pulse(n)}}}
// after the win: the diva rings out her high C and joins your line (hype-woman), Prime bows and tosses the chain, Detecto sleeps standing up
function wonFrame(n,d,dt,t){const b=n.boss,c=b.cfg,p=n.g.position;unTilt(n,dt);
  if(b.rings>0){b.ringT-=dt;if(b.ringT<=0){b.ringT=.3;b.rings--;bigRing(n,5-b.rings)}}
  if(b.toss){const q=b.toss;q.t+=dt;const f=Math.min(1,Math.floor(q.t*12)/12/.7),tx=X.px,tz=X.pz;// tossed on held frames, lands in your hands
    q.g.position.set(lerp(q.x,tx,f),lerp(q.y,1.3,f)+Math.sin(f*PI)*1.6,lerp(q.z,tz,f));q.g.rotation.y+=dt*6;if(f>=1){scene.remove(q.g);b.toss=null;X.beep(1320,.08,'triangle',.04);X.beep(1760,.12,'triangle',.035,.08)}}
  if(c.mode==='duet'){b.sing-=dt;if(b.sing<0){b.sing=rand(5,7);aria(n,d,1.3);
      for(const o of near(p.x,p.z,26,L2))if(o.type==='grandma'&&!o.hooked&&!o._pin&&o.state==='wander'){o.tx=X.px+rand(-3,3);o.tz=X.pz+rand(-3,3);o.tm=6}}
    if(b.rings>0&&isHuman(n)){home(n,dt);turn(n,X.px,X.pz,dt*4);return true}// she finishes the note on the steps before she joins you
    return false}
  home(n,dt);n.cool=1e9;
  if(c.mode==='set'){turn(n,X.px,X.pz,dt*4);pose(n,0,0,0,t,dt);if(n.P)n.P.rotation.x=lerp(n.P.rotation.x,.5,Math.min(1,dt*4))}// a bow
  else{pose(n,0,0,0,t,dt);n.H.h.rotation.x=lerp(n.H.h.rotation.x,.45,Math.min(1,dt*3));if(Math.random()<dt*.6){n.H.h.getWorldPosition(V1);X.emo('💤',V1.x,V1.y+1,V1.z,rand(-.3,.3),.8,rand(-.3,.3),.5)}}
  return true}
// pinned audiences (story.js sets n._pin = {x,z,fx,fz,pose}): they stay on their spot facing the act; untargetable while pinned
function pinStep(n,dt,t){const q=n._pin,p=n.g.position;p.x=q.x;p.z=q.z;n._ox=q.x;n._oz=q.z;n.state='wander';n.tx=q.x;n.tz=q.z;n.tm=5;n.cool=Math.max(n.cool,.6);n._cw=null;n._cj=0;n._av=null;
  if(!n.t.lift)p.y=0;turn(n,q.fx,q.fz,dt*6);pose(n,0,0,0,t,dt);if(!isHuman(n))return;const A=n.A,k=Math.min(1,dt*10);
  if(q.pose==='ears'){for(let i=0;i<2;i++){const s=i?1:-1;A[i].rotation.x=lerp(A[i].rotation.x,-2.2,k);A[i].rotation.z=lerp(A[i].rotation.z,s*.75,k);A[i].k.rotation.x=lerp(A[i].k.rotation.x,-1.75,k)}}
  else if(q.pose==='cheer'){const up=(Math.floor(t*4+n.ph*3)%2)===0;for(let i=0;i<2;i++){const s=i?1:-1;A[i].rotation.x=lerp(A[i].rotation.x,up?-2.9:-2.4,k);A[i].rotation.z=lerp(A[i].rotation.z,s*.5,k);A[i].k.rotation.x=lerp(A[i].k.rotation.x,up?-.2:-1,k)}}}
function bossUI(){if(X.mode!=='play'){if(!bar.hidden)bar.hidden=true;return}let best=null,bd=1e9;
  for(const k in BOSS){const n=BOSS[k].n;if(!n||n.boss.dead||BOSS[k].noBar)continue;const d=Math.hypot(n.g.position.x-X.px,n.g.position.z-X.pz);if(d<bd){bd=d;best=n}}
  const show=!!best&&(bd<45||X.held===best);if(bar.hidden===show)bar.hidden=!show;if(!show)return;
  const b=best.boss,c=b.cfg;if(barN.textContent!==c.name)barN.textContent=c.name;
  // the bar fills up with reps / sensor fills (progress), it doesn't drain like a health bar
  bar.style.setProperty('--n',c.goal);barI.style.width=(c.goal-b.hp)/c.goal*100+'%'}
function radarMark(){const cv=X.$('radar');if(!cv||X.mode!=='play')return;const rc=cv.getContext('2d'),h=104,sc=h/62,sn=Math.sin(X.yaw),cs=Math.cos(X.yaw);
  for(const k in BOSS){const n=BOSS[k].n;if(!n||n.boss.dead)continue;const dx=n.g.position.x-X.px,dz=n.g.position.z-X.pz;let x=(dx*cs-dz*sn)*sc,y=(dx*sn+dz*cs)*sc;const l=Math.hypot(x,y);if(l>h-12){x*=(h-12)/l;y*=(h-12)/l}
    rc.fillStyle='#ffd23c';rc.strokeStyle='#140f1c';rc.lineWidth=3;rc.beginPath();rc.arc(h+x,h+y,9,0,7);rc.fill();rc.stroke();rc.font='13px sans-serif';rc.textAlign='center';rc.textBaseline='middle';rc.fillText(k==='diva'?'🎶':'👑',h+x,h+y+1)}}

/* ================= WIRING ================= */
X.on('grab',n=>{if(!n.boss)react(n,15,true)});
X.on('release',(n,kind)=>{if(n.boss){if(!n.boss.dead)bossHit(n,kind);return}react(n,kind==='passive'?8:15,false)});
X.on('start',()=>{for(const k in BOSS)despawn(BOSS[k]);now=0;tn=0;congaBest=0;WQ.length=0;FOL=[];PL.still=0;PL.arc=false;PL.x=X.px;PL.z=X.pz;knock.x=knock.z=0;for(const n of npcs){n._cw=null;n._cj=0;n._pt=0;n._av=null;n._scat=0;n._pin=null}});
const clist=[];
X.on('frame',(dt,t)=>{now+=dt;fc++;if(cgN!==cols.length)buildCG();ngT-=dt;if(ngT<=0){ngT=.2;buildNG()}
  if(knock.x||knock.z){PV.x=X.px+knock.x*dt;PV.z=X.pz+knock.z*dt;X.collide(PV,.45);X.px=PV.x;X.pz=PV.z;const f=Math.max(0,1-6*dt);knock.x*=f;knock.z*=f;if(Math.abs(knock.x)+Math.abs(knock.z)<.2)knock.x=knock.z=0}
  const px=X.px,pz=X.pz;trail();playerMotion(dt);queuePlan();clist.length=0;const held=X.held;
  for(let i=0;i<npcs.length;i++){const n=npcs[i],p=n.g.position,d=Math.hypot(p.x-px,p.z-pz);if(!n.reach&&n.r)reach(n);if(n._in){n._cj=0;walkStep(n,dt,t);continue}
    if(d>130&&!n._carry){n._cj=0;continue}
    if(n._pin){n._cj=0;pinStep(n,dt,t);continue}
    if(n.boss){if(!n.boss.dead){bossFrame(n,d,dt,t);continue}if(n.state!=='held'&&wonFrame(n,d,dt,t))continue}
    // Detecto's alarm pulse: scatter away from him for a moment
    if(n._scat>now&&n.state!=='held'&&n!==held){back(n);let dx=p.x-n._sx,dz=p.z-n._sz;const l=Math.hypot(dx,dz)||1;p.x+=dx/l*5.5*dt;p.z+=dz/l*5.5*dt;X.collide(p,n.r);turn(n,p.x+dx,p.z+dz,dt*10);n.ph+=5.5*dt*3.2;pose(n,1,1,3,t,dt);n._cj=0;continue}
    if(n.state==='held'||n.state==='exhale'||n===held){n._cj=0;n._cw=null;n._av=null;continue}
    if(n.hooked&&(n._carry||d<(n._cj?55:30))&&clist.length<36){if(!n._cj)n._cj=now+i*1e-4;n._cw=null;clist.push(n);continue}
    n._cj=0;
    if(n._cw&&doGawk(n,dt,t))continue;
    steerPost(n,i,d,dt)}
  if(clist.length)conga(clist,dt,t);else{congaN=0;PL.arc=false}
  FOL=clist.concat(WQ);// next frame's soft push-apart checks these directly (the 5x/sec buckets lag behind fast walkers)
  if(gone.length){for(const n of gone){const w=n._in;n._in=null;removeNpc(n);try{w.done&&w.done(n)}catch(e){console.error('[crowds] walkIn',e)}}gone.length=0}
  if(fc%18===0)spread();
  cardT-=dt});
X.on('prerender',t=>{for(const n of npcs){n._ox=n.g.position.x;n._oz=n.g.position.z}
  const tt=performance.now()/1000;
  for(const k in BOSS){const c=BOSS[k],n=c.n;if(!n)continue;const p=n.g.position;if(c.beam&&c.beam.visible)c.beam.position.set(p.x,35,p.z);if(c.crown&&c.crown.visible)c.crown.position.set(p.x,p.y+n.hy+1.9+(RMQ.matches?0:Math.sin(Math.floor(tt*12)/4)*.12),p.z);// a paper crown bobbing on twos
    if(n.led)n.led.material.color.setHex(!n.boss.dead&&Math.sin(tt*(n.state==='held'?30:6))>0?0xff2020:0x401010)}
  bossUI();radarMark()});
X.on('win',()=>{bar.hidden=true});
X.crowds={BOSS,spawnBoss,despawn,defeat,react,walkIn,removeNpc,get now(){return now},get conga(){return congaN}};
})();
