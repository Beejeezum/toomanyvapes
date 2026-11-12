/* icons mod: the little reaction icons in the 3D world (crowd gasps, staring, the diva's notes, a sleeping detector, honking cars,
   the bosses' crowns) and the power-up crates' labels are small handmade cut-outs painted on canvas, never flat emoji glyphs:
   torn or scissor-cut construction paper with its pale core showing at the edge, paper grain, felt for the music notes, cotton wool
   for puffs, and a little lift shadow where the scrap sits off the scene.
   - TMV.emoTex(key) / TMV.emo(key, x,y,z, vx,vy,vz, size) keep their old signatures (keys are still the emoji the callers pass) and are
     replaced here, so the core and the other mods don't change how they ask for one.
   - Icons move on a 12 fps clock with a small jitter and two hand-cut variants that boil; they pop on in two held frames and come off
     in two. They're sparse (a few live at a time) and never appear near the middle of the screen or right in front of you;
     prefers-reduced-motion: no jitter, boil or drift, they simply appear and go.
   - Power-up crates: a painted card box, a paper label with the power's icon on each side and a paper flag on a toothpick
     (no floating sprite), turned a notch at a time.
   Built only on window.TMV. Exposes TMV.icons = {tex(key, variant), label(kind), keys}. */
(()=>{const X=window.TMV;if(!X||X.icons)return;
const T=X.T,{scene,cam,rand}=X,PI=Math.PI,D=document;
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const N=128;
const C={core:'#fbf3e1',paper:'#fbf5e6',ink:'#2b2233',pink:'#f6a6c1',hot:'#e8508f',teal:'#6cc9bf',mustard:'#eebd4b',lime:'#bfdc5a',sky:'#9ccfee',lav:'#bba7e6',orange:'#f39a5f',red:'#e4574d',green:'#79c26a',kraft:'#c69c6d',plum:'#5a3d8a',grey:'#c9ccd2',navy:'#3b3346'};
const C2=()=>{const c=D.createElement('canvas');c.width=c.height=N;return c};

/* ---------- cutting ---------- */
const ell=(cx,cy,rx,ry,n,rot)=>{rot=rot||0;const P=[],cr=Math.cos(rot),sr=Math.sin(rot);for(let i=0;i<n;i++){const a=i/n*PI*2,x=Math.cos(a)*rx,y=Math.sin(a)*ry;P.push([cx+x*cr-y*sr,cy+x*sr+y*cr])}return P};
// a thick stroke along a centre line, as a polygon (so it can be torn/cut like any other piece)
function thick(L,w){const A=[],B=[];for(let i=0;i<L.length;i++){const p=L[Math.max(0,i-1)],q=L[Math.min(L.length-1,i+1)],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;
  A.push([L[i][0]+nx,L[i][1]+ny]);B.push([L[i][0]-nx,L[i][1]-ny])}return A.concat(B.reverse())}
const star=(cx,cy,ro,ri,n,rot)=>{const P=[];for(let i=0;i<n*2;i++){const a=(rot||0)-PI/2+i/(n*2)*PI*2,r=i%2?ri:ro;P.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}return P};
// outline of a few overlapping circles (clouds), flat-bottomed if fy is given
function blobs(cx,cy,Cs,n,fy){const P=[];for(let i=0;i<n;i++){const a=i/n*PI*2,dx=Math.cos(a),dy=Math.sin(a);let t=0;
  for(const[x,y,r]of Cs){const b=dx*x+dy*y,q=b*b-(x*x+y*y-r*r);if(q>=0)t=Math.max(t,b+Math.sqrt(q))}let px=dx*t,py=dy*t;if(fy!=null&&py>fy){px*=fy/py;py=fy}P.push([cx+px,cy+py])}return P}
const xf=(P,s,ox,oy)=>P.map(([x,y])=>[ox+(x-ox)*s,oy+(y-oy)*s]);
// edge: subdivide every side and nudge each point off the line. torn = short steps, ragged; cut = long steps, nearly straight
function edge(P,step,jag){const out=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,n=Math.max(1,Math.round(L/step)),nx=-dy/L,ny=dx/L;
  for(let k=0;k<n;k++){const t=k/n,j=rand(-jag,jag)+(Math.random()<.05?rand(-jag*1.6,0):0);out.push([a[0]+dx*t+nx*j,a[1]+dy*t+ny*j])}}return out}
const path=P=>{const p=new Path2D();P.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p};
// paper grain inside the current clip: mottling, short fibres both lighter and darker than the sheet, flecks
function grain(g,x0,y0,w,h,k){k=k||1;for(let i=0;i<4;i++){const x=rand(x0,x0+w),y=rand(y0,y0+h),r=rand(10,26),gr=g.createRadialGradient(x,y,0,x,y,r),c=Math.random()<.5?'255,250,235':'60,36,14';
    gr.addColorStop(0,`rgba(${c},${(.09*k).toFixed(3)})`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
  g.lineCap='round';for(let i=0;i<Math.round(w*h/60);i++){const x=rand(x0,x0+w),y=rand(y0,y0+h),a=rand(0,PI*2),l=rand(1.5,4.5);g.strokeStyle=Math.random()<.5?`rgba(255,252,240,${(.3*k).toFixed(2)})`:`rgba(60,36,14,${(.16*k).toFixed(2)})`;
    g.lineWidth=rand(.5,1);g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  for(let i=0;i<Math.round(w*h/110);i++){g.fillStyle=Math.random()<.6?`rgba(50,32,14,${(.26*k).toFixed(2)})`:`rgba(255,255,255,${(.45*k).toFixed(2)})`;g.fillRect(rand(x0,x0+w),rand(y0,y0+h),rand(.8,1.8),rand(.8,1.8))}}
function bbox(P){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const[x,y]of P){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}return[a-2,b-2,c-a+4,d-b+4]}
/* one scrap of paper: the pale core (wider on a torn edge) under the coloured face, then grain on the face */
function piece(g,P,col,o){o=o||{};const torn=o.cut?0:1,out=torn?edge(P,3,1.5):edge(P,16,.45),inn=torn?edge(P,3,1.1):out;
  const po=path(out),pi=path(inn);g.fillStyle=o.core||C.core;g.fill(po);g.lineJoin='round';g.lineWidth=torn?2.6:1.3;g.strokeStyle=o.core||C.core;g.stroke(po);
  g.save();if(torn)g.translate(rand(-.6,.6),rand(-.6,.6));g.fillStyle=col;g.fill(pi);g.clip(pi);const[x,y,w,h]=bbox(P);grain(g,x,y,w,h,o.dark?1.3:1);
  if(o.fold){g.strokeStyle='rgba(60,36,14,.18)';g.lineWidth=1.2;g.beginPath();g.moveTo(x+w*rand(.2,.4),y);g.lineTo(x+w*rand(.5,.8),y+h);g.stroke();g.strokeStyle='rgba(255,250,235,.25)';g.stroke()}
  g.restore()}
/* felt: the colour itself, fibres standing off every edge, a dense nap of short curls, and an optional running stitch */
function felt(g,P,col,o){o=o||{};const pp=path(P);g.fillStyle=col;g.fill(pp);g.lineCap='round';
  const E=edge(P,2,0);for(const[x,y]of E)for(let k=0;k<2;k++){const a=rand(0,PI*2),l=rand(1.5,3.6);g.strokeStyle=col;g.lineWidth=rand(.6,1.1);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+1)*l*.5,y+Math.sin(a+1)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  g.save();g.clip(pp);const[x0,y0,w,h]=bbox(P);for(let i=0;i<Math.round(w*h/7);i++){const x=rand(x0,x0+w),y=rand(y0,y0+h),a=rand(0,PI*2),l=rand(1.5,3.5);
    g.strokeStyle=Math.random()<.5?'rgba(255,255,255,.13)':'rgba(20,10,20,.2)';g.lineWidth=rand(.5,1);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+1.2)*l*.6,y+Math.sin(a+1.2)*l*.6,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  g.restore();if(o.stitch){g.save();g.setLineDash([4,3.2]);g.lineDashOffset=rand(0,6);g.strokeStyle='rgba(255,246,228,.9)';g.lineWidth=1.6;g.stroke(path(o.stitch));g.restore()}}
/* cotton wool: a lumpy tuft built only from fibres (no soft gradient), greyer underneath, wisps pulled out at the edge */
function cotton(g,cx,cy,r){const lobes=[];for(let i=0;i<7;i++){const a=rand(0,PI*2),d=rand(0,r*.45);lobes.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*.75,rand(r*.4,r*.62)])}
  const inside=(x,y)=>lobes.some(([lx,ly,lr])=>Math.hypot(x-lx,y-ly)<lr);g.lineCap='round';
  for(let i=0;i<2600;i++){const x=rand(cx-r,cx+r),y=rand(cy-r,cy+r);if(!inside(x,y))continue;const a=rand(0,PI*2),l=rand(3,9),c=rand(-1.3,1.3),sh=(y-cy)/r;
    const v=sh>.15&&Math.random()<.55?Math.round(205-sh*30):Math.random()<.7?250:228;g.strokeStyle=`rgba(${v},${v},${Math.min(255,v+4)},${rand(.35,.75).toFixed(2)})`;g.lineWidth=rand(.6,1.5);
    g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+c)*l*.5,y+Math.sin(a+c)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  for(let i=0;i<70;i++){const a=rand(0,PI*2),x=cx+Math.cos(a)*r*rand(.55,.75),y=cy+Math.sin(a)*r*rand(.45,.6),l=rand(6,14);g.strokeStyle='rgba(250,250,252,.55)';g.lineWidth=rand(.5,.9);
    g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+.6)*l*.6,y+Math.sin(a+.6)*l*.6,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}}

