# Too Many Vapes: story bible (draft 1)

Draft for sign-off. Nothing here is built into the game yet.

## The town: Coral Vista, Florida

- A small beach town that peaked in 1987 and has been repainting the same pastel buildings ever since.
- Founded as a retirement resort. The resort never opened; the town grew around its empty parking lot, which became the town square.
- Town motto, on the water tower: "Breathe Easy." Coral Vista once won "Cleanest Air in Florida" (1994) and still has the trophy in Town Hall. This is the joke the whole game leans on.
- Nothing happens here. The biggest news last year was a pigeon getting into the bank. That is why one shipping container can change everything.
- The coast runs along the east side of town, like the real South Florida shoreline. In the game's own coordinates the ocean is still at -z; only the compass changes.
- Districts (match `assets/clay/map_town.png`):
  - **Downtown:** five blocks of shops that all sell slightly the wrong thing.
  - **The Park (north):** pond, gazebo, the town's retirees and its tuba player.
  - **Muscle Beach and the beach (east, on the Atlantic):** the only place in town with ambition.
  - **The Farm (south):** one family farm that predates the town and resents it.
  - **School (west, inland):** kept out of the main story; optional bonus area.

## The two leads

### Sal (the boss)
- Salvatore "Sal" Pappas, 56. Very short. Owns Cloud Kingz, the only vape shop in town, on the inland (west) side of the square.
- Backstory: sold pool supplies for 30 years. Bought the vape shop 8 months ago with his whole pension because a guy at a trade show told him vapes were "pool chemicals for the lungs." Has sold 11 vapes total.
- Personality at the start: terrified. Of the bank, of the supplier, of his own inventory. Apologises to customers for the prices.
- The typo: he meant to reorder 50 units. His finger slipped. 5,000 arrived on a truck he could not send back, invoice due Friday.
- Arc: fear → hope → greed → monster. Every chapter he is a little louder and a little better dressed. By the end he is wearing two gold chains and talking about "franchising the lungs."
- Voice: gruff, fast, cracking under pressure. One fixed voice for every line.

### The Vape Bro (you)
- Never named. Sal calls him "kid." Everyone else calls him "vape guy."
- 24, lifelong Coral Vista surfer. The waves here are about knee-high, so he has a lot of free time. Answered Sal's "HELP WANTED" sign because the shop is next to the beach path.
- Personality at the start: zero doubt, zero plan. Treats it as a sport. Narrates his own highlights (this is the existing in-game "Dude, brooo" voice).
- Arc: careless → proud → uneasy → has a conscience at exactly the wrong time. By chapter 4 he notices his own beach is too foggy to see the waves.
- The swap: Sal and the bro trade places over the story. The scared one becomes shameless; the shameless one gets scared.

## Chapters

Each chapter: a cutscene in, a new district, one new gameplay element, a "town hooked" target, a cutscene out.

| # | Title | District | New element | Story beat |
|---|---|---|---|---|
| 1 | The Typo | Downtown | Basics: grab, hold, release in the green | Container lands. Sal panics. "Get out there, kid." |
| 2 | Word of Mouth | The Park | Hooked followers, conga line | People come back asking for more. Sal dares to hope. |
| 3 | Home Turf | Muscle Beach, beach | Power-ups, cops, first boss | The bro shows off on his own beach. The town notices. |
| 4 | Fresh Lungs | The Farm | Animals, cravings matter more | Town is nearly out of unhooked people. Sal says "the cows." The bro hesitates. |
| 5 | Zero | Town square | Everything at once, haze | Last vapes go. Twist: demand is now so high Sal has ordered 50,000. Second truck arrives. |

- Ending line (Sal, crying with joy): "You did it, kid… so, uh. I ordered another container."
- Optional post-credits: the "Breathe Easy" water tower, barely visible through haze.

## Soundtrack plan

### Sound of the world
A clay world should sound handmade. Core palette: toy piano, melodica, ukulele, kazoo, cheap drum machine, surf guitar, one wobbly synth. Slightly out of tune on purpose.

### Themes that return
1. **Container theme:** a five-note descending hook (the "oh no" motif). Appears in the intro, returns under every cutscene, and resolves upward only in the ending.
2. **Sal's theme:** nervous lounge organ and brushed drums. Each chapter it gains instruments and confidence; by chapter 5 it is a full brass fanfare of the same tune.
3. **Bro's theme:** laid-back surf guitar. Starts as the main gameplay groove; in chapter 4 it drops to a slower, minor-key version.
4. **Town theme ("Breathe Easy"):** a clean, sunny jingle for the title screen. It gets hazier each chapter: slower, more reverb, slightly detuned as "town hooked" rises.

### Modes where the music shifts
- **Title:** town jingle, clean.
- **Cutscene:** container theme under dialogue, quiet.
- **Explore:** the district's version of the bro's theme.
- **Chase:** same tune, double-time drums (cops or boss nearby).
- **Boost / power-up:** short overdriven sting layered on top.
- **Haze layer:** tied to "town hooked %": more reverb and wobble as it climbs.
- **Chapter clear:** Sal's fanfare, one size bigger each time.

### District variations of the gameplay groove
- Downtown: synth-funk with drum machine.
- Park: ukulele, whistling, tuba bass (the tuba player is in the park).
- Beach: full surf rock.
- Farm: banjo and washboard version.
- Finale: all of the above stacked, half-speed, drowning in haze.

### The album (about 14 tracks)
1. Breathe Easy (title jingle)
2. Oh No (container theme)
3. Sal's Got a Problem
4. Get Out There, Kid (downtown groove)
5. Word of Mouth (park)
6. Conga Line
7. Home Turf (beach surf rock)
8. Vape Police (chase)
9. On Fire (boost)
10. Fresh Lungs (farm)
11. Too Foggy to Surf (bro's theme, minor)
12. Franchise the Lungs (Sal's theme, full brass)
13. Zero (finale)
14. Another Container (credits, town jingle fully hazed)

### Honest limits
- Tracks are generated one at a time, so a melody will not carry across tracks note-for-note. Consistency comes from fixing the key, tempo family and instrument palette in every prompt, and reusing the same short written description of each hook.
- The haze layer and chase switch are done in the game's audio code (filters, reverb, crossfades), not by generating extra tracks.
- The game already has three tracks (title, main, chase) in the old style; they would be replaced.
