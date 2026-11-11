/* world mod: an actual beach past Muscle Beach, traffic, birds, a blimp, street props, vape haze,
   and a sky that slides from noon to a pink sunset (then dusk, streetlights, lit windows, stars) as the vapes run out.
   Built only on window.TMV. Static props are merged into a few vertex-coloured meshes to keep draw calls low (no ink hulls: the clay mod
   gives everything a plasticine/cardboard surface instead). Exposes TMV.world = {k (0..1 time of day), night (0..1), cars, blimp, sunDir, tex}. */
(()=>{const X=window.TMV;if(!X||X.world)return;
const T=X.T,{scene,W,LINES,rand,ri,pick,clamp,lerp}=X,PI=Math.PI,GRAD=X.M(0xffffff).gradientMap;
const ss=(a,b,v)=>{v=clamp((v-a)/(b-a),0,1);return v*v*(3-2*v)};
const VCM=new T.MeshToonMaterial({gradientMap:GRAD,vertexColors:true});
const GEO={b:new T.BoxGeometry(1,1,1),s:new T.SphereGeometry(.5,8,6),c:new T.CylinderGeometry(.5,.5,1,8),k:new T.ConeGeometry(.5,1,8),p:new T.ConeGeometry(.5,1,4),t:new T.TorusGeometry(.4,.15,6,12)};
for(const k in GEO)GEO[k]=GEO[k].toNonIndexed();
const _m=new T.Matrix4(),_m2=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_e2=new T.Euler(),_p=new T.Vector3(),_s=new T.Vector3(),_v=new T.Vector3(),_c=new T.Color(),_n3=new T.Matrix3(),ID=new T.Matrix4();
const WG=new T.Group();scene.add(WG);

/* ---------- kit: collect parts, merge into one vertex-coloured mesh + one ink hull ---------- */
function Kit(){const P=[],I=[];let base=ID;const k={
  at(x,z,ry,y){base=new T.Matrix4().compose(_p.set(x,y||0,z),_q.setFromEuler(_e.set(0,ry||0,0,'XYZ')),_s.set(1,1,1));return k},
  reset(){base=ID;return k},
  add(g,w,h,d,col,x,y,z,rx,ry,rz,ink){const p={g,w,h,d,col,x,y,z,rx:rx||0,ry:ry||0,rz:rz||0,base};P.push(p);if(ink!==false&&Math.max(w,h,d)>.25&&Math.min(w,h,d)>.04)I.push(p);return k},
  hull(w,h,d,x,y,z,rx,ry,rz){I.push({g:'b',w,h,d,x,y,z,rx:rx||0,ry:ry||0,rz:rz||0,base});return k},
  /* textured box (signs): its own mesh, placed through the current base transform; its outline joins the merged hull */
  tex(mat,w,h,d,x,y,z,ry,par){const m=new T.Mesh(GEO.b,mat);_m.compose(_p.set(x,y,z),_q.setFromEuler(_e.set(0,ry||0,0,'XYZ')),_s.set(w,h,d));_m2.multiplyMatrices(base,_m);_m2.decompose(m.position,m.quaternion,m.scale);(par||WG).add(m);k.hull(w,h,d,x,y,z,0,ry);return m},
  build(par){const m=new T.Mesh(merge(P,0),VCM);(par||WG).add(m);return m}};return k}
function merge(parts,th){let n=0;for(const p of parts)n+=GEO[p.g].attributes.position.count;
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=th?null:new Float32Array(n*3);let o=0;
  for(const p of parts){const G=GEO[p.g],a=G.attributes.position,b=G.attributes.normal;
    _m.compose(_p.set(p.x,p.y,p.z),_q.setFromEuler(_e.set(p.rx,p.ry,p.rz,'XYZ')),_s.set(p.w+th,p.h+th,p.d+th));_m2.multiplyMatrices(p.base,_m);_n3.getNormalMatrix(_m2);if(col)_c.setHex(p.col);
    for(let i=0;i<a.count;i++,o++){_v.fromBufferAttribute(a,i).applyMatrix4(_m2);pos[o*3]=_v.x;pos[o*3+1]=_v.y;pos[o*3+2]=_v.z;
      _v.fromBufferAttribute(b,i).applyMatrix3(_n3).normalize();nor[o*3]=_v.x;nor[o*3+1]=_v.y;nor[o*3+2]=_v.z;if(col){col[o*3]=_c.r;col[o*3+1]=_c.g;col[o*3+2]=_c.b}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(nor,3));if(col)g.setAttribute('color',new T.BufferAttribute(col,3));g.computeBoundingSphere();return g}

/* ---------- canvas text ---------- */
function fit(k,text,max,fs){do{k.font=`900 ${fs}px "Arial Black",Impact,sans-serif`}while(k.measureText(text).width>max&&--fs>8)}
const toonTex=c=>new T.MeshToonMaterial({gradientMap:GRAD,map:new T.CanvasTexture(c)});
function signMat(text,bg,fg,bd){const c=document.createElement('canvas');c.width=256;c.height=64;const k=c.getContext('2d');k.fillStyle=bg||'#2a2433';k.fillRect(0,0,256,64);k.strokeStyle=bd||'#b6ff3c';k.lineWidth=5;k.strokeRect(3,3,250,58);k.fillStyle=fg||'#fff7ea';fit(k,text,234,34);k.textAlign='center';k.textBaseline='middle';k.fillText(text,128,34);return toonTex(c)}
function adMat(bg,fg,l1,l2,l3){const c=document.createElement('canvas');c.width=256;c.height=128;const k=c.getContext('2d');k.fillStyle=bg;k.fillRect(0,0,256,128);k.fillStyle='rgba(255,255,255,.12)';for(let i=-128;i<256;i+=24){k.beginPath();k.moveTo(i,128);k.lineTo(i+60,0);k.lineTo(i+72,0);k.lineTo(i+12,128);k.fill()}
  k.fillStyle=fg;k.fillRect(0,0,256,7);k.fillRect(0,121,256,7);k.textAlign='center';k.textBaseline='middle';fit(k,l1,240,40);k.fillStyle='#15101d';k.fillText(l1,130,42);k.fillStyle=fg;k.fillText(l1,128,40);
  k.fillStyle='#fff7ea';fit(k,l2,236,20);k.fillText(l2,128,80);k.font='bold 11px sans-serif';k.fillStyle=fg;k.fillText(l3,128,106);return toonTex(c)}
const tx=(n,fn)=>X.TX(n,fn); // repainted as sand grains / painted sea / popsicle sticks by the clay mod
const solid=X.solid;

/* =================== THE ACTUAL BEACH (north, just past Muscle Beach) =================== */
const SHORE=-125,PIERX=30;
const sandT=tx(32,(k,n)=>{k.fillStyle='#f3dca2';k.fillRect(0,0,n,n);for(let i=0;i<200;i++){k.fillStyle=pick(['#e8cd8e','#fbe8b8','#dcbf80','#fff3cf']);k.fillRect(ri(n),ri(n),1+ri(2),1)}});
X.box(WG,380,.1,27,X.TM(sandT,120,9),0,.03,-112.5);
X.box(WG,380,.06,3,X.TM(sandT,120,1,0xd8b97a),0,.062,SHORE+.6); // wet sand
const seaT=tx(32,(k,n)=>{k.fillStyle='#2f8fd8';k.fillRect(0,0,n,n);k.fillStyle='#4aa8ea';for(let i=0;i<n;i+=8)k.fillRect(0,i+ri(3),n,2);k.fillStyle='#bfeaff';for(let i=0;i<10;i++)k.fillRect(ri(n),ri(n),3+ri(5),1)});
const seaM=X.TM(seaT,48,20),seaG=new T.PlaneGeometry(760,300,38,15);seaG.rotateX(-PI/2);seaG.translate(0,.24,SHORE-150);
const sea=new T.Mesh(seaG,seaM);sea.userData.noInk=true;scene.add(sea);const seaP=seaG.attributes.position,seaY0=Float32Array.from(seaP.array);
const foam=X.box(scene,380,.04,1.4,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85}),0,.32,SHORE);
for(const o of W.children)if(o.isMesh&&o.scale.x>=60&&o.position.y===-6&&o.position.z<-140)o.visible=false; // open the northern horizon: sea instead of hills
solid((-150+PIERX-2)/2,-138,PIERX-2+150,26);solid((150+PIERX+2)/2,-138,150-PIERX-2,26); // the sea (the pier stays walkable)
const BK=Kit(),plankT=tx(32,(k,n)=>{k.fillStyle='#b98a5a';k.fillRect(0,0,n,n);k.fillStyle='#8a6240';for(let i=0;i<n;i+=6)k.fillRect(0,i,n,1);k.fillStyle='#a57a4c';for(let i=0;i<24;i++)k.fillRect(ri(n),ri(n),4,1)});
// pier
X.box(WG,4,.3,35,X.TM(plankT,2,18),PIERX,.25,-132.5);BK.hull(4,.3,35,PIERX,.25,-132.5);
for(let z=-126;z>=-150;z-=4)for(const s of[-1,1])BK.add('c',.45,1.6,.45,0x6e4a2e,PIERX+s*1.8,-.4,z,0,0,0,false);
for(let z=-117;z>=-150;z-=3)for(const s of[-1,1])BK.add('b',.16,1,.16,0xfff7ea,PIERX+s*1.88,.9,z);
for(const s of[-1,1]){BK.add('b',.14,.14,34,0xfff7ea,PIERX+s*1.88,1.4,-133);BK.add('b',.1,.1,34,0xfff7ea,PIERX+s*1.88,.95,-133,0,0,0,false)}
BK.add('b',2.4,.12,.6,0x9a6a48,PIERX,.85,-148.5);BK.add('b',2.4,.6,.1,0x9a6a48,PIERX,1.2,-148.8);BK.add('b',.12,.5,.5,0x333333,PIERX-1,.6,-148.5,0,0,0,false);BK.add('b',.12,.5,.5,0x333333,PIERX+1,.6,-148.5,0,0,0,false);
solid(PIERX,-148.6,2.4,.8);
BK.add('c',.18,2.6,.18,0x444444,PIERX-2.4,1.3,-117);BK.tex(signMat('NO VAPING OFF THE PIER'),3.4,.85,.12,PIERX-2.4,2.6,-117);
// lifeguard tower
{const x=-24,z=-114;BK.at(x,z,0);for(const sx of[-1,1])for(const sz of[-1,1])BK.add('b',.22,3.2,.22,0xfff7ea,sx*1.2,1.6,sz*1.2,sz*.08,0,-sx*.08);
  BK.add('b',3.4,.22,3.4,0xd8d0c0,0,3.25,0);BK.add('b',2.6,1.8,2.6,0xfff7ea,0,4.25,-.2);BK.add('b',2.62,.5,2.62,0xe0244a,0,4.6,-.2,0,0,0,false);BK.add('p',4.2,1.2,4.2,0xe0244a,0,5.75,-.2,0,PI/4,0);
  BK.add('b',1.6,.9,.1,0x3d5f7d,0,4.4,1.11,0,0,0,false);for(const s of[-1,1])BK.add('b',.12,3.6,.12,0xfff7ea,s*.5,1.6,2.2,-.42,0,0);for(let i=0;i<6;i++)BK.add('b',1,.08,.12,0xfff7ea,0,.4+i*.55,2.95-i*.23,0,0,0,false);
  BK.add('b',.3,1.2,.3,0xe0244a,1.9,3.9,1.4,0,0,0,false);BK.add('b',.6,.08,.08,0xfff7ea,1.9,4.2,1.56,0,0,0,false);BK.add('b',.08,.6,.08,0xfff7ea,1.9,4.2,1.56,0,0,0,false);
  BK.tex(signMat('LIFEGUARD (ON VAPE BREAK)','#e0244a','#fff7ea','#fff7ea'),3.2,.7,.12,0,2.75,1.8);BK.reset();solid(x,z,2.8,2.8)}
// arch onto the sand
BK.tex(signMat('THE ACTUAL BEACH','#2a2433','#fff7ea','#ffd23c'),12,2.4,.3,0,6.2,-101);for(const s of[-1,1]){BK.add('c',.4,7.4,.4,0x5fd4ff,s*6,3.7,-101);BK.add('s',.8,.8,.8,0xffd23c,s*6,7.5,-101)}
BK.tex(signMat('(NO MUSCLE)','#ffd23c','#2a2433','#2a2433'),5,1,.2,0,4.4,-101);
// umbrellas, towels, loungers, beach balls
const UMB=[0xff3fa4,0xffd23c,0x5fd4ff,0x3cd07a,0xff7a1a,0xa070ff,0xe0244a],TOW=[0xff3fa4,0x5fd4ff,0xffd23c,0xb6ff3c,0xff9aa2,0xa9e5ff];
const spots=[];for(let i=0;i<80&&spots.length<11;i++){const x=rand(-95,95),z=rand(-120,-104);if(Math.abs(x-PIERX)<5||Math.abs(x+24)<5||Math.abs(x+12)<4||Math.abs(x-10)<4||Math.abs(x)<7||spots.some(s=>Math.hypot(s[0]-x,s[1]-z)<9))continue;spots.push([x,z])}
spots.forEach(([x,z],i)=>{const c=UMB[i%UMB.length],tl=rand(-.12,.12);BK.add('c',.12,3.2,.12,0xfff7ea,x,1.6,z,tl,0,tl);BK.add('k',3.8,1,3.8,c,x+tl*1.6,3.3,z-tl*1.6);BK.add('k',3.85,.4,3.85,0xfff7ea,x+tl*1.6,3.05,z-tl*1.6,0,PI/8,0,false);BK.add('s',.3,.3,.3,c,x+tl*1.6,3.85,z-tl*1.6,0,0,0,false);
  BK.at(x+rand(1.6,2.2),z+rand(-.5,.5),rand(-.4,.4),.06);BK.add('b',1.3,.04,2.4,pick(TOW),0,0,0);for(const zz of[-.6,0,.6])BK.add('b',1.32,.05,.18,0xfff7ea,0,0,zz,0,0,0,false);BK.reset();
  if(i%3===0){BK.at(x-1.8,z+.6,rand(-.3,.3));BK.add('b',.9,.1,1.8,0xfff7ea,0,.45,.2);BK.add('b',.9,.1,1.1,0xfff7ea,0,.85,-.95,-.9,0,0);for(const sx of[-1,1])BK.add('b',.08,.45,1.8,0x5fd4ff,sx*.42,.22,0,0,0,0,false);BK.reset()}
  if(i%4===1)BK.add('s',.7,.7,.7,pick([0xff3fa4,0x5fd4ff,0xffd23c]),x+rand(-3,3),.35,z+rand(1.5,3))});
// sandcastle (flying a vape)
{const x=10,z=-119;BK.add('b',2.2,.9,2.2,0xe8cd8e,x,.45,z);for(const sx of[-1,1])for(const sz of[-1,1]){BK.add('c',.7,1.4,.7,0xe8cd8e,x+sx*1.1,.7,z+sz*1.1);BK.add('k',.8,.6,.8,0xdcbf80,x+sx*1.1,1.7,z+sz*1.1,0,0,0,false)}
  BK.add('c',.9,1.8,.9,0xe8cd8e,x,1.3,z);BK.add('k',1,.8,1,0xdcbf80,x,2.6,z);BK.add('b',.18,.7,.12,0xff3fa4,x,3.3,z,0,0,.2);BK.add('b',.06,.3,.3,0xb6ff3c,x+.1,3.6,z+.2,0,0,0,false)}
// food carts
function cart(K,x,z,ry,text,c1,c2){K.at(x,z,ry);K.add('b',2.4,1,1.2,c1,0,.95,0);K.add('b',2.44,.22,1.24,0xfff7ea,0,1.15,0,0,0,0,false);for(const s of[-.75,.75])K.add('c',.75,.15,.75,0x222222,s,.4,.64,PI/2,0,0);
  K.add('b',.1,.1,1.4,0x777777,-1.45,1.3,0,0,0,0,false);K.add('c',.08,2.4,.08,0xfff7ea,0,2.5,0,0,0,0,false);K.add('k',3,.8,3,c2,0,3.7,0);K.add('s',.25,.25,.25,0xfff7ea,0,4.15,0,0,0,0,false);
  K.add('b',.7,.25,.5,0xffd98a,.4,1.58,0,0,0,0,false);K.add('b',.12,.6,.12,0xff3fa4,-.5,1.75,.2,0,0,.3,false);
  const sm=signMat(text,'#fff7ea','#e0244a','#e0244a');K.tex(sm,2.4,.55,.1,0,2.2,.62);K.tex(sm,2.4,.55,.1,0,2.2,-.62,PI);K.reset();solid(x,z,ry?1.4:2.6,ry?2.6:1.4)}
cart(BK,-12,-106,0,'SAND-WICHES (CRUNCHY)',0x5fd4ff,0xffd23c);
// a duck on a float ring, and a shark that is definitely just a guy
const floatie=Kit();floatie.add('t',3,3,3,0xff3fa4,0,.1,0,PI/2,0,0);floatie.add('s',1.1,.9,1.3,0xffd23c,1.8,.45,0);floatie.add('s',.7,.7,.7,0xffd23c,1.8,1.1,.4);floatie.add('k',.3,.4,.3,0xff7a1a,1.8,1.05,.85,PI/2,0,0,false);floatie.add('s',.12,.12,.12,0x15101d,1.95,1.25,.62,0,0,0,false);
const floatM=floatie.build(scene);floatM.position.set(-14,0,-133);
const finK=Kit();finK.add('k',1.6,1.5,.3,0x6f7f8f,0,.5,0);finK.add('b',3,.04,.5,0xd8f2ff,-1.5,.1,0,0,0,0,false);const fin=finK.build(scene);let finA=0,dunT=0;
BK.build(WG);

/* =================== DOWNTOWN PROPS =================== */
const PK=Kit(),signals=[[-11,-11],[11,-11],[-11,11],[11,11]];
// trash cans on free street corners, some overflowing with vapes
for(const a of LINES)for(const b of LINES){if(Math.random()<.35)continue;const x=a-4,z=b-4;
  PK.add('c',.75,1.05,.75,0x3b7a57,x,.52,z);PK.add('c',.82,.12,.82,0x2d5e43,x,1.08,z);PK.add('b',.5,.06,.08,0xdddddd,x,1.18,z,0,0,0,false);
  if(Math.random()<.5)for(let i=0;i<3;i++)PK.add('b',.12,.3,.08,pick([0xff3fa4,0xb6ff3c,0x5fd4ff,0xffd23c]),x+rand(-.2,.2),1.25,z+rand(-.2,.2),rand(-.6,.6),rand(0,3),rand(-.6,.6),false);solid(x,z,.75,.75)}
// traffic signal poles (lamps are an instanced mesh below)
const SIGL=[];for(const[a,b]of signals){const x=a+4,z=b-4;PK.add('c',.2,4.8,.2,0x3a3340,x,2.4,z);PK.add('b',.32,1.4,.32,0xd9b02a,x,4.55,z);PK.add('b',.6,.08,.6,0x3a3340,x,5.3,z,0,0,0,false);SIGL.push([x,z]);solid(x,z,.3,.3)}
// benches mid-block, facing the road
for(let i=0;i<10;i++){const a=pick(LINES),b=pick(LINES.slice(0,5))+11,s=pick([-1,1]),x=a+s*4.05,z=b+rand(-2,2);PK.at(x,z,s>0?-PI/2:PI/2);PK.add('b',2.2,.12,.6,0x9a6a48,0,.55,0);PK.add('b',2.2,.6,.1,0x9a6a48,0,.9,-.3);PK.add('b',.12,.55,.5,0x333333,-.9,.27,0,0,0,0,false);PK.add('b',.12,.55,.5,0x333333,.9,.27,0,0,0,0,false);PK.reset()}
// bus stop (the bus never comes)
{const x=-22,z=61;PK.at(x,z,0);PK.add('b',5,.15,2,0x3a3340,0,2.7,0);PK.add('b',5,2.4,.1,0x9adcff,0,1.45,.95);for(const s of[-1,1]){PK.add('b',.15,2.7,.15,0x3a3340,s*2.4,1.35,.9);PK.add('b',.15,2.7,.15,0x3a3340,s*2.4,1.35,-.9);PK.add('b',.08,2.2,1.7,0x9adcff,s*2.45,1.4,0,0,0,0,false)}
  PK.add('b',3.4,.14,.6,0x9a6a48,0,.6,.5);PK.add('b',.14,.6,.14,0x333333,-1.4,.3,.5,0,0,0,false);PK.add('b',.14,.6,.14,0x333333,1.4,.3,.5,0,0,0,false);
  PK.tex(adMat('#a070ff','#ffd23c','VAPE-FREE DAYCARE','WE ONLY LOSE SOME KIDS','now enrolling'),3.2,1.6,.12,0,1.5,.85);
  PK.add('c',.14,3.2,.14,0x666666,-3.2,1.6,-.6);PK.tex(signMat('BUS STOP · BUS: NEVER','#3c8cff','#fff7ea','#fff7ea'),2.6,.7,.1,-3.2,3,-.6);PK.reset();solid(x,z+.95,5,.3);solid(x-2.4,z,.3,2);solid(x+2.4,z,.3,2)}
cart(PK,-4.5,1.5,0,'HOT DOGS (NOT VAPES)',0xe0244a,0xffd23c);
// billboards with fake ads, around the edge of downtown
const ADS=[[-40,-76,0,'#ff3fa4','#ffd23c','LUNGS R US','TWO FOR ONE! YOU HAVE TWO!','*lungs sold separately'],
  [40,-76,0,'#3c8cff','#b6ff3c',"HONEST GARY'S",'USED VAPES: BARELY SUCKED','ask about our tongue warranty'],
  [76,72,Math.atan2(-76,-72),'#3cd07a','#fff7ea','CLOUD INSURANCE','ARE YOU COVERED? IN CLOUDS?','policy void if exhaled'],
  [-58,74,Math.atan2(58,-74),'#ff7a1a','#2a2433','MATTRESS KINGDOM','NOW ALSO 2ND MATTRESS KINGDOM','the kingdom is just mattresses']];
for(const[x,z,ry,bg,fg,l1,l2,l3]of ADS){PK.at(x,z,ry);for(const s of[-1,1])PK.add('b',.4,7,.4,0x3a3340,s*4.5,3.5,-.3);PK.add('b',12.6,.2,1,0x3a3340,0,5.25,-.1);for(const s of[-4,0,4])PK.add('b',.2,.6,.2,0x3a3340,s,11.3,.3,0,0,0,false);
  PK.tex(adMat(bg,fg,l1,l2,l3),12,5.6,.35,0,8.2,0);PK.reset();solid(x,z,1.2,1.2)}
PK.build(WG);
WG.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false});

