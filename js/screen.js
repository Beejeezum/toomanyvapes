/* screen mod: landscape + fullscreen like a video player.
   - Fullscreen button (top right): real fullscreen + landscape lock where the browser allows it (Android, desktop).
     iPhone browsers (Safari and Chrome are both WebKit there) can't fullscreen a page, so the button shows how to add
     the game to the Home Screen instead, which does open full screen.
   - On phones held upright during cutscenes or play, a full-screen "turn me sideways" card (icon only) covers the game.
     Tapping it dismisses it for this session for people who really want portrait. */
(()=>{const X=window.TMV;if(!X||X.screen)return;const D=document,touch=X.touch;
const root=D.documentElement,canFS=!!(root.requestFullscreen||root.webkitRequestFullscreen);
const isFS=()=>!!(D.fullscreenElement||D.webkitFullscreenElement);
const standalone=()=>{try{return matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const iOS=/iP(hone|od|ad)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

const css=D.createElement('style');css.textContent=`
#mRot{display:none!important}
#scFS{position:absolute;z-index:40;top:calc(12px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px));width:44px;height:44px;border:0;padding:0;cursor:pointer;
 background:#c9a36b;box-shadow:2px 3px 0 rgba(0,0,0,.35);rotate:2deg;display:grid;place-items:center}
#scFS svg{width:24px;height:24px}
#scFS[hidden]{display:none}
#scRot{position:fixed;inset:0;z-index:60;background:rgba(20,15,28,.93);display:grid;place-items:center;cursor:pointer}
#scRot[hidden]{display:none}
#scRot .ph{width:70px;height:120px;border:6px solid #fff7ea;border-radius:14px;position:relative;animation:scRot 2.2s ease-in-out infinite}
#scRot .ph:after{content:'';position:absolute;left:50%;bottom:6px;width:16px;height:4px;margin-left:-8px;border-radius:2px;background:#fff7ea}
#scRot .ar{position:absolute;margin-top:150px;font-size:34px;color:#b6ff3c}
@keyframes scRot{0%,25%{rotate:0deg}55%,100%{rotate:-90deg}}
@media (prefers-reduced-motion:reduce){#scRot .ph{animation:none;rotate:-90deg}}
#scIOS{position:fixed;inset:0;z-index:61;background:rgba(20,15,28,.9);display:grid;place-items:center;cursor:pointer}
#scIOS[hidden]{display:none}
#scIOS .card{background:#fff7ea;color:#15101d;padding:20px 22px;max-width:min(320px,86vw);rotate:-1.5deg;box-shadow:4px 5px 0 rgba(0,0,0,.35);text-align:center;font:700 16px/1.4 system-ui,sans-serif}
#scIOS .row{display:flex;justify-content:center;align-items:center;gap:12px;font-size:28px;margin-bottom:10px}`;
D.head.appendChild(css);

const ICON_EXPAND='<svg viewBox="0 0 24 24" fill="none" stroke="#15101d" stroke-width="2.6" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const ICON_SHRINK='<svg viewBox="0 0 24 24" fill="none" stroke="#15101d" stroke-width="2.6" stroke-linecap="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
const btn=D.createElement('button');btn.id='scFS';btn.setAttribute('aria-label','Full screen');btn.innerHTML=ICON_EXPAND;X.game.appendChild(btn);
const rot=D.createElement('div');rot.id='scRot';rot.hidden=true;rot.setAttribute('role','dialog');rot.setAttribute('aria-label','Turn your phone sideways');
rot.innerHTML='<div class="ph"></div><div class="ar">↻</div>';D.body.appendChild(rot);
const ios=D.createElement('div');ios.id='scIOS';ios.hidden=true;
ios.innerHTML='<div class="card"><div class="row"><span>⬆️</span><span>→</span><span>➕</span></div>Share, then Add to Home Screen, for full screen.</div>';D.body.appendChild(ios);

function enter(){const el=root,f=el.requestFullscreen||el.webkitRequestFullscreen;try{const p=f.call(el,{navigationUI:'hide'});if(p&&p.then)p.then(lock).catch(()=>{});else lock()}catch(e){}}
function lock(){try{const o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(()=>{})}catch(e){}}
function exit(){const f=D.exitFullscreen||D.webkitExitFullscreen;try{f&&f.call(D)}catch(e){}}
btn.addEventListener('click',e=>{e.stopPropagation();if(canFS){isFS()?exit():enter()}else if(iOS&&!standalone())ios.hidden=false});
ios.addEventListener('click',()=>{ios.hidden=true});
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>D.addEventListener(ev,()=>{btn.innerHTML=isFS()?ICON_SHRINK:ICON_EXPAND}));

let dismissed=false;rot.addEventListener('click',()=>{dismissed=true;rot.hidden=true});
const portrait=()=>innerHeight>innerWidth*1.05;
function upd(){btn.hidden=standalone()||(!canFS&&!iOS)||(touch&&X.mode==='play');// phones: out of the way during play (pause menu has add-to-home-screen)
  const cutOn=!!(D.getElementById('st')&&!D.getElementById('st').hidden);
  const show=touch&&!dismissed&&portrait()&&(cutOn||X.mode==='play'||X.mode==='cutscene');
  if(rot.hidden===show)rot.hidden=!show}
X.on('frame',()=>{if((X._scT=(X._scT||0)+1)%10===0)upd()});addEventListener('resize',upd);upd();
X.screen={enter,exit,get fullscreen(){return isFS()}};
})();
