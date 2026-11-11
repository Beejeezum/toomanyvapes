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
#hands .hL{left:0;height:var(--hL,46vh);transform-origin:0 100%;transform:translateY(110%)}
@media (orientation:portrait){#hands .hR{height:var(--hRp,36vh)}#hands .hL{height:var(--hLp,22vh)}}`;
D.head.appendChild(css);

const wrap=D.createElement('div');wrap.id='hands';
const hud=D.getElementById('hud');if(hud&&hud.parentNode===X.game)X.game.insertBefore(wrap,hud);else X.game.appendChild(wrap);
const R=D.createElement('div');R.className='h hR';const L=D.createElement('div');L.className='h hL';wrap.append(L,R);

let M=null;const FR={},FL={};
function mk(par,set,map){for(const k in set){const i=new Image();i.decoding='async';i.src='assets/hands/'+set[k].src;i.alt='';par.appendChild(i);map[k]=i}}
fetch('assets/hands/hands.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.R||!j.R.f)return;M=j;
  R.style.aspectRatio=j.R.w+'/'+j.R.h;L.style.aspectRatio=j.L.w+'/'+j.L.h;mk(R,j.R.f,FR);mk(L,j.L.f,FL);X.armR.visible=false}).catch(()=>{});

const cur={R:null,L:null};
function show(side,img){if(cur[side]===img)return;if(cur[side])cur[side].classList.remove('on');cur[side]=img;if(img)img.classList.add('on')}

// --- state ---
let up=0,acc=0,boilK=0,boilT=0,bobPh=0,lastX=X.px,lastZ=X.pz,sp=0;
let phase='idle',queue=[],pump=0,recoil=0,aimK=0,lstep=0,held=null;
const tgt={x:0,y:0,ok:false},V=X.T?new X.T.Vector3():null;
X.on('grab',n=>{held=n;phase='reach';queue=['hit','tilt']});
X.on('vape',()=>{if(phase==='hold')pump=1});
X.on('release',(n,kind)=>{if(kind==='passive')return;phase='flick';queue=['hit','out'];recoil=1;held=null});

function aimAt(){tgt.ok=false;const n=X.held||held;if(!n||!V||!X.mouth)return;try{X.mouth(n,V);V.project(X.cam);if(V.z>1)return;
  const g=X.game.getBoundingClientRect();tgt.x=(V.x+1)/2*g.width;tgt.y=(1-V.y)/2*g.height;tgt.ok=true}catch(e){}}

const STEP=1/12;let lastT=performance.now();
X.on('prerender',gdt=>{const now=performance.now(),dt=Math.min(.1,(now-lastT)/1000)||1/60;lastT=now;if(!M)return;
  X.armR.visible=false;// the 3D arm only provides the vape-tip position now (also hides the old 3D left hand)
  const play=X.mode==='play'||X.mode==='paused';
  up=Math.max(0,Math.min(1,up+(play?dt/.35:-dt/.2)));
  const v=Math.hypot(X.px-lastX,X.pz-lastZ)/Math.max(1e-3,gdt||dt);lastX=X.px;lastZ=X.pz;if(v<20){sp+=(v-sp)*Math.min(1,dt*8);bobPh+=dt*Math.min(9,sp*1.6)}
  if(phase==='hold'&&!X.held){phase='flick';queue=['hit','out'];recoil=1;held=null}
  acc+=dt;if(acc<STEP)return;acc=0;// everything below snaps at ~12 fps (stop-motion)
  const rm=RM.matches;boilT+=STEP;if(boilT>=.125){boilT=0;boilK=(boilK+1+(Math.random()*2|0))%6}
  // ---- right hand frame
  let f;
  if(queue.length){f=queue.shift();if(!queue.length){if(phase==='reach')phase='hold';else if(phase==='flick')phase='idle'}}
  else if(phase==='hold'){f=pump>0?'hit':'tilt';if(pump>0)pump--}
  else f=sp>4.5?'rest':'out';
  show('R',FR[f]||FR.out||FR.rest);
  // ---- right hand placement
  const g=X.game.getBoundingClientRect(),W=g.width,H=g.height,Wc=R.offsetWidth,Hc=R.offsetHeight;
  const walking=sp>.3&&!rm,bob=walking?Math.abs(Math.sin(bobPh))*H*.016:0,sway=walking?Math.sin(bobPh)*W*.008:0;
  let tx=sway,ty=(1-up)*Hc*1.05+bob+recoil*H*.05,rot=0;recoil=Math.max(0,recoil-.34);
  const aiming=(phase==='reach'||phase==='hold')&&X.mode==='play';aimK=Math.max(0,Math.min(1,aimK+(aiming?.34:-.5)));
  // resting pose: park the pod's mouthpiece at ~68% across, a bit below middle, whatever the screen shape
  {const fm=M.R.f[f]&&M.R.f[f].mp;if(fm&&f==='out'){const mx=W-Wc+fm[0]*Wc,my=H-Hc+fm[1]*Hc,k=1-aimK;
    tx+=Math.max(-W*.1,Math.min(Wc*.5,(W*.68-mx)))*k;ty+=Math.max(-H*.1,Math.min(H*.2,(H*.6-my)))*k}}
  if(aimK>0){aimAt();const fm=M.R.f[f]&&M.R.f[f].mp;
    if(tgt.ok&&fm){const px=W,py=H,mx=W-Wc+fm[0]*Wc,my=H-Hc+fm[1]*Hc;
      let th=Math.atan2(tgt.y-py,tgt.x-px)-Math.atan2(my-py,mx-px);th=Math.atan2(Math.sin(th),Math.cos(th));
      th=Math.max(-.32,Math.min(.32,th))*aimK;rot+=th*180/Math.PI;
      // after rotating, nudge the pod part of the way toward the mouth
      const c=Math.cos(th),s=Math.sin(th),rx=px+(mx-px)*c-(my-py)*s,ry=py+(mx-px)*s+(my-py)*c;
      tx+=Math.max(-W*.08,Math.min(W*.04,(tgt.x-rx)*.3*aimK));ty+=Math.max(-H*.1,Math.min(H*.05,(tgt.y-ry)*.3*aimK))}}
  if(pump===1&&!rm){tx-=W*.006;ty-=H*.01}
  if(!rm){const j=boilK*1.37;tx+=Math.sin(j*2.1)*W*.0012;ty+=Math.cos(j*1.7)*H*.003;rot+=Math.sin(j*3.3)*.35}
  R.style.transform=`translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
  // ---- left hand: only while grabbing someone; steps up (open → grip) toward their head, drops after
  const want=(phase==='reach'||phase==='hold')&&X.mode==='play'&&up>.9;
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
X.hands={wrap,get phase(){return phase}};
})();