/* signal lamps: one instanced mesh, colours swapped per phase */
const LCOL=[[0xff3040,0x4a1010],[0xffd23c,0x4a3a10],[0x3cff7a,0x103a1a]],lampsI=new T.InstancedMesh(new T.SphereGeometry(.21,8,6),new T.MeshBasicMaterial(),SIGL.length*3);
SIGL.forEach(([x,z],i)=>{for(let j=0;j<3;j++){_m.makeTranslation(x,4.98-j*.43,z);lampsI.setMatrixAt(i*3+j,_m);lampsI.setColorAt(i*3+j,_c.setHex(LCOL[j][1]))}});scene.add(lampsI);let sigPh=-1;

/* =================== STREETLIGHT POOLS + HALOS, LIT WINDOWS, STARS =================== */
const LP=[];for(const a of LINES)for(const b of LINES){if((a+b)%4)continue;LP.push([a+3,b+4])}
const poolG=new T.CircleGeometry(3.6,16);poolG.rotateX(-PI/2);
const pools=new T.InstancedMesh(poolG,new T.MeshBasicMaterial({color:0xffc870,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}),LP.length),
  halos=new T.InstancedMesh(new T.SphereGeometry(1,8,6),new T.MeshBasicMaterial({color:0xffd890,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false}),LP.length);
