/* hands mod: the first-person hands are flat stop-motion clay "photos" (cut-out sprites), not 3D models.
   Right hand (cowrie bracelet, green pebble pod vape) lives in the bottom-right corner:
   - idle: holds the pod out in front ("out"); tucks it in ("rest") while running
   - grab someone: a stop-motion reach (out → hit → tilt) and the pod aims at their mouth on screen
   - holding: every puff pumps the thumb (tilt ↔ hit) with a tiny shove
   - release: a flick back (hit → out) with a recoil
   Left hand is off screen until you grab someone's head: it steps up from the bottom-left toward their head
   (open → grip) and drops away after. Everything snaps at ~12 fps with a little clay boil; hands drop out of frame
   for cutscenes and rise back for play. The 3D arm stays in the scene, invisible, because the game still uses its
   vape-tip position (a held person's mouth locks onto it). */
(()=>{const X=window.TMV;if(!X||X.hands)return;const D=document;
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const css=D.createElement('style');css.textContent=`
#hands{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#hands .h{position:absolute;bottom:0;will-change:transform}
#hands .h img{position:absolute;inset:0;width:100%;height:100%;visibility:hidden;filter:drop-shadow(0 4px 6px rgba(20,10,0,.28))}
#hands .h img.on{visibility:visible}
#hands .hR{right:0;height:var(--hR,48vh);transform-origin:100% 100%}
#hands .hD{left:0;height:var(--hR,48vh);transform-origin:0 100%;transform:translateY(110%)}#hands .hD .mir{position:absolute;inset:0;transform:scaleX(-1)}
#hands .hL{left:0;height:var(--hL,46vh);transform-origin:0 100%;transform:translateY(110%)}
@media (orientation:portrait){#hands .hR,#hands .hD{height:var(--hRp,36vh)}#hands .hL{height:var(--hLp,22vh)}}`;
D.head.appendChild(css);

const wrap=D.createElement('div');wrap.id='hands';
const hud=D.getElementById('hud');if(hud&&hud.parentNode===X.game)X.game.insertBefore(wrap,hud);else X.game.appendChild(wrap);
const R=D.createElement('div');R.className='h hR';const L=D.createElement('div');L.className='h hL';
// double-vape power-up: the same clay hand + pod, mirrored, in the bottom-left
const DV=D.createElement('div');DV.className='h hD';const DVm=D.createElement('div');DVm.className='mir';DV.appendChild(DVm);wrap.append(L,DV,R);

let M=null;const FR={},FL={},FD={};
function mk(par,set,map){for(const k in set){const i=new Image();i.decoding='async';i.src='assets/hands/'+set[k].src;i.alt='';par.appendChild(i);map[k]=i}}
fetch('assets/hands/hands.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.R||!j.R.f)return;M=j;
  R.style.aspectRatio=DV.style.aspectRatio=j.R.w+'/'+j.R.h;L.style.aspectRatio=j.L.w+'/'+j.L.h;mk(R,j.R.f,FR);mk(L,j.L.f,FL);mk(DVm,j.R.f,FD);X.armR.visible=false}).catch(()=>{});

const cur={R:null,L:null,D:null};
function show(side,img){if(cur[side]===img)return;if(cur[side])cur[side].classList.remove('on');cur[side]=img;if(img)img.classList.add('on')}

// --- state ---
let up=0,acc=0,boilK=0,boilT=0,bobPh=0,lastX=X.px,lastZ=X.pz,sp=0;
let phase='idle',queue=[],pump=0,recoil=0,aimK=0,lstep=0,held=null;
const tgt={x:0,y:0,ok:false},V=X.T?new X.T.Vector3():null,mp={x:0,y:0,ok:false,k:0};
/* tipSync: the core locks a held person's mouth onto armR.tip (an invisible 3D point). Move that point to wherever the clay pod's
   mouthpiece is on screen, at the tip's usual depth, so their mouth lands on the vape tip. */
let tip0=null;const TV=X.T?new X.T.Vector3():null,TV2=X.T?new X.T.Vector3():null;
/* (unused: the user wants the vape to travel to them, not them pulled to the vape) */function tipSync(){const tip=X.armR&&X.armR.tip;if(!tip||!TV)return;if(!tip0)tip0=tip.position.clone();
  if(!(mp.ok&&mp.k>0)){tip.position.copy(tip0);return}
  const cam=X.cam;cam.updateMatrixWorld();tip.position.copy(tip0);tip.parent.updateMatrixWorld(true);tip.getWorldPosition(TV);
  TV.applyMatrix4(cam.matrixWorldInverse);const zc=Math.min(-.25,TV.z),g=X.game.getBoundingClientRect(),th=Math.tan(cam.fov*Math.PI/360);
  const nx=mp.x/g.width*2-1,ny=1-mp.y/g.height*2,k=mp.k;TV2.set(nx*-zc*th*cam.aspect,ny*-zc*th,zc);
  TV.lerp(TV2,k);cam.localToWorld(TV);tip.parent.worldToLocal(TV);tip.position.copy(TV)}
X.on('grab',n=>{held=n;phase='reach';queue=['out','reach1','reach1','reach2']});// stop-motion reach: the vape travels out to their face
X.on('vape',()=>{if(phase==='hold')pump=1});
X.on('release',(n,kind)=>{if(kind==='passive')return;phase='flick';queue=['reach1','out'];recoil=1;held=null});

function aimAt(useStraw){tgt.ok=false;const n=X.held||held;if(!n||!V||!X.mouth)return;try{if(useStraw)V.copy(SW);else X.mouth(n,V);V.project(X.cam);if(V.z>1)return;
  const g=X.game.getBoundingClientRect();tgt.x=(V.x+1)/2*g.width;tgt.y=(1-V.y)/2*g.height;tgt.ok=true}catch(e){}}

/* straw: while held, their actual mouth (H.m) is pinned to one fixed point in front of the lens (centre, at the vape tip's depth),
   re-pinned every frame after the camera moves, and the core's lip-lock target (the invisible armR.tip) is parked on the same point,
   so neither the mouth nor the clay pod's white tip jiggles: they sip from it like a straw. */
const S=X.T?new X.T.Vector3():null,SW=X.T?new X.T.Vector3():null,SM=X.T?new X.T.Vector3():null;let sOn=null,sT=0,tipRest=null,fCur='out';const STRAW=[.5,.5];// where on screen (0..1) the straw point sits
function straw(){const n=X.held,tip=X.armR&&X.armR.tip,cam=X.cam;if(!tip||!S)return false;if(!tipRest)tipRest=tip.position.clone();
  if(!n||!n.H||!n.H.m||!n.g||X.mode!=='play'){if(sOn){tip.position.copy(tipRest);sOn=null}return false}
  cam.updateMatrixWorld();
  if(sOn!==n){sOn=n;sT=performance.now();tip.position.copy(tipRest);tip.parent.updateMatrixWorld(true);tip.getWorldPosition(SW);cam.worldToLocal(SW);
    const d=Math.max(.7,Math.min(1.3,-SW.z)),th=Math.tan(cam.fov*Math.PI/360);S.set((STRAW[0]*2-1)*d*th*cam.aspect,(1-STRAW[1]*2)*d*th,-d)}
  SW.copy(S);cam.localToWorld(SW);
  const age=(performance.now()-sT)/1000,k=age<.33?Math.min(1,.12+age*2.2):1;// they lean in to meet the vape over ~1/3 s, then stay locked
  n.g.updateMatrixWorld(true);n.H.m.getWorldPosition(SM);n.g.position.x+=(SW.x-SM.x)*k;n.g.position.y+=(SW.y-SM.y)*k;n.g.position.z+=(SW.z-SM.z)*k;n.g.updateMatrixWorld(true);
  tip.parent.updateMatrixWorld(true);SM.copy(SW);tip.parent.worldToLocal(SM);tip.position.copy(SM);return true}
const STEP=1/12;let lastT=performance.now();
X.on('prerender',gdt=>{const now=performance.now(),dt=Math.min(.1,(now-lastT)/1000)||1/60;lastT=now;if(!M)return;
  X.armR.visible=false;if(X.armL)X.armL.visible=false;// the 3D arms only provides the vape-tip position now (also hides the old 3D left hand)
  const play=X.mode==='play'||X.mode==='paused';
  up=Math.max(0,Math.min(1,up+(play?dt/.35:-dt/.2)));
  const v=Math.hypot(X.px-lastX,X.pz-lastZ)/Math.max(1e-3,gdt||dt);lastX=X.px;lastZ=X.pz;if(v<20){sp+=(v-sp)*Math.min(1,dt*8);bobPh+=dt*Math.min(9,sp*1.6)}
  if(phase==='hold'&&!X.held){phase='flick';queue=['reach1','out'];recoil=1;held=null}
  const sOK=straw();// pin their real mouth on the straw point first (every frame, after the camera has moved)
  acc+=dt;const stepped=acc>=STEP;if(stepped)acc=0;// frames and most placement snap at ~12 fps (stop-motion)
  const rm=RM.matches;
  if(stepped){boilT+=STEP;if(boilT>=.125){boilT=0;boilK=(boilK+1+(Math.random()*2|0))%6}
  // ---- right hand frame
  let f;
  if(queue.length){f=queue.shift();if(!queue.length){if(phase==='reach')phase='hold';else if(phase==='flick')phase='idle'}}
  else if(phase==='hold'){f=pump>0?'squeeze':'reach2';if(pump>0)pump--}
  else f=sp>4.5?'rest':'out';
  fCur=f;show('R',FR[f]||FR.out||FR.rest);
  const aiming=(phase==='reach'||phase==='hold')&&X.mode==='play';aimK=Math.max(0,Math.min(1,aimK+(aiming?.25:-.5)))}
  // like a straw: while you hold someone the white tip sits dead still in their mouth, so the hand is re-placed every frame
  const pin=phase==='hold'&&aimK>=1&&sOK;
  if(!stepped&&!pin)return;const f=fCur;
  // ---- right hand placement
  const g=X.game.getBoundingClientRect(),W=g.width,H=g.height,Wc=R.offsetWidth,Hc=R.offsetHeight;
  const walking=sp>.3&&!rm,bob=walking?Math.abs(Math.sin(bobPh))*H*.016:0,sway=walking?Math.sin(bobPh)*W*.008:0;
  let tx=sway,ty=(1-up)*Hc*1.05+bob+recoil*H*.05,rot=0,sc=1;recoil=Math.max(0,recoil-.34);
  // resting pose: park the pod's mouthpiece at ~68% across, a bit below middle, whatever the screen shape
  {const fm=M.R.f[f]&&M.R.f[f].mp;if(fm&&f==='out'){const mx=W-Wc+fm[0]*Wc,my=H-Hc+fm[1]*Hc,k=1-aimK;
    tx+=Math.max(-W*.1,Math.min(Wc*.5,(W*.68-mx)))*k;ty+=Math.max(-H*.1,Math.min(H*.2,(H*.6-my)))*k}}
  if(aimK>0){aimAt(sOK);const fm=M.R.f[f]&&M.R.f[f].mp;
    /* the arm EXTENDS out to the middle and they meet it there: the clay frames are cut from full first-person photos (1376x768) in which
       the reach already sits mid-frame with the forearm rising from the bottom edge. So the reach grows to the photo's own size (no
       rotation) and slides down/right until the white tip is on the straw point; the forearm stays cut off by the bottom of the screen. */
    if(fm&&tgt.ok){const k0=Math.max(W/1376,H/768)*M.R.h/Math.max(1,Hc);sc=1+(k0-1)*aimK;
      const px=W,py=H,mx=W-Wc+fm[0]*Wc,my=H-Hc+fm[1]*Hc,rx=px+sc*(mx-px),ry=py+sc*(my-py);
      if(pin){tx+=tgt.x-rx;ty+=tgt.y-ry}// held: the tip lands exactly on the mouth, no slack
      else{tx+=(tgt.x-rx)*aimK;ty+=(tgt.y-ry)*aimK}}}
  if(!pin&&pump===1&&!rm){sc*=.97;tx-=W*.004;ty-=H*.006}// a little shove on a puff (not while sipping: the tip stays put)
  if(!rm&&!pin){const j=boilK*1.37;tx+=Math.sin(j*2.1)*W*.0012;ty+=Math.cos(j*1.7)*H*.003;rot+=Math.sin(j*3.3)*.35}
  R.style.transform=`translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
  // where the pod's mouthpiece is on screen right now (for tipSync)
  {const fm=M.R.f[f]&&M.R.f[f].mp;if(fm){const px=W,py=H,dmx=W-Wc+fm[0]*Wc-px,dmy=H-Hc+fm[1]*Hc-py,a=rot*Math.PI/180,c=Math.cos(a),s2=Math.sin(a);
    mp.x=px+sc*(dmx*c-dmy*s2)+tx;mp.y=py+sc*(dmx*s2+dmy*c)+ty;mp.ok=true}else mp.ok=false;mp.k=aimK}
  // ---- double-vape: mirrored clay hand + pod bottom-left, moving as the right hand's reflection
  const dual=false;// no second (mirrored) hand on screen, even with the double-vape power-up: just the right hand (user)
  if(dual){show('D',FD[f]||FD.out);DV.style.transform=`translate(${(-tx).toFixed(1)}px,${ty.toFixed(1)}px) rotate(${(-rot).toFixed(2)}deg) scale(${sc.toFixed(3)})`}
  else if(cur.D){show('D',null);DV.style.transform='translateY(110%)'}
  // ---- left hand: only while grabbing someone; steps up (open → grip) toward their head, drops after
  const want=false;// no left grab hand: just the right hand (user)
  lstep=want?Math.min(3,lstep+1):Math.max(0,lstep-1);
  if(lstep===0){L.style.transform='translateY(110%)';show('L',null)}
  else{show('L',lstep<2?FL.rest:FL.grab);const Wl=L.offsetWidth;
    const Hl=L.offsetHeight,hide=[1.1,.55,.2,0][lstep],reach=[0,.3,.75,1][lstep];let lx=0,ly=hide*Hl+bob*.6,lr=-4*(3-lstep);
    if(tgt.ok){// grip point ≈ fingers at (80%,15%) of the sprite; put it just left of / below the held mouth (side of the head)
      // the forearm is cut at the sprite's left edge, so the hand stays pinned to the screen edge: lift it, then swing it
      // round the bottom-left corner so the fingers land beside the head
      const gx=Wl*.8,gy0=H-Hl+Hl*.15,lift=0;
      const gy=gy0+lift,a0=Math.atan2(gy-H-lift,gx),a1=Math.atan2(tgt.y+H*.04-H-lift,tgt.x-W*.05);
      lr+=Math.max(-24,Math.min(16,(a1-a0)*180/Math.PI))*reach}if(!rm){const j=boilK*1.91;lx+=Math.sin(j*1.3)*W*.001;ly+=Math.cos(j*2.3)*H*.003;lr+=Math.sin(j*2.9)*.4}
    L.style.transform=`translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) rotate(${lr.toFixed(2)}deg)`}});
X.hands={wrap,get phase(){return phase},get mp(){return mp},straw:STRAW};
})();
