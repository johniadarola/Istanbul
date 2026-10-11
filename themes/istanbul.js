/* Theme: everything players read or see that isn't a rule.
   To retheme, copy this file, change the words and art paths, and point index.html at the new file. */
window.THEME = {
  id: 'istanbul',
  name: 'Istanbul',
  eyebrow: "Rüdiger Dorn's race through the bazaar",
  headline: 'Five Rubies, one bazaar',
  lede: "Lead your merchant and four assistants through sixteen bazaar locations. Load your wheelbarrow, trade at the markets and win the Sultan's favour. The first merchant to hold five Rubies (six with two players) ends the game.",
  foot: "Unofficial fan implementation of Rüdiger Dorn's Istanbul (Pegasus Spiele) for personal play. Demand tiles, the Sultan's goods track and ruby counts are approximations of the printed components.",

  words: {
    cur: 'Lira', curShort: 'L',
    ruby: 'Ruby', rubies: 'Rubies',
    merchant: 'merchant', merchants: 'merchants',
    assistant: 'assistant', assistants: 'assistants',
    family: 'family member',
    gov: 'Governor', smug: 'Smuggler',
    cart: 'wheelbarrow', ext: 'wheelbarrow extension',
    king: 'Sultan',
    tile: 'mosque tile', tiles: 'mosque tiles',
    market: 'bazaar',
    card: 'bonus card', cards: 'bonus cards'
  },

  goods: { r: 'Fabric', g: 'Spice', y: 'Fruit', b: 'Jewelry' },

  places: {
    1:  { name: 'Wainwright', short: 'Wainwright',
          desc: 'Pay 7 Lira for a wheelbarrow extension, so you can carry one more of each good. Your third extension also earns a Ruby.' },
    2:  { name: 'Fabric Warehouse', short: 'Fabric', desc: 'Fill your Fabric to capacity.' },
    3:  { name: 'Spice Warehouse', short: 'Spice', desc: 'Fill your Spice to capacity.' },
    4:  { name: 'Fruit Warehouse', short: 'Fruit', desc: 'Fill your Fruit to capacity.' },
    5:  { name: 'Post Office', short: 'Post Office',
          desc: 'Take the four goods and coins currently showing, then the mail shifts and shows something different.' },
    6:  { name: 'Caravansary', short: 'Caravansary',
          desc: 'Take 2 bonus cards (from the pile or the top of the discards), then discard 1.' },
    7:  { name: 'Fountain', short: 'Fountain',
          desc: 'Bring all your assistants home to your stack. You need no assistant here and pay no other merchants.' },
    8:  { name: 'Black Market', short: 'Black Market',
          desc: 'Take 1 Fabric, Spice or Fruit, then roll for Jewelry: 7–8 gives 1, 9–10 gives 2, 11–12 gives 3.' },
    9:  { name: 'Tea House', short: 'Tea House',
          desc: 'Name a number from 3 to 12 and roll two dice. Meet or beat it to take that many Lira; otherwise take 2.' },
    10: { name: 'Large Market', short: 'Large Market',
          desc: 'Sell 1–5 goods shown on the demand tile. Selling 1/2/3/4/5 pays 3/7/12/18/25 Lira.' },
    11: { name: 'Small Market', short: 'Small Market',
          desc: 'Sell 1–5 goods shown on the demand tile. Selling 1/2/3/4/5 pays 2/5/9/14/20 Lira.' },
    12: { name: 'Police Station', short: 'Police',
          desc: 'If your family member is here, send it to any other place and take that action there for free.' },
    13: { name: "Sultan's Palace", short: 'Sultan',
          desc: 'Deliver the listed goods to the Sultan for a Ruby. Every Ruby taken makes the next one ask for one more good.' },
    14: { name: 'Small Mosque', short: 'Small Mosque',
          desc: 'Carry enough Fabric or Spice to take that mosque tile, pay one of the goods, and gain its ability. Owning both tiles here earns a Ruby.' },
    15: { name: 'Great Mosque', short: 'Great Mosque',
          desc: 'Carry enough Fruit or Jewelry to take that mosque tile, pay one of the goods, and gain its ability. Owning both tiles here earns a Ruby.' },
    16: { name: 'Gemstone Dealer', short: 'Gem Dealer',
          desc: 'Buy a Ruby for the price shown. Every purchase raises the price by 1 Lira.' }
  },

  cards: {
    good:    { name: 'Any good',    text: 'Gain 1 good of your choice (not during an action).' },
    lira5:   { name: '5 Lira',      text: 'Take 5 Lira.' },
    dSultan: { name: 'Sultan twice', text: "At the Sultan's Palace, deliver a second time. Offered during that action." },
    dPost:   { name: 'Post twice',  text: 'At the Post Office, take the action a second time. Offered during that action.' },
    dGem:    { name: 'Gems twice',  text: 'At the Gemstone Dealer, buy a second Ruby. Offered during that action.' },
    family:  { name: 'Family home', text: 'Send your family member to the Police Station and take a reward: 3 Lira or a bonus card.' },
    stay:    { name: 'Stay put',    text: "Don't move this turn. You still leave an assistant where you are." },
    move34:  { name: 'Long stride', text: 'Move 3 or 4 places this turn instead of 1 or 2.' },
    recall:  { name: 'Recall',      text: 'Before moving, bring 1 assistant home to your stack.' },
    smAny:   { name: 'Any goods',   text: 'At the Small Market, sell any types of goods. Offered during that action.' }
  },

  tileAbil: {
    r: 'At the Tea House and Black Market, once turn one die to 4 or re-roll both.',
    g: 'At a warehouse, pay 2 Lira for 1 extra good of any type.',
    y: 'Once per turn, pay 2 Lira to bring an assistant home.',
    b: 'Gain your 5th assistant right away.'
  },

  aiNames: ['Selim', 'Defne', 'Murat', 'Leyla', 'Kemal'],

  /* Art hooks. Paths are relative to index.html. Leave empty to use the drawn look.
     tiles:     { 1: 'art/tiles/01.webp', ... }  square-ish, about 512×560
     merchants: { red: 'art/standees/red.webp', ... }  transparent PNG/WebP figures, about 256×384 */
  art: { tiles: {}, merchants: {} }
};
