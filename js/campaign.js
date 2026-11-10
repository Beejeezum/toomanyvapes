/* campaign mod: Honest Gary fronted you the container. Five days, a quota before sunset, a panic meter that can get you
   shut down, optional challenges with crate rewards, a grade per day, a rank at the end and unlockable drip.
   Built only on window.TMV (see MOD API in index.html). Progress lives in localStorage under 'tmv_campaign'. */
(()=>{
const X=window.TMV;if(!X)return;
const $=X.$,clamp=X.clamp,lerp=X.lerp,pick=X.pick,KEY='tmv_campaign',DANGER=5;
const fmt=n=>Math.max(0,Math.round(n)).toLocaleString(),mmss=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const has=p=>{const d=Object.getOwnPropertyDescriptor(X,p);return !!(d&&d.set)};

/* ---------- save ---------- */
const newRun=()=>({pts:{},grades:{},rtry:{},moved:0,lungs:0,perfects:0,matches:0,busts:0,hooks:0,retries:0,time:0,best:1,stars:0});
let S={v:1,day:1,snap:null,best:{},run:null,unlocks:{},equip:{vape:'flavor',jacket:'purple'},seen:0,done:0,rank:null};
try{const o=JSON.parse(localStorage.getItem(KEY));if(o&&o.v===1)S=Object.assign(S,o)}catch(e){}
if(!S.run)S.run=newRun();if(!S.equip)S.equip={vape:'flavor',jacket:'purple'};if(!S.unlocks)S.unlocks={};if(!S.best)S.best={};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};

/* ---------- challenges: each reacts to game events and counts up p toward goal ---------- */
const CH={
  type:(ty,n,icon,text)=>({icon,text,goal:n,seen:new Set(),release(c,m){if(m.type===ty&&!c.seen.has(m)){c.seen.add(m);c.p++}}}),
  perfect:n=>({icon:'💯',text:`Land ${n} PERFECT RIPs`,goal:n,release(c,m,k){if(k==='perfect')c.p++}}),
  match:n=>({icon:'😍',text:`Match ${n} cravings`,goal:n,release(c,m,k,ok){if(ok)c.p++}}),
  hook:n=>({icon:'🪝',text:`Hook ${n} new regulars`,goal:n,release(c,m){if(!m.hooked&&m.times>=m.t.hook)c.p++}}),
  combo:x=>({icon:'🔗',text:`Hit a x${x} combo without power-ups`,goal:1,frame(c){if(1+X.combo*.25>=x)c.p=1}}),
  noBust:()=>({icon:'🚓',text:"Don't get busted",goal:1,avoid:1,bust(c){c.fail=1}}),
  boost:(ty,icon,text)=>({icon,text,goal:1,release(c,m){if(m.type===ty&&X.act.boost>0)c.p=1}}),
  fog:n=>({icon:'🌪️',text:`Fog ${n} creatures with one Fog Machine`,goal:n,cur:0,pickup(c,k){if(k==='fog')c.cur=0},release(c,m,k){if(k==='passive'&&X.act.fog>0){c.cur++;c.p=Math.max(c.p,c.cur)}}}),
  crates:n=>({icon:'📦',text:`Grab ${n} power-up crates`,goal:n,pickup(c){c.p++}}),
  flavors:n=>({icon:'🌈',text:`Serve ${n} different flavors`,goal:n,seen:new Set(),release(c,m,k){if(k!=='passive'&&!c.seen.has(X.fi)){c.seen.add(X.fi);c.p++}}})
};
const PWE={boost:'🔥',dual:'✌️',free:'🧲',fog:'🌪️',chain:'☁️',rush:'⚡'};

/* ---------- the five days ---------- */
const P2=Math.PI/2;
const DAYS=[
 {n:'Downtown',x:0,z:6,yaw:0,quota:300,len:150,heat:0,
  gary:"Kid. I fronted you a whole container on credit. Move 300 by sunset and we stay friends.",
  ch:()=>[CH.perfect(3),CH.match(3),CH.type('grandma',2,'👵','Vape 2 different grandmas')],rw:['boost','dual','free'],crates:[['boost',-3,1],['free',8,12]]},
 {n:'Public Park (No Vaping)',x:-72,z:4,yaw:P2,quota:550,len:150,heat:.008,
  gary:"The park. Dogs, a tuba guy, a pond. Nobody reads the sign. 550 today.",
  ch:()=>[CH.type('dog',3,'🐕','Vape 3 different dogs'),CH.type('tuba',1,'🎺','Make the tuba player solo'),CH.noBust()],rw:['chain','boost',null],crates:[['fog',-82,-6],['chain',-95,22],['boost',-76,12]]},
 {n:'Muscle Beach (No Beach)',x:0,z:-68,yaw:0,quota:850,len:180,heat:.012,
  gary:"Gym bros already love you. Lean on that. 850, and lay off the cops.",
  ch:()=>[CH.type('gym',4,'💪','Spot 4 different gym bros'),CH.combo(3),CH.crates(3)],rw:['dual','rush','boost'],crates:[['rush',0,-80],['dual',-6,-76],['boost',7,-78]]},
 {n:'Old McVapey Farm',x:72,z:0,yaw:-P2,quota:1200,len:180,heat:.016,
  gary:"Cows have big lungs. Do the math. 1,200, and I want to smell it from here.",
  ch:()=>[CH.boost('cow','🐄','Vape a cow during BOOST'),CH.type('chicken',4,'🐔','Vape 4 different chickens'),CH.fog(5)],rw:['fog','chain','dual'],crates:[['boost',80,-4],['fog',86,8],['dual',92,-16]]},
 {n:'The Whole Town',x:0,z:6,yaw:0,quota:0,len:300,heat:.02,
  gary:"Last day. Empty. The. Container. Every last one, then we're square.",
  ch:()=>[CH.hook(8),CH.type('cop',1,'👮','Vape a cop (bold)'),CH.flavors(6)],rw:['free','boost','dual'],crates:[]}
];

/* ---------- drip: jacket recolors the shared sleeve material, vape finish is painted every frame ---------- */
const JACKETS={purple:[0x6a3fb5,'Track Purple',''],hivis:[0xff7a1a,'Hi-Vis','Clear Day 1'],denim:[0x3f6aa8,'Denim','Clear Day 3'],tux:[0x26222e,'Tuxedo','Finish the campaign'],pink:[0xff3fa4,'Crisis Pink','Rank: Public Health Crisis']};
const VAPES={flavor:['#ffb02e','Flavor',''],gold:['#ffc23a','Solid Gold','Finish all 3 challenges in a day'],holo:['conic-gradient(#ff3fa4,#5fd4ff,#b6ff3c,#ffd23c,#ff3fa4)','Holographic','Get an S on any day']};
const jacketMat=X.toon(0x6a3fb5);
const owned=(k,def)=>def||!!S.unlocks[k];
function applyDrip(){if(!JACKETS[S.equip.jacket]||!owned(S.equip.jacket,S.equip.jacket==='purple'))S.equip.jacket='purple';jacketMat.color.setHex(JACKETS[S.equip.jacket][0]);
  if(!VAPES[S.equip.vape]||S.equip.vape==='flavor'||!owned(S.equip.vape)){S.equip.vape='flavor';X.vapeMat.color.setHex(X.flav[1])}}
applyDrip();

/* ---------- style ---------- */
const st=document.createElement('style');st.textContent=`
#cmstrip{margin-top:5px}
#cmday{display:flex;justify-content:space-between;gap:10px;font-weight:800;font-size:10px;letter-spacing:.12em;font-variant-numeric:tabular-nums;white-space:nowrap}
#cmdl{color:var(--sky)}#cmstrip.late #cmt{color:var(--hot);animation:cmpulse .8s infinite}
#cmqb{height:5px;margin-top:3px}#cmqb i{background:var(--lime);width:0;transition:width .2s}
#count.cm-danger{animation:cmflash .5s steps(2) infinite}
#cmch{background:var(--panel);padding:6px 8px;border-right:4px solid var(--lime);display:flex;flex-direction:column;gap:3px;max-width:230px;font-size:11px;font-weight:800}
#cmch h6{margin:0;font-size:9px;letter-spacing:.16em;color:var(--sky);text-align:right}
.cmc{display:flex;align-items:center;gap:6px;justify-content:flex-end;text-align:right}
.cmc .pg{font-variant-numeric:tabular-nums;min-width:26px;color:var(--lime)}
.cmc.done{color:var(--lime)}.cmc.fail{opacity:.45;text-decoration:line-through}.cmc.pop{animation:cmpop .7s}
#cmpop{left:50%;top:33%;transform:translateX(-50%);background:var(--lime);color:var(--ink);font-weight:800;font-size:14px;padding:6px 14px;max-width:88%;width:max-content;text-align:center;box-shadow:4px 4px 0 var(--hot);opacity:0;transition:opacity .25s}
#cmpop.on{opacity:1}
@keyframes cmpulse{50%{opacity:.35}}
@keyframes cmflash{50%{border-color:#ff2a2a;background:rgba(140,0,20,.8)}}
@keyframes cmpop{0%{transform:scale(1.35)}100%{transform:scale(1)}}
@media (max-width:520px){#cmch h6,.cmc .tx{display:none}#cmch{padding:4px 6px;gap:2px}#cmpop{font-size:12px}}
.cmov{justify-content:flex-start;overflow-y:auto;touch-action:pan-y;gap:0;background:rgba(20,15,28,.86)}
.cm-in{margin:auto 0;width:min(460px,100%);display:flex;flex-direction:column;align-items:center;gap:10px}
.cmov h1{font-size:clamp(40px,10vw,80px)}
.cm-tag{font-weight:800;font-size:11px;letter-spacing:.2em;color:var(--sky)}
.cm-k{font-family:var(--display);color:var(--lime);font-size:clamp(17px,4.4vw,26px);line-height:1.1}
.cm-sms{background:var(--paper);color:var(--ink);border-radius:16px 16px 16px 3px;padding:9px 14px;font-weight:600;font-size:15px;text-align:left;max-width:36ch}
.cm-sms b{display:block;font-size:10px;letter-spacing:.16em;color:#8a6a90}
.cm-goal{font-weight:800;font-size:16px}.cm-goal em{color:var(--lime);font-style:normal}
.cm-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;width:100%}
.cm-list li{background:var(--panel);border-left:5px solid var(--sky);padding:6px 10px;text-align:left;font-weight:600;font-size:14px;display:flex;gap:8px;align-items:center}
.cm-list li .rw{margin-left:auto;font-size:11px;font-weight:800;opacity:.85;white-space:nowrap}
.cm-list li.ok{border-color:var(--lime)}.cm-list li.no{border-color:#555;opacity:.55}
.ov p.cm-warn{font-size:12px;opacity:.8;max-width:42ch;font-weight:400}
.cm-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}
.cm-row b{font-size:10px;letter-spacing:.16em;color:var(--sky);width:100%}
.ov button.cm-sec{font-family:var(--body);font-weight:800;font-size:14px;padding:8px 14px;background:transparent;color:var(--paper);border:2px solid var(--paper);box-shadow:none;margin-top:0}
.ov button.cm-chip{font-family:var(--body);font-weight:800;font-size:12px;padding:5px 9px;background:var(--panel);color:var(--paper);border:2px solid rgba(255,255,255,.22);box-shadow:none;margin:0;display:inline-flex;gap:6px;align-items:center}
.ov button.cm-chip.on{border-color:var(--lime);color:var(--lime)}.ov button.cm-chip.lock{opacity:.45}
.cm-chip i{width:12px;height:12px;border-radius:50%;display:inline-block;background:var(--sw);border:1px solid var(--paper)}
.cm-wn{font-size:12px;min-height:1em;opacity:.8;font-weight:600}
.cm-grade{font-family:var(--display);font-size:clamp(64px,18vw,110px);line-height:1;color:var(--ink);background:var(--lime);width:1.45em;height:1.45em;border-radius:50%;display:grid;place-items:center;rotate:-8deg;box-shadow:6px 6px 0 var(--hot);flex:none}
.cm-grade.S{background:var(--hot);color:var(--paper);box-shadow:6px 6px 0 var(--lime)}.cm-grade.F{background:#4a4452;color:var(--paper);box-shadow:6px 6px 0 #e0244a}
.cm-new{background:var(--hot);color:var(--paper);font-weight:800;font-size:13px;padding:5px 12px;letter-spacing:.06em}
.cm-res{background:linear-gradient(160deg,#33244a,#140f1c 70%);border:3px solid var(--hot);box-shadow:8px 8px 0 var(--lime);padding:16px 16px 14px;width:min(420px,100%);box-sizing:border-box;rotate:-1deg;text-align:center}
.cm-res small{letter-spacing:.2em;font-weight:800;font-size:11px;color:var(--sky)}
.cm-rank{font-family:var(--display);font-size:clamp(24px,7vw,38px);color:var(--lime);line-height:1.05;margin:6px 0 4px}
.ov .cm-res p{font-size:14px;margin:0 auto;opacity:.85}
.cm-days{display:flex;justify-content:center;gap:6px;margin:12px 0}
.cm-days span{font-family:var(--display);width:46px;padding:3px 0 4px;background:var(--panel);border:2px solid var(--paper);font-size:22px;line-height:1.1}
.cm-days span small{display:block;font-family:var(--body);font-size:9px;letter-spacing:.1em;color:var(--paper)}
.cm-days span.S{border-color:var(--hot);color:var(--hot)}.cm-days span.A{color:var(--lime)}
.cm-stats{display:grid;grid-template-columns:1fr auto;gap:3px 14px;font-size:13px;font-weight:600;text-align:left}
.cm-stats b{color:var(--lime);font-variant-numeric:tabular-nums;text-align:right}
.cm-res .url{margin-top:10px;font-family:var(--display);font-size:11px;letter-spacing:.1em;color:var(--hot)}
.cm-introbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
`;document.head.appendChild(st);

/* ---------- HUD: day strip inside the VAPES LEFT box, challenge list under the radar ---------- */
const mk=(tag,id,cls,html)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const strip=mk('div','cmstrip','','<div id="cmday"><span id="cmdl"></span><span id="cmq"></span><span id="cmt"></span></div><div class="bar" id="cmqb"><i></i></div>');
$('count').appendChild(strip);
const chp=mk('div','cmch');$('right').appendChild(chp);
const pop=mk('div','cmpop','hud');$('hud').appendChild(pop);
const ov=mk('div','cmov','ov cmov');ov.hidden=true;$('game').appendChild(ov);
const cmdl=$('cmdl'),cmq=$('cmq'),cmt=$('cmt'),cmqb=$('cmqb').firstChild;
const panel=on=>{strip.hidden=!on;chp.hidden=!on;if(!on)$('count').classList.remove('cm-danger')};panel(false);
let popT=0;function banner(s,d){pop.textContent=s;pop.classList.add('on');popT=d||2.4}

/* ---------- state ---------- */
let cmode=null,intent='campaign',D=null,pend=null,hudT=0,chHTML='',twistMesh=0,tint=0;
const snap=d=>({day:d,count:X.count,stock:X.STOCK.slice(),used:X.used,twist:has('twist')?!!X.twist:false});
function restore(s){X.count=s.count;for(let i=0;i<X.STOCK.length;i++)X.STOCK[i]=s.stock[i]||0;if(has('used'))X.used=s.used;
  if(has('twist')){if(s.twist&&!X.twist&&!twistMesh){X.container(9,-6,0x2a7ad2,0x1a4a8a);twistMesh=1}X.twist=!!s.twist}X.setFlav(X.fi,1)}
function clearAct(){for(const k in X.act)X.act[k]=0}
function seedCrates(def){const P=X.picks;while(P.length)X.scene.remove(P.pop().g);for(const[k,x,z]of def.crates)X.spawnPick(k,x,z);while(P.length<4)X.spawnPick()}
function sting(good){if(good){if(!X.clip('sfx/pickup',{vol:.45}))[660,880,1320].forEach((f,i)=>X.beep(f,.14,'triangle',.05,i*.07))}else if(!X.clip('sfx/fail_sting',{vol:.5}))X.slide(330,110,.6,'sawtooth',.07)}
function card(html,wire){X.mode='card';X.heat=0;X.combo=0;clearAct();X.keys.Space=0;try{if(document.exitPointerLock)document.exitPointerLock()}catch(e){}
  $('lung').hidden=true;$('prompt').hidden=true;panel(false);pop.classList.remove('on');popT=0;ov.innerHTML='<div class="cm-in">'+html+'</div>';ov.hidden=false;ov.scrollTop=0;
  ov.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();wire[b.dataset.a]&&wire[b.dataset.a](b)}));
  const f=ov.querySelector('button[data-a="go"]');if(f&&!X.touch)setTimeout(()=>{try{f.focus({preventScroll:true})}catch(e){}},50)}
