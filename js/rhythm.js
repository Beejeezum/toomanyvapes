/* rhythm mod: DDR-style timing on every rip.
   Each time you grab someone, a thin "perfect line" is placed somewhere inside the green zone of the lung meter
   (a little different for each person and each grab). Letting go right on the line is PERFECT, close is GREAT,
   anywhere else in the green is GOOD, outside it is a MISS. No words: each grade has its own sound, its own
   paper burst at the crosshair, and its own bonus. Replaces the core's success/fail stings. */
(()=>{const X=window.TMV;if(!X||X.rhythm)return;const D=document;
const GREEN0=.7,GREEN1=1,BAR=1.25; // core: green while inh/cap is 0.7..1.0, bar is full at 1.25
const W_PERF=.03,W_GREAT=.075;

const css=D.createElement('style');css.textContent=`
#lung .bar{position:relative}
#rhLine{position:absolute;top:-5px;bottom:-5px;width:4px;margin-left:-2px;background:#15101d;box-shadow:0 0 0 2px #fff7ea;border-radius:1px;pointer-events:none;z-index:2}
#rhLine:before{content:'';position:absolute;left:50%;top:-7px;margin-left:-5px;border:5px solid transparent;border-top-color:#15101d}
#rhPop{position:absolute;left:50%;top:50%;pointer-events:none;z-index:9;transform:translate(-50%,-50%)}
#rhPop svg{display:block;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.35))}
@media (prefers-reduced-motion:reduce){#rhPop{display:none}}`;
D.head.appendChild(css);
const line=D.createElement('i');line.id='rhLine';
function attach(){const b=D.querySelector('#lung .bar');if(b&&line.parentNode!==b)b.appendChild(line)}
const pop=D.createElement('div');pop.id='rhPop';X.game.appendChild(pop);

let sweet=.85;
X.on('grab',n=>{sweet=GREEN0+.05+Math.random()*(GREEN1-GREEN0-.1);n._sweet=sweet;attach();line.style.left=(sweet/BAR*100)+'%'});

// sounds: soft, toy-like, rising with the grade (Web Audio through the game's own mixer)
const b=(f,d,t,v,at)=>X.beep&&X.beep(f,d,t,v,at);
const SND={
  perfect(){[1047,1319,1568,2093].forEach((f,i)=>b(f,.16,'triangle',.05,i*.055));b(2637,.35,'sine',.025,.24);b(3136,.3,'sine',.02,.3);b(65,.18,'sine',.09)},
  great(){b(880,.13,'triangle',.05);b(1319,.2,'triangle',.045,.07);b(1760,.18,'sine',.02,.12)},
  good(){b(784,.12,'triangle',.045);b(1047,.1,'sine',.02,.05)},
  miss(){X.slide&&X.slide(330,150,.32,'sine',.06);b(98,.25,'sine',.05,.05)}};

// paper burst at the crosshair: size, colour and point count say how well it landed
const COL={perfect:'#ffd23c',great:'#ff3fa4',good:'#5fd4ff',miss:'#b8a99a'};
function burst(g){const pts=g==='perfect'?12:g==='great'?9:g==='good'?7:5,R=g==='perfect'?62:g==='great'?46:g==='good'?32:24,r=R*.55;
  let p='';for(let i=0;i<pts*2;i++){const a=i/(pts*2)*Math.PI*2-Math.PI/2,rr=(i%2?r:R)*(0.9+Math.random()*.2);p+=(i?'L':'M')+(R+rr*Math.cos(a)).toFixed(1)+' '+(R+rr*Math.sin(a)).toFixed(1)}
  pop.innerHTML=`<svg width="${R*2}" height="${R*2}" viewBox="0 0 ${R*2} ${R*2}"><path d="${p}Z" fill="${COL[g]}" stroke="#15101d" stroke-width="3" stroke-linejoin="round"/>${g==='perfect'?`<circle cx="${R}" cy="${R}" r="${R*.22}" fill="#fff7ea" stroke="#15101d" stroke-width="3"/>`:''}</svg>`;
  const rot=(Math.random()*30-15)|0;
  try{pop.animate(g==='miss'?
    [{opacity:0,transform:`translate(-50%,-50%) scale(.6) rotate(${rot}deg)`},{opacity:.8,transform:`translate(-50%,-30%) scale(.8) rotate(${rot}deg)`,offset:.3},{opacity:0,transform:`translate(-50%,40%) scale(.7) rotate(${rot+20}deg)`}]:
    [{opacity:0,transform:`translate(-50%,-50%) scale(.2) rotate(${rot-40}deg)`},{opacity:1,transform:`translate(-50%,-50%) scale(1.15) rotate(${rot}deg)`,offset:.25},{opacity:1,transform:`translate(-50%,-50%) scale(1) rotate(${rot}deg)`,offset:.6},{opacity:0,transform:`translate(-50%,-90%) scale(.9) rotate(${rot+8}deg)`}],
    {duration:g==='perfect'?900:700,easing:'steps(9,end)'})}catch(e){}}

function grade(n,kind){if(kind==='passive')return null;const f=n.inh/((n.t&&n.t.cap)||1);
  if(kind==='over'||f>GREEN1+.02||f<GREEN0)return'miss';const s=n._sweet||sweet,d=Math.abs(f-s);
  return d<=W_PERF?'perfect':d<=W_GREAT?'great':'good'}
X.on('release',(n,kind)=>{const g=grade(n,kind);if(!g)return;X.lastGrade=g;
  SND[g]();burst(g);
  if(g==='perfect'){X.combo=(X.combo||0)+2;try{const p=X.mouth&&X.mouth(n,new X.T.Vector3());if(p)for(let i=0;i<6;i++)X.emo('✨',p.x,p.y+.2,p.z,(Math.random()-.5)*3,1.5+Math.random()*2,(Math.random()-.5)*3,.3)}catch(e){}if('slow' in X)X.slow=Math.max(X.slow,.18)}
  else if(g==='great'){X.combo=(X.combo||0)+1}
  X.emit&&X.emit('rhythm',g,n)});
X.rhythm={get sweet(){return sweet},W_PERF,W_GREAT};
})();
