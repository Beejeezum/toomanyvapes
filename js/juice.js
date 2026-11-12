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
#jz-vig{inset:0;opacity:0}#jz-vig svg,#jz-speed svg{position:absolute;inset:0;width:100%;height:100%}
#jz-speed{inset:-12%;opacity:0;will-change:transform,opacity}
#jz-flash{inset:0;opacity:0;pointer-events:none}#jz-flash svg{position:absolute;inset:0;width:100%;height:100%}
.jz-cf{position:absolute;left:50%;top:50%;pointer-events:none;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.3))}
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
const skipEl=div('jz-skip','',game,$('intro'));skipEl.textContent='▸▸';
const comboEl=div('jz-combo','hud',hudEl);
function stinger(big,small){title.firstChild.textContent=big;title.lastChild.textContent=small||'';title.classList.remove('go');void title.offsetWidth;title.classList.add('go')}
/* ---------- handmade overlays: every flash, vignette and speed line is cut paper and moves on twos ---------- */
const PAPER=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const k=c.getContext('2d');const im=k.createImageData(256,256);
  for(let i=0;i<im.data.length;i+=4){const v=200+Math.random()*55|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}k.putImageData(im,0,0);
  k.globalAlpha=.18;for(let i=0;i<260;i++){k.strokeStyle=Math.random()<.5?'#fff':'#8a7a66';k.lineWidth=Math.random()*1.2+.3;k.beginPath();const x=Math.random()*256,y=Math.random()*256,a=Math.random()*6.3,l=4+Math.random()*14;k.moveTo(x,y);k.quadraticCurveTo(x+Math.cos(a+1)*l/2,y+Math.sin(a+1)*l/2,x+Math.cos(a)*l,y+Math.sin(a)*l);k.stroke()}
  return c.toDataURL()})();
const SVGNS='http://www.w3.org/2000/svg';
function paperSVG(el,id){const sv=document.createElementNS(SVGNS,'svg');sv.setAttribute('viewBox','0 0 100 100');sv.setAttribute('preserveAspectRatio','none');
  sv.innerHTML=`<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="30" height="30"><image href="${PAPER}" width="30" height="30"/></pattern></defs><g></g>`;el.appendChild(sv);return sv}
const jag=(pts,j)=>pts.map(([x,y])=>`${(x+(Math.random()-.5)*j).toFixed(2)},${(y+(Math.random()-.5)*j).toFixed(2)}`).join(' ');
// torn frame (outer rect + ragged inner hole), a few pre-cut variants we step between
function frameVariants(inset,n){const out=[];for(let v=0;v<n;v++){const inner=[];const N=36;for(let i=0;i<N;i++){const t=i/N;let x,y;
    if(t<.25){x=inset+t*4*(100-2*inset);y=inset}else if(t<.5){x=100-inset;y=inset+(t-.25)*4*(100-2*inset)}else if(t<.75){x=100-inset-(t-.5)*4*(100-2*inset);y=100-inset}else{x=inset;y=100-inset-(t-.75)*4*(100-2*inset)}
    inner.push([x,y])}out.push(`M-2,-2 L102,-2 L102,102 L-2,102 Z M${jag(inner,inset*.9).split(' ').join(' L')} Z`)}return out}
const VIGF=frameVariants(9,4);
const vigSV=paperSVG(vig,'jzpv');vigSV.querySelector('g').innerHTML=`<path fill-rule="evenodd" fill="#e0244a"/><path fill-rule="evenodd" fill="url(#jzpv)" style="mix-blend-mode:multiply" opacity=".9"/>`;
let vigI=0,vigT=0;function vigStep(){const d=VIGF[vigI=(vigI+1)%VIGF.length];vigSV.querySelectorAll('path').forEach(p=>p.setAttribute('d',d))}vigStep();
// speed lines: cut cream paper strips radiating from the edges
const spSV=paperSVG(speed,'jzps');function spCut(){let h='';for(let i=0;i<26;i++){const a=i/26*Math.PI*2+Math.random()*.12,w=.035+Math.random()*.03,r0=34+Math.random()*10,r1=80;
    const p=(r,aa)=>`${(50+Math.cos(aa)*r).toFixed(1)},${(50+Math.sin(aa)*r).toFixed(1)}`;h+=`<polygon points="${p(r0,a)} ${p(r1,a-w)} ${p(r1,a+w)}" fill="#fff7ea"/>`}
  spSV.querySelector('g').innerHTML=h+`<rect width="100" height="100" fill="url(#jzps)" style="mix-blend-mode:multiply" opacity=".55"/>`}spCut();
