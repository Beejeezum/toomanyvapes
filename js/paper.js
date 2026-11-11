/* paper mod: every bit of 2D UI restyled as cut construction paper, kraft cardboard and masking tape on a craft table,
   animated "on twos" like stop motion. Pure overrides: injects one <style>, generates its textures with canvas/SVG,
   and enhances existing elements through MutationObservers (never edits the core or other mods).
   - #num stays in the DOM for the core (and screen readers) but is hidden; #ppnum mirrors it as one paper scrap per character.
   - Any element with data-paper="ransom" (now or later) is turned into cut-out letters; TMV.paper exposes the helpers. */
(()=>{const X=window.TMV;if(!X)return;const D=document,$=id=>D.getElementById(id);
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const R=(a,b)=>a+Math.random()*(b-a),f1=v=>v.toFixed(1),f2=v=>v.toFixed(2);

/* one handwriting face for marker text (the chunky display face, Bungee, is already loaded by the page) */
{const l=D.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap';D.head.appendChild(l)}

/* ---------- textures (canvas, drawn once at 2x so they stay crisp on high-DPI) ---------- */
function tex(w,h,draw){const c=D.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return 'url('+c.toDataURL()+')'}
const wrap9=(w,h,f)=>{for(const ox of[-w,0,w])for(const oy of[-h,0,h])f(ox,oy)}; // draw strokes tiled so the texture repeats without seams
function strands(g,w,h,n,cols,len,lw){g.lineCap='round';for(let i=0;i<n;i++){const s=[];let x=R(0,w),y=R(0,h),a=R(0,6.28);s.push([x,y]);
  for(let k=0;k<4;k++){a+=R(-.7,.7);x+=Math.cos(a)*R(len*.5,len);y+=Math.sin(a)*R(len*.5,len);s.push([x,y])}
  g.strokeStyle=cols[i%cols.length];g.lineWidth=R(lw*.5,lw);wrap9(w,h,(ox,oy)=>{g.beginPath();s.forEach((p,j)=>j?g.lineTo(p[0]+ox,p[1]+oy):g.moveTo(p[0]+ox,p[1]+oy));g.stroke()})}}
/* construction paper: soft mottling, short felted fibres both lighter and darker than the sheet, dark and coloured
   inclusions (flecks), fine tooth. Semi-transparent light + dark marks, so it reads on any colour layered under it. */
function blobs(g,w,h,n,r0,r1,cols){for(let i=0;i<n;i++){const x=R(0,w),y=R(0,h),r=R(r0,r1),c=cols[i%cols.length];
  wrap9(w,h,(ox,oy)=>{const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);gr.addColorStop(0,c);gr.addColorStop(1,c.replace(/[\d.]+\)$/,'0)'));g.fillStyle=gr;g.fillRect(x+ox-r,y+oy-r,r*2,r*2)})}}
function flecks(g,w,h,n,cols,s0,s1){for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];const x=R(0,w),y=R(0,h),a=R(s0,s1),b=R(s0*.5,s1*.7);g.beginPath();g.ellipse(x,y,a,b,R(0,3.14),0,7);g.fill()}}
function tooth(g,w,h,a0,a1){const id=g.getImageData(0,0,w,h),d=id.data;for(let i=0;i<d.length;i+=4){if(Math.random()<.5){const v=Math.random()<.5?40:255,k=Math.random()*(v>100?a1:a0);
  const a=d[i+3]/255,na=k/255;if(na<=0)continue;const oa=na+a*(1-na);d[i]=(v*na+d[i]*a*(1-na))/oa;d[i+1]=(v*na+d[i+1]*a*(1-na))/oa;d[i+2]=((v===40?30:v)*na+d[i+2]*a*(1-na))/oa;d[i+3]=oa*255}}g.putImageData(id,0,0)}
const GRAIN=tex(256,256,(g,w,h)=>{
  blobs(g,w,h,26,14,40,['rgba(70,45,20,.07)','rgba(255,250,235,.09)']);
  strands(g,w,h,260,['rgba(70,45,20,.13)','rgba(255,252,240,.24)','rgba(255,252,240,.16)'],5,1.5);
  flecks(g,w,h,70,['rgba(50,32,14,.30)','rgba(50,32,14,.22)','rgba(255,255,255,.5)','rgba(200,60,90,.22)','rgba(60,110,200,.2)'],.5,1.3);
  tooth(g,w,h,26,34)});
const FIBER=tex(256,256,(g,w,h)=>{
  blobs(g,w,h,18,20,50,['rgba(60,36,14,.09)','rgba(255,232,190,.08)']);
  strands(g,w,h,240,['rgba(80,50,22,.2)','rgba(255,232,190,.22)','rgba(60,38,16,.14)'],13,2.4);
  flecks(g,w,h,90,['rgba(40,24,8,.42)','rgba(40,24,8,.28)','rgba(255,240,210,.4)'],.6,1.8)});
