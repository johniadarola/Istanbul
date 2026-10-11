const $=s=>document.querySelector(s);
const GOODS=['r','g','y','b'];
const GNAME={r:'Fabric',g:'Spice',y:'Fruit',b:'Jewelry'};
const PNAME={1:'Wainwright',2:'Fabric Warehouse',3:'Spice Warehouse',4:'Fruit Warehouse',5:'Post Office',6:'Caravansary',7:'Fountain',8:'Black Market',9:'Tea House',10:'Large Market',11:'Small Market',12:'Police Station',13:"Sultan's Palace",14:'Small Mosque',15:'Great Mosque',16:'Gemstone Dealer'};
const SHORT={1:'Wainwright',2:'Fabric',3:'Spice',4:'Fruit',5:'Post Office',6:'Caravansary',7:'Fountain',8:'Black Market',9:'Tea House',10:'Large Market',11:'Small Market',12:'Police',13:'Sultan',14:'Small Mosque',15:'Great Mosque',16:'Gem Dealer'};
const PDESC={
 1:'Pay 7 Lira for a wheelbarrow extension, so you can carry one more of each good. Your third extension also earns a Ruby.',
 2:'Fill your Fabric to capacity.',3:'Fill your Spice to capacity.',4:'Fill your Fruit to capacity.',
 5:'Take the four goods and coins currently showing, then the mail shifts and shows something different.',
 6:'Take 2 bonus cards (from the pile or the top of the discards), then discard 1.',
 7:'Bring all your assistants home to your stack. You need no assistant here and pay no other merchants.',
 8:'Take 1 Fabric, Spice or Fruit, then roll for Jewelry: 7–8 gives 1, 9–10 gives 2, 11–12 gives 3.',
 9:'Name a number from 3 to 12 and roll two dice. Meet or beat it to take that many Lira; otherwise take 2.',
 10:'Sell 1–5 goods shown on the demand tile. Selling 1/2/3/4/5 pays 3/7/12/18/25 Lira.',
 11:'Sell 1–5 goods shown on the demand tile. Selling 1/2/3/4/5 pays 2/5/9/14/20 Lira.',
 12:'If your family member is here, send it to any other place and take that action there for free.',
 13:'Deliver the listed goods to the Sultan for a Ruby. Every Ruby taken makes the next one ask for one more good.',
 14:'Carry enough Fabric or Spice to take that mosque tile, pay one of the goods, and gain its ability. Owning both tiles here earns a Ruby.',
 15:'Carry enough Fruit or Jewelry to take that mosque tile, pay one of the goods, and gain its ability. Owning both tiles here earns a Ruby.',
 16:'Buy a Ruby for the price shown. Every purchase raises the price by 1 Lira.'};
const KIND={1:'ruby',2:'goods',3:'goods',4:'goods',5:'util',6:'util',7:'util',8:'goods',9:'money',10:'money',11:'money',12:'util',13:'ruby',14:'ruby',15:'ruby',16:'ruby'};
const LAYOUTS={short:[15,5,2,14,4,12,7,3,8,6,11,9,13,10,1,16],order:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]};
const POST_TOP=[{g:'r'},{l:2},{g:'b'},{l:2}], POST_BOT=[{g:'g'},{l:1},{g:'y'},{l:1}];
const SMALL_TILES=[['r','g','y','y','b'],['r','r','g','y','b'],['g','g','r','y','b'],['y','y','r','g','g'],['r','g','g','y','b']];
const LARGE_TILES=[['b','b','r','g','y'],['b','r','r','g','y'],['b','b','g','g','y'],['b','b','y','y','r'],['b','r','g','y','y']];
const REV={10:[0,3,7,12,18,25],11:[0,2,5,9,14,20]};
const SULTAN_SEQ=['b','r','g','y','*','b','r','g','y','*'];
const MOSQUE={14:['r','g'],15:['y','b']};
const TILE_ABIL={r:'At the Tea House and Black Market, once turn one die to 4 or re-roll both.',g:'At a warehouse, pay 2 Lira for 1 extra good of any type.',y:'Once per turn, pay 2 Lira to bring an assistant home.',b:'Gain your 5th assistant right away.'};
const CARD_DEFS={
 good:{n:4,name:'Any good',text:'Gain 1 good of your choice (not during an action).'},
 lira5:{n:4,name:'5 Lira',text:'Take 5 Lira.'},
 dSultan:{n:2,name:'Sultan twice',text:"At the Sultan's Palace, deliver a second time. Offered during that action."},
 dPost:{n:2,name:'Post twice',text:'At the Post Office, take the action a second time. Offered during that action.'},
 dGem:{n:2,name:'Gems twice',text:'At the Gemstone Dealer, buy a second Ruby. Offered during that action.'},
 family:{n:2,name:'Family home',text:'Send your family member to the Police Station and take a reward: 3 Lira or a bonus card.'},
 stay:{n:2,name:'Stay put',text:"Don't move this turn. You still leave an assistant where you are."},
 move34:{n:4,name:'Long stride',text:'Move 3 or 4 places this turn instead of 1 or 2.'},
 recall:{n:2,name:'Recall',text:'Before moving, bring 1 assistant home to your stack.'},
 smAny:{n:2,name:'Any goods',text:'At the Small Market, sell any types of goods. Offered during that action.'}};
const COLORS=['red','green','yellow','white','teal'];
const STORE='istanbul-table-v1';
const ABORT={abort:true};
let G=null, GEN=0, lastSaved=null;
let UI={phase:'idle',sel:null,mode:'normal',busy:false};
let pendingMove=null, pendingEnd=null;

/* ---------- helpers ---------- */
const rnd=n=>Math.floor(Math.random()*n);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const roll2=()=>[1+rnd(6),1+rnd(6)];
const rollSum=()=>{const d=roll2();return d[0]+d[1];};
const cap=p=>2+p.ext;
const cur=G=>G.players[G.current];
const winTarget=G=>G.players.length===2?6:5;
function rc(G,pl){const i=G.layout.indexOf(pl);return[i>>2,i&3];}
function dist(G,a,b){const[x1,y1]=rc(G,a),[x2,y2]=rc(G,b);return Math.abs(x1-x2)+Math.abs(y1-y2);}
const sultanReq=G=>SULTAN_SEQ.slice(0,4+G.sultanTaken);
const gemPrice=G=>12+G.gemTaken;
const hasCard=(p,t)=>p.cards.includes(t);
function useCard(G,p,t){const i=p.cards.indexOf(t);if(i<0)return false;p.cards.splice(i,1);G.discard.push(t);return true;}
function drawCard(G,fromDiscard){if(fromDiscard&&G.discard.length)return G.discard.pop();if(!G.deck.length)G.deck=shuffle(G.discard.splice(0));return G.deck.pop()||null;}
const totalGoods=p=>GOODS.reduce((s,c)=>s+p.goods[c],0);
function tileCount(t){const o={r:0,g:0,y:0,b:0};t.forEach(c=>o[c]++);return o;}
function probAtLeast(n){let k=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(a+b>=n)k++;return k/36;}
function canPaySultan(p,req){const need={r:0,g:0,y:0,b:0};let any=0;req.forEach(x=>x==='*'?any++:need[x]++);for(const c of GOODS)if(p.goods[c]<need[c])return false;return GOODS.reduce((s,c)=>s+p.goods[c]-need[c],0)>=any;}
function postItems(G){return[0,1,2,3].map(i=>i<G.post?POST_TOP[i]:POST_BOT[i]);}
const chip=c=>`<span class="gd ${c==='*'?'g-any':'g-'+c}"></span>`;
const clone=o=>JSON.parse(JSON.stringify(o));
function checkGen(ctx){if(!ctx.sim&&ctx.gen!==GEN)throw ABORT;}
async function sleep(ctx,ms){if(ctx.sim)return;await new Promise(r=>setTimeout(r,ms));checkGen(ctx);}
function reachable(G,p,mode){if(mode==='stay')return[p.pos];const ds=mode==='move34'?[3,4]:[1,2];return G.layout.filter(pl=>pl!==p.pos&&ds.includes(dist(G,p.pos,pl)));}
function randomLayout(){for(;;){const L=shuffle([...Array(16)].map((_,i)=>i+1));if(![5,6,9,10].includes(L.indexOf(7)))continue;if(dist({layout:L},8,9)<3)continue;return L;}}
let toastT=null;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2400);}
function log(ctx,msg,p,sep){if(ctx.sim)return;ctx.G.log.unshift({t:msg,c:p?p.color:null,s:!!sep});if(ctx.G.log.length>120)ctx.G.log.pop();render();}
function note(ctx,p,msg){if(ctx.sim)return;log(ctx,msg,p);if(!p.ai)toast(msg);}

/* ---------- setup ---------- */
function newGame(cfg){
  const n=cfg.players.length;
  const layout=cfg.layout==='random'?randomLayout():LAYOUTS[cfg.layout].slice();
  const players=cfg.players.map((pl,i)=>({i,name:cleanName(pl.name)||('Player '+(i+1)),ai:!!pl.ai,owner:pl.owner||(pl.ai?'ai':''),color:COLORS[i],lira:0,goods:{r:0,g:0,y:0,b:0},ext:0,rubies:0,tiles:{r:0,g:0,y:0,b:0},stack:4,assist:{},pos:7,family:12,cards:[],yellowUsed:false}));
  const deck=[];Object.entries(CARD_DEFS).forEach(([k,d])=>{for(let i=0;i<d.n;i++)deck.push(k);});shuffle(deck);
  const start=rnd(n);
  for(let k=0;k<n;k++){const p=players[(start+k)%n];p.lira=2+k;p.cards.push(deck.pop());}
  const reqs=n===2?[2,4]:n===3?[2,3,4]:[2,3,4,5];
  const g={players,layout,deck,discard:[],post:0,
    neutrals:n===2?[{color:'grey',pos:14},{color:'grey',pos:15},{color:'grey',pos:16}]:[],
    gov:rollSum(),smug:rollSum(),
    small:shuffle(SMALL_TILES.map(t=>t.slice())),large:shuffle(LARGE_TILES.map(t=>t.slice())),
    mosque:{r:reqs.slice(),g:reqs.slice(),y:reqs.slice(),b:reqs.slice()},
    mosqueRubies:{14:n===5?4:n,15:n===5?4:n},wainRubies:n,
    sultanTaken:0,sultanRubies:n+2,gemTaken:0,gemRubies:n+2,
    current:start,start,round:1,endTriggered:false,over:false,result:null,log:[],layoutName:cfg.layout,cfg};
  g.log.unshift({t:`${players[start].name} starts. First to ${n===2?6:5} Rubies ends the game.`,c:players[start].color});
  return g;
}