// flash: a torn paper frame slams in for a few stepped frames, plus cut-paper confetti from the centre
const flSV=paperSVG(flash,'jzpf');
function doFlash(col,a,ms){try{const d=frameVariants(14,1)[0];flSV.querySelector('g').innerHTML=`<path fill-rule="evenodd" d="${d}" fill="${col}"/><path fill-rule="evenodd" d="${d}" fill="url(#jzpf)" style="mix-blend-mode:multiply"/>`;
  flash.animate([{opacity:Math.min(1,a+.2)},{opacity:a*.7,offset:.34},{opacity:0}],{duration:ms||300,easing:'steps(3,end)'});
  if(true)return;/* no confetti from the centre (user: no shapes popping mid-screen) */for(let i=0;i<10;i++){const c=document.createElement('div');c.className='jz-cf';const w=10+Math.random()*16,h=6+Math.random()*12;
    c.style.cssText+=`width:${w}px;height:${h}px;background:${i%3?col:'#fff7ea'} url(${PAPER});background-blend-mode:multiply;background-size:40px;clip-path:polygon(${jag([[0,0],[100,0],[100,100],[0,100]],22).split(' ').map(q=>q.split(',').map(v=>v+'%').join(' ')).join(',')})`;
    game.appendChild(c);const an=Math.random()*6.28,dist=120+Math.random()*220,rot=(Math.random()-.5)*540;
    c.animate([{transform:'translate(-50%,-50%) rotate(0deg)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(an)*dist}px),calc(-50% + ${Math.sin(an)*dist+60}px)) rotate(${rot}deg)`,opacity:0}],{duration:650,easing:'steps(8,end)'}).onfinish=()=>c.remove()}}catch(e){}}
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
// looking into the container: the inside of a big corrugated card box in shadow (ribbed walls, cartons stacked at the back), not a flat black
const holeT=(()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const k=c.getContext('2d'),w=512,h=256,bx0=w*.3,bx1=w*.7,by0=h*.26,by1=h*.72;
  const poly=(pts,col)=>{k.beginPath();for(const[x,y]of pts)k.lineTo(x,y);k.closePath();k.fillStyle=col;k.fill()};
  poly([[0,0],[w,0],[bx1,by0],[bx0,by0]],'#21160e');poly([[0,h],[w,h],[bx1,by1],[bx0,by1]],'#3b2919');poly([[0,0],[bx0,by0],[bx0,by1],[0,h]],'#2f2015');poly([[w,0],[bx1,by0],[bx1,by1],[w,h]],'#271b12');
  k.fillStyle='#352417';k.fillRect(bx0,by0,bx1-bx0,by1-by0);k.lineWidth=2;
  for(let i=0;i<=20;i++){const u=i/20;k.strokeStyle='rgba(12,8,4,.45)';k.beginPath();k.moveTo(bx0+(bx1-bx0)*u,by0);k.lineTo(bx0+(bx1-bx0)*u,by1);k.stroke();
    k.strokeStyle='rgba(90,65,40,.3)';k.beginPath();k.moveTo(0,h*u);k.lineTo(bx0,by0+(by1-by0)*u);k.moveTo(w,h*u);k.lineTo(bx1,by0+(by1-by0)*u);k.stroke()}
  const C=['#5a2a40','#4a5a24','#24506a','#3f3060','#6a5a24'];for(let r=0;r<3;r++)for(let i=0;i<9;i++){const bw=(bx1-bx0)/9,x=bx0+i*bw+J.rand(-2,2),y=by1-(r+1)*18+J.rand(-1,1);if(Math.random()<.25)continue;
    k.fillStyle=J.pick(C);k.fillRect(x+1,y,bw-3,16);k.fillStyle='rgba(255,255,255,.08)';k.fillRect(x+1,y,bw-3,3)}
  const g=k.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,w*.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');k.fillStyle=g;k.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){k.fillStyle=`rgba(${Math.random()<.5?'140,105,70':'0,0,0'},.08)`;k.fillRect(J.rand(0,w),J.rand(0,h),J.rand(1,3),1)}
  const t=new T.CanvasTexture(c);t.anisotropy=4;return t})();
const hole=new T.Mesh(new T.PlaneGeometry(6.1,2.45),new T.MeshBasicMaterial({map:holeT}));hole.position.set(CX,1.35,FZ+.1);scene.add(hole);
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
  if(once('title',2.75)){stinger('TOO MANY VAPES','');if(!J.clip('sfx/perfect_sting',{vol:.45}))J.beep(392,.4,'sawtooth',.05);shake(.25);punch(.05)}
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
  stinger('ZERO','');
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
const TIERS=[[5,'CLOUD FIVE','#5fd4ff'],[10,'TEN-LUNG STREAK','#ff3fa4'],[20,'FOG LORD','#ff7a1a'],[50,'NATIONAL EMERGENCY','#ff3fa4']];
let tierI=0;
function comboWatch(){const c=J.combo;while(tierI>0&&c<TIERS[tierI-1][0])tierI--;
  let hit=-1;while(tierI<TIERS.length&&c>=TIERS[tierI][0])hit=tierI++;
  if(hit<0)return;const[n,label,col]=TIERS[hit];comboEl.style.setProperty('--c',col);comboEl.innerHTML='<b>x'+n+'</b>';
  comboEl.classList.remove('go');void comboEl.offsetWidth;comboEl.classList.add('go');
  const base=[587,784,988,1175][hit];[1,1.26,1.5,2].forEach((m,i)=>J.beep(base*m,.12,'square',.022,i*.06));
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
J.playIntro=()=>{if(!introDone)cineStart()};
J.on('start',()=>{if(fin)finEnd();tierI=0;lastCount=J.count;lastX=J.px;lastZ=J.pz;if(!introDone)setTimeout(cineStart,0)});
J.on('win',()=>{if(cine)cineEnd();if(!fin)finStart()});
J.on('grab',n=>{
  J.slide(420,1150,.09,'triangle',.035);shake(.12);punch(.035)});
J.on('release',(n,kind)=>{if(kind==='passive')return;const f=n.t&&n.t.cap?n.inh/n.t.cap:.5;
  if(kind==='perfect'){squash(n,.32);burst(n,1);shake(.32);punch(.07);J.slide(220,90,.18,'sine',.06);}
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
  const hv=play?clamp((J.heat-.5)/.5,0,1):0,pul=rm()?.8:.6+.4*Math.sin(clk*(4+J.heat*5)),vo=(hv*pul*.85).toFixed(3);vigT-=rdt;if(vigT<=0){vigT=.1;const q=(Math.round(vo*8)/8).toFixed(3);if(vig.style.opacity!==q)vig.style.opacity=q;if(+q>0&&!rm())vigStep()}
  // nicotine rush speed lines, stronger while moving
  const rush=play&&J.act&&J.act.rush>0;spd=lerp(spd,rush?1:0,Math.min(1,rdt*6));
  if(spd>.01){sjT-=rdt;if(sjT<=0&&!rm()){sjT=.083;if(Math.random()<.5)spCut();speed.style.transform=`rotate(${rand(0,20).toFixed(1)}deg) scale(${rand(1,1.06).toFixed(3)})`}
    speed.style.opacity=(spd*(moving?1:.4)*(rm()?.35:.55)).toFixed(3)}
  else if(speed.style.opacity!=='0')speed.style.opacity='0';
  applyCam(rdt)});
})();
