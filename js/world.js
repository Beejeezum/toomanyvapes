/* world mod: an actual beach past Muscle Beach, traffic, birds, a blimp, street props, vape haze,
   and a sky that slides from noon to a pink sunset (then dusk, streetlights, lit windows, stars) as the vapes run out.
   The town is dressed as a crafty tabletop set made from household things: cereal-box buildings with fluted card edges and kraft roofs,
   card kerbs, painted lane strokes, sponge trees, button flowers, pom-pom hedges, thimble hydrants, paperclip lamps, matchbox cars,
   a tissue-box ice-cream van, thread-spool bins, lipstick-cap signals, popsicle-stick benches, clothespin fences, a doily gazebo.
   Built only on window.TMV. Static props are merged into a few vertex-coloured meshes to keep draw calls low (no ink hulls: the clay mod
   gives everything a plasticine/cardboard surface instead). Exposes TMV.world = {k (0..1 time of day), night (0..1), cars, blimp, sunDir, tex}. */
(()=>{const X=window.TMV;if(!X||X.world)return;
const T=X.T,{scene,W,LINES,rand,ri,pick,clamp,lerp}=X,PI=Math.PI,GRAD=X.M(0xffffff).gradientMap;
const ss=(a,b,v)=>{v=clamp((v-a)/(b-a),0,1);return v*v*(3-2*v)};
const VCM=new T.MeshToonMaterial({gradientMap:GRAD,vertexColors:true});
const GEO={b:new T.BoxGeometry(1,1,1),s:new T.SphereGeometry(.5,8,6),c:new T.CylinderGeometry(.5,.5,1,8),k:new T.ConeGeometry(.5,1,8),p:new T.ConeGeometry(.5,1,4),t:new T.TorusGeometry(.4,.15,6,12)};
// u: paper cup (wide top), r: bottle cap with a crimped edge
GEO.u=new T.CylinderGeometry(.5,.34,1,12);
// rb: a rounded box (rolled plasticine), slightly lumpy
GEO.rb=(()=>{const g=new T.BoxGeometry(1,1,1,3,4,3),p=g.attributes.position,nn=g.attributes.normal,v=new T.Vector3(),c=new T.Vector3(),r=.2,h=.5-r;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(clamp(v.x,-h,h),clamp(v.y,-h,h),clamp(v.z,-h,h));v.sub(c).normalize();nn.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(r*(1+.08*Math.sin(c.y*17+c.x*9))).add(c);p.setXYZ(i,v.x,v.y,v.z)}return g})();GEO.r=(()=>{const g=new T.CylinderGeometry(.5,.5,1,24),P=g.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);if(Math.hypot(x,z)<.49)continue;const k=1+.07*Math.cos(Math.atan2(z,x)*12);P.setX(i,x*k);P.setZ(i,z*k)}g.computeVertexNormals();return g})();
for(const k in GEO)GEO[k]=GEO[k].toNonIndexed();
const _m=new T.Matrix4(),_m2=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_e2=new T.Euler(),_p=new T.Vector3(),_s=new T.Vector3(),_v=new T.Vector3(),_c=new T.Color(),_n3=new T.Matrix3(),ID=new T.Matrix4();
const WG=new T.Group();scene.add(WG);

/* ---------- craft materials: popsicle sticks, corrugated card edges, raw kraft board (the clay mod reads userData.clayKind) ---------- */
const C2=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h||w;return c};
const ANISO=Math.min(8,X.R.capabilities.getMaxAnisotropy());
function craftTex(w,h,paint){const c=C2(w,h);paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=ANISO;t.minFilter=T.LinearMipmapLinearFilter;return t}
const craftMat=(map,kind,vc)=>{const m=new T.MeshToonMaterial({gradientMap:GRAD,map,vertexColors:!!vc});m.userData.clayKind=kind;return m};
// one flute of corrugated card seen edge-on: liner / wavy fluting over dark hollows / liner (one wave per tile along u, one row along v)
const fluteT=craftTex(64,64,(k,n)=>{const g=k.createLinearGradient(0,0,0,n);g.addColorStop(0,'#7a5230');g.addColorStop(.5,'#4e3219');g.addColorStop(1,'#7a5230');k.fillStyle=g;k.fillRect(0,0,n,n);
  k.lineCap='round';const wave=o=>{k.beginPath();for(let x=-2;x<=n+2;x+=2)k.lineTo(x,n/2+Math.cos(x/n*PI*2)*n*.3+o);};
  k.strokeStyle='#d3a56c';k.lineWidth=9;wave(0);k.stroke();k.strokeStyle='rgba(255,236,200,.55)';k.lineWidth=2;wave(-2);k.stroke();k.strokeStyle='rgba(60,35,15,.5)';k.lineWidth=1.5;wave(3.5);k.stroke();
  for(const[y0,y1]of[[0,9],[n-9,n]]){k.fillStyle='#d2a571';k.fillRect(0,y0,n,y1-y0);k.fillStyle='rgba(90,55,25,.55)';k.fillRect(0,y0===0?8:n-9,n,1.2);k.fillStyle='rgba(255,240,210,.35)';k.fillRect(0,y0===0?1:n-8,n,1)}
  for(let i=0;i<160;i++){k.fillStyle=Math.random()<.5?'rgba(255,240,210,.12)':'rgba(40,20,5,.12)';k.fillRect(rand(0,n),rand(0,n),rand(1,3),1)}});
// raw kraft board: fibres, mottling, a strip of parcel tape and a faint printed arrow
const kraftT=craftTex(256,256,(k,n)=>{k.fillStyle='#c79c6b';k.fillRect(0,0,n,n);
  for(let i=0;i<60;i++){const x=rand(0,n),y=rand(0,n),r=rand(10,40),g=k.createRadialGradient(x,y,0,x,y,r),c=Math.random()<.5?'150,105,60':'225,190,145';g.addColorStop(0,`rgba(${c},.25)`);g.addColorStop(1,`rgba(${c},0)`);k.fillStyle=g;k.fillRect(x-r,y-r,r*2,r*2)}
  k.lineCap='round';for(let i=0;i<5000;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),l=rand(1.5,5);k.strokeStyle=Math.random()<.5?'rgba(110,70,35,.22)':'rgba(240,215,175,.22)';k.lineWidth=rand(.4,.9);k.beginPath();k.moveTo(x,y);k.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);k.stroke()}
  k.fillStyle='rgba(150,100,45,.35)';k.fillRect(0,n*.58,n,n*.14);k.fillStyle='rgba(255,235,190,.18)';k.fillRect(0,n*.59,n,2);
  k.strokeStyle='rgba(70,45,30,.28)';k.lineWidth=4;k.beginPath();k.moveTo(n*.25,n*.42);k.lineTo(n*.25,n*.18);k.moveTo(n*.17,n*.27);k.lineTo(n*.25,n*.18);k.lineTo(n*.33,n*.27);k.stroke()});
// popsicle-stick wood: pale birch with grain along u (tinted by vertex colour)
const stickT=craftTex(128,128,(k,n)=>{k.fillStyle='#f4ece0';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<22;i++){const y=rand(0,n),a=rand(1.5,4),f=ri(3)+1,ph=rand(0,6);k.strokeStyle=Math.random()<.65?`rgba(150,110,70,${rand(.12,.32).toFixed(2)})`:'rgba(255,250,240,.35)';k.lineWidth=rand(.6,2.2);
    for(const o of[-n,0,n]){k.beginPath();for(let x=-2;x<=n+2;x+=4)k.lineTo(x,y+o+Math.sin(x/n*PI*2*f+ph)*a);k.stroke()}}
  for(let i=0;i<500;i++){k.fillStyle=Math.random()<.5?'rgba(160,120,80,.12)':'rgba(255,255,255,.14)';k.fillRect(rand(0,n),rand(0,n),rand(2,7),1)}});
const FLUTEM=craftMat(fluteT,'flute'),KRAFTM=craftMat(kraftT,'kraft',true),STICKM=craftMat(stickT,'stick',true);
// plasticine pressed into shape by hand: deeper thumbprints than the town's smooth clay (clay mod kind 'thumb')
const THUMBM=new T.MeshToonMaterial({gradientMap:GRAD,vertexColors:true});THUMBM.userData.clayKind='thumb';
const CLAYLEG=0x5a5368,TK=Kit(false,THUMBM);
const wrapDraw=(n,x,y,r,f)=>{for(const i of[-n,0,n])for(const j of[-n,0,n])if(x+i>-r&&x+i<n+r&&y+j>-r&&y+j<n+r)f(x+i,y+j)};
// kitchen sponge: pale foam full of irregular pores (tinted per disc by vertex colour)
const spongeT=craftTex(128,128,(k,n)=>{k.fillStyle='#efefef';k.fillRect(0,0,n,n);for(let i=0;i<300;i++){const x=rand(0,n),y=rand(0,n),r=Math.random()<.8?rand(.8,2.6):rand(2.6,5),a=rand(0,3),e=rand(.5,1);
  wrapDraw(n,x,y,r+2,(p,q)=>{k.fillStyle='rgba(255,255,255,.7)';k.beginPath();k.ellipse(p+.6,q+.9,r,r*e,a,0,PI*2);k.fill();k.fillStyle=`rgba(70,70,70,${rand(.55,.9).toFixed(2)})`;k.beginPath();k.ellipse(p,q,r,r*e,a,0,PI*2);k.fill()})}});
// pipe-cleaner / pom-pom / felt fuzz: dense soft fibres, greyscale (tinted by vertex colour)
const fuzzT=craftTex(128,128,(k,n)=>{k.fillStyle='#d4d4d4';k.fillRect(0,0,n,n);k.lineCap='round';const L=[new Path2D(),new Path2D(),new Path2D()];
  for(let i=0;i<5000;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),l=rand(2,6),c=rand(-1.4,1.4);wrapDraw(n,x,y,l,(p,q)=>{const P=L[i%3];P.moveTo(p,q);P.quadraticCurveTo(p+Math.cos(a+c)*l*.5,q+Math.sin(a+c)*l*.5,p+Math.cos(a)*l,q+Math.sin(a)*l)})}
  k.lineWidth=.9;k.strokeStyle='rgba(255,255,255,.55)';k.stroke(L[0]);k.strokeStyle='rgba(120,120,120,.45)';k.stroke(L[1]);k.lineWidth=.6;k.strokeStyle='rgba(250,250,250,.4)';k.stroke(L[2])});
// cardboard tube (loo roll): kraft with the spiral seam
const tubeT=craftTex(128,128,(k,n)=>{k.drawImage(kraftT.image,0,0,n,n);k.lineWidth=2.5;for(let o=-n;o<n*2;o+=n/2){k.strokeStyle='rgba(90,60,30,.5)';k.beginPath();k.moveTo(0,o);k.lineTo(n,o+n/2);k.stroke();k.strokeStyle='rgba(255,235,200,.4)';k.beginPath();k.moveTo(0,o+2.5);k.lineTo(n,o+n/2+2.5);k.stroke()}});
// paper doily: scalloped lace disc with cut-out holes (alpha-tested)
const doilyT=(()=>{const n=256,c=C2(n),k=c.getContext('2d'),m=n/2;k.fillStyle='#fbf7ef';k.beginPath();for(let i=0;i<=360;i++){const a=i/360*PI*2,r=m-4-Math.abs(Math.sin(a*18))*7;k.lineTo(m+Math.cos(a)*r,m+Math.sin(a)*r)}k.fill();
  k.globalCompositeOperation='destination-out';const ring=(R,cnt,r)=>{for(let i=0;i<cnt;i++){const a=i/cnt*PI*2;k.beginPath();k.arc(m+Math.cos(a)*R,m+Math.sin(a)*R,r,0,PI*2);k.fill()}};
  ring(m-16,36,3.2);ring(m-28,30,4.5);ring(m-42,24,3);ring(m-56,18,6);ring(m-72,14,3.5);ring(m-86,10,5);ring(22,6,4);
  for(let i=0;i<12;i++){const a=i/12*PI*2;k.beginPath();k.ellipse(m+Math.cos(a)*(m-64),m+Math.sin(a)*(m-64),9,3,a,0,PI*2);k.fill()}k.globalCompositeOperation='source-over';
  k.strokeStyle='rgba(180,170,150,.5)';k.lineWidth=1;for(const R of[m-22,m-50,m-78,30]){k.beginPath();k.arc(m,m,R,0,PI*2);k.stroke()}
  const t=new T.CanvasTexture(c);t.anisotropy=ANISO;return t})();
const SPONGEM=craftMat(spongeT,'sponge',true),FUZZM=craftMat(fuzzT,'fuzz',true);
const DOILYM=new T.MeshToonMaterial({gradientMap:GRAD,map:doilyT,alphaTest:.5,side:T.DoubleSide,emissive:0x6a6660,emissiveMap:doilyT});DOILYM.userData.clayKind='paper';
const WOODC=new Map([[0x9a6a48,0xb07a4e],[0xfff7ea,0xf0d0a0],[0xd8d0c0,0xe2bf8c]]);
/* geometry builder for merged craft meshes: position/normal/uv/colour, indexed */
function GB(){const P=[],N=[],U=[],C=[],I=[];const b={P,
  v(x,y,z,nx,ny,nz,u,w,c){P.push(x,y,z);N.push(nx,ny,nz);U.push(u,w);C.push(c?c.r:1,c?c.g:1,c?c.b:1);return P.length/3-1},
  // quad from corner o along a (u direction) and b (v direction), facing n
  quad(o,a,bb,n,u0,u1,v0,v1,c){const q=[[0,0,u0,v0],[1,0,u1,v0],[1,1,u1,v1],[0,1,u0,v1]].map(([s,t,u,w])=>b.v(o[0]+a[0]*s+bb[0]*t,o[1]+a[1]*s+bb[1]*t,o[2]+a[2]*s+bb[2]*t,n[0],n[1],n[2],u,w,c));
    const cr=[a[1]*bb[2]-a[2]*bb[1],a[2]*bb[0]-a[0]*bb[2],a[0]*bb[1]-a[1]*bb[0]];b.tri4(q,cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0)},
  tri4(q,rev){if(rev)I.push(q[0],q[2],q[1],q[0],q[3],q[2]);else I.push(q[0],q[1],q[2],q[0],q[2],q[3])},
  tri(a,c,d){I.push(a,c,d)},
  geo(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));
    g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(P.length/3>65535?new T.Uint32BufferAttribute(I,1):new T.Uint16BufferAttribute(I,1));g.computeBoundingSphere();return g},
  mesh(mat,par){if(!I.length)return null;const m=new T.Mesh(b.geo(),mat);(par||WG).add(m);return m}};return b}