/* ---------- turn resolution ---------- */
function gainRuby(ctx,p,src){const G=ctx.G;p.rubies++;log(ctx,`${p.name} gains a Ruby at the ${src} (${p.rubies}).`,p);
  if(!G.endTriggered&&p.rubies>=winTarget(G)){G.endTriggered=true;log(ctx,`${p.name} reached ${p.rubies} Rubies. The game ends after this round.`,p);if(!ctx.sim)toast('Final round!');}}

async function resolveMove(ctx,target,mode){
  const G=ctx.G,p=cur(G);
  p.pos=target;
  log(ctx,mode==='stay'?`${p.name} stays at the ${PNAME[target]}.`:`${p.name} moves to the ${PNAME[target]}.`,p);
  if(p.ai)await sleep(ctx,650);
  // 1. assistants
  if(target!==7){
    if(mode!=='stay'&&p.assist[target]){p.stack+=p.assist[target];delete p.assist[target];log(ctx,`${p.name} picks up the waiting assistant.`,p);}
    else if(p.stack>0){p.stack--;p.assist[target]=(p.assist[target]||0)+1;}
    else{note(ctx,p,`${p.name} has no assistant along, so the turn ends.`);return;}
  }
  // 2. other merchants
  if(target!==7){
    const others=G.players.filter(q=>q!==p&&q.pos===target);
    const neut=G.neutrals.filter(x=>x.pos===target);
    const cost=2*(others.length+neut.length);
    if(cost>0){
      if(p.lira<cost){note(ctx,p,`${p.name} can't pay the ${cost} Lira owed to merchants here, so the turn ends.`);return;}
      p.lira-=cost;others.forEach(q=>q.lira+=2);neut.forEach(x=>x.pos=rollSum());
      log(ctx,`${p.name} pays ${cost} Lira to the merchant${cost>2?'s':''} here.`,p);
    }
  }
  // 3. action
  await doAction(ctx,p,target);
  checkGen(ctx);
  // 4. encounters
  if(target!==12){
    for(const q of G.players){if(q!==p&&q.family===target){
      q.family=12;const r=await decide(ctx,p,'familyReward',{name:q.name});
      if(r==='card'){const c=drawCard(G);if(c)p.cards.push(c);log(ctx,`${p.name} sends ${q.name}'s family to the Police Station and draws a card.`,p);}
      else{p.lira+=3;log(ctx,`${p.name} sends ${q.name}'s family to the Police Station and takes 3 Lira.`,p);}
    }}
  }
  if(G.gov===target&&(G.deck.length||G.discard.length)){
    if(await decide(ctx,p,'confirm',{key:'gov',title:'The Governor',text:'Draw a bonus card, then pay 2 Lira or discard a bonus card.',yes:'Draw a card',no:'Ignore him'})){
      const c=drawCard(G);if(c)p.cards.push(c);
      const pay=await decide(ctx,p,'govPay',{});
      if(pay==='lira'){p.lira-=2;}else{const [d]=p.cards.splice(pay,1);G.discard.push(d);}
      G.gov=rollSum();log(ctx,`${p.name} deals with the Governor, who moves to the ${PNAME[G.gov]}.`,p);
    }
  }
  if(G.smug===target){
    const room=GOODS.filter(c=>p.goods[c]<cap(p));
    if(room.length&&await decide(ctx,p,'confirm',{key:'smug',title:'The Smuggler',text:'Take 1 good of your choice, then pay 2 Lira or 1 good.',yes:'Take a good',no:'Ignore him'})){
      const c=await decide(ctx,p,'pickGood',{key:'smug',title:'The Smuggler',text:'Take 1 good.',options:room});
      p.goods[c]++;
      const pay=await decide(ctx,p,'smugPay',{});
      if(pay==='lira')p.lira-=2;else p.goods[pay]--;
      G.smug=rollSum();log(ctx,`${p.name} deals with the Smuggler, who moves to the ${PNAME[G.smug]}.`,p);
    }
  }
}

async function rollWithRed(ctx,p,purpose,target){
  let d=roll2();
  log(ctx,`${p.name} rolls ${d[0]} + ${d[1]} = ${d[0]+d[1]}.`,p);
  if(p.tiles.r){
    const ch=await decide(ctx,p,'dice',{dice:d,purpose,target});
    if(ch==='four'){const i=d[0]<=d[1]?0:1;d[i]=4;log(ctx,`${p.name} turns a die to 4: ${d[0]+d[1]}.`,p);}
    else if(ch==='reroll'){d=roll2();log(ctx,`${p.name} re-rolls: ${d[0]} + ${d[1]} = ${d[0]+d[1]}.`,p);}
  }
  if(!ctx.sim&&!p.ai)toast(`Rolled ${d[0]} + ${d[1]} = ${d[0]+d[1]}`);
  return d;
}

async function postAction(ctx,p){
  const G=ctx.G;const items=postItems(G);let lira=0;const got=[];
  items.forEach(it=>{if(it.l)lira+=it.l;else if(p.goods[it.g]<cap(p)){p.goods[it.g]++;got.push(GNAME[it.g]);}});
  p.lira+=lira;G.post=G.post<4?G.post+1:0;
  log(ctx,`${p.name} collects mail: ${lira} Lira${got.length?', '+got.join(', '):''}.`,p);
}

