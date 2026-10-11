/* Theme draft: an animal market town under the shadow of the Avian Ascendancy.
   Every name here is a placeholder to rename freely. Load it with ?theme=riverfair */
window.THEME = {
  id: 'riverfair',
  name: 'Riverfair',
  eyebrow: 'A market race beneath the Avian Ascendancy',
  headline: 'Five Gold Feathers, one market town',
  lede: "The Ascendancy's envoy has come down to Riverfair, and the town's traders want her favour. Push your handcart from stall to stall with four apprentices in tow, buy low, sell high, and earn Gold Feathers. The first trader to hold five (six with two players) ends the game.",
  foot: 'A fan retheme of the rules of Istanbul by Rüdiger Dorn, for personal play.',

  words: {
    cur: 'Coppers', curShort: 'c',
    ruby: 'Gold Feather', rubies: 'Gold Feathers',
    merchant: 'trader', merchants: 'traders',
    assistant: 'apprentice', assistants: 'apprentices',
    family: 'cousin',
    gov: 'Crow Clerk', smug: 'Fox',
    govName: 'Clerk Nelfar', govTitle: 'Clerk Nelfar Corbow, Crow of the Ascendancy',
    smugName: 'Rennick', smugTitle: 'Rennick, Fox Smuggler',
    kingName: 'Lady Shavala', kingTitle: 'Lady Shavala Kartil, Heron Envoy of the Ascendancy',
    neutral: 'Gutterlane Peddler',
    cart: 'handcart', ext: 'handcart extension',
    king: 'Heron Envoy',
    tile: 'lodge badge', tiles: 'lodge badges',
    market: 'market town',
    card: 'favour card', cards: 'favour cards',
    coffee: 'tea', coffeeLong: 'mushroom tea',
    trader: 'Tea-Seller', traderName: 'Sorrel', traderTitle: 'Sorrel, Squirrel Tea-Seller',
    guildCard: 'guild card', guildCards: 'guild cards',
    orders: 'Orders'
  },

  goods: { r: 'Wool', g: 'Herbs', y: 'Honey', b: 'Pearls' },

  places: {
    1:  { name: "Bodkin's Cartwright", short: 'Cartwright',
          desc: 'Pay 7 Coppers to add a crate to your handcart, so you can carry one more of each good. Your third crate also earns a Gold Feather.' },
    2:  { name: 'Wool Loft', short: 'Wool Loft', desc: 'Fill your Wool to capacity.' },
    3:  { name: 'Herb Cellar', short: 'Herb Cellar', desc: 'Fill your Herbs to capacity.' },
    4:  { name: 'Hive Barn', short: 'Hive Barn', desc: 'Fill your Honey to capacity.' },
    5:  { name: 'Pigeon Roost', short: 'Pigeon Roost',
          desc: 'Take the four goods and coins the pigeons have brought, then the next post comes in and shows something different.' },
    6:  { name: 'Wayfarers’ Inn', short: 'Inn',
          desc: 'Take 2 favour cards (from the pile or the top of the discards), then discard 1.' },
    7:  { name: 'Town Well', short: 'Town Well',
          desc: 'Call all your apprentices home. You need no apprentice here and pay no other traders.' },
    8:  { name: 'Rat Alley', short: 'Rat Alley',
          desc: 'Take 1 Wool, Herbs or Honey, then roll for Pearls: 7–8 gives 1, 9–10 gives 2, 11–12 gives 3.' },
    9:  { name: 'Knucklebone Tavern', short: 'Tavern',
          desc: 'Name a number from 3 to 12 and roll two dice. Meet or beat it to take that many Coppers; otherwise take 2.' },
    10: { name: 'Grand Market', short: 'Grand Market',
          desc: 'Sell 1–5 goods shown on the order board. Selling 1/2/3/4/5 pays 3/7/12/18/25 Coppers.' },
    11: { name: 'Riverside Stalls', short: 'Riverside',
          desc: 'Sell 1–5 goods shown on the order board. Selling 1/2/3/4/5 pays 2/5/9/14/20 Coppers.' },
    12: { name: 'Watch House', short: 'Watch House',
          desc: 'If your cousin is here, send them to any other place and take that action there for free.' },
    13: { name: "Envoy's Aerie", short: 'Aerie',
          desc: 'Deliver the listed goods to Lady Shavala Kartil, Heron Envoy of the Ascendancy, for a Gold Feather. Every Feather given makes the next one ask for one more good.' },
    14: { name: 'Wool & Herb Lodge', short: 'Wool & Herb Lodge',
          desc: 'Carry enough Wool or Herbs to earn that lodge badge, pay one of the goods, and gain its perk. Holding both badges here earns a Gold Feather.' },
    15: { name: 'Honey & Pearl Lodge', short: 'Honey & Pearl Lodge',
          desc: 'Carry enough Honey or Pearls to earn that lodge badge, pay one of the goods, and gain its perk. Holding both badges here earns a Gold Feather.' },
    16: { name: "Madame Glimmer's Hoard", short: "Glimmer's Hoard",
          desc: 'Madame Glimmer, a magpie of expensive tastes, sells a Gold Feather for the price shown. Every purchase raises the price by 1 Copper.' },
    17: { name: 'The Mushroom Roastery', short: 'Roastery',
          desc: 'Do 1 to 3 of these, each once: pay 2 Coppers, pay 1 good, or give up a favour card. Each brews 2 mushroom tea.' },
    18: { name: 'Guild Hall', short: 'Guild Hall',
          desc: 'Take 1 mushroom tea. (Preview: guild cards arrive in the next update.)' },
    19: { name: 'The Gutterlane Snug', short: 'Gutterlane Snug',
          desc: 'Slip the regulars some tea for the Barrier, a Snug favour or a Gold Feather. (Preview: opens in a later update.)' },
    20: { name: 'The Tea House', short: 'Tea House',
          desc: 'Serve mushroom tea for a Gold Feather. The first costs 6 tea, and each Feather taken makes the next cost 1 more.' }
  },

  cards: {
    good:    { name: 'Spare crate',     text: 'Gain 1 good of your choice (not during an action).' },
    lira5:   { name: 'Purse of coppers', text: 'Take 5 Coppers.' },
    dSultan: { name: "Shavala's ear", text: "At the Envoy's Aerie, deliver a second time. Offered during that action." },
    dPost:   { name: 'Second post',     text: 'At the Pigeon Roost, take the action a second time. Offered during that action.' },
    dGem:    { name: "Glimmer's mood",  text: "At Madame Glimmer's Hoard, buy a second Gold Feather. Offered during that action." },
    family:  { name: 'Bail out cousin', text: 'Send your cousin back to the Watch House and take a reward: 3 Coppers or a favour card.' },
    stay:    { name: 'Hold the stall',  text: "Don't move this turn. You still leave an apprentice where you are." },
    move34:  { name: 'Shortcut',        text: 'Move 3 or 4 places this turn instead of 1 or 2.' },
    recall:  { name: 'Whistle',         text: 'Before moving, call 1 apprentice home.' },
    smAny:   { name: 'Haggle',          text: 'At the Riverside Stalls, sell any types of goods. Offered during that action.' },
    tea2:    { name: 'Spare pouch',     text: 'Take 2 mushroom tea.' },
    tea8:    { name: 'Sell a brew',     text: 'Pay 1 mushroom tea and take 8 Coppers.' },
    diceGift:{ name: 'Lucky bones',     text: 'Roll 2 dice and take a reward for each: 1 = 2 Coppers, 2 = Honey, 3 = Herbs, 4 = Wool, 5 = Pearls, 6 = tea.' },
    swap3:   { name: 'Swap meet',       text: 'Exchange up to 3 goods or tea for the same number of other goods or tea.' },
    six:     { name: 'Weighted bone',   text: 'After you roll the dice, turn one die to 6. Offered when you roll.' },
    corner:  { name: 'Back alleys',     text: 'Instead of moving 1 or 2 places, move to any corner place.' },
    dWain:   { name: "Bodkin's favour", text: "At Bodkin's Cartwright, take the action a second time. Offered during that action." },
    dCH:     { name: 'Second pot',      text: 'At the Tea House, take the action a second time. Offered during that action.' }
  },

  tileAbil: {
    r: 'At the Tavern and Rat Alley, once turn one die to 4 or re-roll both.',
    g: 'At a store, pay 2 Coppers for 1 extra good of any type.',
    y: 'Once per turn, pay 2 Coppers to call an apprentice home.',
    b: 'Gain your 5th apprentice right away.'
  },

  /* Storybook serif for place names and headings */
  fonts: { link: 'Alegreya:wght@500;700;800', display: "'Alegreya', Georgia, serif", tile: "'Alegreya', Georgia, serif" },

  aiNames: ['Bramble', 'Tansy', 'Fennel', 'Mossy', 'Sedge'],

  art: {
    tiles: {
      1: 'art/tiles/01-cartwright.webp',
      2: 'art/tiles/02-wool-loft.webp',
      3: 'art/tiles/03-herb-cellar.webp',
      4: 'art/tiles/04-hive-barn.webp',
      5: 'art/tiles/05-pigeon-roost.webp',
      6: 'art/tiles/06-inn.webp',
      7: 'art/tiles/07-town-well.webp',
      8: 'art/tiles/08-rat-alley.webp',
      9: 'art/tiles/09-tavern.webp',
      10: 'art/tiles/10-grand-market.webp',
      11: 'art/tiles/11-riverside-stalls.webp',
      12: 'art/tiles/12-watch-house.webp',
      13: 'art/tiles/13-envoys-aerie.webp',
      14: 'art/tiles/14-hall-wool-herbs.webp',
      15: 'art/tiles/15-hall-honey-pearls.webp',
      16: 'art/tiles/16-magpies-hoard.webp'
    },
    merchants: {
      red: 'art/standees/hedgehog.webp',
      green: 'art/standees/mouse.webp',
      yellow: 'art/standees/lizard.webp',
      teal: 'art/standees/jay.webp',
      white: 'art/standees/toad.webp'
    },
    icons: {
      wool: 'art/icons/wool.webp', herbs: 'art/icons/herbs.webp', honey: 'art/icons/honey.webp', pearls: 'art/icons/pearls.webp',
      any: 'art/icons/any.webp', feather: 'art/icons/feather.webp', coin: 'art/icons/coin.webp',
      apprentice: 'art/icons/apprentice.webp', cousin: 'art/icons/cousin.webp',
      card: 'art/icons/card.webp', charter: 'art/icons/charter.webp', crate: 'art/icons/crate.webp'
    },
    neutral: 'art/standees/rat.webp',   // the three neutral traders in 2-player games
    gov: 'art/standees/crow.webp',      // Crow Clerk
    smug: 'art/standees/fox.webp'       // Fox
  }
};
