/* ============================================================================
   CAMP_LINES: data only (Narrative Designer). First cut for Job 9, the living camp.
   Read by js/camp-life.js. No code in this file.

   Every exchange is [A, B]: A says the first line, B replies. One sentence each.
   Placeholders: {A} and {B} the two speakers, {C} the contract name,
   {D} the mate who died or was promoted.

   shared[host][outcome]   host = HOSTS key, outcome = win | loss | withdrew
   grief.bond / grief.plain   a mate has fallen ({D}); bond = a Comrade bond
   promoted                a mate was promoted ({D})
   pair["RACE_A|RACE_B"]   optional race-pair banter (either order may be used)
   cls["CLASS_A|CLASS_B"]  optional class-pair banter
   ============================================================================ */
window.CAMP_LINES = {

  shared: {
    any: {
      win: [
        ["{C} is done. I will take the quiet.", "Take it. It will not last."],
        ["Nobody died. I keep checking.", "Check again at dawn. I will."],
        ["The patron will say it was easy.", "The patron was not there. Drink."]
      ],
      loss: [
        ["That went wrong in a dozen small ways.", "And one large one. Eat first, count later."],
        ["We will do better next time.", "We will if there is a next time. Pass the bandages."],
        ["I cannot say what happened at {C}.", "Then do not. We were all there."]
      ],
      withdrew: [
        ["We pulled out. That was sense, not shame.", "Say it again until I believe it."],
        ["Half pay is half pay.", "It is also half a night's sleep. Take it."],
        ["Nobody is saying a word about {C}.", "Good. Keep it that way until the stew."]
      ]
    },
    hollow: {
      win: [
        ["Did you see their faces when the bell stopped?", "I tried not to. They were somebody's field-hands."],
        ["{C} is done. The levy walked home.", "Good. I would rather feed them than bury them."]
      ],
      loss: [
        ["They kept coming, even when they could not stand.", "Someone was driving them. That is what I cannot forgive."],
        ["I do not want to talk about {C}.", "Then do not. Eat something."]
      ],
      withdrew: [
        ["We left the levy to their reeve.", "We left them hungry, you mean."],
        ["It was the right call on {C}.", "It was a call. I will sleep on the rest."]
      ]
    },
    bandits: {
      win: [
        ["Clean work on {C}. They ran like rabbits.", "Rabbits with knives. Count your fingers."],
        ["Their camp had better boots than ours.", "Not any more. Sit down and try them."]
      ],
      loss: [
        ["Highwaymen. Highwaymen did that to us.", "Highwaymen who knew the ground. Next time we know it too."],
        ["I would rather not tell the patron.", "He will hear it from the road anyway."]
      ],
      withdrew: [
        ["We could have taken them.", "Could have. Might have. {C} was not worth the graves."],
        ["They laughed when we left.", "Let them. They will be less funny with an empty larder."]
      ]
    },
    greenskins: {
      win: [
        ["Their huts burned well.", "Smelled like a tannery on fire. I want a bath."],
        ["How many of those did you count?", "I stopped at forty. They kept coming."]
      ],
      loss: [
        ["Those little fiends had a drum and a plan.", "Funny how it is always the drum that breaks the line."],
        ["I am still finding spears in my pack.", "Take it as a gift. They will want them back."]
      ],
      withdrew: [
        ["Do you think they will follow us?", "Not tonight. They are busy fighting over our loot."],
        ["We lost the road, not the war.", "Say that to the cook, who lost the pot."]
      ]
    },
    monsters: {
      win: [
        ["It took four of us to turn it over.", "And one of us to say it was dead. Poke it again."],
        ["I want the pelt.", "You can have the pelt. I want a doctor."]
      ],
      loss: [
        ["Something is out there that does not want us.", "Something is out there that is hungry. Different thing."],
        ["I could hear it breathing.", "Stop. I will not sleep."]
      ],
      withdrew: [
        ["Nobody said it would be that big.", "Nobody ever does. Pass the ale."],
        ["It let us go.", "It let us go because it had eaten. Do not make a story of it."]
      ]
    },
    deserters: {
      win: [
        ["They fought like soldiers, not like deserters.", "They were soldiers. Somebody forgot to tell them they had left."],
        ["I did not like putting them down.", "Nobody does. Take the ration tins."]
      ],
      loss: [
        ["That volley came in on a count.", "They have not forgotten their drill, only their orders."],
        ["They held the line without a captain.", "Then we were beaten by sergeants. That is worse."]
      ],
      withdrew: [
        ["We could have talked to them.", "We tried. They had a crossbow for each of us."],
        ["I knew one of them.", "Then it was good we left. Drink."]
      ]
    },
    orcs: {
      win: [
        ["They broke our shield line twice before it held.", "Then it held. Say it again, it sounds nice."],
        ["Their khan's banner is on the wagon.", "Take it down before the lads start singing about it."]
      ],
      loss: [
        ["I can still hear the drums.", "Then you are alive. The drums are a gift to the living."],
        ["That was not a warband. That was a flood.", "A flood with axes. Dry your boots."]
      ],
      withdrew: [
        ["They let us walk away.", "They are good at that. It is called respect, or hunger."],
        ["Half pay is a poor consolation.", "It is half more than the dead are getting."]
      ]
    },
    arcana: {
      win: [
        ["Their wards cracked like glass.", "And the lockboxes were full. The patron will be pleased."],
        ["I did not know a hex could smell like burnt sugar.", "Burnt sugar and iron. I will dream of it."]
      ],
      loss: [
        ["I cannot feel my fingers.", "That is the hex. It wears off. Mostly."],
        ["They did not even raise their voices.", "Of course not. They had a licence."]
      ],
      withdrew: [
        ["We should not have gone near the spires.", "We should not have taken the job. Too late for that."],
        ["Did you see their rings?", "I saw one. It was enough."]
      ]
    }
  },

  grief: {
    bond: [
      ["{D} would have laughed at all of this.", "They would. And then they would have asked who was buying."],
      ["I keep turning to say something to {D}.", "So do I. Say it to me. I will pretend."],
      ["We had a bond. I feel it like a missing tooth.", "Keep your tongue away from the gap and eat."],
      ["{D} owed me a drink.", "Then we owe {D} one. Pour."],
      ["I never told {D} what I thought of them.", "They knew. It was on your face every morning."],
      ["The bond is gone. The quiet is loud.", "It goes quieter in a week. Never gone, only quieter."]
    ],
    plain: [
      ["Did anyone know {D} well?", "Well enough to miss. Not well enough to stop eating."],
      ["{D} kept good watch.", "They did. Take their shift, and do it as well."],
      ["We should say something for {D}.", "Say it quietly. Then say it again tomorrow."],
      ["Whose turn is it to carry {D}'s kit?", "Mine. I do not mind."],
      ["I did not like {D}, and I am sorry.", "You are allowed both."],
      ["Another name for the board.", "Another page for the Scribe. Do not think about the next."]
    ]
  },

  promoted: [
    ["Look who {D} has become.", "Do not tell {D}. They will start giving orders."],
    ["{D} got the rank. I got the duty.", "That is how rank works. Congratulations."],
    ["I never doubted {D}.", "You doubted {D} loudly, for a year."],
    ["Does {D} get a bigger tent?", "{D} gets a bigger problem. Same tent."],
    ["That promotion was earned.", "It was paid for in blood. Be glad for them anyway."],
    ["Mind the new stripes, {D} is watching.", "Everyone is watching. Stand straight and nobody will notice."]
  ],

  pair: {
    "HUMAN|ORC": [
      ["Do orcs really ride from dawn to dusk?", "Humans really sit from dusk to dawn?"],
      ["Your cooking smells of smoke.", "Your cooking smells of nothing. That is worse."],
      ["I have a horse back home, you know.", "I have a hundred. Do not tell me about your horse."]
    ],
    "DWARF|GNOME": [
      ["Nice work on that mechanism.", "Nice price on that mechanism, you mean."],
      ["You owe me protection money.", "I have been paying for the privilege of your company. Still no receipt."],
      ["Why do you carry that many tools?", "Because you never carry enough."]
    ],
    "SUN_ELF|DARK_ELF": [
      ["The stars here are a disgrace.", "The ground is a worse one. Look down, not up."],
      ["I would almost like to talk to you.", "Almost. I will leave the door open."],
      ["Your people ran a very orderly war.", "Yours ran very quickly. Different virtue."]
    ],
    "GREY_ELF|HUMAN": [
      ["You humans are in such a hurry.", "You elves have been here ten thousand years. What have you finished?"],
      ["I have read about this.", "I have done it. Pass the salt."],
      ["Someone is wrong about the route.", "It is you. Kindly walk faster."]
    ],
    "GNOME|HALFLING": [
      ["Where did you get that pie?", "Where did you get that purse?"],
      ["Do you ever stay put?", "Do you ever stay honest?"],
      ["Short folk should stick together.", "Short folk should stick to the shade."]
    ],
    "HALF_ELF|HUMAN": [
      ["Do you ever feel in between?", "Every day. At least the bread is the same."],
      ["You look younger than you did last year.", "I look the same. You look older. Do the sum."],
      ["Which side of the family do you take after?", "The one that did not ask."]
    ]
  },

  cls: {
    "DEVOUT|OUTCAST": [
      ["I will pray for you.", "Pray quietly. They are watching."],
      ["Kai does not forget the lost.", "Kai has never met my landlord."],
      ["There is room at the shrine.", "There is room at the fire. I will stay by that."]
    ],
    "FREEMAN|SLAVE": [
      ["Sit down. You do not need to stand for me.", "Old habit. I am working on it."],
      ["No one here owns you.", "I know. I check every morning."],
      ["Tell me if anyone gives you trouble.", "I will tell you if I need a hand. I would rather not need one."]
    ],
    "NOBLE|OUTCAST": [
      ["I have never eaten off a plank before.", "Then you are fortunate. The plank is the best thing here."],
      ["My father would faint.", "Your father is not here. Pass the bread."],
      ["Do you think I am soft?", "I think you are learning. Hold the pot."]
    ],
    "EDELOS|FREEMAN": [
      ["I can get you better rope for half the price.", "You can also get me a worse knot for double the lie."],
      ["Which wagon is yours?", "The one with the paint. Everyone asks."],
      ["Do you trust anyone?", "I trust a fair price. Let me start there."]
    ],
    "DEVOUT|NOBLE": [
      ["Have you given thanks today?", "I have given orders. It is similar."],
      ["The temple would welcome your coin.", "The temple has always welcomed my coin. It has never given change."],
      ["Humility is a virtue.", "I am humble about everything except the wine."]
    ]
  }
};