async function doAction(ctx,p,place){
  const G=ctx.G;
  switch(place){
  case 1:{
    if(p.ext>=3){note(ctx,p,'Your wheelbarrow is already fully extended.');break;}
    if(p.lira<7){note(ctx,p,'The Wainwright needs 7 Lira.');break;}
    if(!await decide(ctx,p,'confirm',{key:'wain',title:'Wainwright',text:`Pay 7 Lira to extend your wheelbarrow to ${cap(p)+1} of each good?${p.ext===2?' This completes it and earns a Ruby.':''}`,yes:'Pay 7 Lira'}))break;
    p.lira-=7;p.ext++;log(ctx,`${p.name} extends the wheelbarrow (${cap(p)} per good).`,p);
    if(p.ext===3&&G.wainRubies>0){G.wainRubies--;gainRuby(ctx,p,'Wainwright');}
    break;}
  case 2:case 3:case 4:{
    const c={2:'r',3:'g',4:'y'}[place];const n=cap(p)-p.goods[c];p.goods[c]=cap(p);
    log(ctx,`${p.name} loads ${n} ${GNAME[c]}.`,p);
    if(p.tiles.g&&p.lira>=2){const room=GOODS.filter(x=>p.goods[x]<cap(p));
      if(room.length){const pick=await decide(ctx,p,'pickGood',{key:'green',title:'Green mosque tile',text:'Pay 2 Lira for 1 extra good?',options:room,allowSkip:true});
        if(pick){p.lira-=2;p.goods[pick]++;log(ctx,`${p.name} buys 1 extra ${GNAME[pick]}.`,p);}}}
    break;}
  case 5:{
    await postAction(ctx,p);
    if(hasCard(p,'dPost')&&await decide(ctx,p,'confirm',{key:'dPost',title:'Post twice',text:'Play your bonus card to collect the mail again?',yes:'Play card'})){useCard(G,p,'dPost');await postAction(ctx,p);}
    break;}
  case 6:{
    for(let k=1;k<=2;k++){let src='deck';if(G.discard.length)src=await decide(ctx,p,'cardSource',{top:G.discard[G.discard.length-1],n:k});
      const c=drawCard(G,src==='discard');if(c)p.cards.push(c);}
    log(ctx,`${p.name} takes 2 bonus cards.`,p);
    if(p.cards.length){const i=await decide(ctx,p,'discardCard',{title:'Caravansary: discard 1'});const [c]=p.cards.splice(i,1);G.discard.push(c);log(ctx,`${p.name} discards “${CARD_DEFS[c].name}”.`,p);}
    break;}
  case 7:{
    let n=0;for(const k in p.assist)n+=p.assist[k];p.stack+=n;p.assist={};
    log(ctx,n?`${p.name} brings ${n} assistant${n>1?'s':''} home.`:`${p.name} has no assistants out.`,p);break;}
  case 8:{
    const opts=['r','y','g'].filter(c=>p.goods[c]<cap(p));
    if(opts.length){const c=await decide(ctx,p,'pickGood',{key:'bm',title:'Black Market',text:'Take 1 good, then roll for Jewelry.',options:opts});if(c){p.goods[c]++;log(ctx,`${p.name} takes 1 ${GNAME[c]}.`,p);}}
    const d=await rollWithRed(ctx,p,'bm',null);const s=d[0]+d[1];
    const blue=s>=11?3:s>=9?2:s>=7?1:0;const add=Math.min(blue,cap(p)-p.goods.b);p.goods.b+=add;
    log(ctx,add?`${p.name} gains ${add} Jewelry.`:`${p.name} gains no Jewelry.`,p);break;}
  case 9:{
    const n=await decide(ctx,p,'pickNumber',{});
    log(ctx,`${p.name} announces ${n}.`,p);
    const d=await rollWithRed(ctx,p,'tea',n);const s=d[0]+d[1];const gain=s>=n?n:2;p.lira+=gain;
    log(ctx,`${p.name} takes ${gain} Lira at the Tea House.`,p);break;}
  case 10:case 11:{
    const mk=place===10?G.large:G.small;const tile=mk[0];
    let any=false;
    if(place===11&&hasCard(p,'smAny'))any=await decide(ctx,p,'confirm',{key:'smAny',title:'Any goods',text:'Play your bonus card to sell any types of goods here?',yes:'Play card',no:'Not now'});
    if(any)useCard(G,p,'smAny');
    const sel=await decide(ctx,p,'sell',{tile,rev:REV[place],any,place});
    const n=GOODS.reduce((s,c)=>s+sel[c],0);
    if(n>0){GOODS.forEach(c=>p.goods[c]-=sel[c]);p.lira+=REV[place][n];log(ctx,`${p.name} sells ${n} good${n>1?'s':''} for ${REV[place][n]} Lira.`,p);}
    else log(ctx,`${p.name} sells nothing.`,p);
    mk.push(mk.shift());break;}
  case 12:{
    if(p.family!==12){note(ctx,p,'Your family member is not at the Police Station.');break;}
    const t=await decide(ctx,p,'policeTarget',{options:G.layout.filter(x=>x!==12)});
    if(t==null)break;
    p.family=t;log(ctx,`${p.name}'s family member heads to the ${PNAME[t]}.`,p);
    await doAction(ctx,p,t);break;}
  case 13:{
    let times=0;
    for(;;){
      if(G.sultanTaken>=G.sultanRubies){if(!times)note(ctx,p,'The Sultan has no Rubies left.');break;}
      const req=sultanReq(G);
      if(!canPaySultan(p,req)){if(!times)note(ctx,p,`The Sultan wants ${req.length} goods you don't have.`);break;}
      if(times===0){if(!await decide(ctx,p,'confirm',{key:'sultan',title:"Sultan's Palace",text:`Deliver ${req.length} goods for a Ruby? <span class="chips">${req.map(chip).join('')}</span>`,yes:'Deliver'}))break;}
      else{if(!hasCard(p,'dSultan')||!await decide(ctx,p,'confirm',{key:'dSultan',title:'Sultan twice',text:`Play your bonus card to deliver again? <span class="chips">${req.map(chip).join('')}</span>`,yes:'Play card'}))break;useCard(G,p,'dSultan');}
      req.forEach(x=>{if(x!=='*')p.goods[x]--;});
      for(const x of req)if(x==='*'){const opts=GOODS.filter(c=>p.goods[c]>0);const c=await decide(ctx,p,'pickGood',{key:'sultanAny',title:'Any good',text:'Pick the good to give for the open slot.',options:opts});p.goods[c]--;}
      G.sultanTaken++;gainRuby(ctx,p,"Sultan's Palace");times++;
    }
    break;}
  case 14:case 15:{
    const cols=MOSQUE[place];
    const opts=cols.filter(c=>!p.tiles[c]&&G.mosque[c].length&&p.goods[c]>=G.mosque[c][0]);
    if(!opts.length){note(ctx,p,'You can’t claim a tile here yet.');break;}
    const c=await decide(ctx,p,'mosqueColor',{options:opts});
    if(!c)break;
    const req=G.mosque[c].shift();p.goods[c]--;p.tiles[c]=1;
    log(ctx,`${p.name} claims the ${GNAME[c]} mosque tile (showed ${req}).`,p);
    if(c==='b'){p.stack++;log(ctx,`${p.name} gains a 5th assistant.`,p);}
    if(cols.every(x=>p.tiles[x])&&G.mosqueRubies[place]>0){G.mosqueRubies[place]--;gainRuby(ctx,p,PNAME[place]);}
    break;}
  case 16:{
    let times=0;
    for(;;){
      if(G.gemTaken>=G.gemRubies){if(!times)note(ctx,p,'The Gemstone Dealer is sold out.');break;}
      const price=gemPrice(G);
      if(p.lira<price){if(!times)note(ctx,p,`A Ruby costs ${price} Lira here.`);break;}
      if(times===0){if(!await decide(ctx,p,'confirm',{key:'gem',title:'Gemstone Dealer',text:`Buy a Ruby for ${price} Lira?`,yes:`Pay ${price} Lira`}))break;}
      else{if(!hasCard(p,'dGem')||!await decide(ctx,p,'confirm',{key:'dGem',title:'Gems twice',text:`Play your bonus card to buy another Ruby for ${price} Lira?`,yes:'Play card'}))break;useCard(G,p,'dGem');}
      p.lira-=price;G.gemTaken++;gainRuby(ctx,p,'Gemstone Dealer');times++;
    }
    break;}
  }
}

/* ---------- decisions ---------- */
async function decide(ctx,p,kind,d={}){
  if(ctx.sim||p.ai)return aiDecide(ctx,p,kind,d);
  const r=await humanDecide(ctx,p,kind,d);checkGen(ctx);return r;
}
function need(G,p){
  const s={r:0,g:0,y:0,b:0};
  if(G.sultanTaken<G.sultanRubies){const cnt={r:0,g:0,y:0,b:0};sultanReq(G).forEach(x=>{if(x!=='*')cnt[x]++;});GOODS.forEach(c=>{if(p.goods[c]<cnt[c])s[c]+=3*(cnt[c]-p.goods[c]);});}
  [14,15].forEach(pl=>MOSQUE[pl].forEach(c=>{if(!p.tiles[c]&&G.mosque[c].length&&p.goods[c]<G.mosque[c][0])s[c]+=2;}));
  GOODS.forEach(c=>{if(c==='b')s[c]+=.5;if(p.goods[c]>=cap(p))s[c]=-99;});
  return s;
}
const bestGood=(G,p,opts)=>{const s=need(G,p);return opts.slice().sort((a,b)=>s[b]-s[a]||p.goods[a]-p.goods[b])[0];};
const spareGood=(G,p,opts)=>{const s=need(G,p);return opts.slice().sort((a,b)=>(p.goods[b]-p.goods[a])||(s[a]-s[b]))[0];};
const CARD_VAL={lira5:9,good:8,family:6,move34:5,dGem:4,dSultan:4,recall:4,dPost:4,smAny:3,stay:2};
const worstCard=p=>{let bi=0;p.cards.forEach((c,i)=>{if(CARD_VAL[c]<CARD_VAL[p.cards[bi]])bi=i;});return bi;};

async function aiDecide(ctx,p,kind,d){
  const G=ctx.G;
  switch(kind){
  case 'confirm':
    if(d.key==='gov')return p.lira>=5||p.cards.length>=1;
    if(d.key==='smug')return p.lira>=5||totalGoods(p)>=3;
    return true;
  case 'pickGood':
    if(d.key==='green'&&p.lira<4)return null;
    if(d.key==='sultanAny')return spareGood(G,p,d.options);
    return bestGood(G,p,d.options);
  case 'pickNumber':return p.tiles.r?8:6;
  case 'dice':{const s=d.dice[0]+d.dice[1],lo=Math.min(...d.dice),four=s-lo+4;
    if(d.purpose==='tea'){if(s>=d.target)return 'keep';if(lo<4&&four>=d.target)return 'four';return 'reroll';}
    const br=x=>x>=11?3:x>=9?2:x>=7?1:0;
    if(lo<4&&br(four)>br(s))return 'four';if(br(s)===0)return 'reroll';return 'keep';}
  case 'sell':{const sel={r:0,g:0,y:0,b:0};
    if(d.any){let left=5;GOODS.slice().sort((a,b)=>p.goods[b]-p.goods[a]).forEach(c=>{const k=Math.min(left,p.goods[c]);sel[c]=k;left-=k;});}
    else{const t=tileCount(d.tile);GOODS.forEach(c=>sel[c]=Math.min(t[c],p.goods[c]));}
    return sel;}
  case 'cardSource':return(d.top==='lira5'||d.top==='good')?'discard':'deck';
  case 'discardCard':return worstCard(p);
  case 'mosqueColor':return['b','y','r','g'].find(c=>d.options.includes(c));
  case 'policeTarget':{
    const depth=ctx.depth||0;
    if(depth>=2)return d.options.includes(16)&&p.lira>=gemPrice(G)?16:3;
    let best=null,bv=-1e9;
    for(const t of d.options){const C=clone(G);const q=C.players[p.i];q.family=t;await doAction({G:C,sim:true,depth:depth+1},q,t);const v=evalPlayer(C,q);if(v>bv){bv=v;best=t;}}
    return best;}
  case 'familyReward':return 'lira';
  case 'govPay':return p.lira>=4?'lira':worstCard(p);
  case 'smugPay':{if(p.lira>=6)return 'lira';const opts=GOODS.filter(c=>p.goods[c]>0);if(!opts.length)return 'lira';return spareGood(G,p,opts);}
  }
}

function evalPlayer(G,p){
  let v=p.rubies*70+Math.min(p.lira,30)+Math.max(0,p.lira-30)*.3+p.cards.length*3+[0,15,32,40][p.ext];
  const cp=cap(p);
  GOODS.forEach(c=>v+=Math.min(p.goods[c],cp)*(c==='b'?3.2:2.4));
  v+=(p.tiles.r?13:0)+(p.tiles.g?11:0)+(p.tiles.y?15:0)+(p.tiles.b?11:0);
  v+=p.stack*3;
  if(p.stack===0){v-=8;if([7,...Object.keys(p.assist).map(Number)].some(pl=>dist(G,p.pos,pl)<=2))v+=5;}
  if(G.sultanTaken<G.sultanRubies){const req=sultanReq(G);const nd={r:0,g:0,y:0,b:0};let any=0;req.forEach(x=>x==='*'?any++:nd[x]++);
    let have=0;GOODS.forEach(c=>have+=Math.min(p.goods[c],nd[c]));const extra=GOODS.reduce((s,c)=>s+Math.max(0,p.goods[c]-nd[c]),0);have+=Math.min(any,extra);
    const f=have/req.length;v+=14*f*f;}
  if(G.gemTaken<G.gemRubies){const f=Math.min(1,p.lira/gemPrice(G));v+=10*f*f;}
  [14,15].forEach(pl=>MOSQUE[pl].forEach(c=>{if(!p.tiles[c]&&G.mosque[c].length){const f=Math.min(1,p.goods[c]/G.mosque[c][0]);v+=6*f*f;}}));
  if(p.ext<3)v+=Math.min(1,p.lira/7)*4;
  return v;
}

