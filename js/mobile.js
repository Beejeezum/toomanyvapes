/* mobile mod: phone controls (floating stick, sprint toggle, bigger hit areas, smart flavor swap + picker),
   pause/mute buttons, haptics, rotate hint, automatic performance governor, add-to-home-screen, gesture guards.
   Talks to the game only through window.TMV. Uses TMV.setMute / TMV.muted when present (falls back to a synthetic M key),
   and relies on the think() wrapper in the MOD API block that freezes creatures while mode==='paused'. */
(()=>{
const X=window.TMV;if(!X)return;
const D=document,touch=!!X.touch,game=X.game,$=id=>D.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dbg=location.hash==='#dbg',now=()=>performance.now();
const store={get(k,d){try{const v=localStorage.getItem('tmv_m_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('tmv_m_'+k,JSON.stringify(v))}catch(e){}}};
const UA=navigator.userAgent||'',iOS=/iPhone|iPad|iPod/.test(UA)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=()=>{try{return matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};

/* ===== head tags: manifest + icons for add-to-home-screen ===== */
{const H=D.head,add=(n,a,q)=>{if(H.querySelector(q))return;const e=D.createElement(n);for(const k in a)e.setAttribute(k,a[k]);H.appendChild(e)};
 add('link',{rel:'manifest',href:'assets/mobile/manifest.webmanifest'},'link[rel="manifest"]');
 add('link',{rel:'apple-touch-icon',href:'assets/mobile/apple-touch-icon.png'},'link[rel="apple-touch-icon"]');
 add('link',{rel:'icon',type:'image/png',href:'assets/mobile/favicon-64.png'},'link[rel="icon"]');
 add('meta',{name:'apple-mobile-web-app-title',content:'Too Many Vapes'},'meta[name="apple-mobile-web-app-title"]');
 add('meta',{name:'apple-mobile-web-app-status-bar-style',content:'black-translucent'},'meta[name="apple-mobile-web-app-status-bar-style"]');
 add('meta',{name:'theme-color',content:'#140f1c'},'meta[name="theme-color"]')}

/* ===== styles ===== */
const css=D.createElement('style');css.textContent=`
html,body{overscroll-behavior:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
body{position:fixed;inset:0;width:100%;height:100%}
#mob{position:fixed;inset:0;pointer-events:none;z-index:20;font-family:var(--body);color:var(--paper);-webkit-user-select:none;user-select:none}
#mob .mI{pointer-events:auto}
.mBtn{position:absolute;width:46px;height:46px;display:grid;place-items:center;background:var(--panel);border:3px solid var(--paper);color:var(--paper);padding:0;cursor:pointer;touch-action:none}
.mBtn::before{content:'';position:absolute;inset:-8px}
.mBtn svg{width:22px;height:22px;fill:currentColor}
.mBtn:focus-visible{outline:3px solid var(--lime);outline-offset:2px}
#mPauseB{top:max(10px,env(safe-area-inset-top,0px));left:max(12px,env(safe-area-inset-left,0px));rotate:-2deg}
#mMuteB{top:max(10px,env(safe-area-inset-top,0px));left:calc(max(12px,env(safe-area-inset-left,0px)) + 56px);rotate:1.5deg}
#mMuteB.off{color:var(--hot);border-color:var(--hot)}
#powers{top:calc(max(10px,env(safe-area-inset-top,0px)) + 58px)!important}
#mRun{width:66px;height:66px;border-radius:50%;right:calc(max(24px,env(safe-area-inset-right,0px)) + 26px);bottom:calc(232px + env(safe-area-inset-bottom,0px));font-family:var(--display);font-size:15px;opacity:.7}
#mRun.on{background:var(--fire);color:var(--ink);border-color:var(--fire);opacity:1;box-shadow:0 0 18px var(--fire)}
@media (max-height:520px){#mRun{right:calc(max(24px,env(safe-area-inset-right,0px)) + 132px);bottom:calc(100px + env(safe-area-inset-bottom,0px))}}
#mRot{position:absolute;left:50%;top:calc(118px + env(safe-area-inset-top,0px));transform:translateX(-50%);background:var(--paper);color:var(--ink);font-weight:800;font-size:13px;padding:7px 12px;border-left:6px solid var(--sky);white-space:nowrap;display:flex;gap:8px;align-items:center}
#mRot.intro{top:auto;bottom:calc(18px + env(safe-area-inset-bottom,0px))}
#mRot b{display:inline-block;animation:mRot 1.6s ease-in-out infinite}
@keyframes mRot{0%,30%{rotate:0deg}60%,100%{rotate:-90deg}}
#mRot i{font-style:normal;opacity:.5;font-weight:600}
#mInst{position:absolute;top:max(12px,env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));font-family:var(--body);font-weight:800;font-size:13px;letter-spacing:.06em;padding:9px 12px;background:var(--panel);border:2px solid var(--lime);color:var(--lime);cursor:pointer}
#mTip{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;max-width:min(320px,86vw);background:var(--paper);color:var(--ink);font-weight:600;font-size:15px;padding:14px 16px;border-left:8px solid var(--hot);box-shadow:6px 6px 0 var(--ink)}
#mPause{z-index:2;overflow:auto;justify-content:safe center}
#mPause h1{font-size:clamp(40px,10vw,90px)}
#mPause .row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:560px}
#mPause .row button{font-family:var(--body);font-weight:800;font-size:15px;letter-spacing:.04em;padding:11px 16px;min-height:46px;background:var(--panel);color:var(--paper);border:2px solid var(--paper);box-shadow:none;margin:0}
#mPause .row button.off{border-color:var(--hot);color:var(--hot)}
#mHow{font-size:14px!important;font-weight:400!important;max-width:52ch!important;text-align:left;line-height:1.4;background:rgba(255,255,255,.06);padding:10px 14px}
#mPickBg{position:absolute;inset:0}
#mPick{position:absolute;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(112px + env(safe-area-inset-bottom,0px));width:min(520px,calc(100vw - 24px));max-height:calc(100% - 140px);overflow:auto;background:var(--panel);border:3px solid var(--sky);padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
#mPick h3{grid-column:1/-1;margin:2px 4px 4px;font-size:11px;letter-spacing:.16em;color:var(--sky)}
#mPick button{display:flex;align-items:center;gap:6px;min-height:44px;padding:4px 8px;background:rgba(255,255,255,.07);border:2px solid transparent;border-left:6px solid var(--c);color:var(--paper);font-family:var(--body);font-weight:800;font-size:13px;text-align:left;cursor:pointer;overflow:hidden}
#mPick button span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mPick button small{font-weight:600;opacity:.75;font-variant-numeric:tabular-nums}
#mPick button.cur{border-color:var(--paper);border-left-color:var(--c)}#mPick button.crave{border-color:var(--hot);border-left-color:var(--c);box-shadow:0 0 10px var(--hot)}
#mPick button:disabled{opacity:.3}
#mFps{position:absolute;right:6px;bottom:calc(4px + env(safe-area-inset-bottom,0px));font:600 11px/1.2 ui-monospace,monospace;background:rgba(0,0,0,.5);padding:2px 5px}
#swap.mChip{display:inline-block;padding:1px 7px;background:var(--sky);color:var(--ink);letter-spacing:.06em}
#vape.mWant #swap{display:inline-block;padding:1px 7px;background:var(--hot);color:var(--paper);animation:mPulse .7s ease-in-out infinite alternate}
@keyframes mPulse{from{scale:1}to{scale:1.12}}
#vape.mPop{animation:mPop .18s ease-out}@keyframes mPop{50%{scale:1.06}}
${touch?`
#vape{padding:10px 14px 12px;transform-origin:left bottom}
#vape::before{content:'';position:absolute;inset:-10px -10px -16px -12px}
#vbtn{width:118px;height:118px;font-size:22px;touch-action:none}
#vbtn::before{content:'';position:absolute;inset:-18px;border-radius:50%}
#vbtn:active{scale:.94}
#stick{width:120px;height:120px;bottom:calc(132px + env(safe-area-inset-bottom,0px));opacity:.28;transition:opacity .15s}
#stick.live{opacity:.75;transition:none}
#stick::after{content:'MOVE';position:absolute;left:0;right:0;top:calc(100% + 4px);text-align:center;font-weight:800;font-size:10px;letter-spacing:.2em}
#stick.live::after{content:none}
@media (max-height:520px){#vbtn{width:104px;height:104px;bottom:calc(84px + env(safe-area-inset-bottom,0px))}#stick{width:110px;height:110px;bottom:calc(118px + env(safe-area-inset-bottom,0px))}}
`:''}
`;D.head.appendChild(css);

/* ===== phone declutter (touch only): on a phone held sideways (short screen) every HUD scrap is smaller and tucked to an edge,
   the centre stays clear, and only what matters right now is up. Rules are prefixed html.tmvT so they outrank the paper/story
   styles injected after this file, whatever the load order. Mute and full-screen live in the pause menu during play (see sync). ===== */
if(touch){D.documentElement.classList.add('tmvT');const dc=D.createElement('style');dc.id='mDeclutter';dc.textContent=`
html.tmvT:has(#mPause:not([hidden])) #stob,html.tmvT:has(#stmc.go) #stob,html.tmvT:has(#stt.go) #stob{display:none!important}/* the title and mission cards already say it */
html.tmvT #stob .tg,html.tmvT #stob .ct{display:none!important}
@media (max-height:540px){
 html.tmvT{--hR:40vh;--hL:34vh}
 /* title: logo, tagline and Play fit; the small print goes to the bottom corners instead of over the button */
 html.tmvT #game #intro{gap:6px;padding-block:8px}
 html.tmvT #game #intro .logo{width:min(780px,80vw,calc(50vh * 2.26))}
 html.tmvT #game #intro .loc{font-size:14px;padding:.4em 1.3em .35em}
 html.tmvT #game #st .sk{right:max(16px,env(safe-area-inset-right,0px))}
 html.tmvT #game #intro>button{font-size:20px;padding:11px 30px 9px;margin-top:4px}
 html.tmvT #game #intro .warn{left:max(14px,env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:none;font-size:9px!important;opacity:.6}
 html.tmvT #game #intro .bruce{left:auto;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:rotate(-1.5deg);font-size:10px;padding:5px 8px;opacity:.7}
 /* corner buttons: small kraft scraps */
 html.tmvT #mob .mBtn{width:34px;height:34px}html.tmvT #mob .mBtn svg{width:17px;height:17px}
 html.tmvT #mob .mBtn::after{width:14px;height:7px;margin-left:-7px;top:-4px}
 html.tmvT #mob #mPauseB{top:max(8px,env(safe-area-inset-top,0px));left:max(10px,env(safe-area-inset-left,0px));opacity:.85}
 html.tmvT #mob #mMuteB{top:max(8px,env(safe-area-inset-top,0px));left:calc(max(10px,env(safe-area-inset-left,0px)) + 44px)}
 html.tmvT #mob #mPauseB[hidden]+#mMuteB{left:max(10px,env(safe-area-inset-left,0px))}
 html.tmvT #game #scFS{width:34px;height:34px;top:max(8px,env(safe-area-inset-top,0px));right:max(10px,env(safe-area-inset-right,0px))}html.tmvT #game #scFS svg{width:18px;height:18px}
 /* power-up chips: one small row beside the pause scrap */
 html.tmvT #game #powers{top:max(8px,env(safe-area-inset-top,0px))!important;left:calc(max(10px,env(safe-area-inset-left,0px)) + 46px);flex-direction:row;gap:6px}
 html.tmvT #game .pw{font-size:15px;min-width:34px;padding:5px 6px 4px}html.tmvT #game .pw i{height:4px;margin-top:3px}html.tmvT #game .pw::after{width:14px;height:7px}
 /* vapes left + goal tokens: one compact strip along the top */
 html.tmvT #game #count{top:max(4px,env(safe-area-inset-top,0px));flex-direction:row;align-items:center;gap:6px;padding:2px 6px}
 html.tmvT #ppnum{font-size:25px}
 html.tmvT #game #stg{margin-top:0;gap:2px;min-height:0}html.tmvT #game #stg .tks{gap:2px}
 html.tmvT #game #stg .tk{width:23px;height:25px}html.tmvT #game #stg .tk>svg{width:18px;height:18px}
 html.tmvT #game #stg .tkb{margin-left:3px;padding-top:5px}html.tmvT #game #stg .tkb .tk{width:28px;height:30px}html.tmvT #game #stg .tkb .tk>svg{width:22px;height:22px}
 html.tmvT #game #stg .tkb .cr{width:16px;height:9px;margin-left:-8px;top:0}
 html.tmvT #game #stg .tk.ctn{width:40px;height:25px}html.tmvT #game #stg .tk.ctn>svg{width:36px;height:21px}
 html.tmvT #game #stch{font-size:10px;padding:1px 5px 0;margin-right:2px}
 /* objective panel: just the step, small, top-left under the pause scrap (still tucks away 6 s after a step change) */
 html.tmvT #game #stob{top:calc(max(8px,env(safe-area-inset-top,0px)) + 44px);left:max(10px,env(safe-area-inset-left,0px));width:auto;max-width:min(220px,24vw);padding:6px 9px 7px}
 html.tmvT #game #stob .st{font-size:13px;line-height:1.05;text-wrap:balance}
 /* chapter title card and mission card: smaller, and above the crosshair instead of on it */
 html.tmvT #game #stt{padding-bottom:22vh}
 html.tmvT #game #stt b{font-size:64px}html.tmvT #game #stt i,html.tmvT #game #stt i.pp-rn{font-size:22px;margin-top:4px}html.tmvT #game #stt s{font-size:11px;margin-bottom:6px}
 html.tmvT #game #stmc{top:29%;left:0;right:0;margin:0 auto;width:fit-content;max-width:min(400px,56vw);gap:2px;padding:6px 16px 8px;box-shadow:0 3px 0 rgba(43,34,51,.35)}
 html.tmvT #game #stmc .ic svg{width:18px;height:18px}html.tmvT #game #stmc .ic .ar{width:14px;height:14px}html.tmvT #game #stmc .ic{gap:5px}
 html.tmvT #game #stmc b{font-size:22px;text-shadow:2px 2px 0 #fbf5e6}html.tmvT #game #stmc i{font-size:11px;padding:.25em .5em}
 /* Sal on the phone: a stamp-sized polaroid beside a short strip, tucked top-right under the full-screen corner (that button is away in play) */
 html.tmvT #game #stc{top:calc(max(4px,env(safe-area-inset-top,0px)) + 38px);right:max(10px,env(safe-area-inset-right,0px));flex-direction:row-reverse;align-items:flex-start;gap:2px}
 html.tmvT #game #stc .fr{width:40px;padding:3px 3px 9px}html.tmvT #game #stc .fr::after{width:24px;height:8px;margin-left:-12px;top:-3px}
 html.tmvT #game #stc .hd{width:16px;height:16px;left:-7px;top:-6px}html.tmvT #game #stc .hd svg{width:10px;height:10px}
 html.tmvT #game #stc .cap{margin:3px 0 0;max-width:min(290px,40vw);font-size:11.5px;line-height:1.25;padding:.55em .8em .5em}
 html.tmvT #game #stc .cap b{font-size:.7em}
 /* someone talking in person: a short subtitle strip at the very bottom, between the thumbs */
 html.tmvT #game #stc.live{top:auto;left:0;right:0;bottom:calc(6px + env(safe-area-inset-bottom,0px));flex-direction:row;justify-content:center}
 html.tmvT #game #stc.live .cap{max-width:min(420px,48vw);font-size:12.5px;padding:.6em 1.1em .55em}
 /* boss: smaller name card above the middle; a thin progress strip under the top strip */
 html.tmvT #game #bosscard{top:34%;width:auto;max-width:min(460px,66vw);padding:7px 16px 5px}
 html.tmvT #game #bosscard b{font-size:24px}
 html.tmvT #game #bossbar{top:calc(max(4px,env(safe-area-inset-top,0px)) + 40px);width:min(200px,24vw);padding:3px 8px 5px}
 html.tmvT #game #bossbar .bn{font-size:9px}html.tmvT #game #bossbar .bb{height:6px;margin-top:2px}html.tmvT #game #bossbar small{display:none}
 /* hold-to-vape meter, combo stamp, direction scraps, clear stamp */
 html.tmvT #game #lung{top:22%;width:min(210px,32vw);padding:5px 7px}html.tmvT #game #lung .bar{height:12px}
 html.tmvT #game #lung .bar::after{width:16px;height:8px;top:-7px;left:calc(68% - 8px)}
 html.tmvT #game #jz-combo{top:37%;right:calc(max(10px,env(safe-area-inset-right,0px)) + 8px)}html.tmvT #game #jz-combo b{font-size:28px}
 html.tmvT #game #starw{width:26px;height:33px;margin:-16px 0 0 -13px}html.tmvT #game #starw::after{width:18px;height:7px;margin-left:-9px}
 html.tmvT #game #stchev{width:18px;height:13px;margin:-7px 0 0 -9px}
 html.tmvT #game #stk{width:24vmin;height:24vmin;margin:-12vmin 0 0 -12vmin}
 /* thumbs: the stick only hints where it is; VAPE sits low in the right corner with RUN stacked just above it */
 html.tmvT #game #stick{width:90px;height:90px;left:calc(max(10px,env(safe-area-inset-left,0px)) + 14px);bottom:calc(22px + env(safe-area-inset-bottom,0px));opacity:.18}
 html.tmvT #game #stick.live{opacity:.7}html.tmvT #game #stick i{width:34px;height:34px;margin:-17px}
 html.tmvT #game #stick::after{font-size:9px;top:calc(100% + 1px)}
 html.tmvT #game #vbtn{width:82px;height:82px;font-size:16px;right:calc(max(10px,env(safe-area-inset-right,0px)) + 8px);bottom:calc(20px + env(safe-area-inset-bottom,0px))}
 html.tmvT #game #vbtn::before{inset:-12px}
 html.tmvT #mob #mRun{width:48px;height:48px;font-size:11px;right:calc(max(10px,env(safe-area-inset-right,0px)) + 25px);bottom:calc(114px + env(safe-area-inset-bottom,0px));opacity:.75}
 html.tmvT #mob #mRun.on{opacity:1}
}`;D.head.appendChild(dc)}

/* ===== DOM (lives outside #game so the core's touch handlers never see these taps) ===== */
const IC={pause:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>',
 on:'<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
 off:'<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15 9l6 6M21 9l-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'};
const mob=D.createElement('div');mob.id='mob';
mob.innerHTML=`<button id="mPauseB" class="mBtn mI" aria-label="Pause" hidden>${IC.pause}</button>
<button id="mMuteB" class="mBtn mI" aria-label="Mute">${IC.on}</button>
<button id="mRun" class="mBtn mI" aria-label="Sprint" aria-pressed="false" hidden>RUN</button>
<div id="mRot" class="mI" hidden><b>📱</b> Turn sideways for a wider view <i>✕</i></div>
<button id="mInst" class="mI" hidden>📲 ADD TO HOME SCREEN</button>
<div id="mPickBg" class="mI" hidden></div><div id="mPick" class="mI mScroll" hidden></div>
<div id="mPause" class="ov mI mScroll" hidden><h1>Paused</h1>
 <button id="mResume">Keep vaping</button>
 <div class="row"><button id="mSnd"></button><button id="mHap" hidden></button><button id="mGfx"></button><button id="mHowB">How to play</button><button id="mInst2" hidden>📲 Add to home screen</button></div>
 <p id="mHow" hidden></p></div>
<div id="mTip" class="mI" hidden></div>
${dbg?'<div id="mFps"></div>':''}`;
D.body.appendChild(mob);
const pauseB=$('mPauseB'),muteB=$('mMuteB'),runB=$('mRun'),rotEl=$('mRot'),ov=$('mPause'),howEl=$('mHow'),pickEl=$('mPick'),pickBg=$('mPickBg'),tipEl=$('mTip'),fpsEl=$('mFps'),instB=$('mInst'),inst2=$('mInst2');
/* tap(): fires on touchstart (preventDefault also kills the emulated mouseup that would make the core drop a held vape), or click for mice */
function tap(el,fn){el.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();e.stopPropagation();fn(e)},{passive:false});el.addEventListener('click',e=>{e.stopPropagation();fn(e)})}

/* ===== haptics ===== */
const canVib=typeof navigator.vibrate==='function'&&touch;let hapt=store.get('hapt',true);
function buzz(p){if(!hapt||!canVib)return;try{navigator.vibrate(p)}catch(e){}}
X.on('grab',()=>buzz(14));
X.on('release',(n,kind,match)=>{if(kind==='perfect')buzz(match?[30,30,30,30,70]:[25,35,45]);else if(kind==='over')buzz(80);else if(match)buzz([20,30,20])});
X.on('bust',()=>buzz([90,50,170]));
X.on('pickup',()=>buzz([15,25,15,25,45]));

/* ===== mute (sound also goes quiet while paused, then comes back unless the player muted) ===== */
let userMute=store.get('mute',false),synthMuted=false,inSynth=false,paused=false;
addEventListener('keydown',e=>{if(e.code!=='KeyM'||e.repeat)return;synthMuted=!synthMuted;   // mirrors the core's M toggle (real or synthetic)
  if(!inSynth){userMute='muted' in X?!!X.muted:synthMuted;store.set('mute',userMute);if(paused)applyMute();labels()}});
const coreMuted=()=>'muted' in X?!!X.muted:synthMuted;
function setCoreMute(m){if(typeof X.setMute==='function')X.setMute(m);else if(coreMuted()!==m){inSynth=true;try{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM',key:'m'}));dispatchEvent(new KeyboardEvent('keyup',{code:'KeyM',key:'m'}))}finally{inSynth=false}}}
function applyMute(){const w=userMute||paused;if(coreMuted()!==w)setCoreMute(w)}
function toggleMute(){userMute=!userMute;store.set('mute',userMute);applyMute();labels()}
tap(muteB,toggleMute);

/* ===== pause ===== */
let pausedAt=0;
function pause(){if(X.mode!=='play')return;X.mode='paused';paused=true;pausedAt=now();X.keys.Space=0;closePick();applyMute();
  if(D.pointerLockElement&&D.exitPointerLock)D.exitPointerLock();howEl.hidden=true;labels();ov.hidden=false;sync(0)}
function resume(){if(X.mode==='paused')X.mode='play';paused=false;ov.hidden=true;tipEl.hidden=true;applyMute();gov.skip=1;sync(0);
  if(!touch){const cv=X.R.domElement;try{const p=cv.requestPointerLock&&cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}}
tap(pauseB,pause);tap($('mResume'),resume);
addEventListener('keydown',e=>{if(e.repeat)return;
  if(e.code==='KeyP'){if(X.mode==='play')pause();else if(paused)resume();return}
  if(e.code==='Escape'){if(X.mode==='play')pause();else if(paused&&now()-pausedAt>400)resume()}});
D.addEventListener('pointerlockchange',()=>{if(!D.pointerLockElement&&X.mode==='play'&&!touch)pause()});
D.addEventListener('visibilitychange',()=>{if(D.hidden)pause()});
addEventListener('pagehide',()=>pause());

/* pause menu */
const GN=['SHARP','CRISP','SMOOTH','FAST','POTATO'];
function labels(){muteB.innerHTML=userMute?IC.off:IC.on;muteB.classList.toggle('off',userMute);muteB.setAttribute('aria-label',userMute?'Unmute':'Mute');
  const s=$('mSnd');s.textContent=userMute?'🔇 Sound: off':'🔊 Sound: on';s.classList.toggle('off',userMute);
  const h=$('mHap');h.hidden=!canVib;h.textContent=hapt?'📳 Buzz: on':'📳 Buzz: off';h.classList.toggle('off',!hapt);
  $('mGfx').textContent='🎛 Graphics: '+(gmode==='auto'?'auto ('+GN[gov.lvl].toLowerCase()+')':gmode==='high'?'sharp':'fast')}
tap($('mSnd'),toggleMute);
tap($('mHap'),()=>{hapt=!hapt;store.set('hapt',hapt);labels();buzz(30)});
tap($('mGfx'),()=>{gmode=gmode==='auto'?'high':gmode==='high'?'low':'auto';store.set('gfx',gmode);setLevel(gmode==='high'?0:gmode==='low'?3:gov.lvl);labels()});
tap($('mHowB'),()=>{howEl.hidden=!howEl.hidden});
howEl.innerHTML=touch
 ?'<b>Left thumb:</b> drag anywhere on the left half to walk (the stick appears under your thumb). <b>Right thumb:</b> drag to look. Hold <b>VAPE</b> near a mouth and let go while the bar is green for a <b>PERFECT RIP</b>. <b>RUN</b> toggles sprint. Tap the flavor panel to switch flavor (it jumps straight to what your target craves); press and hold it to pick any flavor. Glowing crates are power-ups. Too much town panic brings the cops.'
 :'<b>WASD</b> move, <b>Shift</b> sprint, <b>mouse</b> look. Hold <b>click</b> or <b>Space</b> near a mouth and let go in the green for a <b>PERFECT RIP</b>. <b>Q / E</b> or scroll switches flavor; click the flavor panel to serve what your target craves, right-click it to pick any flavor. Glowing crates are power-ups. Too much town panic brings the cops. <b>M</b> mutes, <b>P</b> or <b>Esc</b> pauses.';
if(iOS&&!standalone())howEl.innerHTML+='<br><br>📲 Play it like an app: tap <b>Share</b>, then <b>Add to Home Screen</b>.';

/* ===== add to home screen ===== */
let bip=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();bip=e});
addEventListener('appinstalled',()=>{bip=null});
function install(){if(bip){const p=bip;bip=null;try{const r=p.prompt();if(r&&r.catch)r.catch(()=>{})}catch(e){}return}
  tipEl.innerHTML='📲 Tap <b>Share</b> at the bottom of Safari, then <b>Add to Home Screen</b>. It opens full-screen like a real app. <i style="opacity:.5">(tap to close)</i>';tipEl.hidden=false;setTimeout(()=>{tipEl.hidden=true},7000)}
tap(instB,install);tap(inst2,install);tap(tipEl,()=>{tipEl.hidden=true});
const canInstall=()=>!standalone()&&(!!bip||(iOS&&touch));

/* ===== fullscreen on start (Android; iPhone Safari has no element fullscreen, home-screen mode covers it) ===== */
function fs(){if(!touch||standalone()||D.fullscreenElement)return;const el=D.documentElement;try{const p=el.requestFullscreen&&el.requestFullscreen({navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{})}catch(e){}}
['go','again'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',fs)});

/* ===== sprint toggle ===== */
let sprint=false;
function setSprint(v){sprint=v;X.keys.ShiftLeft=v?1:0;runB.classList.toggle('on',v);runB.setAttribute('aria-pressed',String(v))}
tap(runB,()=>{setSprint(!sprint);buzz(8)});

/* ===== floating joystick: mirrors the core's stick assignment (first left-half touch that isn't the VAPE button or flavor panel) ===== */
const stick=$('stick'),vbtn=$('vbtn');let stId=null;
function placeStick(x,y){const r=stick.offsetWidth/2||60;stick.style.left=Math.max(4,x-r)+'px';stick.style.top=Math.max(4,y-r)+'px';stick.style.bottom='auto';stick.classList.add('live')}
function restStick(){stick.style.left=stick.style.top=stick.style.bottom='';stick.classList.remove('live')}
if(touch&&stick){
  game.addEventListener('touchstart',e=>{if(X.mode!=='play')return;for(const t of e.changedTouches){const g=t.target;if(g.closest&&g.closest('#vape'))continue;if(g===vbtn)continue;
    if(t.clientX<game.clientWidth/2&&stId===null){stId=t.identifier;placeStick(t.clientX,t.clientY)}}},{passive:true});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===stId){stId=null;restStick()}};
  game.addEventListener('touchend',end);game.addEventListener('touchcancel',end)}

/* ===== flavor panel: tap = smart swap (straight to what the target craves, else next), hold / right-click = picker ===== */
const vapeEl=$('vape'),swapEl=$('swap');
if(touch&&swapEl){swapEl.textContent='TAP ⟳';swapEl.classList.add('mChip')}
function wantC(){const n=X.held||X.tgt;if(!n||n.crave==null||n.crave===X.fi)return null;return X.STOCK[n.crave]>0?n.crave:null}
function pop(){if(!vapeEl)return;vapeEl.classList.remove('mPop');void vapeEl.offsetWidth;vapeEl.classList.add('mPop')}
function smartSwap(){if(X.mode!=='play')return;const c=wantC();if(c!=null)X.setFlav(c);else X.cycleFlav(1);buzz(8);pop()}
function openPick(){if(X.mode!=='play')return;const F=X.FLAV,S=X.STOCK,c=wantC();let h='<h3>PICK A FLAVOR</h3>';
  F.forEach((f,i)=>{h+=`<button data-i="${i}" style="--c:#${f[1].toString(16).padStart(6,'0')}" class="${i===X.fi?'cur':''}${i===c?' crave':''}" ${S[i]>0?'':'disabled'}>${f[2]}<span>${f[0]}</span><small>${S[i].toLocaleString()}</small></button>`});
  pickEl.innerHTML=h;pickEl.hidden=pickBg.hidden=false;buzz(12)}
function closePick(){pickEl.hidden=pickBg.hidden=true}
function choose(b){if(!b||b.disabled)return;if(X.mode==='play')X.setFlav(+b.dataset.i);closePick();pop()}
pickEl.addEventListener('click',e=>choose(e.target.closest('button[data-i]')));
pickEl.addEventListener('touchend',e=>{const b=e.target.closest('button[data-i]');if(!b)return;if(e.cancelable)e.preventDefault();choose(b)},{passive:false});
tap(pickBg,closePick);
if(vapeEl){let pressT=null;
  game.addEventListener('touchstart',e=>{const t=e.changedTouches[0];if(X.mode!=='play'||!t||!t.target.closest||!t.target.closest('#vape'))return;
    if(e.cancelable)e.preventDefault();e.stopPropagation();clearTimeout(pressT);pressT=setTimeout(()=>{pressT=null;openPick()},420)},{capture:true,passive:false});
  vapeEl.addEventListener('touchend',()=>{if(pressT){clearTimeout(pressT);pressT=null;smartSwap()}});
  vapeEl.addEventListener('touchcancel',()=>{clearTimeout(pressT);pressT=null});
  game.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#vape')){e.stopPropagation();smartSwap()}},true);
  vapeEl.addEventListener('contextmenu',e=>{e.preventDefault();openPick()})}

/* ===== gesture guards: no page scroll/zoom, text selection or long-press menus ===== */
{const stop=e=>{if(e.cancelable)e.preventDefault()},editable=t=>t&&t.closest&&t.closest('input,textarea,select,[contenteditable]');
 D.addEventListener('gesturestart',stop,{passive:false});D.addEventListener('gesturechange',stop,{passive:false});
 D.addEventListener('dblclick',e=>{if(!editable(e.target))stop(e)},{passive:false});
 D.addEventListener('contextmenu',e=>{if(!editable(e.target))stop(e)});
 D.addEventListener('selectstart',e=>{if(!editable(e.target))stop(e)});
 D.addEventListener('touchmove',e=>{if(e.touches.length>1||!(e.target.closest&&e.target.closest('.mScroll,input,textarea')))stop(e)},{passive:false})}

/* ===== rotate hint (portrait stays playable) ===== */
let rotT=0,rotOff=false,wasPortrait=null;
const portrait=()=>innerHeight>innerWidth*1.05;
tap(rotEl,()=>{rotOff=true;rotEl.hidden=true});
X.on('start',()=>{if(portrait())rotT=6;gov.skip=1;gov.down=gov.up=null});
addEventListener('resize',()=>{gov.skip=1;const p=portrait();if(p&&wasPortrait===false&&X.mode==='play')rotT=5;wasPortrait=p});

/* ===== performance governor =====
   Samples fps in 2s windows during play. Below ~42fps it steps down render height, outline distance and smoke density;
   with sustained headroom (>=56fps three windows running) it steps back up. A step down that doesn't help
   (e.g. a phone capped at 30Hz in low-power mode) is undone and not retried for a while. Invisible unless #dbg. */
const BASE=X.RES;
const LV=[{r:1,ink:42,w:1e9,sm:1},{r:.86,ink:42,w:110,sm:1},{r:.74,ink:30,w:70,sm:1},{r:.62,ink:20,w:48,sm:2},{r:.5,ink:13,w:34,sm:3}];
let gmode=store.get('gfx','auto');
const gov={lvl:clamp(store.get('lvl',0)|0,0,LV.length-1),skip:1,fps:0,good:0,down:null,up:null,noDown:0,noDownN:0,noUp:0,upFail:0,wT:0,wN:0};
let inkDirty=true,wInks=[],scanAt=0;
function setLevel(l){l=clamp(l,0,LV.length-1);gov.lvl=l;const res=Math.round(BASE*LV[l].r);if(X.RES!==res)X.setRes(res);inkDirty=true;gov.skip=1;scanAt=0;if(gmode==='auto')store.set('lvl',l);if(!ov.hidden)labels()}
function evalWin(fps){gov.fps=fps;if(gov.skip>0){gov.skip--;return}if(gmode!=='auto')return;const t=now(),L=gov.lvl;
  if(gov.up){if(fps<42){gov.upFail++;gov.noUp=t+30000*gov.upFail;const f=gov.up.from;gov.up=null;setLevel(f);return}if(t-gov.up.at>7000)gov.up=null}
  if(gov.down){const d=gov.down;gov.down=null;if(fps<d.fps*1.06){gov.noDownN++;gov.noDown=t+60000*gov.noDownN;setLevel(d.from);return}}
  if(fps<42&&L<LV.length-1&&t>gov.noDown){gov.down={from:L,fps};gov.good=0;setLevel(L+1);return}
  if(fps>=56&&L>0&&t>gov.noUp){if(++gov.good>=3){gov.good=0;gov.up={from:L,at:t};setLevel(L-1)}}else gov.good=0}
/* outlines on far buildings/props: inverted-hull meshes (BackSide basic material parented to a mesh), skipping creatures and the camera rig */
function scanWorld(){const skip=new Set();for(const n of X.npcs)if(n.g)skip.add(n.g);skip.add(X.cam);const out=[];
  const walk=o=>{if(skip.has(o))return;
    if(o.isMesh&&o.parent&&o.parent.isMesh){const m=o.material;if(m&&m.isMeshBasicMaterial&&m.side===X.T.BackSide){const e=o.matrixWorld.elements;out.push({h:o,r:Math.max(Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10]))*.6})}}
    for(const c of o.children)walk(c)};
  walk(X.scene);for(const o of wInks)if(o.h.userData.mHid&&!out.some(q=>q.h===o.h))out.push(o);wInks=out}
function inkPass(){const L=LV[gov.lvl],px=X.px,pz=X.pz;
  if(L.ink<42||inkDirty){const lim=Math.min(42,L.ink);for(const n of X.npcs){const I=n.inks;if(!I||!I.length||!n.g)continue;const p=n.g.position,want=Math.hypot(p.x-px,p.z-pz)<lim;if(I[0].visible!==want)for(const h of I)h.visible=want}}
  if(L.w<1e9||inkDirty){const t=now();if(L.w<1e9&&t>scanAt){scanAt=t+6000;scanWorld()}
    for(const o of wInks){const h=o.h,e=h.matrixWorld.elements,far=Math.hypot(e[12]-px,e[14]-pz)-o.r>L.w;
      if(far&&h.visible){h.visible=false;h.userData.mHid=1}else if(!far&&h.userData.mHid){h.visible=true;h.userData.mHid=0}}
    if(L.w>=1e9)wInks=[]}
  inkDirty=false}
let lastF=now(),fr=0;
X.on('prerender',()=>{const t=now(),ft=t-lastF;lastF=t;fr++;
  if(X.mode==='play'&&!D.hidden&&ft<250){gov.wT+=ft;gov.wN++;if(gov.wT>=2000){evalWin(gov.wN*1000/gov.wT);gov.wT=gov.wN=0}}else gov.wT=gov.wN=0;
  if(fr%3===0)inkPass();
  const sm=LV[gov.lvl].sm;if(sm>1){const P=X.puffs;for(let i=0;i<P.length;i++){if(i%sm&&P[i].life>0){P[i].life=0;P[i].s.visible=false}}}
  if(fpsEl&&fr%15===0)fpsEl.textContent=`${Math.round(1000/Math.max(1,ft))}fps · avg ${Math.round(gov.fps)} · L${gov.lvl} ${GN[gov.lvl]} · ${X.RES}p · ${gmode}`;
  sync(ft/1000)});
setLevel(gmode==='high'?0:gmode==='low'?3:gov.lvl);

/* ===== per-frame UI sync ===== */
let lastMode='';
function sync(dt){const m=X.mode;
  if(paused&&m!=='paused'){paused=false;ov.hidden=true;applyMute()}   // something else moved the game out of pause
  if(m!==lastMode){lastMode=m;pauseB.hidden=m!=='play';if(touch)muteB.hidden=m==='play'||m==='paused';/* phones: sound toggle lives in the pause menu during play */runB.hidden=!(touch&&m==='play');if(m!=='play'){closePick();if(m!=='paused'){setSprint(false);if(stId!==null){stId=null;restStick()}}}}
  if(sprint&&!X.keys.ShiftLeft)X.keys.ShiftLeft=1;
  if(dt>0&&rotT>0)rotT-=dt;
  const showRot=touch&&!rotOff&&portrait()&&(m==='intro'||(m==='play'&&rotT>0));if(rotEl.hidden===showRot)rotEl.hidden=!showRot;if(showRot)rotEl.classList.toggle('intro',m==='intro');
  const ci=canInstall(),i1=m==='intro'&&ci;if(instB.hidden===i1)instB.hidden=!i1;if(inst2.hidden===ci)inst2.hidden=!ci;
  if(vapeEl&&fr%5===0&&m==='play'){const c=wantC(),on=c!=null;if(vapeEl.classList.contains('mWant')!==on||(on&&swapEl&&swapEl.dataset.c!=c)){vapeEl.classList.toggle('mWant',on);
    if(swapEl){swapEl.dataset.c=on?c:'';swapEl.textContent=on?(touch?'TAP FOR ':'CLICK FOR ')+X.FLAV[c][2]:touch?'TAP ⟳':'◀ Q · E ▶'}}}}
X.on('win',()=>{closePick();setSprint(false)});
if(dbg)window.tmvMobile={gov,LV,setLevel,evalWin,pause,resume,openPick};
applyMute();labels();sync(0);
})();