/* ---------- the icons (keys are the emoji the callers already pass) ---------- */
const ICON={
  // paper googly eyes on a torn pink strip: someone is staring
  '👀':g=>{piece(g,[[16,38],[112,32],[114,92],[14,96]],C.pink,{fold:1});const lk=rand(-1,1)<0?-1:1;
    for(const cx of[42,86]){piece(g,ell(cx,64,19,23,26,rand(-.15,.15)),'#fffdf7',{core:'#e2d3b8'});piece(g,ell(cx+lk*7,68,9.5,10.5,16),C.ink,{cut:1,core:'#4a4054'});g.fillStyle='#fffdf7';g.beginPath();g.arc(cx+lk*9,64,2.6,0,PI*2);g.fill()}},
  // a mustard paper tag, hole punched, with a red cut-paper exclamation glued on
  '❗':g=>{g.strokeStyle='#a9804f';g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(64,24);g.bezierCurveTo(74,12,88,10,96,4);g.stroke();
    piece(g,[[40,14],[88,12],[100,30],[96,118],[32,118],[28,30]],C.mustard,{fold:1});g.fillStyle=C.core;g.beginPath();g.arc(64,27,5.5,0,PI*2);g.fill();g.strokeStyle='rgba(60,36,14,.35)';g.lineWidth=1;g.stroke();
    piece(g,[[53,42],[76,41],[70,87],[59,88]],C.red,{cut:1});piece(g,ell(64,102,9,9,14),C.red,{cut:1})},
  // a cop's light: red paper dome on a navy strip, a cream highlight, yellow paper flashes
  '🚨':g=>{for(const s of[-1,1]){piece(g,[[64+s*54,50],[64+s*38,58],[64+s*52,66]],C.mustard,{cut:1});piece(g,[[64+s*48,24],[64+s*36,38],[64+s*44,42]],C.mustard,{cut:1})}piece(g,[[57,4],[72,5],[64,20]],C.mustard,{cut:1});
    const dome=[];for(let i=0;i<=16;i++){const a=PI+i/16*PI;dome.push([64+Math.cos(a)*29,94+Math.sin(a)*40])}piece(g,dome,C.red);
    piece(g,[[47,86],[50,64],[57,58],[55,86]],'#fbe3dc',{cut:1});piece(g,[[26,92],[102,91],[104,110],[24,111]],C.navy,{cut:1,core:'#6a6074',dark:1})},
  // a lavender scrap with an ink paper question hook
  '❓':g=>{piece(g,ell(64,62,46,52,28,rand(-.2,.2)),C.lav,{fold:1});const L=[];for(let i=0;i<=14;i++){const a=PI*1.05+i/14*PI*1.25;L.push([64+Math.cos(a)*17,48+Math.sin(a)*17])}L.push([64,72],[64,79]);
    piece(g,thick(L,11),C.ink,{cut:1,core:'#4a4054'});piece(g,ell(64,96,7.5,7.5,12),C.ink,{cut:1,core:'#4a4054'})},
  // felt music notes, stitched round the head
  '🎵':g=>{const col=pickC([C.plum,'#3f6fb3','#2f8a6e']),hd=ell(50,94,18,13,22,-.45);felt(g,[[63,96],[71,94],[72,22],[64,22]],col);felt(g,[[71,22],[90,36],[98,56],[90,72],[90,56],[82,44],[71,42]],col);felt(g,hd,col,{stitch:ell(50,94,12,7.5,18,-.45)})},
  '🎶':g=>{const col=pickC([C.hot,'#d64545',C.plum]);felt(g,[[46,32],[96,22],[96,38],[46,48]],col);for(const[x,y,t]of[[38,98,40],[86,88,30]]){felt(g,[[x+11,y+2],[x+18,y],[x+18,t],[x+11,t+2]],col);felt(g,ell(x,y,15,11,20,-.45),col,{stitch:ell(x,y,9.5,6,16,-.45)})}},
  // paper stars
  '✨':g=>{piece(g,star(58,64,44,12,4,rand(-.15,.15)),C.mustard,{cut:1});piece(g,star(100,24,15,4.5,4,.3),C.pink,{cut:1});piece(g,star(24,104,11,3.5,4,-.2),C.paper,{cut:1,core:'#d9c9a8'})},
  // a crescent moon and a star cut from paper: asleep
  '💤':g=>{piece(g,moon(58,66,38,78,50,31),C.mustard,{fold:1});piece(g,star(102,28,14,5,5,.2),C.paper,{cut:1,core:'#d9c9a8'});piece(g,star(100,98,8,3,5,0),C.sky,{cut:1})},
  // a gold paper crown with paper gems
  '👑':g=>{piece(g,[[22,110],[18,40],[42,70],[64,28],[86,70],[110,40],[106,110]],C.mustard,{fold:1});piece(g,[[22,92],[106,92],[106,112],[22,112]],'#e2a93a',{cut:1});
    for(const[x,y,c]of[[18,40,C.pink],[64,28,C.teal],[110,40,C.red],[42,102,C.teal],[64,102,C.pink],[86,102,C.teal]])piece(g,ell(x,y,7,7,12),c,{cut:1})},
  // the aim marker: a lime paper arrow pointing down at whoever you're lined up on
  '🔻':g=>{piece(g,[[42,14],[86,12],[87,56],[110,56],[65,112],[18,58],[41,57]],C.lime,{fold:1})},
  // cotton puffs (steam, a sigh)
  '💨':g=>{cotton(g,58,68,46)},'😤':g=>{cotton(g,64,66,46)},
  // confetti
  '🎉':g=>{for(let i=0;i<9;i++){const x=rand(20,108),y=rand(20,108),a=rand(0,PI),w=rand(5,9),h=rand(11,18),c=Math.cos(a),s=Math.sin(a);piece(g,[[-w,-h],[w,-h],[w,h],[-w,h]].map(([u,v])=>[x+u*c-v*s,y+u*s+v*c]),pickC([C.pink,C.teal,C.mustard,C.lav,C.lime,C.orange]),{cut:1})}},
  // power-ups
  '🔥':g=>{const F=[[64,8],[78,32],[96,46],[100,76],[88,104],[64,116],[40,108],[27,84],[31,56],[44,38],[50,56],[56,32]];piece(g,F,C.red,{fold:1});piece(g,xf(F,.68,64,96),C.orange);piece(g,xf(F,.38,64,104),C.mustard,{cut:1})},
  '✌️':g=>{for(const[s,c]of[[-1,C.teal],[1,C.pink]]){const a=s*.32,cx=64+s*14,cy=66,P=[[-11,-42],[11,-42],[11,42],[-11,42]].map(([u,v])=>[cx+u*Math.cos(a)-v*Math.sin(a),cy+u*Math.sin(a)+v*Math.cos(a)]);piece(g,P,c,{cut:1});
      const M=[[-6,-50],[6,-50],[7,-40],[-7,-40]].map(([u,v])=>[cx+u*Math.cos(a)-v*Math.sin(a),cy+u*Math.sin(a)+v*Math.cos(a)]);piece(g,M,C.ink,{cut:1,core:'#4a4054'})}},
  '🧲':g=>{const L=[[94,30],[94,58]];for(let i=1;i<14;i++){const a=i/14*PI;L.push([64+Math.cos(a)*30,58+Math.sin(a)*30])}L.push([34,58],[34,30]);piece(g,thick(L,24),C.red,{fold:1});
    for(const x of[34,94])piece(g,[[x-12,14],[x+12,14],[x+12,32],[x-12,32]],C.grey,{cut:1,core:'#e9e6df'})},
  '🌪️':g=>{const R=[[12,86,'#5f9fd2'],[31,68,'#8e80c8'],[50,52,'#5f9fd2'],[68,38,'#8e80c8'],[86,26,'#5f9fd2'],[102,14,'#8e80c8']];R.forEach(([y,w,c],i)=>{const x=64+Math.sin(i*1.3)*8;piece(g,[[x-w/2,y],[x+w/2,y+2],[x+w/2-4,y+17],[x-w/2+3,y+15]],c)})},
  '☁️':g=>{piece(g,blobs(64,70,[[-30,4,20],[-10,-14,26],[16,-12,24],[34,4,18],[0,6,24]],64,20),C.pink,{fold:1});piece(g,blobs(58,58,[[-8,0,9],[6,-4,11],[16,2,7]],32,6),'#fde3ec',{cut:1})},
  '⚡':g=>{piece(g,[[72,6],[30,68],[58,66],[44,122],[100,50],[70,52],[86,6]],C.mustard,{fold:1})},
};
function pickC(a){return a[(Math.random()*a.length)|0]}
// crescent: the outer disc minus an offset disc (ox,oy,r2), as one outline
function moon(cx,cy,r,ox,oy,r2){const out=[],inn=[],n=64;
  for(let i=0;i<n;i++){const a=i/n*PI*2,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(Math.hypot(x-ox,y-oy)>r2)out.push([a,x,y])}
  for(let i=0;i<n;i++){const a=i/n*PI*2,x=ox+Math.cos(a)*r2,y=oy+Math.sin(a)*r2;if(Math.hypot(x-cx,y-cy)<r)inn.push([a,x,y])}
  // start the outer arc right after its gap, then walk the inner arc back from the outer arc's end
  let k=0;for(let i=1;i<out.length;i++)if(out[i][0]-out[i-1][0]>2*PI/n*1.5){k=i;break}const O=out.slice(k).concat(out.slice(0,k));
  let j=0;for(let i=1;i<inn.length;i++)if(inn[i][0]-inn[i-1][0]>2*PI/n*1.5){j=i;break}const I=inn.slice(j).concat(inn.slice(0,j));
  const e=O[O.length-1],d0=Math.hypot(I[0][1]-e[1],I[0][2]-e[2]),d1=Math.hypot(I[I.length-1][1]-e[1],I[I.length-1][2]-e[2]),II=d0<=d1?I:I.slice().reverse();
  return O.map(p=>[p[1],p[2]]).concat(II.map(p=>[p[1],p[2]]))}

