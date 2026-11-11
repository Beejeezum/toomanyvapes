/* flyin mod: the opening's last shot is an in-engine camera flight. After Sal sends the bro off (ch1_v2_5) the story hard-cuts
   to an engine shot ({"engine":"fly"} in script.json); story.js keeps its cutscene layer up but see-through (#st.eng: letterbox
   bars, grain, dust, vignette, a light warm grade) and hands the shot to this mod through X.emit('engineShot', name, done, live).
   The real game camera then glides over the real town along the storyboard path (docs/storyboard, "Fly-in path"): out over the
   ocean to the east, west along x = 0, never below the 19 m roofline until it has cleared the last block, down only over the open
   square past the container and the vape spill, and it settles on the street facing Cloud Kingz at exactly the gameplay pose
   (LAND). The world keeps its own 12 fps stop-motion; the camera moves smoothly on eased monotone splines (no overshoot, so it
   can never dip under the eye height or roll past the landing). Over the last second the film dressing steps away, then done()
   ends the cutscene and play starts on that identical frame; the sprite hands (js/hands.js) rise in on their own.
   Sound bed: the old Runway clip's audio (audio/sfx_fly_bed.m4a, extracted from the old ch1_fly clip), stretched to the flight and faded out.
   A tap/skip (or anything else that ends the shot) lands at LAND at once. */
(()=>{const X=window.TMV;if(!X||X.flyin)return;const D=document,T=X.T,PI=Math.PI;
const SHOT='fly',LAND={px:0,pz:8,yaw:PI,pitch:.03},DUR=10,DRESS_OUT=1,BED='audio/sfx_fly_bed.m4a';
// keyframes: t (s), z, eye height y (m), pitch (deg). x stays 0 and yaw π (looking down +z, west) the whole way. It starts
// 50 m out to sea (the shore is at z -125) tilted down enough to show the surf, the beach and Muscle Beach before the town.
// Along x = 0 the two downtown blocks (z -50.5…-37.5 and -28.5…-15.5) are up to 19 m tall with a roof board (+0.5 m) and
// maybe a water tower (top +2.95 m, so ≤ 21.95 m), which is why the camera holds ≥ 24.6 m until it has cleared z -15.15.
// Crows circle at 25-31 m over downtown (z ≥ -57), gulls at ~13 m over the beach, the blimp at ~52 m; Cloud Kingz is at
// z 17…27. The descent happens only over the open square: past the container (z -7.3…-4.7) and the spill, down to LAND.
const KEYS=[[0,-176,46,-22],[1.5,-132,40,-17],[2.8,-96,33,-16],[3.9,-66,25.4,-20],[5,-38,24.8,-24],[5.9,-16,24.6,-36],
  [7,-6,11.5,-52],[8.6,2.5,4.4,-14],[DUR,LAND.pz,1.6,LAND.pitch*180/PI]];

/* monotone cubic Hermite (PCHIP): smooth, no overshoot between keys; m0/m1 = end slopes (ease in / settle) */
function pchip(ts,vs,m0,m1){const n=ts.length,h=[],d=[],m=[];
  for(let i=0;i<n-1;i++){h[i]=ts[i+1]-ts[i];d[i]=(vs[i+1]-vs[i])/h[i]}
  for(let i=1;i<n-1;i++){if(d[i-1]*d[i]<=0){m[i]=0;continue}const w1=2*h[i]+h[i-1],w2=h[i]+2*h[i-1];m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i])}
  m[0]=m0;m[n-1]=m1;
  return t=>{if(t<=ts[0])return vs[0];if(t>=ts[n-1])return vs[n-1];let i=0;while(t>ts[i+1])i++;
    const s=(t-ts[i])/h[i],s2=s*s,s3=s2*s;return(2*s3-3*s2+1)*vs[i]+(s3-2*s2+s)*h[i]*m[i]+(-2*s3+3*s2)*vs[i+1]+(s3-s2)*h[i]*m[i+1]}}