async function simulate(G,pi,target,mode){
  const C=clone(G);const p=C.players[pi];if(mode!=='normal')useCard(C,p,mode);
  await resolveMove({G:C,sim:true,depth:1},target,mode);
  return evalPlayer(C,p);
}

async function aiTurn(ctx){
  const G=ctx.G,p=cur(G);
  while(hasCard(p,'lira5')){useCard(G,p,'lira5');p.lira+=5;log(ctx,`${p.name} plays “5 Lira”.`,p);}
  if(hasCard(p,'family')&&p.family!==12){useCard(G,p,'family');p.family=12;p.lira+=3;log(ctx,`${p.name} calls the family home and takes 3 Lira.`,p);}
  if(hasCard(p,'good')){const room=GOODS.filter(c=>p.goods[c]<cap(p));if(room.length){const c=bestGood(G,p,room);if(need(G,p)[c]>0){useCard(G,p,'good');p.goods[c]++;log(ctx,`${p.name} plays “Any good” for ${GNAME[c]}.`,p);}}}
  const out=Object.keys(p.assist).map(Number);
  if(p.stack===0&&out.length){
    const far=out.sort((a,b)=>dist(G,p.pos,b)-dist(G,p.pos,a))[0];
    if(p.tiles.y&&p.lira>=2&&!p.yellowUsed){p.lira-=2;p.yellowUsed=true;recallFrom(p,far);log(ctx,`${p.name} pays 2 Lira to bring an assistant home.`,p);}
    else if(hasCard(p,'recall')){useCard(G,p,'recall');recallFrom(p,far);log(ctx,`${p.name} plays “Recall”.`,p);}
  }
  const cands=reachable(G,p,'normal').map(t=>({t,mode:'normal',pen:0}));
  if(hasCard(p,'move34'))reachable(G,p,'move34').forEach(t=>cands.push({t,mode:'move34',pen:5}));
  let best=null;
  for(const c of cands){const runs=[8,9,12].includes(c.t)?3:1;let v=0;for(let r=0;r<runs;r++)v+=await simulate(G,p.i,c.t,c.mode);v=v/runs-c.pen+Math.random()*.6;if(!best||v>best.v)best={...c,v};}
  checkGen(ctx);
  if(best.mode!=='normal'){useCard(G,p,best.mode);log(ctx,`${p.name} plays “${CARD_DEFS[best.mode].name}”.`,p);}
  UI.sel=best.t;render();await sleep(ctx,550);
  await resolveMove(ctx,best.t,best.mode);
}
function recallFrom(p,pl){p.assist[pl]--;if(p.assist[pl]<=0)delete p.assist[pl];p.stack++;}

/* ---------- human UI decisions ---------- */
function sheet(title,body,buttons,opt={}){
  return new Promise(res=>{
    const w=$('#sheetWrap'),s=$('#sheet');
    s.innerHTML=`<h2>${title}</h2><div class="sbody">${body}</div><div class="sbtns ${opt.grid?'grid':''}">${buttons.map((b,i)=>`<button class="btn ${b.primary?'primary':''} ${b.cls||''}" data-i="${i}" ${b.disabled?'disabled':''}>${b.label}</button>`).join('')}</div>`;
    w.hidden=false;
    s.querySelectorAll('.sbtns button').forEach(btn=>btn.onclick=()=>{w.hidden=true;res(buttons[+btn.dataset.i].value);});
    const f=s.querySelector('.sbtns button');if(f)f.focus({preventScroll:true});
  });
}
const die=n=>`<span class="die">${n}</span>`;
function sellSheet(p,d){
  return new Promise(res=>{
    const w=$('#sheetWrap'),s=$('#sheet');const t=tileCount(d.tile);const sel={r:0,g:0,y:0,b:0};
    const goods=d.any?GOODS:GOODS.filter(c=>t[c]>0);
    const max=c=>d.any?p.goods[c]:Math.min(t[c],p.goods[c]);
    const tot=()=>GOODS.reduce((a,c)=>a+sel[c],0);
    const draw=()=>{const n=tot();
      s.innerHTML=`<h2>${PNAME[d.place]}</h2><div class="sbody"><p>Demand: <span class="chips">${d.tile.map(chip).join('')}</span>${d.any?' · Any goods card: sell any types.':''}</p>
      ${goods.map(c=>`<div class="srow"><span>${chip(c)} ${GNAME[c]} <small class="muted">have ${p.goods[c]}${d.any?'':`, wanted ${t[c]}`}</small></span>
      <button class="btn" data-c="${c}" data-d="-1" ${sel[c]<=0?'disabled':''} aria-label="Sell one fewer ${GNAME[c]}">−</button><output>${sel[c]}</output>
      <button class="btn" data-c="${c}" data-d="1" ${sel[c]>=max(c)||n>=5?'disabled':''} aria-label="Sell one more ${GNAME[c]}">+</button></div>`).join('')}
      <div class="total">${n} good${n===1?'':'s'} → ${d.rev[n]} Lira</div></div>
      <div class="sbtns"><button class="btn primary" data-act="sell">${n?`Sell for ${d.rev[n]} Lira`:'Sell nothing'}</button><button class="btn" data-act="max">Fill the most I can</button></div>`;
      s.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{sel[b.dataset.c]+=+b.dataset.d;draw();});
      s.querySelector('[data-act=max]').onclick=()=>{GOODS.forEach(c=>sel[c]=0);let left=5;goods.slice().sort((a,b)=>max(b)-max(a)).forEach(c=>{const k=Math.min(left,max(c));sel[c]=k;left-=k;});draw();};
      s.querySelector('[data-act=sell]').onclick=()=>{w.hidden=true;res({...sel});};
    };
    draw();w.hidden=false;
  });
}
async function humanDecide(ctx,p,kind,d){
  switch(kind){
  case 'confirm':return sheet(d.title,`<p>${d.text}</p>`,[{label:d.yes||'Yes',value:true,primary:true},{label:d.no||'No thanks',value:false}]);
  case 'pickGood':return sheet(d.title,`<p>${d.text}</p>`,[...d.options.map(c=>({label:`${chip(c)} ${GNAME[c]} <small>${p.goods[c]}/${cap(p)}</small>`,value:c})),...(d.allowSkip?[{label:'Skip',value:null}]:[])]);
  case 'pickNumber':{const b=[];for(let n=3;n<=12;n++)b.push({label:`<b>${n}</b><small>${Math.round(probAtLeast(n)*100)}% chance</small>`,value:n,cls:'num'});
    return sheet('Tea House','<p>Announce a number, then roll two dice. Meet or beat it to take that many Lira; otherwise take 2.</p>',b,{grid:true});}
  case 'dice':{const[a,b]=d.dice,lo=Math.min(a,b);const btns=[{label:`Keep ${a+b}`,value:'keep',primary:true}];
    if(lo<4)btns.push({label:`Turn the ${lo} into 4 (total ${a+b-lo+4})`,value:'four'});btns.push({label:'Re-roll both',value:'reroll'});
    return sheet('Red mosque tile',`<div class="dice">${die(a)}${die(b)}</div><p>${d.purpose==='tea'?`You announced ${d.target}.`:'Jewelry: 7–8 gives 1 · 9–10 gives 2 · 11–12 gives 3'}</p>`,btns);}
  case 'sell':return sellSheet(p,d);
  case 'cardSource':return sheet('Caravansary',`<p>Take bonus card ${d.n} of 2.</p>`,[{label:'Draw from the pile',value:'deck',primary:true},{label:`Take “${CARD_DEFS[d.top].name}” from the discards`,value:'discard'}]);
  case 'discardCard':return sheet(d.title||'Discard a card','<p>Choose a bonus card to discard.</p>',p.cards.map((c,i)=>({label:`${CARD_DEFS[c].name} <small>${CARD_DEFS[c].text}</small>`,value:i})));
  case 'mosqueColor':return sheet('Claim a mosque tile','<p>Pay 1 of the shown goods to take the tile.</p>',[...d.options.map(c=>({label:`${chip(c)} ${GNAME[c]} tile <small>needs ${G.mosque[c][0]} · ${TILE_ABIL[c]}</small>`,value:c})),{label:'Skip',value:null}]);
  case 'policeTarget':return sheet('Police Station','<p>Send your family member to any place and take that action there. No assistant needed and no encounters.</p>',[...d.options.map(pl=>({label:PNAME[pl],value:pl})),{label:'Skip',value:null}],{grid:true});
  case 'familyReward':return sheet('Family caught',`<p>You sent ${d.name}'s family member to the Police Station. Choose your reward.</p>`,[{label:'Take 3 Lira',value:'lira',primary:true},{label:'Draw a bonus card',value:'card'}]);
  case 'govPay':return sheet('Pay the Governor','<p>Pay 2 Lira or discard a bonus card.</p>',[...(p.lira>=2?[{label:'Pay 2 Lira',value:'lira',primary:true}]:[]),...p.cards.map((c,i)=>({label:'Discard “'+CARD_DEFS[c].name+'”',value:i}))]);
  case 'smugPay':return sheet('Pay the Smuggler','<p>Pay 2 Lira or 1 good.</p>',[...(p.lira>=2?[{label:'Pay 2 Lira',value:'lira',primary:true}]:[]),...GOODS.filter(c=>p.goods[c]>0).map(c=>({label:`Pay 1 ${chip(c)} ${GNAME[c]}`,value:c}))]);
  }
}