/* big, low-frequency colour wander laid under the grain so neighbouring scraps never look like the same flat swatch */
const MOTTLE=tex(384,384,(g,w,h)=>blobs(g,w,h,22,50,120,['rgba(60,36,14,.085)','rgba(255,250,235,.11)','rgba(60,36,14,.05)']));
const CRAYON=tex(192,64,(g,w,h)=>{g.lineCap='round';for(let i=0;i<260;i++){const x=R(0,w),y=R(0,h),l=R(8,22),a=-1.05+R(-.15,.15);g.strokeStyle=`rgba(255,255,255,${f2(R(.55,1))})`;g.lineWidth=R(1.4,3.2);
    wrap9(w,h,(ox,oy)=>{g.beginPath();g.moveTo(x+ox-Math.cos(a)*l,y+oy-Math.sin(a)*l);g.lineTo(x+ox+Math.cos(a)*l,y+oy+Math.sin(a)*l);g.stroke()})}
  g.globalCompositeOperation='destination-out';for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${f2(R(.3,.9))})`;g.fillRect(R(0,w),R(0,h),R(.6,1.8),R(.6,1.8))}});

/* ---------- cut shapes (clip-path polygons) ---------- */
/* scissor-cut scrap: corners nipped at random, j = max inset in % */
function scrap(j){const e=()=>R(0,j),p=[[e(),e()]];if(Math.random()<.6)p.push([R(30,70),e()*.6]);p.push([100-e(),e()]);if(Math.random()<.5)p.push([100-e()*.6,R(30,70)]);
  p.push([100-e(),100-e()]);if(Math.random()<.6)p.push([R(30,70),100-e()*.6]);p.push([e(),100-e()]);if(Math.random()<.5)p.push([e()*.6,R(30,70)]);
  return 'polygon('+p.map(q=>f1(q[0])+'% '+f1(q[1])+'%').join(',')+')'}
/* torn strip: deckled px-sized jag on all four edges, n points along the long edges */
function tear(j,n){const P=[],J=k=>f1(R(0,j*(k||1))+(Math.random()<.06?R(j*.5,j*1.2):0));
  for(let i=0;i<=n;i++)P.push(`${f2(i/n*100)}% ${J()}px`);
  for(let i=1;i<4;i++)P.push(`calc(100% - ${J(.8)}px) ${f1(i*25+R(-6,6))}%`);
  for(let i=n;i>=0;i--)P.push(`${f2(i/n*100)}% calc(100% - ${J()}px)`);
  for(let i=3;i>0;i--)P.push(`${J(.8)}px ${f1(i*25+R(-6,6))}%`);
  return `polygon(${P.join(',')})`}
/* one torn edge only (letterbox strips) */
function tearEdge(bottom,j,n){const P=[];if(bottom){P.push('0 0','100% 0');for(let i=n;i>=0;i--)P.push(`${f2(i/n*100)}% calc(100% - ${f1(R(0,j))}px)`)}
  else{for(let i=0;i<=n;i++)P.push(`${f2(i/n*100)}% ${f1(R(0,j))}px`);P.push('100% 100%','0 100%')}return `polygon(${P.join(',')})`}
/* masking tape: straight sides, zig-zag torn ends */
function tape(){const z=4.5,P=[],end=k=>f1(k%2?R(z*.6,z):R(0,z*.3));P.push(`${f1(R(0,z))}px 0`,`calc(100% - ${f1(R(0,z))}px) 0`);
  for(let k=1;k<6;k++)P.push(`calc(100% - ${end(k)}px) ${f1(k/6*100)}%`);P.push(`calc(100% - ${f1(R(0,z))}px) 100%`,`${f1(R(0,z))}px 100%`);
  for(let k=5;k>0;k--)P.push(`${end(k)}px ${f1(k/6*100)}%`);return `polygon(${P.join(',')})`}
/* frame with a torn hole (evenodd): t = thickness (any CSS length), j = jag px */
function frame(t,j,n,m){const P=[],L=f=>`calc(${t} + (100% - 2 * ${t}) * ${f.toFixed(3)})`,J=()=>f1(R(-j,j)+(Math.random()<.07?R(j,j*2.4):0))+'px';
  for(let i=0;i<=n;i++)P.push(`${L(i/n)} calc(${t} + ${J()})`);
  for(let i=1;i<=m;i++)P.push(`calc(100% - ${t} - ${J()}) ${L(i/m)}`);
  for(let i=n-1;i>=0;i--)P.push(`${L(i/n)} calc(100% - ${t} - ${J()})`);
  for(let i=m-1;i>0;i--)P.push(`calc(${t} + ${J()}) ${L(i/m)}`);
  return `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${P.join(',')})`}
/* pencil ring for the crosshair: a wobbly circle drawn slightly past 360° */
function ring(){let d='';const N=28,a0=R(0,6.28),sp=6.28+R(.35,.8);for(let i=0;i<=N;i++){const a=a0+sp*i/N,r=7.1+R(-.4,.4)+i/N*.6;d+=(i?'L':'M')+f2(12+Math.cos(a)*r)+' '+f2(12+Math.sin(a)*r)}
  const s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke="#fff8ea" stroke-opacity=".7" stroke-width="3"/><path d="${d}" stroke="#2b2233" stroke-width="1.25"/></g><circle cx="${f2(12+R(-.3,.3))}" cy="${f2(12+R(-.3,.3))}" r="1.5" fill="#fff8ea" stroke="#2b2233" stroke-width=".8"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(s)}")`}

/* ---------- palette ---------- */
const C={paper:'#fbf5e6',pink:'#f6a6c1',teal:'#6cc9bf',mustard:'#eebd4b',lime:'#bfdc5a',sky:'#9ccfee',lav:'#bba7e6',orange:'#f39a5f',red:'#e4574d',green:'#79c26a',
  kraft:'#c69c6d',kraft2:'#a9804f',ink:'#2b2233',brown:'#3b2614',tape:'rgba(240,229,192,.9)',washi:'rgba(245,142,182,.93)',washi2:'rgba(108,201,191,.93)'};
const PASTEL=[C.paper,C.pink,C.teal,C.mustard,C.lime,C.sky,C.lav,C.orange];
const RANSOM=[...PASTEL,C.paper,C.ink,C.red];const DARK=new Set([C.ink,C.red]);
const P=c=>`var(--pp-grain) 0 0/128px 128px,var(--pp-mottle) 0 0/240px 240px,${c}`; // coloured construction paper
const KRAFT=`var(--pp-fiber) 0 0/128px 128px,var(--pp-grain) 0 0/128px 128px,var(--pp-mottle) 0 0/240px 240px,${C.kraft}`;
const FLUTE='repeating-linear-gradient(90deg,#7a5530 0 1.2px,#dcbb8e 1.2px 2.6px,#a57b4c 2.6px 4px) 0 0/100% 4px no-repeat'; // corrugation showing at a cut edge
const WASHI=c=>`repeating-linear-gradient(45deg,rgba(255,255,255,.28) 0 3px,transparent 3px 8px),var(--pp-grain) 0 0/128px 128px,${c}`;
const CRAY='-webkit-mask:var(--pp-crayon) 0 0/96px 32px;mask:var(--pp-crayon) 0 0/96px 32px';

