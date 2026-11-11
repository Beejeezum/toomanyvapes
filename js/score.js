/* score mod: the soundtrack (audio/score/*.mp3) driven by the story.
   Title theme on the start screen, a groove per chapter district, chase / conga takeovers, a fire sting on boost,
   cutscene underscores, credits on the win screen. As the town gets hooked the music slowly detunes and drags (haze). */
(()=>{const X=window.TMV;if(!X||X.score)return;
const F={title:'01_breathe_easy',ohno:'02_oh_no',sal:'03_sals_got_a_problem',down:'04_get_out_there_kid',park:'05_word_of_mouth',
  conga:'06_conga_line',beach:'07_home_turf',chase:'08_vape_police',fire:'09_on_fire',farm:'10_fresh_lungs',foggy:'11_too_foggy_to_surf',
  franchise:'12_franchise_the_lungs',zero:'13_zero',credits:'14_another_container'};
const PLAY={1:'down',2:'park',3:'beach',4:'farm',5:'zero'},IN={1:'ohno',2:'sal',3:'sal',4:'ohno',5:'franchise'},OUT={1:'sal',2:'sal',3:'franchise',4:'foggy',5:'credits'};
const BASE=X.touch?.4:.5,UNDER=.22;
const deck={};
function get(k){if(deck[k])return deck[k];const a=new Audio('audio/score/'+F[k]+'.mp3');a.loop=k!=='fire';a.preload='auto';a.volume=0;a.preservesPitch=a.mozPreservesPitch=a.webkitPreservesPitch=false;
  return deck[k]={a,v:0,t:0}}
// iOS only lets an <audio> start from a gesture: prime every deck on the first tap
let primed=false;addEventListener('pointerdown',()=>{if(primed)return;primed=true;for(const k in F){const d=get(k);d.a.play().then(()=>{if(d.t<=0)d.a.pause()}).catch(()=>{})}},true);

let chap=1,phase='title',cut=false,stingT=0,lastBoost=0,cur=null;
X.on('chapter',(n,p)=>{chap=n;phase=p});X.on('cutscene',on=>{cut=on});
X.on('start',()=>{if(phase==='title')phase='in'});X.on('win',()=>{phase='won'});

function pick(){const m=X.mode;
  if(m==='intro')return['title',BASE];
  if(m==='won'||phase==='won')return['credits',BASE];
  if(cut||phase==='in'||phase==='out'){const k=phase==='out'?OUT[chap]:IN[chap];return[k||'ohno',UNDER]}
  if(X.heat>.6)return['chase',BASE];
  if(X.crowds&&X.crowds.conga>=5)return['conga',BASE];
  return[PLAY[chap]||'down',BASE]}

let acc=0;
X.on('frame',dt=>{dt=dt||1/60;acc+=dt;
  const boost=X.act&&X.act.boost>0;if(boost&&!lastBoost&&X.mode==='play'){const d=get('fire');d.a.currentTime=0;d.t=BASE;d.a.play().catch(()=>{});stingT=d.a.duration&&isFinite(d.a.duration)?Math.min(d.a.duration,10):8}lastBoost=boost;
  stingT=Math.max(0,stingT-dt);if(!stingT&&deck.fire)deck.fire.t=0;
  if(acc>.25){acc=0;const[k,v]=pick();if(k!==cur){if(cur&&deck[cur])deck[cur].t=0;cur=k;const d=get(k);if(d.a.paused){d.a.play().catch(()=>{})}}
    deck[cur].t=X.muted?0:v*(stingT?.35:1)}
  // haze: the more of the town is hooked, the slower and more detuned everything plays
  const hz=Math.min(1,(X.used||0)/5000),rate=1-hz*.045;
  for(const k in deck){const d=deck[k],step=dt*(d.t>d.v?.9:.6);d.v+=Math.max(-step,Math.min(step,d.t-d.v));
    if(Math.abs(d.a.volume-d.v)>.004)d.a.volume=Math.max(0,Math.min(1,d.v));
    if(k!=='fire'&&Math.abs(d.a.playbackRate-rate)>.004)d.a.playbackRate=rate;
    if(d.v<=.002&&d.t===0&&!d.a.paused)d.a.pause()}});
X.score={get track(){return cur}};
})();
