/* ============================================================================
   INDEX 85 - STORY QUICK WINS (from audits/story.md)
   Loaded after the main script in index.html. Wrap game functions the
   same way the Index sections do:  { const f = fn; fn = function(){ ... }; }
   Each change: a short note here (what, why) and a ROLLBACK line.

   STORY-01  The Reeve speaks: a line on Day 1, the last day, and on events.
   STORY-02  A story line after each assault (and STORY-14: who the levy are).
   STORY-03  Voices for Orsolt, Ilvaryn, Khan Duruk (spawn, fall, riders).
   STORY-06  Varnholt's carts join the column on the road.
   STORY-07  One line per contract result in the debrief.
   STORY-08  A line when a building is finished (camp note and the Works line).
   STORY-10  (calmer Bard intro: small patch in index.html marked Index 85)
   STORY-15  Nemesis arrival and nemesis slain lines.
   STORY-16  More bark lines, Bard lines and alternate contract briefs.
   STORY-17  Grey Cloaks note on a held Varnholt (text only, no Standing).
   ROLLBACK: delete this file's <script> tag in index.html, and restore the
   Bard intro line marked Index 85.
============================================================================ */
(function(){
  'use strict';
  const pick = a => a[Math.random() * a.length | 0];
  const STORY_K50 = {   /* [N] Planner k50 */
    fled: 'You left the caravan to its guards. Cayde will hear by nightfall whether it got through.',
    withdrawn: 'You pulled back and the caravan went on alone. Cayde will hear by nightfall whether it got through.'
  };
  const story = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };

  /* ---- STORY-01 / 06 / 17: the Reeve and the carts -------------------- */
  const REEVE_DAY1 = '“I have a purse, a mill and no soldiers,” says the Reeve. “You will do. Look up the north road, put spears in the hands of the people who will stand behind you, and mend my gate. In that order, if you please.”';
  const REEVE_LAST = '“If this fails, Varnholt was a silver town for eleven generations,” says the Reeve. “Write that down somewhere.”';
  const REEVE_AFTER = {
    'The First Wave': '“I had planned a speech,” says the Reeve. “I have lost the speech. Thank you.”',
    'The Last Day of Varnholt': '“Load the carts,” says the Reeve. “I will count the town twice and sit on the last one.”'
  };
  const REEVE_EVENT = {
    mill: '“That was my grain,” says the Reeve. “I will mention it.”',
    starving: '“The cellar is empty,” says the Reeve. “So is my patience, and I had a lot.”'
  };
  if (typeof nextDay === 'function'){
    const f = nextDay;
    nextDay = function(){
      f();
      try {
        const C = CP(); if (!C || C.part !== 'siege' || !C.dayNews) return;
        const say = t => C.dayNews.push(`<i>${t}</i>`);
        if (C.day === 1) say(REEVE_DAY1);
        else if (C.day === lastDay()){ if (C.lastReeve) say(C.lastReeve); say(REEVE_LAST); }
        else if (C.starving) say(REEVE_EVENT.starving);
        else if (C.district.mill === 'overrun' && !C.reeveMill){ C.reeveMill = true; say(REEVE_EVENT.mill); }
        else if (C.lastReeve) { say(C.lastReeve); }
        C.lastReeve = null;
      } catch (e) { console.warn('story nextDay', e); }
    };
  }
  if (typeof startRoadDay === 'function'){
    const f = startRoadDay;
    startRoadDay = function(){
      f();
      try {
        const C = CP(); if (C && C.part === 'road' && C.night === 1 && C.dayNews)
          C.dayNews.push('<i>Varnholt’s carts reach the forest road at midnight and fall in behind the elves. Nobody says much. Everyone counts the same number twice.</i>');
      } catch (e) {}
    };
  }
  if (typeof retreatHTML === 'function'){
    const f = retreatHTML;
    retreatHTML = function(){
      let h = f();
      try {
        const C = CP(), won = C.siegeWon;
        h = h.replace('<p>Your Squad Leader, Squad Mates and gear come with you.',
          `<p><i>Varnholt’s carts go out with you and join the elves’ column at the forest road.${won ? ' The company ledger notes the Keep and says nothing else.' : ' The Reeve rides the last cart and does not look back.'}</i></p><p>Your Squad Leader, Squad Mates and gear come with you.`);
      } catch (e) {}
      return h;
    };
  }

  /* ---- STORY-02 / 14: after each assault; STORY-07: contract results --- */
  const ASSAULT_AFTER = {
    'The First Wave': {win:'They came in a line and went away in pieces. The gate has a new scar and the Mill still turns. These were Hollow Levy: field-hands with a tithe-mark on the wrist, driven by Overseers at the back. The Reeve says it quietly: “Those are somebody’s farmers.”',
                       loss:'The levy are through the gate, and nobody on the wall has the heart to say how many there were.'},
    "The Reeve's Tithe": {win:'The host draws off in good order, which is the only good thing about it.', loss:'The north is lost. The tithe was collected in full.'},
    'The Hired Line': {win:'The ram burned. The Overseer is still deciding whether to be brave.', loss:'The ram reached the gate and the gate did not argue.'},
    'Over the Wall': {win:'The night was long and the palisade is shorter than it was. The Tithe-Priest’s lamp goes out on the ridge.', loss:'They came over the wall in the dark, and it is hard to say when it stopped being a wall.'},
    'The Tithe Is Called': {win:'One town, one long dawn to dusk, and the town is still standing. Nobody has slept.', loss:'The town stands, in the sense that some of it is still on its feet.'},
    'The Last Wall': {win:'Horns from the ridge are the best sound anyone has heard all year. Varnholt still has a keep.', loss:'The Keep Gate is down, and the carts are loading in the smoke.'},
    'The Last Day of Varnholt': {win:'One day at the gate, and the town has not been taken. It has not been kept either.', loss:'The town goes down the sally gate in the smoke, on foot and in carts.'}
  };
  const ORSOLT = {slain:'The levy that were driving at the gate stop where they stand, and someone brings them bread.', fled:'Orsolt is gone down the east road. He will be back, and he knows now where the wall is thin.'};
  const RESULT = {
    hold:{victory:['The relief column arrived and found a fort. The patron’s thanks arrived a week later.', 'The wall held. The patron says the column was always going to come.'], withdrawn:['The fort is behind you. The relief column will find it empty and say so.'], fled:['The fort fell behind you. The Scribe wrote “withdrew in good order”, in pencil.']},
    hunt:{victory:['Every commander is accounted for. Nobody thought to ask the dead for a receipt.'], withdrawn:['The commanders will be there next time, and so will the camps.'], fled:['The camps are still there. So are the commanders.']},
    extract:{victory:['Three strongboxes, one road, and nobody left to ask where the coin came from.'], withdrawn:['The boxes are still in the ruin. So are the people picking over them.'], fled:['The strongboxes stayed where they were.']},
    escort:{victory:['The wagon arrived dented. The patron said it was fine. The patron has not looked at the wagon.'], withdrawn:['The wagon went on without you, or did not.'], fled:['The caravan went on without you, or did not. Nobody has written back.']},
    rescue:{victory:['The cages are open and the road is full of people walking in one direction.'], withdrawn:['Some of the cages are still shut. The Scribe has counted them.'], fled:['The cages are still shut. The Scribe has counted them twice.']},
    assassinate:{victory:['The mark is dead. The patron will not ask how.'], withdrawn:['The mark will hear about this.'], fled:['The mark is alive and now knows your name.']},
    purge:{victory:['The nests are ash. The ground is quiet, which is the only thing it was ever asked to be.'], withdrawn:['The nests will fill again.'], fled:['The nests are still there, and busy.']},
    sabotage:{victory:['The engines burned well. The smoke was visible for a day.'], withdrawn:['The engines still stand. They will be finished by spring.'], fled:['The engines are intact, and the camp is awake.']},
    beacons:{victory:['The beacons burn. Someone, somewhere, is looking at them and drawing a conclusion.'], withdrawn:['The beacons went out one by one.'], fled:['The beacons are cold. The hills were not ours.']},
    relic:{victory:['The relic is home. It is heavier than it looked, and so is the patron’s gratitude.'], withdrawn:['The relic is still in the ruin.'], fled:['The relic stayed where it lay.']}
  };
  const RESCUE_R2 = 'The captives were freed, but the squad could not bring them out.';
  const FALLEN_LINE = ['Nobody was happy with the result, including the Scribe, who wrote it down anyway.', 'The squad was overrun. The Scribe has begun a new page.']; window.SXP = {RESULT, FALLEN_LINE};
  if (typeof contractDebrief === 'function'){
    const f = contractDebrief;
    contractDebrief = function(c, result, lines){
      f(c, result, lines);
      try {
        if (story() || !c || !RESULT[c.obj] || c.finale || c.f34lead) return;   // E5: a Founding lead has its own result line (F34.leadDebrief); two flavour lines said the same thing
        let pool = result === 'fallen' ? FALLEN_LINE : (RESULT[c.obj][result] || (result === 'victory' ? null : RESULT[c.obj].fled));
        /* K50 (F-48 UX): in the Founding Cayde hears about the caravan by nightfall; 'nobody has written back' does not fit */
        if (c.obj === 'escort' && (result === 'fled' || result === 'withdrawn') && window.F34 && F34.active && F34.active()) pool = [STORY_K50[result]];
        /* R2 (checklist R): a rescue left with every cage open said 'the cages are still shut'; with only some open, the withdrawn line says so */
        if (c.obj === 'rescue' && (result === 'fled' || result === 'withdrawn') && G && Array.isArray(G.cages) && G.cages.length){
          const n = G.cages.filter(k => k.open).length;
          if (n === G.cages.length) pool = [RESCUE_R2]; else if (n) pool = RESULT.rescue.withdrawn;
        }
        if (pool) lines.push(`<p class="sx"><i>${pick(pool)}</i></p>`);
      } catch (e) { console.warn('story contractDebrief', e); }
    };
  }

  /* ---- debrief: assault lines (STORY-02), works line (STORY-08) ------- */
  const WORKS_FLAVOUR = {
    blacksmith:'The forge is lit. Everyone suddenly has something that needs mending.', chapel:'A small roof and a small bell. The camp is quieter than it was.',
    tavern:'The first barrel is tapped. The Bard has already moved his log.', palisade:'The gate has a bar now. The first thing the squad does is lean on it.',
    hospital:'The beds are made. Nobody wants to be the first to use one.', kitchen:'Something is cooking. It is not yet clear what.',
    training:'The yard is marked out. The first bruise is already on the books.', stables:'The stalls smell of straw and opinions.',
    watchtower:'The tower has a ladder and a view. The view is mostly weather.', magetower:'The tower has a door and a smell. The door is kept shut.',
    graveyard:'It is only a fence. Nobody walks across it.', default:'The builders have gone. The Scribe has counted the nails.'
  };
  const worksFlavour = ids => { const id = (ids || []).find(i => WORKS_FLAVOUR[i]) ; return WORKS_FLAVOUR[id] || WORKS_FLAVOUR.default; };
  let lastDone = [];
  if (typeof tickBuilds === 'function'){
    const f = tickBuilds;
    tickBuilds = function(){
      const before = META && META.build ? Object.keys(META.build) : [];
      lastDone = before.filter(id => { try { return buildLeft(id) <= 0 && !has(id); } catch (e) { return false; } });
      f();
    };
  }
  if (typeof campNote === 'function'){
    const f = campNote;
    campNote = function(msg){ const args = Array.prototype.slice.call(arguments);
      try {
        if (typeof msg === 'string' && /is finished\.$|are finished\.$/.test(msg) && lastDone.length){
          const d = document.getElementById('screen-debrief');
          if (!d || d.classList.contains('hidden')) msg += ' ' + worksFlavour(lastDone);
        }
      } catch (e) {}
      args[0] = msg; return f.apply(this, args);
    };
  }
  if (typeof renderDebrief === 'function'){
    const f = renderDebrief;
    renderDebrief = function(h, l){
      try {
        if (Array.isArray(l) && !l.some(x => /class="sxr/.test(x))){
          l = l.slice();
          const wi = l.findIndex(x => /<b>Works<\/b>/.test(x) && /is finished/.test(x));
          if (wi >= 0 && lastDone.length) l.splice(wi + 1, 0, `<p class="sxr"><i>${worksFlavour(lastDone)}</i></p>`);
          if (story() && G && G.contract && G.contract.obj === 'siege'){
            const C = CP(), A = ASSAULTS[G.contract.assault], T = A && ASSAULT_AFTER[A.name];
            if (T){
              const win = l.some(x => /the town holds\./.test(x)), at = l.findIndex(x => /is over:/.test(x));
              const extra = [`<p class="sxr"><i>${win ? T.win : T.loss}</i></p>`];
              if (l.some(x => /Orsolt the Hollow Reeve is dead/.test(x))) extra.push(`<p class="sxr"><i>${ORSOLT.slain}</i></p>`);
              else if (l.some(x => /Orsolt the Hollow Reeve is still standing/.test(x))) extra.push(`<p class="sxr"><i>${ORSOLT.fled}</i></p>`);
              l.splice(at >= 0 ? at + 1 : l.length, 0, ...extra);
              const rl = REEVE_AFTER[A.name]; C.lastReeve = rl || null;
            }
          }
        }
      } catch (e) { console.warn('story renderDebrief', e); }
      return f.call(this, h, l);
    };
  }

  /* ---- STORY-03 / 15: named enemies, nemeses --------------------------- */
  const VOICE = [
    [/^Orsolt the Hollow Reeve has seen you\.$/, 'Orsolt walks to the front of his own levy and does not look back at them.'],
    [/^Frost-Vault Guard-Captain has seen you\.$/, 'The Guard-Captain has brought a banner and a proper line. He is the first one tonight who looks as if he is enjoying it.'],
    [/^Orsolt the Hollow Reeve falls\.$/, 'The levy go still. For a moment nobody is driving them.'],
    [/^Frost-Vault Guard-Captain falls\.$/, 'The Guard-Captain goes down. His line does not break; it simply stops, as if someone had put down the pen.'],
    [/^Khan Duruk's orc riders hit the host from behind!$/, 'Horns, from behind the host. Khan Duruk has kept his promise.']
  ];
  const TAUNT = {
    bandits:['You owe me a camp.', 'I remember your faces. I have had time.'], hollow:['The tithe is never paid in full.', 'You took my levy. I have more.'],
    deserters:['I drew my last pay from your patron.', 'You wear the same road I do.'], greenskins:['You smell like last time.', 'We counted. You are fewer now.'],
    monsters:['It remembers you.', 'The ground here remembers you too.'], skulkcrew:['The Skulk never forgets a face.'],
    cabal:['The circle remembers every ward you broke.'], freecompany:['That was our job.']
  };
  if (typeof note === 'function'){
    const f = note;
    note = function(t){
      f(t);
      try {
        if (typeof t !== 'string' || !G) return;
        for (const [re, line] of VOICE) if (re.test(t)) return f(line);
        const m = /^(.+) remembers the Chapter\. Your nemesis is here\.$/.exec(t);
        if (m){ const h = G.contract && G.contract.host; return f(pick(TAUNT[h] || TAUNT.bandits)); }
        if (/, your nemesis, will trouble the Chapter no more\./.test(t)) return f('The Scribe closes a page he was fond of.');
      } catch (e) {}
    };
  }

  /* ---- STORY-16: variety --------------------------------------------- */
  try {
    const add = (o, k, a) => { (o[k] = o[k] || []).push(...a); };
    add(BARK_RACE, 'HUMAN', ['Everyone I know has a brother in a worse company.', 'Pay on the day. That is all I ask of a war.']);
    add(BARK_RACE, 'SUN_ELF', ['There is a word for this weather in Sunlit. It is not a kind word.', 'I did not know a wet blanket could be a career.']);
    add(BARK_RACE, 'GREY_ELF', ['I have read the contract. The contract is lying politely.', 'Every argument here could have been a letter.']);
    add(BARK_RACE, 'DARK_ELF', ['Daylight is a rumour you people have chosen to believe.', 'You would not recognise a good ambush if it fell on you.']);
    add(BARK_RACE, 'ORC', ['If it cannot be ridden, it can be eaten, or avoided.', 'A fight that ends before supper is a good one.']);
    add(BARK_RACE, 'GOBLIN', ['Who put the shiny thing there? Who is asking?', 'I counted the Treasury. It is fine. It is fine now.']);
    add(BARK_RACE, 'HOBGOBLIN', ['Dress the line. Dress it again.', 'A tidy camp is a living camp.']);
    add(BARK_RACE, 'DWARF', ['A wall is only a promise made of stone.', 'The beer is the first honest thing in this camp.']);
    add(BARK_RACE, 'GNOME', ['I have a theory. It is incomplete. It is loud.', 'Do not look at that. It might look back.']);
    add(BARK_RACE, 'HALFLING', ['Somebody ought to count the spoons.', 'The soup tastes better when nobody asks about it.']);
    add(BARK_CLS, 'FREEMAN', ['A day’s pay for a day’s work. I like a short contract.']);
    add(BARK_CLS, 'OUTCAST', ['I have had worse roofs. I have had better company.']);
    add(BARK_CLS, 'NOBLE', ['The blade I can manage. The porridge is another matter.']);
    add(BARK_CLS, 'SLAVE', ['I count the doors in every room. Old habit.']);
    add(BARK_CLS, 'DEVOUT', ['The gods are patient. I am working on it.']);
    add(BARK_CLS, 'EDELOS', ['The old regiment would not recognise us. I would not tell them.']);
    add(BARK_REGION, 'heartland', ['Too many fences in the Heartland. Nowhere to run.']);
    add(BARK_REGION, 'marches', ['The Marches changed their minds about the border again.']);
    add(BARK_REGION, 'mendor', ['The Mendor bells ring on the hour. You stop hearing them, then you hear them again.']);
    add(BARK_REGION, 'spine', ['Old stone on the Spine. It watches the road.']);
    add(BARK_REGION, 'frost', ['The Frost-Vault wind goes through leather as if it were paper.']);
    add(BARK_REGION, 'freelands', ['Suderian bread is the best thing about the war.']);
    BARK_VET.push('Varnholt had a silver mill. I remember the sound of it.', 'A long road, and nobody lost count.');
    if (typeof BARD_LINES !== 'undefined') BARD_LINES.push('I am working on a song about the road. It rhymes with mud.', 'The verse about the Reeve is not complimentary.', 'Somebody ought to write down the dead. I will sing them.');
  } catch (e) { console.warn('story barks', e); }

  // Alternate contract briefs: same facts, a second voice. Mechanics stay in the text.
  try {
    /* K40 (F-48 UX): one gang 'is', plural hosts 'are' */
    const hOne = c => /^an? /.test(HOSTS[c.host].the), hBe = c => hOne(c) ? 'is' : 'are', hHold = c => hOne(c) ? 'holds' : 'hold';
    const alt = {
      hold:c => `The old fort at ${c.place} will not hold itself. Keep it until the relief column arrives; ${HOSTS[c.host].the} will send two commanders to take it from you.`,
      hunt:c => `${cap(HOSTS[c.host].the)} ${hBe(c)} dug in around ${c.place}. Find every camp and kill every commander.`,
      extract:c => `There are three strongboxes in the ruins of ${c.place}. Open them and leave by the road you came in on. ${cap(HOSTS[c.host].the)} ${hBe(c)} there first.`,
      escort:c => `A caravan of ${c.cargo} goes ${DIRS[c.dir]} through ${c.place}, and ${HOSTS[c.host].the} ${hBe(c)} waiting in the trees. If the wagon burns, the job is lost.`,
      rescue:c => `${c.town} is in ruins, and ${HOSTS[c.host].the} ${hHold(c)} ${HOSTAGE_FOLK[c.hostFaction]} in cages there. Open them and get everyone to the road. ${cap(facName(c.hostFaction))} will remember it.`,
      assassinate:c => `A commander of ${HOSTS[c.host].the} is passing through ${c.place} with a bodyguard. Kill them before they leave the map. They run the moment they see you.`,
      purge:c => `${cap(HOSTS[c.host].the)} ${hBe(c)} breeding in ${c.place}, and each ${HOSTS[c.host].den} sends more until it is destroyed. Destroy every one.`,
      sabotage:c => `${cap(HOSTS[c.host].the)} ${hBe(c)} building siege engines at ${c.place}. Get into the camp, burn them all, and get out again.`,
      beacons:c => `Three beacons stand above ${c.place}. Light all three; ${HOSTS[c.host].the} ${hHold(c)} the hills and will fight for each, but a lit beacon stays lit.`,
      relic:c => `${cap(c.relic)} lies in a ruin at ${c.place}, with ${HOSTS[c.host].the} standing guard. Take it home. It is heavy, and they will follow.`
    };
    for (const k in alt) if (CONTRACTS[k]){
      const orig = CONTRACTS[k].desc;
      CONTRACTS[k].desc = c => (Math.random() < 0.5 ? alt[k](c) : orig(c));
    }
  } catch (e) { console.warn('story briefs', e); }
})();

/* ============================================================================
   INDEX 85b - J-16: CAYDE'S TITLE MATCHES THE MANUAL
   The Manual keeps "Reynard" secret and calls Cayde Grand Master of the Grey
   Cloaks. HEROES.cayde.title is the one source for hero cards, the founding
   chair screen, the Chapter Master panel, the Epilogue and the Elder panel.
   A saved Elder carries its own copy of the title, so that is cleaned up too.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const NEW = 'Master of the Dust Cloaks';   // R-027 (L-02): was Grand Master of the Grey Cloaks before the merger; one of the masters after it
  try { if (HEROES && HEROES.cayde) HEROES.cayde.title = NEW; } catch (e) {}
  const fix = s => typeof s === 'string' ? s.replace(/(Reynard, )?Grand Master of the (Dust|Grey) Cloaks/g, NEW) : s;
  try {
    if (typeof elderHTML === 'function'){ const f = elderHTML; elderHTML = function(){ try { if (META && META.elder) META.elder.title = fix(META.elder.title); } catch (e) {} return fix(f()); }; }
    if (typeof loadMeta === 'function'){ const f = loadMeta; loadMeta = function(){ const r = f.apply(this, arguments); try { if (META && META.elder) META.elder.title = fix(META.elder.title); } catch (e) {} return r; }; }
  } catch (e) { console.warn('story cayde', e); }
})();

/* ============================================================================
   INDEX 85c - J-17: ORSOLT AND ILVARYN STAY DEAD AFTER THE PROLOGUE
   The game already rolls a fresh name for every commander (commanderName,
   NAME_RULES). Two faults: the prologue's own Orsolt and Ilvaryn were being
   renamed at random too, and the Hollow name pool could still roll "Orsolt".
   Now: in the prologue they keep their own names; in every later contract the
   Hollow and Frost-Vault bosses are named lieutenants of the same host, each
   with a one-line voice when they see you and when they fall.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const LT = {
    orsolt:[
      ['Wendel the Hollow Bailiff', 'Wendel counts the levy as they pass him. He is not counting for their sake.', 'The bailiff stops counting.'],
      ['Mabry the Hollow Sexton', 'Mabry rings a small bell at the back of the levy. The levy walk faster.', 'The bell stops.'],
      ['Corvin the Hollow Warden', 'Corvin has the keys to a cage and the manner of a man who has lost the lock.', 'Corvin goes down with the keys still on his belt.'],
      ['Edda the Hollow Abbot', 'Edda blesses the levy with a wet hand. Nobody looks pleased about it.', 'Edda’s blessing runs out all at once.'],
      ['Ulric the Hollow Reeve', 'Another Reeve, same tithe, different coat.', 'The tithe goes uncollected.'],
      ['Sibyl the Hollow Warden', 'Sibyl keeps her levy in step with a tally stick and no kindness.', 'Sibyl’s tally stick cracks under her.']
    ],
    ilvaryn:[
      ['Strategos Aurelian Vask', 'Vask has brought a banner and a proper line, and the line is looking at you.', 'Vask’s line wavers, then holds out of habit.'],
      ['Strategos Thessaly Orne', 'Orne is reading your formation the way you read a letter.', 'Orne falls, still annotating.'],
      ['Strategos Caldrus Veyne', 'Veyne does not shout. His line moves anyway.', 'Veyne goes quiet. The line takes a moment to notice.'],
      ['Strategos Maera Valdane', 'Valdane salutes you with the flat of her blade. She means it politely.', 'Valdane is down. The salute was sincere.'],
      ['Strategos Hadriel Sorn', 'Sorn has done this before, and says so by not hurrying.', 'Sorn falls; the line needs a moment to find a new opinion.']
    ]
  };
  const BY = {}; for (const k in LT) for (const [n, seen, fall] of LT[k]) BY[n] = {seen, fall};
  const FIXED = {orsolt:'Orsolt the Hollow Reeve', ilvaryn:'Frost-Vault Guard-Captain'};
  if (typeof commanderName === 'function'){
    const f = commanderName;
    commanderName = function(k){
      if (!LT[k]) return f(k);
      try {
        if (typeof inStoryNow === 'function' && inStoryNow()) return FIXED[k];
        META.usedNames = META.usedNames || [];
        const free = LT[k].filter(x => !META.usedNames.includes(x[0]));
        const n = (free.length ? free[Math.random() * free.length | 0] : LT[k][Math.random() * LT[k].length | 0])[0] + (free.length ? '' : ' the Younger');
        META.usedNames.push(n); return n;
      } catch (e) { return f(k); }
    };
  }
  if (typeof note === 'function'){
    const f = note;
    note = function(t){
      f(t);
      try {
        if (typeof t !== 'string' || !G) return;
        const key = s => s.replace(/ the Younger$/, '');
        let m = /^(.+) has seen you\.$/.exec(t); if (m && BY[key(m[1])]) return f(BY[key(m[1])].seen);
        m = /^(.+) falls\.$/.exec(t); if (m && BY[key(m[1])]) return f(BY[key(m[1])].fall);
      } catch (e) {}
    };
  }
})();

/* ============================================================================
   INDEX 85d - J-18: PROLOGUE COLD OPEN, VERSION 1 (text and one panel)
   - The intro and the muster text say the company was on the north road when
     the smoke rose (two came with you; two are hires from the mill camp).
   - Before Day 1, once, a short arrival card: the man in the good coat and
     the Reeve's "you are a beginning". It reuses askConfirm; "Back to the
     market" returns to the Charter Kit panel.
   - On Day 1 the Sergeant points at the three jobs the Reeve asked for.
   No change to days, assaults, saves or the fight. ROLLBACK: delete this block.
============================================================================ */
(function(){
  const sw = s => typeof s === 'string' ? s : '';
  if (typeof openStoryIntro === 'function'){
    const f = openStoryIntro;
    openStoryIntro = function(){
      f();
      try {
        const ti = document.getElementById('title-inner');
        if (ti) ti.innerHTML = ti.innerHTML.replace('happened to be camped by the mill when the smoke rose in the north', 'happened to be on the north road when the smoke rose');
      } catch (e) {}
    };
  }
  if (typeof storyMusterHTML === 'function'){
    const f = storyMusterHTML;
    storyMusterHTML = function(){
      return sw(f()).replace('two companions and two hires, camped by the mill when the smoke rose.', 'two companions who came down the road with you, and two hires from the camp by the mill.');
    };
  }
  if (typeof startSiege === 'function'){
    const f = startSiege;
    startSiege = function(){
      const C = CP();
      if (C && !C.arrived && typeof askConfirm === 'function'){
        return askConfirm('Varnholt', 'You come in off the north road at dusk with smoke behind you. A man in a good coat is standing on the gate step, counting heads.<br><br><i>“The Reeve will see you now,” he says. “He says he has a purse, a mill and no soldiers. He says you are a beginning.”</i>',
          () => { C.arrived = true; f(); }, {ok:'ENTER THE GATE', cancel:'BACK TO THE MARKET'});
      }
      return f();
    };
  }
  if (typeof coachLines === 'function'){
    const f = coachLines;
    coachLines = function(){
      const out = f();
      try {
        const C = CP();
        if (C && C.part === 'siege' && C.day === 1) out.unshift('The Reeve asked for three things: <b>Scout</b> the north road, <b>Rally the Town</b> for spears, and <b>Ditch and Stakes</b> for the gate. Start there.');
      } catch (e) {}
      return out;
    };
  }
})();

/* ============================================================================
   INDEX 85e - J-02: THE REEVE'S HALL ON DAY 1
   On Day 1 of the siege the Work Board shows only the Sergeant's suggested
   orders (Rally the Town, Scout, Scrounge, Ditch and Stakes); the rest fold
   under "More orders (available)" and "Unlocks later". The next suggested card
   pulses gold. A fixed bell button in the corner shows the candles left and
   rings the bell (or launches the night) like the big button at the bottom.
   Every order that rolls dice shows a short toast: the die, the face against
   the target, and the result. Later days keep the full board, with the bell.
   Nothing is hidden for good: folded cards are still clickable.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const $$ = id => document.getElementById(id);
  const CSS = `
  @keyframes pulse85{0%,100%{box-shadow:0 0 0 2px var(--gold),0 0 4px 2px rgba(255,216,96,.45)}50%{box-shadow:0 0 0 3px var(--gold-bright),0 0 16px 6px rgba(255,216,96,.95)}}
  .wcard.next85{animation:pulse85 1.5s ease-in-out infinite;outline:2px solid var(--gold-bright)}
  details.more85{margin-top:8px;border-top:1px solid rgba(74,48,24,.4);padding-top:4px}
  details.more85 summary{cursor:pointer;font:bold 14px Georgia;color:#4a3018;padding:3px 2px;list-style:revert}
  details.more85 .wcards{margin-top:6px}
  #bell85{position:fixed;top:56px;right:14px;z-index:45;width:236px;box-sizing:border-box;text-align:center;line-height:1.15;padding:6px 8px 5px;font-size:14px}
  #screen-table.has-bell85 .table-head{margin-right:252px}
  #bell85 small{display:block;font:14px Georgia;opacity:.9;letter-spacing:0}
  #bell85.ready{animation:pulse85 1.5s ease-in-out infinite}
  #toast85{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:80;background:var(--parch,#efe3c8);color:var(--ink);border:3px double var(--ink-soft);border-radius:4px;
    padding:8px 16px;box-shadow:0 6px 16px rgba(0,0,0,.5);display:flex;gap:14px;align-items:center;pointer-events:none;transition:opacity .5s;font:14px Georgia}
  #toast85 .dice{margin:0;gap:10px} #toast85 .die{width:auto;min-width:64px}
  #toast85 .tx b.res{font-size:16px}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // ---- remember rolls made by Work Orders (cpRoll wraps attackDie) ----
  let cap = false; const CAP = [];
  if (typeof attackDie === 'function'){
    const f = attackDie;
    attackDie = function(skill, ac){ const r = f.apply(this, arguments); if (cap) CAP.push({skill:clampSkill(skill), ac, face:r.face, out:r.out}); return r; };
  }
  if (typeof cpRoll === 'function'){
    const f = cpRoll;
    cpRoll = function(){ const was = cap; cap = true; try { return f.apply(this, arguments); } finally { cap = was; } };
  }
  const ORDER = {rally:'Rally the Town', scout:'Scout', scrounge:'Scrounge', train:'Train', forage:'Forage', recruit:'Recruit', parley:'Recruit a band'};
  const WORD = {solid:'Full Success', crit:'Full Success', graze:'Partial Success', miss:'Miss'};
  const CLS = {solid:'success', crit:'success', graze:'partial', miss:'miss'};
  function toast(name, rolls){
    let el = $$('toast85'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'toast85';
    el.innerHTML = `<div class="dice">${rolls.map(r => `<div class="die ${CLS[r.out]}"><b style="${typeof dieStyle === 'function' ? dieStyle(r.skill) : ''}">${r.face}</b>Skill ${r.skill}</div>`).join('')}</div>
      <div class="tx"><div>${name}</div><div>${rolls.map(r => `${r.face} against ${r.ac}${r.face - r.ac > 0 ? ' (+' + (r.face - r.ac) + ')' : r.face - r.ac < 0 ? ' (' + (r.face - r.ac) + ')' : ''}`).join(', ')}</div><b class="res">${rolls.map(r => WORD[r.out]).join(' · ')}</b></div>`;
    document.body.appendChild(el);
    clearTimeout(toast.t); toast.t = setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 4200);
  }
  if (typeof workOrder === 'function'){
    const f = workOrder;
    workOrder = function(id){
      const C = CP(), before = C ? C.orders : 0; CAP.length = 0;
      f.apply(this, arguments);
      try {
        const D = CP();
        if (D && D.orders < before && D.part === 'siege' && D.day === 1) (D.d1 = D.d1 || {})[id] = true;
        if (CAP.length && ORDER[id]) toast(ORDER[id], CAP.slice());
      } catch (e) {}
    };
  }
  if (typeof fortify === 'function'){
    const f = fortify;
    fortify = function(id){
      const C = CP(), before = C ? C.orders : 0;
      f.apply(this, arguments);
      try { const D = CP(); if (D && D.orders < before && D.part === 'siege' && D.day === 1) (D.d1 = D.d1 || {})[id] = true; } catch (e) {}
    };
  }

  // ---- the board itself ----
  const KEEP = [['rally', 'Rally the Town'], ['scout', 'Scout'], ['stakes', 'Ditch and Stakes'], ['scrounge', 'Scrounge']];
  function fold(C){
    const root = $$('table-inner'); if (!root) return;
    const cards = [...root.querySelectorAll('.wcard')];
    const nm = c => { const t = c.querySelector('.wt'); return t ? t.textContent.trim() : ''; };
    const more = [], locked = [];
    for (const c of cards){ if (KEEP.some(k => k[1] === nm(c))) continue; if (c.closest('.wcards.one')) continue; (c.classList.contains('off') ? locked : more).push(c); }
    const holder = [...root.querySelectorAll('.wcards')][0];
    const mk = (title, list, key) => {
      if (!list.length) return;
      const d = document.createElement('details'); d.className = 'more85'; d.open = !!BOARD['o85' + key];
      d.innerHTML = `<summary>${title} (${list.length})</summary><div class="wcards"></div>`;
      d.addEventListener('toggle', () => { BOARD['o85' + key] = d.open; });
      const box = d.querySelector('.wcards'); for (const c of list) box.appendChild(c);
      (key === 'a' ? holder : holder).parentElement.appendChild(d);
    };
    mk('More orders (available)', more, 'a'); mk('Unlocks later', locked, 'b');
    for (const e of root.querySelectorAll('.wcards.two')) if (!e.children.length) e.remove();
    // pulse the next suggested card
    const done = C.d1 || {};
    for (const [key, name] of KEEP){
      if (done[key]) continue;
      const c = cards.find(x => nm(x) === name && !x.classList.contains('off'));
      if (c){ c.classList.add('next85'); return true; }
    }
    return false;
  }
  if (typeof renderWorkBoard === 'function'){
    const f = renderWorkBoard;
    renderWorkBoard = function(){
      f.apply(this, arguments);
      try {
        const C = CP(); if (!C || !(C.part === 'siege' || C.part === 'road')) return;
        let pending = false;
        if (C.part === 'siege' && C.day === 1) pending = fold(C);
        const scr = $$('screen-table'), big = $$('table-inner') && $$('table-inner').querySelector('.sealbtn.big');
        let b = $$('bell85'); if (!b){ b = document.createElement('button'); b.id = 'bell85'; b.className = 'btn gold'; scr.appendChild(b); }
        if (!big){ b.style.display = "none"; scr.classList.remove("has-bell85"); return; }
        b.style.display = ""; scr.classList.add("has-bell85"); b.onclick = () => big.click();
        const left = C.orders, tot = typeof ordersPerDay === 'function' ? ordersPerDay() : 3;
        b.innerHTML = `${big.textContent.trim()}<small>${left} of ${tot} ${C.part === 'road' ? 'actions' : 'orders'} left</small>`;
        b.classList.toggle('ready', left <= 0 || (C.part === 'siege' && C.day === 1 && !pending));
      } catch (e) { console.warn('story board', e); }
    };
  }
})();

/* ============================================================================
   INDEX 85f - J-10: THE CAMP REMEMBERS (STORY-09, 11, 12, 13, 18)
   09  The Chapter Master and camp barks react to the last contract, a death,
       a finished building, low gold, a nemesis, and the finale.
   11  Patron voices: a short line in front of each contract brief.
   12  The dead: a Scribe line in the debrief for each death, and at the graveyard.
   13  The prologue's ending is written into the Chronicle as its first entries
       (Summer and Autumn, Year 616), followed by the founding.
   18  Tone: Scribe lines at Charter milestones 3, 6 and 9.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const pick = a => a[Math.random() * a.length | 0];
  const live = () => { try { return !(typeof inStoryNow === 'function' && inStoryNow()) && META && !META.cp; } catch (e) { return false; } };
  const logTail = n => { try { return chron().log.slice(-n); } catch (e) { return []; } };

  // ---- 09: what just happened ----
  function mood(){
    const all = chron().log, ci = []; all.forEach((e, i) => { if (e.k === 'contract') ci.push(i); });
    const L = all.slice(ci.length >= 2 ? ci[ci.length - 2] + 1 : 0).reverse(), out = {};
    const d = L.find(e => e.k === 'death'); if (d) out.death = d.name;
    const c = L.find(e => e.k === 'contract'); if (c) out.result = c.result;
    const w = L.find(e => e.k === 'works' && e.act === 'done'); if (w) out.works = w.name;
    out.gold = META.treasury; out.nem = (META.nemeses || [])[0] && META.nemeses[0].name;
    try { out.finale = finaleDue(); } catch (e) {}
    return out;
  }
  function masterReacts(){
    const m = mood(), p = [];
    if (m.death) p.push(`We lost ${m.death}. The ledger has the line. The stone will have the name.`);
    if (m.result === 'victory') p.push('Good work. The patron paid on time, which is how I know it was a good job.', 'Another win. I keep waiting for the catch.');
    if (m.result && m.result !== 'victory') p.push('That one went badly. Eat something, then tell me about it.', 'Not every contract is a victory. This one was a lesson with a bill.');
    if (m.works) p.push(`The ${m.works} is finished. Someone give the builders a drink.`);
    if (m.gold < 80) p.push(`Our coffers hold ${m.gold}gp. That is not a figure, that is an apology.`);
    if (m.nem) p.push(`${m.nem} is still out there. I am not sleeping well.`);
    if (m.finale) p.push('The charter is almost done. Nobody is brave enough to say so.');
    return p;
  }
  if (typeof masterLine === 'function'){
    const f = masterLine;
    masterLine = function(){
      try { if (live() && META.leader && META.ambition){ const p = masterReacts(); if (p.length && Math.random() < 0.7) return pick(p); } } catch (e) {}
      return f.apply(this, arguments);
    };
  }
  if (typeof barkFor === 'function'){
    const f = barkFor;
    barkFor = function(p){
      try {
        if (live()){
          const m = mood(), s = [];
          if (m.death) s.push(`Someone should say a word for ${m.death}. No? I will.`);
          if (m.result === 'victory') s.push('Good pay, no complaints. Suspicious.');
          if (m.result && m.result !== 'victory') s.push('My boots are still wet from that last one.');
          if (m.works) s.push(`The new ${m.works}. Finally, something that was not here to be set on fire.`);
          if (m.gold < 80) s.push('I have counted the coin twice. It did not help.');
          if (p && p.militia) s.push('Used to farm barley. Now I farm bandits.', 'Varnholt had a mill. I miss the noise.');
          if (s.length && Math.random() < 0.55) return pick(s);
        }
      } catch (e) {}
      return f.apply(this, arguments);
    };
  }

  // ---- 11: patron voices ----
  const PATRON_VOICE = {
    'Minor Imperial Noble':['The Marshal’s office wants this done quietly and on paper.', 'An Imperial seal, a firm hand and very little patience.'],
    'Suderian Freeman Merchant':['Their purse is open and their questions are closed.', 'A merchant who has done the sums and does not like them.'],
    'Mendorian Order Prelate':['The Prelate has prayed on it. You are the answer.', 'A blessing is attached. So is a deadline.'],
    'Dwarven Syndicate Factor':['Payment on delivery, by weight.', 'The Factor has read the contract. Twice. In the margins.'],
    'Reprobate Collective':['Don’t ask what is in the crate.', 'Paid in advance, which is the first warning.'],
    'A Shadowy Broker':['A note, a coin, no signature.', 'Someone watched you read this, and did not stay.'],
    'Hrimheim House Envoy':['The Envoy speaks as if every word were charged by the syllable.', 'A cold house, a cold fee and an exact date.'],
    'Steppe Clan Outrider':['The Outrider wants it done before the horses get bored.', 'Short orders, a long ride, no paperwork.'],
    'Arcana Guild Magister':['The Guild requires a signature. In triplicate. In ink.', 'A Magister who would very much like this not to be mentioned.'],
    'Dust Cloaks Arbiter':['The Arbiter reminds you that the charter is watching.', 'Chapter business, charged at the Chapter’s rate.']
  };
  if (typeof makeContract === 'function'){
    const f = makeContract;
    makeContract = function(){
      const c = f.apply(this, arguments);
      try { const v = c && !c.finale && !c.storyDone && PATRON_VOICE[c.patron]; if (v && c.brief && !c.voiced){ c.brief = pick(v) + ' ' + c.brief; c.voiced = true; } } catch (e) {}
      return c;
    };
  }

  // ---- 12: the dead ----
  const DEAD_LINES = [n => `${n} is cut into the stone. The Scribe has spelled it correctly.`, n => `${n} has a line in the book now, and the line is not short.`, n => `The Scribe writes ${n}’s name last in the day’s ledger, so it is the last thing on the page.`];
  const LEAD_LINES = [n => `The Scribe closes ${n}’s page and turns the lamp down.`, n => `${n} led the squad to the last day. The book says so.`]; window.SXP2 = {DEAD_LINES, LEAD_LINES};
  if (typeof renderDebrief === 'function'){
    const f = renderDebrief;
    renderDebrief = function(h, l){
      try {
        if (Array.isArray(l) && !l.some(x => /class="sxd/.test(x))){
          const out = []; let hit = false;
          for (const x of l){
            out.push(x);
            let m = /<p class="bad">([^<]+?) died in the field\.<\/p>/.exec(x);
            if (m){ out.push(`<p class="sxd"><i>${pick(DEAD_LINES)(m[1])}</i></p>`); hit = true; continue; }
            m = /<b>([^<]+?) (?:bled out on the field|dies on the field)\.<\/b>/.exec(x);
            if (m){ out.push(`<p class="sxd"><i>${pick(LEAD_LINES)(m[1])}</i></p>`); hit = true; }
          }
          if (hit) l = out;
        }
      } catch (e) {}
      return f.call(this, h, l);
    };
  }
  if (typeof renderPanel === 'function'){
    const f = renderPanel;
    renderPanel = function(){
      f.apply(this, arguments);
      try {
        const P = CAMP.panel, el = document.getElementById('camp-panel');
        if (P && P.kind === 'grave' && el && !el.querySelector('.sxg') && (META.memorial || []).length){
          const d = el.querySelector('.desc'), last = META.memorial[META.memorial.length - 1], nm = typeof last === 'string' ? last : last.name;
          if (d) d.insertAdjacentHTML('afterend', `<div class="desc sxg" style="text-align:left;font-style:italic;margin-bottom:6px">The Scribe sweeps the stone himself and says the names in order once a season. The newest is ${esc(nm)}.</div>`);
        }
      } catch (e) {}
    };
  }

  // ---- 18: milestones in the Scribe's voice ----
  const MILE = {3:'The charter is a third done. The Scribe has ordered more ink.', 6:'More than half. The Scribe has started using the good pen.', 9:'One page left in the charter. The Scribe has bought more ink and told nobody.'};
  if (typeof checkMilestones === 'function'){
    const f = checkMilestones;
    checkMilestones = function(ctx, lines){
      const A = META && META.ambition, before = A ? A.done : 0;
      f.apply(this, arguments);
      try {
        if (!A || !live()) return;
        for (let n = before + 1; n <= A.done; n++) if (MILE[n]){
          if (lines) lines.push(`<p class="sx"><i>${MILE[n]}</i></p>`);
          try { chron(); chronAdd('scribe', {text:MILE[n]}, true); } catch (e) {}
        }
      } catch (e) {}
    };
  }

  // ---- 13: the prologue joins the Chronicle ----
  try { CHR_TAG.prologue = ['Before', '#1a4a6a']; CHR_TAG.scribe = ['Scribe', '#5a4a8a']; } catch (e) {}
  if (typeof chronText === 'function'){
    const f = chronText;
    chronText = function(e){
      if (e.k === 'prologue' || e.k === 'scribe') return esc(e.text || '');
      return f(e);
    };
  }
  /* K99 (UX, 16 Nov): a lost road (column at 0 or the PD-48 wipe, then the PD-35 Parley) never reached the ford, so the Annals
     say where it was lost and how the Parley went. [S] words; CAMPAIGN_LINES.pd35.chron99 = {lost, good, even, bad} overrides. */
  const CH99 = {lost: 'The column was lost in the Deep Forest on Night {n}.', good: 'The Frost-Vault captain let the company walk, and paid it to go.',
    even: 'The company walked on to Artemis\u2019s lands without its Treasury.', bad: 'Lord Artemis paid the ransom.'};
  const road99 = s => { const CL = window.CAMPAIGN_LINES || {}, w = Object.assign({}, CH99, (CL.pd35 && CL.pd35.chron99) || {}, CL.chron99 || {});
    return [String(w.lost).replace(/\{n(ights)?\}/g, s.nights || 1), s.wiped && w.wiped ? w.wiped : '', s.band ? w[s.band] : ''].filter(Boolean).join(' '); };
  CH99.after = 'Six companies had set out on that road: the Grey Cloaks, the Emperor’s Faithful, the Deepshaft Company, the Rowan Watch, the Rust-Pikes and the Ridge-Striders. What was left of them met again in Artemis\u2019s lands in the spring, and the charter would come later.';
  const after99 = () => { const CL = window.CAMPAIGN_LINES || {}; return String(((CL.pd35 && CL.pd35.chron99) || {}).after || CH99.after); };   // replaces the 'colour of the road ... one banner' sentences on a lost road
  /* QA fable pass3: on the Founding path the Varnholt line comes from the Founding's own gate defences (META.f34.log b8-b10;
     a lost gate skips b9) and the b10 Keep result, not C.day (a road day) or C.siegeWon (set only by the old Prologue).
     Words [S]; CAMPAIGN_LINES.pd35.chron99 {walls, keepWon, keepLost} override. */
  CH99.walls = 'The company stood on the walls of Varnholt through {n}.';
  CH99.keepWon = 'The Keep held long enough, and the town went out through the sally gate behind it.';
  CH99.keepLost = 'The Keep fell, and the town went out through the sally gate.';
  const walls99 = C => {
    const F = window.F34, st = C && C.f34road && F && F.state && F.state();
    if (!st) return null;
    const r = {}; (st.log || []).forEach(x => { if (/^b(8|9|10)$/.test(x.id)) r[x.id] = x.r; });
    return {n: Object.keys(r).length, won: r.b10 === 'victory' || r.b10 === 'breached'};   // QA S6-PREP: b10's gate always gives way (script), so a cleared town logs 'breached' (f34.js:176); that is the win
  };
  const varnholt99 = snap => {
    const CL = window.CAMPAIGN_LINES || {}, w = Object.assign({}, CH99, (CL.pd35 && CL.pd35.chron99) || {}), n = snap.f34.n;
    const nw = n === 1 ? 'one assault' : (['', '', 'two', 'three'][n] || String(n)) + ' assaults';
    return (n ? String(w.walls).replace('{n}', nw) + ' ' : '') + (snap.f34.won ? w.keepWon : w.keepLost);
  };
  window.STORY99 = {road99, after99, CH99, walls99, varnholt99};
  if (typeof finishFound === 'function'){
    const f = finishFound;
    finishFound = function(){
      let snap = null;
      try {
        if (FD && FD.fromStory && META.cp){
          const C = META.cp;
          snap = {full:!!C.full, days:C.day, won:!!C.siegeWon, orsolt:C.orsolt, nights:C.night, cs:Math.max(0, C.column || 0), dead:(META.memorial || []).length, lost:C.part === 'lost' || !!C.parley35, wiped:!!C.wiped48, band:C.parley35 ? C.parley35.band : null};
          snap.f34 = walls99(C);   // QA fable pass3: the Founding has no siege days or C.siegeWon; it uses its own gate defences (b8-b10)
        }
      } catch (e) {}
      const r = f.apply(this, arguments);
      try {
        if (snap && META && !META.cp && !META.prologueChron){
          META.prologueChron = true;
if (typeof ensureScribe === 'function') ensureScribe();          const CH = chron(); CH.log = CH.log.filter(e => e.k === 'death').map(e => Object.assign({}, e, {t:-2}));   /* the prologue's own entries are replaced by the story below */          CH.turn = 0; chronAdd('open', {}, true);
          const add = (t, text) => { chronAdd('prologue', {text}, true); META.chron.log[META.chron.log.length - 1].t = t; };
          if (snap.f34) add(-3, varnholt99(snap));
          else add(-3, `The company held Varnholt for ${snap.days} days. ${snap.won ? 'The Keep stood, and the Reeve paid what he had promised.' : 'The Keep fell, and the town went out through the sally gate.'} ${snap.orsolt === 'slain' ? 'Orsolt the Hollow Reeve did not live to see the end of it.' : snap.orsolt === 'fled' ? 'Orsolt the Hollow Reeve got away, and the Scribe has left him a page.' : ''}`.trim());
          add(-2, `${snap.lost ? road99(snap) + ' ' + after99() : `${snap.nights ? snap.nights + ' nights' : 'The nights'} on the road with the elves of Tarim. Column Strength at the ford: ${snap.cs}. The cloaks were the colour of the road by the end of it. Six companies had walked it: the Grey Cloaks, the Emperor’s Faithful, the Deepshaft Company, the Rowan Watch, the Rust-Pikes and the Ridge-Striders. They agreed to march under one banner, and the charter would come later.`}${snap.dead ? ' ' + (snap.dead === 1 ? 'One name' : snap.dead + ' names') + ' did not reach Artemis\u2019s lands.' : ''}`);
          chronAdd('found', {holding:META.holding, master:META.master ? META.master.name : '', hero:META.master ? META.master.hero || null : null, ambition:META.ambition ? META.ambition.track : null}, false);
        }
      } catch (e) { console.warn('story prologue chronicle', e); }
      return r;
    };
  }
})();