const col=k=>KEYS.map(r=>r[k]),TS=col(0),d0=k=>(KEYS[1][k]-KEYS[0][k])/(KEYS[1][0]-KEYS[0][0]);
const Z=pchip(TS,col(1),d0(1)*.75,0),Y=pchip(TS,col(2),d0(2)*.75,0),P=pchip(TS,col(3),d0(3),0);
const ss=(a,b,v)=>{v=Math.min(1,Math.max(0,(v-a)/(b-a)));return v*v*(3-2*v)};
// pose at time t: a slight roll for life while high up (≤2.5°), gone well before the descent
function pose(t,o){o=o||{};o.t=t;o.x=0;o.z=Z(t);o.y=Y(t);o.pitch=t>=DUR?LAND.pitch:P(t)*PI/180;o.yaw=LAND.yaw;
  o.roll=2.5*PI/180*Math.sin(.7*t+.4)*(1-ss(4.5,6.8,t));return o}

/* dressing: the story's cutscene layer is transparent for engine shots (#st.eng); here it gets the cutscenes' grade as a
   backdrop filter (desktop; a plain warm wash on touch to keep it light) and steps everything off over the last second */
const css=D.createElement('style');css.textContent=`
#st.eng{background:transparent!important}
#st.eng .fr>*{visibility:hidden!important}
#st.eng .fr{filter:none!important;background:transparent;-webkit-backdrop-filter:sepia(.14) saturate(.9) contrast(.95) blur(.5px);backdrop-filter:sepia(.14) saturate(.9) contrast(.95) blur(.5px)}
#st.eng.lite .fr{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,190,130,.07)}
#st.eng.lite .gr{opacity:.09}
#st.eng .bars:before,#st.eng .bars:after{transition:transform .5s steps(5,end)}
#st.eng.land .bars:before{transform:translateY(-100%)}#st.eng.land .bars:after{transform:translateY(100%)}
#st.eng .fr,#st.eng .gr,#st.eng .du,#st.eng .vg{transition:opacity .6s steps(6,end)}
#st.eng.land .fr,#st.eng.land .gr,#st.eng.land .du,#st.eng.land .vg{opacity:0!important}
#st.eng.land .cap,#st.eng.land .sk{opacity:0}
@media (prefers-reduced-motion:reduce){#st.eng .bars:before,#st.eng .bars:after,#st.eng .fr,#st.eng .gr,#st.eng .du,#st.eng .vg{transition:none}}`;
D.head.appendChild(css);
const RMq=matchMedia('(prefers-reduced-motion: reduce)');
// HUD, hands, Sal's call, cards and the full-screen button stay out of the shot, from the start of the opening (under the opaque
// first shot) until the landing. Opacity, not visibility: it isn't inherited, so it costs no restyle of the HUD at the cut or the
// landing. Held every frame (juice's container intro fades the HUD back in under the first shot) and never transitioned: it is
// simply there on the first gameplay frame, as it was when the opening was all video.
const UI=['hud','hands','stc','stt','stk','scFS'],uiWas={};
function hideUI(on){for(const id of UI){const e=D.getElementById(id);if(!e)continue;
  if(on){const w=uiWas[id]||(uiWas[id]={o:e.style.opacity,tr:e.style.transition});
    if(e.style.opacity!=='0'){w.o=e.style.opacity;e.style.opacity='0'}if(e.style.transition!=='none'){w.tr=e.style.transition;e.style.transition='none'}}
  else if(uiWas[id]){const w=uiWas[id];delete uiWas[id];e.style.opacity=w.o;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!uiWas[id])e.style.transition=w.tr}))}}}
const st=()=>D.getElementById('st');

/* sound bed: a hidden media element; unlocked inside the PLAY tap (chapter 1 starts in that click) so iOS lets it start later */
let bed=null;
function bedMake(){if(bed)return;try{bed=new Audio(BED);bed.preload='auto';bed.preservesPitch=bed.webkitPreservesPitch=true;
  bed.muted=true;const p=bed.play();if(p&&p.then)p.then(()=>{if(!fly){bed.pause();try{bed.currentTime=0}catch(e){}}bed.muted=false}).catch(()=>{bed.muted=false});else bed.muted=false}catch(e){bed=null}}
