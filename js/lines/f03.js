/* ============================================================================
   F03_LINES: data only (Narrative Designer). F-03 new contract types (Patrick, 2026-11-14).
   Six contracts and the Flesh Guilds as a faction. No numbers: Systems sets rewards and Standing.
   Source ideas: audits/contract-ideas-flash.md #1 to #5 plus the slave market.
   Per contract: title, patron (who hires), brief (board card, 1 to 2 sentences), briefing (the longer pre-mission text), hud (one-line objective for the screen),
   twist (a one-line reminder of the new rule), result {win, loss, withdrew}, patronLine {offer, thanks, angry}.
   Tokens: {P} patron, {place}, {C} contract title, {L} leader, {F} faction.
   Lore kept straight: the flotilla is old-war dead (Azhrakul is history); "a Dwarven Syndicate"
   with no clan name; the Skulk's founding with no alias; Flesh Guilds are Empire-chartered (R-050).
   British spelling, no em dashes, no italics.
   ============================================================================ */
window.F03_LINES = {

  garrisonBait: {
    title: "Garrison Bait and Barricade",
    patron: "A Skulk mail-keeper",
    brief: "A safehouse in {place} is full of people who must not be found. Draw the post's patrols away with smoke, noise and barricades, and do not kill the guards. Two dead guards are forgiven. The third rings the alarm and the garrison comes down on the street.",
    hud: "Lead the patrols away. Keep the runner alive. No more than two dead guards.",
    briefing: "The safehouse holds one informant who must walk out alive, and the post's patrols roam the street around it. You carry three or four smoke pots. Set them where the patrols will chase the smoke, and walk the informant out while they do. Two dead guards are forgiven. The third kill rings the alarm and ends the job.",
    twist: "Three dead guards end the job. Herd them instead.",
    result: {
      win: "The patrols chased smoke all night and the safehouse emptied before dawn. {P} says nobody counted a single guard, which is the point.",
      loss: "Three guards died, the alarm rang, and the post came down on the street. {P} sends word that the safehouse is lost.",
      withdrew: "{L} called off the distraction. The patrols found the safehouse by morning, and {P} says nothing."
    },
    patronLine: {
      offer: "“Nobody needs to die. A third dead guard, and the whole street pays for it. Can you make noise and keep your hands clean?”",
      thanks: "“Smoke and barricades. Clean work. The Skulk remembers who does not leave a mess.”",
      angry: "“Three dead guards. After I said. We will not forget it.”"
    }
  },

  burnWharves: {
    title: "Burn the Wharves",
    patron: "A Mendorian Order harbour-warden",
    brief: "A dead flotilla is coming in to the wharves near {place}, the old war's drowned crews risen to land. Light the pier junctions to burn the landing parties. Each pier you burn is a pier you lose.",
    hud: "Light the piers. Hold the last walkway.",
    briefing: "The dead come ashore by three piers. Light a pier junction and that walkway burns out of the map, taking the landing party with it, and shrinking the ground you can stand on. Light all three, hold what is left of the quay, and hold it to the end.",
    twist: "Each burnt pier shrinks the ground you can fight on.",
    result: {
      win: "The wharves are ash and the dead are in the water. {P} says the Order will rebuild the piers, and will not forget who burnt them.",
      loss: "The last pier fell to the dead. {P} writes the names of the lost in a long, careful hand.",
      withdrew: "{L} left the wharves to burn on their own. {P} says the water will keep what it was given."
    },
    patronLine: {
      offer: "“The old dead are rising from the straits. Burn the piers, and mind your footing.”",
      thanks: "“The harbour is a ruin, and the island is safe. The Order pays in full.”",
      angry: "“The piers were told to burn. They did. You did not.”"
    }
  },

  slaveHulk: {
    title: "Slave-Hulk Boarding Action",
    patron: "A Free Lands harbour-master",
    brief: "A Flesh Guild hulk lies at anchor in {place}, her oar-benches full. Board her, cut the oar-shackles belowdecks, and hold the upper deck until the rowers are free. The ship will be scuttled if she is not taken in time.",
    hud: "Take the deck. Break the oar-locks. Free the rowers.",
    briefing: "The hulk's rowers are chained to their benches below a hatch. Clear the deck crew and the hatch opens. Cut them loose and they will arm themselves and fight at your side, up to six of them, for the rest of the job. Do not let the guild scuttle the ship before you reach the hold.",
    twist: "Clear the deck, open the hatch. Freed rowers fight for you.",
    result: {
      win: "The oar-locks are broken and the rowers are on deck, armed with whatever they could find. {P} says the Free Lands will pay what they owe, and the rowers will say the rest.",
      loss: "The hulk went down with her benches still full. {P} says nothing for a long moment.",
      withdrew: "{L} left the hulk at her anchor. The guild sailed with the tide."
    },
    patronLine: {
      offer: "“A hulk, a guild crew, and a bench full of people who will not live long. Can you get below deck?”",
      thanks: "“They are out, and they are free. The Free Lands remember.”",
      angry: "“You were told the ship would sink. You were told the hour. Why are you here?”"
    }
  },

  vaultShakedown: {
    title: "Dwarven Vault Shakedown",
    patron: "A guild creditor",
    brief: "A Dwarven Syndicate's counting-house under {place} holds the bullion it took from its debtors, behind blast doors on a timer. Break the shield line, hold the valve wheels to keep the doors open, and bring the bullion out.",
    hud: "Flank the shields. Hold the valves. Get the bullion out.",
    briefing: "The corridor to the strongbox is held by shield-bearing guards, and the blast doors close on a timer. Three valve wheels keep them open: each needs someone to stand and turn it while the squad moves in. Flank the shields, hold the wheels, take the strongbox and leave before the last door seals.",
    twist: "Shield phalanxes block frontal fire. Hold the wheels or the doors seal.",
    result: {
      win: "The bullion is out and the blast doors stood open to the last. {P} says the debtors will sleep tonight.",
      loss: "The doors sealed with the bullion inside and half the squad outside. {P} calls it a loss of nerve, and a loss of coin.",
      withdrew: "{L} backed out of the counting-house. The Syndicate kept its vault and its pride."
    },
    patronLine: {
      offer: "“The Syndicate breaks legs for late coin. Break its doors for me, and I will pay in full.”",
      thanks: "“You walked out of a syndicate vault with the gold. I will tell that story for years.”",
      angry: "“The valves, I said. Hold the valves. They were not hard to hold.”"
    }
  },

  cellarSummit: {
    title: "Cellar Summit Shakedown",
    patron: "A street boss",
    brief: "The street's three gang bosses meet in the cellar beneath an inn in {place}, each with a retinue. Go in with the invitation, and when weapons come out, end the argument. Fall the chiefs in this order for a bonus: the heavy man with the pavise, then the smoke-hand, then the bomb-thrower. Each boss that falls takes the heart out of his men.",
    hud: "Order for the bonus: pavise, smoke-hand, bomb-thrower. Each fall breaks a retinue.",
    briefing: "Three chiefs sit at the table, each with three or four of his own. The best order is the heavy man with the pavise first, then the smoke-hand, last the bomb-thrower. Each chief that falls breaks his men. Fall them in that order for a bonus. The last chief left will ring the alarm if he can.",
    twist: "Three bosses. Each one that falls breaks that boss's men. The named order pays a bonus.",
    result: {
      win: "Three bosses are down and their men are on their knees. {P} says there is one street now, and one set of rules.",
      loss: "The cellar closed on you. The bosses walked out, and the street is theirs. {P} sends word to stay away.",
      withdrew: "{L} walked out of the summit before it ended. The bosses went on arguing without you."
    },
    patronLine: {
      offer: "“Three bosses, one cellar. When the knives come out, I need someone who can finish it.”",
      thanks: "“The Skulk's first summit was loud, too. This one will be quieter, thanks to you.”",
      angry: "“Three bosses and you left two standing. Do not come back.”"
    }
  },

  slaveMarket: {
    title: "The Slave Market",
    note: "One site, two contracts: the band may be hired to guard the market, which is licensed work, or to raid it, which is against the Empire's law and only safe from the Free Lands side.",
    raid: {
      title: "Break the Market",
      patron: "The Speaker of the Exiles",
      brief: "A border-market slave sale is under way in Mercias: pens and stalls, and cages full of people who were free last month. The Empire licensed it, so this raid is a crime on the Empire's side of the border. Storm the plaza, open the pens, and break the Guild Master before the roll call marches them away.",
      hud: "Free the pens before the roll call ends. Break the Guild Master.",
      briefing: "The market stands in Mercias. Six to eight pens hold the captives, and guild guards in black armour hold the stalls. A guild master runs the block. Free the pens and the people walk to the road. Break the master and the roll-call timer ends. This is a crime on the Empire's side of the border: you will be hunted for it.",
      twist: "Free the pens before the roll call marches them away.",
      result: {
        win: "The cages are open and the plaza is silent. The captives walk out into the streets, and the guild keeps its distance. {P} says the Exiles will not forget this.",
        loss: "The guards held the stalls and the market kept its cages. {P} says the Exiles will not forget this either.",
        withdrew: "{L} left the market. The auction went ahead, and the Exiles heard the bidding."
      },
      patronLine: {
        offer: "“There is a slave sale at a border market in Mercias. Our people are in the cages. We do not ask you to be kind. We ask you to be fast.”",
        thanks: "“They are free. We have little to give, but what we have is yours.”",
        angry: "“You knew they were in there.”"
      }
    },
    defend: {
      title: "Guard the Market",
      patron: "A Guild Factor",
      brief: "A Flesh Guild border-market slave sale is under way in Mercias, licensed by the Empire. Lamp-smoke, wet straw, iron on the wagon rails: a sale that runs from dawn to the last bell. A raid is expected. Hold the plaza, keep the pens shut, and see that nothing leaves them but the buyers' lots.",
      hud: "Hold the plaza. Keep the pens shut. Guard the lots.",
      briefing: "The Free Lands will send raiders to free the captives. Hold the pens and the convoy for the whole sale. The air is thick with lamp-smoke and wet straw, and under the buyers' talk you can hear chain on the wagon rails. Every captive freed costs you part of the pay. The guild asks nothing else of you, and pays on time. You are being paid to keep people in cages. Know that before you sign.",
      cost: "The Suderian Freemen will mark this against you. Every guild job you take counts for them, and a win here costs you standing with them.",
      ambience: [
        "Chain on a wagon rail. Somebody coughs, and nobody answers.",
        "The auctioneer's patter is bright and steady. Under it, a child asks for water.",
        "The air smells of lamp-smoke, wet straw and trodden mud.",
        "A buyer laughs, and the sound goes flat in the plaza."
      ],
      twist: "The same ground, played from the other side.",
      result: {
        win: "The raid broke on the plaza and the market opened on time. {P} pays in full, with the manner of a man settling a small debt. Somewhere beyond the road, the Suderian Freemen write your company's name in a different book.",
        loss: "The raiders reached the pens and the cages stood open at the end. {P} says the guild will not hire you again, and does not raise his voice.",
        withdrew: "{L} left the plaza. The market closed for the day, and the guild keeps accounts."
      },
      patronLine: {
        offer: "“The Empire licensed this market, and the charter is in my pocket. Raiders will not respect it. Will you? I pay in full, on the day, and I do not ask what you think of the work.”",
        thanks: "“The guild pays its guards. You are paid. We will not need to speak of it, and neither, I think, will you.”",
        angry: "“You were hired to hold a plaza. Remember that, when you are asked for work again, and when the other side asks you what you did.”"
      }
    }
  },

  fleshGuilds: {
    name: "The Flesh Guilds",
    patron: "A Guild Factor",
    folk: "Flesh Guild guards",
    subtitle: "The Empire's chartered slavers",
    blurb: "Slave-trading syndicates chartered by the Empire. Guards wear black armour with manacle-chain sashes. Masters wear only the sash. They trade in captives of any people, non-humans first.",
    voice: [
      "“Everything has a price. Including your objections.”",
      "“The charter says what the charter says.”",
      "“We do not hurt our goods. We sell them.”",
      "“A guard is paid to be counted. So is a lot.”"
    ],
    standing: {
      "-3": "The Flesh Guilds have marked your name for the next convoy.",
      "-2": "The Flesh Guilds will not deal with you, and will not forget you.",
      "-1": "The Flesh Guilds are watching your company.",
      "0": "The Flesh Guilds know your company only by report.",
      "1": "The Flesh Guilds treat you as a useful sword.",
      "2": "The Flesh Guilds speak well of your company to the right people.",
      "3": "The Flesh Guilds count you a friend, in the way they count anything."
    },
    gain: "The Flesh Guilds note your work: +1 Standing.",
    loss: "The Flesh Guilds take note. Standing falls.",
    note: "Whoever hires the band for the market, the other side remembers.",
    perk: {
      name: "Chartered Convoy",
      line: "Once a season, the first escort or extract job pays 15% more. The guild pays its friends, and keeps its accounts.",
      allied: "At Allied (+2).",
      note: "[S] The 15% is Systems' draft. Deliberately dull: no flavour that makes the guilds attractive. Narrative and Patrick may prefer no perk at all, since the Dust Cloaks' founders oppose slavery."
    }
  }
};

/* ---- Open questions (recommended first) ----
   1. Is "the Free Lands" the same faction as `suderia` (Systems asked)? Recommended: yes. Suderia is the whole league of free lands (R-024, R-035), anti-slavery in the Manual; one faction, one set of lines.
   2. Should the market's defend side carry a stronger note on the contract card? Recommended: keep the plain briefing line, "You are being paid to keep people in cages. Know that before you sign." No jokes, no reward flavour.
   3. Chartered Convoy perk: drafted in fleshGuilds.perk, flat and dull on purpose. Recommended: keep it, or drop it if Patrick prefers no perk for the slavers.
*/

