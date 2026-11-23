/* ============================================================================
   CAMPAIGN_LINES: data only (Narrative Designer). F-34, the Founding as a teaching campaign.
   Read by the campaign code (Lead Programmer wires it). No code in this file.

   Sections: captions (beats 1 to 11 + Long Road sub-beats + ending), cayde, hal, pinch,
   ostler, sigrun, sunElves (faction name and standing lines), leads (beat 6), tips (the
   first-time tips table, used by the campaign and by a fresh chapter with tips on),
   fieldNotes, hiring. At the end of the file: lessons, coach, cast45, founding45 (F-45 teaching plan v2).
   Voice: plain, dry, a little grim. British spelling, no em dashes. Cayde is dry and tired.
   Year 616, told from inside the Grey Cloaks. No Work Orders anywhere: real features only.
   Tokens: {name} {leader} {n} {place} {band}.
   Lore: R-027 (Master of the Grey Cloaks), R-063, R-083, R-106, R-108, R-113, R-114, R-121.
   ============================================================================ */
window.CAMPAIGN_LINES = {

  /* QA G2 (22 Nov): the b5 and b5b fields were random jobs that did not match their cards. The fixed words for each job; the EN pins
     place, host, cargo, dir and patron on the contract and uses brief in place of the rolled one. */
  jobs: {
    b5:  {place: "the north road", host: "bandits", cargo: "folk from Tarim's roads", dir: "ns", patron: "the Reeve of Varnholt",
          brief: "A cart of folk from Tarim's roads is stuck on the road outside the north gate. Bring it in to the gate. Bandits in the trees will go for it. If the cart burns, the job is lost."},
    b5b: {place: "the east road", host: "deserters", patron: "the Reeve of Varnholt",
          brief: "Frost-Vault deserters, turned slavers, are taking refugees off the east road. Their camps are along it. Find their camps and kill every commander."}
  },
  captions: {
    b1: "",   /* P23-VOICE: folded into cayde.b1 */
    b2: "",   /* P23-VOICE: folded into cayde.b2 */
    b3: "",   /* P23-VOICE: folded into cayde.b3 */
    b4: "",   /* P23-VOICE: cut; Cayde speaks (cayde.b4, cayde.b4again) */
    b5: "",   /* P23-VOICE: folded into cayde.b5 */
    b6: "",   /* P23-VOICE: folded into cayde.b6 */
    b5b: "",   /* G2: the Hunt, after the gate. P23-VOICE: folded into cayde.b5b */
    b7: "",   /* P23-VOICE: folded into cayde.b7 */
    b8dusk: "At dusk the north road fills with torches.",   /* Act III item 8: the b8 card. P23-VOICE: the Scene line; the rest is cayde.b8dusk */
    b7lost: "",   /* Act III item 6: after a lost lead or a death in Act II. P23-VOICE: folded into cayde.b7lost */
    b8: "",   /* P23-VOICE: folded into cayde.b8 */
    b9: "",   /* G2: b9 is a defence, no lead. P23-VOICE: folded into cayde.b9 */
    b9b: "",   /* P23-VOICE: folded into cayde.b9b */
    b10: "",   /* P23-VOICE: folded into cayde.b10 */
    b10keep: "",   /* Act III item 10: b10 when F.gateLost(). P23-VOICE: folded into cayde.b10keep */
    b10breach: "",   /* P23-VOICE: folded into cayde.b10breach */
    b11: "",   /* P23-VOICE: folded into cayde.b11 ({families}) */
    road: {
      ally: "Rust-Pikes. Which company are you? And what can you do?",
      whiteFlag: "A Frost-Vault officer walks forward under a white cloth.",
      caster: "I am of the Collective. Let me walk with your column. I carry books, and I know what is in them.",
      momentum: "We have found a rhythm. Let it run.",
      week1: "A week on the road. The column is learning to move in the dark.",
      week2: "Two weeks. Food is running thin, and tempers thinner.",
      week3: "The third week. Somebody ahead says the word Artemis, and nobody believes it yet.",
      kalloon: "Thornwater Ford. Lord Artemis's riders, and the frontier of his lands behind them."
    },
    ending: {
      agree: "Six companies stand in the camp in Artemis's lands and agree to march under one banner.",
      card: "Nine years later, the charter is signed."
    }
  },

  cayde: {
    b1: ["Grey Keep has fallen. The Empire paid the Grey Cloaks to hold it, and the Dark Elves came north out of the forest with more than we could ever hold. I was on the far side of the forest when the walls went.", "A Dark Elf host keeps slavers at its back. After a battle they chain whoever is left alive and march them off to work. Some of my people are in their cages, on this road.", "We are getting them back."],
    b2: ["They have stopped in the trees to water the beasts. Those cages are on wheels, and two of ours are in them.", "Hal. Pinch. Keep your heads down in there. I will find the key."],
    b3: ["One more of ours from the Keep, taken alive like Hal and Pinch. I know the face. The name will come back to me.", "You held. Good. I am making you Squad Leader, and I am going ahead to scout. Stay with these two."],
    b4: ["This is Varnholt: silver mines, a mill, a mountain at its back, and every refugee from the north at its gate. Lord Artemis is here, and he means to hold it.", "Until somebody better turns up, I run the company from the Reeve's hall. I would rather that somebody were you.", "I know a quartermaster who owes me. Get our people kitted out while I ask the Reeve what he has not told us."],
    b4again: ["Back already? Good. Finish what you came for. The host will not wait for us."],   /* P23-VOICE F13a: every later visit to the b4 card (new key; the EN wires it) */
    b5: ["A cart of folk off Tarim's roads is stuck outside the north gate. Bring them in, and count them twice.", "Folk on the road do not ask for much. They ask for a gate that opens."],
    b5b: ["The first assault has broken. The host is licking its wounds, and while it does, its slavers are on the east road, taking refugees.", "Somebody has to stop them. That is us."],   /* P23-VOICE: new key (the caption was b5b) */
    b6: ["There are two offers on the board. One earns you friends and one earns you steel, and either way someone remembers.", "Pick the one you can live with."],
    b7: ["Three jobs and two assaults, and you are not a band of strangers any more. That is what a company looks like.", "Now teach them. Spend those Advancements well. They do not come cheap."],
    b7lost: ["Three jobs, and not all of them clean. You know now who you can count on, and what it costs.", "Now teach them. Spend those Advancements well. They do not come cheap."],   /* P23-VOICE: new key (the caption was b7lost) */
    b8dusk: ["The mountain closes the west and the south. There is one way in, and they are on it.", "The gate is the line. Hold it. The mountain does half our work. The other half is yours."],   /* P23-VOICE: new key; shows under the Scene line in captions.b8dusk */
    b8: ["The host is here. The mountain closes the west and the south, so they have to come down the north road.", "The gate is the line. Hold it. The mountain does half our work. The other half is yours."],
    b9: ["Here they come again, down the north road, heavier this time. This is the second assault.", "They learn from us, too. Do not hold a pattern."],
    b9b: ["The second assault has broken. It cost us more than the first."],   /* P23-VOICE: new key (the caption was b9b) */
    b10: ["This is the third assault, and the last. The North Gate is under siege from the first horn. Hold it as long as you can.", "If the gate goes, we fall back to the Keep. If the Keep goes, we get out.", "Zenif is on the east wall. He knows what he is doing."],
    b10keep: ["The North Gate is gone and the host is in the lower town. The Reeve's Keep is all we have left. Hold it.", "Zenif is on the east wall, buying us time. He knows what he is doing."],
    leadLost: ["It happens. Count who came back, then count again tomorrow."],   /* Act III item 9: a lost b6 lead (G2: b9 has no lead) */
    b10breach: ["The North Gate is down. Back to the Keep, then out. Do not look back at the town.", "Zenif is dead on the east wall. He knew. He stayed to give us the hour.", "Lord Artemis is taking the refugees out through the sally gate. We walk behind them."],
    b11: ["Forty thousand people are on this road, out of Tarim and Varnholt. We do not guard all of them. Our stretch is {families} families and twelve wagons, and our own Ledger Wagon.", "The Dark Elves have sent a column after us. It is three weeks to the Empire's lands, and they will come for us at night.", "We do not have to like each other. We have to arrive."],   /* P23-VOICE F18; {families}: 20, or 16 after a lost siege (the EN fills it) */
    praise: ["Good work.", "That will do.", "You are better at this than I was."],
    goodbye: ["The company is yours. I will find you in Artemis's lands.", "Keep them alive. That is the whole job."],
    skip: ["You know your people. I will leave you to it."]
  },

  hal: {
    name: "Hal",
    role: "Soldier",
    bio: "One of the old Grey Cloaks sergeants, captured alive at Grey Keep. He held the postern gate alone so the others could run. He does not talk about it.",
    intro: ["Sergeant Hal. Orders?", "Orders. Good. Give me a place to stand."],
    thanks: ["You came for us. I will remember it.", "Cayde said you would. I did not believe him."],
    idle: ["Orders.", "I can hold here.", "The ground is good. We will keep it.", "Keep your boots dry."],
    kill: ["One down.", "Hold the line.", "Next."],
    hurt: ["It is nothing.", "I have had worse.", "Keep fighting."],
    down: ["Go on. I will catch you up."],
    levelUp: ["Better. Good.", "More training. Good."],
    mark: ["On the mark.", "Marked. Understood."],
    gate: ["I know a postern when I see one.", "Someone should watch the small gate."],
    bond: ["You are a good officer.", "You listen. That counts for a lot."],
    ringQuip: "Hal does not talk about the postern."
  },

  pinch: {
    name: "Pinch",
    role: "Scoundrel",
    bio: "Another of the old Grey Cloaks sergeants, captured alive at Grey Keep. He lifted a seal-ring from the host's quartermaster in the middle of the battle and kept it.",
    intro: ["I am fine. I am extremely fine.", "Never been better. Is that a key? I love keys."],
    thanks: ["You are my favourite person. Do not tell the others.", "Right. Yes. Thank you. I was not scared at all."],
    idle: ["Everything is fine.", "I did not take that. I borrowed it.", "Is anybody hungry? I have a pie. Do not ask."],
    kill: ["Ha! Got him.", "That one owed me money.", "Next!"],
    hurt: ["Ow. Ow. Ow. Fine.", "That is going to be a good story.", "I am fine. It is a flesh wound."],
    down: ["Tell my mother I was brave."],
    levelUp: ["Ha! More tricks.", "I knew I was clever."],
    mark: ["Marked. I like marked.", "I will take that one."],
    trap: ["Mind the string.", "Careful there. I put something clever in the grass."],
    vaneDown: ["That is him. The rest will come to us."],
    bond: ["You are all right. For an officer.", "Do not tell Hal, but I would follow you."],
    ring: ["I have a ring. I may or may not know what it opens."]
  },

  ostler: {
    name: "Captain Maryn Ostler",
    band: "The Rust-Pikes",
    bio: "Hard, ex-legion, and wary of the Arcana Guild and of magic in general. She wants her pikes handled well.",
    pitch: "“Pike squares. We drill at every halt. Our price is {price}. Do not waste my people.”",
    accept: "“Then we have a bargain. My pikes follow your orders, within reason.”",
    order: ["“Understood.”", "“We hold.”", "“My pikes stand.”"],
    praise: ["“Well led.”", "“You have a head for this.”"],
    hurt: ["“Our line bends. It does not break.”"],
    mage: "“Keep your mage away from my ranks. I do not trust what I cannot see.”",
    farewell: "“The Rust-Pikes march home. Keep the road clear.”"
  },

  /* Act III item 8: Zenif is named here first (b8 card), so b10 does not meet a stranger. */
  zenif: {
    b8: ["I am Zenif, an old friend of Cayde's. I will hold the east wall."]
  },
  sigrun: {
    name: "Strategos Sigrún",
    bio: "A Dark Elf officer of the detached Frost-Vault column that chases the Long Road. Disciplined, practical, not cruel.",
    approach: "“I have two hundred people to bring home, and you have forty thousand to lose. Talk to me.”",
    demand: "“Then it is surrender. Count my soldiers well, Leader. They are worth more alive.”",
    withdraw: "“I will remember this.”",
    fight: "“So be it.”",
    prisoner: "Strategos Sigrún sits in the prisoner ledger, straight-backed, waiting for her price.",
    ransomed: "Strategos Sigrún goes home with her soldiers. She does not look back.",
    recruit: "Strategos Sigrún signs, grimly. She says it is a better chain of command than hers.",
    released: "Strategos Sigrún walks south, alone, with your word that she will not be followed."
  },

  sunElves: {
    name: "Sun Elf Exiles",
    patron: "Speaker of the Exiles",
    folk: "Sun Elf refugees",
    subtitle: "Remnant of Tarim",
    blurb: "The elves of the cities in the forests. Tarim fell, and those who got out are scattered across the world with no government to speak for them. They keep a long memory.",
    standing: {
      "-3": "The Sun Elves curse your name.",
      "-2": "The Sun Elves cut your name from their rolls.",
      "-1": "The Sun Elves are cold with you.",
      "0": "The Sun Elves know you only by report.",
      "1": "The Sun Elves are warm with you. They share water.",
      "2": "The Sun Elves speak well of you in every camp.",
      "3": "The Sun Elves are your people now."
    },
    perk: {
      name: "Sunlit Rally",
      line: "Once a contract, the first Squad Mate to fall stands up at once with 1 Condition."
    },
    gain: "The Sun Elves remember: +1 Standing.",
    loss: "The Sun Elves take note. Standing falls.",
    freed: "{n} elves walk out of the cages and into the column.",
    raided: "The Sun Elves hear what you took, and from whom."
  },

  leads: {
    rescue: {
      title: "Free the captives",
      brief: "A slave wagon has stopped in the forest with elves from Tarim in its cages. The Hollow guard it: the Frost-Vault's conscripts and slaves, driven ahead of the host. The elves in the cages will be sold as slaves. Free them. The Sun Elves will remember who did.",   /* PD-23: the Hollow are conscripts and slaves, never "dead" in the Founding */
      win: "The cages are empty and the elves are walking. Nobody will march them in front of the Frost-Vault now. The Sun Elves remember.",
      loss: "The wagon rolled north with its cargo. By the next assault they will be slaves in the Frost-Vault. The Sun Elves will hear of it.",
      withdrew: "You left the cages. Nobody blames you aloud."
    },
    raid: {
      title: "Raid the supply camp",
      brief: "A quartermaster's camp in the trees holds good kit: shields, bows, a few real blades. Take it, and let the Sun Elves think what they like.",
      win: "The racks are empty and the cards are yours. The Sun Elves hear what you took, and from whom.",
      loss: "The camp held its stores. You came away with nothing but wounds.",
      withdrew: "You left the stores where they lay."
    },
    frame: "Two offers. Whichever you take, the town will know.",
    /* the Leads card (b6 since G2): the market and the Hiring Line are open. One line on the card, one tip. */
    market: "The town is spending its last good day selling you what it has.",
    spend: "Gold does nothing sitting in the Treasury. Buy cards at the Armoury and hire at the Campfire before the next assault.",
    hire: "Hire new people at the Campfire."   /* F.hireLine: replaces the fallback that named the Barracks (K15: Roster) */
  },

  /* UX K26 to K29 (audits/f48-ux-review.md), the words for the No mark sign (js/nomark48.js, N.TXT.word).
     K29: the first sign in a contract names the cure, once, over one mate (the first undrilled mate to qualify);
          every later sign is the short word. If K27 goes to one squad word, that one word is `first` once, then `word`.
     K28: keep the word over a mate who is still swinging: it is true (nothing is marked) and a mark makes them far
          stronger. No new word for it; `why` is the hover or Deck line if the LP wants one.
     K26: no word change. The longer hold [S] is the LP's; a sign that lasts reads as a state, a flash reads as noise. */
  nomark: {
    word: "No mark",
    first: "No mark: click a foe",
    why: "Not drilled: fights only what is in reach until you mark a foe."
  },

  tips: {
    firstMove: "WASD moves you.",
    firstEnemy: "Left click an enemy and you shoot it. Right click one in reach and you swing. Your click marks it too, and the squad goes for the mark.",
    outOfReach: "Out of reach, we shoot. Once they are in reach, we use blades.",
    commandRadius: "Inside the dashed ring, we look after each other. Keep everyone in it.",
    cage: "Clear the guards, then stand by the cage until it breaks.",
    levelUp: "After a contract, give each Advancement to a different Squad Mate.",   /* ND 17 Nov: TAB opens the Momentum cards (js/ui/screens.js 511), not Advancements */
    momentum: "The Momentum bar is full. Pick one of the three cards with 7, 8 or 9.",
    wound: "Wounds are your life, Leader. At 0 you are down.",
    hurtMate: "The hurt rest, and sit out the next job.",
    armoury: "Cards are gear. Put them on the squad before you sign for a job.",
    board: "Pick a job. Each one pays differently, and each moves our Standing with someone.",
    escort: "Every job has a fight. This one has a cart, too: keep it whole.",
    debrief: "Read the cards. They tell you who fought, who fell, and who learned something.",
    gate: "Our people on the wall shoot. If the gate falls, back to the Keep.",
    whiteFlag: "They want to talk. Make them surrender, or let them go.",
    prisoner: "A prisoner goes in the ledger. Ransom them, question them, hire them, or let them go.",
    ally: "A hired captain leads their own squad. Give them orders, or send them off on their own.",
    detachment: "A detachment fights on its own, without you. You see the odds before you send them.",
    book: "Every Specialty building keeps a library. Research an entry once and the whole Chapter has it, and anyone of that Specialty who meets its gate can put it on their key or in a spare slot.",   /* PROG-1 (Research, not Copy), 16 Nov */
    chronicle: "The Chronicle keeps our story. Field Notes keeps every tip you have heard.",
    /* Ch 12 to 14 beats: the defence, the fall, the Long Road (F-34 step 6) */
    defenceStart: "Hold the gate. Our people on the wall shoot, and we fight in front of it.",
    wallArchers: "The militia on the wall shoot for us. Lose one, and they are gone for good.",
    ram: "A ram is coming. Kill the crew before it reaches the gate.",
    ladders: "Ladders are going up the wall. Watch for the red marks.",
    gateFalls: "The gate is down. Back to the Keep, and hold the Keep Gate.",
    keepFight: "The Keep is the last line. Hold it until the clock runs out.",
    sallyGate: "The town is lost. The sally gate is our way out.",
    longRoad: "Guard the column through the night. Every enemy that reaches it costs us Column Strength.",
    columnStrength: "Column Strength is how many of our families are still on their feet.",
    nightChoice: "Each day, choose how we make camp. Each choice changes the night.",
    parleyOffer: "A captain wants to talk. A roll decides whether they listen.",
    bandHire: "Talk a band into marching with us for three nights. They take a quarter of the gold.",
    bandEquip: "Lend a band your cards if you like. They come back to the wagon when the band goes.",
    bandShare: "The band takes its share of the gold and Supply we salvage. The gear stays ours.",
    parleyDemand: "Make them surrender and they are our prisoners. Let them go and they will remember it.",
    sunStanding: "Free the elves and the Exiles will trust us. Raid their enemies and we lose that trust.",
    kalloonEnd: "The last night is a hold-out. Keep the column alive until Artemis's knights come. What you built along the road becomes your company."
  },

  fieldNotes: {
    title: "Field Notes",
    intro: "Every tip you have seen, kept in order.",
    empty: "Nothing here yet. Tips appear the first time something happens.",
    seen: "Seen {n} of {total}."
  },

  hiring: {
    freedLeader: "{leader} walked out of the Keep's cages and into the company. Cayde vouched for them, and that was enough.",
    folk: "{name} walked out of Varnholt with the column and asks to sign on. They will take less than a sellsword."
  }
};