function bedStart(){if(!bed)bedMake();if(!bed)return;try{const d=isFinite(bed.duration)&&bed.duration>1?bed.duration:8.06;
  bed.playbackRate=Math.min(1.1,Math.max(.75,d/(DUR-.15)));bed.currentTime=0;bed.muted=false;bed.volume=0;const p=bed.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function bedStep(t){if(!bed)return;const v=X.muted?0:.95*Math.min(1,t/.12)*Math.min(1,Math.max(0,(DUR-.1-t)/(DRESS_OUT-.1)));try{bed.volume=Math.max(0,Math.min(1,v))}catch(e){}}
function bedStop(){if(bed)try{bed.pause();bed.volume=0}catch(e){}}

/* shadows + focus follow the shot: the clay mod centres a ±30 m shadow box on the player and racks focus at eye height, which
   would leave an aerial view without shadows and soft; while up high the box grows and leads the camera, and focus sits on
   the ground where the camera looks. Both blend back to the clay mod's own values as the camera settles at eye height. */
const sun=X.scene.children.find(o=>o.isDirectionalLight);
const lit=new T.Vector3(),rgt=new T.Vector3(),upv=new T.Vector3(),tgtP=new T.Vector3();let shHalf=0;
function shadowSet(x,z,y){const C=X.clay;if(!sun||!C||!C.SH||!C.SH.on)return;const SH=C.SH,k=ss(1.6,12,y),half=SH.half*(1+2*k),cam=sun.shadow.camera;
  if(Math.abs(half-shHalf)>1e-3){shHalf=half;cam.left=cam.bottom=-half;cam.right=cam.top=half;cam.updateProjectionMatrix()}
  if(k<=0)return;// at eye height the clay mod's own placement stands (same frame as gameplay)
  const d=(X.world&&X.world.sunDir)||lit.copy(sun.position).normalize();lit.copy(d);if(lit.y<.45){lit.y=.45;lit.normalize()}
  rgt.set(0,1,0).cross(lit).normalize();upv.copy(lit).cross(rgt);const tx=half*2/SH.size;tgtP.set(x,0,z+(half-SH.half)*.9);
  const a=Math.round(tgtP.dot(rgt)/tx)*tx,b=Math.round(tgtP.dot(upv)/tx)*tx,cc=tgtP.dot(lit);tgtP.copy(rgt).multiplyScalar(a).addScaledVector(upv,b).addScaledVector(lit,cc);
  sun.target.position.copy(tgtP);sun.target.updateMatrixWorld();sun.position.copy(tgtP).addScaledVector(lit,90)}
function shadowReset(){const C=X.clay;if(!sun||!C||!C.SH||!shHalf)return;const h=C.SH.half,cam=sun.shadow.camera;cam.left=cam.bottom=-h;cam.right=cam.top=h;cam.updateProjectionMatrix();shHalf=0}
function focusSet(o){const C=X.clay,F=C&&C.DOF;if(!F||!F.on)return;const w=ss(1.6,5,o.y);if(w<=0)return;
  const dn=-Math.sin(o.pitch),f=dn>.02?Math.min(140,o.y/dn):140;F.focus+=(f-F.focus)*w;F.near=Math.min(F.focus*.5,1.5);F.far=Math.max(F.focus*2+1,7)}

/* birds (js/world.js: instanced bodies + wings, posed on a 12 fps clock) never meet the lens: any bird within 3 m of the
   camera is folded away until the flock's next step re-poses it */
let birdB,birdW;const _m=new T.Matrix4(),_z=new T.Matrix4().makeScale(0,0,0);
function birdGuard(){if(birdB===undefined){const I=X.scene.children.filter(o=>o.isInstancedMesh&&o.geometry&&o.geometry.parameters);
    birdB=I.find(o=>o.geometry.parameters.width===.26&&o.geometry.parameters.depth===.8)||null;birdW=I.find(o=>o.geometry.parameters.width===1&&o.geometry.parameters.depth===.42)||null}
  if(!birdB||!birdW)return;const c=X.cam.position;let hit=false;
  for(let i=0;i<birdB.count;i++){birdB.getMatrixAt(i,_m);const e=_m.elements;if(e[0]===0&&e[5]===0)continue;
    if(Math.hypot(e[12]-c.x,e[13]-c.y,e[14]-c.z)<3){birdB.setMatrixAt(i,_z);if(2*i+1<birdW.count){birdW.setMatrixAt(2*i,_z);birdW.setMatrixAt(2*i+1,_z)}hit=true}}
  if(hit)birdB.instanceMatrix.needsUpdate=birdW.instanceMatrix.needsUpdate=true}

/* gate weave: the live view shakes by a pixel at 12 fps like the cutscene frames do */
let weaveT=0;const canvas=()=>X.R&&X.R.domElement;
function weave(dt,on){const c=canvas();if(!c)return;if(!on||RMq.matches){if(c.style.transform)c.style.transform='';return}
  if((weaveT-=dt)>0)return;weaveT=1/12;c.style.transform=`translate(${(Math.random()*2-1).toFixed(2)}px,${(Math.random()*2-1).toFixed(2)}px)`}

/* ================= the shot ================= */
let fly=null,landedRun=false,warm=0,cutAt=0,ch1In=false;const cur={};
function apply(o){X.px=o.x;X.pz=o.z;X.yaw=o.yaw;X.pitch=o.pitch;const c=X.cam;
  // the core already placed the camera at (px, 1.6 + bob, pz) this frame: lift it by the shot's height so it lands on the same y
  c.position.x=o.x;c.position.z=o.z;c.position.y+=o.y-1.6;c.rotation.set(o.pitch,o.yaw,o.roll);c.updateMatrixWorld()}
function start(done,live){const s=st();fly={t:0,done,live,dressed:true};landedRun=false;
  hideUI(true);if(s)s.classList.remove('land');// (already hidden since chapter 1 began)
  pose(0,cur);X.px=cur.x;X.pz=cur.z;X.yaw=cur.yaw;X.pitch=cur.pitch;bedStart()}
// the camera ends on the gameplay pose; everything the shot borrowed goes back
function land(){if(!fly&&landedRun)return;const f=fly;fly=null;landedRun=true;
  // (called from prerender the core has just put the camera at eye height + bob, exactly as in play; only x/z/rotation are stale)
  X.px=LAND.px;X.pz=LAND.pz;X.yaw=LAND.yaw;X.pitch=LAND.pitch;const c=X.cam;c.position.x=LAND.px;c.position.z=LAND.pz;c.rotation.set(LAND.pitch,LAND.yaw,0);c.updateMatrixWorld();
  bedStop();shadowReset();weave(0,false);hideUI(false);const s=st();if(s)s.classList.add('land');return f}

X.on('engineShot',(name,done,live)=>{if(name!==SHOT)return;start(done,live)});
X.on('prerender',dt=>{
  if(ch1In||fly)hideUI(true);
  if(fly){const s=st();
    if(fly.live&&!fly.live()){land();return}// tapped/skipped: the story already moved on
    fly.t+=Math.min(.05,dt||.016);const t=Math.min(DUR,fly.t);
    if(t<DUR){pose(t,cur);apply(cur);birdGuard();shadowSet(cur.x,cur.z,cur.y);focusSet(cur);bedStep(t);
      if(t>=DUR-DRESS_OUT&&fly.dressed){fly.dressed=false;if(s)s.classList.add('land')}weave(dt,fly.dressed);return}
    // touchdown: the camera is on LAND; play starts on this very frame
    const f=land();if(f&&f.done)f.done();return}
  // prewarm: once the opening's first shot covers the screen, render one frame from each third of the path so the beach, the
  // sea and the far side of town have their textures and shaders up before the hard cut (nobody sees these frames)
  if(ch1In&&warm<3&&X.mode==='cutscene'&&cutAt&&performance.now()-cutAt>1500){const s=st();
    if(s&&!s.hidden&&s.classList.contains('on')&&!s.classList.contains('eng')){if(!warm)try{X.R.compile(X.scene,X.cam)}catch(e){}
      pose(warm*3.3,cur);apply(cur);
      X.px=LAND.px;X.pz=LAND.pz;X.yaw=LAND.yaw;X.pitch=LAND.pitch;warm++}}});
// the layer stays up a moment after the last shot: clear the landing classes once it has gone, and before any other cutscene
X.on('cutscene',on=>{const s=st();if(on){cutAt=performance.now();if(s&&!fly)s.classList.remove('land')}
  else{if(fly)land();setTimeout(()=>{const q=st();if(q&&!fly&&q.hidden!==false)q.classList.remove('land')},400)}});
// chapter 1: make the bed now (inside the PLAY click), and whatever happened to the shot, play starts facing the shop
X.on('chapter',(n,p)=>{if(n===1&&p==='in'){ch1In=true;warm=0;landedRun=false;bedMake();hideUI(true)}else{ch1In=false;if(!fly)hideUI(false)}
  if(n===1&&p==='play'){if(fly)land();else if(!landedRun){X.px=LAND.px;X.pz=LAND.pz;X.yaw=LAND.yaw;X.pitch=LAND.pitch;landedRun=true}}});
X.flyin={LAND,SHOT,DUR,KEYS,pose,get flying(){return !!fly},get t(){return fly?fly.t:-1},get bed(){return bed}};
})();