// triangles / quads that always face up (+y), whatever order their corners come in
function upTri(gb,a,b,c){const P=gb.P,ax=P[a*3],az=P[a*3+2],cr=(P[b*3]-ax)*(P[c*3+2]-az)-(P[b*3+2]-az)*(P[c*3]-ax);if(cr<0)gb.tri(a,b,c);else gb.tri(a,c,b)}
function upQuad(gb,a,b,c,d){upTri(gb,a,b,c);upTri(gb,a,c,d)}
/* a box as one popsicle stick: wood grain runs along its longest side, whatever its orientation */
const _sv=new T.Vector3(),_sn=new T.Vector3(),SQ=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
function stickBox(gb,m4,w,h,d,col){const D=[w,h,d],th=D.indexOf(Math.min(w,h,d)),lg=D.indexOf(Math.max(w,h,d)),md=3-th-lg;
  if(th!==lg&&D[md]>.35&&D[md]>2.5*D[th]){const n=Math.max(2,Math.round(D[md]/.24)),S=[1,1,1],sz=D.slice();S[md]=.84/n;sz[md]=D[md]*S[md];
    for(let i=0;i<n;i++){const o=[0,0,0];o[md]=-.5+(i+.5)/n;stickOne(gb,m4.clone().multiply(new T.Matrix4().makeTranslation(o[0],o[1],o[2]).scale(_sv.set(S[0],S[1],S[2]))),sz[0],sz[1],sz[2],col)}return}
  stickOne(gb,m4,w,h,d,col)}
function stickOne(gb,m4,w,h,d,col){const D=[w,h,d],L=D.indexOf(Math.max(w,h,d)),c=_c.setHex(WOODC.get(col)||col).clone(),r=rand(0,9);_n3.getNormalMatrix(m4);
  for(let N=0;N<3;N++)for(const s of[1,-1]){const A=(N+1)%3,B=(N+2)%3,ids=[];
    _sn.set(0,0,0).setComponent(N,s).applyMatrix3(_n3).normalize();
    for(const[ia,ib]of SQ){const l=[0,0,0];l[N]=s*.5;l[A]=ia;l[B]=ib;_sv.set(l[0],l[1],l[2]).applyMatrix4(m4);
      let u,v;if(L!==N){const O=L===A?B:A;u=l[L]*D[L]/1.6+r;v=l[O]*D[O]/.45}else{u=l[A]*D[A]/.45+r;v=l[B]*D[B]/.45}
      ids.push(gb.v(_sv.x,_sv.y,_sv.z,_sn.x,_sn.y,_sn.z,u,v,c))}
    gb.tri4(ids,s<0)}}

/* ---------- kit: collect parts, merge into one vertex-coloured mesh + one ink hull ---------- */
function Kit(wood,mat){const P=[],I=[];let base=ID;const k={
  at(x,z,ry,y){base=new T.Matrix4().compose(_p.set(x,y||0,z),_q.setFromEuler(_e.set(0,ry||0,0,'XYZ')),_s.set(1,1,1));return k},
  reset(){base=ID;return k},
  add(g,w,h,d,col,x,y,z,rx,ry,rz,ink){const p={g,w,h,d,col,x,y,z,rx:rx||0,ry:ry||0,rz:rz||0,base};if(wood&&g==='b'&&WOODC.has(col)&&Math.min(w,h,d)>=.06)p.wood=true;P.push(p);if(ink!==false&&Math.max(w,h,d)>.25&&Math.min(w,h,d)>.04)I.push(p);return k},
  hull(w,h,d,x,y,z,rx,ry,rz){I.push({g:'b',w,h,d,x,y,z,rx:rx||0,ry:ry||0,rz:rz||0,base});return k},
  /* textured box (signs): its own mesh, placed through the current base transform; its outline joins the merged hull */
  tex(mat,w,h,d,x,y,z,ry,par){const m=new T.Mesh(GEO.b,mat);_m.compose(_p.set(x,y,z),_q.setFromEuler(_e.set(0,ry||0,0,'XYZ')),_s.set(w,h,d));_m2.multiplyMatrices(base,_m);_m2.decompose(m.position,m.quaternion,m.scale);(par||WG).add(m);k.hull(w,h,d,x,y,z,0,ry);return m},
  // wooden parts become one popsicle-stick mesh beside the vertex-coloured one
  build(par){const W0=P.filter(p=>p.wood),m=new T.Mesh(merge(P.filter(p=>!p.wood),0),mat||VCM);(par||WG).add(m);
    if(W0.length){const gb=GB();for(const p of W0){_m.compose(_p.set(p.x,p.y,p.z),_q.setFromEuler(_e.set(p.rx,p.ry,p.rz,'XYZ')),_s.set(p.w,p.h,p.d));stickBox(gb,new T.Matrix4().multiplyMatrices(p.base,_m),p.w,p.h,p.d,p.col)}gb.mesh(STICKM,par)}
    return m}};return k}
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
const SHORE=-125,PIERX=30,RAWC=new T.Color(1,1,1);
const sandT=tx(32,(k,n)=>{k.fillStyle='#f3dca2';k.fillRect(0,0,n,n);for(let i=0;i<200;i++){k.fillStyle=pick(['#e8cd8e','#fbe8b8','#dcbf80','#fff3cf']);k.fillRect(ri(n),ri(n),1+ri(2),1)}});
X.box(WG,380,.1,27,X.TM(sandT,95,7),0,.03,-112.5);
X.box(WG,380,.06,3,X.TM(sandT,95,.75,0xd8b97a),0,.062,SHORE+.6); // wet sand
const seaT=tx(32,(k,n)=>{k.fillStyle='#2f8fd8';k.fillRect(0,0,n,n);k.fillStyle='#4aa8ea';for(let i=0;i<n;i+=8)k.fillRect(0,i+ri(3),n,2);k.fillStyle='#bfeaff';for(let i=0;i<10;i++)k.fillRect(ri(n),ri(n),3+ri(5),1)});
const seaM=X.TM(seaT,48,20),seaG=new T.PlaneGeometry(760,300,38,15);seaG.rotateX(-PI/2);seaG.translate(0,.24,SHORE-150);
const sea=new T.Mesh(seaG,seaM);sea.userData.noInk=true;scene.add(sea);const seaP=seaG.attributes.position,seaY0=Float32Array.from(seaP.array);
// surf: a long strip of torn white tissue paper laid along the waterline, nudged in and out by hand (stop-motion steps)
const foamT=craftTex(256,64,(k,w,h)=>{k.clearRect(0,0,w,h);const p=[rand(0,9),rand(0,9)],e=(x,ph)=>4*Math.sin(x/w*PI*2*3+ph)+2.5*Math.sin(x/w*PI*2*11+ph*2)+rand(-1.2,1.2);
  k.beginPath();for(let x=0;x<=w;x+=3)k.lineTo(x,12+e(x,p[0]));for(let x=w;x>=0;x-=3)k.lineTo(x,h-12+e(x,p[1]));k.closePath();k.fillStyle='#fbfbf6';k.fill();
  k.lineCap='round';for(let i=0;i<900;i++){const x=rand(0,w),y=rand(4,h-4),a=rand(0,PI*2),l=rand(2,7);k.strokeStyle=`rgba(${Math.random()<.6?'255,255,255':'190,205,215'},${rand(.3,.7).toFixed(2)})`;k.lineWidth=rand(.4,1);
    k.beginPath();k.moveTo(x,y);k.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);k.stroke()}
  for(let i=0;i<14;i++){const x=rand(0,w),y=rand(16,h-16),r=rand(3,8);k.fillStyle='rgba(205,225,240,.5)';k.beginPath();k.ellipse(x,y,r*1.6,r,0,0,PI*2);k.fill()}});
foamT.repeat.set(380/7,1);const foamM=new T.MeshToonMaterial({gradientMap:GRAD,map:foamT,alphaTest:.5,emissive:0x8a9aa0});foamM.userData.clayKind='paper';
const foam=X.box(scene,380,.04,1.4,foamM,0,.32,SHORE);foam.userData.noCast=true;
/* wave flats: three rows of cut cardboard waves standing in the sea like theatre scenery, painted blue with dry-brushed white crests and the
   brown cut edge of the card showing; stagehands rock them side to side and up and down in stop-motion steps (a gap is left for the pier) */
const waveT=craftTex(512,128,(k,w,h)=>{k.clearRect(0,0,w,h);const top=x=>{const u=((x%w)+w)%w/w;return h*(.6-.48*Math.pow(Math.sin(PI*Math.pow(u,1.3)),.7))};
  const edge=()=>{k.beginPath();for(let x=0;x<=w;x+=2)k.lineTo(x,top(x))};
  edge();k.lineTo(w,h);k.lineTo(0,h);k.closePath();const g=k.createLinearGradient(0,0,0,h);g.addColorStop(0,'#4aa6e6');g.addColorStop(.55,'#2f7cc8');g.addColorStop(1,'#1d5aa0');k.fillStyle=g;k.fill();
  k.save();k.clip();k.lineCap='round';
  for(let i=0;i<90;i++){const x=rand(-40,w),y=rand(top(x)+6,h),L=rand(30,120);k.strokeStyle=`rgba(${Math.random()<.5?'140,205,250':'15,50,110'},${rand(.12,.3).toFixed(2)})`;k.lineWidth=rand(2,6);
    k.beginPath();k.moveTo(x,y);k.quadraticCurveTo(x+L*.5,y-rand(2,8),x+L,y+rand(-3,3));k.stroke()}
  for(let j=0;j<20;j++){const off=2+j*1.4,a=.95-j*.04;k.strokeStyle=`rgba(255,255,255,${a.toFixed(2)})`;k.lineWidth=rand(1.6,3.2);let x=rand(-20,0);
    while(x<w){const L=rand(20,90),x2=Math.min(w,x+L);if(Math.random()<.85-j*.04){k.beginPath();for(let q=x;q<=x2;q+=3)k.lineTo(q,top(q)+off+rand(-.5,.5));k.stroke()}x=x2+rand(2,16)}}
  k.restore();edge();k.strokeStyle='#8a6440';k.lineWidth=3;k.stroke()});
const WAVES=[[-128.5,.95,7,0xe2f3ff],[-146.5,1.35,9.5,0xc8e2fb],[-162,1.8,12.5,0xa8c8ee]].map(([z,h,per,col],i)=>{const gb=GB(),m=new T.MeshToonMaterial({gradientMap:GRAD,map:waveT,color:col,alphaTest:.5,side:T.DoubleSide,emissive:0x707070,emissiveMap:waveT});m.userData.clayKind='paper';
  for(const[x0,x1]of[[-190,PIERX-2.7],[PIERX+2.7,190]])gb.quad([x0,0,z],[x1-x0,0,0],[0,h,0],[0,0,1],x0/per,x1/per,0,1,RAWC);
  const mesh=gb.mesh(m,scene);mesh.userData.noCast=true;return{mesh,ph:i*2.1,a:.35+i*.15}});
for(const o of W.children)if(o.isMesh&&o.scale.x>=60&&o.position.y===-6&&o.position.z<-140)o.visible=false; // open the northern horizon: sea instead of hills
solid((-150+PIERX-2)/2,-138,PIERX-2+150,26);solid((150+PIERX+2)/2,-138,150-PIERX-2,26); // the sea (the pier stays walkable)
const BK=Kit(true),plankT=tx(32,(k,n)=>{k.fillStyle='#b98a5a';k.fillRect(0,0,n,n);k.fillStyle='#8a6240';for(let i=0;i<n;i+=6)k.fillRect(0,i,n,1);k.fillStyle='#a57a4c';for(let i=0;i<24;i++)k.fillRect(ri(n),ri(n),4,1)});
// pier
X.box(WG,4,.3,35,X.TM(plankT,2,18),PIERX,.25,-132.5);BK.hull(4,.3,35,PIERX,.25,-132.5);
for(let z=-126;z>=-150;z-=4)for(const s of[-1,1])BK.add('c',.45,1.6,.45,0xd9b88a,PIERX+s*1.8,-.4,z,0,0,0,false);
for(let z=-117;z>=-150;z-=3)for(const s of[-1,1])BK.add('b',.16,1,.16,0xfff7ea,PIERX+s*1.88,.9,z);
for(const s of[-1,1]){BK.add('b',.14,.14,34,0xfff7ea,PIERX+s*1.88,1.4,-133);BK.add('b',.1,.1,34,0xfff7ea,PIERX+s*1.88,.95,-133,0,0,0,false)}
BK.add('b',2.4,.12,.6,0x9a6a48,PIERX,.85,-148.5);BK.add('b',2.4,.6,.1,0x9a6a48,PIERX,1.2,-148.8);TK.add('rb',.13,.5,.5,CLAYLEG,PIERX-1,.6,-148.5,0,0,0,false);TK.add('rb',.13,.5,.5,CLAYLEG,PIERX+1,.6,-148.5,0,0,0,false);
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
spots.forEach(([x,z],i)=>{const c=UMB[i%UMB.length],tl=rand(-.12,.12);BK.add('c',.07,3.2,.07,0xe2c48e,x,1.6,z,tl,0,tl);BK.add('k',3.8,1,3.8,c,x+tl*1.6,3.3,z-tl*1.6);BK.add('k',3.85,.4,3.85,0xfff7ea,x+tl*1.6,3.05,z-tl*1.6,0,PI/8,0,false);BK.add('s',.3,.3,.3,c,x+tl*1.6,3.85,z-tl*1.6,0,0,0,false);
  BK.at(x+rand(1.6,2.2),z+rand(-.5,.5),rand(-.4,.4),.06);BK.add('b',1.3,.04,2.4,pick(TOW),0,0,0);for(const zz of[-.6,0,.6])BK.add('b',1.32,.05,.18,0xfff7ea,0,0,zz,0,0,0,false);BK.reset();
  if(i%3===0){BK.at(x-1.8,z+.6,rand(-.3,.3));BK.add('b',.9,.1,1.8,0xfff7ea,0,.45,.2);BK.add('b',.9,.1,1.1,0xfff7ea,0,.85,-.95,-.9,0,0);for(const sx of[-1,1])BK.add('b',.08,.45,1.8,0x5fd4ff,sx*.42,.22,0,0,0,0,false);BK.reset()}
  if(i%4===1)BK.add('s',.7,.7,.7,pick([0xff3fa4,0x5fd4ff,0xffd23c]),x+rand(-3,3),.35,z+rand(1.5,3))});