/* ---------- paint + shadow ---------- */
function paint(key,o){o=o||{};const w=C2(),g=w.getContext('2d'),f=ICON[key]||ICON['✨'];
  if(o.label){// a cream paper label (torn), the icon glued on smaller
    piece(g,[[8,10],[118,7],[121,118],[7,121]],C.paper,{core:'#e4d6b8',fold:1});g.save();g.translate(64,66);g.scale(.74,.74);g.rotate(rand(-.06,.06));g.translate(-64,-64);f(g);g.restore()}
  else f(g);
  if(o.flat)return w;const c=C2(),k=c.getContext('2d');k.shadowColor='rgba(45,28,12,.42)';k.shadowOffsetX=2.5;k.shadowOffsetY=4;k.shadowBlur=2;k.drawImage(w,0,0);return c}
const texC=new Map();
function tex(key,v){v=v||0;let L=texC.get(key);if(!L)texC.set(key,L=[]);if(!L[v]){const t=new T.CanvasTexture(paint(key));t.anisotropy=2;L[v]=t}return L[v]}
const labelC=new Map();
function label(kind){const P=X.PW[kind];const key=P?P.e:'✨';if(!labelC.has(key)){const t=new T.CanvasTexture(paint(key,{label:1,flat:1}));t.anisotropy=4;labelC.set(key,t)}return labelC.get(key)}
X.emoTex=ch=>tex(ch,0);

