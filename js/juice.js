/* juice mod: game feel, built only on window.TMV (see MOD API in index.html).
   - camera shake (trauma model) + zoom punches, applied in prerender on top of the core camera
   - intro cutscene the first time the container is opened (doors swing, vape avalanche, title slam), skippable
   - final-vape finish: slow-mo orbit + crane before the win screen, skippable
   - combo milestone stamps, grab stars, exhale squash/pop, Nicotine Rush speed lines,
     panic vignette + heartbeat, footsteps, little camera kick per tossed empty
   Tones itself down under prefers-reduced-motion.
   Extras for other mods: TMV.cine is true while the intro plays; TMV.emit('introdone') fires when it ends. */
(()=>{const J=window.TMV;if(!J)return;
const T=J.T,cam=J.cam,scene=J.scene,game=J.game,$=J.$,rand=J.rand,clamp=J.clamp,lerp=J.lerp,PI=Math.PI;
const RMq=matchMedia('(prefers-reduced-motion: reduce)'),rm=()=>RMq.matches;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x),back=x=>{x=clamp(x,0,1);const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const V=(x,y,z)=>new T.Vector3(x,y,z),WHITE=new T.Color(1,1,1);

/* ---------- DOM + CSS ---------- */
const css=document.createElement('style');css.textContent=`
.jz{position:absolute;pointer-events:none}
#jz-vig{inset:0;opacity:0;box-shadow:inset 0 0 16vmin 3vmin rgba(224,36,74,.9)}
#jz-speed{inset:-30%;opacity:0;will-change:transform,opacity;
 background:repeating-conic-gradient(rgba(255,247,234,0) 0deg 6.2deg,rgba(255,247,234,.7) 6.2deg 6.7deg),repeating-conic-gradient(rgba(255,247,234,0) 0deg 9.1deg,rgba(255,247,234,.45) 9.1deg 9.5deg);
 -webkit-mask:radial-gradient(closest-side,transparent 50%,#000 92%);mask:radial-gradient(closest-side,transparent 50%,#000 92%)}
#jz-flash{inset:0;opacity:0;background:#fff}
.jz-bar{left:0;right:0;height:9vh;background:#000;z-index:5;will-change:transform}
#jz-bt{top:0;transform:translateY(-100%)}#jz-bb{bottom:0;transform:translateY(100%)}
#jz-title{inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:6}
#jz-title b{font-family:var(--display);font-weight:400;font-size:clamp(44px,12vw,120px);line-height:.88;color:var(--hot);text-shadow:5px 5px 0 var(--lime),-2px -2px 0 var(--ink);opacity:0;max-width:92vw}
#jz-title i{font-style:normal;font-family:var(--display);font-size:clamp(18px,4vw,34px);color:var(--paper);text-shadow:3px 3px 0 var(--ink);opacity:0;margin-top:12px}
#jz-title.go b{animation:jzs 1.9s cubic-bezier(.2,.9,.3,1.1) forwards}
#jz-title.go i{animation:jzs 1.7s .18s cubic-bezier(.2,.9,.3,1.1) forwards}
@keyframes jzs{0%{opacity:0;transform:scale(3.4) rotate(-9deg)}12%{opacity:1;transform:scale(.9) rotate(-3deg)}20%{transform:scale(1.05) rotate(-2deg)}80%{opacity:1;transform:scale(1) rotate(-2deg)}100%{opacity:0;transform:scale(1.08) rotate(-2deg)}}
#jz-skip{right:max(16px,env(safe-area-inset-right,0px));bottom:calc(9vh + 10px);font-weight:800;font-size:12px;letter-spacing:.16em;color:var(--paper);opacity:0;transition:opacity .4s;z-index:6;text-shadow:1px 1px 0 var(--ink)}
.jz-cine #jz-skip{opacity:.75}
#jz-combo{right:max(16px,env(safe-area-inset-right,0px));top:178px;text-align:right;font-family:var(--display);color:var(--c,var(--lime));text-shadow:3px 3px 0 var(--ink);opacity:0;transform-origin:100% 50%;white-space:nowrap}
#jz-combo b{display:block;font-weight:400;font-size:clamp(34px,6.5vw,58px);line-height:.95;color:var(--paper);text-shadow:3px 3px 0 var(--c,var(--lime)),5px 5px 0 var(--ink)}
#jz-combo span{font-size:clamp(14px,2.6vw,20px);letter-spacing:.04em}
#jz-combo.go{animation:jzc 1.6s cubic-bezier(.2,.9,.3,1.2)}
@keyframes jzc{0%{opacity:0;transform:scale(2.6) rotate(-16deg)}12%{opacity:1;transform:scale(.9) rotate(-5deg)}20%{transform:scale(1.06) rotate(-6deg)}78%{opacity:1;transform:scale(1) rotate(-6deg)}100%{opacity:0;transform:translateY(-26px) rotate(-6deg)}}
@keyframes jzf{0%,100%{opacity:0}15%,80%{opacity:1}}
@media (max-width:520px){#jz-combo{top:140px}}
@media (prefers-reduced-motion:reduce){#jz-combo.go{animation-name:jzf}#jz-title.go b,#jz-title.go i{animation-name:jzf}}`;
document.head.appendChild(css);
const div=(id,cls,parent,before)=>{const d=document.createElement('div');d.id=id;d.className='jz '+(cls||'');(parent||game).insertBefore(d,before||null);return d};
const hudEl=$('hud');
const vig=div('jz-vig','',game,hudEl),speed=div('jz-speed','',game,hudEl),flash=div('jz-flash','',game,hudEl);
const barT=div('jz-bt','jz-bar',game,$('intro')),barB=div('jz-bb','jz-bar',game,$('intro'));let barK=0,barOn=false;
const title=div('jz-title','',game,$('intro'));title.innerHTML='<b></b><i></i>';
const skipEl=div('jz-skip','',game,$('intro'));skipEl.textContent=J.touch?'TAP TO SKIP':'CLICK / ANY KEY TO SKIP';
const comboEl=div('jz-combo','hud',hudEl);
function stinger(big,small){title.firstChild.textContent=big;title.lastChild.textContent=small||'';title.classList.remove('go');void title.offsetWidth;title.classList.add('go')}
function doFlash(col,a,ms){try{flash.style.background=col;flash.animate([{opacity:a},{opacity:0}],{duration:ms||260,easing:'ease-out'})}catch(e){}}
const cineOn=v=>{barOn=v;game.classList.toggle('jz-cine',v)};

/* ---------- camera shake, zoom punch, kick ---------- */
let trauma=0,kick=0,kickCD=0,zp=0,zoomBase=1,clk=0;
const shake=a=>{trauma=Math.min(1,trauma+a*(rm()?.35:1))};
const punch=z=>{zp+=z*(rm()?.4:1)};
const nz=(t,f,o)=>(Math.sin(t*f+o)+Math.sin(t*f*2.31+o*1.7)*.5+Math.sin(t*f*4.13+o*3.1)*.25)/1.75;
function applyCam(dt){
  if(trauma>0){const a=trauma*trauma,t=clk;cam.rotation.x+=a*.06*nz(t,23,0);cam.rotation.y+=a*.06*nz(t,19,3);cam.rotation.z+=a*.08*nz(t,17,7);
    cam.position.x+=a*.09*nz(t,29,11);cam.position.y+=a*.07*nz(t,31,13);trauma=Math.max(0,trauma-dt*1.6)}
  if(kick>1e-4){cam.rotation.x+=kick;kick*=Math.exp(-dt*18)}else kick=0;
  zp*=Math.exp(-dt*9);if(Math.abs(zp)<1e-3)zp=0;
  const z=zoomBase*(1+zp);if(Math.abs(cam.zoom-z)>1e-4){cam.zoom=z;cam.updateProjectionMatrix()}}

/* ---------- container doors + vape avalanche (intro) ---------- */
const CX=0,CZ=-6,FZ=CZ+1.3;
const hole=new T.Mesh(new T.PlaneGeometry(6.1,2.45),new T.MeshBasicMaterial({color:0x1a1220}));hole.position.set(CX,1.35,FZ+.1);scene.add(hole);
const doors=[-1,1].map(s=>{const p=new T.Group();p.position.set(CX+s*3.22,0,FZ+.17);scene.add(p);
  J.box(p,3.2,2.6,.08,0xd2452a,-s*1.6,1.35,0);for(let i=0;i<4;i++)J.box(p,.14,2.55,.14,0x8a2a14,-s*(.3+i*.82),1.35,.02);
  for(const x of[2.75,3.05])J.box(p,.07,2.35,.07,0xbfc4c9,-s*x,1.35,.1);J.box(p,.32,.12,.1,0x3a3340,-s*2.9,1.2,.16);
  J.inkify(p,.05,.06,60);p.userData.s=s;return p});
let doorsSolid=false;
function setDoors(k){for(const p of doors)p.rotation.y=p.userData.s*k*1.75;
  if(k>=1&&!doorsSolid){doorsSolid=true;for(const s of[-1,1])J.solid(CX+s*3.5,FZ+1.6,.6,3.2)}}
const NV=J.touch?90:170,VG=new T.BoxGeometry(.16,.22,.1),VM=J.M(0xffffff).clone(),AV=new T.InstancedMesh(VG,VM,NV);
AV.frustumCulled=false;AV.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(AV);
const VCOL=(Array.isArray(J.FLAV)&&J.FLAV.length?J.FLAV.map(f=>f[1]):[0xff3fa4,0xb6ff3c,0x5fd4ff,0xa070ff,0xffd23c]),_m=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_s=new T.Vector3(),_p=new T.Vector3(),_c=new T.Color();
const vp=[];for(let i=0;i<NV;i++){AV.setColorAt(i,_c.setHex(J.pick(VCOL)));vp.push({x:0,y:-5,z:0,vx:0,vy:0,vz:0,rx:0,ry:0,rz:0,wx:0,wy:0,wz:0,t0:0,on:false,rest:false})}
function vMat(i,o){_e.set(o.rx,o.ry,o.rz,'XYZ');_q.setFromEuler(_e);_p.set(o.x,o.y,o.z);_s.setScalar(o.on?1:0);AV.setMatrixAt(i,_m.compose(_p,_q,_s))}
for(let i=0;i<NV;i++)vMat(i,vp[i]);AV.instanceMatrix.needsUpdate=true;if(AV.instanceColor)AV.instanceColor.needsUpdate=true;
let spill=false,spilled=false,spillT=0;
function spillStart(){spill=spilled=true;spillT=0;for(const o of vp){o.on=false;o.rest=false;o.t0=1.3*Math.pow(Math.random(),1.7);o.x=CX+rand(-2.9,2.9);o.y=rand(.3,2.3);o.z=FZ+.35;
  o.vx=rand(-2.4,2.4)+(o.x-CX)*.35;o.vy=rand(-.5,3.6);o.vz=rand(3,10)*(o.y>1.4?1.15:.85);o.rx=rand(0,6);o.ry=rand(0,6);o.rz=rand(0,6);o.wx=rand(-14,14);o.wy=rand(-9,9);o.wz=rand(-14,14)}}
function spillStep(dt){spillT+=dt;let moving=0;
  for(let i=0;i<NV;i++){const o=vp[i];if(o.rest)continue;moving++;if(!o.on){if(spillT<o.t0)continue;o.on=true}
    o.vy-=16*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;o.rx+=o.wx*dt;o.ry+=o.wy*dt;o.rz+=o.wz*dt;
    if(o.y<.06){o.y=.06;if(o.vy<-1.6){o.vy*=-.3;o.vx*=.6;o.vz*=.6;o.wx*=.5;o.wz*=.5}else{o.vy=0;const f=Math.max(0,1-dt*9);o.vx*=f;o.vz*=f;o.wx*=f;o.wy*=f;o.wz*=f;
      if(Math.abs(o.vx)+Math.abs(o.vz)<.15){o.rest=true;o.rx=PI/2;o.rz=0;o.y=.05}}}
    vMat(i,o)}
  AV.instanceMatrix.needsUpdate=true;if(!moving)spill=false}
function spillFinish(){if(!spilled)spillStart();for(let k=0;k<600&&spill;k++)spillStep(1/60)}

/* ---------- intro cutscene ---------- */
const P0=V(-8,6.5,15),P1=V(0,2.3,3.4),P2=V(.5,2.0,1.7),P3=V(5.2,3.3,8.2),L0=V(CX,1.2,CZ),L1=V(CX,1.3,CZ+1),L3=V(CX,.8,CZ+3);
const cp=new T.Vector3(),ct=new T.Vector3(),cq=new T.Quaternion(),pq=new T.Quaternion(),UP=V(0,1,0),LM=new T.Matrix4();
const lookQ=(eye,tg,out)=>out.setFromRotationMatrix(LM.lookAt(eye,tg,UP));
const playerQ=out=>{_e.set(J.pitch,J.yaw,0,'YXZ');return out.setFromEuler(_e)};
let introDone=false,cine=null,fin=null;
const CINE_LEN=4.75;
function cineStart(){if(J.mode!=='play')return;introDone=true;
  cine={t:0,ev:{}};J.mode='cutscene';J.cine=true;hudEl.style.transition='opacity .35s';hudEl.style.opacity='0';J.armR.visible=false;J.armL.visible=false;cineOn(true)}
function cineEnd(){if(!cine)return;cine=null;J.cine=false;setDoors(1);spillFinish();title.classList.remove('go');
  if(J.mode==='cutscene')J.mode='play';hudEl.style.opacity='';J.armR.visible=true;cineOn(false);zoomBase=1;J.emit('introdone')}
function cineStep(dt){const c=cine,t=c.t+=dt,ev=c.ev,once=(k,at)=>!ev[k]&&t>=at&&(ev[k]=1);
  if(t<1.6){const k=ease(t/1.6);cp.lerpVectors(P0,P1,k);ct.copy(L0)}
  else if(t<2.8){const k=ease((t-1.6)/1.2);cp.lerpVectors(P1,P2,k);ct.lerpVectors(L0,L1,k)}
  else if(t<3.95){const k=ease((t-2.8)/1.15);cp.lerpVectors(P2,P3,k);ct.lerpVectors(L1,L3,k)}
  else{cp.copy(P3);ct.copy(L3)}
  lookQ(cp,ct,cq);
  if(t>=3.95){const k=ease((t-3.95)/(CINE_LEN-3.95));playerQ(pq);cq.slerp(pq,k);cp.lerp(_p.set(J.px,1.6,J.pz),k)}
  cam.position.copy(cp);cam.quaternion.copy(cq);
  if(once('creak',1.45))J.slide(70,52,.5,'sawtooth',.035);
  if(t>=1.5)setDoors(back((t-1.5)/.45));
  if(once('spill',1.62)){spillStart();for(let i=0;i<26;i++)J.beep(rand(1500,2800),.03,'square',.008,rand(0,1.4))}
  if(once('slam',1.82)){if(!J.clip('sfx/slam',{vol:.75}))J.beep(90,.5,'sawtooth',.08);shake(.55);punch(.06)}
  if(once('title',2.75)){stinger('TOO MANY VAPES','5,000 TO GO');if(!J.clip('sfx/perfect_sting',{vol:.45}))J.beep(392,.4,'sawtooth',.05);shake(.25);punch(.05)}
  if(t>=CINE_LEN)cineEnd()}

/* ---------- final-vape finish ---------- */
const FIN_LEN=3.9,fe=new T.Vector3(),ft=new T.Vector3(),fo=new T.Vector3();
function finStart(){const n=J.held;fe.set(J.px,1.6,J.pz);
  if(n){J.mouth(n,ft);n.state='exhale';n.exI=1.6*(n.t.cloud||1);n.ex=3.2;n.ringT=0;n.side=1;if(n.col)n.col.setHex(J.flav[1]).lerp(WHITE,.4);n.emo='🏆'}
  else ft.set(J.px-Math.sin(J.yaw)*3,1.3,J.pz-Math.cos(J.yaw)*3);
  fo.subVectors(fe,ft);fo.y=0;if(fo.lengthSq()<.01)fo.set(0,0,1);
  fin={t:0,n,len:fo.length(),hid:false};fo.normalize();
  if('slow' in J&&!rm())J.slow=2.2;
  J.armR.visible=false;J.armL.visible=false;cineOn(true);doFlash('#fff',.85,500);shake(.5);
  J.beep(55,1,'sine',.12);J.slide(900,120,1.3,'sine',.04);
  stinger('THE LAST VAPE','is gone.');
  for(let i=0;i<14;i++)J.emo(J.pick(['🎉','💨','🏆','✨']),ft.x,ft.y+.2,ft.z,rand(-2.5,2.5),rand(1.5,4),rand(-2.5,2.5),rand(.35,.6));
  for(let i=0;i<40;i++){const a=i/40*PI*2;J.puff(ft.x,ft.y,ft.z,Math.cos(a)*rand(3,6),rand(0,2.2),Math.sin(a)*rand(3,6),_c.setHSL(i/40,.95,.62),rand(1.8,3),.2,rand(.8,1.6))}}
function finEnd(){if(!fin)return;const f=fin;fin=null;zoomBase=1;cineOn(false);J.armR.visible=true;title.classList.remove('go');if('slow' in J)J.slow=0;
  if(f.hid&&J.mode==='won')$('win').hidden=false}
function finStep(dt){const f=fin,t=f.t+=dt,w=$('win');
  if(!f.hid&&w&&!w.hidden){w.hidden=true;f.hid=true}
  if(f.n){J.mouth(f.n,_p);ft.lerp(_p,Math.min(1,dt*4))}
  const a=t<2.2?ease(t/2.2):1,ang=a*.95,d=lerp(f.len,Math.max(1.5,f.len*.6),a),ca=Math.cos(ang),sa=Math.sin(ang);
  cp.set(ft.x+(fo.x*ca-fo.z*sa)*d,lerp(1.6,ft.y+.4,a),ft.z+(fo.x*sa+fo.z*ca)*d);zoomBase=lerp(1,1.45,a);
  if(t>2.2){const k=ease((t-2.2)/(FIN_LEN-2.2));cp.lerp(_s.set(ft.x+(fo.x*ca-fo.z*sa)*12,20,ft.z+(fo.x*sa+fo.z*ca)*12),k);zoomBase=lerp(1.45,1,k)}
  lookQ(cp,ft,cq);cam.position.copy(cp);cam.quaternion.copy(cq);
  if(t>=FIN_LEN)finEnd()}

/* skip: any click/tap/key during a sequence (ignores the click that started it) */
const skip=()=>{if(cine&&cine.t>.35)cineEnd();else if(fin&&fin.t>.4)finEnd()};
addEventListener('pointerdown',skip,true);addEventListener('keydown',e=>{if(!e.repeat)skip()},true);

/* ---------- combo stamps ---------- */
const TIERS=[[3,'TRIPLE CLOUD','#b6ff3c'],[5,'CLOUD FIVE','#5fd4ff'],[10,'TEN-LUNG STREAK','#ff3fa4'],[15,'HAZE CRAZE','#a070ff'],[20,'FOG LORD','#ff7a1a'],[30,'WEATHER EVENT','#ffe04a'],[50,'NATIONAL EMERGENCY','#ff3fa4']];
let tierI=0;
function comboWatch(){const c=J.combo;while(tierI>0&&c<TIERS[tierI-1][0])tierI--;
  let hit=-1;while(tierI<TIERS.length&&c>=TIERS[tierI][0])hit=tierI++;
  if(hit<0)return;const[n,label,col]=TIERS[hit];comboEl.style.setProperty('--c',col);comboEl.innerHTML='<b>x'+n+' COMBO</b><span>'+label+'</span>';
  comboEl.classList.remove('go');void comboEl.offsetWidth;comboEl.classList.add('go');
  const base=[523,587,659,784,880,988,1175][hit];[1,1.26,1.5,2].forEach((m,i)=>J.beep(base*m,.12,'square',.022,i*.06));
  try{$('mult').animate([{transform:'scale(1.6) rotate(-6deg)'},{transform:'scale(1)'}],{duration:380,easing:'cubic-bezier(.2,.9,.3,1.3)'})}catch(e){}
  punch(.03+hit*.006)}

/* ---------- squash & pop ---------- */
const squ=[];
function squash(n,amp){const g=n.g;let s=squ.find(q=>q.g===g);if(!s){s={g,b:g.scale.x,t:0,a:amp};squ.push(s)}else{s.t=0;s.a=amp}}
function squStep(dt){for(let i=squ.length-1;i>=0;i--){const s=squ[i];s.t+=dt;if(s.t>.9){s.g.scale.setScalar(s.b);squ.splice(i,1);continue}
  const v=s.a*Math.exp(-s.t*7)*Math.cos(s.t*24);s.g.scale.set(s.b*(1+v*.8),s.b*(1-v),s.b*(1+v*.8))}}
const mv=new T.Vector3();
function burst(n,k){J.mouth(n,mv);const col=n.col||WHITE,N=J.touch?10:16;for(let i=0;i<N;i++){const a=i/N*PI*2;J.puff(mv.x,mv.y,mv.z,Math.cos(a)*k*3.2,rand(-.4,.9),Math.sin(a)*k*3.2,col,rand(.8,1.4),.15,.9*k)}}

/* ---------- events ---------- */
let lastX=J.px,lastZ=J.pz,stepAcc=0,stepSide=1,lastCount=J.count,beatT=0,moving=false;
J.on('start',()=>{if(fin)finEnd();tierI=0;lastCount=J.count;lastX=J.px;lastZ=J.pz;if(!introDone)cineStart()});
J.on('win',()=>{if(cine)cineEnd();if(!fin)finStart()});
J.on('grab',n=>{J.mouth(n,mv);for(let i=0;i<5;i++){const a=rand(0,PI*2);J.emo(J.pick(['⭐','✨','💥']),mv.x,mv.y+.15,mv.z,Math.cos(a)*rand(1,2.4),rand(.8,2.2),Math.sin(a)*rand(1,2.4),rand(.22,.34))}
  J.slide(420,1150,.09,'triangle',.035);shake(.12);punch(.035)});
J.on('release',(n,kind)=>{if(kind==='passive')return;const f=n.t&&n.t.cap?n.inh/n.t.cap:.5;
  if(kind==='perfect'){squash(n,.32);burst(n,1);shake(.32);punch(.07);J.slide(220,90,.18,'sine',.06);J.mouth(n,mv);J.emo('💥',mv.x,mv.y+.2,mv.z,0,1.5,0,.6)}
  else if(kind==='over'){squash(n,.38);burst(n,1.2);shake(.3);punch(-.04)}
  else if(f>.45){squash(n,.16);burst(n,.6)}});
J.on('bust',()=>{shake(.75);punch(-.07);doFlash('#e0244a',.45,420);J.beep(70,.35,'sine',.09)});
J.on('pickup',()=>{shake(.1);punch(.05)});
J.on('vape',()=>{if(kickCD>0||rm())return;kickCD=.22;kick+=.0045});

/* ---------- per-frame (play only): footsteps, combo, second-container slam, heartbeat ---------- */
J.on('frame',(dt)=>{
  const dx=J.px-lastX,dz=J.pz-lastZ,d=Math.hypot(dx,dz);lastX=J.px;lastZ=J.pz;moving=d>dt*1.5;
  if(d<1.5&&moving&&J.stun<=0){stepAcc+=d;const stride=d/Math.max(dt,1e-3)>9?2.5:2.05;
    if(stepAcc>stride){stepAcc=0;stepSide=-stepSide;J.slide(rand(130,160),52,.07,'triangle',J.touch?.02:.03,0,stepSide*.12);J.beep(rand(1900,2500),.012,'square',.0035)}}
  else if(!moving)stepAcc=Math.min(stepAcc,1.2);
  comboWatch();
  if(J.count>lastCount+400){shake(.85);punch(-.06);doFlash('#fff',.5,350)}lastCount=J.count;
  const h=J.heat;if(h>.8){beatT-=dt;if(beatT<=0){beatT=60/(80+h*60);J.beep(58,.13,'sine',.045);J.beep(50,.12,'sine',.035,.14)}}else beatT=0;
  kickCD-=dt});

/* ---------- prerender: sequences, overlays, then camera offsets ---------- */
let lastNow=performance.now(),spd=0,sjT=0;
J.on('prerender',()=>{const now=performance.now(),rdt=Math.min(.05,(now-lastNow)/1000);lastNow=now;clk+=rdt;
  if(cine){if(J.mode!=='cutscene')cineEnd();else{cineStep(rdt);if(cine)J.armR.visible=false}}
  if(fin){if(J.mode!=='won')finEnd();else finStep(rdt)}
  if(spill)spillStep(rdt);
  if(!VM.map&&J.labelMat&&J.labelMat.map){VM.map=J.labelMat.map;VM.needsUpdate=true}
  squStep(rdt);
  {const k=lerp(barK,barOn?1:0,Math.min(1,rdt*9));if(Math.abs(k-barK)>1e-4||(k!==barK&&(k<1e-3||k>.999))){barK=k<1e-3?0:k>.999?1:k;const y=((1-barK)*100).toFixed(2);barT.style.transform=`translateY(-${y}%)`;barB.style.transform=`translateY(${y}%)`}}
  const play=J.mode==='play';
  // panic vignette, pulsing faster as the town loses it
  const hv=play?clamp((J.heat-.5)/.5,0,1):0,pul=rm()?.8:.6+.4*Math.sin(clk*(4+J.heat*5)),vo=(hv*pul*.85).toFixed(3);if(vig.style.opacity!==vo)vig.style.opacity=vo;
  // nicotine rush speed lines, stronger while moving
  const rush=play&&J.act&&J.act.rush>0;spd=lerp(spd,rush?1:0,Math.min(1,rdt*6));
  if(spd>.01){sjT-=rdt;if(sjT<=0&&!rm()){sjT=.05;speed.style.transform=`rotate(${rand(0,20).toFixed(1)}deg) scale(${rand(1,1.06).toFixed(3)})`}
    speed.style.opacity=(spd*(moving?1:.4)*(rm()?.35:.55)).toFixed(3)}
  else if(speed.style.opacity!=='0')speed.style.opacity='0';
  applyCam(rdt)});
})();