/* stop-motion keyframes for the #gain pop: 13 held frames with hand-placed jitter */
let GK='@keyframes ppgain{';{const F=13;for(let k=0;k<=F;k++){const t=k/F,sc=t<.08?.45:t<.16?1.22:t<.24?.94:1,op=t<.04?0:t>.68?Math.max(0,1-(t-.68)/.32):1;
  GK+=`${f1(t*100)}%{opacity:${f2(op)};scale:${sc};translate:${f1(R(-2,2))}px ${f1(-Math.pow(t,1.15)*66)}px;rotate:${f1(R(-5,5))}deg}`}}GK+='}';
const XR=[ring(),ring(),ring()];

/* ---------- styles ---------- */
const css=D.createElement('style');css.id='pp-css';css.textContent=`
:root{--pp-grain:${GRAIN};--pp-fiber:${FIBER};--pp-mottle:${MOTTLE};--pp-crayon:${CRAYON};
 --pp-marker:'Permanent Marker','Comic Sans MS','Chalkboard SE',cursive;--pp-ink:${C.ink};
 --pp-rim:drop-shadow(0 0 .55px rgba(255,249,236,.95)) drop-shadow(0 0 .35px rgba(255,249,236,.8));
 --pp-sh:var(--pp-rim) drop-shadow(0 2px 1.2px rgba(45,28,12,.42));--pp-sh2:var(--pp-rim) drop-shadow(0 3px 2px rgba(45,28,12,.38));
 --pp-lift:0 2px 0 rgba(60,38,16,.28),0 4px 6px rgba(40,24,10,.26);
 --pp-tear1:${tear(2.6,48)};--pp-tear2:${tear(3,40)};--pp-tear3:${tear(4,56)};--pp-tear4:${tear(2.4,44)};--pp-tear5:${tear(4.5,110)};
 --pp-tape1:${tape()};--pp-tape2:${tape()};--pp-tape3:${tape()};
 --pp-scrap1:${scrap(7)};--pp-scrap2:${scrap(9)};--pp-scrap3:${scrap(6)};
 --pp-tearB:${tearEdge(1,7,80)};--pp-tearT:${tearEdge(0,7,80)};
 --pp-frame1:${frame('clamp(14px,4.6vmin,46px)',4,46,28)};--pp-frame2:${frame('clamp(9px,3vmin,30px)',3.5,52,32)}}

/* stop-motion boil: values hold for 100ms each (10fps), all scraps shift on the same tick */
@keyframes ppb{0%,100%{translate:0 0;rotate:var(--r,0deg)}25%{translate:.5px -.5px;rotate:calc(var(--r,0deg) + .7deg)}50%{translate:-.5px .4px;rotate:calc(var(--r,0deg) - .45deg)}75%{translate:.3px .6px;rotate:calc(var(--r,0deg) + .25deg)}}
@keyframes ppB{0%,100%{translate:0 0;rotate:var(--r,0deg)}25%{translate:.6px -.4px;rotate:calc(var(--r,0deg) + .18deg)}50%{translate:-.4px .5px;rotate:calc(var(--r,0deg) - .12deg)}75%{translate:.4px .4px;rotate:calc(var(--r,0deg) + .08deg)}}
@keyframes ppr{0%,100%{rotate:var(--r,0deg)}25%{rotate:calc(var(--r,0deg) + .5deg)}50%{rotate:calc(var(--r,0deg) - .35deg)}75%{rotate:calc(var(--r,0deg) + .2deg)}}
@keyframes ppx{0%{background-image:${XR[0]}}33%{background-image:${XR[1]}}66%{background-image:${XR[2]}}}
@keyframes ppfade{0%,100%{opacity:0}15%,70%{opacity:1}}
${GK}

/* ---- shared bits ---- */
.pp-rn{text-shadow:none!important}
.pp-w{display:inline-flex;align-items:center;white-space:nowrap}
.pp-l{display:inline-block;font-size:var(--s,1em);line-height:1;padding:.09em .11em .04em;margin:0 .01em;color:var(--fg,${C.ink});background:${P('var(--bg)')};clip-path:var(--cp);rotate:var(--r);position:relative;top:var(--y,0)}
.pp-l.f2{font-family:var(--body);font-weight:800}
.pp-l.f3{font-family:var(--pp-marker);font-weight:400}
.pp-frame{position:absolute;inset:0;pointer-events:none;z-index:-1}
.pp-frame>div{position:absolute;inset:0}
.pp-frame>.f1{filter:var(--pp-sh2)}.pp-frame>.f2{filter:drop-shadow(0 2px 2px rgba(40,24,10,.45))}
.pp-frame>div>i{position:absolute;inset:0}
.pp-frame>.f1>i{background:${P(C.pink)};clip-path:var(--pp-frame1)}
.pp-frame>.f2>i{background:${FLUTE.replace('0 0/','0 100%/')},${KRAFT};clip-path:var(--pp-frame2)}
.pp-tp{position:absolute;width:clamp(54px,11vmin,96px);height:clamp(18px,3.4vmin,28px);background:${P(C.tape)};clip-path:var(--pp-tape1);opacity:.92}
.pp-frame .pp-tp:nth-of-type(1){left:-6px;top:6px;rotate:-38deg}
.pp-frame .pp-tp:nth-of-type(2){right:-6px;top:8px;rotate:41deg;clip-path:var(--pp-tape2)}
.pp-frame .pp-tp:nth-of-type(3){right:-4px;bottom:10px;rotate:-36deg;clip-path:var(--pp-tape3)}
.pp-frame .pp-tp:nth-of-type(4){left:-5px;bottom:7px;rotate:39deg}

/* ---- vapes-left counter: one scrap per character ---- */
#game #count{background:none;border:0;padding:4px 10px 6px;rotate:none;display:flex;flex-direction:column;align-items:center}
#game #num{position:absolute!important;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
#ppnum{display:flex;align-items:flex-end;justify-content:center;gap:1px;filter:var(--pp-sh);font-family:var(--display);font-size:clamp(30px,6.2vw,54px);line-height:1;color:${C.ink};font-variant-numeric:tabular-nums}
#ppnum span{display:inline-block;min-width:.66em;text-align:center;padding:.12em .12em .06em;background:${P('var(--bg)')};clip-path:var(--cp);rotate:var(--r);position:relative;top:var(--y,0);transform-origin:50% 90%}
#ppnum span.c{min-width:0;font-size:.48em;padding:.1em .14em .02em;margin:0 1px;align-self:flex-end;top:.12em}

/* ---- HOOKED: masking-tape tag + torn strip filled with crayon ---- */
#game #panic{display:flex;align-items:center;gap:0;margin-top:5px;width:min(236px,56vw);font:400 11px/1 var(--pp-marker);letter-spacing:.03em;color:${C.ink};filter:var(--pp-sh)}
#game #panic .pp-tag{position:relative;z-index:1;white-space:nowrap;padding:5px 10px 4px;margin-right:-7px;background:${P(C.tape)};clip-path:var(--pp-tape1);rotate:var(--r,-5deg)}
#game #hookp{font:inherit;color:#b02a62;margin-left:2px}
#game #panic .bar{flex:1;height:13px;margin:0;background:${P(C.paper)};clip-path:var(--pp-tear1)}
#game #panic .bar i{height:100%;background:#e0407c;${CRAY}}
#game #hud [id^="stch"],#game #hud .stch{font-family:var(--pp-marker);font-weight:400;color:${C.ink};text-shadow:none;background:${P(C.mustard)};border:0;border-radius:2px 5px 3px 4px;box-shadow:var(--pp-lift)}
#game #stch,#game .stch{rotate:3deg;padding:2px 7px 1px;font-size:12px;letter-spacing:.04em}

/* ---- hold-to-vape meter: paper strip, green sweet-spot patch taped on, red paper when over ---- */
#game #lung{width:min(280px,64vw);padding:7px 9px;--r:1.5deg;rotate:var(--r);filter:var(--pp-sh);isolation:isolate}
#game #lung::before{content:'';position:absolute;inset:0;z-index:-1;background:${P(C.paper)};clip-path:var(--pp-tear2)}
#game #lung.over::before{background:${P(C.red)}}
#game #lung .bar{position:relative;height:18px;margin:0;border:0;background:repeating-linear-gradient(-60deg,rgba(228,87,77,.5) 0 2px,transparent 2px 5px) 100% 0/20% 100% no-repeat}
#game #lung .bar::before{content:'';position:absolute;left:56%;width:24%;top:-4px;bottom:-4px;background:${P(C.green)};clip-path:var(--pp-scrap2);rotate:-2deg}
#game #lung .bar::after{content:'';position:absolute;left:calc(68% - 11px);top:-9px;width:22px;height:10px;background:${P(C.tape)};clip-path:var(--pp-tape2);rotate:9deg;z-index:1}
#game #lung .bar i{position:relative;background:#5a4a63;opacity:.9;${CRAY}}
#game #lung.zone .bar i{background:#24702f}
#game #lung.over .bar i{background:#fff4e6}
#game #lung.over .bar{background:none}

/* ---- power-up chips: cardboard tokens with a crayon timer ---- */
#game #powers{gap:10px;width:auto;align-items:flex-start}
#game .pw{position:relative;isolation:isolate;filter:var(--pp-sh);background:none;border:0;padding:9px 11px 8px;font-size:24px;line-height:1;min-width:56px;text-align:center;color:${C.ink};rotate:var(--r)}
#game .pw:nth-child(3n+1){--r:-3deg}#game .pw:nth-child(3n+2){--r:2.5deg}#game .pw:nth-child(3n){--r:-1deg}
#game .pw::before{content:'';position:absolute;inset:0;z-index:-1;background:${FLUTE},${KRAFT};clip-path:var(--pp-scrap3)}
#game .pw::after{content:'';position:absolute;right:-6px;top:-3px;width:24px;height:10px;background:${P(C.tape)};clip-path:var(--pp-tape3);rotate:35deg}
#game .pw i{height:6px;margin-top:6px;background:var(--c);border-radius:3px;${CRAY}}

/* ---- "−N": cut-paper numbers that pop and drift ---- */
#game #gain{display:flex;gap:1px;font-family:var(--display);font-size:clamp(20px,4.4vw,34px);text-shadow:none;color:${C.ink};filter:var(--pp-sh)}
#game #gain.go{animation:ppgain 1.1s steps(1,end) both}
#game #gain .pp-l{padding:.1em .1em .04em}

/* ---- crosshair: a pencil ring with a hole-punch dot ---- */
#game #cross{width:22px;height:22px;margin:-11px;border:0;border-radius:0;opacity:.95;background:${XR[0]} center/100% 100% no-repeat}

/* ---- overlays: scene stays visible inside a torn craft-paper frame ---- */
#game .ov,#mob .ov{background:rgba(48,32,18,.16);isolation:isolate}
#mob #mPause{background:rgba(48,32,18,.5)}
#game .ov h1,#mob .ov h1{color:${C.ink};text-shadow:none;rotate:-2deg;line-height:1;font-size:clamp(38px,10.5vw,100px)}
#game .ov h1.pp-rn,#mob .ov h1.pp-rn{display:flex;flex-wrap:wrap;justify-content:center;column-gap:.28em;row-gap:.06em;filter:var(--pp-sh2)}
#game #intro .loc{font:400 clamp(15px,2.6vw,21px)/1.2 var(--pp-marker);letter-spacing:.02em;text-transform:none;color:${C.ink};opacity:1;padding:.5em 1.5em .45em;background:${P(C.tape)};clip-path:var(--pp-tape2);--r:1.8deg;rotate:var(--r);max-width:calc(100vw - 32px)}
html .ov>button{position:relative;font-family:var(--display);font-size:clamp(20px,3.4vw,27px);color:${C.brown};padding:15px 34px 12px;border:0;border-radius:4px 10px 3px 8px/9px 3px 10px 4px;background:${FLUTE},${KRAFT};
 box-shadow:var(--pp-lift),inset 0 0 0 2px rgba(255,240,210,.16);--r:-2deg;rotate:var(--r);margin-top:12px;text-shadow:0 1px 0 rgba(255,236,200,.35);transition:translate .08s steps(1,end),box-shadow .08s steps(1,end)}
html .ov>button::before,html .ov>button::after{content:'';position:absolute;top:-8px;width:34px;height:14px;background:${P(C.tape)};pointer-events:none}
html .ov>button::before{left:-10px;rotate:-32deg;clip-path:var(--pp-tape1)}
html .ov>button::after{right:-10px;rotate:28deg;clip-path:var(--pp-tape3)}
html .ov>button:hover{translate:0 -2px;box-shadow:0 4px 0 rgba(60,38,16,.24),0 7px 9px rgba(40,24,10,.26)}
html .ov>button:active{translate:0 2px;box-shadow:0 1px 0 rgba(60,38,16,.3),0 2px 3px rgba(40,24,10,.25)}
html .ov>button:focus-visible{outline:3px dashed ${C.ink};outline-offset:5px}
#game #stats,#mob #mHow{color:${C.ink};font:400 clamp(15px,2.3vw,19px)/1.5em var(--pp-marker);max-width:min(36ch,calc(100vw - 32px))!important;padding:.45em 1em .4em 2.3em;
 background:linear-gradient(90deg,transparent 1.7em,rgba(214,76,76,.5) 1.7em calc(1.7em + 1.5px),transparent 0),repeating-linear-gradient(transparent 0 calc(1.5em - 1px),rgba(80,130,200,.38) calc(1.5em - 1px) 1.5em) 0 .45em,${P(C.paper)};
 box-shadow:var(--pp-lift);--r:1.5deg;rotate:var(--r);border-radius:1px 3px 2px 2px}
#mob #mHow{font-size:14px!important;max-width:min(52ch,calc(100vw - 32px))!important}

/* ---- pause menu & phone controls (mobile.js) ---- */
#mob #mPause .row button{font:400 15px/1.1 var(--pp-marker);letter-spacing:.02em;color:${C.ink};border:0;border-radius:3px 6px 2px 5px;padding:11px 15px 9px;box-shadow:var(--pp-lift);background:${P(C.paper)};rotate:var(--r)}
#mob #mPause .row button:nth-child(5n+1){background:${P(C.sky)};--r:-2deg}#mob #mPause .row button:nth-child(5n+2){background:${P(C.lime)};--r:1.5deg}
#mob #mPause .row button:nth-child(5n+3){background:${P(C.mustard)};--r:-1deg}#mob #mPause .row button:nth-child(5n+4){background:${P(C.lav)};--r:2deg}
#mob #mPause .row button.off{background:${P(C.pink)};color:#8a1240;text-decoration:line-through 2px}
#mob .mBtn{border:0;color:${C.brown};background:${FLUTE},${KRAFT};border-radius:4px 8px 3px 6px/7px 3px 8px 4px;box-shadow:var(--pp-lift)}
#mob #mPauseB{--r:-3deg}#mob #mMuteB{--r:2deg}
#mob .mBtn::after{content:'';position:absolute;top:-5px;left:50%;width:20px;height:9px;margin-left:-10px;background:${P(C.tape)};clip-path:var(--pp-tape2);rotate:-6deg;pointer-events:none}
#mob #mMuteB.off{background:${P(C.pink)};color:#9b1446}
#mob #mRun{background:${P(C.lime)};color:${C.ink};border-radius:48% 52% 50% 47%/51% 47% 53% 49%;opacity:.9;font-size:14px}
#mob #mRun::after{content:none}
#mob #mRun.on{background:${P(C.orange)};color:${C.ink};box-shadow:var(--pp-lift);opacity:1}
#mob #mRot{background:${P(C.paper)};color:${C.ink};font:400 14px/1.2 var(--pp-marker);border:0;box-shadow:var(--pp-lift);rotate:-1.5deg;padding:8px 12px}
#game #vbtn{border:0;background:${P(C.pink)};color:${C.ink};font-family:var(--display);border-radius:49% 51% 47% 53%/52% 48% 52% 48%;box-shadow:var(--pp-lift),inset 0 0 0 5px rgba(255,255,255,.28)}
#game #stick{border:0;border-radius:50%}
#game #stick::before{content:'';position:absolute;inset:0;border-radius:50%;background:${KRAFT};-webkit-mask:radial-gradient(closest-side,transparent 70%,#000 72%);mask:radial-gradient(closest-side,transparent 70%,#000 72%)}
#game #stick i{background:${P(C.pink)};box-shadow:0 2px 0 rgba(60,38,16,.35),inset 0 0 0 3px rgba(255,255,255,.3)}
#game #stick::after{font-family:var(--pp-marker)!important;font-weight:400!important;color:${C.paper};text-shadow:0 1px 0 rgba(0,0,0,.4)}

/* ---- boss name card and health bar (crowds.js) ---- */
#game #bosscard{background:none;border:0;box-shadow:none;padding:16px 26px 12px;filter:var(--pp-sh2);isolation:isolate}
#game #bosscard::before{content:'';position:absolute;inset:0;z-index:-1;background:${P(C.mustard)};clip-path:var(--pp-tear3)}
#game #bosscard::after{content:'';position:absolute;left:50%;top:-8px;width:64px;height:18px;margin-left:-32px;background:${WASHI(C.washi)};clip-path:var(--pp-tape1);rotate:-3deg}
#game #bosscard b{color:${C.ink};text-shadow:none;margin:2px 0}
#game #bosscard b.pp-rn{display:flex;flex-wrap:wrap;justify-content:center;column-gap:.25em;row-gap:.06em}
#game #bosscard span.pp-w{display:inline-flex;font-size:inherit;font-weight:inherit}#game #bosscard span.pp-l{display:inline-block;font-size:var(--s,1em);font-weight:inherit}#game #bosscard span.pp-l.f2{font-weight:800}
#game #bossbar{background:none;border:0;padding:7px 12px 9px;filter:var(--pp-sh);isolation:isolate;rotate:-1deg}
#game #bossbar::before{content:'';position:absolute;inset:0;z-index:-1;background:${FLUTE},${KRAFT};clip-path:var(--pp-tear2)}
#game #bossbar .bn{color:${C.brown}}#game #bossbar .bn b{color:${C.ink}}#game #bossbar .bn span{font-family:var(--pp-marker);font-weight:400}
#game #bossbar .bb{height:13px;border:0;background:${P(C.paper)};clip-path:var(--pp-tear4)}
#game #bossbar .bb i{background:${C.red};transition:width .3s steps(3,end);${CRAY}}
#game #bossbar .bb::after{background:repeating-linear-gradient(90deg,transparent 0 calc(100%/var(--n) - 1.5px),rgba(43,34,51,.6) calc(100%/var(--n) - 1.5px) calc(100%/var(--n)))}
#game #bossbar small{font-family:var(--pp-marker);font-weight:400;color:${C.ink}}

/* ---- combo stamp, title slam, letterbox (juice.js) ---- */
#game #jz-combo{text-shadow:none}
#game #jz-combo b{text-shadow:none;color:${C.ink};filter:var(--pp-sh2)}
#game #jz-combo b.pp-rn{display:flex;justify-content:flex-end}
#game #jz-title b{color:${C.ink};text-shadow:none}
#game #jz-title b.pp-rn{display:flex;flex-wrap:wrap;justify-content:center;column-gap:.28em;row-gap:.05em;filter:var(--pp-sh2)}
#game #jz-title i:not(:empty){color:${C.ink};text-shadow:none;font-family:var(--pp-marker);padding:.3em 1.2em;background:${P(C.tape)};clip-path:var(--pp-tape2)}
#game #jz-skip{color:${C.ink};text-shadow:none;font:400 12px/1 var(--pp-marker);letter-spacing:.06em;padding:6px 12px 5px;background:${P(C.tape)};clip-path:var(--pp-tape3);rotate:-2deg}
#game .jz-bar{background:${KRAFT}}
#game #jz-bt{clip-path:var(--pp-tearB)}#game #jz-bb{clip-path:var(--pp-tearT)}

/* ---- story cutscenes: white paper subtitle strip, washi-tape speaker tag, polaroid phone call (story.js) ---- */
#game #st .bars:before,#game #st .bars:after{background:${KRAFT}}
#game #st .bars:before{clip-path:var(--pp-tearB)}#game #st .bars:after{clip-path:var(--pp-tearT)}
#game #st .cap{left:0;right:0;margin:0 auto;width:fit-content;max-width:min(860px,calc(100vw - 32px));box-sizing:border-box;transform:none;--r:-1deg;rotate:var(--r);
 font:400 clamp(16px,2.4vw,24px)/1.35 var(--pp-marker);color:${C.ink};text-shadow:none;padding:.75em 1.25em .6em;filter:var(--pp-sh2);isolation:isolate}
#game #st .cap:empty{display:none}
#game #st .cap::before{content:'';position:absolute;inset:0;z-index:-1;background:${P(C.paper)};clip-path:var(--pp-tear5)}
#game .cap b{position:absolute;left:16px;top:0;translate:0 -62%;rotate:-4deg;margin:0;padding:.34em 1em .28em;font:400 .78em/1 var(--display);letter-spacing:.06em;color:${C.ink};background:${WASHI(C.washi)};clip-path:var(--pp-tape2)}
#game #st .sk{color:${C.ink};opacity:1;font:400 12px/1 var(--pp-marker);letter-spacing:.06em;padding:6px 12px 5px;background:${P(C.tape)};clip-path:var(--pp-tape1);rotate:3deg}
/* Sal's call: a paper polaroid taped in the corner, a teal paper phone scrap, the line on a torn strip */
#game #stc{filter:var(--pp-sh2)}
#game #stc .fr{border:0;background:${P(C.paper)};padding:7px 7px 20px;box-shadow:none;clip-path:var(--pp-scrap3);rotate:2deg}
#game #stc .fr::after{content:'';position:absolute;left:50%;top:-4px;width:46px;height:15px;margin-left:-23px;background:${P(C.tape)};clip-path:var(--pp-tape2);rotate:-4deg}
#game #stc .pic{box-shadow:inset 0 0 0 1px rgba(43,34,51,.25);filter:sepia(.18) saturate(.9) contrast(.97)}
#game #stc .hd{background:${P(C.teal)};border-radius:0;clip-path:var(--pp-scrap1);width:30px;height:30px}
#game #stc .hd svg{fill:${C.ink};mix-blend-mode:multiply}
#game #stc .cap{font:400 clamp(13px,1.6vw,16px)/1.32 var(--pp-marker);color:${C.ink};text-shadow:none;background:${P(C.paper)};box-shadow:none;clip-path:var(--pp-tear4);padding:.7em 1em .6em;rotate:-1.2deg}
#game #stc .cap b{position:static;translate:none;display:inline-block;margin:0 .45em 0 0;padding:.28em .7em .22em;font:400 .74em/1 var(--display);rotate:-3deg;background:${WASHI(C.washi)};clip-path:var(--pp-tape1)}
#game #stc.live .cap{clip-path:var(--pp-tear5);padding:.8em 1.4em .7em;font-size:clamp(15px,2.2vw,21px)}
#game #stc .cap:empty{display:none}
/* goal tokens: empty slots are kraft card with a faint pencil silhouette; a hooked customer is a stamped colour scrap */
#game #stg{filter:var(--pp-sh)}
#game #stg .tk{background:${KRAFT};color:#6b4c2c;--tkp:${C.kraft};opacity:.8}
#game #stg .tk>svg{opacity:.5;mix-blend-mode:multiply}
#game #stg .tk.on{background:${P('var(--bg)')};--tkp:var(--bg);color:${C.ink};opacity:1}
#game #stg .tk.on>svg{opacity:.92}
#game #stg .tk.ctn{background:${FLUTE.replace('0 0/','0 100%/')},${KRAFT};opacity:1}
#game #stg .tk.ctn>svg{mix-blend-mode:normal;opacity:1;filter:drop-shadow(0 1px 0 rgba(43,34,51,.3))}
#game #stg svg.ctn .sh{fill:${C.red}}#game #stg svg.ctn .in{fill:${C.brown}}
#game #stg .tkb .cr{filter:drop-shadow(0 0 .5px rgba(255,249,236,.9)) drop-shadow(0 1px 0 rgba(60,38,16,.45))}
/* direction: a cut-paper arrow and a little paper chevron (textured scraps, not vector fills) */
#game #starw svg,#game #stchev svg{display:none}
#game #starw,#game #stchev{filter:var(--pp-sh2)}
#game #starw::before{content:'';position:absolute;inset:0;background:${P('var(--stc,'+C.pink+')')};clip-path:polygon(50% 3%,61% 15%,96.5% 45%,68% 45.5%,69% 96%,31.5% 95%,32.5% 44.5%,3.5% 45%,38% 14%)}
#game #starw::after{content:'';position:absolute;left:50%;bottom:6%;width:30px;height:11px;margin-left:-15px;background:${P(C.tape)};clip-path:var(--pp-tape3);rotate:-8deg}
#game #stchev::before{content:'';position:absolute;inset:0;background:${P(C.paper)};clip-path:polygon(4% 25%,24% 6%,50% 44%,76% 7%,96% 26%,51% 92%)}
/* chapter clear: a green paper disc with a cut-paper check, slammed on like a rubber stamp */
#game #stk{filter:var(--pp-sh2)}
#game #stk .disc{background:${P(C.green)}}
#game #stk svg{display:none}
#game #stk::after{content:'';position:absolute;inset:15%;background:${P(C.paper)};clip-path:polygon(6% 54%,22% 38.5%,40% 56.5%,79% 11%,95% 25.5%,41% 87%)}
#game #stk::before{content:'';position:absolute;right:4%;top:2%;width:38%;height:15%;background:${P(C.tape)};clip-path:var(--pp-tape1);rotate:34deg;z-index:1}
/* chapter title card: the number and the name in cut-out letters */
#game #stt{background:none}
#game #stt b,#game #stt i{text-shadow:none;color:${C.ink}}
#game #stt b.pp-rn,#game #stt i.pp-rn{display:flex;flex-wrap:wrap;justify-content:center;column-gap:.28em;row-gap:.05em;filter:var(--pp-sh2)}
#game #stt i.pp-rn{font-size:clamp(26px,5.4vw,54px)}
/* rhythm.js: the perfect line is a strip of black paper, the grade bursts get the cut-paper rim */
#game #rhLine{background:${P(C.ink)};box-shadow:none;filter:var(--pp-rim)}
#game #rhPop svg{filter:var(--pp-sh2)}

@media (prefers-reduced-motion:no-preference){
 .pp-l,#ppnum span,#game #panic .pp-tag,#game .pw,#game #intro .loc,#game #stats,#game #stch,#game .stch,#game .pp-tp{animation:ppb .4s steps(1,end) var(--d,0s) infinite}
 #game #lung,#game #st .cap,#game #bossbar{animation:ppB .4s steps(1,end) infinite}
 html .ov>button,#mob .mBtn,#mob #mPause .row button{animation:ppr .4s steps(1,end) var(--d,0s) infinite}
 #game #cross{animation:ppx .3s steps(1,end) infinite}
 #game .pw:nth-child(2n),#game #stats,#mob .mBtn:nth-of-type(2n),#mob #mPause .row button:nth-child(2n){--d:-.2s}
}
@media (prefers-reduced-motion:reduce){#game #gain.go{animation:ppfade 1.1s both}}
@media (max-width:520px){#ppnum{font-size:27px}#game #panic{width:min(200px,56vw)}#game .pw{font-size:20px;min-width:48px;padding:7px 9px 7px}}
`;D.head.appendChild(css);