/* ============================================================================
   CAMPAIGN_LINES.persuade: the Long Road band loop (Scope 3): persuade, equip, split loot.
   Data only. Terms: three nights, no gold up front, the band takes 25% of the gold loot (SHARE34.rate.band, Patrick 2026-11-14; was 50%)
   (the same once its captain is made an officer); cards are lent and return to the wagon;
   a band that loses more than half its mates walks away. Tokens: {band} {captain} {n} {gp} {card}.
   Bands: faithful, deepshaft, rowan, rustpikes, ridge (ids as in CARAVAN_LINES.bands).
   Trait lore fits are confirmed by Narrative: see `traits`.
   ============================================================================ */
(function(){
  const P = window.CAMPAIGN_LINES.persuade = {
    frame: {
      intro: "Recruiting a band is a chance, not a purchase. Talk to a captain and find out what they want.",
      offerTwo: "Two captains have walked over to hear what you offer.",
      offerOne: "A captain has walked over to hear what you offer.",
      none: "Nobody will talk tonight. Try again tomorrow.",
      terms: "Three nights, no gold up front. The band takes a quarter of the gold and half the Supply salvage from each night it marches. You keep the gear.",
      termsShort: "Three nights. A quarter of the gold, half the Supply you win. You keep the gear.",
      refuse: "No harm done. A refusal costs nothing.",
      nightLeft: "{band} march with you for {n} more nights.",
      nightLeftOne: "{band} march with you for one more night."
    },
    traits: {
      faithful: {name: "Shield Discipline", line: "+1 Ward Token at the start. Imperial drill, kept.", fit: "Fits: border infantry in disciplined shield lines (R-121)."},
      deepshaft: {name: "Dug-In Line", line: "+1 armour step on their mates. They dig in.", fit: "Fits: breach sappers and shield lines from the dwarf country (R-121, R-066)."},
      rowan: {name: "Long Eyes", line: "+30 px ranged reach. They shoot from the edges.", fit: "Fits: mounted outriders and perimeter skirmishers (R-121)."},
      rustpikes: {name: "Pike Reach", line: "Longer melee reach. Pikes keep the horse away.", fit: "Fits: pike squares of ex-legion veterans (R-121)."},
      ridge: {name: "Pass-Scouts", line: "+10% move and vision. They find the way first.", fit: "Fits: scouts and horse-archers from the Free Lands border (R-121)."}
    },
    bands: {
      faithful: {
        approach: "“No Emperor pays the Faithful now. We will take your coin, if you can show us a line worth holding.”",
        terms: "“Three nights. A quarter of the gold from each. We keep our shields and you keep your plunder.”",
        accept: "“Done. The Faithful hold your wagon line.”",
        refuse: "“We have held worse for less. Ask again when you have a plan.”",
        equip: "“A better shield is a better night.”",
        lent: "“Lent, not given. We know the difference.”",
        returned: "“The Faithful return what they borrowed.”",
        walk: "“The line cannot hold with so few. We go.”"
      },
      deepshaft: {
        approach: "“Dwarves who left the syndicates are cheap to talk to and expensive to ignore. What are you building?”",
        terms: "“Three nights. A quarter of the gold. We dig where you point, and we do not dig graves.”",
        accept: "“Agreed. We shore up the ford before you finish asking.”",
        refuse: "“The ground will still be there tomorrow. So will we.”",
        equip: "“Good iron. Do not scratch it.”",
        lent: "“A loan. We pay interest in breaking things.”",
        returned: "“Your iron, polished. That is a courtesy.”",
        walk: "“We came to dig, not to bury. We are gone.”"
      },
      rowan: {
        approach: "“We do not sleep under roofs. If you can promise us the edges of the night, we will ride with you.”",
        terms: "“Three nights, a quarter of the gold. We take the flanks and the dark.”",
        accept: "“Riders out. You will not hear us.”",
        refuse: "“The road is long. Find us at the next fire.”",
        equip: "“A longer bow is a longer night.”",
        lent: "“We will bring it back. We always do.”",
        returned: "“Your bows, strung and dry.”",
        walk: "“Too few riders for the dark. We vanish.”"
      },
      rustpikes: {
        approach: "“Captain Maryn Ostler. Pikes against anything. I drill at every halt, and I will drill yours if they stand near.”",
        terms: "“Three nights, a quarter of the gold. Do not waste my people.”",
        accept: "“The Rust-Pikes stand with you. Mind the ribbon.”",
        refuse: "“The road will teach you what I would. It usually does.”",
        equip: "“That is a decent pike. Do not give it to a fool.”",
        lent: "“Lent. If it breaks, you owe me a lance.”",
        returned: "“Returned, oiled. Do the same for yours.”",
        walk: "“Half my pikes down. I will not spend the rest. We march home.”"
      },
      ridge: {
        approach: "“The Ridge-Striders answer to their own captain, always. Still, a good trail beats a good argument.”",
        terms: "“Three nights. A quarter of the gold. We scout, you decide, and we tell you the truth.”",
        accept: "“We go up the slope before light. Follow the smoke.”",
        refuse: "“There are other trails. Good luck on yours.”",
        equip: "“That will carry well on a ridge.”",
        lent: "“Borrowed. We keep the shape of it in mind.”",
        returned: "“Yours again. Mind the weight.”",
        walk: "“Not enough of us to climb. We turn back.”"
      }
    },
    loot: {
      share: "{band} take {gp}gp, their quarter. The gear stays with you.",
      firstPick: "{band} get first pick of {card}. They stay loyal for it.",
      lent: "{card} is lent to {band}. It returns to the wagon when they leave.",
      returned: "{card} returns to the wagon.",
      officer: "{captain} is made an officer. The band becomes part of the company."
    },
    walkAway: "{band} have lost too many to go on. They walk away at dawn."
  };
})();


/* ============================================================================
   CAMPAIGN_LINES.bardSong: F-22 Request a song (Narrative). The Camp Bard's lines.
   Data only. Keys:
     offer       what he says when you come over
     cost        the price line ({gp} gold)
     menu[tune]  one menu line per tune; tunes: bard, heartland, mendor, freelands, marches, spine, frost
                 (the bard's own tune, then the MOOD regional colour voices in js/audio-mood.js)
     play[tune]  a line while he plays it
     thanks      array: a short thank-you after you pay
     cantAfford  array: when you cannot pay
     again       he is already playing; stop       he stops when the scene changes
   Tokens: {gp} {bard} (his name). Plain, warm, a little wry. No italics, no em dashes.
   ============================================================================ */
window.CAMPAIGN_LINES.bardSong = {
  offer: "A song, Leader? I take requests, and I take coin even more gladly.",
  cost: "{gp} gold a song.",
  menu: {
    bard: "My own tune. The one I would play anyway.",
    heartland: "The pipe from the heartland: wide roads and high summers.",
    mendor: "The fiddle of Mendor: slow, devout, and a little sad.",
    freelands: "The fiddle of the Free Lands: quick, and a bit proud of itself.",
    marches: "The hurdy-gurdy of the Marches: wet boots and long grudges.",
    spine: "The low drone of the Spine: old stone, and something that watches.",
    frost: "The frost bell: cold air, and nothing left to say."
  },
  play: {
    bard: "He settles into his own tune, as if it had been waiting.",
    heartland: "The pipe goes out over the camp like a long road in the sun.",
    mendor: "The fiddle slows. Somebody crosses themselves, and pretends it is a cough.",
    freelands: "The fiddle runs ahead of itself, and the camp keeps up.",
    marches: "The hurdy-gurdy grinds out a tune that smells of mud and old quarrels.",
    spine: "The drone starts low and does not stop. The fire sounds smaller.",
    frost: "A single bell, then another. The fire leans away from it."
  },
  thanks: [
    "Thank you. That coin will become a better string.",
    "Generous. I will play it as if it were a lot more.",
    "A fine request. You have good taste, or good luck.",
    "Done. Listen well, and do not tell the others I charge."
  ],
  cantAfford: [
    "Ah. The treasury is thin tonight. Come back when it is not.",
    "I would play for free, Leader, but the strings do not eat for free.",
    "Not tonight, I am afraid. A song costs a coin, and so does a loaf.",
    "The tune will keep. So will I. Come back with a copper."
  ],
  again: "He is already playing. Ask again when the song is done.",
  stop: "The song ends when the scene changes. He bows anyway."
};

/* ============================================================================
   F39_LINES: extra lines for F-39 events (Narrative). Data only. Lives here because this file is loaded by the game. The LP reads these where wired:
   hedgeSprite.debriefAccept / debriefRefuse; hob.jobWin / jobLoss / jobBrief; names.* for creatures that use
   a label today; ridgeGiant.barrel (used only if a skip option is ever added; shape A has no choice).
   ============================================================================ */
window.F39_LINES = {
  hedgeSprite: {
    debriefAccept: "A Hidden Folk traded the squad a path for a trinket. The thicket gave way, and the boot laces came back tied in a bow.",
    debriefRefuse: "The squad turned the sprite down. The thicket stayed thick, and the road was longer."
  },
  hob: {
    jobBrief: "A hearth-spirit asks a small favour: see a hearth, a tool or a sleeping child safely home. A loaf waits at the end.",
    jobWin: "The job is done. A loaf sits on the sill, still warm. The hob does not thank you. It eats.",
    jobLoss: "The job failed. The hob leaves no loaf, and turns back to its ashes without a word.",
    insult: "A crock flies. The squad leaves with a bruise and a lesson."
  },
  ridgeGiant: {
    barrel: "The squad leaves a barrel at its feet and walks on. The giant watches them go, and does not throw."
  },
  names: {
    bronzeSentinel: "the Bronze Sentinels",
    cliffShrike: "the Cliff Shrike"
  }
};

/* F39_LINES addendum: the shape B creatures. Per creature: event (the offer), accept, refuse, debriefAccept, debriefRefuse.
   Refusing is free for the Hidden Folk and Hob (Patrick). Arcadian names only. */
(function(){
  const F = window.F39_LINES = window.F39_LINES || {};
  Object.assign(F, {
    fordHorse: {
      event: "A grey horse stands in the ford and offers the squad a ride across.",
      accept: "The horse carries the squad over, dry. It asks one thing: keep your word, whatever it was.",
      refuse: "The horse tips its head and lets the squad wade. The water is cold and deep.",
      debriefAccept: "A grey horse carried the squad across the ford, and the bargain was kept.",
      debriefRefuse: "The squad waded the ford alone. Nobody was lost, and nobody was dry."
    },
    greenHound: {
      event: "A white hound with red ears runs ahead at dusk, and looks back.",
      accept: "The hound leads the squad through the gloom to a lost patrol, three days cold.",
      refuse: "The hound watches the squad go, then runs on without them.",
      debriefAccept: "A green hound led the squad to a lost patrol. It was not too late for most of them.",
      debriefRefuse: "The squad ignored the hound. It went on alone, and the dusk closed in."
    },
    antleredWarden: {
      event: "An antlered warden stands at the edge of a grove and watches the squad.",
      accept: "The squad guards the grove. The warden bows its head, and roots lift the wounded to safety.",
      refuse: "The squad passes the grove by. The warden watches them out of sight and does not follow.",
      debriefAccept: "An antlered warden blessed the squad for guarding its grove.",
      debriefRefuse: "The squad left the grove alone. The warden did not follow."
    },
    ravenSeer: {
      event: "A black raven watches the camp from a dead branch. It has seen you.",
      accept: "The squad goes after the bird. It dives and falls, and the host will be blind to your march for a day.",
      refuse: "The squad lets the raven be. It flies north with your name.",
      debriefAccept: "The squad killed the raven. The Frost-Vault host did not see the march.",
      debriefRefuse: "The raven flew home with the squad's name. The host will be waiting."
    },
    hearthWight: {
      event: "The hall's fire burns cold, and a voice asks for an oath nobody owes.",
      accept: "An oath is spoken, and the fire warms. A priest will pay for the stone it leaves.",
      refuse: "The squad says nothing and leaves the hall. The voice follows to the door, and no further.",
      debriefAccept: "The squad answered the wight with an oath. The hall was left warm, and an oath-stone was taken.",
      debriefRefuse: "The squad left the cold hall unanswered. The fire did not rekindle."
    }
  });
})();