/* ============================================================================
   INDEX 85g - STORY RE-AUDIT FIXES (audits/story-r2.md, STORY2-01 to 10; UX R2-02)
   01  The fight-opening note read "for a the Reeve. Enemy: Frost-Vault deserters."
   02  Orsolt and Ilvaryn speak when they arrive (the story spawns them already
       "seen", so the game's "has seen you" note never fired).
   03  The Quick ending panel shows the body text for its own tier.
   04  (Chronicle seasons and the opening line: fixed in the 85f block above.)
   06  The "back in Varnholt, first fight" tutorial shows once, after the first
       siege fight or sortie, never on the road.
   07-09 (Master staleness, Reeve lines, Orsolt wording: fixed in 85f and 85 above.)
   10  Contract briefs no longer say "the ruins of the Ruins of ...".
   R2-02  campNote keeps all its arguments (fixed in the 85 block above).
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const storyOn = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };

  // 01: the opening note of a prologue fight
  if (typeof note === 'function'){
    const f = note;
    note = function(t){
      try {
        if (typeof t === 'string'){
          const m = /^(.+?) for a the Reeve\.(?: Enemy: .*)?$/.exec(t);
          if (m){
            if (/Siege/i.test(m[1])) t = 'The Siege of Varnholt, for the Reeve. The levy come first, and the host behind them.';
            else if (/Road/i.test(m[1])) t = 'The Long Road: keep the column alive until morning.';
            else t = m[1] + ', for the Reeve.';
          }
        }
      } catch (e) {}
      return f.call(this, t);
    };
  }

  // 02: spawn voices in the prologue
  const SPAWN = {orsolt:'Orsolt walks to the front of his own levy and does not look back at them.',
    ilvaryn:'The Guard-Captain has brought a banner and a proper line. He is the first one tonight who looks as if he is enjoying it.'};
  if (typeof spawnEnemy === 'function'){
    const f = spawnEnemy;
    spawnEnemy = function(k){
      const e = f.apply(this, arguments);
      try { if (e && SPAWN[k] && storyOn() && G && !(G.sxSpawn && G.sxSpawn[k])){ (G.sxSpawn = G.sxSpawn || {})[k] = true; note(SPAWN[k]); } } catch (x) {}
      return e;
    };
  }

  // 03: the Quick ending: one body sentence per tier, matching the heading
  const END_BODY = ['Lord Artemis offers the company a retainer, a hall in his lands and a seat at his table.', 'The column is smaller but whole. Lord Artemis offers a retainer.',
    'The elves are alive, and the company is owed more favours than it can spend. Lord Artemis offers a retainer on harsh terms.', 'A handful survive. The company is remembered, and not kindly.'];
  if (typeof endingHTML === 'function'){
    const f = endingHTML;
    endingHTML = function(){
      let h = f.apply(this, arguments);
      try {
        if (!isFull()){
          const cs = Math.max(0, CP().column), want = cs >= 15 ? 0 : cs >= 11 ? 1 : cs >= 7 ? 2 : 3;
          for (let i = 0; i < END_BODY.length; i++) if (i !== want && h.indexOf(END_BODY[i]) >= 0) h = h.replace(END_BODY[i], END_BODY[want]);
        }
      } catch (e) {}
      return h;
    };
  }

  // 06: the tutorial block after the first fight, once
  if (typeof renderDebrief === 'function'){
    const f = renderDebrief;
    renderDebrief = function(h, l){
      try {
        // ux.js adds the block inside this call (it is the inner wrapper), and only while META.uxTown matches the head:
        // a sentinel there switches it off for every later fight.
        if (Array.isArray(l) && storyOn()){
          const C = CP(), c = G && G.contract, ok = c && (c.obj === 'siege' || c.obj === 'sortie') && (!C.sxTown || C.sxTown === c.seed);
          if (ok){ C.sxTown = c.seed; if (META.uxTown === 'sx-off') delete META.uxTown; }
          else if (!META.uxTown) META.uxTown = 'sx-off';
          else if (META.uxTown !== 'sx-off') META.uxTown = 'sx-off';
        }
      } catch (e) {}
      return f.call(this, h, l);
    };
  }

  // 10: brief wording with the new place names
  if (typeof makeContract === 'function'){
    const f = makeContract;
    makeContract = function(){
      const c = f.apply(this, arguments);
      try {
        if (c && typeof c.brief === 'string')
          c.brief = c.brief.replace(/(?:in the ruins of|in a ruin at|in the ruin at) (the )?(Ruins of )/g, 'in the $2').replace(/\bthe the\b/g, 'the').replace(/\bof the (the |The )/g, 'of the ');
      } catch (e) {}
      return c;
    };
  }
})();

/* Index 85g (cont.): the Reeve on the Quick retreat panel (STORY2-08) */
(function(){
  if (typeof retreatHTML !== 'function') return;
  const f = retreatHTML;
  retreatHTML = function(){
    let h = f.apply(this, arguments);
    try { if (!isFull()) h = h.replace('orders the town onto the carts.', 'orders the town onto the carts. <i>“Load the carts,” says the Reeve. “I will count the town twice and sit on the last one.”</i>'); } catch (e) {}
    return h;
  };
})();

