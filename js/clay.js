/* clay mod: turns the cel-shaded town into a handmade stop-motion tabletop set.
   - every MeshToonMaterial (now and later) is patched in place: soft wrapped lighting with a little waxy sheen, a procedural plasticine
     surface (fingerprints, dents, smudges) sampled triplanar in object space, or a bump taken from its own craft texture (felt, sand, card)
   - ink outline hulls are removed; town textures are repainted on canvas as felt, painted board, sand grains, popsicle sticks, card
   - one warm studio key lamp with soft shadows that follows the player, plus a cool fill
   - tilt-shift depth of field as a cheap post pass (desktop only; switches itself off when frames get slow)
   - creatures, cars and smoke puffs are posed "on twos" (12 fps) with a little clay boil, while camera and player stay smooth
   - vape puffs and sky clouds become lumpy cotton wool
   Built only on window.TMV (plus TMV.TXS, the core's tiling textures). Exposes TMV.clay for debugging. */
(()=>{const X=window.TMV;if(!X||X.clay)return;
const T=X.T,{scene,R,cam,W,npcs,puffs,rand,clamp,lerp}=X,PI=Math.PI,touch=X.touch;
const C2=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h||w;return c};
const hsl=(h,s,l,a)=>`hsla(${h},${s}%,${l}%,${a==null?1:a})`;
// draw something on a tiling canvas: repeat it across the wrap edges it touches
const W9=(n,x,y,r,f)=>{for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=x+i*n,b=y+j*n;if(a+r<0||a-r>n||b+r<0||b-r>n)continue;f(a,b)}};
const blob=(k,x,y,r,c0,c1)=>{const g=k.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c0);g.addColorStop(1,c1);k.fillStyle=g;k.fillRect(x-r,y-r,r*2,r*2)};

/* =================== CLAY SURFACE TEXTURE (R: plasticine height, G: paper/fibre grain) =================== */
function clayHeight(n){const c=C2(n),k=c.getContext('2d');k.fillStyle='#808080';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<70;i++){const x=rand(0,n),y=rand(0,n),r=rand(8,34),v=Math.random()<.5?255:0,a=rand(.06,.16);W9(n,x,y,r,(p,q)=>blob(k,p,q,r,`rgba(${v},${v},${v},${a})`,`rgba(${v},${v},${v},0)`))}
  // thumb smudges: soft wide curved strokes
  for(let i=0;i<26;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),L=rand(16,46),v=Math.random()<.5?255:0;k.strokeStyle=`rgba(${v},${v},${v},${rand(.05,.11)})`;k.lineWidth=rand(5,12);
    W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.quadraticCurveTo(p+Math.cos(a+.6)*L*.6,q+Math.sin(a+.6)*L*.6,p+Math.cos(a)*L,q+Math.sin(a)*L);k.stroke()})}
  // fingerprints: whorls of thin concentric ridges, partly smeared out
  for(let i=0;i<11;i++){const x=rand(0,n),y=rand(0,n),rot=rand(0,PI),sq=rand(.6,.85),R=rand(13,22),st=rand(0,PI*2),arc=rand(2.2,5.2);
    W9(n,x,y,R+2,(p,q)=>{k.save();k.translate(p,q);k.rotate(rot);k.scale(1,sq);for(let j=1;j*1.75<R;j++){const r=j*1.75;k.lineWidth=.8;
      k.strokeStyle=`rgba(0,0,0,${(.36*(1-r/R)+.06).toFixed(3)})`;k.beginPath();k.arc(0,0,r,st+j*.18,st+j*.18+arc);k.stroke();
      k.strokeStyle=`rgba(255,255,255,${(.22*(1-r/R)).toFixed(3)})`;k.beginPath();k.arc(0,.9,r,st+j*.18,st+j*.18+arc);k.stroke()}k.restore()})}
  // modelling-tool scratches
  for(let i=0;i<16;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),L=rand(6,20);W9(n,x,y,L,(p,q)=>{const ex=p+Math.cos(a)*L,ey=q+Math.sin(a)*L;
    k.lineWidth=1.1;k.strokeStyle='rgba(0,0,0,.28)';k.beginPath();k.moveTo(p,q);k.lineTo(ex,ey);k.stroke();k.strokeStyle='rgba(255,255,255,.2)';k.beginPath();k.moveTo(p+.8,q+.8);k.lineTo(ex+.8,ey+.8);k.stroke()})}
  // dents and pits
  for(let i=0;i<40;i++){const x=rand(0,n),y=rand(0,n),r=rand(1.2,4.5);W9(n,x,y,r+2,(p,q)=>{blob(k,p+r*.25,q+r*.25,r*1.3,'rgba(255,255,255,.25)','rgba(255,255,255,0)');blob(k,p,q,r,'rgba(0,0,0,.45)','rgba(0,0,0,0)')})}
  for(let i=0;i<n*n/14;i++){const v=Math.random()<.5?255:0;k.fillStyle=`rgba(${v},${v},${v},.04)`;k.fillRect(rand(0,n),rand(0,n),1,1)}
  return soft(c,.6)}
// a slight blur (tiling-safe: blur a 3x3 mosaic and keep the middle) so the bump reads as pressed clay, not grit
function soft(c,r){const n=c.width,k=c.getContext('2d');if(!('filter' in k))return k.getImageData(0,0,n,n).data;const m=C2(n*3),q=m.getContext('2d');for(let i=0;i<3;i++)for(let j=0;j<3;j++)q.drawImage(c,i*n,j*n);
  const o=C2(n),ok=o.getContext('2d');ok.filter=`blur(${r}px)`;ok.drawImage(m,-n,-n);return ok.getImageData(0,0,n,n).data}
