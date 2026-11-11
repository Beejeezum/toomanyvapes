/* story mod: the whole game is one run. Comic-frame cutscenes (painted stills + boss VO + subtitles)
   before the first shift, boss "phone calls" as the town gets hooked, and an ending when the container is empty.
   Art lives in assets/story/*.jpg, VO in audio/vo/boss_*.mp3. Swap the script below to rewrite the story. */
(()=>{const X=window.TMV;if(!X)return;const $=X.$;

const BOSS='SAL';
const S={
  intro:[
    {img:'intro1',cap:'Coral Vista, Florida. Monday, 9:02 AM.',hold:3.4},
    {img:'intro2',vo:'boss_intro1',who:BOSS,cap:'OH NO. You ordered TOO MANY VAPES! FIVE THOUSAND?!'},
    {img:'intro3',vo:'boss_intro2',who:BOSS,cap:"We're NEVER gonna sell these! Get out there and get this town HOOKED. Grandmas, babies, the dog. GO!"}],
  beats:[
    {at:.2,img:'beat1',vo:'boss_beat1',who:BOSS,cap:"People are walkin' in here ASKIN' for 'em! Keep pushin'!"},
    {at:.5,img:'beat2',vo:'boss_beat2',who:BOSS,cap:'The MAYOR is vaping! Half this town is hooked. Finish the job!'}],
  end:{img:'end',vo:'boss_end',who:BOSS,cap:'Zero vapes. You did it, you beautiful menace… So, uh. I ordered another container.'}};

const IMG=n=>'assets/story/'+n+'.jpg',VO=n=>'audio/vo/'+n+'.mp3';
[...S.intro,...S.beats,S.end].forEach(f=>{const i=new Image();i.src=IMG(f.img)});

const css=document.createElement('style');css.textContent=`
#st{position:absolute;inset:0;z-index:30;background:#000;overflow:hidden;cursor:pointer;opacity:0;transition:opacity .35s}
#st.on{opacity:1}
#st img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 40%}
#st img.kb{animation:stkb 9s ease-out forwards}
@keyframes stkb{from{transform:scale(1.1) translate(1.5%,1%)}to{transform:scale(1) translate(0,0)}}
#st .cap,#stc .cap{font:800 clamp(16px,2.6vw,26px)/1.25 system-ui,sans-serif;color:#fff;text-shadow:2px 2px 0 #000,-2px 2px 0 #000,2px -2px 0 #000,-2px -2px 0 #000,0 3px 8px rgba(0,0,0,.8);text-wrap:balance}
#st .cap{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);width:min(900px,90vw);text-align:center}
.cap b{color:var(--hot,#ff3fa4);margin-right:.4em}
#st .sk{position:absolute;right:14px;top:12px;font:700 12px system-ui,sans-serif;letter-spacing:.12em;color:#fff;opacity:.55}
#st .bars:before,#st .bars:after{content:'';position:absolute;left:0;right:0;height:7vh;background:#000}
#st .bars:before{top:0}#st .bars:after{bottom:0}
#stc{position:absolute;left:16px;bottom:16px;z-index:12;width:min(320px,44vw);pointer-events:none;transform:translateX(-120%) rotate(-2deg);transition:transform .45s cubic-bezier(.2,.9,.3,1.2)}
#stc.on{transform:translateX(0) rotate(-2deg)}
#stc .fr{border:4px solid #fff;box-shadow:6px 6px 0 var(--hot,#ff3fa4);background:#000;aspect-ratio:16/9;overflow:hidden}
#stc img{width:100%;height:100%;object-fit:cover}
#stc .hd{font:800 11px system-ui,sans-serif;letter-spacing:.16em;color:#fff;background:var(--hot,#ff3fa4);display:inline-block;padding:3px 8px;margin-bottom:4px}
#stc .cap{font-size:clamp(13px,1.6vw,16px);margin-top:8px}
#intro .loc{font:800 13px system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:var(--lime,#b6ff3c);opacity:.9}
#mPick,#mPickBg,#mInst,#mTip,#news,#hint,#right,#vape,#prompt,#toast,#bubs{display:none!important}
`;
document.head.appendChild(css);

const st=document.createElement('div');st.id='st';st.hidden=true;st.innerHTML='<img alt=""><div class="bars"></div><div class="cap"></div><div class="sk">TAP ▸</div>';X.game.appendChild(st);
const call=document.createElement('div');call.id='stc';call.innerHTML='<div class="hd">📞 '+BOSS+'</div><div class="fr"><img alt=""></div><div class="cap"></div>';X.game.appendChild(call);

let au=null;
function speak(n,done){if(au){au.pause();au=null}if(!n||X.muted){done&&done(0);return null}
  const a=new Audio(VO(n));a.volume=.95;au=a;let fired=false;const f=d=>{if(!fired){fired=true;done&&done(d)}};
  a.onloadedmetadata=()=>f(a.duration);a.onerror=()=>f(0);a.play().catch(()=>f(0));return a}
const capHTML=f=>(f.who?'<b>'+f.who+'</b>':'')+f.cap;

/* full-screen sequence */
let seq=null;
function play(frames,done){seq={frames,i:-1,done,tm:0};st.hidden=false;requestAnimationFrame(()=>st.classList.add('on'));if(document.exitPointerLock)document.exitPointerLock();next()}
function next(){if(!seq)return;clearTimeout(seq.tm);const s=seq;s.i++;
  if(s.i>=s.frames.length){if(au){au.pause();au=null}st.classList.remove('on');seq=null;setTimeout(()=>{st.hidden=true;s.done&&s.done()},350);return}
  const f=s.frames[s.i],im=st.querySelector('img');im.classList.remove('kb');im.src=IMG(f.img);void im.offsetWidth;im.classList.add('kb');
  st.querySelector('.cap').innerHTML=capHTML(f);const my=s.i;
  speak(f.vo,d=>{if(seq===s&&s.i===my)s.tm=setTimeout(next,d?(d+.7)*1000:(f.hold||Math.max(3.4,f.cap.length*.06))*1000)})}
st.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();next()});
addEventListener('keydown',e=>{if(seq&&!e.repeat&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape')){e.stopPropagation();e.preventDefault();next()}},true);

/* title → intro comic → shift starts (juice plays the container-opening shot) */
let introSeen=false;
$('go').onclick=()=>{$('intro').hidden=true;if(introSeen){X.start();return}introSeen=true;play(S.intro,()=>X.start())};

/* boss calls as the town gets hooked */
let beatI=0,callT=0;
function ring(b){call.querySelector('img').src=IMG(b.img);call.querySelector('.cap').innerHTML=b.cap;call.classList.add('on');
  X.beep(1320,.12,'square',.03);X.beep(1320,.12,'square',.03,.18);
  setTimeout(()=>speak(b.vo,d=>{clearTimeout(callT);callT=setTimeout(()=>call.classList.remove('on'),((d||5.5)+.8)*1000)}),500)}
X.on('vape',()=>{if(beatI<S.beats.length&&X.used/5000>=S.beats[beatI].at&&X.count>0)ring(S.beats[beatI++])});
X.on('start',()=>{if(X.used===0)beatI=0});

/* ending: after the last-vape slow-mo, the boss gets the last word */
X.on('win',()=>{call.classList.remove('on');setTimeout(()=>{if(X.mode==='won')play([S.end],()=>{})},4300)});
X.story={play,S};
})();
