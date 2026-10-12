/* Riverfair: every name, description and art path players see. */
window.THEME = {
  id: 'riverfair',
  name: 'Riverfair',
  eyebrow: 'Where small folk make their fortunes',
  headline: 'Fill your cart. Earn your feathers.',
  lede2: 'Push your handcart from stall to stall, leave apprentices behind to work, and race your rivals to the Gold Feathers.',
  lede: "The Ascendancy's envoy has come down to Riverfair, and the town's traders want her favour. Push your handcart from stall to stall with four apprentices in tow, buy low, sell high, and earn Gold Feathers. The first trader to hold five (six with two players) ends the game.",
  foot: 'Riverfair · a market race beneath the Avian Ascendancy.',

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
    coffee: 'mushrooms', coffee1: 'mushroom', coffeeLong: 'mushrooms',
    trader: 'Forager', traderName: 'Sorrel', traderTitle: 'Sorrel, Squirrel Forager',
    guildCard: 'guild card', guildCards: 'guild cards',
    barrier: 'barricade', ttile: 'Snug favour', ttiles: 'Snug favours', moveTile: 'Gutter map', encTile: 'Friends in low places', bribe: 'bribe slate',
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
    17: { name: 'Mushroom Grotto', short: 'Grotto',
          desc: 'The foragers trade from their damp little cave. Do 1 to 3 of these, each once: pay 2 Coppers, pay 1 good, or give up a favour card. Each gets you 2 mushrooms.' },
    18: { name: 'Guild Hall', short: 'Guild Hall',
          desc: 'Take 1 mushroom and draw 2 guild cards, then discard 1 guild card. On your turn you can play a guild card instead of moving.' },
    19: { name: 'Gutterlane Snug', short: 'Gutterlane Snug',
          desc: 'Slip the regulars some mushrooms. Choose one: 2 to put up the barricade beside a place and take its action; buy a Snug favour (the Gutter map or Friends in low places); or 4 plus the goods on the bribe slate for a Gold Feather from the Aerie, Glimmer\'s Hoard or the Roastery.' },
    20: { name: 'Roastery', short: 'Roastery',
          desc: 'Your mushrooms are roasted and brewed into the tea the Ascendancy craves, for a Gold Feather. The first costs 6 mushrooms, and each Feather taken makes the next cost 1 more.' }
  },

  cards: {
    good:    { name: 'Spare crate',     text: 'Gain 1 good of your choice (not during an action).' },
    lira5:   { name: 'Purse of coppers', text: 'Take 5 Coppers.' },
    dEnvoy: { name: "Shavala's ear", text: "At the Envoy's Aerie, deliver a second time. Offered during that action." },
    dPost:   { name: 'Second post',     text: 'At the Pigeon Roost, take the action a second time. Offered during that action.' },
    dGem:    { name: "Glimmer's mood",  text: "At Madame Glimmer's Hoard, buy a second Gold Feather. Offered during that action." },
    family:  { name: 'Bail out cousin', text: 'Send your cousin back to the Watch House and take a reward: 3 Coppers or a favour card.' },
    stay:    { name: 'Hold the stall',  text: "Don't move this turn. You still leave an apprentice where you are." },
    move34:  { name: 'Shortcut',        text: 'Move 3 or 4 places this turn instead of 1 or 2.' },
    recall:  { name: 'Whistle',         text: 'Before moving, call 1 apprentice home.' },
    smAny:   { name: 'Haggle',          text: 'At the Riverside Stalls, sell any types of goods. Offered during that action.' },
    tea2:    { name: 'Spare pouch',     text: 'Take 2 mushrooms.' },
    gcard:   { name: 'Word with the guild', text: 'Pay 2 mushrooms and draw 1 guild card.' },
    tea8:    { name: 'Truffle buyer',   text: 'Pay 1 mushroom and take 8 Coppers.' },
    diceGift:{ name: 'Lucky bones',     text: 'Roll 2 dice and take a reward for each: 1 = 2 Coppers, 2 = Honey, 3 = Herbs, 4 = Wool, 5 = Pearls, 6 = a mushroom.' },
    swap3:   { name: 'Swap meet',       text: 'Exchange up to 3 goods or mushrooms for the same number of other goods or mushrooms.' },
    six:     { name: 'Weighted bone',   text: 'After you roll the dice, turn one die to 6. Offered when you roll.' },
    corner:  { name: 'Back alleys',     text: 'Instead of moving 1 or 2 places, move to any corner place.' },
    dWain:   { name: "Bodkin's favour", text: "At Bodkin's Cartwright, take the action a second time. Offered during that action." },
    dCH:     { name: 'Second roast',    text: 'At the Roastery, take the action a second time. Offered during that action.' }
  },

  tileAbil: {
    r: 'At the Tavern and Rat Alley, once turn one die to 4 or re-roll both.',
    g: 'At a store, pay 2 Coppers for 1 extra good of any type.',
    y: 'Once per turn, pay 2 Coppers to call an apprentice home.',
    b: 'Gain your 5th apprentice right away.'
  },

  /* Storybook serif for place names and headings */
  fonts: { link: 'Alegreya:wght@500;700;800', display: "'Alegreya', Georgia, serif", tile: "'Alegreya', Georgia, serif" },

  expName: 'Mushrooms & Guilds',

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
      16: 'art/tiles/16-magpies-hoard.webp',
      17: 'art/tiles/17-mushroom-grotto.webp',
      18: 'art/tiles/18-guild-hall.webp',
      19: 'art/tiles/19-gutterlane-snug.webp',
      20: 'art/tiles/20-roastery.webp'
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
      card: 'art/icons/card.webp', coffee: 'art/icons/mushroom.webp', charter: 'art/icons/charter.webp', crate: 'art/icons/crate.webp',
      'badge-r': 'art/icons/badge-r.webp', 'badge-g': 'art/icons/badge-g.webp', 'badge-y': 'art/icons/badge-y.webp', 'badge-b': 'art/icons/badge-b.webp',
      'gutter-map': 'art/icons/gutter-map.webp', friends: 'art/icons/friends.webp', barricade: 'art/icons/barricade.webp', 'guild-card': 'art/icons/guild-card.webp'
    },
    neutral: 'art/standees/rat.webp',   // the three neutral traders in 2-player games
    gov: 'art/standees/crow.webp',      // Crow Clerk
    smug: 'art/standees/fox.webp',      // Fox
    trader: 'art/standees/squirrel.webp' // Sorrel, Squirrel Forager
  }
};