function toFree(){cmode='free';intent='free';D=null;ov.hidden=true;panel(false);X.mode='play';X.stun=0;S.seen=1;save()}

/* ---------- wardrobe chips (day cards + results) ---------- */
function wardrobe(){let h='<div class="cm-row"><b>JACKET</b>';for(const k in JACKETS){const[c,n]=JACKETS[k],o=owned(k,k==='purple');h+=`<button class="cm-chip${S.equip.jacket===k?' on':''}${o?'':' lock'}" data-a="j_${k}" style="--sw:#${c.toString(16).padStart(6,'0')}"><i></i>${o?'':'🔒 '}${n}</button>`}
  h+='</div><div class="cm-row"><b>VAPE</b>';for(const k in VAPES){const[c,n]=VAPES[k],o=owned(k,k==='flavor');h+=`<button class="cm-chip${S.equip.vape===k?' on':''}${o?'':' lock'}" data-a="v_${k}" style="--sw:${c}"><i></i>${o?'':'🔒 '}${n}</button>`}
  return h+'</div><div class="cm-wn" id="cmwn"></div>'}
function wireWardrobe(w){for(const k in JACKETS)w['j_'+k]=()=>{if(!owned(k,k==='purple')){$('cmwn').textContent='🔒 '+JACKETS[k][1]+': '+JACKETS[k][2];return}S.equip.jacket=k;applyDrip();save();refreshChips()};
  for(const k in VAPES)w['v_'+k]=()=>{if(!owned(k,k==='flavor')){$('cmwn').textContent='🔒 '+VAPES[k][1]+': '+VAPES[k][2];return}S.equip.vape=k;applyDrip();save();refreshChips()};return w}