LP.forEach(([x,z],i)=>{_m.makeTranslation(x,.09,z);pools.setMatrixAt(i,_m);_m.makeTranslation(x,4.85,z);halos.setMatrixAt(i,_m)});pools.visible=halos.visible=false;pools.renderOrder=halos.renderOrder=2;scene.add(pools,halos);
// windows: an emissive mask per facade, found by scanning the painted window rectangles; about half of the dark windows switch on at dusk
const WIN=[];W.traverse(o=>{const m=o.material;if(!o.isMesh||!m||!m.isMeshToonMaterial||!m.map||!m.map.image||m.map.image.width!==256||m.map.image.height!==256||!m.map.image.getContext)return;
  try{const d=m.map.image.getContext('2d').getImageData(0,0,256,256).data,cl=new Uint8Array(65536),rs=new Uint16Array(65536),ty=new Uint16Array(65536);
    const near=(i,r,g,b)=>Math.abs(d[i]-r)<12&&Math.abs(d[i+1]-g)<12&&Math.abs(d[i+2]-b)<12;
    for(let p=0;p<65536;p++){const i=p*4;cl[p]=near(i,61,95,125)||near(i,115,140,161)?1:near(i,255,233,160)||near(i,255,239,187)?2:0}
    const out=document.createElement('canvas');out.width=out.height=256;const ok=out.getContext('2d'),od=ok.createImageData(256,256),seed=Math.random()*99;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const p=y*256+x,i=p*4;od.data[i+3]=255;if(!cl[p])continue;rs[p]=x&&cl[p-1]?rs[p-1]:x;ty[p]=y&&cl[p-256]?ty[p-256]:y;
      const h=Math.sin(rs[p]*12.9898+ty[p]*78.233+seed)*43758.5453;if(cl[p]===2||h-Math.floor(h)<.5){od.data[i]=255;od.data[i+1]=214;od.data[i+2]=130}}
    ok.putImageData(od,0,0);const sm=document.createElement('canvas');sm.width=sm.height=128;sm.getContext('2d').drawImage(out,0,0,128,128);
    m.emissiveMap=new T.CanvasTexture(sm);m.emissive.setHex(0xffc060);m.emissiveIntensity=0;m.needsUpdate=true;WIN.push(m)}catch(e){}});