/* ---------- cut-out letters ---------- */
let lastBg='';
function pickBg(pal){let c;do c=pal[Math.floor(Math.random()*pal.length)];while(c===lastBg&&pal.length>1);return lastBg=c}
function letter(ch,i,o){const s=D.createElement('span');s.className='pp-l';s.textContent=ch;
  const bg=(i===0&&o.first)||(o.num&&ch==='−'?C.red:pickBg(o.num?PASTEL:RANSOM)),dark=DARK.has(bg)||ch==='−';
  if(!o.num){const r=Math.random();if(r<.2)s.classList.add('f2');else if(r<.3)s.classList.add('f3')}
  const k=o.num?.5:1;
  s.style.cssText=`--bg:${bg};--fg:${dark?C.paper:C.ink};--r:${f1(R(-7,7)*k)}deg;--y:${f2(R(-.07,.07)*k)}em;--s:${f2(1+R(-.12,.12)*k)}em;--cp:${scrap(o.num?6:10)};--d:-${Math.floor(Math.random()*4)/10}s`;
  return s}
function ransom(el,o){o=o||{};const txt=el.textContent;if(!txt.trim())return;el.setAttribute('aria-label',txt.trim());
  const fr=D.createDocumentFragment();let w=null,i=0;
  for(const ch of txt){if(/\s/.test(ch)){w=null;continue}if(!w){w=D.createElement('span');w.className='pp-w';w.setAttribute('aria-hidden','true');fr.appendChild(w)}w.appendChild(letter(ch,i++,o))}
  el.textContent='';el.appendChild(fr);el.classList.add('pp-rn')}