/* ---------- human turn controls ---------- */
const liveCtx=()=>({G,sim:false,gen:GEN});
async function cardTap(pi,i){
  const p=G.players[pi];if(!p||UI.busy)return;
  if(ON.code?ownerOf(p)!==ME:p.ai)return;
  const myTurn=p===cur(G)&&(!ON.code||ON.driving);
  const t=p.cards[i],def=CARD_DEFS[t];const canAct=myTurn&&['move','post'].includes(UI.phase);const moving=myTurn&&UI.phase==='move';
  let playable=false,label='Play card',hint=myTurn?'':'You can play this on your turn.';
  if(t==='lira5'||t==='good')playable=canAct;
  if(t==='family'){playable=canAct&&p.family!==12;if(p.family===12)hint='Your family member is already at the Police Station.';}
  if(t==='stay'||t==='move34'){playable=moving;label=UI.mode===t?'Cancel':'Use for this move';if(!moving)hint='Only before you move.';}
  if(t==='recall'){playable=moving&&Object.keys(p.assist).length>0;if(!moving)hint='Only before you move.';else if(!playable)hint='All your assistants are already with you.';}
  if(['dSultan','dPost','dGem','smAny'].includes(t))hint='You will be offered this card during that action.';
  UI.busy=true;
  try{
    const ok=await sheet(def.name,`<p>${def.text}</p>${hint?`<p class="muted">${hint}</p>`:''}`,playable?[{label,value:true,primary:true},{label:'Close',value:false}]:[{label:'Close',value:false}]);
    if(!ok)return;
    const ctx=liveCtx();
    if(t==='lira5'){useCard(G,p,t);p.lira+=5;log(ctx,`${p.name} plays “5 Lira”.`,p);}
    else if(t==='good'){const room=GOODS.filter(c=>p.goods[c]<cap(p));if(!room.length){toast('Your wheelbarrow is full.');return;}
      const c=await humanDecide(ctx,p,'pickGood',{title:'Any good',text:'Choose a good.',options:room,allowSkip:true});if(c){useCard(G,p,t);p.goods[c]++;log(ctx,`${p.name} plays “Any good” for ${GNAME[c]}.`,p);}}
    else if(t==='family'){useCard(G,p,t);p.family=12;const r=await humanDecide(ctx,p,'familyReward',{name:'your own'});if(r==='card'){const c=drawCard(G);if(c)p.cards.push(c);}else p.lira+=3;log(ctx,`${p.name} calls the family home.`,p);}
    else if(t==='stay'||t==='move34'){UI.mode=UI.mode===t?'normal':t;UI.sel=null;}
    else if(t==='recall'){const pl=await pickAssistant(p);if(pl!=null){useCard(G,p,t);recallFrom(p,pl);log(ctx,`${p.name} plays “Recall”.`,p);}}
  }finally{UI.busy=false;render();}
}
function pickAssistant(p){const out=Object.keys(p.assist).map(Number);return sheet('Bring an assistant home','<p>Choose where to collect one assistant from.</p>',[...out.map(pl=>({label:PNAME[pl],value:pl})),{label:'Cancel',value:null}]);}
async function yellowTap(){
  const p=cur(G);if(UI.busy)return;UI.busy=true;
  try{const pl=await pickAssistant(p);if(pl!=null){p.lira-=2;p.yellowUsed=true;recallFrom(p,pl);log(liveCtx(),`${p.name} pays 2 Lira to bring an assistant home.`,p);}}
  finally{UI.busy=false;render();}
}

/* ---------- game loop ---------- */
async function playTurn(ctx){
  const p=cur(G);p.yellowUsed=false;UI.mode='normal';UI.sel=null;
  log(ctx,`${p.name}'s turn`,p,true);
  if(p.ai){UI.phase='ai';render();await sleep(ctx,400);await aiTurn(ctx);await sleep(ctx,700);return;}
  UI.phase='move';render();
  const target=await new Promise(r=>pendingMove=r);pendingMove=null;checkGen(ctx);
  const mode=UI.mode;if(mode!=='normal')useCard(G,p,mode);
  UI.phase='busy';UI.sel=null;render();
  await resolveMove(ctx,target,mode);checkGen(ctx);
  UI.phase='post';UI.sel=null;render();
  await new Promise(r=>pendingEnd=r);pendingEnd=null;checkGen(ctx);
}
function finishGame(ctx){
  G.players.forEach(p=>{p.cards.slice().forEach(c=>{
    if(c==='lira5'){useCard(G,p,c);p.lira+=5;}
    if(c==='good'){const room=GOODS.filter(x=>p.goods[x]<cap(p));if(room.length){useCard(G,p,c);p.goods[room[0]]++;}}});});
  const rank=G.players.slice().sort((a,b)=>b.rubies-a.rubies||b.lira-a.lira||totalGoods(b)-totalGoods(a)||b.cards.length-a.cards.length);
  G.result=rank.map(p=>p.i);G.over=true;UI.phase='over';
  log(ctx,`${rank[0].name} wins the bazaar.`,rank[0],true);
}
async function gameLoop(){
  const ctx=liveCtx();
  try{
    while(!G.over){
      save();
      await playTurn(ctx);checkGen(ctx);
      advanceTurn(ctx);
    }
    save();render();showEnd();
  }catch(e){if(e!==ABORT){console.error(e);toast('Something went wrong: '+e.message);}}
}
function advanceTurn(ctx){const g=ctx.G;g.current=(g.current+1)%g.players.length;if(g.current===g.start){if(g.endTriggered)finishGame(ctx);else g.round++;}}
function save(){if(ON.code)return;lastSaved=JSON.stringify(G);try{localStorage.setItem(STORE,lastSaved);}catch(e){}}
function startGame(cfg){leaveOnline();showScreen('table');GEN++;pendingMove=pendingEnd=null;G=newGame(cfg);UI={phase:'idle',sel:null,mode:'normal',busy:false};$('#sheetWrap').hidden=true;render();gameLoop();}
function resumeGame(saved){leaveOnline();showScreen('table');GEN++;pendingMove=pendingEnd=null;G=saved;UI={phase:'idle',sel:null,mode:'normal',busy:false};$('#sheetWrap').hidden=true;render();if(G.over){UI.phase='over';render();}else gameLoop();}