const starG=new T.BufferGeometry(),sp=new Float32Array(260*3);for(let i=0;i<260;i++){const a=rand(0,PI*2),e=Math.asin(rand(.15,1));sp[i*3]=Math.cos(a)*Math.cos(e)*400;sp[i*3+1]=Math.sin(e)*400;sp[i*3+2]=Math.sin(a)*Math.cos(e)*400}
starG.setAttribute('position',new T.BufferAttribute(sp,3));const stars=new T.Points(starG,new T.PointsMaterial({color:0xfff6e0,size:2,sizeAttenuation:false,fog:false,transparent:true,opacity:0,depthWrite:false}));stars.visible=false;stars.frustumCulled=false;scene.add(stars);

/* =================== TRAFFIC: little cars + Mr. Cloudy's ice cream truck =================== */
const CARC=[0xe0244a,0x3c8cff,0xffd23c,0x3cd07a,0xa070ff,0xff7a1a,0xff9ac0];
function carKit(c,topper){const K=Kit();K.add('b',1.42,.6,3.5,c,0,.62,0);K.add('b',1.3,.55,1.7,0xcfe9ff,0,1.17,-.2);K.add('b',1.36,.1,1.8,c,0,1.48,-.2);
  for(const sx of[-1,1])for(const sz of[-1,1])K.add('c',.62,.26,.62,0x222222,sx*.68,.32,sz*1.1,0,0,PI/2);for(const sx of[-1,1]){K.add('s',.28,.24,.1,0xfff2a0,sx*.48,.7,1.76,0,0,0,false);K.add('b',.3,.16,.06,0xff3040,sx*.5,.72,-1.76,0,0,0,false)}
  if(topper)K.add('b',.9,.3,.4,0xffd23c,0,1.7,-.3);return K}