/* ============================================================================
   INDEX 85h - BUNDLE C (audits/story-r2.md, STORY2-11 to 18)
   11  Longer pools for contract results, deaths and the overrun squad.
   12  The Reeve's first request is said once (his line); the Sergeant points
       at the gold card instead of repeating it.
   13  Quick prologue only: two companions are rolled for you, and you choose
       two hires from six. (The Full Chronicle keeps the four-pick screen.)
   14  The Kalloon ending gives numbers and names: how many elves reached the
       ford, who did not, what became of the Reeve.
   15  One line about the refugees at the start of each road day.
   16  The Bard's lines on the creation screens read like a person, not a help screen.
   17  A fallen Leader's Chronicle entry carries the Scribe's closing line.
   18  The chain-gangs of Night 1 echo the levy at Varnholt.
   ROLLBACK: delete this block (and the two "window.SXP" exports in 85 and 85f).
============================================================================ */
(function(){
  const pick = a => a[Math.random() * a.length | 0];
  const storyOn = () => { try { return typeof inStoryNow === 'function' && inStoryNow(); } catch (e) { return false; } };
  const $$ = id => document.getElementById(id);

  // ---- 11: bigger pools ----
  try {
    const R = window.SXP && window.SXP.RESULT, add = (o, k, kk, a) => { if (o[k] && o[k][kk]) o[k][kk].push(...a); };
    if (R){
      const V = {
        hold:['The fort is still standing. That was the whole of the plan.', 'The relief column sent a clerk to say well done.'],
        hunt:['The camps are empty. The ledger has a new column for it.', 'The commanders are down. Somebody will have to find new commanders.'],
        extract:['The strongboxes were heavier than advertised. Nobody is complaining.', 'Out by the road you came in. Nothing missing but the lids.'],
        escort:['The caravan arrived. The drivers have stopped looking over their shoulders. You have not.', 'The patron counted the wagons twice and found them all.'],
        rescue:['The cages are empty. The people who were in them are not speaking yet, but they are walking.', 'Somebody is crying in the back of a cart, and somebody else is holding the reins.'],
        assassinate:['The mark did not reach the edge of the map. That was the contract.', 'One commander fewer, and a cold supper.'],
        purge:['Nothing left in the nests but ash and a smell.', 'The warren is quiet. The Scribe suspects it will not stay that way.'],
        sabotage:['The siege engines are kindling. The camp is still counting the damage.', 'You were in and out before the alarm was finished.'],
        beacons:['All three beacons burn. The hills have stopped being theirs.', 'The signal is lit. Somewhere far away, someone is putting their boots on.'],
        relic:['The relic is home, and so, mostly, are you.', 'It was heavy the whole way. The patron says it looks lighter than it was.']
      }, F = {
        hold:'The fort fell behind you, and the smoke followed.', hunt:'The commanders watched you go. They will remember the order you left in.', extract:'You left with your skins and not much else.',
        escort:'The wagon is somebody else’s problem now. The Scribe wrote it down anyway.', rescue:'The cages stayed shut. The Scribe has written it in small letters.', assassinate:'The mark ran, and so did you.',
        purge:'The nests are still breeding.', sabotage:'The engines will be ready by spring.', beacons:'Two beacons, then none.', relic:'The relic is where the ruin keeps it.'
      }, W = {
        hold:'A fighting withdrawal is a retreat with better manners.', hunt:'You pulled back. The camps did not.', extract:'The road out was clear. The strongboxes were not.', escort:'The wagon is on its own now.',
        rescue:'You got some of them out. The Scribe has the number.', assassinate:'The mark is alive and warned.', purge:'The nests will fill again by spring.',
        sabotage:'Half the engines burned. The other half were finished by morning.', beacons:'One beacon burned. It was seen, and ignored.', relic:'The relic is still in the ruin, and now they know you want it.'
      };
      for (const k in V) add(R, k, 'victory', V[k]);
      for (const k in F) add(R, k, 'fled', [F[k]]);
      for (const k in W) add(R, k, 'withdrawn', [W[k]]);
    }
    if (window.SXP && window.SXP.FALLEN_LINE) window.SXP.FALLEN_LINE.push('The squad was overrun. The Scribe has written the date and nothing else.', 'Nobody is calling it a defeat yet. The Scribe is.');
    const D = window.SXP2;
    if (D){
      D.DEAD_LINES.push(n => `${n}’s name goes on the stone before supper, by the Scribe’s own hand.`, n => `${n} is entered in the book. The ink is still wet, and so is everyone’s face.`);
      D.LEAD_LINES.push(n => `${n} is entered last in the day’s ledger, under a line the Scribe ruled twice.`);
    }
  } catch (e) { console.warn('story pools', e); }

  // ---- 12: say it once ----
  if (typeof coachLines === 'function'){
    const f = coachLines;
    coachLines = function(){
      let out = f.apply(this, arguments);
      try {
        const C = CP();
        if (C && C.part === 'siege' && C.day === 1){
          out = out.filter(t => t.indexOf('The Reeve asked for three things') < 0 && t.indexOf('The candles are your Work Orders') < 0);
          out.unshift('Start with the card outlined in gold: the Reeve’s jobs come first.', 'The candles are your Work Orders, and each one costs a candle. Three a day.');
        }
      } catch (e) {}
      return out;
    };
  }

  // ---- 13: Quick muster: two companions, two hires ----
  if (typeof storyMusterHTML === 'function'){
    const f = storyMusterHTML;
    storyMusterHTML = function(){
      let h = f.apply(this, arguments);
      try {
        if (isFull()) return h;
        const C = CP(); if (!C.comp) C.comp = Array.from({length:2}, rollRecruit);
        const pk = C.pick || [], n = pk.length;
        const comps = C.comp.map(r => `<div class="line"><img src="${portraitURL(r, false)}"><div class="grow"><b>${esc(r.name)}</b><br>${RACES[r.race].name} ${CLASSES[r.cls].name} ${SPECS[r.spec].name}<br><span style="font-size:14px">${mateLine(r)}</span></div><div style="font-size:14px;font-style:italic;align-self:center">came with you</div></div>`).join('');
        h = h.replace('<h2>Your First Squad</h2>', '<h2>Build your squad</h2>');   /* PL-2.2 wording: companions = the two who came, recruits = the two you hire */
        h = h.replace(/Choose four Squad Mates to march with you:[^<]*/, 'Two companions already travel with you. Hire two more recruits from the camp by the mill.</div>' + comps + '<div class="desc" style="text-align:left;margin-top:6px"><b>Pick 2 recruits from the list below.</b>');
        h = h.replace(/(onclick="storyPick\(\d+\)">)Chosen</g, '$1Hired<').replace(/(onclick="storyPick\(\d+\)">)Choose</g, '$1Hire<');
        h = h.replace(/<button class="btn gold"[^>]*onclick="storyMusterDone\(\)">THESE FOUR \(\d+ \/ 4\)<\/button>/, `<div class="desc" style="text-align:left;margin-top:6px">Hired: ${n} of 2</div><button class="btn gold" ${n === 2 ? '' : 'disabled'} onclick="storyMusterDone()">${n === 2 ? 'HIRE THESE TWO' : 'PICK 2 RECRUITS (' + n + ' / 2)'}</button><div class="desc" style="text-align:left;font-size:14px">Next: choose your kit.</div>`);
      } catch (e) { console.warn('story muster', e); }
      return h;
    };
  }
  if (typeof storyPick === 'function'){
    const f = storyPick;
    storyPick = function(i){
      try { if (!isFull()){ const p = CP().pick || []; if (p.length >= 2 && !p.includes(i)){ SFX.play('nope'); return; } } } catch (e) {}
      return f.apply(this, arguments);
    };
  }
  if (typeof storyMusterDone === 'function'){
    const f = storyMusterDone;
    storyMusterDone = function(){
      try {
        if (!isFull()){
          const C = CP(); if (!C.pick || C.pick.length !== 2 || !C.comp) return;
          C.offer = C.comp.concat(C.offer); C.pick = [0, 1].concat(C.pick.map(i => i + 2)); delete C.comp;
        }
      } catch (e) {}
      return f.apply(this, arguments);
    };
  }

  // ---- 14: the ending with its numbers and names ----
  if (typeof endingHTML === 'function'){
    const f = endingHTML;
    endingHTML = function(){
      let h = f.apply(this, arguments);
      try {
        const C = CP(), cs = Math.max(0, C.column || 0), elves = Math.min(40000, cs * 2000);   // about 40,000 on the Long Road (R-114)
        const dead = (META.memorial || []).map(d => typeof d === 'string' ? d : d.name).filter(Boolean);
        const reeve = C.siegeWon ? 'The Reeve rode the last cart out of Varnholt, and has not stopped counting it.' : 'Nobody saw the Reeve after the sally gate. His cellar, they say, was empty.';
        const names = dead.length ? ` ${dead.length > 3 ? dead.slice(0, 3).join(', ') + ' and ' + (dead.length - 3) + ' more' : dead.length === 1 ? dead[0] : dead.slice(0, -1).join(', ') + ' and ' + dead[dead.length - 1]} did not reach Artemis\u2019s lands.` : ' Nobody in the company was lost on the way.';
        const add = `<div class="desc" style="text-align:left;margin-top:6px">About <b>${elves}</b> of the forty thousand refugees who left Tarim reached the ford.${names} ${reeve}</div>`;
        const k = h.indexOf('<div class="log"');
        h = k >= 0 ? h.slice(0, k) + add + h.slice(k) : h + add;
      } catch (e) { console.warn('story ending', e); }
      return h;
    };
  }

  // ---- 15: the refugees; 18: the chain-gangs ----
  const ELVES = ['A Sun Elf girl asks whether the stars are the same in Artemis\u2019s lands. Nobody answers, and she decides they are.',
    'A Grey Elf scholar carries a library on her back, one book at a time. She will not say which ones she has already burned.',
    'The Sun Elf skirmishers walk at the edges of the column and trust nobody. Lately they have started walking closer.',
    'A Sun Elf boy has learned the names of the carts. He says them aloud every morning, in order.',
    'Two elders argue about the route all day and agree about it at night.',
    'A half-blood woman keeps the column’s count on a knotted cord. It is shorter than yesterday’s.',
    'Somebody has started singing at the back of the column. It is not a cheerful song, and nobody asks them to stop.',
    'A midwife walks beside the Ledger Wagon. She has not been asked to, and she has not been refused.'];
  if (typeof startRoadDay === 'function'){
    const f = startRoadDay;
    startRoadDay = function(){
      f.apply(this, arguments);
      try { const C = CP(); if (C && C.part === 'road' && C.dayNews) C.dayNews.push('<i>' + ELVES[((C.night || 1) - 1) % ELVES.length] + '</i>'); } catch (e) {}
    };
  }
  if (typeof note === 'function'){
    const f = note;
    note = function(t){
      f.call(this, t);
      try { if (typeof t === 'string' && /^Night 1: /.test(t) && storyOn()) f.call(this, 'The chain-gangs wear the same tithe-marks as the levy at Varnholt. Somebody is driving them, and it is not the cloaks’ doing.'); } catch (e) {}
    };
  }

  // ---- 16: the Bard on the creation screens ----
  const BARD = [
    ['First, your Squad Leader', 'First, your Squad Leader, the one who marches. Choose how they fight. Not sure? Click Surprise me.'],
    ['Before the road, a Leader', 'Before the road, a Leader. Pick what they do in a fight, or press Surprise me.'],
    ['Now, who sits in the Chapter Master', 'Now the chair. The Chapter Master runs the camp and does the haggling, and never marches. Cayde will warm it for now; when one of your own is ready, he steps down to the council. Or build your own, or roll a stranger.'],
    ['Where do we hang the banner', 'Where do we hang the banner? Every holding can build everything; this one only decides what the camp looks like.'],
    ['What’s this Chapter for', 'What is the Chapter for? Pick one aim, and the contracts will lean that way.'],
    ['What\'s this Chapter for', 'What is the Chapter for? Pick one aim, and the contracts will lean that way.']
  ];
  const rebard = () => {
    try {
      const el = document.querySelector('#create-inner .gbard .speech'); if (!el) return;
      const t = el.textContent;
      for (const [start, text] of BARD) if (t.indexOf(start) === 0 && t !== text){ el.textContent = text; return; }
    } catch (e) {}
  };
  for (const name of ['renderCreate', 'renderFound']){
    try {
      const f = window[name] || eval(name);
      if (typeof f !== 'function') continue;
      const g = function(){ const r = f.apply(this, arguments); rebard(); return r; };
      if (name === 'renderCreate') renderCreate = g; else renderFound = g;
    } catch (e) { console.warn('story bard ' + name, e); }
  }

  // ---- 17: a fallen Leader in the Chronicle ----
  if (typeof chronText === 'function'){
    const f = chronText;
    chronText = function(e){
      const s = f.apply(this, arguments);
      return (e && e.k === 'death' && e.leader) ? s + ' The Scribe closed the page and turned the lamp down.' : s;
    };
  }
})();