/* ---------- rendering ---------- */
function tileStatus(pl){
  switch(pl){
  case 1:return `<span class="ruby">◆${G.wainRubies}</span> 7 Lira`;
  case 2:case 3:case 4:return `${chip({2:'r',3:'g',4:'y'}[pl])} fill up`;
  case 5:return postItems(G).map(it=>it.g?chip(it.g):`${it.l}L`).join(' ');
  case 6:return '+2 −1 cards';
  case 7:return 'assistants home';
  case 8:return 'good + dice';
  case 9:return 'bet 3–12';
  case 10:return G.large[0].map(chip).join('');
  case 11:return G.small[0].map(chip).join('');
  case 12:return 'free family';
  case 13:{const left=G.sultanRubies-G.sultanTaken;return left?`<span class="ruby">◆${left}</span> ${sultanReq(G).length} goods`:'sold out';}
  case 14:case 15:return MOSQUE[pl].map(c=>`${chip(c)}${G.mosque[c].length?G.mosque[c][0]:'–'}`).join(' ')+` <span class="ruby">◆${G.mosqueRubies[pl]}</span>`;
  case 16:{const left=G.gemRubies-G.gemTaken;return left?`<span class="ruby">◆${left}</span> ${gemPrice(G)} Lira`:'sold out';}
  }
}
function tokens(pl){
  const p=cur(G);let h='';
  G.players.forEach(q=>{if(q.pos===pl)h+=`<i class="mer c-${q.color} ${q===p&&!G.over?'active':''}" title="${q.name}">${q.stack}</i>`;});
  G.neutrals.forEach(x=>{if(x.pos===pl)h+=`<i class="mer c-grey" title="Neutral merchant"></i>`;});
  G.players.forEach(q=>{if(q.assist[pl])h+=`<i class="ast c-${q.color}" title="${q.name}'s assistant">${q.assist[pl]>1?q.assist[pl]:''}</i>`;});
  G.players.forEach(q=>{if(q.family===pl)h+=`<i class="fam c-${q.color}" title="${q.name}'s family member"></i>`;});
  if(G.gov===pl)h+=`<i class="gov" title="Governor"><b>G</b></i>`;
  if(G.smug===pl)h+=`<i class="smg" title="Smuggler"><b>S</b></i>`;
  return h;
}
function placeDetail(pl){
  const p=cur(G);
  switch(pl){
  case 1:return `<div class="detail"><span><span class="k">Rubies left</span><span class="ruby">◆ ${G.wainRubies}</span></span><span><span class="k">Your extensions</span>${p.ext}/3</span></div>`;
  case 5:return `<div class="detail"><span><span class="k">Showing now</span><span class="chips">${postItems(G).map(it=>it.g?chip(it.g)+' '+GNAME[it.g]:`${it.l} Lira`).join(' · ')}</span></span></div>`;
  case 10:case 11:{const mk=pl===10?G.large:G.small;return `<div class="detail"><span><span class="k">Demand tile</span><span class="chips">${mk[0].map(chip).join('')}</span></span><span><span class="k">Next</span><span class="chips">${mk[1].map(chip).join('')}</span></span></div>`;}
  case 12:{const f=G.players.filter(q=>q.family===12).map(q=>q.name);return `<div class="detail"><span><span class="k">Families here</span>${f.length?f.join(', '):'none'}</span></div>`;}
  case 13:{const left=G.sultanRubies-G.sultanTaken;return `<div class="detail"><span><span class="k">Next delivery</span>${left?`<span class="chips">${sultanReq(G).map(chip).join('')}</span>`:'—'}</span><span><span class="k">Rubies left</span><span class="ruby">◆ ${left}</span></span></div>`;}
  case 14:case 15:return `<div class="detail">${MOSQUE[pl].map(c=>`<span><span class="k">${GNAME[c]} tile</span>${G.mosque[c].length?`needs ${G.mosque[c][0]} ${chip(c)}`:'gone'} <small class="muted">${TILE_ABIL[c]}</small></span>`).join('')}<span><span class="k">Rubies left</span><span class="ruby">◆ ${G.mosqueRubies[pl]}</span></span></div>`;
  case 16:{const left=G.gemRubies-G.gemTaken;return `<div class="detail"><span><span class="k">Price</span>${left?gemPrice(G)+' Lira':'—'}</span><span><span class="k">Rubies left</span><span class="ruby">◆ ${left}</span></span></div>`;}
  }
  return '';
}
function preview(p,pl,mode){
  const out=[];
  if(pl===7)out.push({t:'No assistant needed at the Fountain.'});
  else if(mode!=='stay'&&p.assist[pl])out.push({t:'Your assistant is waiting here; you pick it up.',c:'good'});
  else if(p.stack>0)out.push({t:`Leave 1 assistant here (${p.stack-1} stay with you).`});
  else out.push({t:'No assistant with you. Your turn would end on arrival.',c:'bad'});
  if(pl!==7){const n=G.players.filter(q=>q!==p&&q.pos===pl).length+G.neutrals.filter(x=>x.pos===pl).length;
    if(n)out.push({t:`Pay ${2*n} Lira to the merchant${n>1?'s':''} here.`,c:p.lira>=2*n?'':'bad'});}
  const fams=G.players.filter(q=>q!==p&&q.family===pl&&pl!==12);
  if(fams.length)out.push({t:`Catch ${fams.map(q=>q.name).join(', ')}'s family member for a reward.`,c:'good'});
  if(G.gov===pl)out.push({t:'The Governor is here: draw a bonus card for 2 Lira or a card.'});
  if(G.smug===pl)out.push({t:'The Smuggler is here: take a good for 2 Lira or a good.'});
  return out;
}
function render(){
  if(!G)return;
  const p=cur(G);
  $('#roundInfo').textContent=G.over?'Game over':`Round ${G.round}${G.endTriggered?' · final':''}`;
  // banner
  let msg='',acts='';
  if(G.over)msg='The game is over.';
  else if(UI.phase==='ai')msg=esc(G.log[0]&&!G.log[0].s?G.log[0].t:`${p.name} is thinking…`);
  else if(UI.phase==='move')msg=UI.mode==='stay'?'Stay put: tap your own place, then Stay here.':UI.mode==='move34'?'Long stride: tap a place 3 or 4 steps away.':'Tap a highlighted place, then Move here.';
  else if(UI.phase==='busy')msg='Resolving your action…';
  else if(UI.phase==='post')msg='Play a bonus card if you like, then end your turn.';
  else if(UI.phase==='watch'){const e=G.log.find(x=>!x.s);msg=esc(e?e.t:`Waiting for ${p.name}…`);}
  if(!G.over&&!p.ai){
    if(['move','post'].includes(UI.phase)&&p.tiles.y&&!p.yellowUsed&&p.lira>=2&&Object.keys(p.assist).length)acts+=`<button class="btn" id="yelBtn">${chip('y')} Recall (2 Lira)</button>`;
    if(UI.phase==='post')acts+=`<button class="btn primary" id="endBtn">End turn</button>`;
  }
  if(G.over)acts=`<button class="btn primary" id="resBtn">Results</button>`;
  $('#banner').innerHTML=`<span class="who"><i class="mer c-${p.color}"></i>${G.over?'':p.name+(p.ai?' (AI)':'')}</span><span class="msg">${msg}</span><span class="acts">${acts}</span>`;
  const eb=$('#endBtn');if(eb)eb.onclick=()=>pendingEnd&&pendingEnd();
  const yb=$('#yelBtn');if(yb)yb.onclick=yellowTap;
  const rb=$('#resBtn');if(rb)rb.onclick=showEnd;
  // board
  const reach=new Set(UI.phase==='move'&&!p.ai?reachable(G,p,UI.mode):[]);
  $('#board').innerHTML=G.layout.map(pl=>`<button class="tile k-${KIND[pl]} ${reach.has(pl)?'reach':''} ${UI.phase==='move'&&!p.ai&&!reach.has(pl)?'dim':''} ${UI.sel===pl?'sel':''}" data-pl="${pl}" aria-label="${PNAME[pl]}"><span class="pn">${pl}</span><span class="nm">${SHORT[pl]}</span><span class="st">${tileStatus(pl)}</span><span class="tok">${tokens(pl)}</span></button>`).join('');
  document.querySelectorAll('.tile').forEach(t=>t.onclick=()=>{UI.sel=+t.dataset.pl;render();});
  // panel
  const pl=UI.sel??p.pos;
  let h=`<div class="ph"><span class="pnum">${pl}</span><h3>${PNAME[pl]}</h3></div><p class="pd">${PDESC[pl]}</p>${placeDetail(pl)}`;
  if(UI.phase==='move'&&!p.ai){
    if(reach.has(pl))h+=`<ul class="pv">${preview(p,pl,UI.mode).map(x=>`<li class="${x.c||''}">${x.t}</li>`).join('')}</ul><button class="btn primary big" id="moveBtn">${UI.mode==='stay'?'Stay here':'Move here'}</button>`;
    else if(pl===p.pos)h+=`<p class="muted">Your merchant is here. Pick a different place to move to.</p>`;
    else h+=`<p class="muted">Out of reach: ${dist(G,p.pos,pl)} steps away.</p>`;
  }
  $('#panel').innerHTML=h;
  const mb=$('#moveBtn');if(mb)mb.onclick=()=>pendingMove&&pendingMove(pl);
  // players
  const tgt=winTarget(G);
  $('#players').innerHTML=G.players.map(q=>{
    const me=q===p&&!G.over;const mine=ON.code?ownerOf(q)===ME:false;const away=ON.code&&!q.ai&&!(ON.data&&ON.data.presence&&ON.data.presence[ownerOf(q)]);const out=Object.entries(q.assist).map(([k,n])=>SHORT[k]+(n>1?' ×'+n:'')).join(', ');
    const showHand=ON.code?mine:(me&&!q.ai);
    const canRejoin=ON.code&&away&&!q.ai&&!G.players.some(x=>ownerOf(x)===ME);
    return `<div class="pl"><div class="plh"><i class="mer c-${q.color}"></i><span class="nm">${q.name}</span>${q.ai?'<span class="tag">AI</span>':''}${mine?'<span class="tag">You</span>':''}${away?'<span class="tag">Away</span>':''}${me?'<span class="tag turn">Turn</span>':''}
      <span class="rubies" aria-label="${q.rubies} rubies">${[...Array(tgt)].map((_,i)=>`<span class="${i<q.rubies?'ruby':'off'}">◆</span>`).join('')}${q.rubies>tgt?`<span class="ruby">+${q.rubies-tgt}</span>`:''}</span></div>
      <div class="stats"><span><b>${q.lira}</b> Lira</span><span><b>${q.stack}</b> assistant${q.stack===1?'':'s'} along${out?` <span class="muted">· out: ${out}</span>`:''}</span><span class="muted">Family: ${SHORT[q.family]}</span>
      <span class="tiles4" title="Mosque tiles">${GOODS.map(c=>`<span class="mt ${q.tiles[c]?'on g-'+c:''}" title="${GNAME[c]} tile"></span>`).join('')}</span></div>
      <div class="meters">${GOODS.map(c=>`<div class="meter"><span class="lbl">${chip(c)} ${GNAME[c]} ${q.goods[c]}</span><span class="pips">${[...Array(cap(q))].map((_,i)=>`<span class="pip ${i<q.goods[c]?'g-'+c:''}"></span>`).join('')}</span></div>`).join('')}</div>
      ${showHand?`<div class="hand">${q.cards.length?q.cards.map((c,i)=>`<button class="cardchip ${UI.mode===c?'armed':''}" data-card="${q.i}:${i}">${CARD_DEFS[c].name}</button>`).join(''):'<span class="muted">No bonus cards</span>'}</div>`:`<div class="stats muted">${q.cards.length} bonus card${q.cards.length===1?'':'s'}</div>`}
      ${canRejoin?`<button class="btn" style="margin-top:8px" data-rejoin="${q.i}">This is me: play as ${q.name}</button>`:''}
    </div>`;}).join('');
  document.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{const[a,c]=b.dataset.card.split(':');cardTap(+a,+c);});
  document.querySelectorAll('[data-rejoin]').forEach(b=>b.onclick=()=>rejoinSeat(+b.dataset.rejoin));
  // log
  $('#log').innerHTML=G.log.slice(0,60).map(e=>`<li class="${e.s?'sep':''}">${e.c?`<i class="c-${e.c}"></i>`:''}<span>${esc(e.t)}</span></li>`).join('');
  const myTurn=ON.code&&!G.over&&ownerOf(p)===ME;
  document.title=myTurn?'● Your turn · Istanbul':'Istanbul';
  $('#codeChip').hidden=!ON.code;if(ON.code)$('#codeChip').textContent='Game '+ON.code;
  if(ON.code&&ON.driving)queueLive();
}
function showEnd(){
  if(!G||!G.over)return;
  const rows=G.result.map((i,k)=>{const q=G.players[i];return `<tr><td>${k+1}</td><td><i class="mer c-${q.color}" style="width:12px;height:12px;vertical-align:-1px"></i> ${esc(q.name)}</td><td class="ruby">◆ ${q.rubies}</td><td>${q.lira}</td><td>${totalGoods(q)}</td></tr>`;}).join('');
  sheet(`${G.players[G.result[0]].name} wins`,`<table class="rank"><tr><th>#</th><th>Merchant</th><th>Rubies</th><th>Lira</th><th>Goods</th></tr>${rows}</table><p class="muted">Ties go to most Lira, then goods, then bonus cards.</p>`,[{label:'Back to the menu',value:'new',primary:true},{label:'Look at the board',value:null}]).then(v=>{if(v==='new')goHome();});
}
function setupSheet(){
  const prev=(G&&G.cfg)||{players:[{name:'You',ai:false},{name:'Selim',ai:true},{name:'Defne',ai:true}],layout:'short'};
  const names=['You','Selim','Defne','Murat','Leyla'];
  const st={n:prev.players.length,players:names.map((n,i)=>prev.players[i]?{...prev.players[i]}:{name:n,ai:true}),layout:prev.layout};
  const w=$('#sheetWrap'),s=$('#sheet');
  const draw=()=>{
    s.innerHTML=`<h2>New game</h2><div class="form">
      <div><h4>Players</h4><div class="seg" id="nseg">${[2,3,4,5].map(n=>`<button data-n="${n}" class="${st.n===n?'on':''}">${n}</button>`).join('')}</div></div>
      ${st.players.slice(0,st.n).map((pl,i)=>`<div class="prow"><i class="mer c-${COLORS[i]}"></i><input id="pname${i}" value="${pl.name.replace(/"/g,'&quot;')}" aria-label="Player ${i+1} name"><div class="seg">${['Human','AI'].map(k=>`<button data-p="${i}" data-ai="${k==='AI'?1:0}" class="${(pl.ai?'AI':'Human')===k?'on':''}">${k}</button>`).join('')}</div></div>`).join('')}
      <div><h4>Board layout</h4><select id="layoutSel"><option value="short" ${st.layout==='short'?'selected':''}>Short paths (learning)</option><option value="order" ${st.layout==='order'?'selected':''}>In order (similar places together)</option><option value="random" ${st.layout==='random'?'selected':''}>Random (Fountain in the middle)</option></select></div>
      <div class="sbtns"><button class="btn primary big" id="goBtn">Start game</button><button class="btn" id="cancelBtn">Cancel</button></div></div>`;
    const keep=()=>st.players.slice(0,st.n).forEach((pl,i)=>{const el=$('#pname'+i);if(el)pl.name=el.value.trim()||('Player '+(i+1));});
    s.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{keep();st.n=+b.dataset.n;draw();});
    s.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{keep();st.players[+b.dataset.p].ai=b.dataset.ai==='1';draw();});
    $('#layoutSel').onchange=e=>st.layout=e.target.value;
    $('#cancelBtn').onclick=()=>{w.hidden=true;};
    $('#goBtn').onclick=()=>{keep();w.hidden=true;startGame({players:st.players.slice(0,st.n).map(p=>({name:cleanName(p.name),ai:p.ai})),layout:st.layout});};
  };
  draw();w.hidden=false;
}
$('#newBtn').onclick=goHome;
$('#codeChip').onclick=()=>copyText(shareLink(ON.code));

/* ---------- shared helpers ---------- */
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cleanName(s){return String(s??'').replace(/[<>&"'`]/g,'').trim().slice(0,16);}
function rid(n){const a='abcdefghijkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<n;i++)s+=a[rnd(a.length)];return s;}
function rcode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[rnd(a.length)];return s;}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
const shareLink=code=>location.origin+location.pathname+'?game='+code;
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Link copied');}catch(e){toast(t);}}
function showScreen(name){['home','lobby','table'].forEach(n=>$('#'+n).hidden=n!==name);if(name!=='table'){$('#roundInfo').textContent='';document.title='Istanbul';}$('#codeChip').hidden=!ON.code;if(ON.code)$('#codeChip').textContent='Game '+ON.code;}