/* ============================================================================
   CAMPAIGN_LINES.lessons / coach / cast45 / founding45: F-45 teaching plan v2
   (audits/f45-teaching-plan.md, accepted whole by Patrick 2026-11-15). Data only.
   Written by the Campaign Planner; the Lead Programmer wires it (js/teach45.js).

   A lesson: {step, act, title, text[], after[], moved, goal, remind:{who,text}, legend, replaces[]}
     step     the step in the plan (S2, S16a...). Keys here are stable ids; steps may be renumbered.
     text     the card, at most three short lines. after: shown once the "do it" is done.
     moved    one extra line, shown only if a joining mate changed the number keys.
     goal     the gold line in the objective panel while the gate is open.
     remind   one spoken line after 20 seconds, or when the lesson was not used later.
     legend   the entry the key legend gains when the lesson is done.
     replaces the old one-line tips this lesson stands in for (do not fire both).
   Tokens: {key} {key2} {name} {leader} {race} {class} {spec} {ability} {a} {b} {n} {lesson} {building}.
   Rules: real names only (Soldier, Folk Hero, Scoundrel, Cleric, Mage, Witch); no nicknames,
   no role tags. Every sentence that states a rule is taken from the game's own SPECS,
   ABILITIES, EDGES and Manual text; Systems confirms before ship. No core rule is changed.
   ============================================================================ */