function truckKit(){const K=Kit();K.add('b',1.5,2,3.6,0xfff7ea,0,1.4,-.5);K.add('b',1.52,.4,3.62,0xff9ac0,0,.6,-.5);K.add('b',1.5,1.1,1.4,0xff9ac0,0,.95,2);K.add('b',1.4,.6,.9,0xcfe9ff,0,1.6,1.9);
  K.add('b',.06,.9,1.6,0x2a2433,.76,1.6,-.4,0,0,0,false);K.add('b',.4,.08,1.7,0xff3fa4,.95,1.1,-.4,0,0,0,false);
  for(const sx of[-1,1])for(const sz of[-1.6,1.9])K.add('c',.7,.28,.7,0x222222,sx*.72,.35,sz,0,0,PI/2);K.add('s',.3,.26,.1,0xfff2a0,.48,.8,2.71,0,0,0,false);K.add('s',.3,.26,.1,0xfff2a0,-.48,.8,2.71,0,0,0,false);
  K.add('k',.9,1.4,.9,0xd9a05a,0,2.9,-.5,PI,0,0);K.add('s',1.1,1,1.1,0xff9ac0,0,3.8,-.5);K.add('s',.8,.8,.8,0xfff7ea,0,4.4,-.5);K.add('s',.25,.25,.25,0xe0244a,0,4.85,-.5,0,0,0,false);return K}
const cars=[],N6=LINES.length,DIRS=[[1,0],[-1,0],[0,1],[0,-1]],TRUCKSIGN=signMat('MR. CLOUDY · NO VAPES','#ff9ac0','#2a2433','#fff7ea');
function nextSeg(c,first){if(!first){c.i+=c.d[0];c.j+=c.d[1]}const opts=[];for(const d of DIRS){const ni=c.i+d[0],nj=c.j+d[1];if(ni<0||nj<0||ni>=N6||nj>=N6)continue;if(!first&&d[0]===-c.d[0]&&d[1]===-c.d[1])continue;opts.push(d);if(d[0]===c.d[0]&&d[1]===c.d[1])opts.push(d,d)}
  c.d=opts.length?pick(opts):[-c.d[0],-c.d[1]];const L=c.truck?.76:.74;c.tx=LINES[c.i+c.d[0]]-c.d[1]*L;c.tz=LINES[c.j+c.d[1]]+c.d[0]*L}
function addCar(truck){const g=new T.Group();(truck?truckKit():carKit(pick(CARC),cars.length===1)).build(g,.11);
  if(truck)for(const s of[1,-1]){const b=new T.Mesh(GEO.b,TRUCKSIGN);b.scale.set(3.4,.6,.08);b.rotation.y=s*PI/2;b.position.set(s*.62,2.7,-.5);g.add(b)}
  scene.add(g);let i,j;do{i=ri(N6);j=ri(N6)}while(Math.abs(LINES[i])<12&&Math.abs(LINES[j])<12||cars.some(o=>o.i===i&&o.j===j));
  const c={g,truck,i,j,d:pick(DIRS),sp:0,max:truck?4.2:rand(5.5,7.5),wait:0,ignore:0,honk:0,jing:rand(0,6),box:{a:0,b:0,c:0,d:0},yaw:0};X.cols.push(c.box);
  nextSeg(c,true);g.position.set(LINES[i],0,LINES[j]);c.yaw=Math.atan2(c.tx-LINES[i],c.tz-LINES[j]);cars.push(c)}