function refreshChips(){ov.querySelectorAll('.cm-chip').forEach(b=>{const[t,k]=b.dataset.a.split('_');b.classList.toggle('on',(t==='j'?S.equip.jacket:S.equip.vape)===k)})}

/* ---------- day intro card ---------- */
function showDay(d){const def=DAYS[d-1];
  if(S.snap&&S.snap.day===d)restore(S.snap);else S.snap=snap(d);S.day=d;save();D=null;
  const tries=S.run.rtry[d]||0,extra=Math.min(60,tries*20),len=def.len+extra;
  const goal=d<5?`Move <em>${fmt(def.quota)} vapes</em> before sunset <em>☀️ ${mmss(len)}</em>`:`Empty the container: <em>${fmt(X.count)} left</em> before sunset <em>☀️ ${mmss(len)}</em>`;
  const li=def.ch().map((c,i)=>`<li><span>${c.icon}</span><span>${c.text}</span><span class="rw">${def.rw[i]?'+'+PWE[def.rw[i]]+' crate':'+grade'}</span></li>`).join('');
  card(`<span class="cm-tag">DAY ${d} OF 5${S.best[d]?' · BEST '+S.best[d]:''}</span><h1>Day ${d}</h1><div class="cm-k">📍 ${def.n}</div>
   <div class="cm-sms"><b>HONEST GARY</b>${def.gary}${tries?`<br><i>(Again?? Fine. +${extra}s. Don't make it weird.)</i>`:''}</div>
   <div class="cm-goal">${goal}</div><ul class="cm-list">${li}</ul>
   <p class="cm-warn">Challenges are optional and drop a power-up crate at your feet. If TOWN PANIC maxes out, the Health Department shuts you down for the day. Stop vaping for a few seconds to let it cool.</p>
   ${wardrobe()}<button data-a="go">Start Day ${d}</button><div class="cm-row"><button class="cm-sec" data-a="free">Free play</button></div>`,
   wireWardrobe({go:()=>beginDay(d),free:toFree}))}

function beginDay(d){const def=DAYS[d-1],extra=Math.min(60,(S.run.rtry[d]||0)*20),len=def.len+extra;
  ov.hidden=true;X.mode='play';X.stun=0;X.px=def.x;X.pz=def.z;X.yaw=def.yaw;X.pitch=-.05;X.heat=0;X.combo=0;clearAct();seedCrates(def);if(X.playIntro)X.playIntro();
  D={d,def,len,t:len,el:0,moved:0,quotaAt:null,perfects:0,matches:0,busts:0,hooks:0,lungs0:X.lungs,danger:0,idle:0,last:X.count,over:0,
    ch:def.ch().map((c,i)=>Object.assign({p:0,done:0,fail:0,rw:def.rw[i]},c))};
  chHTML='';panel(true);hud();X.toast('DAY '+d+': '+def.n.toUpperCase(),2.6);S.seen=1;save()}

/* ---------- live tracking ---------- */
function check(){if(!D)return;for(const c of D.ch){if(c.done||c.fail||c.avoid||c.p<c.goal)continue;c.done=1;c.popT=1;
  banner('✓ '+c.text.toUpperCase()+(c.rw?'  +'+PWE[c.rw]+' CRATE':''));sting(1);
  if(c.rw){const P=X.picks;if(P.length>=7)X.scene.remove(P.shift().g);X.spawnPick(c.rw,X.px-Math.sin(X.yaw)*3,X.pz-Math.cos(X.yaw)*3)}}}
const live=()=>cmode==='campaign'&&D&&!D.over;
X.on('vape',()=>{if(live())D.moved++});
X.on('release',(n,kind,match)=>{if(!live())return;if(kind==='perfect')D.perfects++;if(match)D.matches++;if(!n.hooked&&n.times>=n.t.hook)D.hooks++;
  X.heat=Math.min(1,X.heat+D.def.heat);for(const c of D.ch)if(c.release&&!c.done&&!c.fail)c.release(c,n,kind,match);check()});
X.on('bust',()=>{if(!live())return;D.busts++;X.heat=Math.min(1,X.heat+.12);for(const c of D.ch)if(c.bust&&!c.done)c.bust(c);hud()});
X.on('pickup',k=>{if(!live())return;for(const c of D.ch)if(c.pickup&&!c.done&&!c.fail)c.pickup(c,k);check()});

function hud(){if(!D)return;const q=D.d<5?D.def.quota:D.moved+X.count;
  cmdl.textContent='DAY '+D.d;cmq.textContent=fmt(D.moved)+' / '+fmt(q);cmqb.style.width=clamp(D.moved/Math.max(1,q),0,1)*100+'%';
  cmt.textContent=D.danger>0?'🚨 '+Math.max(0,DANGER-D.danger).toFixed(1):(D.quotaAt!=null&&D.d<5?'🌇 ':'☀️ ')+mmss(D.t);
  strip.classList.toggle('late',D.t<30||D.danger>0);$('count').classList.toggle('cm-danger',D.danger>0);
  let h='<h6>BONUS</h6>';for(const c of D.ch){const s=c.done?'done':c.fail?'fail':'',pg=c.done?'✓':c.fail?'✗':c.avoid?'OK':Math.min(c.p,c.goal)+'/'+c.goal;
    h+=`<div class="cmc ${s}${c.popT>0?' pop':''}"><span class="tx">${c.text}</span><span>${c.icon}</span><span class="pg">${pg}</span></div>`}
  if(h!==chHTML){chHTML=h;chp.innerHTML=h}}

X.on('frame',dt=>{
  if(popT>0){popT-=dt;if(popT<=0)pop.classList.remove('on')}
  if(pend){const f=pend;pend=null;f();return}
  if(cmode!=='campaign'||!D)return;
  if(D.over){D.cardIn-=dt;X.stun=Math.max(X.stun,.5);if(D.cardIn<=0)pend=showEnd;return}
  D.el+=dt;D.t-=dt;for(const c of D.ch)if(c.popT>0)c.popT-=dt;
  if(X.count>D.last+100){D.t+=120;D.len+=120;banner('GARY: "oh yeah, there was a second container. sunset is pushed 2 min. you\'re welcome."',5)}D.last=X.count;
  // panic: lay low to cool it off; stay maxed out and the Health Department arrives
  D.idle=X.held||X.holding?0:D.idle+dt;if(D.idle>2.5)X.heat=Math.max(0,X.heat-dt*.03);
  if(X.heat>=.9){if(D.danger<=0){X.toast('PANIC CRITICAL: LAY LOW!',2.2);X.clip('sfx/siren_far',{vol:.5})}D.danger+=dt}else D.danger=Math.max(0,D.danger-dt*.6);
  if(D.danger>=DANGER)return end('swat');
  for(const c of D.ch)if(c.frame&&!c.done)c.frame(c,dt);check();
  if(D.d<5&&D.quotaAt==null&&D.moved>=D.def.quota){D.quotaAt=D.t;if(D.t>30)D.t=30;X.toast('QUOTA MET!',2);banner('BONUS ROUND: keep going til sunset for a better grade',3);sting(1)}
  if(D.t<=0){D.t=0;return end(D.d<5&&D.quotaAt!=null?'clear':'gary')}
  hudT-=dt;if(hudT<0){hudT=.12;hud()}});

function end(kind){D.over=1;D.kind=kind;D.cardIn=1.4;hud();
  if(X.held)X.release(X.held,'ok');X.stun=2;X.keys.Space=0;clearAct();try{if(document.exitPointerLock)document.exitPointerLock()}catch(e){}
  X.toast(kind==='clear'?'SUNSET. DAY DONE.':kind==='swat'?'🚨 SHUT DOWN 🚨':'⏰ SUNSET. GARY IS HERE.',2.4);
  if(kind==='clear'){if(!X.clip('sfx/fanfare',{vol:.55}))sting(1)}else if(kind==='swat'){X.clip('sfx/siren_far',{vol:.8});if(!X.clip('sfx/whistle',{vol:.5}))sting(0)}else sting(0)}

/* the last day ends the moment the container is empty: the game fires win() */
X.on('win',()=>{if(!live())return;D.over=1;D.kind='clear';if(D.quotaAt==null)D.quotaAt=D.t;setTimeout(()=>{$('win').hidden=true;showEnd()},0)});

/* ---------- grading ---------- */
const GR=p=>p>=95?'S':p>=80?'A':p>=65?'B':'C',GV={S:4,A:3,B:2,C:1,F:0};
const better=(a,b)=>!a||GV[b]>GV[a]?b:a;
const RANKS=[[0,'Mild Nuisance','A few people noticed. Mostly the pigeons.'],[62,'Neighborhood Menace','The HOA has a group chat about you.'],[72,'Local Legend (Derogatory)','There is a mural. It is not flattering.'],
  [82,'Regional Fog Event','Visible from the next county. The weather channel is confused.'],[92,'Public Health Crisis','The CDC has a whiteboard with your face on it.']];
const GARY={S:'Gary is crying. Happy tears. Probably.',A:"Gary nods slowly. Most emotion he's shown since 2009.",B:'Gary says "fine." He means it.',C:"Gary sighs. Money's money."};

function showEnd(){const d=D.d,def=D.def,R=S.run,cleared=D.kind==='clear';
  for(const c of D.ch)if(c.avoid&&!c.fail&&cleared)c.done=1;
  const nd=D.ch.filter(c=>c.done).length,newU=[],un=k=>{if(!S.unlocks[k]){S.unlocks[k]=1;newU.push((JACKETS[k]||VAPES[k])[1])}};
  const runBefore=JSON.parse(JSON.stringify(R)),snapBefore=S.snap;R.time+=D.el;
  const lis=D.ch.map(c=>`<li class="${c.done?'ok':'no'}"><span>${c.done?'✓':'✗'}</span><span>${c.icon} ${c.text}</span><span class="rw">${c.avoid?'':Math.min(c.p,c.goal)+'/'+c.goal}</span></li>`).join('');
  if(!cleared){R.rtry[d]=(R.rtry[d]||0)+1;R.retries++;save();
    const swat=D.kind==='swat',q=d<5?def.quota:D.moved+X.count;
    const txt=swat?pick(['Town panic hit the ceiling. The Health Department, two SWAT vans and one very disappointed mayor impounded the container until tomorrow. Tomorrow is today again.','A man in a hazmat suit wrote you a ticket for "all of this." The container is sealed with caution tape until you try again.'])
      :pick([`You moved ${fmt(D.moved)} of ${fmt(q)}. Honest Gary repossessed your bike, your sunglasses and, emotionally, your dog. He'll give you one more day. Probably.`,`${fmt(D.moved)} of ${fmt(q)}. Gary is sitting on your car. Not in it. On it. He says try again.`]);
    card(`<span class="cm-tag">DAY ${d} · ${def.n.toUpperCase()}</span><h1>${swat?'Shut Down':"Gary's Here"}</h1><div class="cm-grade F">F</div>
      <div class="cm-sms"><b>${swat?'HEALTH DEPARTMENT':'HONEST GARY'}</b>${txt}</div><ul class="cm-list">${lis}</ul>
      <button data-a="go">Try Day ${d} again (+${Math.min(60,R.rtry[d]*20)}s)</button><div class="cm-row"><button class="cm-sec" data-a="free">Free play</button></div>`,
      {go:()=>showDay(d),free:toFree});return}
  const p=Math.round(50+nd*10+Math.min(20,(D.quotaAt||0)/D.len*50)-Math.min(10,D.busts*5)),g=GR(p);
  R.pts[d]=p;R.grades[d]=g;R.moved+=D.moved;R.lungs+=X.lungs-D.lungs0;R.perfects+=D.perfects;R.matches+=D.matches;R.busts+=D.busts;R.hooks+=D.hooks;R.stars+=nd;R.best=Math.max(R.best,X.best);
  S.best[d]=better(S.best[d],g);if(nd===3)un('gold');if(g==='S')un('holo');if(d===1)un('hivis');if(d===3)un('denim');
  if(d>=5||X.mode==='won'){finale(newU);return}
  S.day=d+1;S.snap=null;save();
  card(`<span class="cm-tag">DAY ${d} OF 5 · ${def.n.toUpperCase()}</span><h1>Day ${d} Done</h1><div class="cm-grade ${g}">${g}</div>
    <div class="cm-goal"><em>${fmt(D.moved)}</em> / ${fmt(def.quota)} moved · quota hit with <em>${mmss(D.quotaAt)}</em> left</div>
    <div class="cm-goal" style="font-size:13px;font-weight:600">💯 ${D.perfects} perfect · 😍 ${D.matches} matched · 🚓 ${D.busts} busted</div>
    <ul class="cm-list">${lis}</ul>${newU.map(n=>`<div class="cm-new">UNLOCKED: ${n}</div>`).join('')}
    <div class="cm-sms"><b>HONEST GARY</b>${GARY[g]}</div>
    <button data-a="go">Day ${d+1} ▶</button><div class="cm-row"><button class="cm-sec" data-a="re">Replay Day ${d}</button><button class="cm-sec" data-a="free">Free play</button></div>`,
    {go:()=>showDay(d+1),re:()=>{S.run=runBefore;S.day=d;S.snap=snapBefore;save();showDay(d)},free:toFree})}

function rankOf(){const R=S.run,ks=Object.keys(R.pts),avg=ks.length?ks.reduce((a,k)=>a+R.pts[k],0)/ks.length:0,sc=avg-3*R.retries;let r=RANKS[0];for(const x of RANKS)if(sc>=x[0])r=x;return[r,Math.round(sc)]}
function finale(newU){const R=S.run,[rk,sc]=rankOf(),un=k=>{if(!S.unlocks[k]){S.unlocks[k]=1;newU.push((JACKETS[k]||VAPES[k])[1])}},ri=n=>RANKS.findIndex(x=>x[1]===n);
  un('tux');if(rk===RANKS[4])un('pink');S.done=1;S.day=1;S.snap=null;if(ri(rk[1])>ri(S.rank))S.rank=rk[1];save();D=null;
  const days=[1,2,3,4,5].map(i=>`<span class="${R.grades[i]||''}">${R.grades[i]||'–'}<small>DAY ${i}</small></span>`).join('');
  const share=`TOO MANY VAPES 💨\nRank: ${rk[1].toUpperCase()}\n${[1,2,3,4,5].map(i=>'D'+i+' '+(R.grades[i]||'-')).join(' · ')}\n${fmt(R.moved)} vapes · ${fmt(R.lungs)} lungs · ${R.stars}/15 challenges · ${R.busts} busts · ${R.retries} retries · ${mmss(R.time)}`;
  const canShare=!!(navigator.share&&X.touch);
  card(`<div class="cm-res"><small>TOO MANY VAPES · FINAL RESULTS</small><div class="cm-rank">${rk[1]}</div><p>${rk[2]}</p>
    <div class="cm-days">${days}</div>
    <div class="cm-stats"><span>Vapes moved</span><b>${fmt(R.moved)}</b><span>Lungs visited</span><b>${fmt(R.lungs)}</b><span>Perfect rips</span><b>${fmt(R.perfects)}</b><span>Cravings matched</span><b>${fmt(R.matches)}</b>
    <span>Challenges</span><b>${R.stars} / 15</b><span>Busts · retries</span><b>${R.busts} · ${R.retries}</b><span>Best combo</span><b>x${R.best}</b><span>Time on the clock</span><b>${mmss(R.time)}</b></div>
    <div class="url">CONTAINER EMPTY · DEBT PAID · SCORE ${sc}</div></div>
    ${newU.map(n=>`<div class="cm-new">UNLOCKED: ${n}</div>`).join('')}
    <div class="cm-sms"><b>HONEST GARY</b>We're square, kid. Funny thing though. I got another container coming Tuesday.</div>
    <button data-a="share">${canShare?'Share results':'Copy results'}</button>
    <div class="cm-row"><button class="cm-sec" data-a="new">New campaign</button><button class="cm-sec" data-a="free">Free play</button></div>${wardrobe()}`,
    wireWardrobe({share:b=>{const fail=()=>{b.textContent='Screenshot it instead'};
      try{if(canShare){navigator.share({title:'Too Many Vapes',text:share}).catch(()=>{});return}navigator.clipboard.writeText(share).then(()=>{b.textContent='Copied!'},fail)}catch(e){fail()}},
      new:()=>{newCampaign();$('again').click()},free:()=>{intent='free';$('again').click()}}));
  X.mode='won';$('hud').hidden=true}
function newCampaign(){S.day=1;S.snap=null;S.run=newRun();S.done=0;intent='campaign';save()}

/* ---------- entry points ---------- */
X.on('start',()=>{ov.hidden=true;
  if(intent==='free'){cmode='free';D=null;panel(false);S.seen=1;save();return}
  cmode='campaign';if(S.done||(S.day===1&&!S.snap))newCampaign();showDay(S.day)});
// intro screen: the big button plays the campaign (or continues it); small buttons for free play / starting over
const go=$('go'),ib=mk('div','','cm-introbtns');go.insertAdjacentElement('afterend',ib);
const resumable=()=>S.day>1&&S.snap&&!S.done;
function introUI(){go.textContent=resumable()?'Continue · Day '+S.day:'Open the container';
  ib.innerHTML=(S.seen?'<button class="cm-sec" data-a="free">Free play</button>':'')+(resumable()||S.done?'<button class="cm-sec" data-a="restart">New campaign</button>':'');
  ib.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.a==='free')intent='free';else newCampaign();X.start()})}