/* Index 85h (cont.): the Quick muster with the UX chips and the "balanced" button for two (STORY2-13) */
(function(){
  if (typeof storyMusterHTML === 'function'){
    const f = storyMusterHTML;
    storyMusterHTML = function(){
      let h = f.apply(this, arguments);
      try {
        if (isFull()) return h;
        h = h.replace('PICK A BALANCED FOUR', 'AUTO-PICK TWO BALANCED');
        if (window.UX && UX.chipsHTML) for (const r of (CP().comp || [])){
          const old = `<span style="font-size:14px">${mateLine(r)}</span>`;
          h = h.replace(old, UX.chipsHTML(r));
        }
      } catch (e) {}
      return h;
    };
  }
  if (typeof window.uxBalancedFour === 'function'){
    const f = window.uxBalancedFour;
    window.uxBalancedFour = function(){
      f.apply(this, arguments);
      try { if (!isFull()){ const C = CP(); if (C && C.pick){ C.pick = C.pick.slice(0, 2); renderPanel(); } } } catch (e) {}
    };
  }
})();

/* Index 85h (cont.): the intro's length line follows the choice (bugs-r2 R2-07). Before a length is chosen it
   says neither "fourteen days" nor "three days"; the two cards below carry the numbers. */
(function(){
  if (typeof openStoryIntro !== 'function') return;
  const f = openStoryIntro;
  openStoryIntro = function(){
    f.apply(this, arguments);
    try {
      const C = META && META.cp, ti = document.getElementById('title-inner');
      if (C && C.full === undefined && ti)
        ti.innerHTML = ti.innerHTML.replace(/Part One: fourteen days[^<]*/, 'The prologue comes in two lengths: choose below. Your people and gear carry through, and it has its own save; your main Chapter is untouched.');
    } catch (e) {}
  };
})();