/* ---------- reaction icons: a small pool, posed on twos ---------- */
const POOL=[],MAXLIVE=7,STEP=1/12,V=new T.Vector3();
for(let i=0;i<16;i++){const m=new T.SpriteMaterial({transparent:true,depthWrite:false,alphaTest:.05}),s=new T.Sprite(m);s.visible=false;s.renderOrder=2;scene.add(s);POOL.push({s,m,life:0,on:false})}
let live=0,clock=0,lastStep=-1;
X.emo=function(ch,x,y,z,vx,vy,vz,sz){if(X.mode!=='play'&&X.mode!=='paused')return;
  // keep clear of the middle of the screen and of your face
  V.set(x,y,z);const d=V.distanceTo(cam.position);if(d<2.6)return;V.project(cam);if(V.z>1||Math.abs(V.x)>1.05||Math.abs(V.y)>1.05)return;if(Math.abs(V.x)<.36&&Math.abs(V.y)<.5)return;
  if(live>=MAXLIVE)return;let p=null;for(const q of POOL)if(!q.on){p=q;break}if(!p)return;
  const rm=RM.matches,k=rm?0:1;Object.assign(p,{on:true,ch,x,y,z,vx:vx*.5*k,vy:Math.min(vy,1.2)*.6*k,vz:vz*.5*k,sz:sz*.9,age:0,life:rand(1.5,2.2),rot:rand(-.22,.22),v:0,f:0});
  p.m.map=tex(ch,0);p.m.needsUpdate=true;p.m.rotation=p.rot;p.s.position.set(x,y,z);p.s.scale.setScalar(sz*.5);p.s.visible=true;live++;
  if(!rm&&!texC.get(ch)[1])setTimeout(()=>tex(ch,1),0)};// the boil's second cut, painted off this frame