window.CAMPAIGN_LINES.lessons = {

  /* ---------------- Act I: The Road ---------------- */
  move: {step: "S2", act: 1, title: "Moving",
    text: ["WASD or the arrow keys walk me, and the view comes with me."],   /* ND 17 Nov: Shift runs only in camp (js/ui/guided-start.js 647); field movement reads no Shift (js/combat/deployment.js 198-212) */
    goal: "WALK TO THE GOLD RING",
    remind: {who: "cayde", text: "The road. East."},
    legend: "WASD move", replaces: ["firstMove", "move"]},

  fight: {step: "S3", act: 1, title: "Fighting",
    text: ["Left click one of them and I put an arrow in him. If he is close enough to touch, right click and I hit him instead.", "Hold the mouse button down and I keep at it. I do nothing until you tell me to."],
    after: ["I am a Folk Hero, which is a grand name for a hunter. I shoot fast and far, and I am no good up close.", "Keep me back and let them come to the arrows."],
    goal: "KILL THE SLAVER: LEFT CLICK HIM",
    remind: {who: "cayde", text: "He will not fall on his own. Left click him."},
    far: {who: "cayde", text: "Closer. He will not come to us."},   /* spoken if the click is out of range */
    legend: "Left click shoot · right click swing",
    replaces: ["firstEnemy", "outOfReach", "ranged"]},

  /* Q81 (audits/specs/q81-command-lesson.md, ND 18 Nov): at build, the Command card moves to the soldier step, after the mark fight
     and before Shield Bash. `command` is that card; `abilityFight` is the goal line of the ability step's plain fight (no card).
     At the same build, `ability` above and soldier.moved go (spec criterion 9). Command facts: abilities.js 81-83 (every squad
     unit, Cayde included, attacks again at once); no mark needed. `noHit`: Command pressed and Hal struck nothing (criterion 8). */
  command: {step: "S8", act: 1, title: "Abilities: Command",
    text: ["Each of us has one ability on a key, shown on the bar at the bottom. Mine is Command: I give the word, and the whole squad hits at once.", "Press it and every Squad Mate strikes right now, even if their swing was not ready. My next click shoots straight away, too.", "Wait until an enemy is touching Hal, then press {key}. He hits it at once."],
    after: ["The icon goes dark for 20 seconds while I get my breath back. When it is bright again, I can give the word again."],
    goal: "WHEN A SLAVER IS NEXT TO HAL, PRESS {key} FOR COMMAND",
    remind: {who: "cayde", text: "Hal can reach one. Now: {key}."},
    noHit: {who: "hal", text: "Nothing was in my reach, so the word was spent. When the icon is bright again, wait till one is close to me."},
    legend: "{key} Command", replaces: ["abilities"]},
  abilityFight: {goal: "KILL BOTH SLAVERS"},

  objective: {step: "S5", act: 1, title: "Your task",
    text: ["Our task is written top left, and the gold arrow points the way.", "Follow it to the first cage."],
    goal: "FOLLOW THE GOLD ARROW",
    remind: {who: "cayde", text: "The cages. Follow the arrow."}},

  wounds: {step: "S6", act: 1, title: "Wounds",
    text: ["That one cost me a Wound.", "Wounds are a Leader's life, and for now the Leader is me. At 0 I am down.", "They are the red marks on my card."],
    replaces: ["wound", "wounds"]},

  cage: {step: "S7", act: 1, title: "Cages",
    text: ["The guards are down. Stand inside the gold ring at the cage until it breaks.", "Step out and the green circle shrinks, slowly. Step back in and we finish it."],
    goal: "STAND IN THE GOLD RING AT THE CAGE",
    remind: {who: "cayde", text: "Closer. Inside the ring, and wait."},
    replaces: ["cage"]},

  /* Intro cards: shown with the portrait before the Specialty lesson. `said` is the person's own line. */
  halJoins: {step: "S8", act: 1, title: "Hal",
    said: {who: "hal", text: "Cayde. They told us you were dead with the rest. I have been in that cage since the Keep fell, and I am done sitting. Give me a shield and somewhere to stand, and I will hold it."},
    text: ["Hal joins the squad: a Human Freeman, a Soldier."]},

  /* F-33: the first fight with a Squad Mate. The gate passes on the first mark; the after lines show when the marked enemy dies. */
  mark: {step: "S8", act: 1, title: "The mark",
    said: {who: "hal", text: "On the mark."},
    text: ["I wait for your word, Cayde. Left click one and you shoot it, and that one is the mark. Your Squad Mates go for the mark whenever we can reach it, even with another one touching us.", "With no mark in reach, we fight only what is touching us, and leave the rest alone."],
    after: ["The mark ends when that one dies. Left click the next, and we go again."],
    goal: "MARK A SLAVER: LEFT CLICK HIM",
    remind: {who: "hal", text: "Which one? Left click him."},
    idle: "No mark",   /* the word over a Squad Mate who is waiting for a mark */
    legend: "Left click an enemy: mark it", replaces: ["mark33"]},

  /* F-33, outside the Founding: the first enemy of a chapter's first board contract, for a player who skipped
     the Founding or had Lessons off. One card, clicks and the mark together; not shown if lesson mark is done. */
  firstJob: {step: "board", act: 0, title: "Clicks and the mark",
    text: ["Left click an enemy and you shoot it. Right click one in reach and you swing.", "Your Squad Mates wait for a mark. Whoever you click is the mark, and they go for it.", "The mark ends when that one dies. Click the next."],
    after: ["A drill teaches a Squad Mate to attack without waiting for a mark. You buy drills in the {building}."],   /* {building}: the name of facility barracks in this holding */
    goal: "MARK AN ENEMY: CLICK IT",
    idle: "No mark",
    legend: "Left click shoot and mark · right click swing", replaces: ["mark33", "firstEnemy", "move"]},
  pinchJoins: {step: "S10", act: 1, title: "Pinch",
    said: {who: "pinch", text: "I am fine. I am extremely fine."},
    text: ["Pinch joins the squad: a Human Freeman, a Scoundrel.", "A third icon is on the bar."]},
  /* Shown as its own card with Hal's card outlined, after the ring lesson is passed (was ring.after). */
  condition: {step: "S9", act: 1, title: "Condition",
    text: ["Those marks on Hal's card are his Condition: his health.", "Squad Mates have Condition. Only a Leader has Wounds, like me."]},
  /* S14: Cayde hands over, as a card, before the `you` card. */
  handover: {step: "S14", act: 1, title: "Cayde goes ahead",
    said: {who: "cayde", text: "You are on your feet, so you can lead. I am going ahead to scout the slavers' camp. Bring Hal and Pinch along behind me, and when the camp is done, make for Varnholt, the town a day north. I will find you there. My Command goes with me. You will not have that order again until I am back."},
    text: ["Cayde has left the squad.", "Command has left the bar."]},

  soldier: {step: "S8", act: 1, title: "Soldier",
    text: ["Hal is a Soldier, and Soldiers fight at the front. His swing hits up to three of them in reach. We call that a Sweep.", "His ability is Shield Bash. He hits everyone close to him, throws them back and knocks them down.", "Wait until they are close to Hal, then press {key}."],
    goal: "USE SHIELD BASH: PRESS {key}",
    remind: {who: "hal", text: "They are close. Bash."},
    legend: "{key} Shield Bash"},

  ring: {step: "S9", act: 1, title: "The Command Radius",
    text: ["That dashed ring is my Command Radius.", "Squad Mates inside it fight as one squad and cover each other. Anyone outside it stands alone, and the enemy goes for them first.", "Hal follows me. Do not outrun him."],
    after: ["Those marks on Hal's card are his Condition: his health."],
    goal: "REACH THE SECOND CAGE WITH HAL INSIDE THE RING",
    remind: {who: "hal", text: "Slower. I am not inside the ring."},
    replaces: ["commandRadius", "squadstrip"]},

  scoundrel: {step: "S10", act: 1, title: "Scoundrel",
    text: ["Pinch is a Scoundrel. He cuts hardest when the man in front of him is busy fighting someone else. We call that the Soft Spot.", "He throws knives, too: that is his Called Shot. Press {key} and he throws at whoever is under your pointer. Aim at nobody and he picks the toughest one he can see."],
    goal: "USE CALLED SHOT ON THE SERGEANT: PRESS {key}",
    remind: {who: "pinch", text: "The big one. Say the word and I will put a knife in him."},
    legend: "{key} Called Shot"},

  trap: {step: "S11", act: 1, title: "Traps",   /* S6 2e (s6-11 section 7, ND 17 Nov); with "done" here, TRAP2E.W in js/combat/disarm.js is not used */
    text: ["I have seen a trap. Walk onto it and it bites: it hurts, and it holds you fast.", "Stand still with it inside your command ring, and I go and disarm it.", "If you move, I stop. Stand still again and I pick up where I left off."],
    goal: "STAND STILL: PINCH DISARMS THE TRAP",
    remind: {who: "pinch", text: "Hold still. I have got this one."},
    moved: {who: "pinch", text: "You moved. Stand still and let me work."},
    done: {who: "pinch", text: "Done. Clever, but not clever enough."},
    sprung: {who: "pinch", text: "That was the trap. It cost you a Wound. Next time, stand still and let me work."},
    sprungMate: {who: "pinch", text: "{mate} stepped on the trap before I got to it. Not your fault. It hurt, but the trap is used up now."},
    sprungPinch: {who: "pinch", text: "I stepped on the trap before I could disarm it. Not your fault. It hurt, but the trap is used up now."},
    legend: "Stand still: disarm a trap",
    replaces: ["trap", "hazard"]},

  you: {step: "S14", act: 1, title: "{name}, {race} {class} {spec}",
    text: ["That is you now, {leader}. Your ability is {ability}, on {key}.", "Pinch and I follow you."],
    goal: "USE {ability}: PRESS {key}",
    remind: {who: "hal", text: "Your call, {leader}. {key}."}},

  momentum: {step: "S15", act: 1, title: "Momentum",
    text: ["Every kill fills the bar at the top.", "When it is full, pick one of three cards with 7, 8 or 9. It lasts until this fight ends."],
    goal: "CHOOSE A CARD: 7, 8 OR 9",
    remind: {who: "hal", text: "The bar is full. Pick a card: 7, 8 or 9."},
    legend: "7 8 9 Momentum", replaces: ["momentum"]},

  commander: {step: "S16", act: 1, title: "Commanders",
    text: ["See the red arrow? That one is their commander.", "Kill him and the rest near him may lose their nerve and run.", "Point at him when I throw my Called Shot."],   /* ND 17 Nov: a pressed Called Shot aims at the foe under the pointer (js/combat/abilities-f33.js 148-154); left to itself it throws at the first foe in range (47) */
    goal: "KILL THE COMMANDER, THEN CLEAR THE CAMP",
    remind: {who: "pinch", text: "The one giving orders. Him first."}},

  /* ---------------- Act II: Varnholt ---------------- */
  camp: {step: "S17", act: 2, title: "Varnholt",
    text: ["This is our camp while we are in Varnholt. Every place in it does one job, and you reach each one from this card.", "Start at the Campfire. Anyone looking for work sits there."],
    goal: "CLICK THE CAMPFIRE",   /* ND 17 Nov (s6-15a section 7, UX ruling 9d84900): the hub is a card of buttons, not a camp to walk */
    remind: {who: "hal", text: "The fire, {leader}. That is where people are."}},

  hiring: {step: "S18", act: 2, title: "Hiring",
    text: ["People looking for work wait at the Campfire. Each card shows what that person can do. Condition is their health: how much they can take before they drop.", "The first one is free. We let them out of a cage this morning, so they owe us."],
    goal: "HIRE ONE PERSON",
    remind: {who: "hal", text: "We are three. Four would be better."}},

  cleric: {step: "S19", act: 2, title: "Cleric",
    text: ["{name} is a Cleric. Every 5 seconds or so, without being asked, she mends 1 Condition on the most hurt person near her. That is her Mending Prayer.", "Cure Wounds is the bigger heal, and she does it when you call for it. Her Magic is {n}. The higher that is, the more it heals.", "You can try it in the Drill Yard first, then come back here."]},

  bleeding: {step: "S20", act: 2, title: "Bleeding Out",
    text: ["Pinch is down at 0 Condition. We call that Bleeding Out.", "On a contract, the die is rolled for him every 10 seconds, and a 1, 2 or 3 kills him. Nobody dies in the Drill Yard, so here he only waits for you.", "Stand next to him and you stabilise him. On a real job, be quick about it."],
    goal: "STAND BY PINCH UNTIL HE IS STABILISED",
    remind: {who: "hal", text: "Nobody dies in this yard. Get over there."},
    replaces: ["matedown"]},

  cureWounds: {step: "S21", act: 2, title: "Cure Wounds",
    text: ["{name} can do Cure Wounds. Whoever needs it most gets Condition back, and anyone Bleeding Out comes first and gets up.", "Press {key} and she does it."],
    same: ["{name} is a Cleric, as you are, so she has Cure Wounds too, on her own key.", "Whoever needs it most gets Condition back, and anyone Bleeding Out comes first and gets up.", "Press {key} for hers."],   /* in place of text when the Leader is a Cleric too */
    goal: "USE CURE WOUNDS: PRESS {key}",
    remind: {who: "maud", text: "He is down, {leader}. Let me work. {key}."},
    legend: "{key} Cure Wounds"},

  shieldWall: {step: "S22", act: 2, title: "Shield Wall",
    text: ["Press {kWall} once and we lock shields. You do not have to hold it.", "Arrows hit us less often and the Shield Pool fills back up, but most of us stop swinging while the wall is up.", "Here in the yard I drop it myself. On a job, press {kWall} again to drop it and get everyone swinging again."],
    goal: "PRESS {kWall}: KEEP THE WALL UP 3 SECONDS",   /* SPACE toggles (js/ui/screens.js 506-509); gate 180 frames (js/tutorial/act2.js 27, 256). ND 17 Nov; line 3 G1 22 Nov: the yard drops the wall itself */
    remind: {who: "hal", text: "Shields. {kWall}, once."},
    legend: "{kWall} Shield Wall"},

  gear: {step: "S23", act: 2, title: "Gear",
    text: ["Every card from the quartermaster is a piece of kit.", "Press EQUIP and put the cards on the squad. Kit on a shelf saves nobody."],
    goal: "EQUIP BOTH CARDS",
    remind: {who: "hal", text: "The brigandine goes on a body, {leader}, not on a shelf."},
    replaces: ["armoury"]},

  armour: {step: "S23", act: 2, title: "Armour (AC)",
    text: ["AC is armour: how hard you are to hit. An attacker has to roll over it, so every point counts.", "That brigandine took {name} from AC {a} to {b}. Worth every coin."]},

  treasury: {step: "S24", act: 2, title: "The Treasury",
    text: ["This is the company's gold. Any coin you pick up in a fight comes home with you.", "Gold hires people and buys gear. The next hire costs {price}, so spend it as if it was hard to come by. It was."]},

  escort: {step: "S26", act: 2, title: "Escort",
    text: ["Every job has a fight in it. Some have a second task on top, and this is one: the cart.", "Stay near it on the road. If it is destroyed, the job fails, and nobody pays for a broken cart."],
    goal: "BRING THE CART TO THE GATE",
    remind: {who: "hal", text: "The cart, {leader}. We are paid for the cart."},
    replaces: ["escort"]},

  cover: {step: "S27", act: 2, title: "Cover",
    text: ["Trees and rubble slow you down, but they keep arrows off you. A stone wall stops everything.", "Long shots, near the end of your reach, miss more often: that is the LONG RANGE -1 you will see. Stand off, but not too far."]},

  charge: {step: "S27", act: 2, title: "Charge",
    text: ["See an enemy a fair way off? Right click them and you Charge: a straight run across open ground.", "Your first blow lands one step better. Touch any movement key and the Charge stops."],
    legend: "Right click far: Charge",
    replaces: ["charge"]},

  chest: {step: "S27", act: 2, title: "Chests",
    text: ["A chest. Walk onto it and it opens.", "There is coin in them, and kit for the fight we are in. Use it."],
    goal: "OPEN THE CHEST",
    replaces: ["chest"]},

  blip: {step: "S27", act: 2, title: "Blips",
    text: ["That grey mark is something we cannot see yet. Get close and it shows itself: an enemy, or nothing at all."]},

  rest: {step: "S29", act: 2, title: "Rest",
    text: ["{name} took a beating out there.", "The hurt rest and sit out the next job. They come back whole, and that is cheaper than a grave."],
    replaces: ["hurtMate"]},

  advancement: {step: "S29", act: 2, title: "Advancement",
    text: ["Everyone who came home learned something.", "After each contract, two Squad Mates get one Advancement each: +1 Condition, +1 Melee, +1 Ranged, or a new Talent. Pick two people."],
    after: ["And you mark one tick, Leader. Three ticks make a Level."],
    goal: "GIVE TWO ADVANCEMENTS",
    remind: {who: "hal", text: "Two of us learned something out there. Tell us what."},
    replaces: ["levelUp", "levelup"]},   /* ND 17 Nov: "TAB the squad" legend dropped; Advancements are clicked on the report screen */

  warCouncil: {step: "S30", act: 2, title: "The War Council",
    text: ["Before any job, you haggle. Your die is rolled against the patron's Resistance.", "Win, and we get one Contract Edge: better pay, a map of the ground, medicine, or a hidden way in. Pick one."],
    goal: "CHOOSE A CONTRACT EDGE"},

  luck: {step: "S31", act: 2, title: "Luck",
    text: ["Press {kLuck} to spend 1 Luck, and every die the squad rolls is one better for 4 seconds."],
    after: ["Press {kBurn} and you burn 1 Luck for good, for 6 seconds of perfect dice.", "Save that for the day everything has gone wrong."],
    goal: "SPEND 1 LUCK: PRESS {kLuck}",
    remind: {who: "pinch", text: "Now would be a fine time to be lucky. {kLuck}."},
    legend: "{kLuck} Luck", replaces: ["luck"]},

  standing: {step: "S31a", act: 2, title: "Standing",
    text: ["Every faction keeps a tally on us, from -3 to +3. That is our Standing with them.", "Finish their work and it goes up. Walk off a job, or kill their commanders, and it goes down.", "At +2 they call us Allied. At -2 they stop offering us work."],
    replaces: ["board"]},

  bonds: {step: "S33", act: 2, title: "Comrade Bonds",
    text: ["You and {name} keep coming home together. That makes you bonded.", "Side by side, each of you fights one step better. In the next fight, watch for the gold thread between you."]},

  price: {step: "S34", act: 2, title: "A job has a price",
    text: ["Every job has a price, and it is not always gold.", "Freeing the captives pays in trust, not gear. Raiding the supply camp pays in gear, and costs trust.", "Read the Standing line before you take one."],
    replaces: ["sunStanding"]},

  /* F-33: the drill (in Varnholt, Hal's Drill Yard; in the player's own camp, the building {building}), taught as an upgrade once the mark has been used on two contracts (b7). {n} is F33.K.drillCost. */
  drill: {step: "S34", act: 2, title: "Drills",
    said: {who: "hal", text: "You point, we hit. It works. It is also slow. Give me a morning in the yard."},
    /* Q16 (2026-11-16, K13): the Leader is never drilled and always needs the click; say so here and in the Barracks.
       Q17 (2026-11-16): Fire at will is weapons only; the left click sets one shared target; back to the nearest when it dies. */
    text: ["A drilled Squad Mate fights without waiting for your mark. Cut them down, and they swing at the nearest foe in reach. Fire at will, and they shoot the nearest one with their weapon.", "Click a target and every drilled mate goes for it. When it dies, they go back to the nearest. Spells and abilities still wait for your key.", "A drill costs {n} gp here, and that mate sits out the next contract. Today's drill is free, and nobody sits out. In your own camp, you buy drills in the Barracks & Drill Yard."],
    after: ["One drill is for one Squad Mate. You are never drilled, {leader}: you attack only when you click.", "And a drill is not an Advancement. It does not count toward the cap."],
    goal: "DRILL ONE SQUAD MATE",
    remind: {who: "hal", text: "Pick one of us, {leader}. Swords or bows."},
    legend: "Drill Yard: drills"},

  /* ---------------- Act III: The Gate ---------------- */
  /* F-33: books and loadouts, when the first library opens (b9, the day between the walls).
     {name} is the building, {n} the Research price (PROG.K.research.L1), {ability} the entry researched.
     PROG-1 words (16 Nov): Research once for the chapter, not Copy into one book; spare slots by tier. Not wired yet. */
  books: {step: "S36a", act: 3, title: "Books",
    text: ["The {name} keeps a library.", "Research an entry once, for {n} gp, and the whole Chapter has it. Anyone of that Specialty who meets its gate can slot it.", "Pick one and research it."],
    goal: "RESEARCH ONE ENTRY",
    remind: {who: "hal", text: "There is a shelf of manuals in there, {leader}. One of them is worth the gold."},
    replaces: ["book"]},

  loadout: {step: "S36a", act: 3, title: "Loadouts",
    text: ["Everyone carries one ability on a key: {kLeader} for you, and 1 to 5 for your Squad Mates, in marching order.", "A spare slot holds one more, and it fires on its own: a Quick entry at full speed, a Battle entry half again as slowly. A Prepared entry goes in the Prep slot instead, and is cast once as the fight starts.", "Put {ability} on the key."],
    after: ["Fighters gain a spare slot at 2 and at 4 Advancements. Casters gain one for each point of Magic above 1.", "Whatever is on the keys when you sign is what you fight with."],
    goal: "PUT {ability} ON THE KEY",
    remind: {who: "pinch", text: "A book on a shelf never hit anybody. Put it on the key."},
    legend: "{kLeader} you · 1 to 5 mates"},

  prepare: {step: "S35", act: 3, title: "Prepare",
    text: ["They are coming to us this time.", "Before the fight there is PREPARE: our time to choose where to stand. They have to break the gate to win, so we stand behind it."],
    replaces: ["defenceStart", "gate"]},

  /* Act III item 8 (plan R5): one card in the b8 Prepare round, after `prepare`. Done when a trap is set; ENTER also ends it. */
  caltrop: {step: "S35", act: 3, title: "Traps of your own",
    text: ["We have traps of our own to set before they come.", "Stand where they will walk and press {kTrap} to set a caltrop. {kTrapNext} picks another kind.", "Anything that walks over one is slowed and hurt. Put one in front of the gate."],
    goal: "SET ONE CALTROP",
    remind: {who: "pinch", text: "Caltrops, {leader}. In front of the gate, where they have to walk."},
    after: ["One is enough to learn it. Set the rest where you like, or press {kStart} to start the fight."]},

  wall: {step: "S36", act: 3, title: "The wall",
    text: ["Varnholt's militia hold the wall and shoot for us.", "Lose one and they are gone for good. Kill anyone who climbs up after them."],
    replaces: ["wallArchers"]},

  ram: {step: "S36", act: 3, title: "The ram",
    text: ["A ram. Left alone, it breaks the gate.", "Kill the crew before it gets there."],
    replaces: ["ram"]},

  ladders: {step: "S36", act: 3, title: "Ladders",
    text: ["Ladders. Every one of them puts the host's men on our wall.", "The red marks show where. Meet them at the top."],
    replaces: ["ladders"]},

  fallBack: {step: "S37", act: 3, title: "Fall back",
    text: ["The gate is gone. That is not the end of it.", "Back to the Keep, and hold the Keep Gate."],
    goal: "FALL BACK TO THE KEEP",
    remind: {who: "hal", text: "The Keep, {leader}. This line is finished."},
    replaces: ["gateFalls", "keepFight"]},

  withdraw: {step: "S38", act: 3, title: "Withdrawing",
    text: ["Some fights cannot be won, and this is one. The sally gate is behind the Keep, under a green banner. Get our people to it.", "On any contract you can also pull out from the pause menu ({kPause}).", "We keep our people and lose most of the pay. Alive and poor beats rich and dead."],
    goal: "LEAVE BY THE SALLY GATE · {DIR}",
    remind: {who: "hal", text: "The town is lost. The sally gate, {dir}. Now."},
    legend: "{kPause} pause, withdraw", replaces: ["sallyGate"]},

  /* ---------------- Act IV: The Long Road ---------------- */
  column: {step: "S40", act: 4, title: "The column",
    text: ["We are guarding people now: {families} families. Supply is what they eat, and it goes down every day.", "Column Strength is the families still walking. Get to the Empire's lands with both above nothing, and we have done the job."],
    replaces: ["longRoad", "columnStrength"]},

  day: {step: "S41", act: 4, title: "The day",
    text: ["Each day we have time for three things.", "This one is yours to choose: Forage for Supply, or Scout and learn what is coming tonight.", "The dice show how it went."],
    goal: "CHOOSE: FORAGE OR SCOUT"},

  night: {step: "S41", act: 4, title: "The night",
    text: ["At night the host's riders come for the column.", "Every one that reaches it costs us Column Strength. Hold until dawn: the clock is top left."]},

  death: {step: "S42", act: 4, title: "The dead",
    text: ["{name} is dead.", "The dead do not come back. The name goes in the Chronicle, so it is not forgotten.", "It is hard, but the column still needs a full squad. Find someone on the road to fill the place."],
    replaces: ["leaderdown"]},

  bands: {step: "S43", act: 4, title: "Allied bands",
    text: ["Other companies will march with us if you can talk them into it.", "A roll decides whether they listen. They stay three nights and take a quarter of the gold, and we keep the gear."],
    replaces: ["parleyOffer", "bandHire", "bandShare", "ally"]},

  parlay: {step: "S44", act: 4, title: "Parley",
    text: ["A hurt commander may ask to talk.", "Demand Surrender, and your Personality die goes against their Morale die. Win, and they lay down their arms.", "Let Them Withdraw, and the commander walks off alive. Fight On, and there is no talk."],
    goal: "CHOOSE AN ANSWER",
    replaces: ["whiteFlag", "parleyDemand"]},

  prisoners: {step: "S45", act: 4, title: "Prisoners",
    text: ["A prisoner can be ransomed for gold, questioned for what they know, offered a place, or let go.", "They stay under guard until you choose."],   /* P23-VOICE: unchanged, the words match */
    replaces: ["prisoner"]},

  mage: {step: "S46", act: 4, title: "Mage",
    text: ["I am a Mage. Every 4 seconds I throw one dart for each point of Magic I have, and my darts do not miss. That is Magic Missile.", "My ability is Burning Hands: a fan of fire toward your pointer, and it burns everyone in it.", "Point me at a group that is close, and press {key}."],
    goal: "USE BURNING HANDS: PRESS {key}",
    remind: {who: "mage", text: "Point me at them. {key}."},
    legend: "{key} Burning Hands"},

  spells: {step: "S46", act: 4, title: "Spells",
    text: ["Our casters carry spells.", "{name}'s card lists the spells ready for tonight. There is nothing to choose on the road. Back in camp, the library has more to learn."],
    replaces: ["book"]},

  detachment: {step: "S47", act: 4, title: "Detachments",
    text: ["You cannot be in two places at once.", "Send a band to do a second job. A detachment fights on its own, and you see the odds first.", "Lend them your cards if you like. They come back to the wagon when the band goes."],
    replaces: ["detachment", "bandEquip"]},

  witch: {step: "S48", act: 4, title: "Witch",
    text: ["I am a Witch. Every 4 seconds or so I hex one of them: poisoned, slowed and weakened. That is my Withering Hex, and a Scoundrel's Soft Spot bites harder on anyone I have hexed.", "My ability is Dark Illusion. For 6 seconds, every attack on the squad is one step worse.", "Press {key} when they are on us."],
    goal: "USE DARK ILLUSION: PRESS {key}",
    remind: {who: "wenna", text: "They can see us far too well. {key}."},
    legend: "{key} Dark Illusion"},

  officers: {step: "S49", act: 4, title: "Officers",
    text: ["A squad needs a second.", "A Squad Mate with two Advancements can be made an officer at the Command Tent. An officer can lead a detachment without you."]},

  /* ---------------- Act V: The Founding, and the hand-over ---------------- */
  chapter: {step: "S53", act: 5, title: "The Chapter",
    text: ["A Chapter is a company: its people, its home, its gold and its name.", "From here on, this one is yours."],
    replaces: ["kalloonEnd"]},

  holding: {step: "S54", act: 5, title: "Holding",
    text: ["The holding is where the Chapter lives, and each one starts with different buildings.", "Every holding has a planning table, a quartermaster, a fire and a graveyard, under its own names. Its card lists what else is already standing.", "The Frontier Timber Fort is the plain choice, if you want one."]},

  ambition: {step: "S54", act: 5, title: "Ambition",
    text: ["Every Chapter needs to know what it is for: Wealth, Fame, Liberation or Dominion.", "Each has ten milestones, with a reward at the third, the sixth and the ninth."]},

  chair: {step: "S55", act: 5, title: "Chapter Master and Squad Leader",
    text: ["The Squad Leader marches and fights.", "The Chapter Master stays home, keeps the books and does the haggling at the War Council.", "I will sit in the chair until you choose someone."]},

  building: {step: "S56", act: 5, title: "Building",
    text: ["Empty plots can be built on.", "Every building gives the Chapter something: a healer, a forge, a drill yard. Build one now."],
    goal: "BUILD ONE BUILDING"},

  campStaff: {step: "S56", act: 5, title: "Camp staff",
    text: ["Not everyone fights.", "An Edelōs Trader, a Chapter Scribe or a Camp Bard works in camp and never marches."]},

  elevation: {step: "S56", act: 5, title: "Elevation",
    text: ["When you are ready, put someone else in my chair.", "That is done in the Command Tent."]},

  tithe: {step: "S57", act: 5, title: "The tithe",
    text: ["A share of every contract goes up to the Masters of the Dust Cloaks."]},

  upkeep: {step: "S57", act: 5, title: "Upkeep",
    text: ["A standing company costs gold after every job, fight or no fight. This line is what it costs us. Watch it."]},

  seasons: {step: "S57", act: 5, title: "Seasons",
    text: ["Every season changes one rule in the field.", "You will find it written at the start of the fight."]}
};