// sandcastle (flying a vape)
{const x=10,z=-119;BK.add('b',2.2,.9,2.2,0xe8cd8e,x,.45,z);for(const sx of[-1,1])for(const sz of[-1,1]){BK.add('c',.7,1.4,.7,0xe8cd8e,x+sx*1.1,.7,z+sz*1.1);BK.add('k',.8,.6,.8,0xdcbf80,x+sx*1.1,1.7,z+sz*1.1,0,0,0,false)}
  BK.add('c',.9,1.8,.9,0xe8cd8e,x,1.3,z);BK.add('k',1,.8,1,0xdcbf80,x,2.6,z);BK.add('b',.18,.7,.12,0xff3fa4,x,3.3,z,0,0,.2);BK.add('b',.06,.3,.3,0xb6ff3c,x+.1,3.6,z+.2,0,0,0,false)}
// food carts
/* a paper cocktail umbrella: pleated paper panels folded between the spokes (ridges at the spokes, a sag mid-panel, a pinked edge),
   in the cart's colour and a paler fold, printed with fan lines; a toothpick for a pole */
const umbT=craftTex(128,128,(k,n)=>{k.fillStyle='#f7f3ea';k.fillRect(0,0,n,n);k.lineCap='round';
  for(let i=0;i<9;i++){const u=(i+.5)/9*n;k.strokeStyle='rgba(120,90,80,.18)';k.lineWidth=1.2;k.beginPath();k.moveTo(n/2,0);k.lineTo(u,n);k.stroke()}
  k.strokeStyle='rgba(255,255,255,.55)';k.lineWidth=3;k.beginPath();k.moveTo(n/2,0);k.lineTo(n/2,n);k.stroke();
  for(const u of[1.5,n-1.5]){k.strokeStyle='rgba(90,60,40,.45)';k.lineWidth=2.4;k.beginPath();k.moveTo(n/2,0);k.lineTo(u,n);k.stroke()}
  k.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<n;i+=8){k.beginPath();k.moveTo(i,n);k.lineTo(i+4,n-6);k.lineTo(i+8,n);k.fill()}
  for(let i=0;i<500;i++){k.fillStyle=Math.random()<.5?'rgba(255,255,255,.18)':'rgba(90,60,40,.08)';k.fillRect(rand(0,n),rand(0,n),rand(1,3),1)}});
const UMBM=craftMat(umbT,'paper',true);UMBM.side=T.DoubleSide;
function umbrella(x,z,col){const gb=GB(),N=16,R=1.55,H=.5,y0=3.38,c1=new T.Color(col),c2=new T.Color(col).lerp(new T.Color(0xffffff),.45);
  for(let i=0;i<N;i++){const a0=i/N*PI*2,a1=(i+1)/N*PI*2,am=(a0+a1)/2,c=i%2?c2:c1;
    const A=gb.v(x,y0+H,z,0,1,0,.5,0,c),r0=gb.v(x+Math.cos(a0)*R,y0,z+Math.sin(a0)*R,0,1,0,0,1,c),m=gb.v(x+Math.cos(am)*R*.95,y0-.09,z+Math.sin(am)*R*.95,0,1,0,.5,1,c),r1=gb.v(x+Math.cos(a1)*R,y0,z+Math.sin(a1)*R,0,1,0,1,1,c);
    gb.tri(A,m,r0);gb.tri(A,r1,m)}
  const g=gb.geo().toNonIndexed();g.computeVertexNormals();const msh=new T.Mesh(g,UMBM);WG.add(msh);return msh}
function cart(K,x,z,ry,text,c1,c2){K.at(x,z,ry);K.add('b',2.4,1,1.2,c1,0,.95,0);K.add('b',2.44,.22,1.24,0xfff7ea,0,1.15,0,0,0,0,false);for(const s of[-.75,.75])K.add('r',.75,.15,.75,0xa9adb5,s,.4,.64,PI/2,0,0);
  K.add('b',.1,.1,1.4,0x777777,-1.45,1.3,0,0,0,0,false);K.add('c',.07,2.6,.07,0xe2c48e,0,2.45,0,0,0,0,false);K.add('s',.2,.2,.2,c1,0,3.92,0,0,0,0,false);umbrella(x,z,c2);
  K.add('b',.7,.25,.5,0xffd98a,.4,1.58,0,0,0,0,false);K.add('b',.12,.6,.12,0xff3fa4,-.5,1.75,.2,0,0,.3,false);
  const sm=signMat(text,'#fff7ea','#e0244a','#e0244a');K.tex(sm,2.4,.55,.1,0,2.2,.62);K.tex(sm,2.4,.55,.1,0,2.2,-.62,PI);K.reset();solid(x,z,ry?1.4:2.6,ry?2.6:1.4)}
cart(BK,-12,-106,0,'SAND-WICHES (CRUNCHY)',0x5fd4ff,0xffd23c);
// a duck on a float ring, and a shark that is definitely just a guy
const floatie=Kit();floatie.add('t',3,3,3,0xff3fa4,0,.1,0,PI/2,0,0);floatie.add('s',1.1,.9,1.3,0xffd23c,1.8,.45,0);floatie.add('s',.7,.7,.7,0xffd23c,1.8,1.1,.4);floatie.add('k',.3,.4,.3,0xff7a1a,1.8,1.05,.85,PI/2,0,0,false);floatie.add('s',.12,.12,.12,0x15101d,1.95,1.25,.62,0,0,0,false);
const floatM=floatie.build(scene);floatM.position.set(-14,0,-133);
const finK=Kit();finK.add('k',1.6,1.5,.3,0x6f7f8f,0,.5,0);finK.add('b',3,.04,.5,0xd8f2ff,-1.5,.1,0,0,0,0,false);const fin=finK.build(scene);let finA=0,dunT=0;
BK.build(WG);

/* =================== DOWNTOWN PROPS =================== */
const PK=Kit(true),signals=[[-11,-11],[11,-11],[-11,11],[11,11]];
// trash cans on free street corners, some overflowing with vapes
for(const a of LINES)for(const b of LINES){if(Math.random()<.35)continue;const x=a-4,z=b-4;
  // thread spools: wooden flanges round a reel of thread
  PK.add('c',.84,.1,.84,0xe2c38f,x,.05,z);PK.add('c',.66,.9,.66,pick([0x3b7a57,0xe0244a,0x3c8cff,0xffd23c,0xa070ff]),x,.55,z);PK.add('c',.84,.1,.84,0xe2c38f,x,1.05,z);PK.add('c',.2,.03,.2,0x6a4a2e,x,1.105,z,0,0,0,false);
  if(Math.random()<.5)for(let i=0;i<3;i++)PK.add('b',.12,.3,.08,pick([0xff3fa4,0xb6ff3c,0x5fd4ff,0xffd23c]),x+rand(-.2,.2),1.25,z+rand(-.2,.2),rand(-.6,.6),rand(0,3),rand(-.6,.6),false);solid(x,z,.75,.75)}
