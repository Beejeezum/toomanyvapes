/* hands mod: the first-person hands are flat stop-motion clay "photos" (cut-out sprites), not 3D models.
   Right hand + pod vape sits low in the bottom-right corner; left fingertips peek in at the bottom-left.
   Frames swap at ~8 fps (clay boil); every move snaps in ~12 fps steps like stop-motion.
   - walking: a small stepped bob
   - holding someone: the right hand pushes the vape up toward their mouth (hit frames) and the left hand grabs
   - release: a quick recoil
   - cutscenes / title / win: hands drop out of frame, then rise back in when play resumes
   The 3D arm stays in the scene, invisible, because the game uses its vape-tip position (a held person's mouth locks onto it). */
(()=>{const X=window.TMV;if(!X||X.hands)return;const D=document;
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const css=D.createElement('style');css.textContent=`
#hands{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#hands .h{position:absolute;bottom:0;will-change:transform}
#hands .h img{position:absolute;inset:0;width:100%;height:100%;visibility:hidden;filter:drop-shadow(0 4px 6px rgba(20,10,0,.28))}
#hands .h img.on{visibility:visible}
#hands .hR{right:0;height:var(--hR,52vh)}
#hands .hL{left:0;height:var(--hL,30vh)}
@media (orientation:portrait){#hands .hR{height:var(--hRp,34vh)}#hands .hL{height:var(--hLp,20vh)}}`;
D.head.appendChild(css);

const wrap=D.createElement('div');wrap.id='hands';
const hud=D.getElementById('hud');if(hud&&hud.parentNode===X.game)X.game.insertBefore(wrap,hud);else X.game.appendChild(wrap);
const R=D.createElement('div');R.className='h hR';const L=D.createElement('div');L.className='h hL';wrap.append(L,R);

let M=null;const F={};// F.idle,F.hit,F.lrest,F.lgrab: arrays of <img>
function mk(par,list){return(list||[]).map(src=>{const i=new Image();i.decoding='async';i.src='assets/hands/'+src;i.alt='';par.appendChild(i);return i})}
fetch('assets/hands/hands.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;M=j;
  R.style.aspectRatio=j.R.w+'/'+j.R.h;L.style.aspectRatio=j.L.w+'/'+j.L.h;
  F.idle=mk(R,j.R.idle);F.hit=mk(R,j.R.hit&&j.R.hit.length?j.R.hit:j.R.idle);F.lrest=mk(L,j.L.rest);F.lgrab=mk(L,j.L.grab&&j.L.grab.length?j.L.grab:j.L.rest);
  X.armR.visible=false}).catch(()=>{});

let cur={R:null,L:null};
function show(side,img){if(cur[side]===img)return;if(cur[side])cur[side].classList.remove('on');cur[side]=img;if(img)img.classList.add('on')}
const pick=(a,k)=>a&&a.length?a[k%a.length]:null;

let up=0,acc=0,boilT=0,boilK=0,bobPh=0,lastX=X.px,lastZ=X.pz,recoil=0,hitT=0,lgrab=0,jolt=0;
X.on('release',(n,kind)=>{if(kind!=='passive')recoil=.22});
X.on('vape',()=>{jolt=.08});
X.on('grab',()=>{hitT=0});

const STEP=1/12;
X.on('prerender',dt=>{dt=Math.min(.1,dt||1/60);if(!M)return;
  X.armR.visible=false;// the 3D arm only provides the vape-tip position now (also hides the 3D left grab hand)
  const play=X.mode==='play'||X.mode==='paused';
  // rise in / drop out
  up=Math.max(0,Math.min(1,up+(play?dt/.35:-dt/.2)));
  const held=!!X.held&&X.mode==='play';
  lgrab=Math.max(0,Math.min(1,lgrab+(held?dt/.18:-dt/.25)));
  recoil=Math.max(0,recoil-dt);jolt=Math.max(0,jolt-dt);if(held)hitT+=dt;
  // walking bob from actual movement
  const sp=Math.hypot(X.px-lastX,X.pz-lastZ)/dt;lastX=X.px;lastZ=X.pz;if(sp<20)bobPh+=dt*Math.min(9,sp*1.6);
  acc+=dt;if(acc<STEP)return;acc=0;// everything below snaps at ~12 fps
  boilT+=STEP;if(boilT>=.125){boilT=0;boilK=(boilK+1+(Math.random()*2|0))%6}
  const rm=RM.matches;
  // right hand
  show('R',pick(held?F.hit:F.idle,rm?0:boilK));
  const drop=(1-up)*105,bob=sp>.3&&!rm?Math.abs(Math.sin(bobPh))*1.6:0,sway=sp>.3&&!rm?Math.sin(bobPh)*.9:0;
  let tx=sway,ty=drop+bob+recoil*14,rot=0,sc=1;
  if(held){const k=Math.min(1,hitT/.15);tx-=1.5*k;ty-=3*k;rot=-2*k;sc=1-.12*k;if(jolt>0&&!rm){tx+=(Math.random()-.5)*.8;ty+=(Math.random()-.5)*.8}}
  if(!rm){const j=boilK*1.37;tx+=Math.sin(j*2.1)*.12;ty+=Math.cos(j*1.7)*.35;rot+=Math.sin(j*3.3)*.35}
  R.style.transform=`translate(${tx.toFixed(2)}vw,${ty.toFixed(2)}%) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;R.style.transformOrigin='100% 100%';
  // left hand: fingertips at rest, grabs (rises) while holding someone
  show('L',pick(lgrab>.5?F.lgrab:F.lrest,rm?0:boilK));
  let ly=(1-up)*105+bob*.6,lx=-sway*.6,lr=0;if(!rm){const j=boilK*1.91;lx+=Math.sin(j*1.3)*.1;ly+=Math.cos(j*2.3)*.4;lr=Math.sin(j*2.9)*.4}
  L.style.transform=`translate(${lx.toFixed(2)}vw,${ly.toFixed(2)}%) rotate(${lr.toFixed(2)}deg)`;L.style.transformOrigin='0 100%'});
X.hands={wrap};
})();
