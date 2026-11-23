/* ============================================================================
   ARC_LINES: data only (Narrative Designer). Job 10, patron and faction arcs.
   Read by js/arcs.js. No code in this file.

   Shape (audits/fable/arcs.md):
     ARC_LINES[faction] = { title, steps: { s1, s2w, s2c, s3ww, s3wc, s3cw, s3cc }, reward: {warm, cold} }
     STEP = { title, obj, host, place, brief, result: { win, loss, withdrew } }
   Step names: s1 first contract; s2w after a win, s2c after a loss or withdrawal;
   s3xy = second result x then third result y (w warm/win, c cold).
   Tokens: {P} patron, {F} faction, {L} leader name, {C} contract title.
   Objectives and hosts are real game keys. Places come from PLACES.
   Factions: mendor, reprobates, skulk, suderia (the Free Lands, the Suderian Freemen).
   Lore: R-023 (Collective and Guild), R-066 (dwarves), R-102 (the Emperor and the fragments).
   House style: British spelling, no em dashes.
   ============================================================================ */
window.ARC_LINES = {

  /* ---------------------------------------------------------------- Mendor */
  mendor: {
    title: "The Order's Shard",
    steps: {
      s1: {
        title: "A Shard Gone Missing", obj: "relic", host: "bandits", place: "Blackmire",
        brief: "{P} lost a shard of the Overgod to thieves who sold it on. Find the bandit camp in {C} and bring it back.",
        result: {
          win: "The shard is back in its box. {P} counts it twice and thanks {L} in the voice of a man who does not thank often.",
          loss: "The thieves kept the shard and most of the camp. {P} asks, politely, whether {L} would like to try again.",
          withdrew: "{L} left the camp unsearched. The shard is still out there, and {P} says so."
        }
      },
      s2w: {
        title: "The Buyer at Harrowgate", obj: "hunt", host: "freecompany", place: "Harrowgate",
        brief: "The thieves named a buyer, a free company in {C}. Break their captains before the shard changes hands again.",
        result: {
          win: "The captains are down and the buyer's ledger is in {L}'s pack. {P} is pleased and slightly alarmed at the names in it.",
          loss: "The free company held. {P} learns the buyer slipped away with the shard at dusk.",
          withdrew: "{L} backed off the buyers. {P} says the Order can be patient, but not for long."
        }
      },
      s2c: {
        title: "The Trail Goes Cold", obj: "relic", host: "monsters", place: "the Gloamwald",
        brief: "The shard was dragged into a beast's den in {C}. {P} wants it recovered without waking whatever sleeps there.",
        result: {
          win: "The den is quiet and the shard is in {L}'s hand. {P} does not ask how.",
          loss: "Whatever lives in the Gloamwald kept its bone-pile. {P} writes the shard off, then writes it back on.",
          withdrew: "{L} left the den and its guest alone. {P} calls it wisdom and hopes it is."
        }
      },
      s3ww: {
        title: "The Shard Comes Home", obj: "escort", host: "deserters", place: "Coldwater",
        brief: "Escort the shard to the Mendor ferry through {C}. Frost-Vault deserters hold the road, and they want a price.",
        result: {
          win: "The shard reaches the ferry at dawn. The priests sing, badly and sincerely, and pay in full.",
          loss: "The convoy was turned back at the ford. The shard sits in a cart outside Coldwater and {P} sits in a worse mood.",
          withdrew: "{L} left the road and the cart to the deserters. {P} will not forgive it soon."
        }
      },
      s3wc: {
        title: "Ambush at the Ford", obj: "hold", host: "bandits", place: "Kettle Ford",
        brief: "Thieves learned the route. Hold the ford at {C} until {P}'s couriers pass.",
        result: {
          win: "The ford held and the couriers crossed. {P} sends a scribe to record the name of {L}'s company.",
          loss: "The ford fell and the couriers turned back. Half the shard's escort is bleeding in the reeds.",
          withdrew: "{L} withdrew from the ford. The couriers crossed anyway, by luck and a prayer."
        }
      },
      s3cw: {
        title: "The Last Buyer", obj: "extract", host: "freecompany", place: "Brackenridge",
        brief: "One buyer still has the shard in {C}. Bring out the shard and the man holding it.",
        result: {
          win: "The buyer is in irons and the shard is in a lined case. {P} files the paperwork before {L} finishes the story.",
          loss: "The buyer ran and the shard went with him. {P} says nothing, which is worse.",
          withdrew: "{L} walked away from the buyer. {P} marks the shard as lost."
        }
      },
      s3cc: {
        title: "A Poorer Return", obj: "sabotage", host: "arcana", place: "Hollowmere",
        brief: "The Guild has the shard now, and is studying it in {C}. Wreck the study before it learns anything.",
        result: {
          win: "The workshop is ash. The shard survived, and {P} takes it without a word of thanks, then a word of thanks.",
          loss: "The Guild kept the shard and the workshop. {P} writes to the Emperor's office, and no one writes back.",
          withdrew: "{L} left the Guild to its work. {P} watches the road for months afterwards."
        }
      }
    },
    reward: {
      warm: "{P} gives {L}'s company a reliquary ward, blessed at the Overgod's altar, for every good deed done. It will hold when steel does not.",
      cold: "{P} sends a small gift of blessed cloth and a smaller apology. The Order remembers. It does not forget."
    }
  },

  /* ------------------------------------------------------------ Collective */
  reprobates: {
    title: "The Collective's Debt",
    steps: {
      s1: {
        title: "A Hedge-Mage in Hiding", obj: "escort", host: "arcana", place: "Greyfen",
        brief: "{P} has a hunted caster hiding in {C}. Get her to the Free Lands before the Inquisitors close the road.",
        result: {
          win: "She crossed the border with her books and her nerves. {P} calls it a debt paid and a debt begun.",
          loss: "The enforcers took the road. {P} hears she was branded and says the Collective will not forget it.",
          withdrew: "{L} gave up the road. {P} will find another escort and remember who was not one."
        }
      },
      s2w: {
        title: "The Formula Wagon", obj: "extract", host: "arcana", place: "the Dunmarch",
        brief: "The Guild confiscated a wagon of formulae in {C}. {P} wants it back, books and all.",
        result: {
          win: "The wagon rolls out of the Dunmarch with half the Guild's seals still on the crates. {P} lights a lamp.",
          loss: "The Guild burned the wagon rather than lose it. {P} says a long silence and then a short curse.",
          withdrew: "{L} left the wagon to the Guild. {P} says the formulae will be rewritten from memory, slowly."
        }
      },
      s2c: {
        title: "A Quiet Debt", obj: "hold", host: "bandits", place: "Wyrmhollow",
        brief: "The Collective's safehouse in {C} is under threat. Hold it until the casters can leave.",
        result: {
          win: "The safehouse stood and the casters slipped away at night. {P} sends flowers, which is strange and kind.",
          loss: "The safehouse fell. {P} counts the survivors and finds the number poor.",
          withdrew: "{L} left the safehouse to its fate. {P} will not ask again for a long while."
        }
      },
      s3ww: {
        title: "The Free Lands Offer a Lamp", obj: "escort", host: "arcana", place: "Coldwater",
        brief: "Take a caravan of Collective students to safety in the Free Lands through {C}.",
        result: {
          win: "The students crossed under a Free Lands flag. {P} says the Collective will teach {L}'s company one useful trick.",
          loss: "The caravan was cut off at Coldwater. {P} writes the dead into the Collective's list.",
          withdrew: "{L} turned back with the caravan unfinished. {P} calls it prudent and means it, a little."
        }
      },
      s3wc: {
        title: "Nobody Asks For a Licence", obj: "sabotage", host: "arcana", place: "Ravensreach",
        brief: "Wreck the Guild's licensing office in {C}, so its records of hedge-mages burn.",
        result: {
          win: "The office burned and its ledgers with it. {P} calls it the happiest fire in a century.",
          loss: "The enforcers held the office. {P} says the lists are intact, and so are the hunters.",
          withdrew: "{L} left the office standing. {P} says the Collective will find another way."
        }
      },
      s3cw: {
        title: "A Debt Called In", obj: "relic", host: "monsters", place: "the Mournwood",
        brief: "A Collective cache lies in a beast's den in {C}. Recover the books before the Guild finds them.",
        result: {
          win: "The books are out, oily and intact. {P} thanks {L} with a smile that costs nothing and means a great deal.",
          loss: "The den kept the cache. {P} says some knowledge sleeps better where it is.",
          withdrew: "{L} left the books. {P} says the Guild will not find them either, probably."
        }
      },
      s3cc: {
        title: "The Cabal Takes Its Cut", obj: "purge", host: "cabal", place: "Hollowmere",
        brief: "A Reprobate cabal has gone bad in {C}, feeding the wrong people the wrong secrets. Burn out the nests.",
        result: {
          win: "The cabal is broken. {P} says the Collective cleans its own house, but is grateful for the broom.",
          loss: "The cabal held. {P} warns that it will hear of this, and so will others.",
          withdrew: "{L} left the cabal alone. {P} says the Collective has shed worse."
        }
      }
    },
    reward: {
      warm: "{P} gives {L}'s company an alchemist's formula, a blast that makes noise, light and a great deal of dust. The Collective does not give these lightly.",
      cold: "{P} sends a recipe for something safe and dull. The Collective will not forget, but it will not volunteer."
    }
  },

  /* ----------------------------------------------------------------- Skulk */
  skulk: {
    title: "The Skulk's Errand",
    steps: {
      s1: {
        title: "The Syndicate's Collector", obj: "ambush", host: "bandits", place: "Kettle Ford",
        brief: "A dwarf syndicate's collectors are squeezing the Skulk's street-folk in {C}. Intercept their wagon.",
        result: {
          win: "The wagon is empty and the collectors are tied to it. {P} sends a boy with a message, and the boy runs.",
          loss: "The wagon got through. {P} hears the collectors laughing in the tavern and says nothing.",
          withdrew: "{L} let the wagon pass. {P} says the Skulk will remember the courtesy."
        }
      },
      s2w: {
        title: "A Ledger Worth Burning", obj: "extract", host: "freecompany", place: "Harrowgate",
        brief: "The syndicate keeps its debtors' ledger in a counting-house in {C}. Bring out the ledger.",
        result: {
          win: "The ledger is out, and half the street's debts with it. {P} says the Skulk keeps its word, and its secrets.",
          loss: "The counting-house held. {P} says the Skulk will try the keyhole, then the roof.",
          withdrew: "{L} left the ledger. {P} says there is always another night."
        }
      },
      s2c: {
        title: "A Quiet Retaliation", obj: "hold", host: "bandits", place: "the Saltmarsh",
        brief: "The syndicate's muscle came for the Skulk's mail-house in {C}. Hold it until the post goes out.",
        result: {
          win: "The mail went out at dawn with every letter intact. {P} says that is the one thing the Skulk does honestly.",
          loss: "The mail-house burned. {P} says the Skulk can rebuild, but not forgive.",
          withdrew: "{L} left the mail-house. {P} says the street remembers who stayed."
        }
      },
      s3ww: {
        title: "The Counting-House Falls", obj: "breach", host: "freecompany", place: "Brackenridge",
        brief: "The syndicate's last counting-house stands in {C}. Storm it and hold the courtyard until the debtors walk free.",
        result: {
          win: "The doors are open and the debtors are out. {P} says the Skulk has few friends, and {L} is one.",
          loss: "The counting-house held. {P} writes the dead into a ledger the syndicate will never read.",
          withdrew: "{L} backed off. {P} says the Skulk will wait, and so will its ledger."
        }
      },
      s3wc: {
        title: "A Street Without a Boss", obj: "hunt", host: "bandits", place: "Kettle Ford",
        brief: "The syndicate's enforcers have gone rogue in {C}. Find and break every one before the street burns.",
        result: {
          win: "The enforcers are gone and the street breathes. {P} says the Skulk does not do thanks, but does remember.",
          loss: "The enforcers scattered. {P} says they will be back, wearing someone else's colours.",
          withdrew: "{L} let them go. {P} says the street will manage, for a while."
        }
      },
      s3cw: {
        title: "A Debt Paid in Mail", obj: "escort", host: "bandits", place: "Coldwater",
        brief: "Escort the Skulk's mail-cart through {C}. It carries more than letters, and more than {P} will say.",
        result: {
          win: "The cart arrived with every sealed bag. {P} says some messages would have cost lives if lost.",
          loss: "The cart was taken. {P} says the Skulk will read whatever the thieves read.",
          withdrew: "{L} left the cart. {P} says the mail always finds a way, and so does the Skulk."
        }
      },
      s3cc: {
        title: "A Poor Night's Work", obj: "sabotage", host: "freecompany", place: "Ravensreach",
        brief: "Wreck the syndicate's strongroom in {C}. Take nothing but time.",
        result: {
          win: "The strongroom is wrecked and the syndicate will spend a month on repairs. {P} calls it enough.",
          loss: "The guards held the strongroom. {P} says the Skulk lost a good night and a poor idea.",
          withdrew: "{L} walked from the strongroom. {P} says the Skulk will forget this by spring, perhaps."
        }
      }
    },
    reward: {
      warm: "{P} gives {L}'s company a standing watcher in the Skulk's network, a single bright mark on every map. The Skulk does not call it friendship. It is close.",
      cold: "{P} sends a coded note and a single coin. The Skulk does not forget, and does not forgive loudly."
    }
  },

  /* --------------------------------------------------- The Free Lands */
  suderia: {
    title: "The Free Lands' Charter",
    steps: {
      s1: {
        title: "Captives on the Border Road", obj: "rescue", host: "deserters", place: "Coldwater",
        brief: "Deserters took a Free Lands wagon of freed captives in {C}. {P} wants them back, and unharmed.",
        result: {
          win: "The captives are out and the wagon is rolling. {P} writes {L}'s company into the Free Lands' ledger.",
          loss: "The deserters kept the captives. {P} sends a note: the Free Lands do not give up on their own.",
          withdrew: "{L} left the captives. {P} says the Free Lands will remember who walked away."
        }
      },
      s2w: {
        title: "The Border Crossing", obj: "hold", host: "orcs", place: "the Gallows Hills",
        brief: "A Steppe Orc warband is testing the Free Lands' border post in {C}. Hold the crossing until the militia arrives.",
        result: {
          win: "The crossing held and the militia arrived to cheer it. {P} says the Free Lands have too many councils, but this one agreed on a toast.",
          loss: "The crossing fell, and the militia arrived to bury the dead. {P} thanks {L} for trying.",
          withdrew: "{L} left the post. {P} says the militia will manage, and does not sound sure."
        }
      },
      s2c: {
        title: "A Smaller Favour", obj: "escort", host: "bandits", place: "Kettle Ford",
        brief: "Escort a Free Lands delegate through {C}. {P} says it is a small job, and the road says otherwise.",
        result: {
          win: "The delegate arrived in Kalloon with all her papers. {P} says the Free Lands pay their debts slowly.",
          loss: "The delegate was robbed and shaken. {P} says the Free Lands pay their debts anyway.",
          withdrew: "{L} left the road. {P} says the delegate walked, which is somehow worse."
        }
      },
      s3ww: {
        title: "A Seat at the League", obj: "escort", host: "freecompany", place: "Brackenridge",
        brief: "Escort the Free Lands' charter envoys to Kalloon through {C}. A rival free company wants them stopped.",
        result: {
          win: "The envoys reached Kalloon and the charter was read aloud. {P} says {L}'s company has a name the League will say twice.",
          loss: "The envoys never arrived. {P} sends a letter that is both polite and cold.",
          withdrew: "{L} turned back. {P} says the League will find other friends."
        }
      },
      s3wc: {
        title: "Border Post Cleared", obj: "purge", host: "greenskins", place: "the Mournwood",
        brief: "Greenskin raiders nest near the border post in {C}. Burn out the nests.",
        result: {
          win: "The nests are ash and the post is quiet. {P} says the Free Lands look after their friends.",
          loss: "The raiders held their nests. {P} says the post will be patient.",
          withdrew: "{L} left the raiders. {P} says the post will burn them out itself, eventually."
        }
      },
      s3cw: {
        title: "A Second Chance at Kalloon", obj: "rescue", host: "bandits", place: "Harrowgate",
        brief: "Bandits took another Free Lands wagon in {C}. {P} offers {L}'s company a second chance.",
        result: {
          win: "The captives are free and the wagon is home. {P} says the Free Lands are slow to trust, and quick to forgive.",
          loss: "The wagon was lost. {P} says the Free Lands will not ask a third time.",
          withdrew: "{L} walked away again. {P} says the League has a long memory and a longer list."
        }
      },
      s3cc: {
        title: "A Debt of Sorts", obj: "hold", host: "orcs", place: "the Gallows Hills",
        brief: "The orcs are back at the border in {C}. Hold the line until {P}'s militia is ready.",
        result: {
          win: "The line held, and {P} calls it a start. The Free Lands will write it down as one.",
          loss: "The line broke. {P} says the Free Lands will remember, politely.",
          withdrew: "{L} left the line. {P} says the League understands, and sounds as if it does not."
        }
      }
    },
    reward: {
      warm: "{P} offers {L}'s company a freed captive who asks to join: a fighter with a debt to repay and a good reason to repay it. The Free Lands call it a charter.",
      cold: "{P} sends a letter of thanks, signed by someone junior. The Free Lands are polite, and they do not forget."
    }
  }
};