/* ============================================================================
   INDEX 85i - ARGON R3 FIXES
   R3-01  The Quick muster companions read window.UX (never set); the chip
          helper lives on window.UX83. They now get the stat chips and the role tag.
   Ruin   "A handful survive" sat above "About 500 of the two thousand... reached the ford".
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  if (typeof storyMusterHTML === 'function'){
    const f = storyMusterHTML;
    storyMusterHTML = function(){
      let h = f.apply(this, arguments);
      try {
        if (isFull()) return h;
        for (const r of (CP().comp || [])){
          const who = `${RACES[r.race].name} ${CLASSES[r.cls].name} ${SPECS[r.spec].name}<br>`;
          h = h.replace(`<b>${esc(r.name)}</b><br>${who}`, `<b>${esc(r.name)}</b> <span class="ux-role">${SPECS[r.spec].role}</span><br>${who}`);
          if (window.UX83 && UX83.chipsHTML) h = h.replace(`<span style="font-size:14px">${mateLine(r)}</span>`, UX83.chipsHTML(r));
        }
      } catch (e) {}
      return h;
    };
  }
})();

/* ============================================================================
   INDEX 85j - LORE CANON ALIGNMENT (rulings R-002, R-003, R-004)
   The Grey Cloaks are one band among many that merged into the Dust Cloaks (616);
   Grey Keep is a memory, not the current HQ. Cayde's origin follows R-002 and
   he is Master of the Dust Cloaks (R-082: no "Grand Master"). No text here names Marakyr's symbol or
   a God-Emperor (checked: none in the build). ROLLBACK: delete this block.
============================================================================ */
(function(){
  try {
    if (HEROES && HEROES.cayde) {
      HEROES.cayde.lore = 'Born to an enslaved woman, raised from eight to sixteen in an Edelōs caravan under Oirbsen Farraige. The songs say he came back from death with an unrelenting hatred of slavers, hobgoblins and dragons. Something elven woke in him at Tarim, and he does not discuss it.';
    }
  } catch (e) { console.warn('story 85j hero', e); }
  try {
    if (BARK_CLS && Array.isArray(BARK_CLS.OUTCAST)) BARK_CLS.OUTCAST = BARK_CLS.OUTCAST.map(s => s.replace("we're on rota at Grey Keep", "we're on rota at the keep"));
  } catch (e) { console.warn('story 85j bark', e); }
})();