const isRaw=el=>!el.querySelector('.pp-w')||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
/* run fn now and whenever someone else rewrites el; our own mutations are discarded with takeRecords() */
function live(el,fn,deep){if(!el||el.ppLive)return;el.ppLive=1;const mo=new MutationObserver(()=>{fn(el);mo.takeRecords()});mo.observe(el,{childList:true,characterData:true,subtree:!!deep});fn(el);mo.takeRecords()}
const liveRansom=(el,o)=>live(el,e=>{if(isRaw(e))ransom(e,o)},true);

/* ---------- vapes-left counter ---------- */
const numEl=$('num');let cells=[],sndT=0;
const pp=D.createElement('div');pp.id='ppnum';pp.setAttribute('aria-hidden','true');
function cell(){const el=D.createElement('span');el.style.cssText=`--bg:${pickBg(PASTEL)};--r:${f1(R(-3.5,3.5))}deg;--y:${f1(R(-1.5,1.5))}px;--cp:${scrap(5)};--d:-${Math.floor(Math.random()*4)/10}s`;return{el,ch:null,t:0}}
function flip(c,i){const t=performance.now();if(t-c.t<(i?150:300))return;c.t=t;   // the units scrap changes every frame while vaping: re-place it at most ~3x/s so it stays readable
  c.el.style.setProperty('--r',f1(R(-3.5,3.5))+'deg');c.el.style.setProperty('--cp',scrap(5));
  if(!RM.matches)c.el.animate([{transform:'perspective(140px) rotateX(55deg) translateY(-2px)',easing:'steps(1,end)'},{offset:.34,transform:'perspective(140px) rotateX(-18deg) translateY(-2px)',easing:'steps(1,end)'},
    {offset:.67,transform:'translateY(-1px) scale(1.04)',easing:'steps(1,end)'},{transform:'none'}],{duration:150,delay:Math.min(i,4)*30,fill:'backwards'});
  if(i>0&&t-sndT>160&&!X.muted){sndT=t;try{X.beep(R(1900,2500),.018,'triangle',.005)}catch(e){}}}