for(let i=0;i<4;i++)addCar(false);addCar(true);
const JING=[659,784,880,1047,880,784,659,587,659,784,659];
function drive(c,dt,t){const p=c.g.position,dx=c.tx-p.x,dz=c.tz-p.z;if(Math.hypot(dx,dz)<.6){nextSeg(c);return}
  const hx=Math.sin(c.yaw),hz=Math.cos(c.yaw);let block=0;c.ignore-=dt;
  const ahead=(x,z,r)=>{const ax=x-p.x,az=z-p.z,f=ax*hx+az*hz;return f>0&&f<r&&Math.abs(ax*hz-az*hx)<1.5};
  if(X.mode==='play'&&ahead(X.px,X.pz,5))block=2;
  if(!block&&c.ignore<=0)for(const n of X.npcs){const q=n.g.position;if(ahead(q.x,q.z,4.2)){block=1;break}}
  if(!block&&c.ignore<=0)for(const o of cars)if(o!==c&&ahead(o.g.position.x,o.g.position.z,5.2)){block=3;break}
  if(block){c.wait+=dt;if(block!==2&&c.wait>3){c.ignore=1.6;c.wait=0}}else c.wait=0;
  c.sp=lerp(c.sp,block?0:c.max,Math.min(1,dt*(block?5:1.2)));
  if(block===2&&c.wait>1.1&&(c.honk-=dt)<0){c.honk=3;const v=.06*clamp(1-Math.hypot(X.px-p.x,X.pz-p.z)/30,0,1);X.beep(c.truck?520:340,.28,'square',v);X.beep(c.truck?650:420,.3,'square',v*.8,.05);if(Math.random()<.5)X.emo('😤',p.x,2.4,p.z,0,1,0,.8)}
  let a=Math.atan2(dx,dz)-c.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));c.yaw+=a*Math.min(1,dt*4.5);
  const m=c.sp*dt;p.x+=Math.sin(c.yaw)*m;p.z+=Math.cos(c.yaw)*m;c.g.rotation.y=c.yaw;p.y=Math.abs(Math.sin(t*9+c.max))*.03*c.sp/6;
  const ex=Math.abs(hx)*1.75+Math.abs(hz)*.72,ez=Math.abs(hz)*1.75+Math.abs(hx)*.72;c.box.a=p.x-ex;c.box.b=p.x+ex;c.box.c=p.z-ez;c.box.d=p.z+ez;
  if(c.truck&&X.mode==='play'){c.jing-=dt;const d=Math.hypot(X.px-p.x,X.pz-p.z);if(c.jing<0&&d<34){c.jing=9;const v=.035*(1-d/34);JING.forEach((f,k)=>X.beep(f,.2,'triangle',v,k*.17))}}}

/* =================== BIRDS: crows over town, gulls over the beach =================== */
const NC=9,NG=12,NB=NC+NG,wingG=new T.BoxGeometry(1,.05,.42);wingG.translate(.5,0,0);
const wings=new T.InstancedMesh(wingG,new T.MeshToonMaterial({gradientMap:GRAD,side:T.DoubleSide}),NB*2),bodies=new T.InstancedMesh(new T.BoxGeometry(.26,.24,.8),new T.MeshToonMaterial({gradientMap:GRAD}),NB);
const birds=[];for(let i=0;i<NB;i++){const gull=i>=NC,col=gull?0xfdfdfd:0x2a2433;birds.push({gull,r:rand(gull?14:12,gull?26:22),w:rand(.09,.16)*(Math.random()<.5?-1:1),ph:rand(0,PI*2),y:rand(-2,2),s:gull?rand(.8,1):rand(.6,.75),fp:rand(0,6),last:new T.Vector3()});
  wings.setColorAt(i*2,_c.setHex(col));wings.setColorAt(i*2+1,_c.setHex(col));bodies.setColorAt(i,_c.setHex(gull?0xeeeeee:0x2a2433))}
wings.frustumCulled=bodies.frustumCulled=false;scene.add(wings,bodies);
const _bp=new T.Vector3();
function flock(t){const cx=Math.sin(t*.02)*40,cz=Math.cos(t*.015)*35,gx=Math.sin(t*.03)*55,gz=-114+Math.sin(t*.07)*6;
  birds.forEach((b,i)=>{const a=b.ph+t*b.w;_bp.set((b.gull?gx:cx)+Math.cos(a)*b.r,(b.gull?13:28)+b.y+Math.sin(t*.35+b.fp)*.8,(b.gull?gz:cz)+Math.sin(a)*b.r);
    const yaw=Math.atan2(_bp.x-b.last.x,_bp.z-b.last.z);b.last.copy(_bp);
    const flap=b.gull?.12+Math.max(0,Math.sin(t*2.2+b.fp))*.5*Math.sin(t*9+b.fp):.08+Math.max(0,Math.sin(t*1.6+b.fp))*.45*Math.sin(t*7+b.fp),bank=-Math.sign(b.w)*(b.gull?.35:.25);
    _q.setFromEuler(_e2.set(0,yaw,bank,'YXZ'));_m.compose(_bp,_q,_s.set(b.s,b.s,b.s));bodies.setMatrixAt(i,_m);
    for(const side of[0,1]){_q.setFromEuler(_e2.set(0,yaw,bank+(side?-flap:flap),'YXZ'));_s.set(side?-b.s*1.1:b.s*1.1,b.s,b.s);_m.compose(_bp,_q,_s);wings.setMatrixAt(i*2+side,_m)}});
  wings.instanceMatrix.needsUpdate=bodies.instanceMatrix.needsUpdate=true}
flock(performance.now()/1000-.05);