X.on('prerender',dt=>{if(!live)return;clock+=dt;const step=Math.floor(clock/STEP);if(step===lastStep)return;const n=Math.min(4,step-lastStep);lastStep=step;const h=n*STEP,rm=RM.matches;
  for(const p of POOL){if(!p.on)continue;p.age+=h;p.f++;if(p.age>=p.life){p.on=false;p.s.visible=false;live--;continue}
    const dm=Math.pow(.25,h);p.vx*=dm;p.vz*=dm;p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;
    // pop on in two held frames, off in two; between, a small hand jitter and the two cuts swapping every other frame
    const left=p.life-p.age,sc=p.f===1?1.14:left<STEP*1.5?.5:left<STEP*2.5?.82:1;
    if(rm){p.s.position.set(p.x,p.y,p.z);p.s.scale.setScalar(p.sz);continue}
    p.s.position.set(p.x+rand(-.012,.012),p.y+rand(-.012,.012),p.z);p.s.scale.setScalar(p.sz*sc*(1+rand(-.035,.035)));p.m.rotation=p.rot+rand(-.06,.06);
    if(p.f%2===0){const L=texC.get(p.ch);const nv=L&&L[1]?1-p.v:0;if(nv!==p.v){p.v=nv;p.m.map=L[nv];p.m.needsUpdate=true}}}});