/* Coach marks: one outlined thing at a time on a menu screen, NEXT on each. */
window.CAMPAIGN_LINES.coach = {
  /* S12: the stat block, before any choice. The example sheet is a Human Freeman Soldier. */
  statBlock: [
    {stat: "con",   title: "Condition",   text: "Condition is health. Every Squad Mate has it, and at 0 they are Bleeding Out."},
    {stat: "wounds",title: "Wounds",      text: "Only a Leader has Wounds, and the squad's hits come off yours before anyone's Condition. At 0, you are down."},
    {stat: "luck",  title: "Luck",        text: "Luck is spent in a fight to push the dice your way. You will use it later."},
    {stat: "move",  title: "Move",        text: "Move is how fast you walk. A Dwarf falls behind an Elf."},
    {stat: "m",     title: "Melee",       text: "Melee is the die you roll with a sword or a spear. 0 is poor and 6 is the best. Higher hits more often."},
    {stat: "r",     title: "Ranged",      text: "Ranged is the die for a bow or a thrown weapon."},
    {stat: "mg",    title: "Magic",       text: "Magic is the die for spells and prayers. Soldiers, Folk Heroes and Scoundrels have none. Neither do I."},
    {stat: "per",   title: "Personality", text: "Personality is the die for talking: demanding a surrender, or talking your way out of a fight."},
    {stat: null,    title: "Steps",       text: "When anything says +1 step, one of these dice is one better for that roll."}
  ],
  statCheck: {ask: "Before you take her on, check she can stand a fight. Click her Condition: the number that is her health.", right: "con", wrong: "Not that one. Click her Condition: the number that is her health."},

  /* S13: one card at the top of each step of the Leader screen. */
  leader: {
    /* S6 2c (s6-12, Narrative Designer's words): the card that opens when the last cage breaks, before the Creator */
    intro: {title: "The last cage", said: "",   /* P23-VOICE F05: cut; Cayde's box holds all of it (text) */
      text: ["One more of ours from the Keep, taken alive like Hal and Pinch. I know the face. The name will come back to me.", "I need to get ahead and see how big the slavers' camp is. Hal and Pinch need someone to follow while I am gone, and that someone is you.", "From here on, you lead, not me. So remind me who you are: how you fight, where you come from, and what we call you."],
      button: "MAKE YOUR LEADER"},
    title: "Who steps out of the last cage?",
    sign: "DONE: OPEN THE CAGE",
    nameLabel: "Your name",
    /* S6 2a/2b (s6-3 section 7, Narrative Designer's words; [T] where marked): read by js/ui/creator.js */
    chosen: "CHOSEN",
    flavour: {
      SOLDIER: "Sellswords, militia and old legion hands. They stand at the front and hold the line when it bends.",
      FOLK_HERO: "Hunters and village champions, who learned the bow keeping wolves off their own.",
      SCOUNDREL: "Cutpurses, smugglers and spies. They strike where armour is thin and spot traps first.",
      CLERIC: "Sworn to a god and sent where the dying are. Their prayers close wounds and keep the line standing.",
      MAGE: "Schooled by the Arcana Guild, or thrown out of it. Years of study for a handful of spells that end fights.",
      WITCH: "Hedge-wise and half-feared. Their hexes sicken, slow and weaken the foe."
    },
    ask: {spec: "How did you fight, at Grey Keep?", cls: "Before Grey Keep, where were you born?", race: "Who are your people?", pick: "What do you do better than anyone?", name: "Last thing. What do we call you?"},
    stepName: {spec: "Specialty", cls: "Social Class", race: "Race", pick: "Talent", name: "Your name"},
    next: {cls: "NEXT: SOCIAL CLASS", race: "NEXT: RACE", pick: "NEXT: TALENT", name: "NEXT: NAME"},
    why: {spec: "Choose a Specialty first.", cls: "Choose a Social Class first.", race: "Choose a Race first.", pick: "Choose a Talent first.", name: "Write a name first."},
    surprise: "Picks a Specialty, Social Class and Race at random. You can change any of them.",
    last: "Last chance to change anything: click a step above to go back. After this, your Leader is fixed.",   /* criterion 19, Narrative Designer (s6-3 section 7) */
    classLine: {
      FREEMAN: "+1 Condition. The plain choice: the other cards compare with this one.",
      DEVOUT: "+1 Magic. Only a Cleric, Mage or Witch uses Magic.",
      EDELOS: "+1 Luck. Luck is spent in a fight to better a roll.",
      NOBLE: "+1 Condition. While a Noble leads, hiring costs 20 gp, not 30.",
      OUTCAST: "+1 Ranged for a Folk Hero; +1 Melee for any other Specialty.",
      SLAVE: "+2 Luck, spent in a fight to better a roll."   /* ND 17 Nov: the catch line (CAMPAIGN_LINES.catches.card.SLAVE) now names Scars of Servitude and its -1 Condition */
    },
    talentLine: {
      "Vanguard": "+1 to hit in melee.",
      "Armour Break": "A hit that beats the armour also cracks it: the target's armour is 1 lower for the rest of the contract.",
      "Bleeding Wound": "A hit that beats the armour makes the target bleed: 1 damage a second.",
      "Taunt": "Enemies near a Soldier go for the Soldier.",
      "Shield Wall Mastery": "In the Shield Wall (SPACE: the squad locks shields), Soldiers keep fighting and the squad gets a Ward Token every 4 seconds. A Ward Token soaks one hit.",
      "Scout": "The squad moves faster, sees further, and is not slowed by forest or rubble.",
      "Rallying Cry": "Every 28 seconds the squad gets 2 Ward Tokens. A Ward Token soaks one hit.",
      "Get Back in the Fight": "Reach a downed Squad Mate and they stand up at once, with 1 Condition.",
      "Sharpen the Soft Spot": "When a Scoundrel's hit beats the armour, it deals 1 more damage.",
      "Poisoned Edge": "When a Scoundrel's hit beats the armour, the target attacks worse and slows.",
      "Highlight Weakness": "When a Scoundrel's hit beats the armour, everyone hits that target harder for 3 seconds.",
      "Cut Purse": "Coin drops a little more often.",
      "Litany of the Shield": "The squad gets a Ward Token every 9 seconds. A Ward Token soaks one hit.",
      "Warden of the Line": "Makes the Shield Wall (SPACE: the squad locks shields) stronger against shots.",
      "Field Chaplain": "When the squad must hold or run, it rolls twice and keeps the better.",
      "Warded Robes": "One Ward Token at the start and one every 20 seconds. A Ward Token soaks one hit.",
      "Arcane Precision": "+1 to hit with spells.",
      "Grimoire Margin": "Every Mage fires one more dart each time they cast.",
      "Thorn-Wise": "Briar Thicket grows behind the Leader, and its thorns bite harder.",
      "Lingering Hex": "Withering Hex lasts twice as long.",
      "Evil Eye": "Enemies lose their nerve sooner, and run more often."
    },
    specialty: {title: "Specialty", text: ["A Specialty is what a person does in a fight.", "You have seen three: Folk Hero (Cayde), Soldier (Hal), Scoundrel (Pinch). The other three use Magic: the Cleric heals, the Mage strikes from range, the Witch weakens the enemy.", "Each card shows its passive and its ability. Your squad already has a Soldier and a Scoundrel."]},
    cls:       {title: "Social Class", text: ["Where they were born.", "Each Class gives one bonus. Green and red numbers compare it with a Freeman."]},
    race:      {title: "Race", text: ["Their people. The chips show how each differs from a Human, in the stats you just read.", "Green is better, red is worse. Each race also has one Talent, written under its name."]},
    ability:   {title: "Your first Talent", text: ["Choose one. It is always on.", "A Solid Hit is an attack that beats the target's armour. A Ward Token soaks one hit for the squad. Morale is the enemy's nerve: fail it and they run."]},
    /* ready-made Leaders: the same lines as today without the nicknames */
    ready: {
      soldier:  "Stands in front and does not move. Soaks the hits so the rest of the squad can work.",
      folkHero: "Shoots from behind the line and keeps the squad's nerve up.",
      cleric:   "Shields the line and mends the wounded."
    }
  },

  /* S25: the contract card on the War Table. */
  warTable: [
    {part: "kind",   text: "Kind: what you must do."},
    {part: "enemy",  text: "Against: who you will fight."},
    {part: "pay",    text: "Pay: gold if you finish."},
    {part: "patron", text: "Patron: who is paying. Finishing raises your Standing with them."},
    {part: "squad",  text: "Choose who marches. Then SIGN."}
  ],
  noShield: "{name} has no shield. Equip the squad before you sign.",

  /* S44: the Parley screen, first time. */
  parlay: [
    {part: "demand",   text: "Demand Surrender: your Personality die against their Morale die."},
    {part: "withdraw", text: "Let Them Withdraw: the fight ends here. They live, and remember."},
    {part: "fight",    text: "Fight On: no talk. The fight goes on."}
  ],

  /* S47: the detachment panel. */
  detachment: [{part: "odds", text: "The odds for the band alone. Read them before you send it."}]
};

/* New named people (Q1 and Q2, Patrick 2026-11-15). Names are drafts for Narrative and the Loremaster. */
window.CAMPAIGN_LINES.cast45 = {
  maud: {
    name: "Sister Maud", full: "Sister Maud Ferrow", race: "HUMAN", cls: "DEVOUT", spec: "CLERIC",
    role: "Cleric", joins: "S19 (Varnholt, the free hire)",
    card: "Sister Maud Ferrow. Human Devout Cleric.",
    about: "Kept the infirmary at Grey Keep. Walked out of the second wagon with nine others and has not sat down since.",
    intro: ["You opened the cage. I can keep your people on their feet. That seems a fair trade.", "I do not carry a sword. Do not ask."],
    heal: ["Hold still.", "Up. You are not done."],
    down: ["Somebody see to me, for once."],
    gate: ["Shields first, prayers after."]
  },
  wenna: {
    name: "Wenna", full: "Wenna Thorne", race: "HUMAN", cls: "OUTCAST", spec: "WITCH",
    role: "Witch", joins: "S48 (the Long Road, Night 7)",
    card: "Wenna Thorne. Human Outcast Witch.",
    about: "Walked with the Rowan Watch because nobody else would have her. Asks to walk with the squad instead.",
    intro: ["The Rowan Watch feed me and will not stand near me. You look less particular.", "I make them slow and sick and frightened. You do the rest."],
    hex: ["That one. He will not enjoy the next minute."],
    illusion: ["Look somewhere else, all of you."],
    down: ["Well. That is unfortunate."]
  }
};

/* Cards, debriefs and spoken lines the plan adds or rewrites. */
window.CAMPAIGN_LINES.founding45 = {
  acts: ["The Road", "Varnholt", "The Gate", "The Long Road", "The Founding"],
  s1: {caption: "",   /* P23-VOICE F01: cut; year 616 goes */
       cayde: ["Grey Keep has fallen. The Empire paid the Grey Cloaks to hold it, and the Dark Elves came north out of the forest with more than we could ever hold. I was on the far side of the forest when the walls went.", "A Dark Elf host keeps slavers at its back. After a battle they chain whoever is left alive and march them off to work. Some of my people are in their cages, on this road.", "We are getting them back."], button: "MARCH"},
  s12: {cayde: ["One more of ours from the Keep, taken alive like Hal and Pinch. I know the face. The name will come back to me."]},
  s14: {cayde: ["You are on your feet, so you can lead. I am going ahead to scout the slavers' camp. Bring Hal and Pinch along behind me, and when the camp is done, make for Varnholt, the town a day north. I will find you there.", "My Command goes with me. You will not have that order again until I am back."]},
  debrief: {
    wonHead: "The road is quiet", lostHead: "The slavers held the road",
    won: "The camp is yours. Varnholt is a day north, and Cayde said he would find you there.",
    lost: "Cayde pulls you back into the trees.",
    again: "The camp is still there. Go again.",
    road: "THE NORTH ROAD", bolt: "A CROSSBOW BOLT", moved: "{ability} is now on {key}.",
    retry: "Try again: {lesson}.",
    retryFight: "Left click an enemy to shoot.",   /* in place of retry when the loss came at lesson fight */
    retryMark: "Click an enemy to mark it. Your Squad Mates attack the mark.",   /* when the loss came with no mark made */
    drillHint: "Tired of pointing? A drill in the {building} teaches a Squad Mate to attack on their own: {n} gp, and they sit out one contract. Your Leader still attacks only when you click.",
    drillHintNone: "Tired of pointing? Build the {building}. A drill there teaches a Squad Mate to attack on their own. Your Leader still attacks only when you click.",   /* the same report when the building is not built */   /* first report outside the Founding with an undrilled mate */
    used: "You used: {n}.",
    unhurt: "unhurt", hurt: "hurt: rests one job",
    button: "NEXT"
  },
  s39: {caption: "Varnholt burns behind you. Six companies and the refugees from Tarim are on the east road with what is left of the town. So are you."},
  s53: {cayde: ["Artemis's lands will give us a wall to sleep behind.", "A company with a wall needs a name."]},
  s57: {cayde: ["That is everything I know.", "The rest is in the Chronicle, under Field Notes. The table is yours."]},
  /* F-33 words for lines that live in index.html, js/ux.js and js/drills33.js (the LP applies them). */
  /* Q16 and Q17 (2026-11-16): words for js/drills33.js F.DRILLS (does, desc), the Barracks drill rows, and the b7 level
     card in js/campaign34.js (STEP3.level, the "Cayde pays for one drill" note). {leader}: the Leader's name. */
  drills: {
    cut: {does: "swings on their own", desc: "Swings at the nearest foe in reach, without being told."},
    fire: {does: "shoots on their own", desc: "Shoots the nearest foe with their weapon. Your left click gives every drilled mate the same target; when it dies, they go back to the nearest. Weapons only: spells and abilities still wait for your key."},
    barracks: "Drills are for Squad Mates. Your Leader is never drilled, and attacks only when you click.",
    levelHead: "A free drill from Cayde: choose a Squad Mate and a drill",   // b7 Choices heading (U-slice 5)
    levelTip: "A Squad Mate with a drill attacks on their own. {leader} still attacks only when you click. Paid drills keep the mate out of one contract; this free one does not.",   // b7 second tip
    levelDone: "{mate} has the drill {drill}: {desc} {leader} still attacks only when you click."
  },
  controls: {
    hint: "WASD move · left click shoot · right click swing",
    manual: "Controls. WASD or the arrows move the Leader; Shift runs. Left click shoots; right click or X swings; right click a far enemy to Charge it. A click on an enemy also marks it: Squad Mates who are not drilled attack only the mark. E is the Leader's ability, 1 to 5 the Squad Mates'. SPACE Shield Wall, Q and R Luck, 7 8 9 Momentum (TAB hides or shows the cards), M the map, ESC pause.",
    day2: "WASD moves. Left click shoots, right click swings, and your Squad Mates attack the enemy you click.",
    undrilled: "Not drilled. Attacks only what you mark. The mark ends when the enemy dies.",
    /* K15: "Barracks" meant two things. One name each, everywhere:
       the camp bar word that opens the list of people is Roster (it was Barracks); key list "R Roster";
       the building keeps its name (Barracks & Drill Yard, or the holding's own name for it) and is always
       named in full, as {building}; no line says "the Barracks" alone;
       Q is the Armoury on the bar and in the key list (not "quartermaster"). */
    barNames: {q: "Armoury", r: "Roster"},
    scroll: "You find a scroll: {ability}. Research it at the {building} to add it to the chapter library.",   /* PROG-1: {building} is the Specialty building that scribes it (books.js 236 still hard-codes the old line) */
    scrollCard: "A rare spell or drill for the chapter library. Research it at the {building}.",   /* PROG-1: books.js 455 still hard-codes the old line */
    undrilledCard: "Not drilled. Attacks only what you mark. Drills are bought in the {building}."   /* K16: on every mate card */
  },
  /* Kalloon card: one line for each lesson never used without help. {lesson} is its title. */
  unproved: {
    shieldWall: "You never did learn to lock shields. Hal will remind you.",
    bleeding:   "You were slow to the fallen. Sister Maud will remind you.",
    luck:       "You never once trusted your luck. Pinch will remind you.",
    momentum:   "You let the bar fill and did nothing with it. Hal will remind you.",
    ring:       "You outran your own people. Hal will remind you.",
    other:      "{lesson}: you never used it unasked. It is in Field Notes."
  },
  settings: {label: "Lessons", on: "on", off: "off", note: "Lesson cards in the Founding. Turn off for a second run."},
  fieldNotes: {intro: "Every lesson you have had, kept in order. A tick means you have used it without being asked.",
               empty: "Nothing here yet. Lessons appear as the Founding teaches them.", seen: "Learned {n} of {total}."}
};