/* =================== BLIMP with a live banner =================== */
const blimp=new T.Group();{const K=Kit();K.add('s',6,6,20,0xd8dbe8,0,0,0);K.add('s',6.1,1.4,20.2,0xff3fa4,0,0,0,0,0,0,false);K.add('s',2,2,1.2,0xff3fa4,0,0,9.7,0,0,0,false);
  K.add('b',.3,4,3.4,0xff3fa4,0,2.6,-8.4);K.add('b',.3,4,3.4,0xff3fa4,0,-2.6,-8.4);K.add('b',4,.3,3.4,0xff3fa4,2.6,0,-8.4);K.add('b',4,.3,3.4,0xff3fa4,-2.6,0,-8.4);
  K.add('b',1.6,1.2,4,0xfff7ea,0,-3.5,1.2);K.add('b',1.62,.4,3.4,0x3d5f7d,0,-3.4,1.4,0,0,0,false);K.add('b',.06,.06,9,0x444444,0,-1.5,-14.5,0,0,0,false);K.build(blimp,.35)}
const banC=document.createElement('canvas');banC.width=512;banC.height=64;const banK=banC.getContext('2d'),banT=new T.CanvasTexture(banC),banM=new T.MeshBasicMaterial({map:banT,fog:false});
for(const s of[1,-1]){const b=new T.Mesh(new T.PlaneGeometry(24,3),banM);b.rotation.y=s*PI/2;b.position.set(s*.02,-1.5,-31);blimp.add(b)}
scene.add(blimp);
const MSG=[()=>`ONLY ${X.count.toLocaleString()} VAPES LEFT. HELP.`,()=>'THIS BLIMP HAS NEVER VAPED',()=>'HONK IF YOU HAVE LUNGS',()=>'VAPEYEAR BLIMP CO. EST. TODAY',()=>'MUSCLE BEACH: NOW WITH BEACH',()=>'EAT AT WET BREAD CAFE',()=>`${X.count.toLocaleString()} VAPES. STILL TOO MANY.`];
let msgI=-1,msgT=0,msgS='',msgC=-1;
function banner(dt){msgT-=dt;if(msgT<0){msgT=11;msgI=(msgI+1)%MSG.length;msgC=-1}if(X.count===msgC)return;msgC=X.count;const s=MSG[msgI]();if(s===msgS)return;msgS=s;
  banK.fillStyle='#fff7ea';banK.fillRect(0,0,512,64);banK.fillStyle='#ff3fa4';banK.fillRect(0,0,512,5);banK.fillRect(0,59,512,5);banK.fillStyle='#2a2433';fit(banK,s,490,40);banK.textAlign='center';banK.textBaseline='middle';banK.fillText(s,256,34);banT.needsUpdate=true}

