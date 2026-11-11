/* story mod: the run is five chapters (see docs/story-bible.md, assets/story/script.json).
   Chain: "in" cutscene → (ch1: container intro) → play starts at once under a chapter title card while Sal phones in the goal
   (polaroid + subtitle, sal_goal_N) → hook N townsfolk of the district's kinds; each one hooked joins your conga line as a
   carried customer → bring them back to Cloud Kingz: walking into the drop-off on the shop's sidewalk sends them in through the
   door one by one, and each counts as it goes in (+ beat the chapter boss if required) → big paper check stamp + sal_clear →
   "out" cutscene → next chapter. Ch5: empty the container and beat Detecto.
   The objective is shown without words: a row of cut-paper goal tokens under the vapes counter (one silhouette per creature
   that counts; half-filled and wiggling while that customer is following you, stamped when they walk in; a crowned boss token,
   a draining container in ch5), a paper arrow at the screen edge toward the district while outside it (toward the shop once
   the whole order is following you), a paper chevron to the nearest creature that still counts, a bobbing paper tag over
   eligible creatures within ~20 m, and while you carry anyone a clay arrow over the shop door, a felt ring on the sidewalk and
   the cloud sign blinking (held frames). Sal phones to bring them back (first follower, full order, then at most every 40 s
   while you walk away with them), counts them in live at the door ("Alright! That's one!"), nudges (sal_nudge) if you wander
   off, and greets you in person outside Cloud Kingz.
   Cutscenes are full-screen stills (or short muted clips, shot.vid) with a 16mm film treatment, VO + subtitles.
   Missing art/VO is tolerated: soft placeholder backdrop, caption held for its reading time.
   Events for other mods: chapter(n, 'in'|'play'|'out'), cutscene(true|false) around every full-screen cutscene,
   vo(true|false) while any story voice line is audible (cutscene lines, calls, Sal's live count, his greeting).
   TMV.story = {chapter, phase, goal, progress, hooked (delivered), carried, drop, play(shots, done), script}.
   #dbg: window.tmvs = {chapter(n), win(), hook() (nearest eligible creature joins the line), home() (to the drop-off), skip(),
   greet(), nudge(), s}. */