// traffic signal poles (lamps are an instanced mesh below)
const SIGL=[];for(const[a,b]of signals){const x=a+4,z=b-4;PK.add('c',.14,4.8,.14,0x8a8f98,x,2.4,z);PK.add('c',.3,1.5,.3,0x1b1a20,x,4.55,z);for(const y of[3.82,5.27])PK.add('c',.33,.1,.33,0xd9b02a,x,y,z,0,0,0,false);PK.add('s',.3,.2,.3,0x1b1a20,x,5.33,z,0,0,0,false);SIGL.push([x,z]);solid(x,z,.3,.3)}
// benches mid-block, facing the road
for(let i=0;i<10;i++){const a=pick(LINES),b=pick(LINES.slice(0,5))+11,s=pick([-1,1]),x=a+s*4.05,z=b+rand(-2,2);PK.at(x,z,s>0?-PI/2:PI/2);PK.add('b',2.2,.12,.6,0x9a6a48,0,.55,0);PK.add('b',2.2,.6,.1,0x9a6a48,0,.9,-.3);TK.at(x,z,s>0?-PI/2:PI/2);TK.add('rb',.13,.55,.5,CLAYLEG,-.9,.27,0,0,0,0,false);TK.add('rb',.13,.55,.5,CLAYLEG,.9,.27,0,0,0,0,false);TK.reset();PK.reset()}
// bus stop (the bus never comes)
{const x=-22,z=61;PK.at(x,z,0);PK.add('b',5,.15,2,0x3a3340,0,2.7,0);PK.add('b',5,2.4,.1,0x9adcff,0,1.45,.95);for(const s of[-1,1]){PK.add('b',.15,2.7,.15,0x3a3340,s*2.4,1.35,.9);PK.add('b',.15,2.7,.15,0x3a3340,s*2.4,1.35,-.9);PK.add('b',.08,2.2,1.7,0x9adcff,s*2.45,1.4,0,0,0,0,false)}
  PK.add('b',3.4,.14,.6,0x9a6a48,0,.6,.5);TK.at(x,z,0);TK.add('rb',.15,.6,.15,CLAYLEG,-1.4,.3,.5,0,0,0,false);TK.add('rb',.15,.6,.15,CLAYLEG,1.4,.3,.5,0,0,0,false);TK.reset();
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
PK.build(WG);TK.build(WG);
/* =================== CRAFT SET DRESSING ===================
   Cardboard-model details for the core town, all merged into a handful of meshes (fewer draw calls than before):
   fluted card edges on building corners, roof boards and building bases; raw kraft roofs; card kerbs with a corrugated face where
   the sidewalk meets the road; hand-painted lane dashes; lumpy clay trees; benches and fences as popsicle sticks. */
function mergeIdx(list){let nv=0,ni=0;for(const[g]of list){nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),col=new Float32Array(nv*3),idx=new Uint32Array(ni);let o=0,q=0;
  for(const[g,mx,c]of list){_n3.getNormalMatrix(mx);const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,I=g.index;if(c!=null)_c.setHex(c);else _c.setRGB(1,1,1);
    for(let i=0;i<P.count;i++){const j=(o+i)*3;_v.fromBufferAttribute(P,i).applyMatrix4(mx);pos[j]=_v.x;pos[j+1]=_v.y;pos[j+2]=_v.z;_v.fromBufferAttribute(N,i).applyMatrix3(_n3).normalize();nor[j]=_v.x;nor[j+1]=_v.y;nor[j+2]=_v.z;
      if(U){uv[(o+i)*2]=U.getX(i);uv[(o+i)*2+1]=U.getY(i)}col[j]=_c.r;col[j+1]=_c.g;col[j+2]=_c.b}
    if(I)for(let i=0;i<I.count;i++)idx[q++]=I.getX(i)+o;else for(let i=0;i<P.count;i++)idx[q++]=o+i;o+=P.count}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(nor,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('color',new T.BufferAttribute(col,3));
  g.setIndex(new T.BufferAttribute(idx,1));g.computeBoundingSphere();return g}
{const TXS=X.TXS||{},gone=[],FL=GB(),KR=GB(),KT=GB(),DS=GB(),WS=GB(),RAW=new T.Color(1,1,1),FP=.3,CAP=X.M(0x3a3340);let sideMat=null;
  const flute=(o,a,b,n,rows,len)=>FL.quad(o,a,b,n,0,len/FP,0,rows);
  const rects=[[-8,8,13.4,17.2]]; // Cloud Kingz' own sidewalk (x0,x1,z0,z1): no kerb across it
  /* buildings: fluted corners, a kraft roof board with double-wall edges (replaces the dark cap), fluted base */
  // the cut edge of each wall panel, fluted, running up every corner
  const corners=(x,z,w,d,h,e)=>{const t=.24;for(const sx of[-1,1])for(const sz of[-1,1]){const cx=x+sx*w/2,cz=z+sz*d/2;
    flute([cx+sx*e,0,cz-sz*(t-e)],[0,h,0],[0,0,sz*t],[sx,0,0],1,h);flute([cx-sx*(t-e),0,cz+sz*e],[0,h,0],[sx*t,0,0],[0,0,sz],1,h)}};
  // Cloud Kingz: same card corners, and its painted walls are corrugated card too
  {const S=W.children.find(o=>o.isGroup&&o.position.x===0&&o.position.z===22);if(S){corners(0,22,12,10,4.45,.08);
    S.traverse(o=>{const m=o.material;if(o.isMesh&&m&&m.isMeshToonMaterial&&!m.map&&[0x7fd6c8,0xf2a7bb].includes(m.color.getHex())){o.material=m.clone();o.material.userData.clayKind='wall'}})}}
  const blds=W.children.filter(o=>{const m=o.material;return o.isMesh&&m&&m.isMeshToonMaterial&&m.map&&m.map.image&&m.map.image.width===256&&m.map.image.height===256&&o.geometry.type==='BoxGeometry'&&o.scale.y>4});
  for(const b of blds){const x=b.position.x,z=b.position.z,w=b.scale.x,h=b.scale.y,d=b.scale.z;
    for(const o of W.children){if(!o.isMesh||Math.abs(o.position.x-x)>.01||Math.abs(o.position.z-z)>.01)continue;
      if(o.material===CAP&&Math.abs(o.position.y-(h+.25))<.02)gone.push(o);
      else if(o.material.map&&o.material.map.image===TXS.tile.image&&o.scale.y<.2){sideMat=o.material;const pw=o.scale.x/2,pd=o.scale.z/2,y1=.12;rects.push([x-pw,x+pw,z-pd,z+pd]);
        for(const s of[-1,1]){flute([x-pw,0,z+s*(pd+.006)],[2*pw,0,0],[0,y1,0],[0,0,s],1,2*pw);flute([x+s*(pw+.006),0,z-pd],[0,0,2*pd],[0,y1,0],[s,0,0],1,2*pd)}}}
    corners(x,z,w,d,h,.05);
    const rw=w/2+.35,rd=d/2+.35,y0=h,y1=h+.5;
    for(const s of[-1,1]){flute([x-rw,y0,z+s*rd],[2*rw,0,0],[0,y1-y0,0],[0,0,s],2,2*rw);flute([x+s*rw,y0,z-rd],[0,0,2*rd],[0,y1-y0,0],[s,0,0],2,2*rd)}
    KR.quad([x-rw,y1,z-rd],[2*rw,0,0],[0,0,2*rd],[0,1,0],(x-rw)/7,(x+rw)/7,(z-rd)/7,(z+rd)/7,RAW);KR.quad([x-rw,y0+.01,z-rd],[2*rw,0,0],[0,0,2*rd],[0,-1,0],0,2*rw/7,0,2*rd/7,RAW)}
  /* kerbs: a strip of thick card along every road edge and round the plaza, its sides showing the flutes */
  const H=3.5,E=62,KW=.3,KH=.16,blocks=[];{let a=-E;for(const l of LINES){blocks.push([a,l-H]);a=l+H}blocks.push([a,E])}
  const cut=(axis,c0,c1,s0,s1)=>{let segs=[[s0,s1]];for(const r of rects){const[p0,p1,q0,q1]=axis===0?r:[r[2],r[3],r[0],r[1]];if(p1<=c0||p0>=c1)continue;const nx=[];
      for(const[u,v]of segs){if(q1<=u||q0>=v){nx.push([u,v]);continue}if(q0>u)nx.push([u,q0]);if(q1<v)nx.push([q1,v])}segs=nx}return segs.filter(([u,v])=>v-u>.2)};
  const kerb=(axis,c,sgn,s0,s1)=>{const c0=Math.min(c,c-sgn*KW),c1=Math.max(c,c-sgn*KW);for(const[u,v]of cut(axis,c0,c1,s0,s1)){const len=v-u;
    if(axis===0){flute([c,0,u],[0,0,len],[0,KH,0],[sgn,0,0],1,len);flute([c-sgn*KW,0,u],[0,0,len],[0,KH,0],[-sgn,0,0],1,len);KT.quad([c0,KH,u],[c1-c0,0,0],[0,0,len],[0,1,0],c0/20,c1/20,u/20,v/20)}
    else{flute([u,0,c],[len,0,0],[0,KH,0],[0,0,sgn],1,len);flute([u,0,c-sgn*KW],[len,0,0],[0,KH,0],[0,0,-sgn],1,len);KT.quad([u,KH,c0],[len,0,0],[0,0,c1-c0],[0,1,0],u/20,v/20,c0/20,c1/20)}}};
  for(const l of LINES)for(const[s0,s1]of blocks){kerb(0,l-H,1,s0,s1);kerb(0,l+H,-1,s0,s1);kerb(1,l-H,1,s0,s1);kerb(1,l+H,-1,s0,s1)}
  for(const[s0,s1]of blocks){kerb(0,-E,-1,s0,s1);kerb(0,E,1,s0,s1);kerb(1,-E,-1,s0,s1);kerb(1,E,1,s0,s1)}
  /* lane dashes and zebra crossings: single strokes of poster paint on the black paper (bristle streaks, a loaded round start, a dry-brush
     tail that breaks up into separate hairs); the stroke shapes live in an alpha-tested atlas, tinted yellow or white per stroke */
  // streets and their paint are laid out from a fixed seed, so the street outside Cloud Kingz looks the same on every load (the opening's
  // last shot cuts to this view)
  const SR=(s=>()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(20261110),srand=(a,b)=>a+SR()*(b-a),sri=n=>Math.floor(SR()*n);
  const DASH=X.M(0xffe27a),yel=new T.Color();
  const PAINT_ROWS=4,strokeT=craftTex(512,256,(k,Wd,Ht)=>{k.clearRect(0,0,Wd,Ht);k.lineCap='round';const H=Ht/PAINT_ROWS;
    for(let r=0;r<PAINT_ROWS;r++){const cy=r*H+H/2,hw=H*.36,tail=srand(.14,.26)*Wd,r0=hw*srand(.7,1.05),wob=[srand(0,9),srand(0,9),srand(0,9)];
      const ed=(x,s)=>hw*(.9+.05*Math.sin(x*.021+wob[0]+s)+.035*Math.sin(x*.067+wob[1]*s)+.02*Math.sin(x*.19+wob[2]));
      // the solid body of the stroke, ragged along both edges
      k.fillStyle='rgb(228,228,228)';k.beginPath();for(let x=r0;x<=Wd-tail;x+=4)k.lineTo(x,cy-ed(x,0));for(let x=Wd-tail;x>=r0;x-=4)k.lineTo(x,cy+ed(x,2));k.closePath();k.fill();
      k.beginPath();k.ellipse(r0+1,cy,r0,hw*.92,0,0,PI*2);k.fill();
      // bristles: streaks of thicker and thinner paint, breaking into separate hairs toward the tail and the edges
      const nb=64;for(let j=0;j<nb;j++){const f=(j+.5)/nb*2-1,e=Math.abs(f),yy=cy+f*hw*1.02+srand(-.5,.5),lum=(205+srand(-30,45))|0;
        const x0=r0*(1-Math.sqrt(Math.max(0,1-f*f)))+srand(0,3),x1=Wd-2-srand(0,tail)*(.15+e*.85)-srand(0,6);
        k.strokeStyle=`rgb(${lum},${lum},${lum})`;k.lineWidth=srand(.9,1.8);let x=x0;
        while(x<x1){const L=srand(25,160)*(1-e*.55),dry=x>Wd-tail*1.3||e>.86,x2=Math.min(x+L,x1);k.beginPath();k.moveTo(x,yy+srand(-.3,.3));k.lineTo(x2,yy+srand(-.4,.4));k.stroke();x=x2+(dry?srand(2,14):srand(0,1.5))}}
      // a few dry gaps where the brush skipped over the paper's tooth
      k.save();k.globalCompositeOperation='destination-out';for(let i=0;i<8;i++){const x=srand(Wd*.25,Wd-tail*.5),y=cy+(SR()<.5?-1:1)*hw*srand(.7,.95);k.fillStyle='rgba(0,0,0,.9)';k.fillRect(x,y,srand(10,40),srand(.5,1))}k.restore()}});
  const PAINTM=new T.MeshToonMaterial({gradientMap:GRAD,map:strokeT,vertexColors:true,alphaTest:.5});PAINTM.userData.clayKind='paint';
  const paint=(cx,cz,alongZ,len,wd,col)=>{const segs=6,curve=srand(-.04,.04)*len/2.2,ang=srand(-.025,.025),ca=Math.cos(ang),sa=Math.sin(ang),y=.052,row=sri(PAINT_ROWS),flip=SR()<.5;
    const v0=(row+.06)/PAINT_ROWS,v1=(row+.94)/PAINT_ROWS,hw=wd*.5/.8;let prev=null;
    for(let i=0;i<=segs;i++){const t=i/segs,s=(t-.5)*len,off=curve*(1-(2*t-1)**2),u=flip?1-t:t;
      const P=o=>{const lx=s*ca-o*sa,lz=s*sa+o*ca;return alongZ?[cx+lz,cz+lx]:[cx+lx,cz+lz]},A=P(off-hw),B=P(off+hw);
      const ids=[DS.v(A[0],y,A[1],0,1,0,u,v0,col),DS.v(B[0],y,B[1],0,1,0,u,v1,col)];if(prev)upQuad(DS,prev[0],ids[0],ids[1],prev[1]);prev=ids}};
  // crossings get zebra stripes on the inner four-by-four; lane dashes keep clear of crossings and zebras
  const ZEB=l=>Math.abs(l)<=33,X0=3.7;
  const dash=(cx,cz,alongZ)=>{const s=alongZ?cz:cx,l=alongZ?cx:cz;for(const L of LINES){const d=Math.abs(s-L);if(d<X0+1.2||ZEB(L)&&ZEB(l)&&d<X0+3.3)return}
    yel.setHSL(srand(.115,.13),srand(.82,.95),srand(.53,.6));paint(cx,cz,alongZ,2.3*srand(.92,1.06),.3*srand(.9,1.1),yel.clone())};
  /* ---------- household objects: what a crafty person would build the town from ----------
     kitchen-sponge trees on twigs, button-and-pin flowers, pom-pom hedges, pipe-cleaner crops, thimble hydrants, paperclip street lamps,
     tin-can water towers on chopsticks, a doily gazebo on straws, felt lily pads, a shoebox barn, a loo-roll silo, clothespin fence posts.
     Each family is merged into one mesh: PR = painted clay/metal (vertex colour), SP = sponge, FZ = pipe-cleaner / pom-pom / felt fuzz */
  const PR=[],SP=[],FZ=[],TH=[],UP=new T.Vector3(0,1,0),_d=new T.Vector3(),_a=new T.Vector3(),_b=new T.Vector3();
  const mx=(x,y,z,sx,sy,sz,rx,ry,rz)=>new T.Matrix4().compose(_p.set(x,y,z),_q.setFromEuler(_e.set(rx||0,ry||0,rz||0,'XYZ')),_s.set(sx,sy,sz));
  const put=(L,g,col,x,y,z,sx,sy,sz,rx,ry,rz)=>L.push([g,mx(x,y,z,sx,sy,sz,rx,ry,rz),col]);
  const rod=(L,g,col,a,b,r)=>{_d.subVectors(b,a);const len=_d.length();_q.setFromUnitVectors(UP,_d.normalize());L.push([g,new T.Matrix4().compose(_p.addVectors(a,b).multiplyScalar(.5),_q,_s.set(r*2,len,r*2)),col])};
  const LO=X.touch,gDisc=new T.CylinderGeometry(.5,.5,1,LO?9:14),gCyl=new T.CylinderGeometry(.5,.5,1,LO?7:10),gTwig=new T.CylinderGeometry(.3,.5,1,LO?5:6),gSph=new T.SphereGeometry(.5,LO?7:10,LO?5:7),gPom=new T.SphereGeometry(.5,LO?6:8,LO?4:6),
    gCup=new T.CylinderGeometry(.5,.36,1,14),gPad=new T.CylinderGeometry(.5,.5,1,18,1,false,.35,PI*2-.7),gRing=new T.TorusGeometry(.5,.12,5,18);
  const ribbed=(seg,hs,f)=>{const g=new T.CylinderGeometry(.5,.5,1,seg,hs),P=g.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);if(Math.hypot(x,z)<.49)continue;const k=f(Math.atan2(z,x),P.getY(i));P.setX(i,x*k);P.setZ(i,z*k)}g.computeVertexNormals();return g};
  const gCap=ribbed(28,1,a=>1+.06*Math.cos(a*14)),gCan=ribbed(18,16,(a,y)=>1+.03*Math.cos(y*PI*16));
  // a rolled clay bar (lumpy along its length) and a clay plate: a puck with a soft rounded rim and a pressed-in centre
  const gRoll=ribbed(10,12,(a,y)=>1+.07*Math.sin(y*19+a*2)),gPlate=new T.LatheGeometry([[.12,-.5],[.36,-.5],[.46,-.42],[.5,-.2],[.5,.2],[.46,.42],[.36,.5],[.2,.46],[.12,.5]].map(([r,y])=>new T.Vector2(r,y)),18);
  // monument paint: grey stone gouache for the plinth, a white wash (tinted pink) for the vape, a paper label printed with a band
  const stoneT=craftTex(128,128,(k,n)=>{k.fillStyle='#b4aeb4';k.fillRect(0,0,n,n);for(let i=0;i<260;i++){const x=rand(0,n),y=rand(0,n);k.strokeStyle=Math.random()<.5?'rgba(255,255,255,.12)':'rgba(60,50,60,.12)';k.lineWidth=rand(1,3);k.beginPath();k.moveTo(x,y);k.lineTo(x+rand(8,26),y+rand(-2,2));k.stroke()}
    for(let i=0;i<40;i++){k.fillStyle=`rgba(${Math.random()<.5?'80,70,80':'230,226,230'},.25)`;k.beginPath();k.arc(rand(0,n),rand(0,n),rand(.6,2),0,PI*2);k.fill()}});
  const gouT=craftTex(128,128,(k,n)=>{k.fillStyle='#f4f0ea';k.fillRect(0,0,n,n);for(let i=0;i<300;i++){const x=rand(0,n),y=rand(0,n);k.strokeStyle=Math.random()<.5?'rgba(255,255,255,.35)':'rgba(120,80,90,.13)';k.lineWidth=rand(1,3);k.beginPath();k.moveTo(x,y);k.lineTo(x+rand(-1.5,1.5),y+rand(10,30));k.stroke()}});
  const labelT=craftTex(128,64,(k,w,h)=>{k.fillStyle='#fbf3e3';k.fillRect(0,0,w,h);k.fillStyle='#e8508f';k.fillRect(0,h*.38,w,h*.24);k.fillStyle='#6cc9bf';k.fillRect(0,h*.14,w,h*.07);k.fillRect(0,h*.79,w,h*.07);
    for(let i=0;i<300;i++){k.fillStyle=Math.random()<.5?'rgba(255,255,255,.25)':'rgba(80,55,35,.12)';k.fillRect(rand(0,w),rand(0,h),rand(1,2),1)}});
  const strands=[0,1,2].map(v=>new T.TubeGeometry(new T.CatmullRomCurve3([[0,0,0],[.04,.28,0],[.16+v*.06,.52,0],[.3+v*.08,.62-v*.06,0]].map(a=>new T.Vector3(...a))),8,.055,5));
  /* shop awnings: striped card (painted stripes with wobbly edges and brush streaks) with a scalloped valance hanging off the front,
     all merged into one mesh (they were ~100 separate boxes); the stripes run down the slope */
  const AWC=new Map([[0xff3fa4,0],[0x5fd4ff,1],[0xffd23c,2],[0xe0244a,3],[0x3cd07a,4]]),AWCOL=['#ff4fa8','#58cdf2','#ffd23c','#e0304e','#3cc878'],ARH=64,ANR=16;
  const awnT=craftTex(256,ARH*ANR,(k,w)=>{k.lineCap='round';for(let r=0;r<10;r++){const y0=r*ARH,col=AWCOL[r%5],val=r>=5,sy=y0+34;k.save();
      const scal=()=>{k.beginPath();k.moveTo(0,y0);k.lineTo(w,y0);k.lineTo(w,sy);for(let i=1;i>=0;i--)k.ellipse(i*128+64,sy,64,22,0,0,PI);k.closePath()};
      if(val){scal();k.clip()}k.fillStyle='#f6eedb';k.fillRect(0,y0,w,ARH);
      const p1=rand(0,9),p2=rand(0,9),wob=(y,ph)=>2.2*Math.sin(y*.21+ph)+1.2*Math.sin(y*.57+ph*2);k.fillStyle=col;
      for(const ox of[-256,0,256]){k.beginPath();for(let y=y0;y<=y0+ARH;y+=4)k.lineTo(ox+wob(y,p1),y);for(let y=y0+ARH;y>=y0;y-=4)k.lineTo(ox+128+wob(y,p2),y);k.closePath();k.fill()}
      for(let i=0;i<70;i++){const x=rand(0,w),y=rand(y0,y0+ARH),L=rand(8,30);k.strokeStyle=`rgba(${Math.random()<.5?'255,255,255':'60,30,20'},${rand(.04,.1).toFixed(2)})`;k.lineWidth=rand(1,3);k.beginPath();k.moveTo(x,y);k.lineTo(x+rand(-1.5,1.5),y+L);k.stroke()}
      for(let i=0;i<600;i++){k.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'90,70,50'},.08)`;k.fillRect(rand(0,w),rand(y0,y0+ARH),rand(1,2),1)}
      if(val){scal();k.strokeStyle='rgba(70,45,30,.45)';k.lineWidth=3;k.stroke()}k.restore()}});
  const AWNM=new T.MeshToonMaterial({gradientMap:GRAD,map:awnT,vertexColors:true,alphaTest:.5,side:T.DoubleSide});AWNM.userData.clayKind='paper';
  const AWB=GB(),_al=new T.Vector3(),_an=new T.Vector3(),_ao=[new T.Vector3(),new T.Vector3(),new T.Vector3(),new T.Vector3()];
  const awn=(o,ci)=>{o.updateMatrix();const m=o.matrix,s=o.scale,lx=s.x>=s.z,L=lx?s.x:s.z,per=.84,uo=rand(0,1);_n3.getNormalMatrix(m);
    const tv=(row,f)=>1-(row*ARH+(.04+.92*f)*ARH)/(ARH*ANR),uv=l=>[((lx?l[0]:l[2])+.5)*L/per+uo,tv(ci,(lx?l[2]:l[0])+.5)];
    for(let N=0;N<3;N++)for(const sg of[1,-1]){const A=(N+1)%3,B=(N+2)%3,ids=[];_an.set(0,0,0).setComponent(N,sg).applyMatrix3(_n3).normalize();
      for(const[ia,ib]of SQ){const l=[0,0,0];l[N]=sg*.5;l[A]=ia;l[B]=ib;_al.set(l[0],l[1],l[2]).applyMatrix4(m);const[u,v]=uv(l);ids.push(AWB.v(_al.x,_al.y,_al.z,_an.x,_an.y,_an.z,u,v,RAW))}
      AWB.tri4(ids,sg<0)}
    // the valance hangs from the low (outer) edge
    const lo=[1,-1].map(sg=>{const l=lx?[0,-.5,sg*.5]:[sg*.5,-.5,0];return _al.set(l[0],l[1],l[2]).applyMatrix4(m).y}),og=lo[0]<lo[1]?1:-1,H=.36;
    for(let i=0;i<2;i++){const l=lx?[i-.5,-.5,og*.5]:[og*.5,-.5,i-.5];_ao[i].set(l[0],l[1],l[2]).applyMatrix4(m);_ao[3-i].copy(_ao[i]).y-=H}
    _an.set(lx?0:og,0,lx?og:0).applyMatrix3(_n3);_an.y=0;_an.normalize();const u0=uo,u1=L/per+uo,va=tv(ci+5,0),vb=1-((ci+5)*ARH+ARH*.97)/(ARH*ANR);
    AWB.quad([_ao[0].x,_ao[0].y,_ao[0].z],[_ao[1].x-_ao[0].x,_ao[1].y-_ao[0].y,_ao[1].z-_ao[0].z],[0,-H,0],[_an.x,_an.y,_an.z],u0,u1,va,vb,RAW)};
  const leafImg=TXS.leaf&&TXS.leaf.image,barkImg=TXS.bark&&TXS.bark.image,WOOD=X.M(0x9a6a48),RED=X.M(0xe0244a),LAMP=X.M(0x3a3340),GREEN=X.M(0x3f9b4b);
  const GREENS=[0x9be05f,0x6cc44a,0x3f9b4b,0x2a6e3a],PINKS=[0xffb8d2,0xff8fb8,0xe86fa0,0xffd0e0],SILVER=0xc2c7cf;
  const lampWire=new T.TubeGeometry(new T.CatmullRomCurve3([[0,.05,0],[0,2.2,0],[0,4.2,0],[.06,4.75,0],[-.2,5.06,0],[-.55,5.1,0],[-.88,5.02,0],[-1,4.93,0]].map(a=>new T.Vector3(...a))),LO?22:40,.045,LO?4:5);
  const hex=m=>m&&m.color?m.color.getHex():-1;
  const towers=[],pillars=[];let gazebo=null,silo=null,barn=null;
  for(const o of W.children){if(!o.isMesh)continue;const m=o.material,img=m&&m.map&&m.map.image,s=o.scale,t=o.geometry.type,P=o.position,c=hex(m);
    if(m===DASH&&P.y===0&&Math.abs(s.y-.07)<.01&&Math.min(s.x,s.z)<.3){gone.push(o);dash(P.x,P.z,s.z>s.x)}
    else if(img&&TXS.road&&img===TXS.road.image)gone.push(o); // the old painted-board streets: replaced by paper sheets below
    else if(t==='BoxGeometry'&&AWC.has(c)&&Math.abs(s.y-.14)<.001&&(Math.abs(Math.abs(o.rotation.x)-.32)<.001||Math.abs(Math.abs(o.rotation.z)-.32)<.001)){gone.push(o);awn(o,AWC.get(c))}
    // sponge trees: discs of kitchen sponge round each canopy ball, a dark sponge core, a twig trunk on a card disc
    else if(img&&img===leafImg&&t==='SphereGeometry'){gone.push(o);const pal=c===0xff9ac0?PINKS:GREENS,R=(s.x+s.y+s.z)/6,n=clamp(Math.round(R*5),4,10);
      put(SP,gSph,pal[3],P.x,P.y,P.z,s.x*.72,s.y*.72,s.z*.72);
      for(let i=0;i<n;i++){const y=1-1.75*(i+.5)/n,r=Math.sqrt(Math.max(0,1-y*y)),a=i*2.4+rand(-.3,.3);_d.set(Math.cos(a)*r,y,Math.sin(a)*r).normalize();
        _q.setFromUnitVectors(UP,_d).multiply(new T.Quaternion().setFromAxisAngle(UP,rand(0,6)));const D=R*rand(.95,1.25);
        SP.push([gDisc,new T.Matrix4().compose(_p.set(P.x+_d.x*s.x*.36,P.y+_d.y*s.y*.36,P.z+_d.z*s.z*.36),_q,_s.set(D,R*.42,D)),pal[ri(3)]])}}
    else if(img&&img===barkImg&&t==='CylinderGeometry'){gone.push(o);const k=s.y/2.4,lx=rand(-.15,.15)*k,lz=rand(-.15,.15)*k;
      rod(PR,gTwig,0x7b5a3a,_a.set(P.x,0,P.z),_b.set(P.x+lx,3.2*k,P.z+lz),.16*k);
      for(const sd of[-1,1])rod(PR,gTwig,0x6f5034,_a.set(P.x+lx*.5,1.7*k,P.z+lz*.5),_b.set(P.x+sd*.75*k,3*k,P.z+rand(-.4,.4)*k),.07*k);
      put(PR,gCyl,0xc49a68,P.x,.02,P.z,1.3*k,.05,1.3*k)}
    // park flowers: buttons on dressmaker's pins
    else if(t==='SphereGeometry'&&s.x===.3&&P.y===.15){gone.push(o);const h=rand(.42,.62);rod(PR,gCyl,SILVER,_a.set(P.x,0,P.z),_b.set(P.x,h,P.z),.018);
      if(Math.random()<.3)put(PR,gSph,c,P.x,h,P.z,.13,.13,.13);
      else{const B=mx(P.x,h+.02,P.z,1,1,1,rand(-1.3,-.6),rand(0,PI*2),0),dk=_c.setHex(c).multiplyScalar(.45).getHex();const L=(g,col,x,y,z,sx,sy,sz,rx)=>PR.push([g,B.clone().multiply(mx(x,y,z,sx,sy,sz,rx)),col]);
        L(gDisc,c,0,0,0,.34,.06,.34);L(gRing,c,0,0,0,.3,.3,.12,PI/2);for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])L(gCyl,dk,a*.045,0,b*.045,.04,.07,.04)}}
    // fire hydrants: a red-painted bottle cap and spool, crowned with a thimble
    else if(m===RED&&t==='CylinderGeometry'&&s.x===.4&&s.y===.7){gone.push(o);const R0=0xd0302e;put(PR,gCap,R0,P.x,.07,P.z,.66,.14,.66);put(PR,gCyl,R0,P.x,.36,P.z,.4,.44,.4);
      for(const sd of[-1,1])put(PR,gCyl,R0,P.x+sd*.22,.4,P.z,.13,.14,.13,0,0,PI/2);put(PR,gCup,SILVER,P.x,.72,P.z,.4,.32,.4,PI);put(PR,gSph,SILVER,P.x,.88,P.z,.29,.16,.29)}
    else if(m===RED&&t==='SphereGeometry'&&s.x===.42)gone.push(o);
    // street lamps: a bent paperclip on a wire coil (the bead bulb stays)
    else if(m===LAMP&&t==='CylinderGeometry'&&s.y===5){gone.push(o);PR.push([lampWire,mx(P.x,0,P.z,1,1,1),SILVER]);put(PR,gRing,SILVER,P.x,.03,P.z,.7,.7,.7,PI/2)}
    else if(m===LAMP&&t==='BoxGeometry'&&s.x===1.2&&s.y===.12)gone.push(o);
    // lily pads: notched felt discs on the mirror pond
    else if(m===GREEN&&t==='CylinderGeometry'&&s.x===1.1){gone.push(o);put(FZ,gPad,pick(GREENS),P.x,.1,P.z,rand(1,1.4),.05,rand(1,1.4),0,rand(0,PI*2),0)}
    // crops: pipe-cleaner sprouts in brown pipe-cleaner rows
    else if(m===GREEN&&t==='SphereGeometry'&&s.x===.7&&s.y===.6){gone.push(o);const a0=rand(0,PI*2);for(let i=0;i<4;i++){const a=a0+i*PI/2+rand(-.3,.3),cc=pick([0x4fae3a,0x7fd04a,0x2f8a3e]);FZ.push([strands[ri(3)],mx(P.x,.18,P.z,1.3,1.3,1.3,0,a,0),cc]);
        if(Math.random()<.3){_v.set(.3,.62,0).applyAxisAngle(UP,a).multiplyScalar(1.3);put(FZ,gPom,cc,P.x+_v.x,.18+_v.y,P.z+_v.z,.2,.2,.2)}}}
    else if(t==='BoxGeometry'&&c===0x8a6a45&&s.x===22){gone.push(o);rod(FZ,gCyl,0x6b4a2e,_a.set(P.x-11,.17,P.z),_b.set(P.x+11,.17,P.z),.17)}
    // water towers: tin can on chopstick legs (the old barrel, its cone roof and its pipe go)
    else if(m===WOOD&&t==='CylinderGeometry'&&s.x===1.8){gone.push(o);towers.push([P.x,P.y-2,P.z])}
    else if(t==='ConeGeometry'&&c===0x5a4030&&s.x===2.1)gone.push(o);
    else if(t==='CylinderGeometry'&&c===0x444444&&s.x===.2&&s.y===1.2)gone.push(o);
    // gazebo (doily roof on straw bundles), silo (loo-roll tube), barn (shoebox with a grey card lid)
    else if(t==='ConeGeometry'&&c===0xff3fa4&&s.x===10){gone.push(o);gazebo=[P.x,P.z]}
    else if(t==='CylinderGeometry'&&c===0xfff7ea&&s.x===.25&&s.y===3.6){gone.push(o);pillars.push([P.x,P.z])}
    else if(t==='CylinderGeometry'&&c===0xd9d9d9&&s.y===9)silo=o;
    else if(t==='CylinderGeometry'&&c===0xd9c79a&&s.x===27.5)o.material=new T.MeshToonMaterial({gradientMap:GRAD,color:0xb7c2cc}); // the mirror's bevelled edge
    else if(t==='SphereGeometry'&&c===0xb0b0b0&&s.x===3.4)o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,color:0xe6dfd2}),{userData:{clayKind:'paper'}});
    else if(img&&img===(TXS.plank&&TXS.plank.image)&&s.x===10&&s.y===6)barn=o;
    else if(t==='BoxGeometry'&&c===0x6e1f1f){o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:kraftT,color:0x7a6e66}),{userData:{clayKind:'kraft'}});o.scale.z=7.9;o.updateMatrix()} // barn lid: stained kraft card (tucked inside the box's ends, so it no longer covers the door)
    else if(t==='BoxGeometry'&&c===0x8a3a3a&&s.x===28){const tx=fuzzT.clone();tx.repeat.set(9,6);tx.needsUpdate=true;o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:tx,color:0xb04a48}),{userData:{clayKind:'fuzz'}})}
    else if(t==='BoxGeometry'&&c===0xe8d49a&&s.x===8&&sandT){const tx=sandT.clone();tx.repeat.set(2,2);tx.needsUpdate=true;o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:tx}),{userData:{clayKind:'sand'}})}
    // the plaza's monument to the vape: a painted card box on a card plinth, a paper label round it, a felt mouthpiece
    else if(t==='BoxGeometry'&&Math.abs(P.x-7)<.2&&Math.abs(P.z-4)<.2&&[0xaaa6b0,0x8a8690,0xff3fa4,0xfff7ea,0x222222].includes(c)){
      if(c===0xaaa6b0){o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:stoneT}),{userData:{clayKind:'paint'}});corners(P.x,P.z,s.x,s.z,s.y,.02)}
      else if(c===0x8a8690){o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:kraftT,color:0x9c958d}),{userData:{clayKind:'kraft'}});const w=s.x/2,y0=P.y-s.y/2;
        for(const sd of[-1,1]){flute([P.x-w,y0,P.z+sd*(w+.004)],[2*w,0,0],[0,s.y,0],[0,0,sd],1,2*w);flute([P.x+sd*(w+.004),y0,P.z-w],[0,0,2*w],[0,s.y,0],[sd,0,0],1,2*w)}}
      else if(c===0xff3fa4)o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:gouT,color:0xff4fa8}),{userData:{clayKind:'paint'}});
      else if(c===0xfff7ea)o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:labelT}),{userData:{clayKind:'paper'}});
      else o.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:fuzzT,color:0x3a3046}),{userData:{clayKind:'fuzz'}})}
    // barn door: popsicle-stick planks painted red, a white stick frame and cross brace
    else if(t==='BoxGeometry'&&c===0xfff7ea&&Math.abs(s.x-3)<.01&&Math.abs(s.y-3.6)<.01){gone.push(o);const z=P.z+.05;
      stickBox(WS,mx(P.x,P.y,z,2.9,3.5,.07),2.9,3.5,.07,0xb53c34);
      for(const sy of[-1,1])stickBox(WS,mx(P.x,P.y+sy*1.66,z+.06,3.1,.22,.06),3.1,.22,.06,0xf4ede0);for(const sx of[-1,1])stickBox(WS,mx(P.x+sx*1.44,P.y,z+.06,.22,3.5,.06),.22,3.5,.06,0xf4ede0);
      const ang=Math.atan2(2.66,3.1);for(const sd of[-1,1])stickBox(WS,mx(P.x,P.y,z+.1,.2,Math.hypot(2.66,3.1),.05,0,0,sd*ang),.2,Math.hypot(2.66,3.1),.05,0xf4ede0)}
    // bench legs (park) and the muscle-beach kit: hand-rolled plasticine with thumbprints
    else if(t==='BoxGeometry'&&c===0x333333&&Math.abs(s.x-.12)<.01&&Math.abs(s.y-.55)<.01){gone.push(o);put(TH,GEO.rb,CLAYLEG,P.x,P.y,P.z,.13,s.y,s.z)}
    else if(Math.abs(P.z+89)<2.5&&Math.abs(P.x)<12&&(t==='BoxGeometry'&&(c===0x444444||c===0x2a2433)||t==='CylinderGeometry'&&(c===0xcccccc||c===0x222222))){gone.push(o);o.updateMatrix();
      if(c===0x444444)put(TH,GEO.rb,CLAYLEG,P.x,P.y,P.z,s.x*1.1,s.y,s.z*1.1);
      else if(c===0x2a2433)put(TH,GEO.rb,0x3e3754,P.x,P.y,P.z,s.x,s.y,s.z);
      else if(c===0xcccccc)TH.push([gRoll,o.matrix.clone(),0xb7bac4]);
      else TH.push([gPlate,o.matrix.clone(),pick([0x4a4458,0x3f5a7a,0x8a3b3b])])}
    // benches and fences: popsicle sticks; fence posts are clothespins clipped onto the rails
    else if(m===WOOD&&t==='BoxGeometry'){gone.push(o);o.updateMatrix();
      if(Math.abs(s.x-.3)<.01&&Math.abs(s.y-1.3)<.01){const zr=Math.abs(Math.abs(P.z)-52)<.1;for(const sd of[-1,1]){const w=zr?.3:.11,d=zr?.11:.3;
          stickBox(WS,mx(P.x+(zr?0:sd*.1),P.y,P.z+(zr?sd*.1:0),w,1.3,d),w,1.3,d,0xe8cfa0)}
        put(PR,gCyl,SILVER,P.x,.8,P.z,.36,.1,.36)}
      else stickBox(WS,o.matrix,s.x,s.y,s.z,0x9a6a48)}}
  for(const[x,h,z]of towers){for(const sx of[-1,1])for(const sz of[-1,1])rod(PR,gTwig,0xdcb57e,_a.set(x+sx*.8,h,z+sz*.8),_b.set(x+sx*.55,h+1.25,z+sz*.55),.05);
    put(PR,gCan,0x8fa1b5,x,h+2.05,z,1.7,1.65,1.7);put(PR,gCyl,0xaab6c4,x,h+2.9,z,1.62,.06,1.62)}
  for(const[x,z]of pillars){for(let i=0;i<5;i++){const a=i*1.257;rod(PR,gCyl,0xe6cc85,_a.set(x+Math.cos(a)*.09,.14,z+Math.sin(a)*.09),_b.set(x+Math.cos(a)*.09,3.75,z+Math.sin(a)*.09),.045)}
    for(const y of[.5,3.3])put(PR,gCyl,0xc8a860,x,y,z,.34,.1,.34)}
  // pom-pom hedges along the park's edge
  for(let z=-60;z<=60;z+=6.5){if(Math.abs(z)<9)continue;const x=-66.5+rand(-.4,.4);for(let i=0;i<7;i++){const r=rand(.28,.46);put(FZ,gPom,pick(GREENS),x+rand(-.5,.5),r*.85+(i>4?r:0),z+rand(-1.3,1.3),r*2,r*1.9,r*2)}}
  /* streets: sheets of black construction paper. Each block of street is one or two sheets (where two overlap, the top one is torn,
     showing its pale fibrous core, or scissor-cut, and lifts a little shadow onto the one below); each crossing is a square sheet laid
     on top, torn all round; now and then a small torn scrap patches a sheet. Matte charcoal paper (tooth, fibres, light flecks, a faint
     mottle), every sheet its own slightly different black. All one mesh. */
  {const cpaperT=craftTex(LO?256:512,LO?256:512,(k,n)=>{const sc=n/512;k.fillStyle='#2c2b30';k.fillRect(0,0,n,n);
      // cloudy formation of the pulp: lots of small soft blotches, a few big ones (paper, not gravel)
      for(let i=0;i<n*n/160;i++){const x=rand(0,n),y=rand(0,n),r=rand(3,14)*Math.max(.6,sc),c=Math.random()<.5?'80,78,86':'8,8,12';wrapDraw(n,x,y,r,(p,q)=>{const g=k.createRadialGradient(p,q,0,p,q,r);g.addColorStop(0,`rgba(${c},.07)`);g.addColorStop(1,`rgba(${c},0)`);k.fillStyle=g;k.fillRect(p-r,q-r,2*r,2*r)})}
      for(let i=0;i<60;i++){const x=rand(0,n),y=rand(0,n),r=rand(30,120)*sc,c=Math.random()<.5?'98,95,104':'6,6,10',a=rand(.04,.11).toFixed(3);
        wrapDraw(n,x,y,r,(p,q)=>{const g=k.createRadialGradient(p,q,0,p,q,r);g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);k.fillStyle=g;k.fillRect(p-r,q-r,2*r,2*r)})}
      // pulp fibres lying every which way (never in rows), a few lighter recycled bits, specks of grey and the odd coloured fleck
      k.lineCap='round';const F=[new Path2D(),new Path2D(),new Path2D()];
      for(let i=0;i<n*n/30;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),l=rand(2,8)*Math.max(.6,sc),c=rand(-1.2,1.2);wrapDraw(n,x,y,l,(p,q)=>{const P=F[i%3];P.moveTo(p,q);P.quadraticCurveTo(p+Math.cos(a+c)*l*.5,q+Math.sin(a+c)*l*.5,p+Math.cos(a)*l,q+Math.sin(a)*l)})}
      k.lineWidth=.8;k.strokeStyle='rgba(112,110,118,.12)';k.stroke(F[0]);k.strokeStyle='rgba(4,4,8,.28)';k.stroke(F[1]);k.lineWidth=.6;k.strokeStyle='rgba(140,136,142,.08)';k.stroke(F[2]);
      for(let i=0;i<n*n/1400;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),l=rand(3,9)*Math.max(.6,sc);k.strokeStyle=`rgba(${pick(['168,162,160','140,150,170','170,140,130','150,140,110'])},${rand(.25,.5).toFixed(2)})`;k.lineWidth=rand(.5,1);
        k.beginPath();k.moveTo(x,y);k.quadraticCurveTo(x+Math.cos(a+.8)*l*.5,y+Math.sin(a+.8)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);k.stroke()}
      for(let i=0;i<n*n/2200;i++){const r=rand(.5,1.1)*Math.max(.7,sc);k.fillStyle=`rgba(${pick(['205,200,192','180,176,172','226,222,214'])},${rand(.2,.5).toFixed(2)})`;k.beginPath();k.arc(rand(0,n),rand(0,n),r,0,PI*2);k.fill()}
      const d=k.getImageData(0,0,n,n),D=d.data;for(let i=0;i<D.length;i+=4){const v=(Math.random()-.5)*7;D[i]+=v;D[i+1]+=v;D[i+2]+=v}k.putImageData(d,0,0)});
    const RDM=new T.MeshToonMaterial({gradientMap:GRAD,map:cpaperT,vertexColors:true});RDM.userData.clayKind='cpaper';
    const RD=GB(),TS=3.4,RY=[.028,.034,.04],NS=LO?20:36,XH=3.7,SW=3.65,EE=62,mul=(c,k)=>({r:c.r*k,g:c.g*k,b:c.b*k});
    const tint=()=>{const l=srand(.88,1.12),w=srand(-1,1)*.05;return{r:l*(1+w),g:l*(1+w*.15),b:l*(1-w)}};
    const V=(x,y,z,c,R)=>RD.v(x,y,z,0,1,0,(x*R[0]-z*R[1])/TS+R[2],(x*R[1]+z*R[0])/TS+R[3],c);
    // outward offset and rim width along an edge: torn = ragged with a wide pale core showing, cut = nearly straight with a thin light edge
    const prof=(n,len,kind,amp)=>{amp=amp||1;const o=[],rw=[],p=[srand(0,9),srand(0,9),srand(0,9),srand(0,9)];for(let i=0;i<n;i++){const t=i/(n-1)*len;
      if(kind==='torn'){o.push(.05+(.05*Math.sin(t*1.7/amp+p[0])+.03*Math.sin(t*5.3+p[1]))*amp+.016*Math.sin(t*13+p[2])+srand(-.018,.018));rw.push(.03+.035*(.5+.5*Math.sin(t*2.6+p[3]))+srand(0,.015))}
      else if(kind==='cut'){o.push(.012*Math.sin(t*.9+p[0])+.005*Math.sin(t*3.1+p[1]));rw.push(.014)}else{o.push(0);rw.push(0)}}return{o,rw}};
    // a sheet: rectangle round (cx,cz), half-lengths along the street (hl) and across (hw); per side [w-, s+, w+, s-]: 'hid' (tucked under
    // something), 'cut' or 'torn', and whether it lifts a shadow onto what's below
    function sheet(cx,cz,alongZ,hl,hw,kinds,shadows,y,c,ang,amp){const R=[0,0,srand(0,1),srand(0,1)],ra=srand(0,PI*2);R[0]=Math.cos(ra);R[1]=Math.sin(ra);
      const ca=Math.cos(ang||0),sa=Math.sin(ang||0),W2=(s0,w0)=>{const s=s0*ca-w0*sa,w=s0*sa+w0*ca;return alongZ?[cx+w,cz+s]:[cx+s,cz+w]},ring=[],edges=[];
      [[[-hl,-hw],[hl,-hw],[0,-1]],[[hl,-hw],[hl,hw],[1,0]],[[hl,hw],[-hl,hw],[0,1]],[[-hl,hw],[-hl,-hw],[-1,0]]].forEach(([f,t,o],k)=>{
        const kind=kinds[k],len=Math.hypot(t[0]-f[0],t[1]-f[1]),n=kind==='torn'?Math.max(5,Math.round(len/7.3*NS)):kind==='cut'?Math.max(3,Math.round(len/1.2)):2,pr=prof(n,len,kind,amp),E=[];
        for(let i=0;i<n;i++){const u=i/(n-1),s=f[0]+(t[0]-f[0])*u,w=f[1]+(t[1]-f[1])*u,d=pr.o[i],r=pr.rw[i];E.push({e:W2(s+o[0]*d,w+o[1]*d),b:W2(s+o[0]*(d-r),w+o[1]*(d-r))});ring.push(E[i].b)}
        const os=o[0]*ca-o[1]*sa,owv=o[0]*sa+o[1]*ca;edges.push({kind,E,ow:alongZ?[owv,os]:[os,owv],sh:shadows[k]})});
      const c0=V(cx,y,cz,c,R),ids=ring.map(([x,z])=>V(x,y,z,c,R));for(let i=0;i<ids.length;i++)upTri(RD,c0,ids[i],ids[(i+1)%ids.length]);
      for(const{kind,E,ow,sh}of edges){if(kind==='hid')continue;const torn=kind==='torn',rc0=mul(c,torn?1.5:1.1),rc1=mul(c,torn?2.75:1.65);let pb=null;
        for(const{e,b}of E){const q=[V(b[0],y,b[1],rc0,R),V(e[0],y,e[1],mul(rc1,srand(.85,1.12)),R)];if(pb)upQuad(RD,pb[0],q[0],q[1],pb[1]);pb=q}
        if(!sh)continue;pb=null;
        for(const{e}of E){const w=srand(.07,.13),q=[V(e[0],y-.003,e[1],mul(c,.3),R),V(e[0]+ow[0]*w,y-.003,e[1]+ow[1]*w,c,R)];if(pb)upQuad(RD,pb[0],q[0],q[1],pb[1]);pb=q}}}
    const stops=[-EE];for(const L of LINES)stops.push(L-XH,L+XH);stops.push(EE);
    for(const l of LINES)for(const az of[true,false])for(let i=0;i<stops.length;i+=2){
      const s0=stops[i],s1=stops[i+1],a=s0===-EE?s0:s0-.6,b=s1===EE?s1:s1+.6,ka=s0===-EE?'torn':'hid',kb=s1===EE?'torn':'hid';
      const lay=(p,q,k0,k1,y,sh0,sh1)=>sheet(az?l:(p+q)/2,az?(p+q)/2:l,az,(q-p)/2,SW,['hid',k1,'hid',k0],[false,!!sh1,false,!!sh0],y,tint());
      if(b-a<10||!az&&l===11&&a<0&&b>0)lay(a,b,ka,kb,RY[0]); // one clean sheet across the front of Cloud Kingz
      else{const m=a+(b-a)*srand(.4,.6),cut=SR()<.4?'cut':'torn';if(SR()<.5){lay(a,m+.35,ka,'hid',RY[0]);lay(m-.35,b,cut,kb,RY[1],true)}else{lay(a,m+.35,ka,cut,RY[1],false,true);lay(m-.35,b,'hid',kb,RY[0])}
        // a torn scrap glued over a thin spot
        if(SR()<.3){const p=srand(a+2,b-2),q=srand(-1.8,1.8),c=tint();sheet(az?l+q:p,az?p:l+q,SR()<.5,srand(.35,.75),srand(.3,.6),['torn','torn','torn','torn'],[true,true,true,true],RY[2],c,srand(0,PI),2.4)}}}
    for(const a of LINES)for(const b of LINES)sheet(a,b,SR()<.5,XH+srand(-.03,.05),XH+srand(-.03,.05),['torn','torn','torn','torn'],[true,true,true,true],RY[2],tint());
    // zebra crossings: white paint across each arm of the inner crossings
    const WP=new T.Color();for(const a of LINES)for(const b of LINES){if(!ZEB(a)||!ZEB(b))continue;
      for(const sd of[-1,1])for(const az of[true,false])for(let j=-3;j<=3;j++){const c=(az?b:a)+sd*(XH+1.25),x=(az?a:b)+j*.92+srand(-.04,.04);WP.setHSL(srand(.1,.14),srand(.15,.3),srand(.76,.82));
        paint(az?x:c,az?c:x,az,1.75*srand(.94,1.04),.5*srand(.92,1.06),WP.clone())}}
    const rm=RD.mesh(RDM);if(rm)rm.userData.noCast=1}
  AWB.mesh(AWNM);
  {const PC=Kit();for(const g of W.children){const b=g.isGroup&&g.children[0];if(!b||!b.isMesh||b.scale.x!==1.9||b.scale.z!==4.1)continue;gone.push(g);PC.at(g.position.x,g.position.z,g.rotation.y);matchbox(PC,b.material.color.getHex(),1.9,4.1);PC.reset()}PC.build(WG)}
  for(const o of gone)if(o.parent)o.parent.remove(o);
  if(silo)silo.material=craftMat(tubeT,'kraft');
  // barn: a shoebox painted barn red in gouache, boards ruled in pencil, white-painted corner trim (the card's corrugation shows through)
  if(barn)barn.material=Object.assign(new T.MeshToonMaterial({gradientMap:GRAD,map:craftTex(256,256,(k,n)=>{k.fillStyle='#c63a33';k.fillRect(0,0,n,n);k.lineCap='round';
      for(let i=0;i<500;i++){const x=rand(0,n),y=rand(0,n);k.strokeStyle=Math.random()<.5?'rgba(255,220,200,.09)':'rgba(70,10,10,.12)';k.lineWidth=rand(1,3.5);k.beginPath();k.moveTo(x,y);k.lineTo(x+rand(-1.5,1.5),y+rand(10,40));k.stroke()}
      for(let i=1;i<12;i++){const x=i/12*n+rand(-1.5,1.5);k.strokeStyle='rgba(60,15,15,.45)';k.lineWidth=1.3;k.beginPath();k.moveTo(x,0);k.lineTo(x+rand(-2,2),n);k.stroke();k.strokeStyle='rgba(255,210,190,.12)';k.beginPath();k.moveTo(x+1.6,0);k.lineTo(x+1.6,n);k.stroke()}
      for(const[x,y,w,h]of[[0,0,n,9],[0,n-9,n,9],[0,0,9,n],[n-9,0,9,n]]){k.fillStyle='#f3ece0';k.fillRect(x,y,w,h)}
      for(let i=0;i<120;i++){k.fillStyle='rgba(198,58,51,.6)';k.fillRect(rand(0,n),Math.random()<.5?rand(0,10):rand(n-10,n),rand(2,6),1)}})}),{userData:{clayKind:'wall'}});
  if(gazebo){const N=64,RG=8,RR=5.8,gb=GB();for(let i=0;i<=RG;i++)for(let j=0;j<=N;j++){const r=i/RG*RR,a=j/N*PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r;gb.v(gazebo[0]+x,6.05-2.2*Math.pow(r/RR,.9),gazebo[1]+z,0,1,0,x/(2*RR)+.5,z/(2*RR)+.5)}
    for(let i=0;i<RG;i++)for(let j=0;j<N;j++){const a=i*(N+1)+j,b=a+N+1;gb.tri4([a,a+1,b+1,b],true)}const g=gb.geo();g.computeVertexNormals();WG.add(new T.Mesh(g,DOILYM))}
  // one mesh per family per district (park / farm / beach / downtown) so frustum culling still drops what's behind you
  const mk=(L,mat)=>{const B=new Map();for(const e of L){const x=e[1].elements[12],z=e[1].elements[14],k=x<-62?0:x>62?1:z<-62?2:z>62?3:4;let b=B.get(k);if(!b)B.set(k,b=[]);b.push(e)}
    for(const b of B.values())WG.add(new T.Mesh(mergeIdx(b),mat))};
  mk(PR,VCM);mk(SP,SPONGEM);mk(FZ,FUZZM);mk(TH,THUMBM);
  FL.mesh(FLUTEM);KR.mesh(KRAFTM);WS.mesh(STICKM);
  const kt=sideMat&&KT.mesh(sideMat);if(kt)kt.userData.noCast=1;
  const dm=DS.mesh(PAINTM);if(dm)dm.userData.noCast=1;
  X.craft={removed:gone.length,buildings:blds.length}}

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
// cereal-box facades: windows become cut-out holes (the card's edge showing), plus the box's own print: a big swoosh, fold lines, a barcode
// (k: the context to paint on, already scaled to the 256 px layout; src: the core's original 256 px facade)
function cereal(k,src,cl,rs,ty){const R=new Map();for(let p=0;p<65536;p++){if(!cl[p])continue;const key=ty[p]*256+rs[p];let r=R.get(key);if(!r)R.set(key,r={x0:rs[p],y0:ty[p],x1:0,y1:0,lit:0});
    const x=p&255,y=p>>8;if(x>r.x1)r.x1=x;if(y>r.y1)r.y1=y;if(cl[p]===2)r.lit=1}
  const d=src.getContext('2d').getImageData(4,4,1,1).data,wall=`rgb(${d[0]},${d[1]},${d[2]})`;
  k.save();k.globalAlpha=.16;k.fillStyle='#ffffff';k.beginPath();k.ellipse(rand(40,110),rand(30,90),rand(70,110),rand(40,70),rand(-.6,.6),0,PI*2);k.fill();k.globalAlpha=.12;k.fillStyle=pick(['#ff3fa4','#ffd23c','#3c8cff','#3cd07a']);k.beginPath();k.ellipse(rand(150,220),rand(40,120),rand(40,70),rand(25,45),rand(-1,1),0,PI*2);k.fill();k.restore();
  for(const r of R.values()){const w=r.x1-r.x0+1,h=r.y1-r.y0+1;if(w<6||h<6)continue;k.fillStyle=wall;k.fillRect(r.x0-3,r.y0-3,w+6,h+6);k.fillStyle=r.lit?'#e8c27a':'#2b221d';k.fillRect(r.x0,r.y0,w,h);
    k.fillStyle='#c79c69';k.fillRect(r.x0,r.y0,w,3);k.fillRect(r.x0,r.y0,3,h);k.fillStyle='rgba(60,40,20,.5)';k.fillRect(r.x0+3,r.y0+3,w-3,1);k.fillRect(r.x0+3,r.y0+3,1,h-3);
    k.strokeStyle='rgba(40,25,15,.45)';k.lineWidth=1;k.strokeRect(r.x0-.5,r.y0-.5,w+1,h+1)}
  k.fillStyle='rgba(0,0,0,.12)';k.fillRect(0,6,256,1);k.fillRect(0,250,256,1);
  const bx=rand(196,222),by=rand(8,20);k.fillStyle='#fff';k.fillRect(bx,by,28,15);k.fillStyle='#111';for(let x=bx+2;x<bx+26;x+=rand(1.5,3))k.fillRect(x,by+2,rand(.7,1.6),9);
  k.font='bold 6px sans-serif';k.fillStyle='rgba(30,20,20,.7)';k.fillText('NET WT 12 OZ',8,18)}
// the core paints each facade's name on a dark strip above the ground floor: find which name it is (by matching the 256 px strip) and paint it again sharp
const FNAMES=['LUNGS R US',"HONEST GARY'S USED VAPES",'BANK OF MANGO','VAPE-FREE DAYCARE','PIGEON LAW LLP','DMV (CLOSED)','WET BREAD CAFE','DISCOUNT SOUP','MATTRESS KINGDOM','2ND MATTRESS KINGDOM','CLOUD INSURANCE','DENTIST???','CRYPTO LAUNDROMAT','HOT DOG EMBASSY','SMOKE DETECTOR OUTLET','TOWN HALL','LEGITIMATE BUSINESS',"MOM'S HOUSE",'BOX STORE (BOXES)','JUICE? BAR','VAPE REHAB','THE CONTAINER STORE','GLUTEN MUSEUM','KARATE & TAXES','SCHOOL OF HARD COUGHS'];
const stripC=C2(256,64),stripK=stripC.getContext('2d');
function signStrip(k,src,h){const fl=Math.max(2,Math.round(h/3.2)),rh=256/fl,gy=256-rh,y0=Math.floor(gy),sh=Math.min(64,Math.ceil(rh*.34)),ref=src.getContext('2d').getImageData(0,y0,256,sh).data;
  const draw=(q,nm,oy)=>{q.fillStyle='#2a2433';q.fillRect(0,gy-oy,256,rh*.34);q.fillStyle='#fff7ea';fit(q,nm,240,26);q.textAlign='center';q.textBaseline='middle';q.fillText(nm,128,gy-oy+rh*.18)};
  let best=null,be=Infinity;for(const nm of FNAMES){stripK.clearRect(0,0,256,64);draw(stripK,nm,y0);const d=stripK.getImageData(0,0,256,sh).data;let e=0;for(let i=0;i<d.length;i+=4)e+=Math.abs(d[i]-ref[i]);if(e<be){be=e;best=nm}}
  if(best&&be<256*sh*12)draw(k,best,0)}
const WIN=[];W.traverse(o=>{const m=o.material;if(!o.isMesh||!m||!m.isMeshToonMaterial||!m.map||!m.map.image||m.map.image.width!==256||m.map.image.height!==256||!m.map.image.getContext)return;
  try{const d=m.map.image.getContext('2d').getImageData(0,0,256,256).data,cl=new Uint8Array(65536),rs=new Uint16Array(65536),ty=new Uint16Array(65536);
    const near=(i,r,g,b)=>Math.abs(d[i]-r)<12&&Math.abs(d[i+1]-g)<12&&Math.abs(d[i+2]-b)<12;
    for(let p=0;p<65536;p++){const i=p*4;cl[p]=near(i,61,95,125)||near(i,115,140,161)?1:near(i,255,233,160)||near(i,255,239,187)?2:0}
    const out=document.createElement('canvas');out.width=out.height=256;const ok=out.getContext('2d'),od=ok.createImageData(256,256),seed=Math.random()*99;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const p=y*256+x,i=p*4;od.data[i+3]=255;if(!cl[p])continue;rs[p]=x&&cl[p-1]?rs[p-1]:x;ty[p]=y&&cl[p-256]?ty[p-256]:y;
      const h=Math.sin(rs[p]*12.9898+ty[p]*78.233+seed)*43758.5453;if(cl[p]===2||h-Math.floor(h)<.5){od.data[i]=255;od.data[i+1]=214;od.data[i+2]=130}}
    ok.putImageData(od,0,0);
    // desktop: repaint the facade at 512 px so walls stay crisp up close (the core's 256 px canvas, enlarged, then the shop sign, window
    // cut-outs and box print redrawn sharp on top)
    const src=m.map.image;let dst=src,k=src.getContext('2d');
    if(!X.touch){dst=document.createElement('canvas');dst.width=dst.height=512;k=dst.getContext('2d');k.imageSmoothingQuality='high';k.drawImage(src,0,0,512,512);k.setTransform(2,0,0,2,0,0);signStrip(k,src,o.scale.y)}
    cereal(k,src,cl,rs,ty);k.setTransform(1,0,0,1,0,0);m.map.image=dst;m.map.needsUpdate=true;const sm=document.createElement('canvas');sm.width=sm.height=128;sm.getContext('2d').drawImage(out,0,0,128,128);
    m.emissiveMap=new T.CanvasTexture(sm);m.emissive.setHex(0xffc060);m.emissiveIntensity=0;m.needsUpdate=true;WIN.push(m)}catch(e){}});
const starG=new T.BufferGeometry(),sp=new Float32Array(260*3);for(let i=0;i<260;i++){const a=rand(0,PI*2),e=Math.asin(rand(.15,1));sp[i*3]=Math.cos(a)*Math.cos(e)*400;sp[i*3+1]=Math.sin(e)*400;sp[i*3+2]=Math.sin(a)*Math.cos(e)*400}
starG.setAttribute('position',new T.BufferAttribute(sp,3));const stars=new T.Points(starG,new T.PointsMaterial({color:0xfff6e0,size:2,sizeAttenuation:false,fog:false,transparent:true,opacity:0,depthWrite:false}));stars.visible=false;stars.frustumCulled=false;scene.add(stars);

/* =================== TRAFFIC: little cars + Mr. Cloudy's ice cream truck =================== */
const CARC=[0xe0244a,0x3c8cff,0xffd23c,0x3cd07a,0xa070ff,0xff7a1a,0xff9ac0];
// matchbox car: the sleeve painted the car colour, the tray end showing at the front, a paper band; a smaller box cabin with painted windows; buttons for wheels
function matchbox(K,c,w,L,topper){const f=w/1.42,b=.32*f,h=.62*f;K.add('b',w,h,L,c,0,b+h/2,0);K.add('b',w*.86,h*.78,.14,0xf3ede0,0,b+h/2,L/2+.05,0,0,0,false);K.add('b',w+.02,h*.24,L*.97,0x6a4630,0,b+h*.22,0,0,0,0,false);
  const ch=.52*f,cy=b+h+ch/2;K.add('b',w*.9,ch,L*.47,c,0,cy,-L*.06);K.add('b',w*.93,ch*.6,L*.4,0x2c2f3a,0,cy+.02,-L*.06,0,0,0,false);K.add('b',w*.74,ch*.6,L*.49,0x2c2f3a,0,cy+.02,-L*.06,0,0,0,false);
  const bc=pick([0xe0244a,0x3c8cff,0x3cd07a,0xffd23c,0xff7a1a,0xfff7ea].filter(x=>x!==c)),wr=.64*f,wt=.18*f;for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*(w/2+wt/2-.02),z=sz*L*.31;K.add('c',wr,wt,wr,bc,x,wr/2,z,0,0,PI/2);
    for(const[a,d]of[[-1,-1],[1,-1],[1,1],[-1,1]])K.add('c',.07*f,wt+.03,.07*f,0x2a2433,x,wr/2+a*.07*f,z+d*.07*f,0,0,PI/2,false)}
  for(const sx of[-1,1])K.add('s',.22*f,.18*f,.06,0xfff2a0,sx*w*.3,b+h*.62,L/2+.13,0,0,0,false);
  if(topper)K.add('b',.9,.3,.4,0xffd23c,0,cy+ch/2+.15,-.3);return K}
function carKit(c,topper){return matchbox(Kit(),c,1.42,3.5,topper)}
// Mr. Cloudy: a tissue box van (a tissue poking from the slot, cloud print) with a paper-cup cone on the roof and bottle-cap wheels
function truckKit(){const K=Kit(),bl=0xd6ebf7;K.add('b',1.5,2,3.6,bl,0,1.4,-.5);K.add('b',.5,.04,1.9,0x5d6b78,0,2.41,-.5,0,0,0,false);K.add('b',.05,.5,.8,0xffffff,0,2.62,-.2,.15,0,.25,false);
  for(const s of[-1,1])for(let i=0;i<3;i++)K.add('s',.06,rand(.45,.65),rand(.8,1.1),0xffffff,s*.76,1.2+i*.35,-1.7+i*1.1,0,0,0,false);
  K.add('b',1.5,1.1,1.4,0xc4e2f4,0,.95,2);K.add('b',1.4,.6,.9,0x2c2f3a,0,1.6,1.9);
  K.add('b',.06,.9,1.6,0x2a2433,.76,1.6,-.4,0,0,0,false);K.add('b',.4,.08,1.7,0xff3fa4,.95,1.1,-.4,0,0,0,false);
  for(const sx of[-1,1])for(const sz of[-1.6,1.9])K.add('r',.72,.26,.72,0xa9adb5,sx*.74,.36,sz,0,0,PI/2);K.add('s',.3,.26,.1,0xfff2a0,.48,.8,2.71,0,0,0,false);K.add('s',.3,.26,.1,0xfff2a0,-.48,.8,2.71,0,0,0,false);
  K.add('u',1.05,1.25,1.05,0xf3e6c8,0,3.1,-1.5,0,0,.22);K.add('s',.9,.75,.9,0xff9ac0,-.14,3.8,-1.5);K.add('s',.18,.18,.18,0xe0244a,-.18,4.22,-1.5,0,0,0,false);return K}
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
/* paper birds: a body folded from one sheet (a ridge along the back, a keel underneath, a fanned tail), wings cut from the same paper
   with snipped feather tips; the wings hold one of four drawn poses at a time (up, mid, down, mid), like replacement animation */
const NC=9,NG=12,NB=NC+NG;
const wingG=(()=>{const sh=new T.Shape([[0,.2],[.3,.21],[.62,.14],[1,-.02],[.9,-.1],[.84,-.05],[.74,-.16],[.64,-.09],[.52,-.2],[.4,-.12],[.26,-.22],[0,-.2]].map(([x,y])=>new T.Vector2(x,y)));
  const g=new T.ShapeGeometry(sh);g.rotateX(PI/2);const P=g.attributes.position,U=g.attributes.uv;for(let i=0;i<P.count;i++){const x=P.getX(i);P.setY(i,Math.sin(x*PI)*.05);U.setXY(i,P.getX(i)*.9,P.getZ(i)*.9+.5)}g.computeVertexNormals();return g})();
const bodyG=(()=>{const N=[0,0,.42],Tl=[0,.03,-.38],Tp=[0,.12,.04],K=[0,-.08,.02],L=[-.12,.01,0],Rr=[.12,.01,0],F1=[-.15,.06,-.6],F2=[.15,.06,-.6],F0=[0,.02,-.55];
  const tri=[N,Tp,L, N,Rr,Tp, Tl,L,Tp, Tl,Tp,Rr, N,L,K, N,K,Rr, Tl,K,L, Tl,Rr,K, Tl,F1,F0, Tl,F0,F2];const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(tri.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(tri.flatMap(v=>[v[0]+.5,v[2]+.5]),2));g.computeVertexNormals();return g})();
const birdT=craftTex(64,64,(k,n)=>{k.fillStyle='#f2efe8';k.fillRect(0,0,n,n);k.lineCap='round';for(let i=0;i<260;i++){const x=rand(0,n),y=rand(0,n),a=rand(0,PI*2),l=rand(1,3.5);k.strokeStyle=Math.random()<.5?'rgba(255,255,255,.5)':'rgba(70,60,50,.2)';k.lineWidth=rand(.4,.9);k.beginPath();k.moveTo(x,y);k.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);k.stroke()}
  k.strokeStyle='rgba(60,50,40,.3)';k.lineWidth=1;for(let i=0;i<4;i++){k.beginPath();k.moveTo(rand(0,n),0);k.lineTo(rand(0,n),n);k.stroke()}});
const birdM=(side)=>{const m=new T.MeshToonMaterial({gradientMap:GRAD,map:birdT,side});m.userData.clayKind='paper';return m};
const wings=new T.InstancedMesh(wingG,birdM(T.DoubleSide),NB*2),bodies=new T.InstancedMesh(bodyG,birdM(T.DoubleSide),NB);
const FLAP=[.62,.16,-.36,.16];
const birds=[];for(let i=0;i<NB;i++){const gull=i>=NC,col=gull?0xfdfdfd:0x3a3446;birds.push({gull,r:rand(gull?14:12,gull?26:22),w:rand(.09,.16)*(Math.random()<.5?-1:1),ph:rand(0,PI*2),y:rand(-2,2),s:gull?rand(.8,1):rand(.6,.75),fp:rand(0,6),last:new T.Vector3()});
  wings.setColorAt(i*2,_c.setHex(col));wings.setColorAt(i*2+1,_c.setHex(col));bodies.setColorAt(i,_c.setHex(gull?0xf2f0ea:0x3a3446))}
wings.frustumCulled=bodies.frustumCulled=false;scene.add(wings,bodies);
const _bp=new T.Vector3();
function flock(t){const cx=Math.sin(t*.02)*40,cz=Math.cos(t*.015)*35,gx=Math.sin(t*.03)*55,gz=-114+Math.sin(t*.07)*6;
  birds.forEach((b,i)=>{const a=b.ph+t*b.w;_bp.set((b.gull?gx:cx)+Math.cos(a)*b.r,(b.gull?13:28)+b.y+Math.sin(t*.35+b.fp)*.8,(b.gull?gz:cz)+Math.sin(a)*b.r);
    const yaw=Math.atan2(_bp.x-b.last.x,_bp.z-b.last.z);b.last.copy(_bp);
    // bursts of flapping between glides; while flapping, step through the four drawn poses (gulls a little slower)
    const flapping=Math.sin(t*(b.gull?2.2:1.6)+b.fp)>.15,flap=flapping?FLAP[Math.floor(t*(b.gull?9:12)+b.fp*4)%4]:(b.gull?.12:.08),bank=-Math.sign(b.w)*(b.gull?.35:.25);
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
function banner(dt){msgT-=dt||0;if(msgT<=0||msgI<0){msgT=11;msgI=(msgI+1)%MSG.length;msgC=-1}if(X.count===msgC)return;msgC=X.count;const s=MSG[msgI]();if(s===msgS)return;msgS=s;
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
const SKW=X.touch?512:1024,SKH=SKW/2,skyC=document.createElement('canvas');skyC.width=SKW;skyC.height=SKH;const skyK=skyC.getContext('2d'),skyT=new T.CanvasTexture(skyC);
/* painted cardboard backdrop, laid over the time-of-day gradient: gouache washes dragged across in streaky dry-brush bundles, the tooth
   of the card, and a slightly different wash on each of the board panels it's painted on */
const skyP=document.createElement('canvas');skyP.width=SKW;skyP.height=SKH;{const k=skyP.getContext('2d'),f=SKW/1024;k.lineCap='round';
  for(let i=0;i<300;i++){const y=rand(4,SKH*.5)*(Math.random()<.7?1:.6),x=rand(-60,SKW),L=rand(90,340)*f,lw=rand(10,34)*f,lift=rand(-14,14)*f,c=Math.random()<.62?'255,255,255':'24,44,120',a=rand(.025,.07),nb=7+ri(7);
    for(let b=0;b<nb;b++){const o=(b/(nb-1)-.5)*lw,w=rand(1.5,4.5)*f,a2=a*rand(.5,1.4),s0=rand(0,.15)*L,s1=L*(1-rand(0,.25));k.strokeStyle=`rgba(${c},${a2.toFixed(3)})`;k.lineWidth=w;
      for(const ox of[0,SKW]){const x0=x-ox;k.beginPath();k.moveTo(x0+s0,y+o+lift*s0/L);k.bezierCurveTo(x0+L*.33,y+o+lift*.33+rand(-2,2)*f,x0+L*.66,y+o+lift*.66+rand(-2,2)*f,x0+s1,y+o+lift*s1/L);k.stroke()}}}
  for(let i=0;i<SKW*SKH/60;i++){k.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'60,50,90'},${rand(.03,.07).toFixed(3)})`;k.fillRect(rand(0,SKW),rand(0,SKH),rand(1,2.5)*f,f)}
  const NP=8;for(let i=0;i<NP;i++){const x=(i+.5)*SKW/NP+rand(-8,8)*f;
    // each board was painted on its own: a slightly different wash per panel
    k.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'30,50,120'},${rand(.02,.045).toFixed(3)})`;k.fillRect(x,0,SKW/NP,SKH*.5);if(i===NP-1)k.fillRect(0,0,x-SKW*(NP-1)/NP,SKH*.5)}}
const zc=new T.Color(),mc=new T.Color(),hc=new T.Color(),gc=new T.Color(),hex=c=>'#'+c.getHexString();
if(dome){dome.material.map=skyT;dome.material.needsUpdate=true}
const sun0=new T.Vector3(150,150,-220),sun1=new T.Vector3(-40,45,-330),SUNDIR=sun0.clone().normalize();let K=0,NIGHT=0,lastK=-1;
function timeOfDay(){const k=ss(0,1,Math.min(1,typeof X.tod==='number'?X.tod:X.used/5000));K=k;// story.js sets TMV.tod per weekday (the colour script)
  if(Math.abs(k-lastK)>.003){lastK=k;kf(HOR,k,hc);kf(ZEN,k,zc);kf(MID,k,mc);kf(GLOW,k,gc);
    const g=skyK.createLinearGradient(0,0,0,SKH);g.addColorStop(0,hex(zc));g.addColorStop(.36,hex(mc));g.addColorStop(.47,hex(gc));g.addColorStop(.5,hex(hc));g.addColorStop(1,hex(hc));skyK.fillStyle=g;skyK.fillRect(0,0,SKW,SKH);skyK.drawImage(skyP,0,0);skyT.needsUpdate=true;
    if(cloudM)kf(CLD,k,cloudM.color);if(sunBall){kf(SUNC,k,sunBall.material.color);sunBall.position.lerpVectors(sun0,sun1,ss(.1,1,k));sunBall.scale.setScalar(34+16*k)}
    if(sunL){kf(SUNL,k,sunL.color);sunL.intensity=lerp(.82,.64,ss(.6,1,k));if(sunBall){SUNDIR.copy(sunBall.position).normalize();sunL.position.copy(SUNDIR).multiplyScalar(100)}}
    if(hemi){kf(HSKY,k,hemi.color);kf(HGND,k,hemi.groundColor);hemi.intensity=lerp(.62,.5,ss(.5,1,k))}kf(SEA,k,seaM.color);
    NIGHT=ss(.58,.95,k);for(const m of WIN)m.emissiveIntensity=NIGHT*.9;pools.visible=halos.visible=NIGHT>.01;pools.material.opacity=.3*NIGHT;halos.material.opacity=.4*NIGHT;
    stars.visible=k>.8;stars.material.opacity=ss(.8,1,k)}
  // the core lerps sky/fog toward pink haze each frame; this runs after it (prerender) and replaces it with the sunset palette
  scene.background.copy(hc);scene.fog.color.copy(hc);scene.fog.near=lerp(30,9,k);scene.fog.far=lerp(210,85,k);if(dome){dome.material.opacity=1;stars.position.copy(dome.position)}}

/* =================== PER-FRAME =================== */
let lastQ=-1;
X.on('prerender',(dt,t)=>{timeOfDay();
  // the sea, surf, wave flats, floatie, shark fin, birds and blimp are all hand-posed: they move on a 12 fps clock
  const tq=Math.floor(t*12)/12,stepped=tq!==lastQ;lastQ=tq;
  if(stepped){const A=seaP.array;for(let i=0;i<seaY0.length;i+=3){const x=seaY0[i],z=seaY0[i+2];A[i+1]=seaY0[i+1]+Math.sin(x*.07+tq*1.3)*.09+Math.sin(z*.13+tq*.9+x*.02)*.08}seaP.needsUpdate=true;
    seaM.map.offset.set(tq*.004,tq*.012);const sw=Math.sin(tq*.8);foam.position.z=SHORE+.4+sw*1.1;foam.scale.z=1.4+(1-Math.abs(sw))*.8;
    for(const w of WAVES){w.mesh.position.set(Math.sin(tq*.7+w.ph)*w.a,Math.sin(tq*1.6+w.ph)*.07-.02,0)}
    floatM.position.set(-14+Math.sin(tq*.1)*3,.08+Math.sin(tq*1.4)*.12,-133);floatM.rotation.set(Math.sin(tq*1.1)*.08,tq*.15,Math.cos(tq*1.3)*.08);
    finA=tq*.55;fin.position.set(44+Math.cos(finA)*7,Math.sin(tq*2)*.05,-139+Math.sin(finA)*5);fin.rotation.y=-PI/2-finA}
  if(X.mode==='play'&&(dunT-=dt)<0&&Math.hypot(X.px-fin.position.x,X.pz-fin.position.z)<16){dunT=7;X.beep(82,.5,'sawtooth',.05);X.beep(87,.5,'sawtooth',.05,.55);X.beep(82,.25,'sawtooth',.05,1.1);X.beep(87,.25,'sawtooth',.05,1.4)}
  for(const c of cars)drive(c,dt,t);
  const ph=Math.floor(t/2)%7;if(ph!==sigPh){sigPh=ph;SIGL.forEach((_,i)=>{const q=(ph+i*2)%7,on=q<3?2:q<4?1:0;for(let j=0;j<3;j++)lampsI.setColorAt(i*3+j,_c.setHex(LCOL[j][j===on?0:1]))});lampsI.instanceColor.needsUpdate=true}
  if(stepped){flock(tq);const ba=tq*.042;blimp.position.set(Math.cos(ba)*105,52+Math.sin(tq*.4)*1.2,-10+Math.sin(ba)*105);blimp.rotation.set(0,Math.atan2(-Math.sin(ba),Math.cos(ba)),Math.sin(tq*.3)*.04)}banner(dt);
  drift(dt,t,K)});
X.world={get k(){return K},get night(){return NIGHT},cars,blimp,sunDir:SUNDIR,tex:{sand:sandT,sea:seaT,plank:plankT}};
})();