/* =================== VAPE HAZE BANKS (build up in the streets) =================== */
const hzC=document.createElement('canvas');hzC.width=hzC.height=64;{const k=hzC.getContext('2d'),g=k.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.6,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');k.fillStyle=g;k.fillRect(0,0,64,64)}
const hzT=new T.CanvasTexture(hzC),haze=[];
for(let i=0;i<(X.touch?10:16);i++){const s=new T.Sprite(new T.SpriteMaterial({map:hzT,color:pick([0xf6d0ee,0xe8d8ff,0xffe0ea,0xd8f0ff]),transparent:true,opacity:0,depthWrite:false}));s.visible=false;scene.add(s);
  haze.push({s,ax:Math.random()<.5,l:pick(LINES),o:rand(-60,60),v:rand(.4,.9)*(Math.random()<.5?-1:1),sx:rand(12,20),sy:rand(3,5),ph:rand(0,6)})}
function drift(dt,t,k){const op=.3*ss(.12,.9,k),on=op>.01;for(const h of haze){h.s.visible=on;if(!on)continue;h.o+=h.v*dt;if(h.o>66)h.o=-66;if(h.o<-66)h.o=66;const wob=Math.sin(t*.3+h.ph)*1.5,y=1.4+Math.sin(t*.5+h.ph)*.3;
  h.ax?h.s.position.set(h.l+wob,y,h.o):h.s.position.set(h.o,y,h.l+wob);h.s.scale.set(h.sx*(.7+.3*k),h.sy,1);h.s.material.opacity=op*(.75+.25*Math.sin(t*.4+h.ph))}}

/* =================== TIME OF DAY (driven by vapes used) =================== */
const hemi=scene.children.find(o=>o.isHemisphereLight),sunL=scene.children.find(o=>o.isDirectionalLight),
  dome=scene.children.find(o=>o.isMesh&&o.geometry.parameters&&o.geometry.parameters.radius===430),
  sunBall=scene.children.find(o=>o.isMesh&&o.material&&o.material.isMeshBasicMaterial&&o.scale.x===34),
  cloudG=scene.children.find(g=>g.isGroup&&g.children[0]&&g.children[0].material&&g.children[0].material.isMeshBasicMaterial&&g.children[0].material.fog===false),cloudM=cloudG&&cloudG.children[0].material;
const KS=[0,.4,.72,1],P=a=>a.map(h=>new T.Color(h));
const ZEN=P([0x2a62d8,0x3a5ec4,0x4a3c9c,0x22184c]),MID=P([0x6fb6ff,0x9cc6ee,0xd77aa8,0x6a3a8a]),HOR=P([0xbfe6ff,0xffe4be,0xffa07a,0xff7f96]),GLOW=P([0xbfe6ff,0xfff0c0,0xffc070,0xff9a70]),
  CLD=P([0xffffff,0xfff4e0,0xffc6a6,0xd890c0]),SUNC=P([0xfff2a0,0xfff0a0,0xffb060,0xff6a4a]),SUNL=P([0xfff2d0,0xffe8c0,0xffb070,0xff8a78]),
  HSKY=P([0xffffff,0xfff6e8,0xffd6c4,0xc8b0e8]),HGND=P([0x7aa06a,0x7aa06a,0x8a7a6a,0x5a5a8a]),SEA=P([0xffffff,0xfff0dc,0xffc0b0,0xd0a0d8]);
function kf(arr,k,out){let i=0;while(i<KS.length-2&&k>KS[i+1])i++;return out.copy(arr[i]).lerp(arr[i+1],clamp((k-KS[i])/(KS[i+1]-KS[i]),0,1))}
const skyC=document.createElement('canvas');skyC.width=256;skyC.height=128;const skyK=skyC.getContext('2d'),skyT=new T.CanvasTexture(skyC);
// painted cardboard backdrop: loose brush strokes and the seams between board panels, laid over the time-of-day gradient
const skyP=document.createElement('canvas');skyP.width=256;skyP.height=128;{const k=skyP.getContext('2d');k.lineCap='round';
  for(let i=0;i<220;i++){const y=rand(2,70),x=rand(-30,256),L=rand(25,90),lw=rand(3,11),c=Math.random()<.6?'255,255,255':'20,40,110';k.strokeStyle=`rgba(${c},${rand(.05,.14).toFixed(3)})`;k.lineWidth=lw;
    for(const o of[0,256]){k.beginPath();k.moveTo(x-o,y);k.bezierCurveTo(x-o+L*.3,y+rand(-4,4),x-o+L*.7,y+rand(-4,4),x-o+L,y+rand(-3,3));k.stroke()}}
  for(let i=0;i<4;i++){const x=i*64+rand(-6,6);k.fillStyle='rgba(40,30,60,.10)';k.fillRect(x,0,1.4,128);k.fillStyle='rgba(255,255,255,.10)';k.fillRect(x+1.4,0,1,128)}
  for(let i=0;i<900;i++){k.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'60,50,90'},.05)`;k.fillRect(rand(0,256),rand(0,128),rand(1,3),1)}}
const zc=new T.Color(),mc=new T.Color(),hc=new T.Color(),gc=new T.Color(),hex=c=>'#'+c.getHexString();
if(dome){dome.material.map=skyT;dome.material.needsUpdate=true}
const sun0=new T.Vector3(150,150,-220),sun1=new T.Vector3(-40,45,-330),SUNDIR=sun0.clone().normalize();let K=0,NIGHT=0,lastK=-1;
function timeOfDay(){const k=ss(0,1,Math.min(1,X.used/5000));K=k;
  if(Math.abs(k-lastK)>.003){lastK=k;kf(HOR,k,hc);kf(ZEN,k,zc);kf(MID,k,mc);kf(GLOW,k,gc);
    const g=skyK.createLinearGradient(0,0,0,128);g.addColorStop(0,hex(zc));g.addColorStop(.36,hex(mc));g.addColorStop(.47,hex(gc));g.addColorStop(.5,hex(hc));g.addColorStop(1,hex(hc));skyK.fillStyle=g;skyK.fillRect(0,0,256,128);skyK.drawImage(skyP,0,0);skyT.needsUpdate=true;
    if(cloudM)kf(CLD,k,cloudM.color);if(sunBall){kf(SUNC,k,sunBall.material.color);sunBall.position.lerpVectors(sun0,sun1,ss(.1,1,k));sunBall.scale.setScalar(34+16*k)}
    if(sunL){kf(SUNL,k,sunL.color);sunL.intensity=lerp(.95,.72,ss(.6,1,k));if(sunBall){SUNDIR.copy(sunBall.position).normalize();sunL.position.copy(SUNDIR).multiplyScalar(100)}}
    if(hemi){kf(HSKY,k,hemi.color);kf(HGND,k,hemi.groundColor);hemi.intensity=lerp(.62,.5,ss(.5,1,k))}kf(SEA,k,seaM.color);
    NIGHT=ss(.58,.95,k);for(const m of WIN)m.emissiveIntensity=NIGHT*.9;pools.visible=halos.visible=NIGHT>.01;pools.material.opacity=.3*NIGHT;halos.material.opacity=.4*NIGHT;
    stars.visible=k>.8;stars.material.opacity=ss(.8,1,k)}
  // the core lerps sky/fog toward pink haze each frame; this runs after it (prerender) and replaces it with the sunset palette
  scene.background.copy(hc);scene.fog.color.copy(hc);scene.fog.near=lerp(30,9,k);scene.fog.far=lerp(210,85,k);if(dome){dome.material.opacity=1;stars.position.copy(dome.position)}}

/* =================== PER-FRAME =================== */
X.on('prerender',(dt,t)=>{timeOfDay();
  const A=seaP.array;for(let i=0;i<seaY0.length;i+=3){const x=seaY0[i],z=seaY0[i+2];A[i+1]=seaY0[i+1]+Math.sin(x*.07+t*1.3)*.09+Math.sin(z*.13+t*.9+x*.02)*.08}seaP.needsUpdate=true;
  seaM.map.offset.set(t*.004,t*.012);const sw=Math.sin(t*.8);foam.position.z=SHORE+.4+sw*1.1;foam.scale.z=1.4+(1-Math.abs(sw))*.8;foam.material.opacity=.55+.3*Math.abs(sw);
  floatM.position.set(-14+Math.sin(t*.1)*3,.08+Math.sin(t*1.4)*.12,-133);floatM.rotation.set(Math.sin(t*1.1)*.08,t*.15,Math.cos(t*1.3)*.08);
  finA+=dt*.55;fin.position.set(44+Math.cos(finA)*7,Math.sin(t*2)*.05,-139+Math.sin(finA)*5);fin.rotation.y=-PI/2-finA;
  if(X.mode==='play'&&(dunT-=dt)<0&&Math.hypot(X.px-fin.position.x,X.pz-fin.position.z)<16){dunT=7;X.beep(82,.5,'sawtooth',.05);X.beep(87,.5,'sawtooth',.05,.55);X.beep(82,.25,'sawtooth',.05,1.1);X.beep(87,.25,'sawtooth',.05,1.4)}
  for(const c of cars)drive(c,dt,t);
  const ph=Math.floor(t/2)%7;if(ph!==sigPh){sigPh=ph;SIGL.forEach((_,i)=>{const q=(ph+i*2)%7,on=q<3?2:q<4?1:0;for(let j=0;j<3;j++)lampsI.setColorAt(i*3+j,_c.setHex(LCOL[j][j===on?0:1]))});lampsI.instanceColor.needsUpdate=true}
  flock(t);
  const ba=t*.042;blimp.position.set(Math.cos(ba)*105,52+Math.sin(t*.4)*1.2,-10+Math.sin(ba)*105);blimp.rotation.set(0,Math.atan2(-Math.sin(ba),Math.cos(ba)),Math.sin(t*.3)*.04);banner(dt);
  drift(dt,t,K)});
X.world={get k(){return K},get night(){return NIGHT},cars,blimp,sunDir:SUNDIR,tex:{sand:sandT,sea:seaT,plank:plankT}};
})();