introUI();go.addEventListener('click',()=>{intent='campaign'},true);
// free-play win screen: offer the campaign. A real click on "Buy another container" stays in free play.
const wb=mk('button','','cm-sec');$('win').appendChild(wb);
X.on('win',()=>{setTimeout(()=>{wb.textContent=resumable()?'Continue campaign · Day '+S.day:'Play the campaign'},0)});
wb.onclick=()=>{if(!resumable())newCampaign();intent='campaign';$('again').click()};
$('again').addEventListener('click',e=>{if(e.isTrusted)intent='free'},true);

/* ---------- visuals: the sky slides toward sunset as the day runs out; gold / holo vape finish ---------- */
const dome=X.scene.children.find(o=>o.isMesh&&o.geometry&&o.geometry.parameters&&o.geometry.parameters.radius===430),SUN=new X.T.Color(0xff8a5a);
X.on('prerender',(dt,t)=>{
  let tg=0;if(cmode==='campaign'&&D){const k=D.over?1:D.el/Math.max(1,D.el+D.t);tg=Math.pow(clamp((k-.45)/.55,0,1),1.5)*.55}
  tint=lerp(tint,tg,Math.min(1,dt*2));
  if(tint>.003){X.scene.background.lerp(SUN,tint);X.scene.fog.color.copy(X.scene.background);if(dome)dome.material.color.setRGB(1,1-tint*.4,1-tint*.75)}else if(dome&&dome.material.color.g<1)dome.material.color.setRGB(1,1,1);
  const v=S.equip.vape,vm=X.vapeMat;if(v==='gold'){vm.color.setHex(0xffc23a);if(!(X.act.boost>0)){vm.emissive.setHex(0x3a2600);vm.emissiveIntensity=1}}else if(v==='holo')vm.color.setHSL((t*.12)%1,.85,.6)});

if(location.hash==='#dbg')window.tmvc={S:()=>S,D:()=>D,end,quota(){if(D)D.moved=Math.max(D.moved,D.def.quota||0)},time(s){if(D)D.t=s},panic(){X.heat=1},unlockAll(){for(const k in JACKETS)S.unlocks[k]=1;for(const k in VAPES)S.unlocks[k]=1;save()}};
})();