/* ---------- online play (Firebase Realtime Database) ---------- */
const FIREBASE_CONFIG={
  apiKey:"AIzaSyAdmojl8aqsod9PKgs6mLeVOHtin_LuHSA",
  authDomain:"istanbul-8c39c.firebaseapp.com",
  databaseURL:"https://istanbul-8c39c-default-rtdb.firebaseio.com",
  projectId:"istanbul-8c39c",
  storageBucket:"istanbul-8c39c.firebasestorage.app",
  messagingSenderId:"603257531019",
  appId:"1:603257531019:web:7a3c7b4da29694c344428e"};
const FB_VER='10.12.2';
const MOCK=new URLSearchParams(location.search).has('mock');
const ME=(()=>{const k='istanbul-me';try{const st=MOCK?sessionStorage:localStorage;let id=st.getItem(k);if(!id){id=rid(12);st.setItem(k,id);}return id;}catch(e){return rid(12);}})();
const ON={code:null,net:null,data:null,version:0,driving:false,drive:0,liveT:null,lastLive:null,unsub:null,presenceOn:false,shownEnd:false,timer:null};
let netP=null;
function getNet(){if(!netP)netP=(MOCK?Promise.resolve(mockNet()):firebaseNet()).catch(e=>{netP=null;throw e;});return netP;}
async function firebaseNet(){
  const [appM,db]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`)]);
  const d=db.getDatabase(appM.initializeApp(FIREBASE_CONFIG));const R=p=>db.ref(d,p);
  return{
    on:(p,cb,err)=>db.onValue(R(p),s=>cb(s.val()),e=>err&&err(e)),
    set:(p,v)=>db.set(R(p),v),
    tx:async(p,fn)=>(await db.runTransaction(R(p),c=>fn(c),{applyLocally:false})).committed,
    presence:p=>db.onValue(R('.info/connected'),s=>{if(s.val()){db.onDisconnect(R(p)).remove();db.set(R(p),Date.now());}}),
    leave:p=>db.set(R(p),null)};
}
function mockNet(){ // same-browser stand-in used for testing: ?mock in the URL
  const KEY='istanbul-mockdb',subs=[];
  const cl=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return{};}};
  const at=(t,p)=>p.split('/').filter(Boolean).reduce((o,k)=>o==null?undefined:o[k],t);
  const put=(t,p,v)=>{const ks=p.split('/').filter(Boolean);let o=t;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]];}if(v==null)delete o[ks.at(-1)];else o[ks.at(-1)]=cl(v);};
  const fire=()=>{const t=load();subs.forEach(s=>s.cb(cl(at(t,s.p))));};
  const write=(p,v)=>{const t=load();put(t,p,v);localStorage.setItem(KEY,JSON.stringify(t));setTimeout(fire,0);};
  addEventListener('storage',e=>{if(e.key===KEY)fire();});
  return{on:(p,cb)=>{const s={p,cb};subs.push(s);setTimeout(()=>cb(cl(at(load(),p))),0);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1);};},
    set:async(p,v)=>write(p,v),
    tx:async(p,fn)=>{const r=fn(cl(at(load(),p)));if(r===undefined)return false;write(p,r);return true;},
    presence:p=>{write(p,Date.now());addEventListener('pagehide',()=>write(p,null));},
    leave:p=>write(p,null)};
}
const ownerOf=q=>(ON.data&&ON.data.claims&&ON.data.claims['s'+q.i])||q.owner;
function netError(msg){clearTimeout(ON.timer);showScreen('lobby');$('#lobby').innerHTML=`<div class="card panel"><h2>Can't reach the game</h2><p>${esc(msg)}</p><div class="row"><button class="btn primary" id="retryBtn">Try again</button><button class="btn" id="homeBtn2">Back to the menu</button></div></div>`;$('#retryBtn').onclick=()=>enterOnline(ON.code);$('#homeBtn2').onclick=goHome;}
async function enterOnline(code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(!code)return;
  leaveOnline();GEN++;$('#sheetWrap').hidden=true;
  ON.code=code;ON.version=0;ON.data=null;ON.shownEnd=false;
  history.replaceState(null,'','?game='+code+(MOCK?'&mock':''));
  showScreen('lobby');$('#lobby').innerHTML=`<div class="card panel"><h2>Joining game ${code}…</h2><p class="muted">Connecting to the bazaar.</p></div>`;
  let net;try{net=await getNet();}catch(e){netError('The multiplayer service failed to load. Check your connection.');return;}
  if(ON.code!==code)return;ON.net=net;
  ON.timer=setTimeout(()=>{if(!ON.data)netError('No answer from the game server after 12 seconds. Check your connection, or that the database rules allow access.');},12000);
  ON.unsub=net.on('games/'+code,d=>{if(ON.code===code)onGame(d);},e=>netError('The game server refused access ('+(e&&e.message||e)+'). Check the database rules.'));
}
function leaveOnline(){
  if(!ON.code)return;
  try{ON.unsub&&ON.unsub();}catch(e){}
  if(ON.net&&ON.presenceOn)ON.net.leave(`games/${ON.code}/presence/${ME}`);
  if(ON.driving)abortDrive();
  clearTimeout(ON.timer);clearTimeout(ON.liveT);ON.liveT=null;
  Object.assign(ON,{code:null,data:null,unsub:null,presenceOn:false,version:0});
  history.replaceState(null,'',location.pathname+(MOCK?'?mock':''));
}
function onGame(d){
  clearTimeout(ON.timer);
  if(!d||!d.status){const c=ON.code;leaveOnline();goHome();toast(`There's no game with code ${c}.`);return;}
  ON.data=d;
  if(!ON.presenceOn){ON.presenceOn=true;ON.net.presence(`games/${ON.code}/presence/${ME}`);}
  if(d.status==='lobby'){showScreen('lobby');renderLobby();return;}
  showScreen('table');
  if(d.version>ON.version){
    ON.version=d.version;if(ON.driving)abortDrive();
    G=parseState(d.state);UI={phase:'watch',sel:UI.sel,mode:'normal',busy:false};
  }else if(!ON.driving&&d.live&&d.live.v===ON.version&&d.live.s!==ON.lastLive){ON.lastLive=d.live.s;G=parseState(d.live.s);}
  if(!G)return;
  if(G.over)UI.phase='over';
  render();
  if(G.over&&!ON.shownEnd){ON.shownEnd=true;showEnd();}
  maybeDrive();
}
function parseState(s){const g=JSON.parse(s);g.players.forEach(p=>p.name=cleanName(p.name)||'Merchant');return g;}
function abortDrive(){ON.drive++;ON.driving=false;GEN++;$('#sheetWrap').hidden=true;clearTimeout(ON.liveT);ON.liveT=null;pendingMove&&pendingMove(null);pendingEnd&&pendingEnd();}
function amDriver(){
  const p=cur(G);if(!p.ai)return ownerOf(p)===ME;
  const here=(ON.data&&ON.data.presence)||{};
  return G.players.filter(q=>!q.ai).map(ownerOf).find(o=>here[o])===ME;
}
async function maybeDrive(){
  if(!G||G.over||ON.driving||!ON.data||ON.data.status!=='playing'||!amDriver())return;
  ON.driving=true;const tok=++ON.drive,base=ON.version,code=ON.code;GEN++;const ctx={G,sim:false,gen:GEN};
  try{
    await playTurn(ctx);checkGen(ctx);advanceTurn(ctx);
    const out=JSON.stringify(ctx.G),over=ctx.G.over;
    ON.driving=false;clearTimeout(ON.liveT);ON.liveT=null;
    const ok=await ON.net.tx('games/'+code,c=>{if(!c||c.version!==base)return;c.state=out;c.version=base+1;c.live=null;if(over)c.status='over';return c;});
    if(!ok&&ON.code===code)toast('Another player moved first. The board has been refreshed.');
  }catch(e){if(e!==ABORT){console.error(e);toast('Something went wrong: '+e.message);}}
  finally{if(ON.drive===tok)ON.driving=false;}
}
function queueLive(){
  if(ON.liveT)return;
  ON.liveT=setTimeout(()=>{ON.liveT=null;if(ON.driving&&ON.code)ON.net.set(`games/${ON.code}/live`,{v:ON.version,s:JSON.stringify(G)});},250);
}
async function rejoinSeat(i){
  const q=G.players[i];
  const ok=await ON.net.tx(`games/${ON.code}/claims`,c=>{c=c||{};c['s'+i]=ME;return c;});
  if(ok)toast(`You're playing as ${q.name}.`);
}

/* ---------- lobby ---------- */
function renderLobby(){
  const d=ON.data,seats=d.seats||[];const mine=seats.findIndex(s=>s.owner===ME);const here=d.presence||{};
  const open=seats.filter(s=>s.owner==='-').length;const link=shareLink(ON.code);
  const keepName=$('#joinName')?$('#joinName').value:(lsGet('istanbul-name')||'');
  $('#lobby').innerHTML=`<div class="card panel">
    <p class="eyebrow">Game ${ON.code}</p>
    <h2>Gather the merchants</h2>
    <p>Send this link to your friends. They open it, take an open seat and type a name. No account needed.</p>
    <div class="share"><code id="shareLink">${esc(link)}</code><button class="btn" id="copyBtn">Copy link</button></div>
    ${mine<0&&open?`<label class="fld" for="joinName">Your name<input id="joinName" maxlength="16" value="${esc(keepName)}" placeholder="Your name"></label>`:''}
    <h4>Seats</h4>
    <div class="seats">${seats.map((s,i)=>{
      const st=s.ai?'<span class="tag">AI merchant</span>':s.owner==='-'?'<span class="tag">Open seat</span>':`<span class="dot ${here[s.owner]?'on':''}"></span><span class="muted">${here[s.owner]?'Here':'Away'}</span>`;
      let act='';
      if(s.owner==='-'&&mine<0)act=`<button class="btn primary" data-take="${i}">Take this seat</button>`;
      if(mine>=0&&s.owner==='-')act=`<button class="btn" data-ai="${i}">Fill with AI</button>`;
      if(mine>=0&&s.ai)act=`<button class="btn" data-open="${i}">Open for a friend</button>`;
      return `<div class="seat"><i class="mer c-${COLORS[i]}"></i><span class="nm">${s.owner==='-'?'Waiting for a friend':esc(s.name)}${s.owner===ME?' <span class="tag">You</span>':''}</span>${st}<span class="act">${act}</span></div>`;}).join('')}</div>
    <div class="row">${mine>=0?`<button class="btn primary big" id="startBtn" ${open?'disabled':''}>${open?`Waiting for ${open} more player${open>1?'s':''}`:'Start the game'}</button>`:''}</div>
    <p class="muted small">Board: ${{short:'Short paths',order:'In order',random:'Random'}[d.layout]||d.layout}. Any seated player can start once every seat is filled.</p></div>`;
  $('#copyBtn').onclick=()=>copyText(link);
  document.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>takeSeat(+b.dataset.take));
  document.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>ON.net.set(`games/${ON.code}/seats/${b.dataset.ai}`,{name:AI_NAMES[+b.dataset.ai]||'Merchant',ai:true,owner:'ai'}));
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>ON.net.set(`games/${ON.code}/seats/${b.dataset.open}`,{name:'Friend',ai:false,owner:'-'}));
  const sb=$('#startBtn');if(sb)sb.onclick=startOnline;
}
const AI_NAMES=['Selim','Defne','Murat','Leyla','Kemal'];
async function takeSeat(i){
  const name=cleanName($('#joinName')&&$('#joinName').value);
  if(!name){toast('Type your name first.');$('#joinName')&&$('#joinName').focus();return;}
  lsSet('istanbul-name',name);
  const ok=await ON.net.tx(`games/${ON.code}/seats/${i}`,s=>{if(!s||s.owner!=='-')return;return{name,ai:false,owner:ME};});
  if(!ok)toast('Someone just took that seat.');
}
async function startOnline(){
  const d=ON.data;const g=newGame({players:d.seats.map(s=>({name:s.name,ai:s.ai,owner:s.owner})),layout:d.layout});
  const out=JSON.stringify(g);
  await ON.net.tx('games/'+ON.code,c=>{if(!c||c.status!=='lobby'||(c.seats||[]).some(s=>s.owner==='-'))return;c.status='playing';c.state=out;c.version=1;c.started=Date.now();return c;});
}
async function createOnline(cfg){
  const btn=$('#createBtn');if(btn){btn.disabled=true;btn.textContent='Creating…';}
  try{
    const net=await getNet();const code=rcode();
    await net.set('games/'+code,{host:ME,created:Date.now(),status:'lobby',layout:cfg.layout,version:0,seats:cfg.seats});
    enterOnline(code);
  }catch(e){toast("Couldn't create the game: "+(e.message||e));if(btn){btn.disabled=false;btn.textContent='Create game';}}
}