/* Coach-mark sets and the Leader-screen cards in the shape T45.text reads (js/teach45.js):
   an array of {title, text[], mark} under lessons[id] for T45.coach(id, marks); a plain
   lesson for each step of the Leader screen (S13). CAMPAIGN_LINES.coach above keeps the
   same words with their part names, for screens that want them by part. */
window.CAMPAIGN_LINES.lessons.statBlock = [
  {mark: "con",    title: "Condition",   text: ["Condition is health. Every Squad Mate has it.", "At 0 a mate is Bleeding Out."]},
  {mark: "wounds", title: "Wounds",      text: ["Only a Leader has Wounds.", "The squad's hits come to the Leader's Wounds before anyone's Condition. At 0 the Leader is down."]},
  {mark: "luck",   title: "Luck",        text: ["Luck is spent in a fight to push the dice your way.", "You will use it later."]},
  {mark: "move",   title: "Move",        text: ["Move is walking speed.", "A Dwarf falls behind an Elf."]},
  {mark: "m",      title: "Melee",       text: ["Melee is the die rolled for a sword or a spear.", "0 is poor, 6 is the best. Higher hits more often."]},
  {mark: "r",      title: "Ranged",      text: ["Ranged is the die rolled for a bow or a thrown weapon."]},
  {mark: "mg",     title: "Magic",       text: ["Magic is the die for spells and prayers.", "Soldiers, Folk Heroes and Scoundrels have none."]},
  {mark: "per",    title: "Personality", text: ["Personality is the die for talking: demanding a surrender, getting out of a fight."]},
  {mark: "sheet",  title: "Steps",       text: ["'+1 step' anywhere in the game means one of these dice is one better for that roll."]}
];
window.CAMPAIGN_LINES.lessons.specialty   = {step: "S13", act: 1, title: "Specialty",
  text: ["A Specialty is what a person does in a fight.", "You have seen three: Folk Hero (Cayde), Soldier (Hal), Scoundrel (Pinch). The other three use Magic: the Cleric heals, the Mage strikes from range, the Witch weakens the enemy.", "Each card shows its passive and its ability. Your squad already has a Soldier and a Scoundrel."]};
window.CAMPAIGN_LINES.lessons.socialClass = {step: "S13", act: 1, title: "Social Class",
  text: ["Where they were born.", "Each Class gives one bonus. Green and red numbers compare it with a Freeman."]};
window.CAMPAIGN_LINES.lessons.race        = {step: "S13", act: 1, title: "Race",
  text: ["Their people. The chips show how each differs from a Human, in the stats you just read.", "Green is better, red is worse.", "Each race also has one Talent, written under its name."]};
window.CAMPAIGN_LINES.lessons.firstAbility = {step: "S13", act: 1, title: "Your first Talent",   /* ND 17 Nov: the pick is a passive Talent (js/ui/guided-start.js 410, 420; manual line 1378), not a keyed Ability */
  text: ["Choose one. It is always on.", "A Solid Hit is an attack that beats the target's armour. A Ward Token soaks one hit for the squad.", "Morale is the enemy's nerve: fail it and they run."]};
window.CAMPAIGN_LINES.lessons.hireCard = [
  {mark: "card", title: "Reading a card", text: ["Which number is her health?", "Click her Condition."]},
  {mark: "con",  title: "Condition",      text: ["Condition is health.", "Hers is {n}. Now you can hire her."]}
];
/* N1 / U1 (Patrick 20 Nov: "split like the person has a stutter"): whole sentences; each title is the card's own row label */
/* U-slice 1 (22 Nov): one card, no counter, the ring round the whole contract. ND final words 22 Nov. */
window.CAMPAIGN_LINES.lessons.warTable = [
  {mark: "job", title: "A contract", text: ["This card names the job, who you fight, what it pays and who is paying. Finish it and that patron thinks better of you: your Standing with them rises. The squad at the bottom marches: check it, then SIGN to take the job."]}
];
window.CAMPAIGN_LINES.lessons.parlayScreen = [
  {mark: "demand",   title: "Demand Surrender",   text: ["Your Personality die against their Morale die.", "Win, and they lay down arms."]},
  {mark: "withdraw", title: "Let Them Withdraw",  text: ["The fight ends here.", "They live, and remember."]},
  {mark: "fight",    title: "Fight On",           text: ["No talk. The fight goes on."]}
];
window.CAMPAIGN_LINES.lessons.detachmentOdds = [
  {mark: "odds", title: "The odds", text: ["The odds for the band alone.", "Read them before you send it."]}
];

/* F-48 UX words and sign-off word drafts (Campaign Planner, 2026-11-16). Nothing here is wired: the owner named on each block
   applies it and tells the Planner the key. Spec and rulings: audits/f48-planner-words.md. */
window.CAMPAIGN_LINES.ux48 = {
  /* K50 (LP applies): reports that contradict the story. */
  k50: {
    cagesLost: "You opened {n} of {of} cages, but the slavers held the road. The captives are back in chains.",   /* b3 lost after cages were opened; replaces fix45 'cages' on a loss */
    escortFledFounding: "You left the caravan to its guards. Cayde will hear by nightfall whether it got through.",   /* story.js escort.fled, Founding only */
    escortWithdrawnFounding: "You pulled back and the caravan went on alone. Cayde will hear by nightfall whether it got through.",   /* story.js escort.withdrawn, Founding only */
    standing: "Standing with {faction}: {from} to {to}."   /* {faction} carries its own article: "the Sun Elf Exiles", "the Dust Cloaks Council", never "the The" */
  },
  /* K54 (LP applies in js/teach45.js): the rule, then the one line a retry shows. */
  k54: {
    rule: "A lesson card shows once per Founding (kept in the Founding save, not the session). A tip or pop shows once per fight. On a retry no card shows; the report's retry line names the one thing that lost the fight.",
    retryNote: "You know this one: {lesson}."   /* a gated step on a retry: a one-line note, the gate still counts, the game is not held */
  },
  /* K40 (LP applies; LP hides Parley for the Hollow and for beasts). */
  k40: {
    raidOne: "{Host} is at the edge of the camp.",    /* one gang: "A bandit gang is ..." */
    raidMany: "{Host} are at the edge of the camp.",  /* plural hosts: "The Hollow dead are ...", "Beasts are ..." */
    parley: "Parley: win and they walk away. Lose and they want {n} gp."
  },
  /* K45 (LP applies): the first steps. Title order: START HERE: THE FOUNDING first, RECRUIT A SQUAD LEADER under it. */
  k45: {
    noMates: "No one to send yet. Hire a Squad Mate at the Hiring Line first.",   /* after Sign Contract with 0 mates, and on the War Table with 0 mates */
    noMatesButton: "GO TO THE HIRING LINE"
  },
  /* K46 (LP applies): one count for the Reserve Bench (benchCap(): 2, Tents 4, Huts 6, Bunks 8) and one place to promote
     (the Roster, with the Command Tent built: canPromote, index.html 5025). */
  k46: {
    tents: "The Reserve Bench grows from 2 places to 4, so more Squad Mates can wait in camp.",
    huts: "Timber huts replace the tents: the Reserve Bench grows to 6 places.",
    bunks: "Proper bunkhouses: the Reserve Bench grows to 8 places.",
    quarters: "The Reserve Bench holds {n} places.",          /* {n} = benchCap(), not benchCap() - 2 */
    roster: "Five deploy; the rest wait on the Reserve Bench ({n} places).",
    allyNoOfficer: "Second squad: promote an officer on the Roster (the Command Tent must be built) to march a second squad beside your own.",
    commandTent: "Officers: with the Command Tent built, promote a Squad Mate with 2 or more Advancements on the Roster, and send the Leader to officer training there."
  },
  /* K51 (with Systems): the b10 Keep card, before the fight. */
  k51: {keepWaves: "The host does not run out. Hold as long as you can, then get out.",
    /* GD 8c926c73 (ND 18 Nov): b10 only, in place of D.rout's note (js/camp/defence.js 290, "Time. No more are coming. ..."); other beats keep theirs. {stay} = stay.size */
    clockEnd: "Time. This wave draws off, but the host is still coming. Those inside the walls fight on: {stay} left. Clear them, then get out.",
    clockEndNone: "Time. This wave draws off, but the host is still coming. Get out while you can."},
  /* B2 (LP applies once the Leader's own ab33 key is named, sign-off B1): one ability name on all three screens. */
  b2: {
    card: "Opens with {ability}.",              /* the ready-made Leader cards */
    sign: "{name} opens with {ability}.",       /* the sign screen */
    sheet: "Ability [{key}] {ability}"          /* the Leader sheet; {ability} from the same loadout field as the other two */
  },
  /* B5 (Backlog Worker applies): Founding-mode reports, b1 to S52, night reports included. */
  b5: {
    coin: "Coin home: {n} gp.",                 /* the one money line; replaces Tithe, Upkeep, salvage table, prisoner upkeep */
    paidRushed: "The job paid {n} gp: half, because the defence was lost.",   /* G2: a rushed job (EN 6c37e251, js/tutorial/signoff.js) */
    standingOnly: ["exiles", "varnholt"],       /* the only Standing lines a Founding report shows */
    advOne: "The company learns from the contract: give 1 Advancement to a Squad Mate.",
    advMany: "The company learns from the contract: give 1 Advancement each to {n} different Squad Mates.",
    prisoners: "{n} prisoners are held in the wagons. Cayde will deal with them.",   /* in place of "Deal with them on the Chapter screen" */
    clericMagic: "{n} is the Cleric's Magic score (the `cleric` lesson's {n}); fill it from the hire, never leave it raw.",
    drop: ["Hazard Upkeep", "Detailed Salvage", "the Masters' Tithe", "Comrades", "Luck burned / Death Averted", "Trophy Rack", "raid and bounty lines", "nemesis lines", "Standing with factions not met", "section references"]
  },
  /* K38 (Art applies in js/arcadia-places.js, the text field): in-world words, no source notes, no retired names. */
  places: {
    silverquay: "Silverquay is a wealthy trading port-city on the west coast of the north-western continent, and the old seat of Lord Petras.",
    kasha: "Kasha is a port city on the Empire's western coast, a secondary naval hub and a yard for building warships.",
    hallam: "Hallam is a fortified town in the Empire's north-west, ruled by a town council rather than a lord. It lies near Silverquay.",
    zenbos: "Zenbos is a port city on the Empire's north-western coast.",
    "forgotten-jungle": "The Forgotten Jungle is wild country on the flank of the great mountains. No one rules it.",
    bisute: "Bisute is a place in the central mountains. Travellers bring back its name and little else.",
    quena: "Quena lies at the western edge of the elven forest. Little is told of it.",
    hak: "Hak lies at the south-west edge of the elven forest. Little is told of it.",
    loulk: "Loulk lies directly under Karaskan. Little is told of it.",
    sladis: "Sladis lies above Karaskan. Little is told of it.",
    swamplands: "The Swamplands are a great marsh in the heart of the Free Lands, south of Karaskan.",
    kosmos: "Kosmos lies on the east coast, below Portsmouth. Little is told of it.",
    temas: "Temas is one of the cities of the Free Lands, south of the Swamplands.",
    islands: "The Islands lie at the northern edge of the known world. Little is told of them.",
    "great-desert": "The Great Desert is a scorched southern land held by nomadic clans; northerners call it the barbarian land. Its tales speak of elemental djinn and dragon bones."
  }
};

/* F-45 Acts IV and V words (Campaign Planner, 2026-11-16), keyed to audits/f45-act4-5-spec.md (W1 to W11 and the night table).
   Not wired: the LP builds from these in js/tutorial/ (roadmap stage 2). Lesson cards S40 to S57 are already in
   CAMPAIGN_LINES.lessons; road captions in founding45 captions.road and captions.ending. {placeholders} are filled by the code.
   Zenif dies at b10 on both paths: no road lines; he is remembered in Artemis's lands. The Witch's name is Narrative's: {witch}. */