/* ---------- power-up crates: painted card box, paper labels, a paper flag on a toothpick ---------- */
// one label on each side and the flag (on its toothpick), all one mesh: a crate costs no more draw calls than the old box and straps
const LBLG=(()=>{const s=.6,o=.402,Ps=[],Ns=[],Us=[],I=[];const faces=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]];
  for(const[nx,,nz]of faces){const b=Ps.length/3,rx=nz,rz=-nx;// right vector
    for(const[u,v]of[[0,0],[1,0],[1,1],[0,1]]){const x=(u-.5)*s,y=(v-.5)*s;Ps.push(nx*o+rx*x,y,nz*o+rz*x);Ns.push(nx,0,nz);Us.push(u,v)}I.push(b,b+1,b+2,b,b+2,b+3)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Ps,3));g.setAttribute('normal',new T.Float32BufferAttribute(Ns,3));g.setAttribute('uv',new T.Float32BufferAttribute(Us,2));g.setIndex(I);
  // the flag: a paper square with a gentle wave, hung off the toothpick
  const f=new T.PlaneGeometry(.52,.52,4,1),P=f.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i);P.setZ(i,Math.sin((x+.26)*7)*.035)}f.translate(.27,0,0);
  f.applyMatrix4(new T.Matrix4().compose(new T.Vector3(.18,1.02,.1),new T.Quaternion().setFromEuler(new T.Euler(0,.4,0)),new T.Vector3(1,1,1)));
  const A=g.toNonIndexed(),B=f.toNonIndexed(),out=new T.BufferGeometry();
  for(const k of['position','normal','uv']){const a=A.attributes[k],b=B.attributes[k],arr=new Float32Array(a.array.length+b.array.length);arr.set(a.array);arr.set(b.array,a.array.length);out.setAttribute(k,new T.BufferAttribute(arr,a.itemSize))}
  out.computeVertexNormals();return out})();