function setNum(s){for(let i=0;i<s.length;i++){const ch=s[s.length-1-i];let c=cells[i];   // indexed from the right so the units scrap stays the units scrap
    if(!c){c=cells[i]=cell();pp.prepend(c.el)}
    if(c.ch!==ch){const was=c.ch;c.ch=ch;c.el.textContent=ch;c.el.classList.toggle('c',ch===','||ch==='.'||ch===' '||ch===' '||ch===' ');if(was!==null)flip(c,i)}}
  while(cells.length>s.length)cells.pop().el.remove()}
if(numEl){numEl.after(pp);setNum(numEl.textContent);new MutationObserver(()=>setNum(numEl.textContent)).observe(numEl,{childList:true,characterData:true,subtree:true})}

/* ---------- HOOKED label → tape tag (re-applied if another mod rebuilds #panic) ---------- */
function tagPanic(p){if(p.querySelector(':scope>.pp-tag'))return;const raw=[...p.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());if(!raw.length)return;
  const tag=D.createElement('span');tag.className='pp-tag';p.insertBefore(tag,raw[0]);raw.forEach(n=>tag.appendChild(n));const hk=$('hookp');if(hk&&hk.parentNode===p)tag.appendChild(hk)}
live($('panic'),tagPanic);

/* ---------- overlays: torn frame + cut-out headings ---------- */
function frameOv(ov){if(ov.ppFramed)return;ov.ppFramed=1;const f=D.createElement('div');f.className='pp-frame';f.setAttribute('aria-hidden','true');
  f.innerHTML='<div class="f1"><i></i></div><div class="f2"><i></i></div><i class="pp-tp"></i><i class="pp-tp"></i><i class="pp-tp"></i><i class="pp-tp"></i>';ov.prepend(f);
  ov.querySelectorAll(':scope>h1').forEach(h=>liveRansom(h))}