window.CAMPAIGN_LINES.act45 = {
  /* ---- b11: the start of the road (spec section 2) ---- */
  b11: {
    columnLabel: "Your stretch of the column: {n} families",   /* W1; the label on the Column Strength bar */
    rejoin: "{names} {verb} hurt, but walking. They are back in the squad by the first morning.",   /* W2; {verb}: is/are */
    dead: "{names} did not leave Varnholt. Cayde wrote the names in the ledger before the wagons rolled.",   /* W3 */
    deadCayde: ["Count them, then walk. We will say the names properly when we are safe."],
    floorRecruit: "One of the freed captives from the cages asks for {lost}'s place. Cayde says yes before you can."   /* spec section 2, the squad floor [S] */
  },
  /* ---- the muster card, Day 1 dawn (W4): the six companies the ending needs ---- */
  muster: {
    title: "The column",
    intro: "",   /* UX A4. P23-VOICE F20: cut; Cayde's box (cayde, below) holds the words and gives no count */
    companies: {
      rustpikes: "The Rust-Pikes: a pike line from the river towns. They ask what you can do before they ask your name.",
      deepshaft: "The Deepshaft Company: dwarves out of the old mines. Slow, stubborn and very hard to kill.",
      rowan: "The Rowan Watch: forest wardens who left their trees to guard the column's flank.",
      faithful: "The Emperor's Faithful: imperial veterans with no Emperor to be faithful to out here.",
      ridge: "The Ridge-Striders: hill scouts. They see the host's riders an hour before anyone else.",
      greyCloaks: "The Grey Cloaks: Cayde's own company, nearly wiped out this summer. You march with them."   /* the sixth company (R-121); ND lore batch 1 row 2 */
    },
    cayde: ["Six free companies were thrown at the Dark Elves this summer, and most of them broke. Us too. What is left of them is on this road with the refugees, all the way to the Empire.", "There are the Rust-Pikes, the Deepshaft dwarves, the Rowan Watch, the Emperor's Faithful and the Ridge-Striders. And the Grey Cloaks, which is what is left of us. You will meet them all before we reach Artemis's lands.", "None of them owe us anything. Some will stand with us when it counts, and some would sell us to the host for a horse. Watch what they do, not what they say."],
    button: "MARCH EAST"
  },
  /* ---- the morning card (spec section 3: every morning, quiet days too) ---- */
  morning: {
    head: "Night {d} of {n}",
    cost: "Last night: the column {col}, {dc} families left. Supply {s}, the Ledger Wagon {w}.",   /* {dc} the number only; {s} "held" when it does not change (UX A7) */
    costNone: "Last night cost nothing. The column slept.",
    wounded: "{names} {verb} hurt and riding in the wagon.",
    dead: "{names} did not see the morning.",
    newThing: "New today: {thing}.",
    greyed: "Night {n}",                               /* on a hidden action */
    recruitNudge: "Last night cut the column deep. There are hands in it that can hold a spear: Recruit.",   /* W7, after a wrecked night [S] */
    button: "BEGIN THE DAY",   /* UX A7: a verb */
    quiet: [
      "A quiet day. The column walks, and nothing comes out of the trees.",
      "Rain all morning. The wagon wheels cut the road to mud, and nobody complains, because mud is not riders.",
      "A child in the column finds a hare in a snare nobody set. The camp eats well, for once.",
      "The Ridge-Striders report dust on the hills behind. It does not come closer today.",
      "Two of the Varnholt families argue over a cart all afternoon. Cayde settles it by taking the cart.",
      "A day of walking. Somebody starts a song, and by evening half the column knows the words."
    ],
    /* one story line on the morning after each night (Long Road pass 1: seven nights; ND words 4bc5b3f2). {witch}: the sentences from it on are cut when she has not joined */
    after: {
      1: "The first night is over. The column counts itself and finds it is still a column.",
      2: "The smoke from the burning wood is in everyone's clothes. The Rust-Pikes' captain nods to you as the column passes.",
      3: "The wagons steam on the far bank, and the smiths are already at the axles.",
      4: "Sigrún's banner is gone from the ridge. Whatever was said in the night, the host is thinking. The camp sleeps in turns now, and the turns are short.",
      5: "The phalanx turned back at dawn, and nobody knows if it is done. {witch} sits apart at the fire. The children have decided she is safe. The adults have not.",
      6: "The Devil-Knight is gone, for now. Somebody ahead says Artemis, and this time people believe it.",
      7: "The ford is behind you."
    }
  },
  /* ---- day actions as they open (spec section 3); one line each, on the morning it opens ---- */
  opens: {
    forage: "Forage: find food. Supply goes up, if the roll is kind.",
    scout: "Scout: learn what comes tonight before it comes.",
    recruit: "Recruit: take a willing hand from the column into the squad.",
    parley: "Recruit a band: ask a company to march with you.",
    retreat: "Fall back: move the column away from tonight's fight, at the cost of half a day.",
    camp: "Tend, Repair, Pray, Craft, and how the column makes camp: it can look after itself now, a little.",
    detachment: "Detachment: send a band to do a second job while you do the first.",
    promote: "Promote: make a band's captain one of your officers.",
    roll: "{stat} {a}: rolled {face} against {b}, {result}"     /* under every result: "Personality 3: rolled 6 against 5, Full Success" (seen live 16 Nov) (UX A1: Full Success, Partial Success, Miss, as the withdraw roll says) */
  },
  /* ---- Night 4 morning: the fittings (spec section 4, ruling 1) and the stakes table (W5) ---- */
  fittings: {
    title: "Fit the Ledger Wagon",
    intro: "Three nights on the road. Now you know what the wagon has to carry. Choose three fittings.",
    cayde: ["Take the bed, the larder and the rack. The rest are for people who know the road."],
    why: {
      infirmary: "Infirmary Bed: the hurt get back on their feet faster.",
      larder: "Larder: one more Supply each day.",
      armoury: "Armoury Rack: the squad starts every night with one more Ward Token."
    },
    button: "FIT THE WAGON",
    full: "The wagon holds three. Take one off first."   /* a fourth Take with three taken (checklist K.9) */
  },
  stakes: {
    title: "What a night costs",
    rows: [
      "Talk (Parley): Supply and gold. Nobody bleeds.",
      "Fight: wounds, and wear on the wagon. You keep what you win.",
      "Fall back: half a day on the road. The host stays behind you, and safety stays as far off."
    ],
    note: "Do the same thing every night and it gets harder. The host learns too."
  },
  /* ---- Night 2: the band terms (spec section 4, ruling 4; W8) ---- */
  bands: {
    terms: "Three nights, a quarter of the gold, half the Supply you win.",
    button: "Take them on (three nights)",   /* UX A5: short for a phone; the terms line sits above it */
    lessonAdd: "They also take half the Supply you win."   /* W8: added after the `bands` lesson's second line */
  },
  /* ---- Nights 5 and 7: the casters ---- */
  mage: {
    joins: "{name} joins the squad: a Mage at Magic {n}. Her spells are on her card.",
    noRoom: "The hedge-mage looks at the crowded wagons and walks on with the refugees: the squad has no room.",
    gift: "{name} has worked out a new spell on the road: Ray of Frost. It is in her book."   /* the bible's road gift; the LP picks the night [S] */
  },
  witch: {
    joins: "{witch} walks into the firelight and sits down without asking. \"Your column has a Witch now. Try not to make a fuss about it.\"",
    cayde: ["She found us. That is either very good or very bad."]   /* Narrative may replace both once she is named */
  },
  /* ---- Long Road pass 1: what each night put at stake (debrief lines; founding-story.js stakeLines). {n} {cs} {band} filled by the code ---- */
  stake: {
    columnWhole: "The first night, and no family lost.",
    wagonWhole: "The Ledger Wagon came through the night: {hp} of {max}.",
    wagonNone: "The Ledger Wagon is wrecked. It had no fitting to lose, so the repairs cost 2 Supply.",
    devilFell: "The Devil-Knight fell, and its Cinderlings broke.",
    devilLives: "The Devil-Knight lived to dawn: Column Strength -2.",
    columnLost: "The first night cost {n} Column Strength. Keep foes off the column, and kill them before dawn.",
    knivesAll: "All four markers checked before the cutthroats came out.",
    knives1: "1 marker went unchecked: Supply -1, and the cutthroats came out.",
    knivesN: "{n} markers went unchecked: Supply -{n}, and the cutthroats came out.",
    phalanxNo: "The Phalanx never reached the column.",
    phalanxYes: "The Phalanx reached the column, and the column paid double for it.",
    kalloon: "Artemis's mounted knights came across at the end of Round 5. The column reaches his lands with Column Strength {cs}: {band}."
  },
  /* ---- Night 7 (W6; key kept as night12) ---- */
  night12: {
    brief: "Thornwater Ford, the last night. The host's general leads, and shows no banner. Hold until Artemis's knights come.",
    cayde: ["Last river. Get them over and we are done walking."]
  },
  /* ---- night reports in Founding mode (B5 rules: no Tithe, Upkeep, salvage table or unmet factions) ---- */
  report: {
    held: "The column held through the night.",
    hurt: "The riders reached the column. {n} of the families are gone.",
    leaderDown: "Your Leader went down, and the squad stopped fighting to carry {name} clear. Nobody was guarding the column: Column Strength -{n}.",   /* GD b8525613: in place of "The squad was overrun..." (founding-story.js 829) when the Leader is down and a Squad Mate is up; {name} the Leader, {n} the cost the code charges (3 today) */
    retreated: "The column fell back before the fight. Half a day lost, nobody lost.",
    parleyed: "The night ended in talk. It cost {s} Supply and {g} gp.",
    wagon: "The wagon took {n} damage.",
    supply: "Supply: {s}.",
    coin: "Coin home: {n} gp.",
    bandLeft: "{band} counted their dead at dawn and walked away. The gear you lent them came back to the wagon.",
    bandDone: "{band} have marched their three nights. They take their share and wish you luck."
  },
  /* ---- Act V: Kalloon (spec section 5) ---- */
  kalloon: {
    cayde: ["I held the chair because someone had to. Now there are six companies and one road-coloured cloak between them.", "Pick who sits. I would rather it were you."],   /* W9 */
    bridge: "Before you sit, here is what you have not learned yet.",   /* Planner L: between kalloon.cayde and the notProved lines; only when there is at least one */
    zenif: "Somebody carves Zenif's name on the first post of the new wall. He raised Dunmorrow's stone by magic. He would have had opinions about this wall.",   /* lore-check: Zenif is a wizard, not a mason */
    notProved: {   /* W10: Cayde on the Kalloon card, one line for each row of teaching plan section 6 not proved by S51 */
      move: "You never did keep them in the ring. Hal will shout about it.",
      abilities: "Half that ability bar never got pressed. Try it before you need it.",
      downed: "You have not had to drag anyone up yet. You will.",
      build: "You never built anyone from scratch. You will, the first time you hire.",
      hire: "You never hired, kitted and raised a mate yourself. That is the whole job now.",
      contract: "You never haggled over pay. The people who hire us will notice.",
      standing: "You still do not know what a good name buys. You will find out.",
      defend: "The last night cost the column dear. Learn to hold a line before you need it.",   /* K45.PROOF.defend: Night 12 won without a wrecked night */
      allies: "You never talked a commander down or used a band. Out here, that is half the work."
    },
    grant: "+{n} gp from Lord Artemis, to set the company up at Marlborough. The Chapter keeps its own 200 gp.",   /* K63: replaces '+N gp from Kalloon for the charter' (founding-story.js 873); the charter is signed nine years later. Planner R10: camp opens at 200 + grant (feel.js 395) */
    noGrant: "Lord Artemis sends no reward. The Chapter keeps its own 200 gp.",
    purse: "The road's purse, {n} gp, stays with the families at the ford. It is theirs to start again with.",   /* K63: only if Systems does not carry the road gold into the Treasury */
    button: "RIDE TO MARLBOROUGH",
    carry: "{company} send one of their own to your Hiring Line.",   /* one per company hired on the road (K45.K.carry = 'recruit') */
    carryStanding: "{company} think better of you: one step of Standing."
  },
  /* ---- P23-ARTEMIS (GD spec audits/specs/p23-artemis-final-road.md; ND 23 Nov): the last night's horn, the relief, Artemis's speech, the four tiers ---- */
  artemis: {
    horn: "Horns to the east. Friends are coming. Hold!",   /* caption at the end of round 4; Hal's shout, so no speaker box */
    relief: "Lord Artemis's knights ride to our aid!",   /* replaces 'The riders of Kalloon cross the ford!' (founding-story.js 649) */
    /* the speech: Lord Artemis in his own box; a plain soldier's courtesy; he asks, he does not order. {tier} picks speech or speechRuin */
    speech: [
      "I am Artemis, lord of Dunmorrow. I watched you hold Thornwater Ford, and I wish we had come sooner.",
      "These people are alive because of you. You were hired to guard them, and you gave your blood. You will be rewarded.",
      "If you are willing, Marlborough, a border town on my lands, needs men who can hold a wall. I ask; I do not order."
    ],
    speechRuin: [
      "I am Artemis, lord of Dunmorrow. I came as fast as I could, and I was too late for many.",
      "I will not pretend this went well. But you held Thornwater Ford until we came. Take what I can give; it is less than you deserve.",
      "If you are willing, Marlborough, a border town on my lands, still needs men who can hold a wall. It is yours to refuse."
    ],
    tiers: {   /* endingBand text; gold stays 400 / 250 / 100 / 0 */
      triumph: "The column is whole. Lord Artemis thanks the company before his knights, and rewards it richly.",
      survival: "The column is smaller but whole. Lord Artemis thanks the company and rewards it fairly.",
      remnant: "The elves are alive, and the company gave more than it was paid for. Lord Artemis rewards it as he can.",
      ruin: "A handful survive. Lord Artemis thanks the company, but coldly."
    },
    carryOn: "Everyone who marched becomes your Chapter: your Leader, your Squad Mates, your gear, and the Treasury Lord Artemis grants you.",   /* replaces feel.js 441's 'the Treasury Kalloon grants you' */
    f51open: ["This is Marlborough Keep, your company's first seat. The walls stand, and little else does. Start with the Palisade.", "I held the chair because someone had to. Pick who sits when you are ready."]   /* Cayde, on arrival; F-51 beat 1, after Artemis's speech; the list itself is the UX's on-screen list */
  },
  /* ---- Act V, S56: what carried over (W11) ---- */
  carried: {
    head: "What came with you from the road:",
    gold: "{n} gp in the Treasury",
    standing: "{company} think better of you: one step of Standing",
    recruit: "{name} of {company}, waiting in the Hiring Line",
    recruitDue: "{company}: one recruit, waiting in the Hiring Line",   /* before the first Hiring Line names them */
    roster: "{n} Squad Mates who reached Artemis's lands"
  }
};

/* ---- Planner, 16 Nov 2026: PD-29 beast lairs and PD-43 snatches (spec: audits/f45-pd-specs.md section 7). Data only; LP wires. ---- */
/* PD-29: a Hunt contract whose host is `monsters` reads as a lair clear, not a camp of commanders. Tokens: {place} {n} {m}. */
window.CAMPAIGN_LINES.lairs = {
  name: "Clear the Lairs",                                  /* in place of 'Headhunter Clash' (contracts.js 39) */
  brief: "Beasts have made their lairs around {place}, and they are taking stock and children from the farms. Find every lair and kill the beast that leads each pack.",
  short: "Find the lairs and kill every pack leader.",      /* boot.js 265 OBJECTIVES.hunt.brief */
  mapLabel: "Lair",                                        /* each G.camps marker, if it has a label */
  progress: "Lairs cleared: {n} / {m}",
  start: "The lairs are quiet by day. Each has a pack leader; kill it and the pack scatters.",
  cleared: "A lair is cold. {n} to go.",
  win: "The last pack leader is dead. The lairs are empty.",   /* deployment.js 146 */
  story: {                                                   /* story.js 93 and 814 to 828, hunt rows */
    victory: "Every lair is cold. The farms can count their stock again.",
    withdrawn: "You pulled back. The packs did not, and they will be hungrier.",
    fled: "The packs chased you out of their own country."
  }
};
/* PD-43 (optional build): on a road night a foe that reaches the column unengaged snatches a family member and drags them
   off towards the map edge instead of the loss being counted at once. Killed on the way: freed, the loss undone.
   Tokens: {foe} the snatcher's name, {name} the family member, {n} a count, {names} a list. */
window.CAMPAIGN_LINES.snatch = {
  pop: "TAKEN",                                            /* over the snatcher */
  popFreed: "FREED",
  start: [
    "{foe} has a child by the arm. Stop them before the treeline.",
    "{foe} is dragging {name} away from the wagons.",
    "{foe} has {name} over one shoulder and is making for the trees."
  ],
  freed: "{name} is free and running back to the wagons.",
  gone: "{foe} reached the trees. {name} is gone.",
  firstTip: "Foes who reach the wagons unopposed take people, not lives. Kill the one carrying them before the treeline and they come home.",
  morningOne: "One of the column was dragged off into the dark.",
  morning: "{n} of the column were dragged off into the dark.",   /* replaces 'lost' on the morning card */
  list: "Taken: {names}.",
  savedMorning: "{n} were dragged off and brought back.",
  /* the later rescue break (backlog sketch, not built): a defend-series lead, offered only if any were taken */
  lead: {
    title: "The taken",
    brief: "Some of the column taken on the Long Road are alive, held in a Frost-Vault pen near {place}. {n} names are on the list. Break the pen and bring them home.",
    win: "{n} of the taken walk into camp. The families of the road know every face.",
    loss: "The pen was moved north before you could open it. The names stay on the list.",
    withdrew: "You left the pen shut. The families do not ask, and that is worse."
  }
};