const STICKM=X.M(0xe2c48e),lblM=new Map(),boxM=new Map();
function lblMat(kind){if(!lblM.has(kind)){const m=new T.MeshToonMaterial({gradientMap:X.M(0xffffff).gradientMap,map:label(kind),alphaTest:.5,side:T.DoubleSide});m.userData.clayKind='paper';lblM.set(kind,m)}return lblM.get(kind)}
function dress(p){p._pp=1;const P=X.PW[p.k];if(!P)return;
  for(const o of[...p.g.children])if(o.isSprite)p.g.remove(o);
  for(const o of[...p.cr.children]){const m=o.material;if(!o.isMesh||!m)continue;
    if(m.color&&m.color.getHex()===P.c){if(!boxM.has(p.k)){const nm=new T.MeshToonMaterial({gradientMap:m.gradientMap,color:P.c});nm.userData.clayKind='paint';boxM.set(p.k,nm)}o.material=boxM.get(p.k)}// painted card, no glow
    else p.cr.remove(o)}// the dark straps go
  const L=new T.Mesh(LBLG,lblMat(p.k));L.userData.noInk=1;p.cr.add(L);
  X.cyl(p.cr,.035,.8,.035,STICKM,.18,.78,.1);// toothpick
  p.cr.rotation.x=0}
X.on('prerender',()=>{for(const p of X.picks)if(!p._pp)dress(p)});

/* paint the common icons and every crate label ahead of time, a few per idle slice, so none is drawn in the middle of play */
const WARM=['🔻','❗','👀','🚨','❓','🎵','🎶','💤','😤','👑',...Object.keys(X.PW)];
const idle=window.requestIdleCallback||(f=>setTimeout(()=>f({timeRemaining:()=>8}),60));
(function warm(dl){while(WARM.length&&(!dl||dl.timeRemaining()>6)){const k=WARM.shift();if(X.PW[k])label(k);else tex(k,0)}if(WARM.length)idle(warm)})();

X.icons={tex,label,keys:Object.keys(ICON),get live(){return live}};
})();