/* ============================================================================
   INDEX 85l - T-01 THE LIVING TAVERN: LINE POOLS
   window.TAVERN_LINES, read by js/camp/tavern.js and js/camp/crepitus.js. Lines may use
   {name} (a squad mate's name). Friendly ribbing only; no borrowed names.
   ROLLBACK: delete this block.
============================================================================ */
window.TAVERN_LINES = {
  cheer: [
    'Down with him! Down! Mind the lamp!',
    'That one is going to hurt in the morning!',
    'A silver on the big one! No, the other big one!',
    'Hit him like you mean the rent!',
    'Beautiful. Somebody write that down.',
    'Again! Do that again, slower!',
    'Mind the barrels! The barrels are mine!',
    'That is the best thing I have seen all season!',
    'Go on, {name}, go on, go on!',
    'Whoever wins buys the next round!',
    'Now that is a proper tavern brawl.',
    'Break something expensive! We will blame the other table!',
    'Oh, he felt that. His mother felt that.',
    'Ha! Down he goes like a sack of turnips.',
    'The company pays for the damage, so swing wide!'
  ],
  heckle: [
    'Is that a punch or a wave?',
    'My gran hits harder, and she is dead.',
    'You fight like you load a cart.',
    'Left! Your other left!',
    'Put your guard up! Higher! Higher still!',
    'I have seen {name} dance better than that.',
    'Is this the famous company? Truly?',
    'Somebody fetch the Leader a cushion.',
    'Swing at the man, not the furniture.',
    'He is winning! No. No, he is not.',
    'Two silver says you fall first.',
    'Nobody told you the point was to hit them?',
    'Less talking, more fighting, {name}!',
    'That chair never did anything to you!',
    'Go home and tell them you were very brave.'
  ],
  ko: [
    '{name}: zzz... five more minutes...',
    '{name} is having a lovely lie-down.',
    '{name} has found the floor. It is very comfortable.',
    '{name}: zzz... not the soup... zzz...',
    '{name} snores like a sawmill.',
    '{name} sleeps through the best part.',
    'Somebody put a coat over {name}.',
    '{name}: zzz... I meant to do that... zzz...',
    '{name} is a very peaceful heap.',
    '{name} dreams of a bigger sword.',
    'Do not step on {name}. Step near, but not on.',
    '{name}: zzz... one more round... zzz...',
    '{name} will have a head like a cracked bell tomorrow.',
    '{name} is out cold, with a smile on.',
    '{name} wakes for a moment, says "worth it", and goes back down.'
  ],
  rankInvite: [
    'Care for a hand of Rank’n, Leader? I promise to lose gracefully.',
    'Spears beat Gold, Gold beats Crowns. Sit, and I will show you.',
    'Take a seat. The first game is free. The second is not.',
    '{name} says you are afraid to play. I said you were not. Prove me right.',
    'A hand of Rank’n? The stakes are small and the pride is large.',
    'The table has a seat, the ale has a head, and I have a good feeling.',
    'Come on, Leader. One game, then back to being in charge.',
    'I have been waiting all night for someone worth beating.',
    'Rank’n! Sit down, and bring your luck.',
    'Fair warning: I have not lost since the harvest.',
    'Do you play? Do you play well? Do you play for coin?',
    'Deal you in? We will be gentle for the first hand.',
    '{name} has been bragging again. Come and shut them up.',
    'Draw a card, Leader. The table has been dull without you.'
  ],
  crepChat: [
    'Seven dice a head and not one honest face at the table.',
    'Keep your cup close, {name}. I am watching your elbow.',
    'Two dice to the community cup. Choose carefully.',
    'Who rolls the target pool? Not me. My hands shake.',
    'A coin on the three. Just one. Nobody mind me.',
    'I do not bluff. I simply have a quiet hand.',
    'Pass. I am saving my courage for later.',
    'Leader, you are too quiet. That is how I know you are good.',
    'Mind the pot. It looks hungry.',
    'Every die I discard is a bad die. That is my rule.',
    'Is it my turn? It is always my turn when I have no coin.',
    'If the target pool is down to two, I am going to be sick.',
    'A copper on the four, and a prayer on the side.',
    '{name} rattles the cup like it owes them money.',
    'Ah, a level six. How rare. How suspicious.'
  ],
  crepBluff: [
    'I have a hand that would make you weep. I will not show you.',
    'Reinforcing the bounty. I am very, very sure.',
    'That die is mine. Take it off the table and see.',
    'Go on, outbid me. I dare you. I have nothing to lose.',
    'Gold on the six. Gold! I am not afraid of gold!',
    'You think I am bluffing. I want you to think that.',
    'My dice have never lied to me. Tonight they scream.',
    'Raise the bounty, {name}, and see what happens.',
    'I would not push this much if I did not hold a pair of sixes.',
    'Three dice of high rank, and you can guess the rest.',
    'Look at my face. Do I look like a liar? Do not answer.',
    'I have a small hand, and a very large confidence.',
    'You may take the pot if you can take my smile first.',
    'Oh, I am a poor player. Truly. Please raise me.',
    'That bounty is cheap. I bought it with spite.'
  ],
  crepWin: [
    'The pot is mine! Pay the winner, lads!',
    'Seven dice, and every one of them loves me.',
    'Pay up, {name}. Gold on the table, if you please.',
    'I told you I was not bluffing. Ha!',
    'A fine hand, if I say so myself, and I do.',
    'Sweep the coins this way. Gently. They are shy.',
    'I will drink to that, and to the pot, and to you losing.',
    'Better luck next hand. Or next year.',
    'Never doubt a quiet player.',
    'A lovely hand and a lovelier pot.',
    'That is how it is done, Leader.',
    'The dice and I have an understanding.',
    'Do not be sad. It was only money. Mine now.',
    'Hah! A bounty well placed.',
    'I will frame this hand and hang it over the bar.'
  ],
  crepLose: [
    'Robbed! Robbed by a cup of dice!',
    'I had a plan. The dice had other ideas.',
    'Well played, {name}. I will remember this for a very long time.',
    'That was my last silver. Do not tell the cook.',
    'The dice are cursed. I would like a new set.',
    'I discarded the wrong two. Always the wrong two.',
    'Take it, take it. I shall be gracious in my grief.',
    'Beaten by one pip. One. Pip.',
    'Next hand. I want that bounty back.',
    'Not my night. Not my week. Possibly not my year.',
    'Congratulations, Leader. I hope you choke on it. Gently.',
    'I had a good hand. I swear on my boots.',
    'You are too lucky, or too clever. I cannot decide which.',
    'There goes my pay. Pour me another.',
    'I would have won if I had been better.'
  ]
};

/* ============================================================================
   INDEX 85m - WORLD CHATTER FOR VETERANS
   Camp barks about the factions and places of Arcadia. Drafted by Flash from the
   lore cards, then edited against the rulings (R-047 no Suderian revolt, R-108,
   R-117 levies fed afterwards, R-022 practical not cruel). Pushed into BARK_VET,
   so older squad mates say them. ROLLBACK: delete this block.
============================================================================ */
(function(){
  try {
    if (typeof BARK_VET === 'undefined' || !Array.isArray(BARK_VET)) return;
    BARK_VET.push(
      'Six companies walked the Long Road, and what was left got scraped into chapters.',
      'Most of the old Grey Cloaks stayed behind at Grey Keep. Somebody had to hold the door.',
      'The Empire offers border folk two choices: pay the tax or wear the chains.',
      'The monks at Mendor preach peace, but their walls were built to break an army.',
      'Cast an unlicensed spark in an imperial ditch and the Guild will send someone for your hands.',
      'When an Inquisitor comes asking after your hedge-witch cousin, start running.',
      'The Collective shares formulae the way thieves share loot, with one eye on the knife.',
      'A dwarf syndicate will sell you honest iron, then ask for protection coin.',
      'They squeeze the gnomes dry and call it family business.',
      'Never sleep without sentries near old ruins. The jackalfolk will find you.',
      'They starve the levies before an assault and feed them after. I do not know which is worse.',
      'The Frost-Vault host sees every spear and every captive as a tool. That is what frightens me.',
      'An Edelōs wagon is all bright paint and pots until five archers step out from the canvas.',
      'Drink their bark tea for a fever, and keep a hand on your purse.',
      'In Kalloon a runaway slave can walk the docks without watching for a collar.',
      'The slaves who built Dunmorrow got papers and a plot of land for it.',
      'Gorrath blew Dunmorrow apart once, and Artemis built it back higher.',
      'The Free Lands have too many councils and too many laws, but they do hire.',
      'Terados has marble palaces on the hill and slave pens in the gutters below.',
      'Lord Petras keeps Silverquay rich, and his harbour watch hates sellswords.',
      'Ban’Ra’s plague gem is gone. The smell has not got the message.'
    );
  } catch (e) { console.warn('story 85m', e); }
})();

/* ============================================================================
   INDEX 85n - THE SIX BANDS ON THE LONG ROAD (Patrick, 2026-11-11)
   Grey Cloaks, Emperor's Faithful, Deepshaft Company, Rowan Watch, Rust-Pikes,
   Ridge-Striders. Two bands a night on road nights 1 to 3, after the elves'
   line. The Chronicle names all six (see the prologue entry above).
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const BANDS = [
    'The Grey Cloaks walk in their road-worn grey, fewer than they were. Nobody mentions the keep.',
    'The Emperor’s Faithful keep their shield lines even on the march. The dust has taken the colour out of their sun-badges.',
    'The Deepshaft Company’s sappers have shored a soft bank with timber nobody asked them for.',
    'Rowan Watch riders circle the edge of the column and will not sleep under a roof. There are no roofs.',
    'The Rust-Pikes drill at every halt. A snapped lance with a red ribbon rides on their lead cart.',
    'The Ridge-Striders scout the passes and report to their own officers only. So far it has worked.'
  ];
  if (typeof startRoadDay !== 'function') return;
  const f = startRoadDay;
  startRoadDay = function(){
    const r = f.apply(this, arguments);
    try {
      const C = CP();
      const n = (C && C.night) || 1;
      if (C && C.part === 'road' && C.dayNews && n >= 1 && n <= 3) {   /* the Quick road has 3 nights: two bands a night, all six in a run */
        C.dayNews.push('<i>' + BANDS[(n - 1) * 2] + '</i>');
        C.dayNews.push('<i>' + BANDS[(n - 1) * 2 + 1] + '</i>');
      }
    } catch (e) {}
    return r;
  };
})();