/* PD-35 overrides (Planner, checklist S): the rest of the words stay as pd35.js defaults */
window.CAMPAIGN_LINES.pd35 = {
  stay: 'Survivors of the column who stay with the Chapter: {n}. They will sign on for less than a stranger would.',
  onward: 'FOUND THE CHAPTER',
  tag: 'Walked the road with you. Signs on at half the fee.',   /* K78 (e): the panel's tag already says "Kalloon survivor" */
  /* K78 (b), new keys for the LP to wire. stakes: under the body, before PARLEY. rollMine/rollTheirs: the two cards' headings. */
  stakes: 'Your Leader rolls Personality against the captain’s Morale. Beat him by 3 or more: the company walks with its arms and kit, and he pays you to go. Beat him by 1 or 2, or match him: you walk, but the Treasury stays. Roll under him: he takes you as well.',
  rollMine: '{name} rolls {n}',        /* small line under it stays "Personality {per}" */
  rollTheirs: 'The captain rolls {n}', /* small line under it stays "Morale {mor}" */
  /* K78 (c), new key: one line after the result, before FOUND THE CHAPTER, by band */
  kalloon: {
    good: 'The company rides on alone. Six companies meet in Artemis\'s lands, and none of them asks about the elves.',
    even: 'The company walks on to Artemis\'s lands with empty wagons. Six companies are waiting there.',
    bad: 'In the spring the ransomed company reaches Artemis\'s lands. Six companies are waiting, and they know who paid.'
  }
};

/* PD-23 words (Planner, UX K80; Q23 lore: the Hollow are the Frost-Vault's conscripts, spent first).
   Live through PD23.W(): brief (b8), b8, switch. New keys for the LP to wire: b9brief and b10brief (one line after the
   gate brief), switchHead (the centre banner over the switch line, K80 b), b9after and b10after (debrief lines), leader
   (the Hollow host's "Led by", K80 c: not "a Hollow Reeve", read as the Reeve of Varnholt; not a name either, as the
   field commander is a random Reeve. Replay T: b10 words name no Strategos for the same reason). */
window.CAMPAIGN_LINES.pd23 = {
  brief: 'The Hollow come down the north road first: conscripts and slaves, driven by the Frost-Vault. The Vault keeps its own Dark Elves back, for now.',
  b8: 'Every one of them was human, bar the Reeve who drove them. The Frost-Vault is spending other people first.',
  b9brief: 'When the Hollow thin, the Frost-Vault host comes in behind them: pikemen and Tithe-Priests in pale robes.',
  b10brief: 'One wave of the Hollow, then the Frost-Vault itself, under a Guard-Captain’s banner.',
  switchHead: 'THE FROST-VAULT',
  switch: 'Pale robes behind the rabble: the Frost-Vault itself.',
  b9after: 'The Frost-Vault showed itself today. Next time it will not wait for the Hollow to tire you.',
  b10after: 'Scouts swore a Strategos rode out to watch the walls from the trees. The Hollow were the price of bringing one that close.',
  leader: 'one of the Hollow’s Reeves'
};

/* UX K78 (f): the Hiring Line's intro without board-game table numbers. For the LP: contracts.js hiringHTML (643)
   reads CAMPAIGN_LINES.hiring.intro in place of "Sellswords waiting by the fire, rolled on Tables 2.1 and 2.2. ..." */
window.CAMPAIGN_LINES.hiring = {
  intro: 'Sellswords waiting by the fire, each with a price and a past. A new line arrives after every contract.'
};

/* UX K91 (f48): the Manual. For the LP: one late openManual wrapper (before luck-epilogue's manualReindex, or call
   manualReindex again after it) that
   1. puts `talents` as a new paragraph straight after the "Advancement." one;
   2. swaps the whole first "Withdrawing." paragraph for `withdraw`, removes the second "Withdrawing (ESC) ..." one, and
      adds `bigRolls` after it (the sentence that lived at its end);
   3. renames the second "The map." paragraph's heading to `mapMarks` (its text stays);
   4. applies each `swap` pair [old, new] once (rulebook Section and Table numbers to player words);
   5. uses `close` as the Manual's button word (the × keeps its title). [S]: the Chronicle's CLOSE and the
      Quartermaster's BACK become `close` too. */
window.CAMPAIGN_LINES.manual = {
  talents: '<b>Talents.</b> A Talent is always on and has no key. The Leader picks one when made, and again at each level whose Specialty row reads "Pick 1 Talent"; a caster may take a spell or prayer instead. Each card names its Specialty ("Soldier Talent") and says who it helps. Every Talent starts each contract at rank 1, and Momentum\u2019s Empower can raise it for that contract. Abilities are the actions on the number keys.',
  withdraw: '<b>Withdrawing.</b> Press ESC and choose Withdraw. It is a roll on your Leader\u2019s Personality against 4 (nobody close), 5 (the enemy is on you) or 6 (an enemy commander is near). Full Success: out with the coin you carry. Partial: out, but the coin is dropped. Miss: pinned; fight on and try again after 20 seconds. With at least half the job done the patron pays half; with less, nothing, and your Standing with the patron falls.',
  bigRolls: '<b>Big rolls.</b> The War Council, Parley, withdrawing, prisoners and Work Orders are thrown across the screen; click to skip.',
  mapMarks: 'Scouted marks.',
  swap: [
    ['as the rulebook advises against blasts (Section 6.11): a Fireball', 'so a Fireball'],
    ["uses the squad's attack (Section 6.4):", 'costs the squad its attacks:'],
    ['Captured nobles roll on Table 4.10 (', 'Captured nobles roll for their worth ('],
    [' (Section 1.7, Step 1)', ''],
    ['sets the camp bonus (Table 4.8):', 'sets the camp bonus:'],
    ['Facilities marked Staff Req in Table 4.3 (', 'Facilities that need staff (']
  ],
  close: 'BACK'
};

/* UX K99 (Planner, 16 Nov): the Chronicle's road entry when the column was lost (story.js 672 add(-34)). Wiring is the LP's.
   lost replaces the "Column Strength at the ford of Kalloon ... colour of the road" sentences; then one line by the Parley band;
   the "Six companies had walked it ... one banner" sentence and the names line stay as they are. {nights} = C.night. */
/* K99: read by story.js road99 (CAMPAIGN_LINES.pd35.chron99; {n} = the night the column was lost). `after` replaces the
   "colour of the road ... one banner" sentences on a lost road (LP to wire); the six companies' names stay in it. */
window.CAMPAIGN_LINES.pd35.chron99 = {
  lost: 'On the road with the elves of Tarim, the column was lost on Night {n}, short of Artemis\'s lands.',
  good: 'The Frost-Vault captain let the company walk with its arms and kit. The elves were taken north in chains.',
  even: 'The company walked free; the Treasury wagon stayed with the Frost-Vault.',
  bad: 'The company was taken as well. Lord Artemis and the Empire paid the ransom, and the Chapter began in his debt.',
  after: 'Six companies had set out on that road: the Grey Cloaks, the Emperor’s Faithful, the Deepshaft Company, the Rowan Watch, the Rust-Pikes and the Ridge-Striders. What was left of them met again in Artemis\'s lands in the spring, and the charter would come later.'
};

/* S6 row 2j, the Social Class catches (Narrative Designer, 17 Nov; spec audits/specs/s6-2j-class-catches.md section 7, GD run 6 passed).
   Read by js/campaign/catches.js (word(), line 44): a key here wins over its stand-in in CATCH2J.W. {tokens} are filled there
   from CATCH2J.N and the game's own figures; no number is typed in. NOBLE's card is held for the GD's ruling on "They always
   come back" (LE build note (a)): ruled 07793c7b, now below. */
window.CAMPAIGN_LINES.catches = {
  label: 'Catch:',
  card: {
    DEVOUT: 'Tithe Bound. EVERY PAID JOB: your temple takes {tithe} gp of the pay. (A first job pays about {firstPay} gp.)',
    EDELOS: 'Imperial Suspicion. RARELY, and only against the Empire (one of the six powers at war): Empire commanders are harder for you to talk into a surrender: {stepWord} less on your roll (-{step} step).',
    FREEMAN: 'Lowborn. RARELY: when your company captures an enemy noble, their family buys them back from you. You bargain worse: {stepWord} less on your roll (-{step} step), so the family pays you less.',
    NOBLE: 'High Ransom Target. WHEN YOU LOSE A FIGHT and your Leader is down: you pay {ransom} gp to get them back, or all your gold if you have less. Gold is all it costs.',   /* GD 07793c7b: "They always come back." goes; a dead Leader is not ransomed */
    OUTCAST: 'Shunned. SOMETIMES, against {lawfulCount} of the six powers at war (the lawful ones): their commanders are harder for you to talk into a surrender: {stepWord} less on your roll (-{step} step).',
    SLAVE: 'Scars of Servitude. ALWAYS: {slaveCon} Condition (Condition is health).'
  },
  surrender: 'Some catches name a surrender. When your squad has an enemy commander nearly beaten, they may offer to give up. Talk them round and you win the fight early and sell them for about {prisonerValue} gp.',
  noUse: 'Does nothing for a {specialty}.',
  tithe: "Temple tithe: <b>-{t}gp</b> to your Leader's temple (Devout: Tithe Bound). Treasury now {n} gp.",
  masters: ' (every company pays it)',
  parlay: {EDELOS: '-{step} step Imperial Suspicion (your Leader is Edelōs)', OUTCAST: '-{step} step Shunned (your Leader is an Outcast)'},
  haggle: '-{step} step Lowborn (your Leader is a Freeman)',
  ransom: 'Ransom: <b>-{r}gp</b>. The enemy took your Leader and sold them back (Noble: High Ransom Target). They are home.'
};

/* Owed Advancements in camp (UX bug e85e8b85, audits/uiux/2j-layout-check.md; Narrative Designer, 17 Nov). The camp bar word is
   Barracks (js/camp/camp-build.js 110, NAMES.barracks), and the Barracks screen shows the Advancements box once the EN builds it.
   reportWait: the after-fight report, in place of "...wait for you in the Roster." (js/ui/screens.js 428).
   needs / needsOne / short*: the C31.needs entry {word: 'barracks', text, short} (camp-build.js 37); {n} = advLeft(). The list
   draws "Barracks" before text, so text does not name the place. */
window.CAMPAIGN_LINES.advCamp = {
  reportWait: 'Unspent Advancements wait for you in the Barracks.',
  needs: '{n} Advancements to spend on your Squad Mates',
  needsOne: '1 Advancement to spend on a Squad Mate',
  short: '{n} Advancements to spend',
  shortOne: '1 Advancement to spend'
};

/* Q59 (audits/specs/q59-act1-resume.md, ND 18 Nov): the card on CONTINUE inside Act I. One `at` line per step (A.ORDER, act1.js 43);
   move has none (criterion 11). `you` is used once the Leader is made; `youCreator` while the Creator is still to finish. */
window.CAMPAIGN_LINES.resume = {
  title: 'Back on the North Road',
  rested: 'Everyone is rested and at full health.',
  cagesKept: 'Cages you opened stay open.',   /* shown only once a cage is open (soldier step on) */
  button: 'CARRY ON',
  at: {
    fight:     'You are back at the sleeping slaver. The fight with him starts over.',
    ability:   'You are back where two slavers come at Cayde. That fight starts over.',
    objective: 'You are back on the road with both slavers beaten, walking to the first cage. Its guards are standing again.',
    cage:      'You are back at the first cage. The fight with its guards starts over.',
    soldier:   'You are back at the first cage, now open, with Hal beside you. Every fight you had with Hal here starts over.',
    ring:      'You are back with Hal on the road to the second cage. Its guards are standing again.',
    scoundrel: 'You are back at the second cage, just opened, with Pinch beside you. The fight with the sergeant is ahead of you.',
    trap:      'You are back at the trap Pinch spotted. The trap is set again, and Pinch must disarm it again.',
    last:      'You are back at the third cage. The fight with its guards starts over.',
    you:       'You are back at the third cage, where {leader} walked out. {leader} is kept as you made them. The fight on the road ahead starts over.',
    youCreator:'You are back at the third cage. Your Leader is not made yet: you make them again from the first choice.',
    momentum:  'You are back at the edge of the slavers\' camp, with its outer guards standing. You hold no Momentum card yet: the choice comes again.',
    commander: 'You are back at the slavers\' camp. You still hold the Momentum card you chose. The fight for the camp starts over.'
  }
};

/* Q50 (audits/specs/q50-one-free-item.md, ND 18 Nov): the free items. pd37.js W() merges this block over its DEF.
   caydeBonus replaces CM_BONUS.EDELOS.game on Cayde's card only (founding.js 19); a player-named Edelos Master keeps that line.
   own*: the Edelos Master's own free purchase, when that Master is not Cayde. {name} = the Master; {cap}, {discount} from code. */
window.CAMPAIGN_LINES.pd37 = {
  tag: 'FREE: Lord Artemis\'s crate, one this season',
  taken: 'Supplies from Lord Artemis',
  crateUsed: 'Lord Artemis\'s crate: taken. The next crate comes with the new season.',
  ownTag: 'FREE: {name}\'s pick, one this season',
  ownTaken: '{name}\'s pick',
  ownUsed: '{name}\'s pick: taken. Another comes with the new season.',
  both: 'Two free items are yours: {name}\'s pick and Lord Artemis\'s crate. They are separate: you can take both.',
  caydeBonus: 'Merchant Stalls cost {discount} gp less. Each season Lord Artemis sends a crate: one Quartermaster item of up to {cap} gp is free.'
};

/* Q54 cold read 1 finding 2 (GD, 18 Nov): one plain line where a player first meets the Hollow (the first Hollow contract card,
   and the bestiary entry for the host). Placement is UI/UX's and the Engineer's. */
window.CAMPAIGN_LINES.hosts = {
  hollowWho: 'The Hollow are living people, not the dead: the Frost-Vault\'s conscripts, levies and slaves.'
};

/* P23-BUG-5 (GD ruling audits/specs/gd-p23-rulings.md 1; LE be07e0a9, js/ui/feel.js ADV_WHY): the Advancement box says why.
   {n} held, {cap} the cap, {next} the cap after the level, {leader}, {lv} the level, {beat} the Founding card's name. */
window.CAMPAIGN_LINES.advCapWhy = Object.assign(window.CAMPAIGN_LINES.advCapWhy || {}, {
  atCap: "Full: {n} of {cap}",
  risesAt: "When {leader} reaches Level {lv} (at \"{beat}\"), each Squad Mate can hold {next}.",
  rises: "When {leader} next levels up, each Squad Mate can hold {next}.",
  kept: "1 more Advancement is kept for later, not lost.",
  keptN: "{n} more Advancements are kept for later, not lost.",
  carried: "{n} saved from before"   /* ND 23 Nov (QA p23-bug5): heading bracket in place of "{n} carried over" (feel.js 245, campaign.js 352); the LE/EN read it */
});

/* N2 (Patrick 21 Nov): Zenif asks for the Mage in his own voice, beside his portrait, at the second assault b9 (GD 7c282960; js/campaign/pd38.js).
   zenifAsk is new; the EN/UX show it with the portrait. When that lands, joins and training take the values in
   audits/narrative/s6-1c-1f-words.md (the narration loses the quote he now speaks). {name}: the Mage. */
window.CAMPAIGN_LINES.pd38 = Object.assign(window.CAMPAIGN_LINES.pd38 || {}, {
  joins: "{name} has come in with the refugees: a hedge-mage, Magic 1.",   /* Zenif now speaks for himself at b9; the self-test matches this (EN 9fd099db) */
  training: "{name} spends this assault on the east wall with Zenif, training. She is out of the squad for this fight.",   /* the quote is now Zenif's own, in zenifAsk beside his portrait (EN 22 Nov) */
  zenifAsk: "Give me {name} for this assault. On the east wall she can watch me cast. A Mage grows by Magic, not by fighting, and each point of Magic is one more spell she can carry."
});

/* G2 (GD 22 Nov; js/campaign/f34.js GL()): the gate rule and the rush after a lost defence. */
window.CAMPAIGN_LINES.gate = Object.assign(window.CAMPAIGN_LINES.gate || {}, {
  rule: "Hold the gate and you have the day to prepare for the next job. Lose it and you get half a day, and that job pays half.",
  held: "The gate held. You have the day to prepare, and the job pays in full.",
  rushedAfter: "The defence was lost. You get only half a day to prepare, so the next job pays half.",
  rushed: "The defence was lost, so you had only half a day to prepare. This job pays half."
});