function deco(n){if(!n||n.nodeType!==1)return;
  if(n.matches('.ov'))frameOv(n);n.querySelectorAll('.ov').forEach(frameOv);
  if(n.matches('[data-paper="ransom"]'))liveRansom(n);n.querySelectorAll('[data-paper="ransom"]').forEach(e=>liveRansom(e));
  const by=id=>n.id===id?n:n.querySelector('#'+id);let e;
  if(e=by('jz-combo'))live(e,e=>{const b=e.querySelector('b');if(b&&isRaw(b))ransom(b,{num:1,first:'var(--c,'+C.lime+')'})});
  if(e=by('bosscard'))live(e,e=>{const b=e.querySelector('b');if(b&&isRaw(b))ransom(b)});
  if((e=by('jz-title'))&&e.firstElementChild)liveRansom(e.firstElementChild)}
[X.game,$('mob')].forEach(deco);
liveRansom($('gain'),{num:1});
/* watch the containers other mods append to, so late arrivals (chapter cards, new overlays) get the treatment */
const mo=new MutationObserver(rs=>{for(const r of rs)r.addedNodes.forEach(deco)});
[X.game,$('hud'),$('count'),D.body].forEach(el=>el&&mo.observe(el,{childList:true}));

X.paper={ransom:liveRansom,scrap,tear,tape,colors:C};
})();