/* ============================================================================
   INDEX 85o - F-31.2 BARRACKS ACTIVITY LINES: STORY.activityLine(p, ctx)
   One short line per person, plain present tense, under 40 characters, no HTML,
   no names (the screen prints the name). Times in seasons, never days.

   ctx (every field optional):
     state    'ready' | 'resting' | 'wounded' | 'away' | 'captive'
     role     'rest' | 'train' | 'spar' | 'wander' | 'sit' | 'vet'   (personRole)
     facility facility id: tavern, kitchen, merchant, barracks, training, armoury,
              stables, hospital, blacksmith, carpentry, leather, engineering,
              alchemy, magetower, chapel, tents, command, cells
              (train: the building they train at; vet: the building they staff)
     seasons  whole number of seasons left (resting, wounded)
     place    destination or holding place name (away, captive)
     obj      objective key of the detachment (escort, hunt, hold, rescue ...)
     has      function(id) -> bool, true if the camp has that building
     salt     any number (such as the season); changes which line shows
   Returns the same line for the same person and ctx.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const S = window.STORY = window.STORY || {};
  const H = s => { let h = 7; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const pick = (a, h) => a[h % a.length];
  const short = (s, n) => s.length <= n ? s : s.slice(0, n - 1).trim();
  const FAC = {tents:'the tents', kitchen:'the mess', tavern:'the tavern', command:'the command tent', merchant:'the stalls', cells:'the cells', barracks:'the yard', training:'the training grounds', armoury:'the armoury', stables:'the stables', hospital:'the field hospital', blacksmith:'the forge', carpentry:'the carpenter’s', leather:'the tannery', engineering:'the workshop', alchemy:'the alchemy lab', magetower:'the mage tower', chapel:'the chapel'};
  const TRAIN = {training:'Drilling at the training grounds', barracks:'Drilling in the yard', blacksmith:'Learning the forge', chapel:'Studying in the chapel', magetower:'Studying at the mage tower', alchemy:'Stirring in the alchemy lab', armoury:'Practising at the armoury', stables:'Learning horses at the stables', hospital:'Learning bandages', carpentry:'Learning joinery', leather:'Learning the tannery', engineering:'Learning the workshop'};
  const SPAR = ['Sparring in the yard', 'Sparring, badly', 'Trading blows in the yard', 'Teaching a lad a lesson', 'Sparring with a friend', 'Sparring, and losing'];
  const REST = ['Sleeping it off', 'Lying very still', 'Staring at the roof', 'Resting a sore back', 'Resting, and bored of it'];
  const WANDER = {
    tavern: ['Drinking at the tavern', 'Losing at dice again', 'Telling lies at the tavern'],
    kitchen: ['Eating at the mess', 'Stealing from the mess', 'Peeling roots at the mess'],
    merchant: ['Haggling at the stalls', 'Browsing the stalls', 'Pricing boots at the stalls'],
    blacksmith: ['Watching the forge', 'Oiling a blade at the forge'],
    stables: ['Brushing a horse', 'Feeding the horses'],
    armoury: ['Oiling gear at the armoury', 'Checking the racks'],
    chapel: ['Lighting a candle', 'Sitting quiet in the chapel'],
    any: ['Wandering the camp', 'Mending a boot', 'Walking the lines', 'Sharpening a knife', 'Counting arrows', 'Looking for a dry spot']
  };
  const SIT = ['Sitting by the fire', 'Sitting, thinking', 'Sharing a pipe', 'Staring into the fire', 'Writing a letter home'];
  const VET = ['Telling old war stories', 'Telling the old stories', 'Grumbling at the youngsters'];
  const CLS = {
    DEVOUT: ['Praying, loudly', 'Blessing the soup'],
    NOBLE: ['Complaining about the food', 'Complaining, quietly'],
    OUTCAST: ['Keeping to the edges', 'Watching the road'],
    SLAVE: ['Checking the door twice', 'Sitting near the exit'],
    FREEMAN: ['Doing sums on the back of a hand', 'Counting the pay again'],
    EDELOS: ['Haggling over a rope', 'Selling a rope']
  };
  const RACE = {
    ORC: ['Sharpening an axe', 'Missing the steppe'],
    DWARF: ['Arguing about ale', 'Judging the stonework'],
    GOBLIN: ['Counting someone’s coins', 'Hiding a coin'],
    HALFLING: ['Raiding the kitchen', 'Eating second lunch'],
    SUN_ELF: ['Complaining about the light', 'Watching the sky'],
    DARK_ELF: ['Standing very still', 'Watching the edges']
  };
  const AWAY = {
    escort: 'Escorting a wagon to ', hunt: 'Hunting in ', hold: 'Holding a post at ', rescue: 'Rescuing captives at ',
    extract: 'Fetching a prize from ', assassinate: 'Stalking a target in ', purge: 'Clearing nests at ',
    sabotage: 'Wrecking things at ', relic: 'Seeking a relic at ', ambush: 'Ambushing wagons near ',
    breach: 'Storming a fort at ', beacons: 'Lighting beacons near '
  };
  const sfx = n => n > 0 ? ', ' + n + ' season' + (n === 1 ? '' : 's') : '';
  S.activityLine = function(p, ctx){
    ctx = ctx || {};
    /* Also accepts the Barracks shape: {role, has, facility:fn(id)->name, season, trainingAt, away:'captive'|{det,dest}} */
    { const c = Object.assign({}, ctx);
      if (typeof c.facility === 'function') c.facility = c.role === 'train' ? c.trainingAt : c.role === 'vet' ? (p && p.facility) : c.role === 'rest' ? c.facility_id : undefined;
      if (c.seasons == null && c.season != null) c.seasons = c.season;
      if (!c.facility && c.trainingAt && c.role === 'train') c.facility = c.trainingAt;
      if (c.away === 'captive') { c.state = 'captive'; }
      else if (c.away && typeof c.away === 'object') { c.state = 'away'; c.place = c.place || c.away.dest || c.away.place; c.obj = c.obj || (c.away.det && (c.away.det.obj || c.away.det.kind)) || c.away.obj; }
      ctx = c; }
    const id = p && (p.id != null ? p.id : p.name) || 'x';
    const h = H(id + ':' + (ctx.salt || 0) + ':' + (ctx.role || ctx.state || ''));
    const has = ctx.has || (() => true);
    const place = ctx.place ? String(ctx.place) : '';
    let line = '';
    const st = ctx.state || 'ready';
    if (st === 'captive') line = place ? 'Held captive at ' + short(place, 20) : pick(['Held in a cage', 'In chains', 'Held captive'], h);
    else if (st === 'away') line = place ? (AWAY[ctx.obj] || 'On detachment to ') + short(place, 16) : 'Away on a detachment';
    else if (st === 'wounded') line = (ctx.facility === 'hospital' ? 'Wounded, in the hospital' : 'Wounded, resting') + sfx(ctx.seasons);
    else if (st === 'resting' || ctx.role === 'rest') {
      const fac = ctx.facility && FAC[ctx.facility] && (ctx.facility === 'hospital' || ctx.facility === 'tents') ? 'Resting in ' + FAC[ctx.facility] : pick(REST, h);
      line = fac + sfx(ctx.seasons);
    }
    else if (ctx.role === 'train') line = (TRAIN[ctx.facility] || 'Training in the yard') + sfx(ctx.seasons);
    else if (ctx.role === 'spar') line = pick(SPAR, h);
    else if (ctx.role === 'vet') line = ctx.facility && FAC[ctx.facility] ? 'Minding ' + FAC[ctx.facility] : pick(VET, h);
    else if (ctx.role === 'sit') line = pick(SIT, h);
    else {
      const flavour = [].concat((p && CLS[p.cls]) || [], (p && RACE[p.race]) || []);
      const facs = Object.keys(WANDER).filter(k => k !== 'any' && has(k));
      const r = h % 5;
      if (flavour.length && r < 2) line = pick(flavour, h >>> 3);
      else if (facs.length && r < 4) line = pick(WANDER[facs[(h >>> 3) % facs.length]], h >>> 5);
      else line = pick(WANDER.any, h >>> 3);
    }
    if (line.length > 39) line = line.replace(/, \d+ seasons?$/, '');
    return short(line, 39);
  };
})();

/* ============================================================================
   INDEX 85p - F-31.3 AFTER THE CONTRACT: MOMENT LINES AND THE SCRIBE'S ENTRY
   STORY.momentLine(p, ctx)  one short line (under 40 chars, present tense, no name)
     ctx.moment  'mostKills' | 'gotUp' | 'killingBlow' | 'fallback'
                 (aliases: most_kills, got_up, downed_then_up, killing_blow, blow, none)
     ctx.foe     the named foe's name, for killingBlow (optional)
     ctx.kills   kills this contract (optional)
     ctx.salt    any number, rotates the line
   STORY.chronicleLine(ctx)  the Scribe's short entry for the contract
     ctx.outcome 'win' | 'loss' | 'withdrew'     ctx.title  contract title
     ctx.place   place name   ctx.host  "the Hollow dead"   ctx.dead  number of mates lost
   Seasons only, never days. Returns a plain string, never empty.
   ROLLBACK: delete this block.
============================================================================ */
(function(){
  const S = window.STORY = window.STORY || {};
  const H = s => { let h = 11; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0; return h; };
  const pick = (a, h) => a[h % a.length];
  const MOMENTS = {
    mostKills: [
      'Led the day in kills', 'Cut the most throats', 'Left a pile behind them', 'Kept the highest count',
      'Made the day look easy', 'Hardly stopped swinging', 'Put down more than most', 'Danger to everyone near'
    ],
    gotUp: [
      'Went down and got back up', 'Fell, then stood again', 'Refused to stay down', 'Got up when it counted',
      'Crawled out of the dirt', 'Came back from the ground', 'Spat blood and stood', 'Down, then not'
    ],
    killingBlow: [
      'Dealt the killing blow', 'Finished {foe}', 'Put {foe} in the ground', 'Struck the last blow',
      'Ended {foe} with one swing', 'Brought {foe} down', 'Took {foe} at the end', 'Made the final cut'
    ],
    fell: [
      'Fell in the line', 'Did not get up', 'Died holding the ground', 'Paid in full',
      'Went down for good', 'Gave everything'
    ],
    fallback: [
      'Held their place', 'Did the job quietly', 'Kept their head down', 'Stood where told',
      'Carried their share', 'Watched the flank', 'Did not flinch', 'Came home tired'
    ]
  };
  const ALIAS = {most_kills: 'mostKills', kills: 'mostKills', got_up: 'gotUp', up: 'gotUp', downed_then_up: 'gotUp',
    killing_blow: 'killingBlow', blow: 'killingBlow', named_kill: 'killingBlow', none: 'fallback', default: 'fallback', steady: 'fallback', dead: 'fell', fallen: 'fell', died: 'fell'};
  S.momentLine = function(p, ctx){
    ctx = ctx || {};
    const key = MOMENTS[ctx.moment] ? ctx.moment : (ALIAS[ctx.moment] || 'fallback');
    const h = H((p && (p.id != null ? p.id : p.name) || 'x') + ':' + (ctx.salt || 0) + ':' + key);
    let line = pick(MOMENTS[key], h);
    if (line.indexOf('{foe}') >= 0) {
      const foe = ctx.foe ? String(ctx.foe) : '';
      line = foe && ('Finished ' + foe).length <= 38 ? line.replace('{foe}', foe) : 'Dealt the killing blow';
    }
    return line.length > 39 ? line.slice(0, 38).trim() : line;
  };

  const CHRON = {
    win: [
      '{C} at {place}: {host} broken, the pay collected.',
      'The company took {C} against {host} and came home.',
      '{C}: done at {place}. {host} left the field.',
      'A clean return from {place}. {C} is behind us.',
      '{C} ended well. {host} will remember {place}.'
    ],
    loss: [
      '{C} at {place} went badly. {host} held the ground.',
      'The company was driven from {place}. {C} is lost.',
      '{host} won {C}. The company licks its wounds.',
      'No pay from {place}. {C} failed.',
      '{C} is lost. {host} kept {place}.'
    ],
    withdrew: [
      'The company withdrew from {place}. {C} is unfinished.',
      '{C}: the line was pulled back from {host}.',
      'Half a job at {place}. The company walked away.',
      'The company left {C} to {host}. Some argued.',
      'A hard retreat from {place}, and a quiet camp.'
    ]
  };
  S.chronicleLine = function(ctx){
    ctx = ctx || {};
    const o = CHRON[ctx.outcome] ? ctx.outcome : (ctx.outcome === 'lost' || ctx.outcome === 'fallen' ? 'loss' : ctx.outcome === 'victory' ? 'win' : ctx.outcome === 'fled' || ctx.outcome === 'withdrawn' ? 'withdrew' : 'win');
    const h = H((ctx.title || '') + ':' + (ctx.place || '') + ':' + o + ':' + (ctx.salt || 0));
    let line = pick(CHRON[o], h)
      .replace(/\{C\}/g, ctx.title || 'The contract')
      .replace(/\{place\}/g, ctx.place || 'the field')
      .replace(/\{host\}/g, ctx.host || 'the enemy');
    line = line.charAt(0).toUpperCase() + line.slice(1);
    line = line.replace(/([.!?] )([a-z])/g, (m, a, b) => a + b.toUpperCase());   // F-45 Act III item 12: a {host} after a full stop
    const dead = ctx.dead | 0;
    if (dead > 0) line += dead === 1 ? ' One name goes on the memorial.' : ' ' + dead + ' names go on the memorial.';
    return line;
  };
})();