/* ---------- home ---------- */
const HOME={n:2,seats:['friend','friend','ai','ai','ai'],layout:'short'};
function goHome(){leaveOnline();GEN++;pendingMove=pendingEnd=null;$('#sheetWrap').hidden=true;showScreen('home');renderHome();}
function renderHome(){
  let saved=null;try{saved=JSON.parse(lsGet(STORE)||'null');}catch(e){}
  const name=$('#homeName')?$('#homeName').value:(lsGet('istanbul-name')||'');
  $('#home').innerHTML=`
  <div class="hero"><p class="eyebrow">Rüdiger Dorn's race through the bazaar</p>
    <h2 class="display">Five Rubies, one bazaar</h2>
    <p class="lede">Lead your merchant and four assistants through sixteen bazaar locations. Load your wheelbarrow, trade at the markets and win the Sultan's favour. The first merchant to hold five Rubies (six with two players) ends the game.</p></div>
  <div class="modes">
    <div class="card panel">
      <h3>Play online</h3>
      <p class="muted">Create a game and send the link. Friends join in their browser with no account.</p>
      <label class="fld" for="homeName">Your name<input id="homeName" maxlength="16" value="${esc(name)}" placeholder="Your name"></label>
      <div class="fld">Players<div class="seg" id="hn">${[2,3,4,5].map(n=>`<button data-n="${n}" class="${HOME.n===n?'on':''}">${n}</button>`).join('')}</div></div>
      ${HOME.n>1?`<div class="seatcfg">${[...Array(HOME.n-1)].map((_,k)=>`<div class="prow"><i class="mer c-${COLORS[k+1]}"></i><span>Seat ${k+2}</span><div class="seg">${['friend','ai'].map(v=>`<button data-s="${k+1}" data-v="${v}" class="${HOME.seats[k+1]===v?'on':''}">${v==='ai'?'AI':'Friend'}</button>`).join('')}</div></div>`).join('')}</div>`:''}
      <label class="fld" for="homeLayout">Board layout<select id="homeLayout"><option value="short" ${HOME.layout==='short'?'selected':''}>Short paths (learning)</option><option value="order" ${HOME.layout==='order'?'selected':''}>In order</option><option value="random" ${HOME.layout==='random'?'selected':''}>Random</option></select></label>
      <button class="btn primary big" id="createBtn">Create game</button>
      <div class="join"><label class="fld" for="joinCode">Have a code?<input id="joinCode" maxlength="8" placeholder="e.g. K7X2P" autocapitalize="characters"></label><button class="btn" id="joinBtn">Join</button></div>
    </div>
    <div class="card panel">
      <h3>Play on this device</h3>
      <p class="muted">Pass-and-play with friends at the table, or practise against AI merchants.</p>
      <button class="btn primary big" id="localBtn">Set up a game</button>
      ${saved&&!saved.over?`<button class="btn big" id="resumeBtn">Continue saved game <small>· round ${saved.round}, ${saved.players.length} players</small></button>`:''}
    </div>
  </div>`;
  document.querySelectorAll('#hn [data-n]').forEach(b=>b.onclick=()=>{HOME.n=+b.dataset.n;renderHome();});
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{HOME.seats[+b.dataset.s]=b.dataset.v;renderHome();});
  $('#homeLayout').onchange=e=>HOME.layout=e.target.value;
  $('#createBtn').onclick=()=>{
    const nm=cleanName($('#homeName').value);if(!nm){toast('Type your name first.');$('#homeName').focus();return;}
    lsSet('istanbul-name',nm);
    const seats=[...Array(HOME.n)].map((_,i)=>i===0?{name:nm,ai:false,owner:ME}:HOME.seats[i]==='ai'?{name:AI_NAMES[i],ai:true,owner:'ai'}:{name:'Friend',ai:false,owner:'-'});
    createOnline({seats,layout:HOME.layout});
  };
  const jc=()=>{const c=$('#joinCode').value.trim();if(c)enterOnline(c);else toast('Type the game code first.');};
  $('#joinBtn').onclick=jc;$('#joinCode').onkeydown=e=>{if(e.key==='Enter')jc();};
  $('#localBtn').onclick=setupSheet;
  const rb=$('#resumeBtn');if(rb)rb.onclick=()=>resumeGame(saved);
}

/* ---------- boot ---------- */
(function boot(){
  const code=new URLSearchParams(location.search).get('game');
  if(code)enterOnline(code);else{showScreen('home');renderHome();}
})();
