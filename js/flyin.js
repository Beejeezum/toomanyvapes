/* flyin mod: the opening's last shot is a Runway fly-through that ends exactly on the game's first frame
   (Cloud Kingz from the street, captured from the engine at LAND). While that shot plays, the player is parked
   at LAND under the cutscene; over the shot's last second the film dressing (letterbox bars, grain, vignette,
   sepia) steps away, and when the clip ends the cutscene vanishes in one frame onto the identical live view.
   The sprite hands (js/hands.js) rise in on their own when play starts. Skipping the shot lands in the same place. */
(()=>{const X=window.TMV;if(!X||X.flyin)return;const D=document;
const SHOT='ch1_fly',LAND={px:0,pz:8,yaw:Math.PI,pitch:.03},DRESS_OUT=.9;

const css=D.createElement('style');css.textContent=`
#st.fly .fr{inset:0!important;transform:none!important;animation:none!important}
#st.fly .bars:before,#st.fly .bars:after{transition:transform .5s steps(5,end)}
#st.fly.land .bars:before{transform:translateY(-100%)}#st.fly.land .bars:after{transform:translateY(100%)}
#st.fly .fr,#st.fly .gr,#st.fly .du,#st.fly .vg{transition:filter .6s steps(6,end),opacity .6s steps(6,end)}
#st.fly.land .fr{filter:none!important}
#st.fly.land .gr,#st.fly.land .du,#st.fly.land .vg{opacity:0!important}
#st.fly.land .cap,#st.fly.land .sk{opacity:0}
#st.fly.cut{transition:none!important}
@media (prefers-reduced-motion:reduce){#st.fly .bars:before,#st.fly .bars:after,#st.fly .fr,#st.fly .gr,#st.fly .du,#st.fly .vg{transition:none}}`;
D.head.appendChild(css);

let on=false,landed=false,parked=false,landedOnce=false;
function park(){X.px=LAND.px;X.pz=LAND.pz;X.yaw=LAND.yaw;X.pitch=LAND.pitch;parked=true}
function st(){return D.getElementById('st')}
function clipName(v){return v&&!v.hidden?(v.currentSrc||v.src||'').split('/').pop().split('?')[0].replace(/\.\w+$/,''):''}

X.on('prerender',dt=>{
  const s=st(),v=s&&s.querySelector('video'),playing=!!(s&&!s.hidden&&clipName(v)===SHOT);
  if(playing){
    if(!on){on=true;landed=false;s.classList.add('fly');park()}
    // keep the player parked under the cutscene so the frame behind matches the clip's last frame
    if(X.mode!=='play'){X.px=LAND.px;X.pz=LAND.pz;X.yaw=LAND.yaw;X.pitch=LAND.pitch}
    const left=(v.duration||8)-(v.currentTime||0);
    if(!landed&&left<DRESS_OUT){landed=true;s.classList.add('land','cut')}
  }else if(on){on=false;landedOnce=true;if(s){s.classList.add('cut');setTimeout(()=>{s.classList.remove('fly','land','cut')},400)}}
});
// a skipped or missing fly shot still starts chapter 1 facing the shop
X.on('chapter',(n,p)=>{if(n===1&&p==='in'){parked=false;landedOnce=false}
  if(n===1&&p==='play'&&!landedOnce&&!parked)park()});
X.flyin={LAND,SHOT};
})();