function paperGrain(n){const c=C2(n),k=c.getContext('2d');k.fillStyle='#808080';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<40;i++){const x=rand(0,n),y=rand(0,n),r=rand(10,40),v=Math.random()<.5?255:0;W9(n,x,y,r,(p,q)=>blob(k,p,q,r,`rgba(${v},${v},${v},.08)`,`rgba(${v},${v},${v},0)`))}
  for(let i=0;i<n*n/9;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),L=rand(1.5,5),v=Math.random()<.5?255:0;k.strokeStyle=`rgba(${v},${v},${v},${rand(.08,.22).toFixed(2)})`;k.lineWidth=rand(.4,.9);
    W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.lineTo(p+Math.cos(a)*L,q+Math.sin(a)*L);k.stroke()})}
  return k.getImageData(0,0,n,n).data}
const CLAYT=(()=>{const n=256,a=clayHeight(n),b=paperGrain(n),d=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){d[i*4]=a[i*4];d[i*4+1]=b[i*4];d[i*4+2]=128;d[i*4+3]=255}
  const t=new T.DataTexture(d,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(4,R.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t})();

/* =================== MATERIAL PATCH ===================
   p = (bump strength, triplanar tiles per unit, how much bump comes from the material's own map, waxy sheen); q = (paper grain vs clay, albedo variation) */
const KIND={
  clay:[.04,1.15,0,1,0,.24], vc:[.036,1.15,0,.8,0,.22], cloth:[.026,1.4,0,.5,.3,.15],
  felt:[.06,2,.9,0,1,.12], sand:[.035,2,1,.15,1,.08], road:[.05,1,.55,.35,0,.14], tile:[.04,1,.55,.2,.5,.1], wood:[.035,1.5,.7,.35,1,.08],
  leaf:[.055,1.3,.7,.6,0,.14], water:[.03,1,.65,1.2,0,.06], paper:[.018,2.5,.3,.1,1,.1], corr:[.045,1,.85,.3,1,.08], hay:[.06,2,.9,0,1,.1]};
const setKind=(m,kind)=>{const v=KIND[kind]||KIND.clay;const u=m.userData.clay||(m.userData.clay={p:new T.Vector4(),q:new T.Vector4()});u.kind=kind;u.p.set(v[0],v[1],v[2],v[3]);u.q.set(v[4],v[5],0,0)};
const LITE=touch?'#define CLAY_LITE\n':'';
const CLAY_FRAG_PARS=`uniform sampler2D clayT;uniform vec4 clayP;uniform vec4 clayQ;varying vec3 vClayP;varying vec3 vClayN;
float clayTri(){vec3 n=abs(normalize(vClayN+1e-5));vec3 p=vClayP*clayP.y;
#ifdef CLAY_LITE
 vec2 s=texture2D(clayT,n.x>n.y&&n.x>n.z?p.yz:(n.y>n.z?p.zx:p.xy)).rg;
#else
 vec3 w=n*n*n*n;w/=w.x+w.y+w.z;vec2 s=texture2D(clayT,p.yz).rg*w.x+texture2D(clayT,p.zx).rg*w.y+texture2D(clayT,p.xy).rg*w.z;
#endif
 return mix(s.r,s.g,clayQ.x);}
vec3 clayBump(vec3 sp,vec3 sn,float h,float fd){vec2 dH=vec2(dFdx(h),dFdy(h));vec3 sx=dFdx(sp),sy=dFdy(sp);vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1)*fd;
 vec3 g=sign(det)*(dH.x*r1+dH.y*r2);return normalize(abs(det)*sn-g);}`;
// soft wrapped key light, a warm glow where light turns to shade (clay is a little translucent), and a broad waxy highlight
const CLAY_LIGHTS=`varying vec3 vViewPosition;
#ifndef FLAT_SHADED
 varying vec3 vNormal;
#endif
struct ToonMaterial{vec3 diffuseColor;};
void RE_Direct_Toon(const in IncidentLight directLight,const in GeometricContext geometry,const in ToonMaterial material,inout ReflectedLight reflectedLight){
 float nl=dot(geometry.normal,directLight.direction);float wr=clamp((nl+.25)/1.25,0.,1.);
 vec3 irr=wr*directLight.color;
 #ifndef PHYSICALLY_CORRECT_LIGHTS
  irr*=PI;
 #endif
 reflectedLight.directDiffuse+=irr*BRDF_Diffuse_Lambert(material.diffuseColor);
 reflectedLight.directDiffuse+=directLight.color*material.diffuseColor*vec3(.5,.22,.1)*(wr*(1.-wr))*.9;
 vec3 hv=normalize(directLight.direction+geometry.viewDir);reflectedLight.directDiffuse+=directLight.color*pow(max(dot(geometry.normal,hv),0.),14.)*clayP.w*.07*step(0.,nl);}
void RE_IndirectDiffuse_Toon(const in vec3 irradiance,const in GeometricContext geometry,const in ToonMaterial material,inout ReflectedLight reflectedLight){
 reflectedLight.indirectDiffuse+=irradiance*BRDF_Diffuse_Lambert(material.diffuseColor);}
#define RE_Direct RE_Direct_Toon
#define RE_IndirectDiffuse RE_IndirectDiffuse_Toon
#define Material_LightProbeLOD(material) (0)`;
// opaque surfaces also write their distance into alpha (only seen by the depth-of-field pass; the canvas itself has no alpha)
const DEPTH_A=`#include <dithering_fragment>
#ifdef CLAY_DEPTH
 gl_FragColor.a=clayD/(clayD+8.);
#endif`;
function defaultKind(m){return m.vertexColors?'vc':m.map?'cloth':'clay'}
function toonCompile(sh){const m=this;if(!m.userData.clay)setKind(m,defaultKind(m));const u=m.userData.clay;
  sh.uniforms.clayT={value:CLAYT};sh.uniforms.clayP={value:u.p};sh.uniforms.clayQ={value:u.q};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vClayP;varying vec3 vClayN;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 cS=vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));
 #ifdef USE_INSTANCING
  cS*=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
 #endif
 vClayP=transformed*cS;vClayN=objectNormal/cS;`);
  sh.fragmentShader=(m.transparent?'':'#define CLAY_DEPTH\n')+LITE+sh.fragmentShader.replace('#include <common>','#include <common>\n'+CLAY_FRAG_PARS)
    .replace('#include <lights_toon_pars_fragment>',CLAY_LIGHTS)
    .replace('#include <color_fragment>','#include <color_fragment>\nfloat cTri=clayTri();float cH=mix(cTri,dot(diffuseColor.rgb,vec3(.3,.59,.11)),clayP.z);diffuseColor.rgb*=1.+(cTri-.5)*clayQ.y;')
    .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=clayBump(-vViewPosition,normal,cH*clayP.x,faceDirection);')
    .replace('#include <dithering_fragment>','float clayD=length(vViewPosition);\n'+DEPTH_A)}
function basicCompile(sh){if(this.transparent)return;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vClayD;').replace('#include <project_vertex>','#include <project_vertex>\nvClayD=length(mvPosition.xyz);');
  sh.fragmentShader='#define CLAY_DEPTH\nvarying float vClayD;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','float clayD=vClayD;\n'+DEPTH_A)}
const TP=T.MeshToonMaterial.prototype,BP=T.MeshBasicMaterial.prototype;
TP.onBeforeCompile=toonCompile;TP.customProgramCacheKey=function(){return 'clay-toon-'+(this.transparent?'t':'o')};TP.extensions={derivatives:true};
BP.onBeforeCompile=basicCompile;BP.customProgramCacheKey=function(){return 'clay-basic-'+(this.transparent?'t':'o')};

/* =================== CRAFT TEXTURES (repainted in place, so every clone of a core texture follows) =================== */
function felt(k,n,h,s,l){k.fillStyle=hsl(h,s,l);k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<60;i++){const x=rand(0,n),y=rand(0,n),r=rand(6,26),d=rand(-9,8);W9(n,x,y,r,(p,q)=>blob(k,p,q,r,hsl(h,s,l+d,.4),hsl(h,s,l+d,0)))}
  for(let i=0;i<n*n/4;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),L=rand(1.5,4.5),d=rand(-15,13);k.strokeStyle=hsl(h+rand(-8,8),s,l+d,rand(.2,.55));k.lineWidth=rand(.4,1);
    W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.quadraticCurveTo(p+Math.cos(a+1.2)*L*.5,q+Math.sin(a+1.2)*L*.5,p+Math.cos(a)*L,q+Math.sin(a)*L);k.stroke()})}}
function sand(k,n){k.fillStyle='#e9d29f';k.fillRect(0,0,n,n);
  for(let i=0;i<30;i++){const x=rand(0,n),y=rand(0,n),r=rand(6,18),d=Math.random()<.5;W9(n,x,y,r,(p,q)=>blob(k,p,q,r,d?'rgba(170,130,70,.18)':'rgba(255,248,225,.25)','rgba(0,0,0,0)'))}
  const C=['#f6e6bd','#dcbd84','#c9a46a','#fff6dc','#b8905a','#e4c690','#8a7058','#f0d8a0','#a99a8a'];
  for(let i=0;i<n*n*.55;i++){const x=rand(0,n),y=rand(0,n),r=Math.random()<.85?.7:1.3;k.fillStyle=C[(Math.random()*C.length)|0];k.fillRect(x,y,r,r);if(r>1){k.fillStyle='rgba(90,60,30,.35)';k.fillRect(x+.5,y+r,r,.6)}}}
function road(k,n){k.fillStyle='#5f5049';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<260;i++){const x=rand(0,n),y=rand(0,n),a=rand(-.5,.5)+(Math.random()<.5?0:PI/2),L=rand(14,50),d=rand(-7,7);k.strokeStyle=hsl(18,10+rand(-3,3),36+d,rand(.12,.3));k.lineWidth=rand(1.5,5);
    W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.bezierCurveTo(p+Math.cos(a)*L*.3+rand(-3,3),q+Math.sin(a)*L*.3+rand(-3,3),p+Math.cos(a)*L*.7,q+Math.sin(a)*L*.7,p+Math.cos(a)*L,q+Math.sin(a)*L);k.stroke()})}
  for(let i=0;i<1400;i++){k.fillStyle=Math.random()<.5?'rgba(255,240,220,.07)':'rgba(20,10,10,.1)';k.fillRect(rand(0,n),rand(0,n),1,1)}}
function tile(k,n){k.fillStyle='#d7cbb4';k.fillRect(0,0,n,n);
  for(let i=0;i<40;i++){const x=rand(0,n),y=rand(0,n),r=rand(8,24),d=rand(-6,6);W9(n,x,y,r,(p,q)=>blob(k,p,q,r,hsl(38,18,76+d,.5),hsl(38,18,76+d,0)))}
  for(let i=0;i<2600;i++){k.fillStyle=Math.random()<.5?'rgba(255,255,255,.12)':'rgba(80,60,40,.1)';k.fillRect(rand(0,n),rand(0,n),rand(.6,1.6),rand(.6,1.6))}
  const h=n/2,line=(x0,y0,x1,y1)=>{k.beginPath();k.moveTo(x0,y0);for(let t=.25;t<=1.001;t+=.25)k.lineTo(lerp(x0,x1,t)+rand(-1.2,1.2),lerp(y0,y1,t)+rand(-1.2,1.2));k.stroke()};
  k.lineCap='round';for(const[c,w,o]of[['rgba(90,70,50,.5)',1.6,0],['rgba(255,250,235,.35)',1,1.3]]){k.strokeStyle=c;k.lineWidth=w;for(const v of[0,h,n]){line(-2,v+o,n+2,v+o);line(v+o,-2,v+o,n+2)}}
  k.strokeStyle='rgba(80,60,45,.4)';k.lineWidth=.8;for(let i=0;i<5;i++){let x=rand(0,n),y=rand(0,n);k.beginPath();k.moveTo(x,y);for(let j=0;j<6;j++){x+=rand(-7,7);y+=rand(-7,7);k.lineTo(x,y)}k.stroke()}}
function leaf(k,n){k.fillStyle='#e2e2e2';k.fillRect(0,0,n,n);
  for(let i=0;i<150;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),L=rand(5,10),w=L*.45;W9(n,x,y,L+2,(p,q)=>{k.save();k.translate(p,q);k.rotate(a);
    k.fillStyle='rgba(60,60,60,.35)';k.beginPath();k.ellipse(.8,1.1,L,w,0,0,PI*2);k.fill();k.fillStyle=`rgba(255,255,255,${rand(.55,.95).toFixed(2)})`;k.beginPath();k.ellipse(0,0,L,w,0,0,PI*2);k.fill();
    k.strokeStyle='rgba(90,90,90,.45)';k.lineWidth=.7;k.beginPath();k.moveTo(-L*.8,0);k.lineTo(L*.8,0);k.stroke();k.restore()})}}
function bark(k,n){k.fillStyle='#7d5638';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<34;i++){const x=rand(0,n),c=Math.random()<.6;k.strokeStyle=c?'rgba(50,30,15,.45)':'rgba(190,140,100,.3)';k.lineWidth=rand(1,3);for(const o of[-n,0,n]){k.beginPath();k.moveTo(x+o,0);for(let y=0;y<=n;y+=8)k.lineTo(x+o+Math.sin(y*.09+x)*2.5,y);k.stroke()}}}
function water(k,n){k.fillStyle='#3f9ad8';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<90;i++){const x=rand(0,n),y=rand(0,n),L=rand(12,40);k.strokeStyle=Math.random()<.5?'rgba(110,190,245,.35)':'rgba(30,90,170,.3)';k.lineWidth=rand(2,6);
    W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.bezierCurveTo(p+L*.3,q-4,p+L*.6,q+4,p+L,q);k.stroke()})}
  for(let i=0;i<22;i++){const x=rand(0,n),y=rand(0,n),L=rand(8,22);k.strokeStyle='rgba(240,250,255,.75)';k.lineWidth=rand(1.2,2.4);W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.quadraticCurveTo(p+L*.5,q-5,p+L,q);k.stroke()})}}
// popsicle sticks: rows of rounded craft sticks with wood grain (white = tinted by the material colour; tint>0 = birch wood colour)
function sticks(k,n,wood,vertical){k.fillStyle=wood?'#6b4a2e':'#8c8c8c';k.fillRect(0,0,n,n);const rows=8,rh=n/rows;
  for(let r=0;r<rows;r++){let x=-rand(0,n*.6);const y=r*rh;while(x<n){const L=rand(n*.45,n*.75),c=wood?hsl(34+rand(-4,4),42,68+rand(-6,6)):hsl(0,0,93+rand(-5,5));
    const draw=(ox)=>{k.fillStyle=c;k.beginPath();if(k.roundRect)k.roundRect(x+ox+1,y+1.2,L-2,rh-2.4,rh/2-1.2);else k.rect(x+ox+1,y+1.2,L-2,rh-2.4);k.fill();
      k.strokeStyle=wood?'rgba(120,80,40,.35)':'rgba(120,120,120,.35)';k.lineWidth=.6;for(let g=0;g<3;g++){const gy=y+rh*(.3+g*.2)+rand(-1,1);k.beginPath();k.moveTo(x+ox+rh*.4,gy);k.bezierCurveTo(x+ox+L*.3,gy+rand(-1.5,1.5),x+ox+L*.6,gy+rand(-1.5,1.5),x+ox+L-rh*.4,gy);k.stroke()}
      k.fillStyle='rgba(255,255,255,.18)';k.fillRect(x+ox+rh*.3,y+1.8,L-rh*.6,1.2)};
    draw(0);if(x+L>n)draw(-n);x+=L+rand(0,3)}}
  if(vertical){const c=C2(n),q=c.getContext('2d');q.translate(n/2,n/2);q.rotate(PI/2);q.drawImage(k.canvas,-n/2,-n/2);k.clearRect(0,0,n,n);k.drawImage(c,0,0)}}
function hay(k,n){k.fillStyle='#d8b450';k.fillRect(0,0,n,n);k.lineCap='round';for(let i=0;i<1600;i++){const x=rand(0,n),y=rand(0,n),a=rand(-.4,.4),L=rand(6,18);k.strokeStyle=hsl(44+rand(-6,6),62,52+rand(-16,18),rand(.4,.8));k.lineWidth=rand(.5,1.3);
  W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.lineTo(p+Math.cos(a)*L,q+Math.sin(a)*L);k.stroke()})}}
function corr(k,n){k.fillStyle='#c8c8c8';k.fillRect(0,0,n,n);const p=n/8;for(let i=0;i<8;i++){const g=k.createLinearGradient(i*p,0,i*p+p,0);g.addColorStop(0,'#9a9a9a');g.addColorStop(.35,'#ffffff');g.addColorStop(.7,'#d4d4d4');g.addColorStop(1,'#8a8a8a');k.fillStyle=g;k.fillRect(i*p,0,p,n)}
  for(let i=0;i<500;i++){k.fillStyle=Math.random()<.5?'rgba(255,255,255,.15)':'rgba(60,40,30,.12)';k.fillRect(rand(0,n),rand(0,n),rand(1,3),1)}}
function sea(k,n){k.fillStyle='#2f86d0';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<120;i++){const x=rand(0,n),y=rand(0,n),L=rand(14,44);k.strokeStyle=Math.random()<.55?'rgba(90,175,240,.4)':'rgba(25,80,160,.35)';k.lineWidth=rand(2,7);W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.bezierCurveTo(p+L*.3,q-5,p+L*.6,q+5,p+L,q);k.stroke()})}
  for(let i=0;i<16;i++){const x=rand(0,n),y=rand(0,n),L=rand(10,26);k.strokeStyle='rgba(245,252,255,.8)';k.lineWidth=rand(1.5,3);W9(n,x,y,L,(p,q)=>{k.beginPath();k.moveTo(p,q);k.quadraticCurveTo(p+L*.5,q-6,p+L,q);k.stroke()})}}

// every texture in the scene, grouped by the canvas it shows
const users=new Map();
function indexTextures(){users.clear();scene.traverse(o=>{const ms=o.material?Array.isArray(o.material)?o.material:[o.material]:[];for(const m of ms){const t=m.map;if(!t||!t.image)continue;let L=users.get(t.image);if(!L)users.set(t.image,L={tex:new Set(),mats:new Set()});L.tex.add(t);L.mats.add(m)}})}
const repainted=new Set();
function repaint(tex,n,paint,kind){if(!tex||!tex.image||!tex.image.getContext)return;const c=tex.image;c.width=c.height=n;const k=c.getContext('2d');paint(k,n);repainted.add(c);
  const L=users.get(c),all=L?[tex,...L.tex]:[tex];for(const t of all){t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy());t.needsUpdate=true}
  if(L&&kind)for(const m of L.mats)setKind(m,kind)}

/* hand-painted card for the code-drawn signs and shop fronts: wobbly lines, brush streaks, paper grain, a dark card edge */
const GRAIN=(()=>{const c=C2(128),k=c.getContext('2d');k.fillStyle='#fff';k.fillRect(0,0,128,128);for(let i=0;i<2600;i++){k.fillStyle=`rgba(${Math.random()<.5?'90,70,50':'255,255,255'},${rand(.04,.14).toFixed(2)})`;k.fillRect(rand(0,128),rand(0,128),rand(.6,2.4),rand(.6,1.2))}return c})();
function handmade(c){const w=c.width,h=c.height,k=c.getContext('2d'),src=C2(w,h),sk=src.getContext('2d');sk.drawImage(c,0,0);
  const a=Math.max(.7,w/300),p1=rand(0,9),p2=rand(0,9),p3=rand(0,9),p4=rand(0,9);
  const mid=C2(w,h),mk=mid.getContext('2d');mk.drawImage(src,0,0);for(let y=0;y<h;y+=2)mk.drawImage(src,0,y,w,2,Math.sin(y*.05+p1)*a+Math.sin(y*.17+p2)*a*.5,y,w,2);
  k.drawImage(mid,0,0);for(let x=0;x<w;x+=2)k.drawImage(mid,x,0,2,h,x,Math.sin(x*.045+p3)*a+Math.sin(x*.15+p4)*a*.5,2,h);
  k.save();k.globalCompositeOperation='multiply';k.fillStyle=k.createPattern(GRAIN,'repeat');k.fillRect(0,0,w,h);k.restore();
  k.save();k.lineCap='round';for(let i=0;i<w*h/900;i++){const x=rand(0,w),y=rand(0,h),L=rand(10,40);k.strokeStyle=`rgba(${Math.random()<.5?'255,255,255':'0,0,0'},${rand(.03,.07).toFixed(3)})`;k.lineWidth=rand(2,6);
    k.beginPath();k.moveTo(x,y);k.quadraticCurveTo(x+L*.5,y+rand(-3,3),x+L,y+rand(-2,2));k.stroke()}
  const e=Math.max(2,w/110);k.strokeStyle='rgba(95,70,45,.55)';k.lineWidth=e;k.beginPath();k.moveTo(rand(0,e),rand(0,e));k.lineTo(w-rand(0,e),rand(0,e));k.lineTo(w-rand(0,e),h-rand(0,e));k.lineTo(rand(0,e),h-rand(0,e));k.closePath();k.stroke();k.restore()}

/* cotton wool: puff tufts (with alpha) and a fibrous tile for the sky clouds */
function cottonTuft(n){const c=C2(n),k=c.getContext('2d'),cx=n/2,cy=n/2,L=[];for(let i=0;i<13;i++){const a=rand(0,PI*2),d=rand(0,n*.17);L.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*.85,rand(n*.12,n*.2)])}
  for(const[x,y,r]of L)blob(k,x+r*.12,y+r*.18,r,'rgba(212,213,224,.95)','rgba(212,213,224,0)');
  for(const[x,y,r]of L)blob(k,x-r*.1,y-r*.14,r*.8,'rgba(255,255,255,1)','rgba(255,255,255,0)');
  k.lineCap='round';for(let i=0;i<190;i++){const a=rand(0,PI*2),d=rand(n*.12,n*.33),x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*.85,b=a+rand(-1.3,1.3),l=rand(n*.04,n*.13);
    k.strokeStyle=`rgba(255,255,255,${rand(.18,.5).toFixed(2)})`;k.lineWidth=rand(.5,1.3);k.beginPath();k.moveTo(x,y);k.quadraticCurveTo(x+Math.cos(b+.8)*l*.6,y+Math.sin(b+.8)*l*.6,x+Math.cos(b)*l,y+Math.sin(b)*l);k.stroke()}
  for(let i=0;i<90;i++){const x=cx+rand(-n*.22,n*.22),y=cy+rand(-n*.18,n*.18),l=rand(3,9),a=rand(0,PI*2);k.strokeStyle=`rgba(${Math.random()<.5?'255,255,255':'170,172,190'},.3)`;k.lineWidth=.7;k.beginPath();k.moveTo(x,y);k.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);k.stroke()}
  const t=new T.CanvasTexture(c);t.minFilter=T.LinearMipmapLinearFilter;return t}
const TUFTS=[0,1,2,3].map(()=>cottonTuft(128));
const FIBRE=(()=>{const n=128,c=C2(n),k=c.getContext('2d');k.fillStyle='#f4f4f6';k.fillRect(0,0,n,n);
  for(let i=0;i<30;i++){const x=rand(0,n),y=rand(0,n),r=rand(8,20);W9(n,x,y,r,(p,q)=>blob(k,p,q,r,'rgba(200,202,215,.35)','rgba(200,202,215,0)'))}
  k.lineCap='round';for(let i=0;i<900;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),l=rand(3,10);k.strokeStyle=`rgba(${Math.random()<.6?'255,255,255':'175,178,195'},${rand(.25,.6).toFixed(2)})`;k.lineWidth=rand(.4,1.1);
    W9(n,x,y,l,(p,q)=>{k.beginPath();k.moveTo(p,q);k.quadraticCurveTo(p+Math.cos(a+1)*l*.5,q+Math.sin(a+1)*l*.5,p+Math.cos(a)*l,q+Math.sin(a)*l);k.stroke()})}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t})();
// lumpy cotton ball: a sphere pushed out by a handful of soft lobes, shaded greyer underneath (sky clouds are unlit)
const COTG=(()=>{const g=new T.SphereGeometry(.5,18,12),P=g.attributes.position,N=P.count,col=new Float32Array(N*3),v=new T.Vector3(),D=[];for(let i=0;i<16;i++)D.push([new T.Vector3(rand(-1,1),rand(-.6,1),rand(-1,1)).normalize(),rand(.1,.26),rand(.55,.85)]);
  for(let i=0;i<N;i++){v.fromBufferAttribute(P,i).normalize();let r=1;for(const[d,a,c]of D){const q=v.dot(d)-c;if(q>0)r+=a*q/(1-c)}const fz=Math.sin(v.x*23+v.y*17)*Math.sin(v.z*19-v.y*13)*.03;r+=fz;
    P.setXYZ(i,v.x*.5*r,v.y*.5*r*(v.y<0?.7:1),v.z*.5*r);const s=.8+.2*(v.y*.5+.5)+fz*1.5;col[i*3]=col[i*3+1]=s;col[i*3+2]=s*1.02}
  g.setAttribute('color',new T.BufferAttribute(col,3));g.computeVertexNormals();return g})();

/* =================== ONE-TIME SET DRESSING =================== */
const INKS=new Set(),isInk=m=>m&&m.isMeshBasicMaterial&&m.side===T.BackSide&&m.color&&m.color.getHex()===0x15101d;
const camSet=new Set();cam.traverse(o=>camSet.add(o));
function stripInk(root){const out=[];root.traverse(o=>{if(o.isMesh&&isInk(o.material)){INKS.add(o.material);o.material.visible=false;out.push(o)}});for(const o of out)if(o.parent)o.parent.remove(o);return out.length}
function shadowFlags(o,inCam){const m=o.material;if(!o.isMesh||!m||Array.isArray(m))return;if(inCam){o.castShadow=o.receiveShadow=false;return}
  if(!m.isMeshToonMaterial||m.transparent)return;o.receiveShadow=true;const s=o.scale,big=Math.max(s.x,s.z),gt=o.geometry&&o.geometry.type;o.castShadow=!(s.y<.35&&big>16)&&big<60&&gt!=='CircleGeometry'&&gt!=='PlaneGeometry'}
let stripped=stripInk(scene);for(const n of npcs)if(n.inks)n.inks.length=0;
indexTextures();
const S=X.TXS||{},WT=(X.world&&X.world.tex)||{};
repaint(S.grass,128,(k,n)=>felt(k,n,102,36,43),'felt');repaint(S.road,128,road,'road');repaint(S.tile,128,tile,'tile');repaint(S.leaf,128,leaf,'leaf');
repaint(S.bark,64,bark,'wood');repaint(S.water,128,water,'water');repaint(S.plank,128,(k,n)=>sticks(k,n,false,true),'wood');repaint(S.hay,64,hay,'hay');repaint(S.corr,64,corr,'corr');
repaint(WT.sand,128,sand,'sand');repaint(WT.sea,128,sea,'water');repaint(WT.plank,128,(k,n)=>sticks(k,n,true,false),'wood');
// shop fronts, signs and billboards painted in code: give them the hand-painted card treatment
for(const[c,L]of users){if(repainted.has(c)||!c.getContext||c.width<256)continue; // 256+ wide = facades, signs, billboards (not the 64/128 face, cloth and label cut-outs)
  let world=false;for(const m of L.mats)if(m.isMeshToonMaterial)world=true;if(!world)continue;
  try{handmade(c);for(const t of L.tex)t.needsUpdate=true;for(const m of L.mats)if(m.isMeshToonMaterial)setKind(m,'paper')}catch(e){}}
// sky clouds: cotton balls
const clouds=scene.children.filter(g=>g.isGroup&&g.children.length&&g.children.every(c=>c.isMesh&&c.material&&c.material.isMeshBasicMaterial&&c.material.fog===false));
for(const g of clouds)for(const c of g.children){c.geometry=COTG;const m=c.material;if(!m.userData.cot){m.userData.cot=1;m.map=FIBRE;m.vertexColors=true;m.needsUpdate=true}}
// lights: the sun becomes a warm studio lamp with soft shadows; a cool fill from the other side
const sun=scene.children.find(o=>o.isDirectionalLight),hemi=scene.children.find(o=>o.isHemisphereLight);
const SH={size:touch?512:1024,half:touch?18:30,on:true,every:touch?2:1};
R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;R.shadowMap.needsUpdate=true;
if(sun){sun.castShadow=true;const s=sun.shadow;s.mapSize.set(SH.size,SH.size);Object.assign(s.camera,{left:-SH.half,right:SH.half,top:SH.half,bottom:-SH.half,near:1,far:220});s.camera.updateProjectionMatrix();s.bias=-.0006;s.normalBias=.03;s.radius=3;scene.add(sun.target)}
const fill=new T.DirectionalLight(0xc8d8ff,.22);fill.position.set(-60,40,70);scene.add(fill);
scene.traverse(o=>{const inCam=camSet.has(o);shadowFlags(o,inCam);const ms=o.material?Array.isArray(o.material)?o.material:[o.material]:[];for(const m of ms)if(m.isMeshToonMaterial||m.isMeshBasicMaterial)m.needsUpdate=true});
// real shadows now: fade the painted blob shadows under creatures
for(const n of npcs){n.g.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.type==='CircleGeometry'&&o.material&&o.material.transparent&&o.material.opacity>.15)o.material.opacity=.13});break}
// smooth, sharper image instead of chunky pixels
R.domElement.style.imageRendering='auto';X.setRes(touch?560:Math.min(1100,Math.max(820,Math.round(innerHeight*.95))));

/* =================== CREATURES ADDED LATER (bosses etc.): strip ink, set shadow flags =================== */
function dressNPC(n){if(n._clay)return;n._clay=1;stripInk(n.g);if(n.inks)n.inks.length=0;n.g.traverse(o=>shadowFlags(o,false))}

/* =================== STOP-MOTION: pose on twos, smooth camera =================== */
const STEP=1000/12,ST={on:true,next:0,step:false,boil:.012};
const ent=new Map();let live=new Float32Array(13*4096),liveN=0;
const put13=(o,a,i)=>{o.position.set(a[i],a[i+1],a[i+2]);const q=o.quaternion,r=o.rotation;q._x=a[i+3];q._y=a[i+4];q._z=a[i+5];q._w=a[i+6];r._x=a[i+7];r._y=a[i+8];r._z=a[i+9];o.scale.set(a[i+10],a[i+11],a[i+12])};
const get13=(o,a,i)=>{const p=o.position,q=o.quaternion,r=o.rotation,s=o.scale;a[i]=p.x;a[i+1]=p.y;a[i+2]=p.z;a[i+3]=q._x;a[i+4]=q._y;a[i+5]=q._z;a[i+6]=q._w;a[i+7]=r._x;a[i+8]=r._y;a[i+9]=r._z;a[i+10]=s.x;a[i+11]=s.y;a[i+12]=s.z};
function snap(key,root,deep){let e=ent.get(key);if(!e)ent.set(key,e={nodes:[],a:null,ok:false,seen:0});e.nodes.length=0;if(deep)root.traverse(o=>e.nodes.push(o));else e.nodes.push(root);
  const N=e.nodes.length*13;if(!e.a||e.a.length<N)e.a=new Float32Array(N+130);for(let i=0;i<e.nodes.length;i++){const o=e.nodes[i];get13(o,e.a,i*13);
    if(deep&&o.isMesh&&Math.random()<.3){const b=ST.boil,f=1+rand(-b,b),j=i*13+10;e.a[j]*=f+rand(-b,b)*.4;e.a[j+1]*=f+rand(-b,b)*.4;e.a[j+2]*=f+rand(-b,b)*.4}}e.ok=true}
const PS=new Float32Array(puffs.length*6);let puffOK=new Uint8Array(puffs.length);
const held=[],cp=new T.Vector3();let heldN=0;
function holdApply(){const now=performance.now();ST.step=now>=ST.next;if(ST.step)ST.next=now-ST.next>STEP*3?now+STEP:ST.next+STEP;
  const hn=X.held,cx=cam.position.x,cz=cam.position.z,cars=X.world?X.world.cars:null;liveN=0;heldN=0;
  const take=(key,root,deep)=>{if(ST.step)snap(key,root,deep);const e=ent.get(key);if(!e||!e.ok)return;e.seen=now;const N=e.nodes.length;if((liveN+N)*13>live.length){const b=new Float32Array(live.length*2);b.set(live);live=b}
    for(let i=0;i<N;i++){get13(e.nodes[i],live,(liveN+i)*13);put13(e.nodes[i],e.a,i*13)}held[heldN++]=e;liveN+=N};
  for(const n of npcs){if(!n.g||!n.g.parent)continue;const p=n.g.position;if(n===hn||Math.abs(p.x-cx)+Math.abs(p.z-cz)>110){const e=ent.get(n);if(e)e.ok=false;continue}take(n,n.g,true)}
  if(cars)for(const c of cars)take(c,c.g,false);
  for(let i=0;i<puffs.length;i++){const P=puffs[i],s=P.s;if(!s.visible||P.life<=0){puffOK[i]=0;continue}const j=i*6;
    if(ST.step||(puffOK[i]&&P.life>PS[j+5]+1e-4)){PS[j]=s.position.x;PS[j+1]=s.position.y;PS[j+2]=s.position.z;PS[j+3]=s.scale.x;PS[j+4]=s.scale.y;PS[j+5]=P.life;puffOK[i]=1;if(!ST.step)continue}
    if(!puffOK[i])continue;const a=P._lv||(P._lv=new Float32Array(5));a[0]=s.position.x;a[1]=s.position.y;a[2]=s.position.z;a[3]=s.scale.x;a[4]=s.scale.y;P._h=1;s.position.set(PS[j],PS[j+1],PS[j+2]);s.scale.set(PS[j+3],PS[j+4],1)}
  if(ST.step&&ent.size>npcs.length*1.5+40)for(const[k,e]of ent)if(now-e.seen>5000)ent.delete(k)}
function holdRestore(){let o=0;for(let h=0;h<heldN;h++){const e=held[h];for(let i=0;i<e.nodes.length;i++,o++)put13(e.nodes[i],live,o*13);held[h]=null}heldN=0;
  for(const P of puffs)if(P._h){P._h=0;const a=P._lv;P.s.position.set(a[0],a[1],a[2]);P.s.scale.set(a[3],a[4],1)}}

/* =================== TILT-SHIFT DEPTH OF FIELD =================== */
const DOF={on:!touch,want:!touch,focus:9,K:36,dz:.03,max:8,taps:touch?8:16};
const isGL2=R.capabilities.isWebGL2;let rt=null;const dbs=new T.Vector2();
function makeRT(w,h){if(rt)rt.dispose();const o={minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,depthBuffer:true,stencilBuffer:false};
  rt=isGL2&&T.WebGLMultisampleRenderTarget?new T.WebGLMultisampleRenderTarget(w,h,o):new T.WebGLRenderTarget(w,h,o);if(rt.samples!==undefined)rt.samples=4;rt.texture.generateMipmaps=false}
const postM=new T.ShaderMaterial({uniforms:{tC:{value:null},px:{value:new T.Vector2()},focus:{value:9},K:{value:36},dz:{value:.03},mx:{value:8},vig:{value:.22}},depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`#define NT ${DOF.taps}
uniform sampler2D tC;uniform vec2 px;uniform float focus,K,dz,mx,vig;varying vec2 vUv;
float coc(float a){float d=8.*a/max(1.-a,.004);return clamp((abs(1./focus-1./max(d,.05))-dz)*K,0.,mx);}
void main(){vec4 c0=texture2D(tC,vUv);float r0=coc(c0.a);vec3 acc=c0.rgb;float ws=1.;
 if(r0>.6){for(int i=0;i<NT;i++){float fi=float(i)+.5,rr=sqrt(fi/float(NT)),th=fi*2.39996;vec2 o=vec2(cos(th),sin(th))*rr*r0;vec4 s=texture2D(tC,vUv+o*px);
   float w=clamp(coc(s.a)-rr*r0+1.,0.,1.);acc+=s.rgb*w;ws+=w;}}
 vec3 c=acc/ws;float l=dot(c,vec3(.3,.59,.11));c=mix(vec3(l),c,.86)*vec3(1.05,1.,.9);c=mix(c,smoothstep(vec3(-.08),vec3(1.06),c),.55);vec2 q=vUv-.5;c*=1.-vig*dot(q,q)*2.4;gl_FragColor=vec4(c,1.);}`});
const postG=new T.BufferGeometry();postG.setAttribute('position',new T.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));
const postQ=new T.Mesh(postG,postM);postQ.frustumCulled=false;const postS=new T.Scene();postS.add(postQ);const postC=new T.OrthographicCamera(-1,1,1,-1,0,1);
const fv=new T.Vector3();
function focusTarget(){const n=X.held||X.tgt;if(n&&X.mouth){X.mouth(n,fv);return clamp(fv.distanceTo(cam.position),.5,30)}return 9}

/* =================== RENDER WRAP =================== */
const _render=R.render.bind(R);let fr=0;
R.render=function(s,c){if(s!==scene)return _render(s,c);fr++;
  if(SH.on)R.shadowMap.needsUpdate=fr%SH.every===0;
  if(ST.on)holdApply();
  try{if(DOF.on){R.getDrawingBufferSize(dbs);const w=dbs.x|0,h=dbs.y|0;if(!rt||rt.width!==w||rt.height!==h)makeRT(w,h);
      const u=postM.uniforms,sc=h/900;u.tC.value=rt.texture;u.px.value.set(1/w,1/h);u.focus.value=DOF.focus;u.K.value=DOF.K*sc;u.dz.value=DOF.dz;u.mx.value=DOF.max*sc;
      const pc=R.getClearAlpha();R.setRenderTarget(rt);_render(s,c);R.setRenderTarget(null);_render(postS,postC);R.setClearAlpha(pc)}
    else _render(s,c)}
  finally{if(ST.on)holdRestore()}};

/* =================== PER FRAME =================== */
const tgtP=new T.Vector3(),rgt=new T.Vector3(),upv=new T.Vector3(),lit=new T.Vector3(),WHITE=new T.Color(1,1,1);
let last=performance.now(),slowT=0,goodT=0,sweep=0;
X.on('prerender',dt=>{const now=performance.now(),ft=now-last;last=now;
  // the lamp follows the player; its shadow camera snaps to whole shadow texels so the edges don't crawl
  if(sun&&SH.on){const d=(X.world&&X.world.sunDir)||lit.copy(sun.position).normalize();lit.copy(d);if(lit.y<.45){lit.y=.45;lit.normalize()}
    rgt.set(0,1,0).cross(lit).normalize();upv.copy(lit).cross(rgt);const tx=SH.half*2/SH.size;tgtP.set(X.px,0,X.pz);
    const a=Math.round(tgtP.dot(rgt)/tx)*tx,b=Math.round(tgtP.dot(upv)/tx)*tx,cc=tgtP.dot(lit);tgtP.copy(rgt).multiplyScalar(a).addScaledVector(upv,b).addScaledVector(lit,cc);
    sun.target.position.copy(tgtP);sun.target.updateMatrixWorld();sun.position.copy(tgtP).addScaledVector(lit,90)}
  // depth of field: focus pulls to whoever you're aiming at / vaping, otherwise the middle distance
  DOF.focus=lerp(DOF.focus,focusTarget(),1-Math.exp(-dt*7));
  // cotton puffs: soft tint, random tuft and spin, a firmer body that pops in and thins out at the end
  for(const P of puffs){if(P.life<=0){P._cl=0;continue}const m=P.s.material;if(!P._cl||P.life>P._cl+1e-4){if(TUFTS.indexOf(m.map)<0){m.map=TUFTS[(Math.random()*4)|0];m.needsUpdate=true}else m.map=TUFTS[(Math.random()*4)|0];m.rotation=rand(0,PI*2);m.color.lerp(WHITE,.78)}P._cl=P.life;
    const k=1-P.life/P.max;m.opacity=Math.min(1,k*14)*(1-k*k*k)*.95}
  // frame-time watchdog (desktop): drop DOF, then shadows, if frames stay slow; bring them back after a long good stretch
  if(X.mode==='play'&&ft<250&&!document.hidden){if(ft>26){slowT+=ft;goodT=0}else{slowT=Math.max(0,slowT-ft*.5);if(ft<15)goodT+=ft}
    if(slowT>2500){slowT=0;if(DOF.on){DOF.on=false}else if(SH.on&&touch){SH.on=false;sun.castShadow=false;R.shadowMap.needsUpdate=true}}
    if(goodT>12000){goodT=0;if(!DOF.on&&DOF.want)DOF.on=true}}
  if(++sweep%30===0)for(const n of npcs)if(!n._clay)dressNPC(n)});

X.clay={DOF,SH,ST,KIND,setKind,CLAYT,TUFTS,stripped:()=>stripped,
  dof(v){DOF.on=DOF.want=!!v},shadows(v){SH.on=!!v;if(sun){sun.castShadow=!!v;R.shadowMap.needsUpdate=true}},stop(v){ST.on=!!v}};
})();