(()=>{const X=window.TMV;if(!X)return;const $=X.$,T=X.T,PI=Math.PI,clamp=X.clamp,rand=X.rand;
const RMq=matchMedia('(prefers-reduced-motion: reduce)');

/* ================= SCRIPT (fetched; inline copy if that fails) ================= */
const L=(img,who,vo,cap,hold)=>({img,who,vo,cap,hold});
const C=(vo,cap,pic,crop)=>({who:'SAL',vo,cap,pic,crop});
const CROP={scared:[50,14,305],phone:[46,36,337],rich:[45,32,320]};
let S={chapters:[
  {id:1,title:'The Typo',district:'downtown',in:[{img:'ch1_v2_1',vid:'ch1_v2_1',aud:true,hold:6},
    {img:'ch1_v2_2',vid:'ch1_v2_2',aud:true,who:'BRO',vo:'bro_ch1_in_3',cap:"Duuude. That's like… a lot of vapes."},
    {img:'ch1_v2_3',vid:'ch1_v2_3',aud:true,who:'SAL',vo:'sal_ch1_phone',cap:'Fifty! I said FIFTY! Five, zero! Not five THOUSAND! …Hello? HELLO?!'},
    {img:'ch1_v2_4',vid:'ch1_v2_4',aud:true,who:'SAL',vo:'sal_ch1_kid',cap:"Kid! Oh, thank God you're here. I gotta sell all of these by Friday… or I'm closing the shop."},
    {img:'ch1_v2_5',vid:'ch1_v2_5',aud:true,subs:[{t:0,who:'SAL',cap:'So get out there. Get this town HOOKED!'},{t:3.3,who:'BRO',cap:'Say less, boss. I got you.'}],vo:'sal_ch1_go'}],
   call:C('sal_goal_1',"Kid! Start right here, downtown. Hook me five customers and bring 'em back to the shop. Go!",'ch1_in_2',CROP.scared),
   out:[L('ch1_out_1','SAL','sal_ch1_out_1',"They're… coming back? They're coming BACK!")]},
  {id:2,title:'Word of Mouth',district:'park',in:[L('ch2_in_1','BRO','bro_ch2_in_1',"Park's full of grandmas, man. Grandmas love me.")],
   call:C('sal_goal_2',"The park, kid! Hook five more, grandmas, joggers, whoever, and walk 'em back here. And watch out for the opera lady!",'ch2_out_1',CROP.phone),
   out:[L('ch2_out_1','SAL','sal_ch2_out_1',"Kid! I sold out of mango! I've never sold out of ANYTHING!")]},
  {id:3,title:'Home Turf',district:'beach',in:[L('ch3_in_1','BRO','bro_ch3_in_1','My beach, bro. Home turf.'),L('ch3_in_2','SAL','sal_ch3_in_2','Watch out for cops. And the big guy at the gym.')],
   call:C('sal_goal_3',"Beach, kid! Hook five more and bring 'em back to the shop. And take down the big guy at the gym!",'ch2_out_1',CROP.phone),
   out:[L('ch3_out_1','SAL','sal_ch3_out_1',"Two chains, kid. TWO. We're franchising.")]},
  {id:4,title:'Fresh Lungs',district:'farm',in:[L('ch4_in_1','SAL','sal_ch4_in_1',"We're out of people, kid. …What about the cows?"),L('ch4_in_2','BRO','bro_ch4_in_2','…The cows, dude?')],
   call:C('sal_goal_4',"The farm, kid. Hook five and bring 'em home. …Yeah. Cows count.",'ch3_out_1',CROP.rich),
   out:[L('ch4_out_1','BRO','bro_ch4_out_1',"Can't even see the waves anymore, man.")]},
  {id:5,title:'Zero',district:'square',in:[L('ch5_in_1','SAL','sal_ch5_in_1','Last stretch! EMPTY THE CONTAINER!')],
   call:C('sal_goal_5','Empty the container, kid! Every last one! And somebody shut up that smoke detector!','ch3_out_1',CROP.rich),out:[]}],
 end:[L('end_1','SAL','sal_end_1','Zero. You did it, kid… So, uh. I ordered fifty thousand.'),L('end_2','BRO','bro_end_2','…Bro.')],
 calls:{clear:C('sal_clear',"That's the district, kid! Look at 'em all! LOOK at 'em!",'ch2_out_1',CROP.phone),
  back1:C('sal_back_1',"Kid! Bring 'em back to the shop! Bring 'em HERE!",'ch1_in_2',CROP.scared),
  back2:C('sal_back_2',"You got customers? Walk 'em over, kid! Cloud Kingz! I'm right here!",'ch2_out_1',CROP.phone),
  back3:C('sal_back_3',"Kid, kid, kid! Don't leave 'em out there! Bring 'em to the store!",'ch1_in_2',CROP.scared),
  enough:C('sal_enough',"That's enough, kid! That's the whole order! Bring 'em home, I'm holding the door!",'ch3_out_1',CROP.rich),
  nudge:C('sal_nudge','Kid, the other way! Follow the cloud!','ch1_in_2',CROP.scared),
  hey:C('sal_hey',"Hey! Kid! You lost? Here's the deal.",'ch2_out_1',CROP.phone)},
 live:{alright:[{vo:'sal_alr_1',cap:'Alright!'},{vo:'sal_alr_2',cap:'ALRIGHT!!'},{vo:'sal_alr_3',cap:'Alright, alright, ALRIGHT!'},{vo:'sal_alr_4',cap:'Come in, come in! Welcome!'}],
  count:[{vo:'sal_n1',cap:"Alright! That's one!"},{vo:'sal_n2',cap:"ALRIGHT! That's two!"},{vo:'sal_n3',cap:'THREE!'},{vo:'sal_n4',cap:'Four! Ha!'},{vo:'sal_n5',cap:'FIVE! Yes! YES!'}]},
 districts:{downtown:{x0:-62,x1:62,z0:-62,z1:62},park:{x0:-142,x1:-66,z0:-76,z1:76},beach:{x0:-150,x1:150,z0:-150,z1:-78},farm:{x0:70,x1:134,z0:-52,z1:52},square:{x0:-16,x1:16,z0:-16,z1:16}}};
const INLINE=S;
const CH=n=>S.chapters.find(c=>c.id===n)||S.chapters[n-1]||{in:[],out:[]};
const CALL=k=>(S.calls&&S.calls[k])||INLINE.calls[k];
const LIVE=k=>(S.live&&S.live[k]&&S.live[k].length?S.live[k]:INLINE.live[k]).map(f=>f.vo);
const GOALCALL=n=>CH(n).call||(INLINE.chapters[n-1]||{}).call;
const DIST=k=>(S.districts&&S.districts[k])||{x0:-1e9,x1:1e9,z0:-1e9,z1:1e9};
const inD=(k,x,z)=>{const d=DIST(k);return x>=d.x0&&x<=d.x1&&z>=d.z0&&z<=d.z1};
fetch('assets/story/script.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.chapters)&&j.chapters.length>=5){S=j;preload()}}).catch(()=>{});

/* ================= TUNING (target: ~12-15 min run = ~1.5-2 min play per chapter + ~2 min of cutscenes) =================
   goal: creatures of the district's kinds (count) to hook inside the district. need: the chapter boss must be beaten too
   (the ch2 diva is optional, a hazard Sal warns about). Vape use follows the goal, not raw rips: each chapter walks the
   count from where it started down to its cap in step with goal progress (rips that run ahead are partly refunded,
   rips that lag take a bit extra), so a boss's huge lungs can't eat the next chapter's stock. floor is a hard safety
   net; on clear the count drops to at most cap (word of mouth sells the rest through the shop).
   Count path ≈ 5000 → 4400 → 3600 → 2800 → 2000 → 0.
   Ch5 runs on a clock instead: ~90 s of frantic vaping (everyone swarms you) to reach 250, then Detecto takes the rest. */
const PLAN={
 1:{goal:5,boss:null,     need:0,floor:4200,cap:4400,mood:'scared',col:0xff3fa4,pal:'#f6a6c1',at:[0,0],
    count:['worker','grandma','kid','cop','jogger'],icons:['worker','kid','cop','grandma','worker'],extra:[]},
 2:{goal:5,boss:'diva',   need:0,floor:3400,cap:3600,mood:'happy', col:0xb6ff3c,pal:'#bfdc5a',at:[-104,4],
    count:['grandma','jogger','tuba'],icons:['grandma','jogger','grandma','tuba','grandma'],extra:[['grandma',7],['jogger',3],['dog',2]]},
 3:{goal:5,boss:'prime',  need:1,floor:2600,cap:2800,mood:'happy', col:0x5fd4ff,pal:'#9ccfee',at:[0,-100],
    count:['gym','jogger','cop'],icons:['gym','jogger','gym','cop','gym'],extra:[['gym',3],['jogger',3],['cop',2],['dog',2]]},
 4:{goal:5,boss:null,     need:0,floor:1800,cap:2000,mood:'greedy',col:0xffb02e,pal:'#eebd4b',at:[102,-6],
    count:['cow','chicken','cat','dog'],icons:['cow','chicken','cow','cat','dog'],extra:[['cat',3],['dog',3],['chicken',2],['cow',1]]},
 5:{goal:0,boss:'detecto',need:1,floor:0,   cap:0,   mood:'greedy',col:0xff3fa4,pal:'#f6a6c1',at:[0,-6],
    count:null,icons:[],extra:[['worker',6],['grandma',3],['kid',3],['dog',2]]}};
const START=[5000,5000,4400,3600,2800,2000];   // count ceiling when a chapter is entered (debug jumps)
const DETECTO_FLOOR=250,CH5_SECS=90;           // in ch5 the last 250 only go once Detecto is beaten (his defeat drains 700)
const TAG_R=20,NUDGE_OUT=12,NUDGE_CD=45,SAL_R=3.5,SAL_CD=20,BOSS_DELAY=2.3;
/* delivery (ch1-4): hooking a creature that counts makes it a carried customer (it joins the conga for good); walking into the
   drop-off zone on the Cloud Kingz sidewalk sends carried customers one by one through the door, and only then do they count.
   Every district is a 13-17 s walk from the shop (measured), so all four chapters deliver to the shop itself.
   DROP: ring centre, ring radius, trigger radius round the centre, the path each customer walks in (last leg squeezes past Sal). */
const DROP={x:-.3,z:15.2,r:1.75,trig:4.6,path:[[1.0,15.3],[1.15,16.75]],reach:32};
const DEL_GAP=[.45,.6],BACK_CD=40,BACK_AWAY=5;

/* ================= CUT-PAPER ICONS (24x24 silhouettes; .k = knocked-out detail in the token's paper colour) ================= */
const SK='fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const GYM='<circle cx="12" cy="5.4" r="2.9"/><path d="M6.2 9.6Q12 7.8 17.8 9.6L15.6 21.8H8.4Z"/><path '+SK+' stroke-width="3" d="M7 10.4 3.4 12.4 2.8 6.8M17 10.4l3.6 2 .6-5.6"/><circle cx="2.9" cy="5" r="2.1"/><circle cx="21.1" cy="5" r="2.1"/>';
const ICON={
 worker:'<circle cx="12" cy="6" r="3.6"/><path d="M5 22.5 6 13.5Q6.3 11 9 11h6q2.7 0 3 2.5l1 9Z"/><path class="k" d="M12 11.6l1.2 1.6-.6 6.2h-1.2l-.6-6.2Z"/>',
 grandma:'<circle cx="12" cy="3.3" r="2.1"/><circle cx="12" cy="7.5" r="3.3"/><path d="M5.5 22.5 8.4 12.4Q12 10.6 15.6 12.4L18.5 22.5Z"/><path '+SK+' stroke-width="1.7" d="M20.2 22.4v-9q0-1.9-1.9-1.7"/>',
 kid:'<path d="M8.2 8.8Q8.6 4.4 12 4.4t3.8 4.4l2.8.3Z"/><circle cx="12" cy="10" r="3"/><path d="M7.6 22.5 8.3 15.4Q12 13 15.7 15.4l.7 7.1Z"/>',
 cop:'<path d="M7 6.4h10l-.8-3Q12 1.6 7.8 3.4Z"/><rect x="6.2" y="6" width="11.6" height="1.5" rx=".6"/><circle cx="12" cy="9.8" r="3.1"/><path d="M5 22.5 6 15.3Q12 12.4 18 15.3l1 7.2Z"/><circle class="k" cx="14.6" cy="17.4" r="1.2"/>',
 jogger:'<circle cx="14.6" cy="4.2" r="2.6"/><path '+SK+' stroke-width="2.6" d="M13.6 7.6 11 14.2l3.4 3.6-.8 4.4M11 14.2l-3 3.4-3.2-.6M13 9.2l3.4 2.6 2.4-1M13 9.2 9.6 10.4 8 13"/>',
 gym:GYM,prime:GYM,
 tuba:'<circle cx="15" cy="7.5" r="5.6"/><circle class="k" cx="15" cy="7.5" r="3.1"/><path '+SK+' stroke-width="3.2" d="M11.5 11.5Q5.5 13 6.6 18.2t6.8 3.4"/>',
 cow:'<rect x="2.5" y="8.5" width="15" height="8" rx="3"/><rect x="15.4" y="5.4" width="6.6" height="6.6" rx="2.2"/><path '+SK+' stroke-width="1.4" d="M16.2 5.8 14.8 3.4M21.2 5.8l1.4-2.4"/><rect x="4" y="15" width="2.3" height="6.5" rx=".8"/><rect x="13" y="15" width="2.3" height="6.5" rx=".8"/><circle class="k" cx="7" cy="11.6" r="1.9"/><circle class="k" cx="12.3" cy="13" r="1.3"/>',
 chicken:'<ellipse cx="11" cy="14" rx="7" ry="5.4"/><circle cx="17" cy="8" r="3"/><path d="M15.6 5.4 16.4 3l1 1.6 1-1.8.4 2.6ZM19.8 7.2 23 8.5 19.8 9.8ZM4.8 12.2 1.6 7.6l5.2 2.6Z"/><path '+SK+' stroke-width="1.3" d="M9.4 19v3.2M13 19v3.2"/>',
 cat:'<path d="M4.6 9.4 5.4 2.8 10 6.8Q12 6.2 14 6.8L18.6 2.8l.8 6.6Q20.6 17.6 12 18.4 3.4 17.6 4.6 9.4Z"/><path class="k" d="M8.2 11.4q1.4-1 2.6 0-1.3.9-2.6 0ZM13.2 11.4q1.4-1 2.6 0-1.3.9-2.6 0Z"/><path '+SK+' stroke-width="2.2" d="M12 18.4v3.6M8 22.4h8"/>',
 dog:'<circle cx="12" cy="11" r="6.2"/><ellipse cx="5.4" cy="10.6" rx="2.4" ry="4.8" transform="rotate(14 5.4 10.6)"/><ellipse cx="18.6" cy="10.6" rx="2.4" ry="4.8" transform="rotate(-14 18.6 10.6)"/><ellipse class="k" cx="12" cy="14.6" rx="3.2" ry="2.4"/><circle cx="12" cy="13.6" r="1.1"/><circle class="k" cx="9.6" cy="9.8" r=".9"/><circle class="k" cx="14.4" cy="9.8" r=".9"/>',
 diva:'<path d="M7 7.4Q12-.6 17 7.4Z"/><circle cx="12" cy="8.8" r="3.2"/><path d="M4 22.5 8.4 13.4Q12 11.4 15.6 13.4L20 22.5Z"/><path '+SK+' stroke-width="1.3" d="M19.4 3.8v5.6"/><circle cx="18.2" cy="9.6" r="1.5"/>',
 detecto:'<circle cx="12" cy="12" r="9.4"/><circle class="k" cx="12" cy="12" r="6.2"/><circle cx="12" cy="12" r="3.7"/><circle class="k" cx="15.8" cy="8.4" r="1.15"/>'};
const svg=(vb,body,cls)=>`<svg viewBox="${vb}" aria-hidden="true"${cls?' class="'+cls+'"':''}>${body}</svg>`;
const CROWN=svg('0 0 24 14','<path d="M2 12.5 3.2 3.4 8.2 7.8 12 1.2 15.8 7.8 20.8 3.4 22 12.5Z"/><circle class="k" cx="12" cy="9.2" r="1.4"/>','cr');
const CTN=svg('0 0 44 26','<rect class="sh" x="1" y="2" width="42" height="22" rx="1.6"/><rect class="in" x="3.6" y="4.6" width="36.8" height="16.8"/><clipPath id="stclv"><rect class="lv" x="3.6" y="4.6" width="36.8" height="16.8"/></clipPath><g clip-path="url(#stclv)">'+
  [...Array(24)].map((_,i)=>`<rect x="${(4.4+(i%8)*4.5).toFixed(1)}" y="${(5.2+Math.floor(i/8)*5.5).toFixed(1)}" width="3.6" height="4.8" rx=".8" fill="${['#f6a6c1','#bfdc5a','#9ccfee','#eebd4b','#bba7e6','#f39a5f'][(i*5+Math.floor(i/8))%6]}"/>`).join('')+
  '</g><path class="rb" d="M22 4.6v16.8M8 2v22M36 2v22"/>','ctn');
const ARROW=svg('0 0 40 50','<path d="M20 2 38.5 22.5H27.4V47.5H12.6V22.5H1.5Z"/>');
const CHEV=svg('0 0 30 22','<path d="M1.5 5.5 15 20 28.5 5.5 22.6 1.6 15 10 7.4 1.6Z"/>');
const CHECK=svg('0 0 100 100','<path d="M6 54 22 38.5 40 56.5 79 11 95 25.5 41 87Z"/>');
const PHONE=svg('0 0 24 24','<path d="M6.6 2.6 9.8 6.4 7.9 9.2Q9.6 12.9 14.8 16.1L17.6 14.2 21.4 17.4 19.6 21Q15.6 22.6 9.9 17.2 3.6 11.2 3.4 5.4Z"/>');

/* ================= CSS + DOM ================= */
const css=document.createElement('style');css.textContent=`
#st{position:absolute;inset:0;z-index:30;background:#120d0a;overflow:hidden;cursor:pointer;opacity:0;transition:opacity .3s steps(3,end)}
#st.on{opacity:1}
#st .fr{position:absolute;inset:-6px;overflow:hidden;filter:sepia(.12) saturate(.9) contrast(.95) blur(.5px);will-change:transform}
#st.lite .fr{filter:sepia(.12) saturate(.9) contrast(.95)}
#st .ph{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#f3c9a8 0%,#c98a7a 38%,#5a3a4a 75%,#2a1a24 100%);animation:stph 12s ease-in-out infinite alternate}
@keyframes stph{from{transform:scale(1.04)}to{transform:scale(1.12) translate(1%,-1%)}}
#st img,#st video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 40%}
#st img.kb{animation:stkb 9s ease-out forwards}
#st img.soft{filter:blur(7px) brightness(.72) saturate(.8);transform:scale(1.08)}
@keyframes stkb{from{transform:scale(1.1) translate(1.5%,1%)}to{transform:scale(1) translate(0,0)}}
#st canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#st .gr{mix-blend-mode:overlay;opacity:.16}
#st .du{opacity:.7}
#st .vg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 52%,rgba(18,10,6,.38) 78%,rgba(10,6,4,.72) 100%)}
#st .cap{position:absolute;left:50%;bottom:calc(7vh + 18px);transform:translateX(-50%);width:min(900px,90vw);text-align:center;font:800 clamp(16px,2.6vw,26px)/1.25 system-ui,sans-serif;color:#fff;text-shadow:2px 2px 0 #000,-2px 2px 0 #000,2px -2px 0 #000,-2px -2px 0 #000,0 3px 8px rgba(0,0,0,.8);text-wrap:balance}
#st .cap b{color:var(--hot,#ff3fa4);margin-right:.4em}
#st .sk{position:absolute;right:16px;top:calc(7vh + 10px);font:700 16px system-ui,sans-serif;color:#fff;opacity:.45}
#st .bars:before,#st .bars:after{content:'';position:absolute;left:0;right:0;height:7vh;background:#000;z-index:2}
#st .bars:before{top:0}#st .bars:after{bottom:0}
#stt{position:absolute;inset:0;z-index:25;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;text-align:center;opacity:0;padding-bottom:12vh}
#stt b{font-family:var(--display,Impact,sans-serif);font-weight:400;font-size:clamp(70px,17vw,170px);line-height:.85;color:var(--paper,#fff7ea);text-shadow:6px 6px 0 var(--hot,#ff3fa4),10px 10px 0 var(--ink,#140f1c)}
#stt i{font-style:normal;font-family:var(--display,Impact,sans-serif);font-size:clamp(24px,5vw,50px);color:var(--lime,#b6ff3c);text-shadow:3px 3px 0 var(--ink,#140f1c);margin-top:10px;rotate:-2deg}
#stt.go{animation:sttc 1.9s steps(1,end) forwards}
#stt.go b{animation:stts 1.9s steps(1,end) forwards}
#stt.go i{animation:stts 1.9s steps(1,end) .1s both}
@keyframes sttc{0%{opacity:0}6%{opacity:1}84%{opacity:1}90%{opacity:.5}96%,100%{opacity:0}}
@keyframes stts{0%{transform:scale(2.6) rotate(-8deg)}6%{transform:scale(1.5) rotate(-6deg)}12%{transform:scale(.9) rotate(-2deg)}18%{transform:scale(1.05) rotate(-4deg)}24%,46%{transform:scale(1) rotate(-3deg)}47%,70%{transform:scale(1.01) rotate(-2.4deg)}71%,100%{transform:scale(1.02) rotate(-3.3deg)}}
#game #panic{display:none!important}
#stg{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:6px;pointer-events:none;min-height:30px}
#stg[hidden]{display:none!important}
#stch{font-weight:800;font-size:10px;letter-spacing:.06em;padding:1px 4px;border:1.5px solid var(--lime,#b6ff3c);color:var(--lime,#b6ff3c);margin-right:4px}
#stg .tks{display:flex;align-items:center;gap:3px}
#stg .tk{position:relative;flex:none;width:27px;height:29px;display:grid;place-items:center;color:#5d4a3a;--tkp:#d9c6a3;background:#d9c6a3;clip-path:var(--cp,none);rotate:var(--r,0deg);opacity:.62}
#stg .tk>svg{width:20px;height:20px;fill:currentColor;opacity:.5}
#stg .tk svg .k{fill:var(--tkp)}
#stg .tk.on{background:var(--bg,#f6a6c1);--tkp:var(--bg,#f6a6c1);color:#2b2233;opacity:1}
#stg .tk.on>svg{opacity:1}
#stg .tk.cy,#game #stg .tk.cy{opacity:1;color:#2b2233;background:var(--pp-grain,none) 0 0/128px 128px,linear-gradient(0deg,var(--bg,#f6a6c1) 0 46%,#fbf5e6 46% 100%);--tkp:#fbf5e6;animation:stcy .5s steps(1,end) infinite}
#stg .tk.cy>svg,#game #stg .tk.cy>svg{opacity:.88}
@keyframes stcy{0%{rotate:calc(var(--r,0deg) - 5deg);translate:0 0}50%{rotate:calc(var(--r,0deg) + 4deg);translate:0 -1px}}
@media (prefers-reduced-motion:reduce){#stg .tk.cy{animation:none}}
#stg .tkb{position:relative;flex:none;margin-left:5px;padding-top:7px}
#stg .tkb .tk{width:36px;height:38px}#stg .tkb .tk>svg{width:28px;height:28px}
#stg .tkb .cr{position:absolute;left:50%;top:-1px;width:24px;height:14px;margin-left:-12px;fill:#eebd4b;z-index:1;rotate:-6deg;filter:drop-shadow(0 1px 0 rgba(60,38,16,.45))}
#stg .tkb .cr .k{fill:#e4574d}
#stg .tkb.on .cr{fill:#f6c935}
#stg .tk.ctn{width:60px;height:36px;opacity:1;background:#c69c6d;--tkp:#c69c6d}
#stg .tk.ctn>svg{width:53px;height:31px;opacity:1}
#stg svg.ctn .sh{fill:#e4574d}#stg svg.ctn .in{fill:#3b2614}#stg svg.ctn .rb{stroke:rgba(43,34,51,.35);stroke-width:1.2;fill:none}
#stg svg.ctn .lv{transition:y .4s steps(4,end),height .4s steps(4,end)}
.stui{position:absolute;left:0;top:0;pointer-events:none;z-index:4;opacity:0;will-change:transform,opacity}
#starw{width:40px;height:50px;margin:-25px 0 0 -20px}
#starw svg{width:100%;height:100%;fill:var(--stc,#f6a6c1);filter:drop-shadow(0 0 1.2px #fff8ea) drop-shadow(0 0 .6px #fff8ea) drop-shadow(0 3px 2px rgba(45,28,12,.45))}
#stchev{width:26px;height:19px;margin:-10px 0 0 -13px}
#stchev svg{width:100%;height:100%;fill:#fff7ea;filter:drop-shadow(0 0 1px rgba(43,34,51,.9)) drop-shadow(0 2px 1.5px rgba(45,28,12,.5))}
#stk{position:absolute;left:50%;top:60%;width:clamp(150px,30vmin,260px);height:clamp(150px,30vmin,260px);margin:calc(clamp(150px,30vmin,260px) / -2) 0 0 calc(clamp(150px,30vmin,260px) / -2);z-index:24;pointer-events:none;opacity:0}
#stk .disc{position:absolute;inset:0;background:#79c26a;clip-path:var(--cp,circle(48%))}
#stk svg{position:absolute;inset:16%;width:68%;height:68%;fill:#fbf5e6;filter:drop-shadow(0 3px 0 rgba(43,34,51,.35))}
#stc{position:absolute;right:max(14px,env(safe-area-inset-right,0px));top:calc(max(12px,env(safe-area-inset-top,0px)) + 50px);z-index:22;display:flex;flex-direction:column;align-items:flex-end;gap:0;pointer-events:none;max-width:calc(100vw - 28px)}
#stc .fr{position:relative;flex:none;width:clamp(74px,11vmin,104px);background:#fbf5e6;padding:6px 6px 16px;box-shadow:0 3px 6px rgba(0,0,0,.35);rotate:2deg}
#stc .pic{width:100%;aspect-ratio:1;background:#5a3a4a center/cover no-repeat;filter:sepia(.15) saturate(.95)}
#stc .hd{position:absolute;left:-12px;top:-10px;width:28px;height:28px;display:grid;place-items:center;background:#6cc9bf;border-radius:50%;rotate:-12deg;z-index:1}
#stc .hd svg{width:17px;height:17px;fill:#2b2233}
#stc.ring .hd{animation:string .5s steps(1,end) 3}
@keyframes string{0%{rotate:-22deg}25%{rotate:4deg}50%{rotate:-18deg}75%{rotate:0deg}}
#stc .cap{position:relative;margin-top:-4px;margin-right:8px;max-width:min(320px,44vw);font:700 clamp(13px,1.6vw,16px)/1.3 system-ui,sans-serif;color:#2b2233;background:#fbf5e6;padding:.55em .85em .5em;rotate:-1deg;text-wrap:pretty}
#stc .cap b{display:inline-block;margin-right:.4em}
#stc.live{left:0;right:0;top:auto;bottom:calc(64px + env(safe-area-inset-bottom,0px));justify-content:center;flex-direction:row;max-width:none}
#stc.live .fr{display:none}#stc.live .cap{max-width:min(620px,calc(100vw - 32px));font-size:clamp(15px,2.2vw,21px);text-align:center}
@media (max-width:520px){#stg .tk{width:22px;height:24px}#stg .tk>svg{width:16px;height:16px}#stg .tkb .tk{width:29px;height:31px}#stg .tkb .tk>svg{width:22px;height:22px}#stc{top:auto;bottom:calc(150px + env(safe-area-inset-bottom,0px))}}
@media (prefers-reduced-motion:reduce){#stt.go b{animation:none}#st img.kb,#st .ph{animation:none}#stc.ring .hd{animation:none}}
#intro .loc{font:800 13px system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:var(--lime,#b6ff3c);opacity:.9}
#mPick,#mPickBg,#mInst,#mTip,#news,#hint,#right,#vape,#prompt,#toast,#bubs{display:none!important}
`;
document.head.appendChild(css);

const el=document.createElement('div');el.id='st';el.hidden=true;if(X.touch)el.classList.add('lite');
el.innerHTML='<div class="fr"><div class="ph"></div><img alt=""><video muted playsinline preload="auto" hidden></video></div><canvas class="gr"></canvas><canvas class="du"></canvas><div class="vg"></div><div class="bars"></div><div class="cap"></div><div class="sk">▸</div>';
X.game.appendChild(el);
const fr=el.querySelector('.fr'),im=el.querySelector('img'),vid=el.querySelector('video'),capEl=el.querySelector('.cap'),vg=el.querySelector('.vg');
vid.muted=true;vid.playsInline=true;vid.setAttribute('playsinline','');vid.setAttribute('webkit-playsinline','');
const card=document.createElement('div');card.id='stt';card.setAttribute('aria-live','polite');card.innerHTML='<b data-paper="ransom"></b><i data-paper="ransom"></i>';X.game.appendChild(card);
// goal tokens: a row under the vapes-left counter (the chapter tag "n/5" leads it)
const row=document.createElement('div');row.id='stg';row.hidden=true;row.innerHTML='<span id="stch"></span><span class="tks"></span>';
const chEl=row.firstChild,tksEl=row.lastChild;{const c=$('count');if(c)c.appendChild(row)}
// direction: district arrow at the screen edge, chevron to the nearest creature that still counts
const hudEl=$('hud');
const arw=document.createElement('div');arw.id='starw';arw.className='stui';arw.innerHTML=ARROW;
const chev=document.createElement('div');chev.id='stchev';chev.className='stui';chev.innerHTML=CHEV;
(hudEl||X.game).append(arw,chev);
// big check-mark stamp on chapter clear
const stk=document.createElement('div');stk.id='stk';stk.setAttribute('aria-hidden','true');stk.innerHTML='<div class="disc"></div>'+CHECK;X.game.appendChild(stk);
// Sal's phone call: polaroid + subtitle (in person: subtitle only)
const stc=document.createElement('div');stc.id='stc';stc.hidden=true;stc.setAttribute('aria-live','polite');
stc.innerHTML='<div class="fr"><div class="hd">'+PHONE+'</div><div class="pic"></div></div><div class="cap"></div>';X.game.appendChild(stc);
const stcPic=stc.querySelector('.pic'),stcCap=stc.querySelector('.cap');
let GW0=innerWidth,GH0=innerHeight;const measure=()=>{GW0=X.game.clientWidth||innerWidth;GH0=X.game.clientHeight||innerHeight};addEventListener('resize',measure);measure();
const scrapCP=j=>X.paper&&X.paper.scrap?X.paper.scrap(j):'none';

/* ================= 16mm FILM TREATMENT (grain, dust, hair, gate weave, flicker) ================= */
const gr=el.querySelector('.gr'),du=el.querySelector('.du'),GW=X.touch?320:480,GH=Math.round(GW*9/16);
gr.width=du.width=GW;gr.height=du.height=GH;const gx=gr.getContext('2d'),dx=du.getContext('2d');
const TILES=[...Array(4)].map(()=>{const c=document.createElement('canvas');c.width=c.height=128;const k=c.getContext('2d'),d=k.createImageData(128,128),a=d.data;
  for(let i=0;i<a.length;i+=4){const v=128+((Math.random()+Math.random()-1)*110)|0;a[i]=a[i+1]=a[i+2]=v;a[i+3]=255}k.putImageData(d,0,0);return gx.createPattern(c,'repeat')});
let filmRaf=0,filmLast=0;
function filmTick(now){filmRaf=el.hidden?0:requestAnimationFrame(filmTick);if(now-filmLast<83)return;filmLast=now;// ~12 fps
  subsTick();
  gx.save();gx.translate(-rand(0,128),-rand(0,128));gx.fillStyle=X.pick(TILES);gx.fillRect(0,0,GW+128,GH+128);gx.restore();
  dx.clearRect(0,0,GW,GH);
  if(Math.random()<.4){const n=1+(Math.random()*3|0);for(let i=0;i<n;i++){const lt=Math.random()<.3;dx.fillStyle=lt?'rgba(255,248,230,.55)':'rgba(24,16,10,.7)';dx.beginPath();dx.ellipse(rand(0,GW),rand(0,GH),rand(.4,1.8),rand(.4,1.4),rand(0,3),0,7);dx.fill()}}
  if(Math.random()<.035){dx.strokeStyle='rgba(24,16,10,.6)';dx.lineWidth=.6;dx.beginPath();const x=rand(0,GW),y=rand(0,GH);dx.moveTo(x,y);dx.bezierCurveTo(x+rand(-20,20),y+rand(-20,20),x+rand(-30,30),y+rand(-10,30),x+rand(-25,25),y+rand(10,40));dx.stroke()}
  if(!RMq.matches){fr.style.transform=`translate(${rand(-1,1).toFixed(2)}px,${rand(-1,1).toFixed(2)}px)`;vg.style.opacity=(.93+Math.random()*.07).toFixed(3)}else fr.style.transform=''}
function filmOn(){if(!filmRaf){filmLast=0;filmRaf=requestAnimationFrame(filmTick)}}

/* ================= VOICE (preloaded per chapter; emits vo true/false so the score can duck) ================= */
const IMG=n=>'assets/story/clay/'+n+'.jpg',VID=n=>'assets/story/clay/'+n+'.mp4',VO=n=>'audio/vo/'+n+'.mp3';
const VOA={};
function getA(n){let a=VOA[n];if(!a||a.error){a=new Audio(VO(n));a.preload='auto';VOA[n]=a}return a}
function warm(list){for(const f of list)if(f&&f.vo)try{getA(f.vo)}catch(e){}}
let voN=0;const voOn=()=>{if(voN++===0)X.emit('vo',true)},voOff=()=>{if(voN>0&&--voN===0)X.emit('vo',false)};
/* plays one line; fin(true) when it ended, fin(false) when there was nothing to hear (missing file, muted, blocked) */
function sound(n,fin){let done=false,on=false,cancel=false;const end=ok=>{if(done)return;done=true;if(on){on=false;voOff()}if(!cancel)fin(ok)};
  if(!n||X.muted){setTimeout(()=>end(false),0);return{stop(){cancel=true;end()}}}
  const a=getA(n);a.onplaying=()=>{if(!done&&!on){on=true;voOn()}};a.onended=()=>end(true);a.onerror=()=>end(false);a.volume=.95;
  try{a.currentTime=0}catch(e){}const p=a.play();if(p&&p.catch)p.catch(()=>end(false));
  return{a,stop(){cancel=true;try{a.pause()}catch(e){}end()}}}
const readT=f=>Math.max(2.4,(f.cap||'').length*.058)*1000;

/* ================= CUTSCENE PLAYER ================= */
const FALL={downtown:'loc_downtown',park:'loc_park',beach:'loc_gym',farm:'loc_farm',square:'loc_square'};
const okImg={};// url → true/false once known
function probe(u){if(u in okImg)return;okImg[u]=undefined;const i=new Image();i.onload=()=>okImg[u]=true;i.onerror=()=>okImg[u]=false;i.src=u}
function preload(){for(const c of S.chapters)for(const f of[...(c.in||[]),...(c.out||[])])if(f.img)probe(IMG(f.img));for(const f of S.end||[])if(f.img)probe(IMG(f.img));for(const k in FALL)probe('assets/clay/'+FALL[k]+'.jpg');
  for(const k of['ch1_in_2','ch2_out_1','ch3_out_1'])probe(IMG(k))}
preload();
function showStill(f,still){im.onerror=null;im.classList.remove('kb','soft');im.hidden=false;
  const fb='assets/clay/'+(FALL[f._d]||'loc_shop_int')+'.jpg';
  const soft=()=>{if(okImg[fb]===false){im.hidden=true;return}im.onerror=()=>{im.hidden=true};im.classList.remove('kb');im.classList.add('soft');im.src=fb};
  if(!f.img||okImg[IMG(f.img)]===false){soft();return}
  im.onerror=soft;im.src=IMG(f.img);if(!still){void im.offsetWidth;im.classList.add('kb')}}// a clip's first frame stays put under it (hard cut)
let au=null;
const capHTML=f=>f&&f.cap?(f.who?'<b>'+f.who+'</b>':'')+f.cap:'';
function setCap(f){const h=capHTML(f);if(capEl.innerHTML!==h)capEl.innerHTML=h;capEl.hidden=!h}
let seq=null;
/* clip sound: a shot with aud:true plays its clip with the clip's own voice + foley and emits vo around it */
let clipVo=false;const clipOn=()=>{if(!clipVo){clipVo=true;voOn()}},clipOff=()=>{if(clipVo){clipVo=false;voOff()}};
/* timed subtitles (shot.subs = [{t, who, cap}]) follow the clip's clock, or the shot's when the clip is missing */
function subsTick(){const s=seq;if(!s||!s.subs)return;const tt=s.clipT?vid.currentTime:(performance.now()-s.t0)/1000;let k=0;for(let i=0;i<s.subs.length;i++)if(s.subs[i].t<=tt)k=i;if(k!==s.subI){s.subI=k;setCap(s.subs[k])}}
let pv=null;// the next clip buffers in a spare element so the cut lands on time
/* done fires as the overlay starts fading, so whatever comes next (gameplay, the next cutscene) is already
   running underneath: no black frame, no pause. Shots inside a cutscene are hard cuts. toPlay: a click that ends it may
   re-grab the mouse for gameplay. */
function play(shots,done,dk,toPlay){shots=(shots||[]).map(f=>Object.assign({_d:dk},f));
  if(seq)finish(true);if(!shots.length){done&&done();return}
  callStop();seq={shots,i:-1,done,tm:0,toPlay};el.hidden=false;filmOn();requestAnimationFrame(()=>{if(seq)el.classList.add('on')});
  if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock();X.emit('cutscene',true);next()}
function finish(silent){const s=seq;if(!s)return;seq=null;clearTimeout(s.tm);if(au){au.stop();au=null}vid.pause();clipOff();
  el.classList.remove('on');setTimeout(()=>{if(!seq){el.hidden=true;vid.removeAttribute('src');vid.hidden=true}},320);
  X.emit('cutscene',false);if(!silent&&s.done)s.done()}
function next(){const s=seq;if(!s)return;clearTimeout(s.tm);if(au){au.stop();au=null}clipOff();s.i++;if(s.i>=s.shots.length){finish();return}
  const f=s.shots[s.i],my=s.i,t0=performance.now(),live=()=>seq===s&&s.i===my,talk=!!(f.aud&&f.vid);
  s.t0=t0;s.subs=f.subs||null;s.subI=-1;s.clipT=false;
  showStill(f,!!f.vid);vid.pause();vid.hidden=true;vid.oncanplay=vid.onerror=vid.onloadedmetadata=vid.onended=vid.onplaying=null;vid.ontimeupdate=subsTick;
  setCap(f.subs?f.subs[0]:f);
  let vd=0,voDone=!f.vo||talk,voEnd=0,clipDone=!talk,fb=false;const hold=f.hold?f.hold*1000:readT(f);
  // a talking clip ends its shot when it ends (hard cut); a voiced still ends .35 s after its line (min 1.6 s);
  // a silent shot holds its reading time or its clip
  const arm=()=>{if(!live()||!voDone||!clipDone)return;clearTimeout(s.tm);const el2=performance.now()-t0;
    if(talk&&!fb){next();return}
    const want=talk?(voEnd?voEnd-t0:readT(f)):voEnd?Math.max(1600,voEnd-t0+350):Math.max(hold,vd?(vd+.2)*1000:0);s.tm=setTimeout(next,Math.max(talk?0:120,want-el2))};
  const say=()=>{fb=true;if(!f.vo||au)return;voDone=false;au=sound(f.vo,ok=>{au=null;voDone=true;voEnd=ok?performance.now():0;arm()})};
  if(f.vid){const audible=talk&&!X.muted;vid.muted=!audible;vid.volume=1;
    vid.onloadedmetadata=()=>{vd=isFinite(vid.duration)?vid.duration:0;if(!live())return;if(talk){clearTimeout(s.tm);s.tm=setTimeout(()=>{if(live())next()},(vd+2.5)*1000)}else if(!f.vo)arm()};
    vid.onplaying=()=>{if(!live())return;vid.hidden=false;s.clipT=true;if(talk&&!vid.muted)clipOn()};
    vid.onended=()=>{if(!live())return;clipOff();clipDone=true;arm()};
    vid.onerror=()=>{if(!live())return;vid.hidden=true;s.clipT=false;clipOff();if(talk){clipDone=true;say();arm()}};
    vid.src=VID(f.vid);try{vid.load()}catch(e){}
    // started right here so the PLAY tap's gesture also unlocks the clip's sound (iOS)
    const pr=vid.play();if(pr&&pr.catch)pr.catch(err=>{if(!live()||vid.error)return;
      if(talk&&!vid.muted){vid.muted=true;clipOff();vid.play().catch(()=>{});say()}});
    if(!talk)vid.oncanplay=()=>{if(live()){vid.hidden=false;vid.play().catch(()=>{})}}}
  else vid.removeAttribute('src');
  // next shot's clip, still and line start loading now
  const nf=s.shots[my+1];if(nf){if(nf.img)probe(IMG(nf.img));if(nf.vo&&!nf.aud)getA(nf.vo);if(nf.vid){pv=pv||document.createElement('video');pv.muted=true;pv.preload='auto';pv.src=VID(nf.vid);try{pv.load()}catch(e){}}}
  if(f.vo&&!talk){au=sound(f.vo,ok=>{au=null;voDone=true;voEnd=ok?performance.now():0;arm()})}
  if(!talk)arm();if(!s.tm)s.tm=setTimeout(()=>{if(live())next()},talk?20000:14000)}
function regrab(){if(X.touch)return;const c=X.R&&X.R.domElement;try{const p=c&&c.requestPointerLock&&c.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function advance(byUser){const s=seq;if(!s)return;const last=s.i>=s.shots.length-1;if(byUser&&last&&s.toPlay)regrab();next()}
el.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();advance(true)});
addEventListener('keydown',e=>{if(e.repeat)return;if(seq&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape')){e.stopPropagation();e.preventDefault();advance(false)}},true);

/* ================= CHAPTER TITLE CARD (non-blocking: play already runs underneath) ================= */
let cardTm=0;
function showCard(n){const c=CH(n);card.firstChild.textContent=n;card.lastChild.textContent=c.title||'';card.classList.remove('go');void card.offsetWidth;card.classList.add('go');
  clearTimeout(cardTm);cardTm=setTimeout(()=>card.classList.remove('go'),2000)}

/* ================= SAL'S CALLS (phone polaroid in a corner, or subtitles only in person) ================= */
const cl={tok:0,h:null,tm:0,busy:false,live:false};
function callShow(on){if(on){if(!stc.hidden&&!stc._out)return;stc._out=0;stc.hidden=false;
    try{stc.getAnimations().forEach(a=>a.cancel());stc.animate(cl.live?[{opacity:0,translate:'0 30px'},{opacity:1,translate:'0 -4px',offset:.6},{opacity:1,translate:'0 0'}]:
      [{opacity:0,translate:'120% 0',rotate:'8deg'},{opacity:1,translate:'-6% 0',rotate:'-3deg',offset:.55},{opacity:1,translate:'2% 0',rotate:'1deg',offset:.8},{opacity:1,translate:'0 0',rotate:'0deg'}],
      {duration:RMq.matches?1:320,easing:'steps(5,end)'})}catch(e){}}
  else{if(stc.hidden||stc._out)return;stc._out=1;
    let a=null;try{a=stc.animate(cl.live?[{opacity:1},{opacity:0,translate:'0 20px'}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:'115% 0',rotate:'6deg'}],{duration:RMq.matches?1:260,easing:'steps(4,end)',fill:'forwards'})}catch(e){}
    const hide=()=>{if(stc._out){stc.hidden=true;stc._out=0;try{stc.getAnimations().forEach(x=>x.cancel())}catch(e){}}};if(a)a.onfinish=hide;else hide()}}
function ring(){if(X.muted)return;try{for(let i=0;i<2;i++){X.beep(1320,.06,'square',.016,i*.16);X.beep(1660,.06,'square',.014,i*.16+.07)}}catch(e){}}
/* lines: [{who,vo,cap,pic,crop}], plays them back to back; done(true) when heard through, nothing when cancelled */
function callPlay(lines,opt,done){callStop();const my=++cl.tok;opt=opt||{};cl.busy=true;cl.live=!!opt.live;
  stc.classList.toggle('live',cl.live);stc.classList.remove('ring');let i=0;
  const step=()=>{if(my!==cl.tok)return;clearTimeout(cl.tm);if(i>=lines.length){cl.busy=false;cl.h=null;callShow(false);done&&done(true);return}
    const f=lines[i++];if(!f){step();return}const t0=performance.now();
    if(f.pic){stcPic.style.backgroundImage=`url("${IMG(f.pic)}")`;const c=f.crop||[50,30,300];stcPic.style.backgroundSize=c[2]+'% auto';stcPic.style.backgroundPosition=c[0]+'% '+c[1]+'%'}
    stcCap.innerHTML=capHTML(f);callShow(true);
    if(i===1&&!cl.live){void stc.offsetWidth;stc.classList.add('ring');ring()}
    const gap=i<lines.length?120:420;
    cl.h=sound(f.vo,ok=>{cl.h=null;if(my!==cl.tok)return;const wait=ok?gap:Math.max(gap,readT(f)-(performance.now()-t0));cl.tm=setTimeout(step,wait)});
    cl.tm=setTimeout(step,Math.max(9000,readT(f)+4000))};// safety if an audio element stalls
  setTimeout(step,opt.live?0:260)}// the phone rings once before he talks
function callStop(){cl.tok++;clearTimeout(cl.tm);if(cl.h){cl.h.stop();cl.h=null}cl.busy=false;callShow(false)}

/* ================= STATE ================= */
const st={run:0,ch:0,phase:'idle',goal:0,got:0,types:[],carry:[],walk:[],backSaid:0,enoughSaid:0,backAt:0,backI:0,want:null,delAt:-1e9,c0:5000,c5:0,t5:0,p5:0,acc:0,mood:null,moodOv:null,bossBeat:false,bossT:-1e9,stamped:0,bossStamped:false,outT:0,nudgeAt:0,salAt:0,tIn:0};
let credited=new Set(),onIntro=null,introSeen=false;
const coreStart=X.start,coreReset=$('again').onclick;
X.on('introdone',()=>{const f=onIntro;onIntro=null;f&&f()});
const BOSSES=()=>X.crowds&&X.crowds.BOSS;
const bossCfg=n=>{const B=BOSSES(),k=PLAN[n].boss;return k&&B?B[k]:null};
const bossDone=n=>{if(!PLAN[n].need||!BOSSES())return true;return st.bossBeat};
const bossN=n=>{const c=bossCfg(n);return c&&c.n&&!c.n.boss.dead?c.n:null};
function progress(){const n=st.ch;if(!n)return 0;
  if(n===5){if(st.phase==='end')return 1;if(st.phase==='play'&&st.c5>0)st.p5=Math.max(st.p5,clamp((st.c5-X.count)/st.c5,0,1));return st.phase==='play'?st.p5:0}
  if(st.phase==='out')return 1;if(st.phase!=='play')return 0;
  const hb=!!PLAN[n].need,u=st.goal+(hb?2:0);return clamp((Math.min(st.got,st.goal)+(hb&&bossDone(n)?2:0))/u,0,1)}
const carriedN=()=>st.carry.length+st.walk.length;
function pace(){const n=st.ch;if(!n||n>4||st.phase!=='play')return progress();const hb=!!PLAN[n].need,u=st.goal+(hb?2:0);
  return clamp((Math.min(st.goal,st.got+carriedN()*.5)+(hb&&bossDone(n)?2:0))/u,0,1)}
function floor(){if(st.phase==='end'||st.phase==='idle'||!st.ch)return 0;if(st.ch<5)return PLAN[st.ch].floor;return st.bossBeat?0:DETECTO_FLOOR}
function setMood(){const s=X.sal,m=st.moodOv||st.mood;if(s&&typeof s.setMood==='function'&&m&&(s._stMood!==m)){try{s.setMood(m);s._stMood=m}catch(e){}}}

/* ---------- goal tokens ---------- */
const PAL=['#f6a6c1','#9ccfee','#bfdc5a','#eebd4b','#bba7e6','#f39a5f','#6cc9bf'];
function tok(type,cls){const t=document.createElement('span');t.className='tk'+(cls?' '+cls:'');t.dataset.ty=type;
  t.style.cssText=`--r:${rand(-6,6).toFixed(1)}deg;--cp:${scrapCP(9)}`;t.innerHTML=svg('0 0 24 24',ICON[type]||ICON.worker);return t}
function buildHud(n){tksEl.textContent='';st.stamped=0;st.bossStamped=false;if(!n){row.hidden=true;return}row.hidden=false;const P=PLAN[n];
  if(n===5){const c=tok('worker','ctn on');c.innerHTML=CTN;c.style.setProperty('--r','-2deg');tksEl.appendChild(c)}
  else for(let i=0;i<P.goal;i++)tksEl.appendChild(tok(P.icons[i%P.icons.length]||P.count[0]));
  if(P.need&&P.boss){const b=document.createElement('span');b.className='tkb';b.innerHTML=CROWN;b.appendChild(tok(P.boss));tksEl.appendChild(b)}
  chEl.textContent=n+'/5'}
function stampEl(t,col,type){if(type&&ICON[type]){t.innerHTML=svg('0 0 24 24',ICON[type]);t.dataset.ty=type}
  t.style.setProperty('--bg',col);t.style.setProperty('--r',rand(-9,9).toFixed(1)+'deg');t.style.setProperty('--cp',scrapCP(8));t.classList.add('on');
  if(!RMq.matches)try{t.animate([{scale:2.3,rotate:'-18deg',opacity:0,easing:'steps(1,end)'},{scale:.78,rotate:'6deg',opacity:1,offset:.3,easing:'steps(1,end)'},{scale:1.18,rotate:'-3deg',offset:.6,easing:'steps(1,end)'},{scale:1,rotate:'0deg',opacity:1}],{duration:330})}catch(e){}}
function stampToken(i){const t=tksEl.children[i];if(!t||t.classList.contains('on'))return;const ty=st.types[i];t.classList.remove('cy');t._cy='';
  stampEl(t,PAL[(i*3+st.ch)%PAL.length],ty);
  if(!X.muted)try{X.beep(180,.06,'square',.03);X.beep(760+i*90,.07,'triangle',.035,.05);X.beep(1140+i*120,.09,'triangle',.03,.11)}catch(e){}}
function stampBoss(){const b=tksEl.querySelector('.tkb');if(!b||st.bossStamped)return;st.bossStamped=true;b.classList.add('on');stampEl(b.querySelector('.tk'),'#f6c935');
  if(!X.muted)try{X.beep(150,.1,'square',.04);[660,880,1100].forEach((f,i)=>X.beep(f,.09,'triangle',.035,.06+i*.07))}catch(e){}}
let lvShown=-1;const lvEl=()=>tksEl.querySelector('svg.ctn .lv');
/* a customer you're bringing in: the token half-fills in its colour, shows who it is, and wiggles on held frames */
function carryTokens(){const P=PLAN[st.ch];if(!P||st.ch>4)return;const L=[...st.walk,...st.carry];
  for(let i=0;i<tksEl.children.length;i++){const t=tksEl.children[i];if(!t.classList.contains('tk')||t.classList.contains('on'))continue;
    const c=i>=st.got?L[i-st.got]:null,ty=c&&st.phase!=='idle'?c.type:'';if((t._cy||'')===ty)continue;t._cy=ty;
    if(ty){t.innerHTML=svg('0 0 24 24',ICON[ty]||ICON.worker);t.dataset.ty=ty;t.style.setProperty('--bg',PAL[(i*3+st.ch)%PAL.length]);t.classList.add('cy');
      if(!RMq.matches)try{t.animate([{scale:1.5,easing:'steps(1,end)'},{scale:.85,offset:.4,easing:'steps(1,end)'},{scale:1}],{duration:240})}catch(e){}}
    else{t.classList.remove('cy');const d=P.icons[i%P.icons.length]||P.count[0];t.innerHTML=svg('0 0 24 24',ICON[d]||ICON.worker);t.dataset.ty=d}}}
function hud(){const c=st.ch?st.ch+'/5':'';if(chEl.textContent!==c)chEl.textContent=c;
  if(!st.ch||st.phase==='idle')return;
  if(st.ch<5){const g=Math.min(st.got,st.goal);while(st.stamped<g){stampToken(st.stamped);st.stamped++}carryTokens();
    if(PLAN[st.ch].need&&st.bossBeat&&!st.bossStamped)stampBoss()}
  else{const left=st.phase==='end'?0:1-progress(),q=Math.round(left*16)/16;if(q!==lvShown){const lv=lvEl();if(lv){lvShown=q;const h=16.8*q;lv.setAttribute('y',(4.6+16.8-h).toFixed(2));lv.setAttribute('height',h.toFixed(2))}}
    if(st.bossBeat&&!st.bossStamped)stampBoss()}}

/* ---------- big paper check-mark stamp ---------- */
const discCP=()=>'polygon('+[...Array(22)].map((_,i)=>{const a=i/22*PI*2,r=rand(44,50);return (50+Math.cos(a)*r).toFixed(1)+'% '+(50+Math.sin(a)*r).toFixed(1)+'%'}).join(',')+')';
function stampCheck(){stk.querySelector('.disc').style.setProperty('--cp',discCP());
  try{stk.getAnimations().forEach(a=>a.cancel());stk.animate([{opacity:0,scale:3.2,rotate:'-24deg',easing:'steps(1,end)'},{opacity:1,scale:.82,rotate:'-4deg',offset:.12,easing:'steps(1,end)'},{opacity:1,scale:1.1,rotate:'-9deg',offset:.2,easing:'steps(1,end)'},
    {opacity:1,scale:1,rotate:'-7deg',offset:.28},{opacity:1,scale:1,rotate:'-7deg',offset:.82,easing:'steps(2,end)'},{opacity:0,scale:1.08,rotate:'-7deg'}],{duration:RMq.matches?1600:1700,fill:'none'})}catch(e){}
  if(!X.muted)try{if(!X.clip('sfx/slam',{vol:.7}))X.beep(110,.4,'sawtooth',.07);[523,659,784,1046].forEach((f,i)=>X.beep(f,.18,'triangle',.04,.12+i*.08))}catch(e){}}

// remove vapes without anyone smoking them (word of mouth sells them through the shop between chapters)
function capCount(cap){const d=X.count-cap;if(d<=0)return;X.count=cap;X.used=X.used+d;
  let r=d,g=0;while(r>0&&g++<1e5){const i=X.ri(X.STOCK.length);if(X.STOCK[i]>0){X.STOCK[i]--;r--}else if(!X.STOCK.some(v=>v>0))break}
  try{X.setFlav(X.fi,1)}catch(e){}}

/* ---------- district population ---------- */
const P2={x:0,z:0},spawned={};
function spot(dk){for(let k=0;k<30;k++){let x,z;
    if(dk==='park'){x=rand(-136,-72);z=rand(-66,66);if(Math.hypot((x+98)/15,(z+8)/11.5)<1.2)continue}
    else if(dk==='beach'){x=rand(-42,42);z=rand(-118,-80)}
    else if(dk==='farm'){x=rand(76,128);z=rand(-46,46)}
    else if(dk==='square'){const a=rand(0,PI*2),r=rand(14,34);x=Math.cos(a)*r;z=-6+Math.sin(a)*r}
    else{const d=DIST(dk);x=rand(d.x0+6,d.x1-6);z=rand(d.z0+6,d.z1-6)}
    P2.x=x;P2.z=z;X.collide(P2,1.2);return[P2.x,P2.z]}
  return[PLAN[st.ch]?PLAN[st.ch].at[0]:0,PLAN[st.ch]?PLAN[st.ch].at[1]:0]}
function add(ty,dk,away){if(!X.BUILD[ty])return null;let[x,z]=spot(dk);
  for(let k=0;away&&k<8&&Math.hypot(x-X.px,z-X.pz)<30;k++)[x,z]=spot(dk);/* mid-chapter refills don't pop up in front of you */
  try{X.spawn(ty,x,z)}catch(e){console.warn('[story] spawn',ty,e);return null}
  const c=X.npcs[X.npcs.length-1];c._home=dk;c.hooked=false;c.times=0;if(c.H&&c.H.Wh)for(const wm of c.H.Wh)wm.material=X.M(0xffffff);try{X.setCrave(c)}catch(e){}return c}
function populate(n){if(spawned[n])return;spawned[n]=1;const dk=CH(n).district;for(const[ty,k]of PLAN[n].extra)for(let i=0;i<k;i++)add(ty,dk)}
/* only the district's kinds count, once each, while unhooked and inside the district */
const counts=(c,n)=>{const P=PLAN[n];return !!(P&&P.count&&P.count.includes(c.type))};
const elig=(c,n)=>!c.boss&&!c.hooked&&!credited.has(c)&&counts(c,n)&&inD(CH(n).district,c.g.position.x,c.g.position.z);
function topUp(n,away){const P=PLAN[n];if(!P.count)return;const dk=CH(n).district;let have=0;for(const c of X.npcs)if(elig(c,n))have++;
  const pool=P.count.filter(t=>t!=='tuba'&&X.BUILD[t]),want=Math.max(0,P.goal-st.got-carriedN())+4;for(let i=0;have<want&&i<16;i++)if(add(pool[(i+st.got)%pool.length],dk,away))have++}
function unhook(n){n.hooked=false;n.times=0;if(n.H&&n.H.Wh)for(const wm of n.H.Wh)wm.material=X.M(0xffffff)}
function prep(n){populate(n);
  if(n===3)for(const c of X.npcs)if(c.type==='gym'&&!c.boss&&c.hooked&&!credited.has(c)&&inD('beach',c.hx,c.hzz))unhook(c);// gym bros start hooked; make them earnable
  if(n===5){// everyone already hooked comes back for seconds: they pour into the square during the cutscene
    let k=0;for(const c of X.npcs){if(!c.hooked||c.boss||k>=36||c.state==='held')continue;const[x,z]=spot('square');c.g.position.set(x,0,z);c.state='wander';c.cool=0;c.tm=0;c.tx=x;c.tz=z;k++}}
  topUp(n)}

/* ---------- beacon: a tall coloured cotton-cloud column + orbiting vapes over the target district ---------- */
let bc=null;const SPH=new T.SphereGeometry(1,10,8),VBX=new T.BoxGeometry(.9,1.3,.55);
function beaconOn(n){beaconOff(true);const P=PLAN[n];if(n===1)return;
  const g=new T.Group(),m=new T.MeshBasicMaterial({color:P.col,transparent:true,opacity:0,depthWrite:false,fog:false}),
    mw=new T.MeshBasicMaterial({color:0xfff7ea,transparent:true,opacity:0,depthWrite:false,fog:false}),cubes=[];
  for(let i=0;i<15;i++){const s=new T.Mesh(SPH,i%3?m:mw),r=2+i*.12+rand(0,.8);s.scale.set(r,r*1.2,r);s.position.set(rand(-.8,.8),5+i*4.2,rand(-.8,.8));s.userData.y0=s.position.y;s.userData.ph=rand(0,6);g.add(s)}
  for(let i=0;i<8;i++){const s=new T.Mesh(SPH,i%2?m:mw),r=rand(4.5,7.5);s.scale.set(r,r*.7,r);const a=i/8*PI*2;s.position.set(Math.cos(a)*6,68+rand(-2,3),Math.sin(a)*6);s.userData.y0=s.position.y;s.userData.ph=rand(0,6);g.add(s)}
  const vm=new T.MeshBasicMaterial({color:P.col,transparent:true,opacity:0,depthWrite:false,fog:false});
  for(let i=0;i<10;i++){const c=new T.Mesh(VBX,vm);c.userData.a=i/10*PI*2;c.userData.y=48+(i%3)*5;g.add(c);cubes.push(c)}
  g.position.set(P.at[0],0,P.at[1]);g.scale.setScalar(1.4);g.renderOrder=2;X.scene.add(g);bc={g,mats:[m,mw,vm],cubes,o:0,n,dk:CH(n).district,on:true}}
function beaconOff(now){if(!bc)return;if(now){X.scene.remove(bc.g);bc=null}else bc.on=false}
function beaconStep(dt,t){if(!bc)return;const inside=inD(bc.dk,X.px,X.pz),tg=bc.on&&st.phase==='play'&&!inside&&!toShop()?.42:0;
  bc.o+=clamp(tg-bc.o,-dt*.8,dt*.8);if(!bc.on&&bc.o<=0.001){beaconOff(true);return}
  bc.g.visible=bc.o>.003;if(!bc.g.visible)return;bc.mats[0].opacity=bc.o;bc.mats[1].opacity=bc.o*.8;bc.mats[2].opacity=Math.min(1,bc.o*2);
  bc.g.rotation.y=t*.08;for(const s of bc.g.children){if(s.userData.y0!==undefined)s.position.y=s.userData.y0+Math.sin(t*.9+s.userData.ph)*.8}
  for(const c of bc.cubes){const a=c.userData.a+t*.5;c.position.set(Math.cos(a)*9,c.userData.y+Math.sin(t*1.3+c.userData.a*3)*1.5,Math.sin(a)*9);c.rotation.set(t*1.1+c.userData.a,t*.7,0)}}

/* ---------- paper tags over creatures that still count (3D sprites), Sal's speech bubble ---------- */
function paperTex(draw){const c=document.createElement('canvas');c.width=128;c.height=160;const g=c.getContext('2d');draw(g);const t=new T.CanvasTexture(c);t.minFilter=T.LinearFilter;return t}
const pinPath=(g,s)=>{g.beginPath();g.moveTo(64,150);g.bezierCurveTo(52,118,14+s,96,14+s,62);g.arc(64,62,50-s,PI,0);g.bezierCurveTo(114-s,96,76,118,64,150);g.closePath()};
function fleck(g,n){for(let i=0;i<n;i++){g.fillStyle=Math.random()<.5?'rgba(60,38,16,.16)':'rgba(255,255,255,.28)';g.fillRect(rand(20,108),rand(16,120),rand(1,3),rand(1,3))}}
const tagTexC={};
function tagTex(col){if(tagTexC[col])return tagTexC[col];return tagTexC[col]=paperTex(g=>{
  g.save();g.translate(3,5);pinPath(g,0);g.fillStyle='rgba(45,28,12,.35)';g.fill();g.restore();
  pinPath(g,0);g.fillStyle='#fbf5e6';g.fill();pinPath(g,9);g.fillStyle=col;g.fill();g.save();pinPath(g,9);g.clip();fleck(g,140);g.restore();
  g.beginPath();g.arc(64,60,15,0,PI*2);g.fillStyle='#fbf5e6';g.fill()})}
const salTex=paperTex(g=>{const b=(dx,dy,c)=>{g.beginPath();g.ellipse(64+dx,64+dy,56,44,0,0,PI*2);g.moveTo(40+dx,98+dy);g.lineTo(30+dx,138+dy);g.lineTo(66+dx,104+dy);g.fillStyle=c;g.fill()};
  b(3,5,'rgba(45,28,12,.35)');b(0,0,'#fbf5e6');g.save();g.beginPath();g.ellipse(64,64,56,44,0,0,PI*2);g.clip();fleck(g,120);g.restore();
  g.fillStyle='#2b2233';for(const x of[40,64,88]){g.beginPath();g.arc(x,66,7.5,0,PI*2);g.fill()}});
const tagPool=[];for(let i=0;i<8;i++){const m=new T.SpriteMaterial({transparent:true,depthWrite:false,fog:false,opacity:0}),s=new T.Sprite(m);s.scale.set(.56,.7,1);s.visible=false;s.renderOrder=3;X.scene.add(s);tagPool.push({s,m,n:null,a:0,ph:rand(0,6)})}
const salB=new T.Sprite(new T.SpriteMaterial({map:salTex,transparent:true,depthWrite:false,fog:false,opacity:0}));salB.scale.set(.62,.78,1);salB.visible=false;salB.renderOrder=3;X.scene.add(salB);

/* ---------- objective direction (arrow / chevron / tags), refreshed every frame in prerender ---------- */
const VC=new T.Vector3(),VP=new T.Vector3();
const ui={a:0,arrow:0,chev:0,near:null,list:[],scanT:0,tickT:0,tick:false,tq:0};
function camSpace(x,y,z){VC.set(x,y,z).applyMatrix4(X.cam.matrixWorldInverse);return VC}
function bearing(x,z){camSpace(x,1.6,z);return Math.atan2(VC.x,-VC.z)}// 0 = straight ahead, + = to the right
function edgePos(b){const W=GW0,H=GH0,rx=W/2-44,ry=H*.39,cy=H*.55;return[W/2+Math.sin(b)*rx,cy-Math.cos(b)*ry]}
const qa=v=>v<.12?0:v<.55?.5:1;
function setUI(e,x,y,rot,a){if(!ui.tick)return;a=qa(a);e.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(3)}rad)`;const o=a.toFixed(3);if(e.style.opacity!==o)e.style.opacity=o}
const headY=n=>n.g.position.y+(n.hy||1.5)+(n.r>.55?1.2:.85);
const toShop=()=>st.ch>=1&&st.ch<=4&&st.phase==='play'&&carriedN()>0&&st.got+carriedN()>=st.goal;
function scan(){const n=st.ch;ui.list.length=0;ui.near=null;if(!n||st.phase!=='play')return;let bd=1e9;
  if(n<5&&st.got+carriedN()>=st.goal){if(PLAN[n].need)ui.near=bossN(n);return}// everyone's on the way: only the boss is left to point at
  if(n<5){for(const c of X.npcs){if(!elig(c,n))continue;const d=Math.hypot(c.g.position.x-X.px,c.g.position.z-X.pz);ui.list.push([d,c]);if(d<bd){bd=d;ui.near=c}}
    ui.list.sort((a,b)=>a[0]-b[0]);ui.list.length=Math.min(ui.list.length,tagPool.length);
    if(st.got>=st.goal&&PLAN[n].need){const b=bossN(n);if(b){ui.near=b;ui.list.length=0}}}
  else ui.near=bossN(5)}
function uiStep(dt,t){const n=st.ch,live=X.mode==='play'&&st.phase==='play'&&!seq&&n>0,dk=n?CH(n).district:null;
  ui.a+=clamp((live&&!X.held?1:0)-ui.a,-dt*7,dt*4);
  if((ui.scanT-=dt)<=0){ui.scanT=.25;scan()}
  ui.tick=(ui.tickT-=dt)<=0;if(ui.tick){ui.tickT=1/12;ui.tq=t;measure()}t=ui.tq;// held frames: everything here moves on ~12 fps
  // with the whole order carried, the arrow leads home to the Cloud Kingz drop-off instead of out to the district
  const home=live&&toShop(),outside=live&&n<5&&!home&&!inD(dk,X.px,X.pz),far=home&&Math.hypot(DROP.x-X.px,DROP.z-X.pz)>12;
  if(ui.home!==home&&n){ui.home=home;arw.style.setProperty('--stc',home?'#ff5fa2':PLAN[n].pal)}
  // district arrow: hugs an ellipse round the screen edge on the side the district lies (straight up = keep going)
  ui.arrow+=clamp((outside||far?1:0)-ui.arrow,-dt*5,dt*3);
  if(ui.arrow*ui.a>.01){const P=PLAN[n],b=home?bearing(DROP.x,DROP.z):bearing(P.at[0],P.at[1]);const[x,y]=edgePos(b),bob=Math.sin(t*6)*5*(RMq.matches?0:1);
    setUI(arw,x+Math.sin(b)*bob,y-Math.cos(b)*bob,b,ui.arrow*ui.a)}else if(ui.tick&&arw.style.opacity!=='0')arw.style.opacity='0';
  // chevron: over the nearest creature that counts when it's on screen but far, at the edge when it's off screen
  let cv=0,cx=0,cy=0,cr=0;const c=!outside&&live?ui.near:null;
  if(c&&c.g){const p=c.g.position,d=Math.hypot(p.x-X.px,p.z-X.pz),hy=headY(c)+(c.boss?1.6:.9);camSpace(p.x,hy,p.z);
    VP.set(p.x,hy,p.z).project(X.cam);const on=VC.z<0&&Math.abs(VP.x)<.92&&Math.abs(VP.y)<.88;
    // no floating marker over people (user): only an edge pointer when the target is off screen
    if(!on){cv=.9;const b=Math.atan2(VC.x,-VC.z);[cx,cy]=edgePos(b);cr=b+PI}}
  ui.chev+=clamp(cv-ui.chev,-dt*6,dt*4);
  if(ui.chev*ui.a>.01&&(cx||cy))setUI(chev,cx,cy,cr,ui.chev*ui.a);else if(ui.tick&&chev.style.opacity!=='0')chev.style.opacity='0';
  // paper tags over eligible creatures within ~20 m
  const col=n?PLAN[n].pal:'#f6a6c1',tex=tagTex(col);
  for(let i=0;i<tagPool.length;i++){const tg=tagPool[i],e=live?ui.list[i]:null,cn=e&&e[1];
    if(tg.n!==cn){tg.n=cn;tg.a=0}
    if(!cn||!elig(cn,n)){tg.a=Math.max(0,tg.a-dt*5);if(tg.a<=0){tg.s.visible=false;continue}}
    else{const d=Math.hypot(cn.g.position.x-X.px,cn.g.position.z-X.pz),want=clamp((TAG_R+2-d)/6,0,1);tg.a+=clamp(want-tg.a,-dt*5,dt*3)}
    tg.s.visible=false;continue;// no floating tags over people (user)
    if(!tg.n||tg.a<=.01){tg.s.visible=false;continue}
    const p=tg.n.g.position;if(tg.m.map!==tex){tg.m.map=tex;tg.m.needsUpdate=true}
    tg.s.position.set(p.x,headY(tg.n)+Math.sin(t*3.2+tg.ph)*.09+.15,p.z);{const k=1+Math.hypot(p.x-X.px,p.z-X.pz)/28;tg.s.scale.set(.56*k,.7*k,1)}tg.m.opacity=qa(tg.a*ui.a)*.95;tg.s.visible=tg.m.opacity>.01}}

/* ---------- Sal in person: walk up to the Cloud Kingz doorway to hear the deal again ---------- */
const sal={look:0,yaw0:null,ba:0};
function salStep(dt,t){const s=X.sal;if(!s||!s.g)return;const g=s.g,p=g.position;if(sal.yaw0===null)sal.yaw0=g.rotation.y;
  const d=Math.hypot(p.x-X.px,p.z-X.pz),live=X.mode==='play'&&st.phase==='play'&&!seq;
  const ready=live&&!cl.busy&&!X.held&&!rv.h&&!carriedN()&&performance.now()>st.salAt&&performance.now()>st.delAt+15000;
  // tiny paper speech bubble over his head when you're close and he has something to say
  const ba=ready&&d<9?clamp((9-d)/3,0,1):0;sal.ba+=clamp(ba-sal.ba,-dt*4,dt*3);salB.material.opacity=qa(sal.ba);salB.visible=salB.material.opacity>.01;
  if(salB.visible)salB.position.set(p.x,p.y+1.75+Math.sin(Math.floor(t*10)/10*3)*.06,p.z);
  if(ready&&d<SAL_R){const fx=-Math.sin(X.yaw),fz=-Math.cos(X.yaw),dot=((p.x-X.px)*fx+(p.z-X.pz)*fz)/(d||1);if(dot>.55)salGreet()}
  // he turns to face you while talking, then back to the town
  sal.look=Math.max(0,sal.look-dt);const want=sal.look>0?Math.atan2(X.px-p.x,X.pz-p.z):sal.yaw0;
  let da=want-g.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>.002)g.rotation.y+=da*Math.min(1,dt*6)}
function salGreet(){const n=st.ch;if(!n)return;st.salAt=performance.now()+SAL_CD*1000;sal.look=30;st.moodOv='happy';setMood();
  const my=st.run;setTimeout(()=>{if(st.run===my&&st.moodOv==='happy'){st.moodOv=null;setMood()}},2600);
  callPlay([CALL('hey'),GOALCALL(n)],{live:true},()=>{sal.look=1.2;st.salAt=performance.now()+SAL_CD*1000});
  const tk=cl.tok;setTimeout(()=>{if(cl.tok===tk)return;sal.look=Math.min(sal.look,1)},50)}

/* ================= DELIVERY (ch1-4): carried customers, Sal's bring-back calls, the drop-off, the walk-in ================= */
function carryAdd(c){if(!c||c._carry||credited.has(c))return;c._carry=1;st.carry.push(c);hud();const now=performance.now();
  if(!st.backSaid){st.backSaid=1;if(!st.want){st.want='back1';st.wantAt=now+1400}}
  if(!st.enoughSaid&&st.got+carriedN()>=st.goal){st.enoughSaid=1;st.want='enough';st.wantAt=now+1400}}
// chapter change: leftovers stop being customers (they stay hooked fans); anyone mid-walk already made it inside
function flushCarry(){for(const c of st.carry)c._carry=0;for(const c of st.walk){c._carry=0;if(c._in){c._in=null;if(X.crowds&&X.crowds.removeNpc)X.crowds.removeNpc(c)}}
  st.carry.length=0;st.walk.length=0;st.want=null;st.backSaid=st.enoughSaid=0;st.backAt=0;rv.said=rv.pend=0;rv.alr=0}
/* Sal phones once when the first customer tags along, once when the order is complete, then at most every 40 s while you're
   carrying people away from the shop (never when you're already at the door; the door does the talking there). */
const shopS=[];let shopT=0;
function callStep(dt){const now=performance.now();
  for(let i=st.carry.length-1;i>=0;i--){const c=st.carry[i];if(!c.hooked||X.npcs.indexOf(c)<0){c._carry=0;st.carry.splice(i,1);hud()}}
  const dS=Math.hypot(DROP.x-X.px,DROP.z-X.pz),near=dS<=DROP.trig+3;
  if((shopT-=dt)<=0){shopT=2;shopS.push(dS);if(shopS.length>4)shopS.shift()}
  if(st.enoughSaid&&carriedN()&&!st.want&&now>st.backAt+BACK_CD*1000&&dS>24&&shopS.length>=3&&shopS[shopS.length-1]-shopS[0]>BACK_AWAY){st.want='back'+(2+st.backI++%2);st.wantAt=now}
  if(!st.want)return;if(near||!carriedN()){st.want=null;return}
  if(now>=st.wantAt&&!cl.busy&&!rv.h&&!seq){const k=st.want;st.want=null;st.backAt=now;callPlay([CALL(k)])}}
// at the door: customers peel off the line one at a time (nearest first) and squeeze in past Sal
let dvNext=0;
function deliverStep(){if(!st.carry.length||!X.crowds||!X.crowds.walkIn)return;const now=performance.now();
  if(now<dvNext||Math.hypot(DROP.x-X.px,DROP.z-X.pz)>DROP.trig)return;const p0=DROP.path[0];let best=null,bd=DROP.reach;
  for(const c of st.carry){if(c===X.held||c.state==='held')continue;const d=Math.hypot(c.g.position.x-p0[0],c.g.position.z-p0[1]);if(d<bd){bd=d;best=c}}
  if(!best)return;const tok=st.run,n=st.ch;st.carry.splice(st.carry.indexOf(best),1);st.walk.push(best);
  if(!X.crowds.walkIn(best,DROP.path.map(q=>q.slice()),c=>delivered(c,tok,n))){st.walk.pop();st.carry.push(best);return}
  dvNext=now+rand(DEL_GAP[0],DEL_GAP[1])*1000;sal.look=Math.max(sal.look,2.5)}
const WHITE=new T.Color(1,1,1);
function delivered(c,tok,n){const i=st.walk.indexOf(c);if(i>=0)st.walk.splice(i,1);c._carry=0;if(tok!==st.run||st.ch!==n)return;
  credited.add(c);st.delAt=performance.now();st.salAt=Math.max(st.salAt,st.delAt+SAL_CD*1000);sal.look=Math.max(sal.look,2);
  const q=DROP.path[DROP.path.length-1];try{for(let k=0;k<4;k++)X.puff(q[0]+rand(-.3,.3),rand(.6,1.4),q[1]-.2,rand(-1,1),rand(.4,1.2),rand(-1.6,-.6),WHITE,.55,.15,.7)}catch(e){}
  if(!X.muted)try{X.beep(1568,.07,'triangle',.03);X.beep(2093,.1,'triangle',.026,.07)}catch(e){}// the shop-door bell
  if(st.phase==='play'&&st.got<st.goal){st.types[st.got]=c.type;st.got++;hud();sell();cheer(st.got)}else hud();
  check()}
// the counter ticks down as they buy: catch the count up to where the chapter's pacing says it should be
function sell(){const e=expected(),k=Math.round(clamp(X.count-e,0,120));if(k>0)capCount(Math.max(floor(),X.count-k))}
/* Sal's live count: one line at a time, never over a phone call; when customers arrive faster than he can shout he skips to the
   latest number (the goal number always gets said). A fresh batch opens with an "Alright!" */
const rv={h:null,said:0,pend:0,last:-1e9,alr:0,mt:0};
function cheer(k){rv.pend=Math.max(rv.pend,k);if(!rv.h&&k>1&&performance.now()-rv.last>4000)rv.alr=1;
  st.moodOv='happy';setMood();const my=st.run;clearTimeout(rv.mt);rv.mt=setTimeout(()=>{if(st.run===my&&st.moodOv==='happy'){st.moodOv=null;setMood()}},2800);rvPlay()}
function rvPlay(){if(rv.h||rv.pend<=rv.said)return;if(cl.busy||seq||performance.now()-st.delAt>4500){rv.said=rv.pend;rv.alr=0;return}
  const C=LIVE('count'),A=LIVE('alright'),k=rv.pend;let v;
  if(rv.alr){rv.alr=0;v=X.pick(A)}else{v=k<=C.length?C[k-1]:X.pick(A);rv.said=k}
  rv.h=sound(v,()=>{rv.h=null;rv.last=performance.now()})}

/* ---------- the drop-off indicator: a chunky clay arrow bobbing over the door (grows with distance so it clears the rooftops),
   a ring of felt pads on the sidewalk that chase round, the cloud sign blinking pink. All on held frames (~11 fps) with a little
   jitter; it pops in when you carry someone and out when you don't. ---------- */
let ind=null;
function indBuild(){const g=new T.Group(),mat=(c,kind,fog)=>{const m=new T.MeshToonMaterial({color:c});if(fog===false)m.fog=false;try{if(X.clay&&X.clay.setKind)X.clay.setKind(m,kind)}catch(e){}return m};
  const SG=new T.SphereGeometry(1,10,7),CY=new T.CylinderGeometry(1,1,1,9),CO=new T.ConeGeometry(1,1,8);
  const pk=mat(0xff5fa2,'clay',false),pk2=mat(0xe9448a,'clay',false),cr=mat(0xfff1d2,'clay',false);
  const A=new T.Group();A.position.set(DROP.path[0][0],7.3,15.7);g.add(A);
  const put=(p,geo,m,x,y,z,sx,sy,sz,rx,rz)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx||0,0,rz||0);p.add(o);return o};
  put(A,CO,pk,0,1.05,0,1.5,2.1,1.05,PI);put(A,CY,pk,0,3.35,0,.6,2.7,.48);put(A,SG,pk,0,4.7,0,.6,.32,.48);put(A,CY,cr,0,2.5,0,.68,.34,.56);
  put(A,SG,pk2,.62,1.5,.32,.32,.2,.14,0,.4);put(A,SG,pk2,-.5,1.85,-.3,.26,.16,.12,0,-.3);put(A,SG,cr,.12,3.9,.42,.14,.1,.06);// thumb lumps
  const R=new T.Group();R.position.set(DROP.x,0,DROP.z);g.add(R);const fp=mat(0xff7ab4,'cloth'),fc=mat(0xfff6ea,'cloth'),pads=[];
  for(let i=0;i<14;i++){const a=i/14*PI*2,x=Math.cos(a)*DROP.r,z=Math.sin(a)*DROP.r,o=put(R,SG,i%2?fc:fp,x,DROP.z+z>13.65?.15:.04,z,.46,.08,.28);o.rotation.y=-a-PI/2;o.userData.y0=o.position.y;pads.push(o)}
  const Sg=new T.Group();Sg.position.set(0,5.12,16.6);g.add(Sg);const sp=mat(0xff3fa4,'clay',false);
  for(const[x,y,r]of[[-1.3,-.1,.56],[-.55,.27,.7],[.45,.36,.66],[1.3,0,.57],[0,-.22,.64]])put(Sg,SG,sp,x,y,0,r,r*.82,.1);
  g.visible=false;X.scene.add(g);ind={g,A,R,pads,Sg,k:0,f:0,tk:0,pk:0}}
function indStep(dt){const want=st.ch>=1&&st.ch<=4&&(st.phase==='play'&&carriedN()>0||st.walk.length>0)&&X.mode!=='intro'&&X.mode!=='won';
  if(!ind){if(!want)return;indBuild()}
  if((ind.tk-=dt)>0)return;ind.tk=1/11;ind.f++;
  ind.k=want?Math.min(3,ind.k+1):Math.max(0,ind.k-1);ind.g.visible=ind.k>0;if(!ind.g.visible){ind.pk=0;return}
  const pop=ind.k===3&&ind.pk===2?1.22:[0,.45,.8,1][ind.k];ind.pk=ind.k;
  const j=RMq.matches?0:1,d=Math.hypot(DROP.x-X.px,DROP.z-X.pz),far=clamp(d/24,1,4),b=ind.f%8,bob=[0,.3,.6,.8,.85,.7,.45,.15][b]*j;
  const A=ind.A,sq=b===0&&j?1:0;A.scale.set(pop*far*(1+.1*sq),pop*far*(1-.14*sq),pop*far*(1+.1*sq));
  A.position.y=7.3+(far-1)*4+bob*far+rand(-.04,.04)*j;/* far away it rides higher, over the rooftops */A.rotation.set(0,Math.floor(ind.f/2)*.42*j,rand(-.05,.05)*j);
  for(let i=0;i<ind.pads.length;i++){const o=ind.pads[i],on=((i-ind.f)%7+7)%7<2;o.scale.y=on?.2:.08;o.position.y=o.userData.y0+(on?.08:0)}
  ind.R.scale.setScalar(pop*(ind.f%6<3?1:1.08));ind.R.rotation.y=rand(-.02,.02)*j;
  ind.Sg.visible=ind.f%7<4;ind.Sg.scale.setScalar(pop)}

/* ================= FLOW ================= */
function freeze(){if(X.held)try{X.release(X.held,'ok')}catch(e){}if(X.mode==='play'||X.mode==='paused')X.mode='cutscene';X.keys.Space=0;
  if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock()}
/* the game starts underneath the opening cutscene (all game audio is ducked while it plays, so the core's own
   "let's go" line can't talk over Sal's goal call). The reshot ch1 opening already shows the open container, so juice's
   container intro is skipped: started and ended at once, which opens the doors and settles the vape spill. */
let killCine=false;
function earlyStart(){const m=X.mode;
  if(m==='intro'){$('intro').hidden=true;coreStart();
    if(!introSeen&&X.playIntro){introSeen=true;X.playIntro();if(X.cine){X.mode='story';killCine=true;return}}// juice ends it on its next frame
    if(X.mode==='play')X.mode='cutscene';return}
  if(m==='won'){$('win').hidden=true;coreReset();if(X.mode==='play')X.mode='cutscene'}}
X.on('prerender',()=>{if(killCine&&!X.cine){killCine=false;if(X.mode==='story')X.mode=seq?'cutscene':'play'}});
function ensureStarted(n,cb){if(X.mode==='intro'||X.mode==='won')earlyStart();if(killCine||X.cine){onIntro=cb;return}cb()}
function enter(n){const tok=st.run,P=PLAN[n];flushCarry();st.ch=n;st.phase='in';st.got=0;st.types=[];st.goal=P.goal;st.bossBeat=false;st.mood=P.mood;st.moodOv=null;setMood();
  if(X.mode==='play'||X.mode==='paused')freeze();callStop();X.emit('chapter',n,'in');prep(n);buildHud(n);hud();
  warm([...(CH(n).in||[]),...(CH(n).out||[]),GOALCALL(n),CALL('clear'),CALL('nudge'),CALL('hey'),...((CH(n+1)||{}).in||[])]);
  if(n<5)warm([CALL('back1'),CALL('back2'),CALL('back3'),CALL('enough'),...LIVE('count').map(vo=>({vo})),...LIVE('alright').map(vo=>({vo}))]);
  play(CH(n).in,()=>{if(tok!==st.run)return;ensureStarted(n,()=>{if(tok===st.run)begin(n)})},CH(n).district,true);
  if(X.mode==='intro'||X.mode==='won')setTimeout(()=>{if(tok===st.run&&seq)earlyStart()},450)}// once the cutscene covers the screen
function begin(n){const tok=st.run;st.phase='play';if(X.mode==='cutscene'&&!X.cine)X.mode='play';
  st.c0=X.count;st.acc=0;st.outT=0;st.tIn=performance.now();st.nudgeAt=performance.now()+20000;st.salAt=performance.now()+8000;
  if(n===5){st.c5=Math.max(1,X.count);st.t5=0;st.p5=0;lvShown=-1}
  beaconOn(n);X.emit('chapter',n,'play');hud();showCard(n);ui.scanT=0;ui.home=false;arw.style.setProperty('--stc',PLAN[n].pal);
  // Sal phones in the goal while the title card is still up; the boss turns up as he names it
  setTimeout(()=>{if(tok===st.run&&st.ch===n&&st.phase==='play')callPlay([GOALCALL(n)])},420);
  const k=PLAN[n].boss;if(k)setTimeout(()=>{if(tok!==st.run||st.ch!==n||st.phase!=='play'||!X.crowds||!X.crowds.spawnBoss)return;
    try{X.crowds.spawnBoss(k)}catch(e){console.warn('[story] boss',e)}},BOSS_DELAY*1000)}
function check(){if(st.phase==='play'&&st.ch>=1&&st.ch<=4&&st.got>=st.goal&&bossDone(st.ch))clear()}
function clear(){const n=st.ch,tok=st.run,late=performance.now()-st.bossT<600?1300:0;st.phase='out';X.emit('chapter',n,'out');beaconOff();hud();callStop();
  setTimeout(()=>{if(tok===st.run&&st.phase==='out')stampCheck()},late);
  let went=false;const go=()=>{if(went)return;went=true;if(tok!==st.run||st.phase!=='out')return;freeze();capCount(PLAN[n].cap);
    // an optional boss nobody beat (the ch2 diva) leaves with the chapter
    const b=bossCfg(n);if(b&&!PLAN[n].need&&b.n&&!b.n.boss.dead&&X.crowds.despawn)X.crowds.despawn(b);
    play(CH(n).out,()=>{if(tok===st.run)enter(n+1)},CH(n).district,false)};
  // Sal finishes his live count ("FIVE! Yes! YES!") before he phones the clear
  const t0=performance.now(),call=()=>{if(tok!==st.run||st.phase!=='out')return;if((rv.h||rv.pend>rv.said)&&performance.now()-t0<5000){rvPlay();setTimeout(call,120);return}
    callPlay([CALL('clear')],null,()=>setTimeout(go,150))};
  setTimeout(call,380+late);
  setTimeout(go,13000+late)}
function newRun(){flushCarry();st.run++;credited=new Set();st.phase='idle';st.ch=0;st.moodOv=null;onIntro=null;clearTimeout(cardTm);card.classList.remove('go');callStop();beaconOff(true);freeHide(false);buildHud(0);sal.look=0}

$('go').onclick=()=>{$('intro').hidden=true;newRun();enter(1)};
$('again').onclick=()=>{$('win').hidden=true;newRun();enter(1)};

/* ---------- game hooks ---------- */
X.on('start',()=>{X.twist=true});// the story has its own twist (the end): no surprise second container mid-run
// a creature becomes a carried customer when it gets hooked inside the chapter's district (only the district's kinds, once
// each); it counts for the chapter once it walks into Cloud Kingz (delivered → credited)
X.on('release',n=>{if(st.phase!=='play'||st.ch<1||st.ch>4||n.boss||n.hooked||n._carry||credited.has(n)||!counts(n,st.ch))return;
  if(!(n.times>=n.t.hook))return;const dk=CH(st.ch).district,p=n.g.position;
  if(!inD(dk,p.x,p.z)&&!inD(dk,X.px,X.pz))return;carryAdd(n)});
X.on('boss',(n,what)=>{if(what!=='defeat'||!st.ch||!n.boss||n.boss.key!==PLAN[st.ch].boss)return;st.bossBeat=true;st.bossT=performance.now();hud();check()});
// pacing: where the count "should" be right now; ahead of it → refund some vapes, behind → take a few extra
function expected(){if(st.ch===5){const k=clamp(st.t5/CH5_SECS,0,1);return DETECTO_FLOOR+(st.c5-DETECTO_FLOOR)*(1-k)}
  const P=PLAN[st.ch];return st.c0-pace()*Math.max(0,st.c0-P.cap)}
const refund=()=>{X.count=X.count+1;X.used=Math.max(0,X.used-1);if(X.STOCK[X.fi]!=null)X.STOCK[X.fi]++};
X.on('vape',()=>{const f=floor();if(X.count<f){refund();return}
  if(st.phase!=='play'||!st.ch)return;const e=expected(),lead=e-X.count,slack=st.ch===5?300:60;
  if(lead>slack){if(Math.random()<Math.min(.95,(lead-slack)/150))refund();return}
  if(lead<0){st.acc+=Math.min(st.ch===5?2.5:1,-lead/250);while(st.acc>=1&&X.count>f+1){X.count--;X.used=X.used+1;if(X.STOCK[X.fi]>0)X.STOCK[X.fi]--;st.acc--}}});
// ch5: free samples for everyone (hide that power-up's icon: it's the chapter, not a pickup)
let freeEl=null;function freeHide(v){if(!freeEl){const i=Object.keys(X.PW||{}).indexOf('free'),p=$('powers');if(i>=0&&p)freeEl=p.children[i]}if(freeEl)freeEl.style.visibility=v?'hidden':''}
// wandering off: after a while outside the district without closing in, Sal calls (cooldown 45 s)
const dSamp=[];let dSampT=0;
function nudgeStep(dt){const n=st.ch;if(n<1||n>4)return;const P=PLAN[n],dk=CH(n).district;
  if(carriedN()||performance.now()<st.delAt+25000){st.outT=0;dSamp.length=0;return}// on the way to (or back from) the shop
  if(inD(dk,X.px,X.pz)){st.outT=0;dSamp.length=0;return}st.outT+=dt;
  if((dSampT-=dt)<=0){dSampT=3;dSamp.push(Math.hypot(P.at[0]-X.px,P.at[1]-X.pz));if(dSamp.length>4)dSamp.shift()}
  const closing=dSamp.length>=2&&dSamp[0]-dSamp[dSamp.length-1]>8;
  if(st.outT>NUDGE_OUT&&!closing&&!cl.busy&&!X.held&&performance.now()>st.nudgeAt)nudge()}
function nudge(){st.nudgeAt=performance.now()+NUDGE_CD*1000;callPlay([CALL('nudge')])}
X.on('frame',(dt)=>{
  if(st.phase==='play'){check();
    if(st.ch===5){st.t5+=dt;X.act.free=Math.max(X.act.free,1.5);freeHide(true)}
    else{nudgeStep(dt);callStep(dt);deliverStep();if((topT-=dt)<=0){topT=4;topUp(st.ch,true)}}}
  if(rv.pend>rv.said)rvPlay();
  // spawned roamers (joggers) stay in their district
  for(const n of X.npcs){if(!n._home||n.state!=='wander'||(n.tx===n._sx&&n.tz===n._sz))continue;if(!inD(n._home,n.tx,n.tz)){const[x,z]=spot(n._home);n.tx=x;n.tz=z}n._sx=n.tx;n._sz=n.tz}
  hud()});
let moodT=0,topT=4;
// the pause menu holds Sal's call (line and polaroid) until you're back
let callPaused=false;
function pauseStep(){const p=X.mode==='paused';if(p===callPaused)return;callPaused=p;stc.style.visibility=p?'hidden':'';
  const a=cl.h&&cl.h.a;if(a){if(p)a.pause();else{const q=a.play();if(q&&q.catch)q.catch(()=>{})}}}
X.on('prerender',(dt,t)=>{const d=Math.min(.05,dt||.016),tt=performance.now()/1000;beaconStep(d,tt);uiStep(d,tt);salStep(d,tt);indStep(d);pauseStep();moodT-=d;if(moodT<0){moodT=.5;setMood()}});
// ending: after the final-vape slow-mo (juice), the end cutscene, then the win screen
X.on('win',()=>{const tok=st.run,t0=performance.now();st.phase='end';callStop();if(st.ch)X.emit('chapter',st.ch,'out');beaconOff();freeHide(false);hud();
  const wait=()=>{if(tok!==st.run||X.mode!=='won')return;const w=$('win');
    const el2=performance.now()-t0;if(el2>7000||!X.game.classList.contains('jz-cine')){/* juice's final-vape finish is over (or absent) */w.hidden=true;play(S.end||[],()=>{if(tok===st.run&&X.mode==='won')w.hidden=false},'square')}else setTimeout(wait,120)};
  setTimeout(wait,600)});

/* ================= API ================= */
X.story={get chapter(){return st.ch},get phase(){return st.phase},get goal(){return st.ch===5?st.c5:st.goal},
  get progress(){return progress()},get hooked(){return st.got},get carried(){return carriedN()},drop:DROP,play:(shots,done)=>play(shots,done),get script(){return S}};

if(location.hash==='#dbg')window.tmvs={
  chapter(n){n=clamp(n|0,1,5);if(seq)finish(true);newRun();
    earlyStart();
    const B=BOSSES();if(B)for(const k in B){const c=B[k];if(c.n&&X.crowds.despawn)X.crowds.despawn(c)}
    capCount(START[n]);enter(n)},
  win(){if(st.phase!=='play')return 'not in play';const k=PLAN[st.ch].boss,B=BOSSES();
    if(k&&B&&PLAN[st.ch].need){if(!B[k].n&&X.crowds.spawnBoss)X.crowds.spawnBoss(k);if(B[k].n&&!B[k].n.boss.dead&&X.crowds.defeat)X.crowds.defeat(B[k].n)}
    if(st.ch<5){while(st.got<st.goal){st.types[st.got]=PLAN[st.ch].icons[st.got%PLAN[st.ch].icons.length];st.got++}hud();check();return 'ch'+st.ch+' goal met'}
    st.t5=CH5_SECS;if(X.count>0){X.count=1;X.drain(2)}return 'emptied'},
  // hooks the nearest creature that counts (it joins the line as a carried customer)
  hook(){if(st.phase!=='play'||st.ch>4)return 'no';let b=null,bd=1e9;for(const c of X.npcs)if(elig(c,st.ch)){const d=Math.hypot(c.g.position.x-X.px,c.g.position.z-X.pz);if(d<bd){bd=d;b=c}}
    if(!b)return 'none';b.times=Math.max(b.times,b.t.hook);b.hooked=true;if(b.H&&b.H.Wh)for(const wm of b.H.Wh)wm.material=X.M(0xffc4c4);carryAdd(b);return st.got+' in, '+carriedN()+' carried /'+st.goal},
  home(){X.px=DROP.x;X.pz=DROP.z-2.5;X.yaw=PI;X.pitch=0;return 'at the drop-off'},
  skip(){if(seq){finish();return 'cutscene'}if(X.cine){dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK'}));return 'intro'}return 'nothing'},
  greet(){st.salAt=0;salGreet();return 'greet'},nudge(){nudge();return 'nudge'},
  get s(){return{ch:st.ch,phase:st.phase,got:st.got,goal:st.goal,boss:st.bossBeat,count:X.count,floor:floor(),mode:X.mode,progress:progress(),carried:carriedN(),walking:st.walk.length,want:st.want,eligible:st.ch&&st.ch<5?X.npcs.filter(c=>elig(c,st.ch)).length:0,call:cl.busy,vo:voN}}};
})();