/* INDEX 85p self-test: every moment key the Debrief sends must give a non-fallback line (steady is the fallback). */
window.STORY.selfTest = function(){
  const S = window.STORY, fails = [], fb = S.momentLine({id: 1}, {moment: 'fallback'});
  ['mostKills', 'gotUp', 'killingBlow', 'fell', 'most_kills', 'got_up', 'killing_blow'].forEach(k => {
    const l = S.momentLine({id: 1}, {moment: k, foe: 'Wendel'});
    if (!l || l.length > 39) fails.push(k + ': ' + l);
  });
  ['mostKills', 'gotUp', 'killingBlow', 'fell'].forEach(k => {
    const lines = []; for (let i = 0; i < 30; i++) lines.push(S.momentLine({id: i}, {moment: k, foe: 'Wendel'}));
    const fbs = []; for (let i = 0; i < 30; i++) fbs.push(S.momentLine({id: i}, {moment: 'fallback'}));
    if (lines.every(l => fbs.indexOf(l) >= 0)) fails.push(k + ' falls through to the fallback');
  });
  ['victory', 'fallen', 'withdrawn', 'fled'].forEach(o => { const t = S.chronicleLine({outcome: o, title: 'T', place: 'P', host: 'H'}); if (!t) fails.push('chronicle ' + o); });
  if (S.chronicleLine({outcome: 'fallen', title: 'T'}) === S.chronicleLine({outcome: 'victory', title: 'T'})) fails.push('fallen reads as victory');
  return {ok: !fails.length, fails: fails};
};

/* ============================================================================
   INDEX 85q - F-30 PART B TEXT: Varnholt holds one front (data only)
   window.TOWN30_LINES is read by js/campaign/town.js (Lead Programmer). Only used when
   the one-front map is on (new story saves). Strings are display text only.
     intel[assaultName][index]   index 0 where from, 1 who, 2 what to hold, 3 the scout's note
     rule[assaultName]           the rule line on the card
     coach                       [[old string, new string], ...] replacements for coachLines()
     districts.ore               {name, lost} for the Ore Yard (no South Gate on this map)
   Voice: plain, dry, a little grim. The mountain closes the west and south. The North
   Gate is the loss line. Militia on the wall who fall are gone for good.
   ROLLBACK: delete this block.
============================================================================ */
window.TOWN30_LINES = {
  intel: {
    "The Reeve's Tithe": {
      0: 'The north road, and a wing up the east road',
      2: 'The North Gate and the East Wall',
      3: 'Orsolt hangs back on the east road and flees when badly hurt. The mountain closes the rest.'
    },
    'Over the Wall': {
      0: 'The east road, at night, with ladders',
      2: 'The East Wall and Smithy Row',
      3: 'The raiders carry ladders up the east road. The Tithe-Priest restores their wounds.'
    },
    'The Tithe Is Called': {
      0: 'The north road, then the east road',
      3: 'They bring a ram and ladders. Orsolt returns, if he fled.'
    },
    'The Last Wall': {
      0: 'The north road and the east road, then the Keep'
    },
    'The Last Day of Varnholt': {
      0: 'The north road, and a wing up the east road',
      3: 'They bring a ram and ladders. The town cannot hold: keep the North Gate to the end of the day, and the wagons are waiting.'
    }
  },
  rule: {
    'The Tithe Is Called': 'Hold the North Gate to the end, or the Keep Gate if you have fallen back. This time they bring a ram and ladders.',
    'The Last Day of Varnholt': 'Hold the North Gate to the end of the day, or the Keep Gate if you have fallen back. They bring a ram and ladders. Then the town must be abandoned.'
  },
  coach: [
    ['Your own gates open for you. Walk out and press <b>F</b> to set traps before the horn.',
     'The squad starts outside the North Gate, and it opens for you. The mountain closes the west and south, so everything comes down the north road or up the east road. Press <b>F</b> to set traps before the horn.'],
    ['The town cannot hold. Survive the day; then the wagons are waiting.',
     'The town cannot hold. Keep the North Gate standing to the end of the day, and then the wagons are waiting. This time they bring a ram and ladders.'],
    ['Your levies run there first.',
     'Your levies and militia stand on the wall and shoot. The ones who fall are gone for good, so keep the enemy off the wall.']
  ],
  districts: {
    ore: {name: 'The Ore Yard', lost: 'The Ore Yard is overrun. The Silver Pit is lost, and no more silver.'}
  }
};

/* ============================================================================
   INDEX 85r - OVERNIGHT BATCH: gate-down line, F-30 part C caravan text,
   F-32.3 "Fought here" lines. Data and two small functions. ROLLBACK: delete this block.
============================================================================ */

/* ---- Varnholt: the gate falls and the fight moves to the Keep (TOWN30_LINES.gateDown) ---- */
window.TOWN30_LINES = window.TOWN30_LINES || {};
window.TOWN30_LINES.gateDown = {
  banner: 'THE GATE IS DOWN',
  toast: [
    'The North Gate is down. Fall back to the Keep!',
    'The gate has gone. Back to the Keep, all of you!',
    'The North Gate falls. The Keep is all that is left.'
  ],
  coach: 'The gate is gone, so the fight moves to the Keep. Get inside and hold the Keep Gate.',
  debriefLost: 'The North Gate fell, and the company fell back to the Keep.',
  debriefHeld: 'The North Gate held to the end.'
};

/* ---- F-30 part C: the caravan and the sister companies' mercenaries (CARAVAN_LINES) ----
   Read by the parley / hire screen. The player is the Grey Cloaks. The five other founding
   companies (R-121) send mercenaries. Ids: faithful, deepshaft, rowan, rustpikes, ridge.
   Per band: name, who (card line), pitch (their offer), yes (when hired), no (when you decline),
   leave (when they go), fell (when some of them die). Tokens: {price} gold and Supply price,
   {nights} 1 or 3. Seasons only elsewhere; the caravan counts nights. */
window.CARAVAN_LINES = {
  briefing: {
    title: 'Other companies on the road',
    intro: 'Five other companies walk beside the column. None of you wear the same colours yet, and none of you trust each other. A captain will lend swords for a night, or for three, if the price suits.',
    price: 'Hire for one night, or for three at double pay. Their dead are their own, and they are lost for good.',
    none: 'Nobody will walk beside you tonight. Come back when you have more to offer.',
    note: 'A hired band follows your orders for as long as you pay. When the nights run out, they walk back to their own banner.'
  },
  bands: {
    faithful: {
      name: 'The Emperor’s Faithful',
      who: 'Heavy border infantry. Imperial shield lines gone the colour of dust.',
      pitch: '“Shield wall, two ranks, no questions. Our price is {price}.”',
      yes: 'The Faithful form a line along the wagons. They do not look at you, and they do not break.',
      no: 'The captain nods once and walks away. The line goes with him.',
      leave: 'The Faithful pick up their shields and march back to their own fires.',
      fell: 'The Faithful lost good men tonight. Their captain counts them aloud and says nothing else.'
    },
    deepshaft: {
      name: 'The Deepshaft Company',
      who: 'Breach sappers and shield lines from the dwarf country. They left the syndicates and kept the picks.',
      pitch: '“We dig, we brace, we break gates. {price}, and we do not dig graves.”',
      yes: 'The sappers dig in at the ford and throw up a bank before you have finished asking.',
      no: 'The sappers shrug. Digging is easier when nobody tells you where.',
      leave: 'The Deepshaft sappers shoulder their picks and go. The bank stays.',
      fell: 'Two of the Deepshaft are under the bank they built. Their friends tamp it down.'
    },
    rowan: {
      name: 'The Rowan Watch',
      who: 'Mounted outriders from the Edelōs tracks. They will not sleep under a roof.',
      pitch: '“We ride the edges. {price}, and we sleep outside.”',
      yes: 'The Rowan riders circle the column, quiet as owls, and settle in the dark.',
      no: 'The Rowan captain tips his head and rides off. You hear no hooves.',
      leave: 'The Rowan Watch ride out at dawn and are gone by the first bend.',
      fell: 'The Rowan Watch lost riders in the dark. Their horses came back without them.'
    },
    rustpikes: {
      name: 'The Rust-Pikes',
      who: 'Pike squares of old legion veterans. They hate the Arcana Guild and love a drill.',
      pitch: '“Pikes against horse, pikes against anything. {price}, and we drill at every halt.”',
      yes: 'The Rust-Pikes plant their lances in a hedge. A snapped one with a red ribbon marks the middle.',
      no: 'The old sergeant spits and says the road will teach you. It usually does.',
      leave: 'The Rust-Pikes shoulder their lances and march home in step.',
      fell: 'The Rust-Pikes stood where they were told and paid for it. The ribbon is torn.'
    },
    ridge: {
      name: 'The Ridge-Striders',
      who: 'Scouts and horse-archers from the Free Lands border. They report to their own officers only.',
      pitch: '“We watch the passes. {price}, and we answer to our own captain.”',
      yes: 'The Ridge-Striders go up the slope before the light and report what they find, in their own order.',
      no: 'The Striders say they will find work elsewhere, and probably already have.',
      leave: 'The Ridge-Striders ride out. One of them waves.',
      fell: 'The Ridge-Striders lost a scout in the pass. Her bow came back with her cloak on it.'
    }
  },
  outcome: {
    held: 'The column held, and the other companies saw it hold.',
    broken: 'The column broke, and the other companies will tell it.'
  }
};

/* ---- F-32.3 "Fought here": STORY.foughtHereLine(place, n, ctx) ----
   place: {id, name, kind} (any may be missing); n: contracts worked there; ctx.last: seasons since the last one
   (optional, seasons only). Returns one short line, never empty. */
(function(){
  const S = window.STORY = window.STORY || {};
  const H = s => { let h = 13; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 37 + s.charCodeAt(i)) >>> 0; return h; };
  const pick = (a, h) => a[h % a.length];
  const NONE = ['The company has not worked here yet.', 'No contract has taken the company here.', 'Nobody in the company has been here on a job.'];
  const ONCE = ['The company fought here once.', 'One contract brought the company here.', 'The Scribe has one entry for this place.'];
  const FEW = ['The company has fought here a few times.', 'A few contracts have brought the company here.', 'The road leads here more than once.'];
  const MANY = ['The company knows this ground well.', 'The company has bled here more than once.', 'The Scribe has stopped counting here.', 'Half the company has a story about this place.'];
  const KIND = {
    city: ['The gate guards know the company by sight.'], port: ['The harbour watch has learned to count the company.'],
    fortress: ['The walls remember the company.'], keep: ['The walls remember the company.'],
    forest: ['The trees keep what they were given.'], river: ['The river has seen the company wade it.'],
    hamlet: ['The locals nod at the company, and keep their doors shut.'], town: ['The locals nod at the company, and keep their doors shut.'],
    inn: ['The innkeeper keeps the company a table.'], ruin: ['The stones have heard the company before.'],
    road: ['The company has marched this road before.']
  };
  S.foughtHereLine = function(place, n, ctx){
    ctx = ctx || {}; n = n | 0;
    const key = (place && (place.id || place.name)) || 'x', h = H(key + ':' + n);
    if (n <= 0) return pick(NONE, h);
    let line = n === 1 ? pick(ONCE, h) : n < 4 ? pick(FEW, h) : pick(MANY, h);
    const kk = place && place.kind ? Object.keys(KIND).filter(x => String(place.kind).toLowerCase().indexOf(x) >= 0)[0] : null, k = kk ? KIND[kk] : null;
    if (k && n >= 2) line += ' ' + pick(k, h >>> 3);
    if (ctx.last != null && n >= 1) {
      const l = ctx.last | 0;
      line += l <= 0 ? ' The last was this season.' : l === 1 ? ' The last was one season ago.' : ' The last was ' + l + ' seasons ago.';
    }
    return line;
  };
})();

/* INDEX 85r addendum: caravan bands.<id>.allDead, shown instead of the leave line when the whole band dies. */
(function(){
  const B = window.CARAVAN_LINES && window.CARAVAN_LINES.bands; if (!B) return;
  const D = {
    faithful: 'None of the Emperor’s Faithful came back. Their captain’s shield lies on the road, and the contract ends with them.',
    deepshaft: 'The Deepshaft Company is gone to the last sapper. The bank they dug is their grave, and the contract ends with them.',
    rowan: 'The Rowan Watch rode out and did not ride back. The horses came home empty, and the contract ends with them.',
    rustpikes: 'No Rust-Pike marched home. The ribbon stayed on the road, and the contract ends with them.',
    ridge: 'None of the Ridge-Striders came back. Their contract dies with them.'
  };
  for (const k in D) if (B[k]) B[k].allDead = D[k];
})();

/* INDEX 85r addendum 2: F-30 part C and F-30.1 interim strings, rewritten.
   Placeholders: {n} {names} {band} {faction} {facility} {NAME} {discount} ("90gp off" or "free"). */
(function(){
  const C = window.CARAVAN_LINES = window.CARAVAN_LINES || {}, T = window.TOWN30_LINES = window.TOWN30_LINES || {};
  C.fallen = 'Lost on the road: {names}, and {n} more.';
  C.fallenFew = 'Lost on the road: {names}.';
  C.stays = '{band} stay for {n} more nights.';
  C.staysOne = '{band} stay one more night.';
  C.boardTitle = 'The Column';
  C.falls = '{NAME} FALLS';
  C.chronicle = 'The column comes home. {n} of the Varnholt folk settle beside the camp, {names} among them.';
  T.towerKills = 'The towers took {n} of them off the road.';
  T.heldGate = 'Word of the held gate gets about. {faction} take note.';
  T.mendBtn = 'MEND THE PALISADE';
  T.mendSub = '{discount} on the {facility}, once a downtime';
})();

/* INDEX 85r addendum 3: caravan pool note and F-29 spoils lines.
   Placeholders: {name}, {card}, {where} ("in the Armoury" or "on the wagon"), {gp}. */
(function(){
  const C = window.CARAVAN_LINES = window.CARAVAN_LINES || {};
  C.poolNote = '{name} walked out of Varnholt with the column and asks to sign on. They will take less than a sellsword.';
  const L = window.LINKS35_LINES = window.LINKS35_LINES || {};
  L.spoils = 'They brought back {card}. It is now {where}.';
  L.spoilsSold = 'They brought back {card}, but the wagon was full. It sold on the spot for {gp}gp.';
})();
