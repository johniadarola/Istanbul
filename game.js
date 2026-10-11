/* Istanbul-style bazaar game: rules engine, AI, interface, effects and online play.
   All player-facing names come from THEME (themes/*.js). */
const $=s=>document.querySelector(s);
const T=window.THEME, W=T.words;
const GOODS=['r','g','y','b'];
const GNAME=T.goods;
const PNAME={},SHORT={},PDESC={};
for(let i=1;i<=16;i++){PNAME[i]=T.places[i].name;SHORT[i]=T.places[i].short;PDESC[i]=T.places[i].desc;}
const KIND={1:'ruby',2:'goods',3:'goods',4:'goods',5:'util',6:'util',7:'util',8:'goods',9:'money',10:'money',11:'money',12:'util',13:'ruby',14:'ruby',15:'ruby',16:'ruby'};
const LAYOUTS={short:[15,5,2,14,4,12,7,3,8,6,11,9,13,10,1,16],order:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]};
const POST_TOP=[{g:'r'},{l:2},{g:'b'},{l:2}], POST_BOT=[{g:'g'},{l:1},{g:'y'},{l:1}];
const SMALL_TILES=[['r','g','y','y','b'],['r','r','g','y','b'],['g','g','r','y','b'],['y','y','r','g','g'],['r','g','g','y','b']];
const LARGE_TILES=[['b','b','r','g','y'],['b','r','r','g','y'],['b','b','g','g','y'],['b','b','y','y','r'],['b','r','g','y','y']];
const REV={10:[0,3,7,12,18,25],11:[0,2,5,9,14,20]};
const SULTAN_SEQ=['b','r','g','y','*','b','r','g','y','*'];
const MOSQUE={14:['r','g'],15:['y','b']};
const TILE_ABIL=T.tileAbil;
const CARD_COUNTS={good:4,lira5:4,dSultan:2,dPost:2,dGem:2,family:2,stay:2,move34:4,recall:2,smAny:2};
const CARD_DEFS={};for(const k in CARD_COUNTS)CARD_DEFS[k]={n:CARD_COUNTS[k],...T.cards[k]};
const COLORS=['red','green','yellow','white','teal'];
const AI_NAMES=T.aiNames;
const STORE='istanbul-table-v1';
const ABORT={abort:true};
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
let G=null, GEN=0;
let UI={phase:'idle',sel:null,mode:'normal',busy:false};
let pendingMove=null, pendingEnd=null;
let TURN={snap:null,rng:-1};

/* ---------- helpers ---------- */
let RNG_N=0; // counts every random draw; undo is only offered while it hasn't changed
const rnd=n=>{RNG_N++;return Math.floor(Math.random()*n);};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const roll2=()=>[1+rnd(6),1+rnd(6)];
const rollSum=()=>{const d=roll2();return d[0]+d[1];};
const cap=p=>2+p.ext;
const cur=g=>g.players[g.current];
const winTarget=g=>g.players.length===2?6:5;
function rc(g,pl){const i=g.layout.indexOf(pl);return[i>>2,i&3];}
function dist(g,a,b){const[x1,y1]=rc(g,a),[x2,y2]=rc(g,b);return Math.abs(x1-x2)+Math.abs(y1-y2);}
const sultanReq=g=>SULTAN_SEQ.slice(0,4+g.sultanTaken);
const gemPrice=g=>12+g.gemTaken;
const hasCard=(p,t)=>p.cards.includes(t);
function useCard(g,p,t){const i=p.cards.indexOf(t);if(i<0)return false;p.cards.splice(i,1);g.discard.push(t);return true;}
function drawCard(g,fromDiscard){RNG_N++;if(fromDiscard&&g.discard.length)return g.discard.pop();if(!g.deck.length)g.deck=shuffle(g.discard.splice(0));return g.deck.pop()||null;}
const totalGoods=p=>GOODS.reduce((s,c)=>s+p.goods[c],0);
function tileCount(t){const o={r:0,g:0,y:0,b:0};t.forEach(c=>o[c]++);return o;}
function probAtLeast(n){let k=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(a+b>=n)k++;return k/36;}
function canPaySultan(p,req){const need={r:0,g:0,y:0,b:0};let any=0;req.forEach(x=>x==='*'?any++:need[x]++);for(const c of GOODS)if(p.goods[c]<need[c])return false;return GOODS.reduce((s,c)=>s+p.goods[c]-need[c],0)>=any;}
function sultanMissing(p,req){const need={r:0,g:0,y:0,b:0};let any=0;req.forEach(x=>x==='*'?any++:need[x]++);let miss=0,spare=0;for(const c of GOODS){miss+=Math.max(0,need[c]-p.goods[c]);spare+=Math.max(0,p.goods[c]-need[c]);}return miss+Math.max(0,any-spare);}
function postItems(g){return[0,1,2,3].map(i=>i<g.post?POST_TOP[i]:POST_BOT[i]);}
const chip=c=>`<span class="gd ${c==='*'?'g-any':'g-'+c}"></span>`;
const clone=o=>JSON.parse(JSON.stringify(o));
const L=n=>`${n} ${W.cur}`;
const plural=(n,one,many)=>n===1?one:many;
function checkGen(ctx){if(!ctx.sim&&ctx.gen!==GEN)throw ABORT;}
async function sleep(ctx,ms){if(ctx.sim)return;await new Promise(r=>setTimeout(r,ms));checkGen(ctx);}
function reachable(g,p,mode){if(mode==='stay')return[p.pos];const ds=mode==='move34'?[3,4]:[1,2];return g.layout.filter(pl=>pl!==p.pos&&ds.includes(dist(g,p.pos,pl)));}
function randomLayout(){for(;;){const L2=shuffle([...Array(16)].map((_,i)=>i+1));if(![5,6,9,10].includes(L2.indexOf(7)))continue;if(dist({layout:L2},8,9)<3)continue;return L2;}}
let toastT=null;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600);}
function log(ctx,msg,p,sep){if(ctx.sim)return;ctx.G.log.unshift({t:msg,c:p?p.color:null,s:!!sep});if(ctx.G.log.length>160)ctx.G.log.pop();render();}
function note(ctx,p,msg){if(ctx.sim)return;log(ctx,msg,p);if(isMine(p)){toast(msg);sfx('bad');}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cleanName(s){return String(s??'').replace(/[<>&"'`]/g,'').trim().slice(0,16);}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}

/* ---------- setup ---------- */
function newGame(cfg){
  const n=cfg.players.length;
  const layout=cfg.layout==='random'?randomLayout():LAYOUTS[cfg.layout].slice();
  const players=cfg.players.map((pl,i)=>({i,name:cleanName(pl.name)||('Player '+(i+1)),ai:!!pl.ai,owner:pl.owner||(pl.ai?'ai':''),color:COLORS[i],lira:0,goods:{r:0,g:0,y:0,b:0},ext:0,rubies:0,tiles:{r:0,g:0,y:0,b:0},stack:4,assist:{},pos:7,family:12,cards:[],yellowUsed:false}));
  const deck=[];Object.entries(CARD_DEFS).forEach(([k,d])=>{for(let i=0;i<d.n;i++)deck.push(k);});shuffle(deck);
  const start=rnd(n);
  for(let k=0;k<n;k++){const p=players[(start+k)%n];p.lira=2+k;p.cards.push(deck.pop());}
  const reqs=n===2?[2,4]:n===3?[2,3,4]:[2,3,4,5];
  const g={id:Math.random().toString(36).slice(2,10),players,layout,deck,discard:[],post:0,
    neutrals:n===2?[{color:'grey',pos:14},{color:'grey',pos:15},{color:'grey',pos:16}]:[],
    gov:rollSum(),smug:rollSum(),
    small:shuffle(SMALL_TILES.map(t=>t.slice())),large:shuffle(LARGE_TILES.map(t=>t.slice())),
    mosque:{r:reqs.slice(),g:reqs.slice(),y:reqs.slice(),b:reqs.slice()},
    mosqueRubies:{14:n===5?4:n,15:n===5?4:n},wainRubies:n,
    sultanTaken:0,sultanRubies:n+2,gemTaken:0,gemRubies:n+2,
    current:start,start,round:1,endTriggered:false,over:false,result:null,log:[],lastRoll:null,layoutName:cfg.layout,cfg};
  g.log.unshift({t:`${players[start].name} starts. First to ${winTarget(g)} ${W.rubies} ends the game.`,c:players[start].color});
  return g;
}

/* ---------- turn resolution ---------- */
function gainRuby(ctx,p,src){const g=ctx.G;p.rubies++;log(ctx,`${p.name} gains a ${W.ruby} at the ${src} (${p.rubies}).`,p);
  if(!g.endTriggered&&p.rubies>=winTarget(g)){g.endTriggered=true;log(ctx,`${p.name} reached ${p.rubies} ${W.rubies}. The game ends after this round.`,p);}}

async function resolveMove(ctx,target,mode){
  const g=ctx.G,p=cur(g);
  p.pos=target;
  log(ctx,mode==='stay'?`${p.name} stays at the ${PNAME[target]}.`:`${p.name} moves to the ${PNAME[target]}.`,p);
  await sleep(ctx,p.ai?650:420);
  if(target!==7){
    if(mode!=='stay'&&p.assist[target]){p.stack+=p.assist[target];delete p.assist[target];log(ctx,`${p.name} picks up the waiting ${W.assistant}.`,p);}
    else if(p.stack>0){p.stack--;p.assist[target]=(p.assist[target]||0)+1;}
    else{note(ctx,p,`${p.name} has no ${W.assistant} along, so the turn ends.`);return;}
  }
  if(target!==7){
    const others=g.players.filter(q=>q!==p&&q.pos===target);
    const neut=g.neutrals.filter(x=>x.pos===target);
    const cost=2*(others.length+neut.length);
    if(cost>0){
      if(p.lira<cost){note(ctx,p,`${p.name} can't pay the ${L(cost)} owed to ${W.merchants} here, so the turn ends.`);return;}
      p.lira-=cost;others.forEach(q=>q.lira+=2);neut.forEach(x=>x.pos=rollSum());
      log(ctx,`${p.name} pays ${L(cost)} to the ${plural(cost/2,W.merchant,W.merchants)} here.`,p);
    }
  }
  await doAction(ctx,p,target);
  checkGen(ctx);
  if(target!==12){
    for(const q of g.players){if(q!==p&&q.family===target){
      q.family=12;const r=await decide(ctx,p,'familyReward',{name:q.name});
      if(r==='card'){const c=drawCard(g);if(c)p.cards.push(c);log(ctx,`${p.name} sends ${q.name}'s ${W.family} to the ${PNAME[12]} and draws a card.`,p);}
      else{p.lira+=3;log(ctx,`${p.name} sends ${q.name}'s ${W.family} to the ${PNAME[12]} and takes ${L(3)}.`,p);}
    }}
  }
  if(g.gov===target&&(g.deck.length||g.discard.length)){
    if(await decide(ctx,p,'confirm',{key:'gov',title:`The ${W.gov}`,text:`Draw a ${W.card}, then pay ${L(2)} or discard a ${W.card}.`,yes:'Draw a card',no:'Ignore'})){
      const c=drawCard(g);if(c)p.cards.push(c);
      const pay=await decide(ctx,p,'govPay',{});
      if(pay==='lira'){p.lira-=2;}else{const [d]=p.cards.splice(pay,1);g.discard.push(d);}
      g.gov=rollSum();log(ctx,`${p.name} deals with the ${W.gov}, who moves to the ${PNAME[g.gov]}.`,p);
    }
  }
  if(g.smug===target){
    const room=GOODS.filter(c=>p.goods[c]<cap(p));
    if(room.length&&await decide(ctx,p,'confirm',{key:'smug',title:`The ${W.smug}`,text:`Take 1 good of your choice, then pay ${L(2)} or 1 good.`,yes:'Take a good',no:'Ignore'})){
      const c=await decide(ctx,p,'pickGood',{key:'smug',title:`The ${W.smug}`,text:'Take 1 good.',options:room});
      p.goods[c]++;
      const pay=await decide(ctx,p,'smugPay',{});
      if(pay==='lira')p.lira-=2;else p.goods[pay]--;
      g.smug=rollSum();log(ctx,`${p.name} deals with the ${W.smug}, who moves to the ${PNAME[g.smug]}.`,p);
    }
  }
}

function setRoll(ctx,p,d,purpose,target,note2){if(ctx.sim)return;const g=ctx.G;g.lastRoll={n:(g.lastRoll?g.lastRoll.n:0)+1,d:[d[0],d[1]],who:p.i,purpose,target:target??null,note:note2||''};}
async function rollWithRed(ctx,p,purpose,target){
  let d=roll2();
  setRoll(ctx,p,d,purpose,target);
  log(ctx,`${p.name} rolls ${d[0]} + ${d[1]} = ${d[0]+d[1]}.`,p);
  await sleep(ctx,1100);
  if(p.tiles.r){
    const ch=await decide(ctx,p,'dice',{dice:d,purpose,target});
    if(ch==='four'){const i=d[0]<=d[1]?0:1;d[i]=4;setRoll(ctx,p,d,purpose,target,'Turned a die to 4');log(ctx,`${p.name} turns a die to 4: ${d[0]+d[1]}.`,p);await sleep(ctx,900);}
    else if(ch==='reroll'){d=roll2();setRoll(ctx,p,d,purpose,target,'Re-roll');log(ctx,`${p.name} re-rolls: ${d[0]} + ${d[1]} = ${d[0]+d[1]}.`,p);await sleep(ctx,1100);}
  }
  return d;
}

async function postAction(ctx,p){
  const g=ctx.G;const items=postItems(g);let lira=0;const got=[];
  items.forEach(it=>{if(it.l)lira+=it.l;else if(p.goods[it.g]<cap(p)){p.goods[it.g]++;got.push(GNAME[it.g]);}});
  p.lira+=lira;g.post=g.post<4?g.post+1:0;
  log(ctx,`${p.name} collects mail: ${L(lira)}${got.length?', '+got.join(', '):''}.`,p);
}

async function doAction(ctx,p,place){
  const g=ctx.G;
  switch(place){
  case 1:{
    if(p.ext>=3){note(ctx,p,`Your ${W.cart} is already fully extended.`);break;}
    if(p.lira<7){note(ctx,p,`The ${PNAME[1]} needs ${L(7)}.`);break;}
    if(!await decide(ctx,p,'confirm',{key:'wain',title:PNAME[1],text:`Pay ${L(7)} to extend your ${W.cart} to ${cap(p)+1} of each good?${p.ext===2?` This completes it and earns a ${W.ruby}.`:''}`,yes:`Pay ${L(7)}`}))break;
    p.lira-=7;p.ext++;log(ctx,`${p.name} extends the ${W.cart} (${cap(p)} per good).`,p);
    if(p.ext===3&&g.wainRubies>0){g.wainRubies--;gainRuby(ctx,p,PNAME[1]);}
    break;}
  case 2:case 3:case 4:{
    const c={2:'r',3:'g',4:'y'}[place];const n=cap(p)-p.goods[c];p.goods[c]=cap(p);
    log(ctx,`${p.name} loads ${n} ${GNAME[c]}.`,p);
    if(p.tiles.g&&p.lira>=2){const room=GOODS.filter(x=>p.goods[x]<cap(p));
      if(room.length){const pick=await decide(ctx,p,'pickGood',{key:'green',title:`${GNAME.g} ${W.tile}`,text:`Pay ${L(2)} for 1 extra good?`,options:room,allowSkip:true});
        if(pick){p.lira-=2;p.goods[pick]++;log(ctx,`${p.name} buys 1 extra ${GNAME[pick]}.`,p);}}}
    break;}
  case 5:{
    await postAction(ctx,p);
    if(hasCard(p,'dPost')&&await decide(ctx,p,'confirm',{key:'dPost',title:CARD_DEFS.dPost.name,text:`Play your ${W.card} to collect the mail again?`,yes:'Play card'})){useCard(g,p,'dPost');await postAction(ctx,p);}
    break;}
  case 6:{
    for(let k=1;k<=2;k++){let src='deck';if(g.discard.length)src=await decide(ctx,p,'cardSource',{top:g.discard[g.discard.length-1],n:k});
      const c=drawCard(g,src==='discard');if(c)p.cards.push(c);}
    log(ctx,`${p.name} takes 2 ${W.cards}.`,p);
    if(p.cards.length){const i=await decide(ctx,p,'discardCard',{title:`${PNAME[6]}: discard 1`});const [c]=p.cards.splice(i,1);g.discard.push(c);log(ctx,`${p.name} discards “${CARD_DEFS[c].name}”.`,p);}
    break;}
  case 7:{
    let n=0;for(const k in p.assist)n+=p.assist[k];p.stack+=n;p.assist={};
    log(ctx,n?`${p.name} brings ${n} ${plural(n,W.assistant,W.assistants)} home.`:`${p.name} has no ${W.assistants} out.`,p);break;}
  case 8:{
    const opts=['r','y','g'].filter(c=>p.goods[c]<cap(p));
    if(opts.length){const c=await decide(ctx,p,'pickGood',{key:'bm',title:PNAME[8],text:`Take 1 good, then roll for ${GNAME.b}.`,options:opts});if(c){p.goods[c]++;log(ctx,`${p.name} takes 1 ${GNAME[c]}.`,p);}}
    const d=await rollWithRed(ctx,p,'bm',null);const s=d[0]+d[1];
    const blue=s>=11?3:s>=9?2:s>=7?1:0;const add=Math.min(blue,cap(p)-p.goods.b);p.goods.b+=add;
    log(ctx,add?`${p.name} gains ${add} ${GNAME.b}.`:`${p.name} gains no ${GNAME.b}.`,p);break;}
  case 9:{
    const n=await decide(ctx,p,'pickNumber',{});
    log(ctx,`${p.name} announces ${n}.`,p);
    const d=await rollWithRed(ctx,p,'tea',n);const s=d[0]+d[1];const gain=s>=n?n:2;p.lira+=gain;
    log(ctx,`${p.name} takes ${L(gain)} at the ${PNAME[9]}.`,p);break;}
  case 10:case 11:{
    const mk=place===10?g.large:g.small;const tile=mk[0];
    let any=false;
    if(place===11&&hasCard(p,'smAny'))any=await decide(ctx,p,'confirm',{key:'smAny',title:CARD_DEFS.smAny.name,text:`Play your ${W.card} to sell any types of goods here?`,yes:'Play card',no:'Not now'});
    if(any)useCard(g,p,'smAny');
    const sel=await decide(ctx,p,'sell',{tile,rev:REV[place],any,place});
    const n=GOODS.reduce((s,c)=>s+sel[c],0);
    if(n>0){GOODS.forEach(c=>p.goods[c]-=sel[c]);p.lira+=REV[place][n];log(ctx,`${p.name} sells ${n} ${plural(n,'good','goods')} for ${L(REV[place][n])}.`,p);}
    else log(ctx,`${p.name} sells nothing.`,p);
    mk.push(mk.shift());break;}
  case 12:{
    if(p.family!==12){note(ctx,p,`Your ${W.family} is not at the ${PNAME[12]}.`);break;}
    const t=await decide(ctx,p,'policeTarget',{options:g.layout.filter(x=>x!==12)});
    if(t==null)break;
    p.family=t;log(ctx,`${p.name}'s ${W.family} heads to the ${PNAME[t]}.`,p);
    await doAction(ctx,p,t);break;}
  case 13:{
    let times=0;
    for(;;){
      if(g.sultanTaken>=g.sultanRubies){if(!times)note(ctx,p,`The ${W.king} has no ${W.rubies} left.`);break;}
      const req=sultanReq(g);
      if(!canPaySultan(p,req)){if(!times)note(ctx,p,`The ${W.king} wants ${req.length} goods you don't have.`);break;}
      if(times===0){if(!await decide(ctx,p,'confirm',{key:'sultan',title:PNAME[13],text:`Deliver ${req.length} goods for a ${W.ruby}? <span class="chips">${req.map(chip).join('')}</span>`,yes:'Deliver'}))break;}
      else{if(!hasCard(p,'dSultan')||!await decide(ctx,p,'confirm',{key:'dSultan',title:CARD_DEFS.dSultan.name,text:`Play your ${W.card} to deliver again? <span class="chips">${req.map(chip).join('')}</span>`,yes:'Play card'}))break;useCard(g,p,'dSultan');}
      req.forEach(x=>{if(x!=='*')p.goods[x]--;});
      for(const x of req)if(x==='*'){const opts=GOODS.filter(c=>p.goods[c]>0);const c=await decide(ctx,p,'pickGood',{key:'sultanAny',title:'Any good',text:'Pick the good to give for the open slot.',options:opts});p.goods[c]--;}
      g.sultanTaken++;gainRuby(ctx,p,PNAME[13]);times++;
    }
    break;}
  case 14:case 15:{
    const cols=MOSQUE[place];
    const opts=cols.filter(c=>!p.tiles[c]&&g.mosque[c].length&&p.goods[c]>=g.mosque[c][0]);
    if(!opts.length){note(ctx,p,`You can't claim a ${W.tile} here yet.`);break;}
    const c=await decide(ctx,p,'mosqueColor',{options:opts});
    if(!c)break;
    const req=g.mosque[c].shift();p.goods[c]--;p.tiles[c]=1;
    log(ctx,`${p.name} claims the ${GNAME[c]} ${W.tile} (showed ${req}).`,p);
    if(c==='b'){p.stack++;log(ctx,`${p.name} gains a 5th ${W.assistant}.`,p);}
    if(cols.every(x=>p.tiles[x])&&g.mosqueRubies[place]>0){g.mosqueRubies[place]--;gainRuby(ctx,p,PNAME[place]);}
    break;}
  case 16:{
    let times=0;
    for(;;){
      if(g.gemTaken>=g.gemRubies){if(!times)note(ctx,p,`The ${PNAME[16]} is sold out.`);break;}
      const price=gemPrice(g);
      if(p.lira<price){if(!times)note(ctx,p,`A ${W.ruby} costs ${L(price)} here.`);break;}
      if(times===0){if(!await decide(ctx,p,'confirm',{key:'gem',title:PNAME[16],text:`Buy a ${W.ruby} for ${L(price)}?`,yes:`Pay ${L(price)}`}))break;}
      else{if(!hasCard(p,'dGem')||!await decide(ctx,p,'confirm',{key:'dGem',title:CARD_DEFS.dGem.name,text:`Play your ${W.card} to buy another ${W.ruby} for ${L(price)}?`,yes:'Play card'}))break;useCard(g,p,'dGem');}
      p.lira-=price;g.gemTaken++;gainRuby(ctx,p,PNAME[16]);times++;
    }
    break;}
  }
}

/* ---------- decisions ---------- */
async function decide(ctx,p,kind,d={}){
  if(ctx.sim||p.ai)return aiDecide(ctx,p,kind,d);
  const r=await humanDecide(ctx,p,kind,d);checkGen(ctx);return r;
}
function need(g,p){
  const s={r:0,g:0,y:0,b:0};
  if(g.sultanTaken<g.sultanRubies){const cnt={r:0,g:0,y:0,b:0};sultanReq(g).forEach(x=>{if(x!=='*')cnt[x]++;});GOODS.forEach(c=>{if(p.goods[c]<cnt[c])s[c]+=3*(cnt[c]-p.goods[c]);});}
  [14,15].forEach(pl=>MOSQUE[pl].forEach(c=>{if(!p.tiles[c]&&g.mosque[c].length&&p.goods[c]<g.mosque[c][0])s[c]+=2;}));
  GOODS.forEach(c=>{if(c==='b')s[c]+=.5;if(p.goods[c]>=cap(p))s[c]=-99;});
  return s;
}
const bestGood=(g,p,opts)=>{const s=need(g,p);return opts.slice().sort((a,b)=>s[b]-s[a]||p.goods[a]-p.goods[b])[0];};
const spareGood=(g,p,opts)=>{const s=need(g,p);return opts.slice().sort((a,b)=>(p.goods[b]-p.goods[a])||(s[a]-s[b]))[0];};
const CARD_VAL={lira5:9,good:8,family:6,move34:5,dGem:4,dSultan:4,recall:4,dPost:4,smAny:3,stay:2};
const worstCard=p=>{let bi=0;p.cards.forEach((c,i)=>{if(CARD_VAL[c]<CARD_VAL[p.cards[bi]])bi=i;});return bi;};

async function aiDecide(ctx,p,kind,d){
  const g=ctx.G;
  switch(kind){
  case 'confirm':
    if(d.key==='gov')return p.lira>=5||p.cards.length>=1;
    if(d.key==='smug')return p.lira>=5||totalGoods(p)>=3;
    return true;
  case 'pickGood':
    if(d.key==='green'&&p.lira<4)return null;
    if(d.key==='sultanAny')return spareGood(g,p,d.options);
    return bestGood(g,p,d.options);
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
    if(depth>=2)return d.options.includes(16)&&p.lira>=gemPrice(g)?16:3;
    let best=null,bv=-1e9;
    for(const t of d.options){const C=clone(g);const q=C.players[p.i];q.family=t;await doAction({G:C,sim:true,depth:depth+1},q,t);const v=evalPlayer(C,q);if(v>bv){bv=v;best=t;}}
    return best;}
  case 'familyReward':return 'lira';
  case 'govPay':return p.lira>=4?'lira':worstCard(p);
  case 'smugPay':{if(p.lira>=6)return 'lira';const opts=GOODS.filter(c=>p.goods[c]>0);if(!opts.length)return 'lira';return spareGood(g,p,opts);}
  }
}

function evalPlayer(g,p){
  let v=p.rubies*70+Math.min(p.lira,30)+Math.max(0,p.lira-30)*.3+p.cards.length*3+[0,15,32,40][p.ext];
  const cp=cap(p);
  GOODS.forEach(c=>v+=Math.min(p.goods[c],cp)*(c==='b'?3.2:2.4));
  v+=(p.tiles.r?13:0)+(p.tiles.g?11:0)+(p.tiles.y?15:0)+(p.tiles.b?11:0);
  v+=p.stack*3;
  if(p.stack===0){v-=8;if([7,...Object.keys(p.assist).map(Number)].some(pl=>dist(g,p.pos,pl)<=2))v+=5;}
  if(g.sultanTaken<g.sultanRubies){const req=sultanReq(g);const nd={r:0,g:0,y:0,b:0};let any=0;req.forEach(x=>x==='*'?any++:nd[x]++);
    let have=0;GOODS.forEach(c=>have+=Math.min(p.goods[c],nd[c]));const extra=GOODS.reduce((s,c)=>s+Math.max(0,p.goods[c]-nd[c]),0);have+=Math.min(any,extra);
    const f=have/req.length;v+=14*f*f;}
  if(g.gemTaken<g.gemRubies){const f=Math.min(1,p.lira/gemPrice(g));v+=10*f*f;}
  [14,15].forEach(pl=>MOSQUE[pl].forEach(c=>{if(!p.tiles[c]&&g.mosque[c].length){const f=Math.min(1,p.goods[c]/g.mosque[c][0]);v+=6*f*f;}}));
  if(p.ext<3)v+=Math.min(1,p.lira/7)*4;
  return v;
}

async function simulate(g,pi,target,mode){
  const C=clone(g);const p=C.players[pi];if(mode!=='normal')useCard(C,p,mode);
  await resolveMove({G:C,sim:true,depth:1},target,mode);
  return evalPlayer(C,p);
}
async function rankMoves(g,p,modes){
  const cands=[];modes.forEach(m=>reachable(g,p,m).forEach(t=>cands.push({t,mode:m,pen:m==='normal'?0:5})));
  for(const c of cands){const runs=[8,9,12].includes(c.t)?3:1;let v=0;for(let r=0;r<runs;r++)v+=await simulate(g,p.i,c.t,c.mode);c.v=v/runs-c.pen+Math.random()*.6;}
  return cands.sort((a,b)=>b.v-a.v);
}

async function aiTurn(ctx){
  const g=ctx.G,p=cur(g);
  while(hasCard(p,'lira5')){useCard(g,p,'lira5');p.lira+=5;log(ctx,`${p.name} plays “${CARD_DEFS.lira5.name}”.`,p);}
  if(hasCard(p,'family')&&p.family!==12){useCard(g,p,'family');p.family=12;p.lira+=3;log(ctx,`${p.name} calls the ${W.family} home and takes ${L(3)}.`,p);}
  if(hasCard(p,'good')){const room=GOODS.filter(c=>p.goods[c]<cap(p));if(room.length){const c=bestGood(g,p,room);if(need(g,p)[c]>0){useCard(g,p,'good');p.goods[c]++;log(ctx,`${p.name} plays “${CARD_DEFS.good.name}” for ${GNAME[c]}.`,p);}}}
  const out=Object.keys(p.assist).map(Number);
  if(p.stack===0&&out.length){
    const far=out.sort((a,b)=>dist(g,p.pos,b)-dist(g,p.pos,a))[0];
    if(p.tiles.y&&p.lira>=2&&!p.yellowUsed){p.lira-=2;p.yellowUsed=true;recallFrom(p,far);log(ctx,`${p.name} pays ${L(2)} to bring an ${W.assistant} home.`,p);}
    else if(hasCard(p,'recall')){useCard(g,p,'recall');recallFrom(p,far);log(ctx,`${p.name} plays “${CARD_DEFS.recall.name}”.`,p);}
  }
  const best=(await rankMoves(g,p,hasCard(p,'move34')?['normal','move34']:['normal']))[0];
  checkGen(ctx);
  if(best.mode!=='normal'){useCard(g,p,best.mode);log(ctx,`${p.name} plays “${CARD_DEFS[best.mode].name}”.`,p);}
  UI.sel=best.t;render();await sleep(ctx,550);
  await resolveMove(ctx,best.t,best.mode);
}
function recallFrom(p,pl){p.assist[pl]--;if(p.assist[pl]<=0)delete p.assist[pl];p.stack++;}

/* ---------- human decision sheets ---------- */
function sheet(title,body,buttons,opt={}){
  return new Promise(res=>{
    const w=$('#sheetWrap'),s=$('#sheet');
    s.className=opt.wide?'wide':'';
    s.innerHTML=`<h2>${title}</h2><div class="sbody">${body}</div><div class="sbtns ${opt.grid?'grid':''}">${buttons.map((b,i)=>`<button class="btn ${b.primary?'primary':''} ${b.cls||''}" data-i="${i}" ${b.disabled?'disabled':''}>${b.label}</button>`).join('')}</div>`;
    w.hidden=false;
    s.querySelectorAll('.sbtns button').forEach(btn=>btn.onclick=()=>{w.hidden=true;res(buttons[+btn.dataset.i].value);});
    const f=s.querySelector('.sbtns button');if(f)f.focus({preventScroll:true});
  });
}
function sellSheet(p,d){
  return new Promise(res=>{
    const w=$('#sheetWrap'),s=$('#sheet');s.className='';const t=tileCount(d.tile);const sel={r:0,g:0,y:0,b:0};
    const goods=d.any?GOODS:GOODS.filter(c=>t[c]>0);
    const max=c=>d.any?p.goods[c]:Math.min(t[c],p.goods[c]);
    const tot=()=>GOODS.reduce((a,c)=>a+sel[c],0);
    const fill=()=>{GOODS.forEach(c=>sel[c]=0);let left=5;goods.slice().sort((a,b)=>max(b)-max(a)).forEach(c=>{const k=Math.min(left,max(c));sel[c]=k;left-=k;});};
    fill();
    const draw=()=>{const n=tot();
      s.innerHTML=`<h2>${PNAME[d.place]}</h2><div class="sbody"><p>Demand: <span class="chips">${d.tile.map(chip).join('')}</span>${d.any?` · ${CARD_DEFS.smAny.name}: sell any types.`:''}</p>
      ${goods.map(c=>`<div class="srow"><span>${chip(c)} ${GNAME[c]} <small class="muted">have ${p.goods[c]}${d.any?'':`, wanted ${t[c]}`}</small></span>
      <button class="btn" data-c="${c}" data-d="-1" ${sel[c]<=0?'disabled':''} aria-label="Sell one fewer ${GNAME[c]}">−</button><output>${sel[c]}</output>
      <button class="btn" data-c="${c}" data-d="1" ${sel[c]>=max(c)||n>=5?'disabled':''} aria-label="Sell one more ${GNAME[c]}">+</button></div>`).join('')}
      <div class="total">${n} ${plural(n,'good','goods')} → ${L(d.rev[n])}</div></div>
      <div class="sbtns"><button class="btn primary" data-act="sell">${n?`Sell for ${L(d.rev[n])}`:'Sell nothing'}</button><button class="btn" data-act="none">Clear</button></div>`;
      s.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{sel[b.dataset.c]+=+b.dataset.d;draw();});
      s.querySelector('[data-act=none]').onclick=()=>{GOODS.forEach(c=>sel[c]=0);draw();};
      s.querySelector('[data-act=sell]').onclick=()=>{w.hidden=true;res({...sel});};
    };
    draw();w.hidden=false;
  });
}
const dieFace=n=>`<span class="die" data-v="${n}">${[...Array(9)].map((_,i)=>`<i class="${PIPS[n].includes(i)?'on':''}"></i>`).join('')}</span>`;
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
async function humanDecide(ctx,p,kind,d){
  switch(kind){
  case 'confirm':return sheet(d.title,`<p>${d.text}</p>`,[{label:d.yes||'Yes',value:true,primary:true},{label:d.no||'No thanks',value:false}]);
  case 'pickGood':return sheet(d.title,`<p>${d.text}</p>`,[...d.options.map(c=>({label:`${chip(c)} ${GNAME[c]} <small>${p.goods[c]}/${cap(p)}</small>`,value:c})),...(d.allowSkip?[{label:'Skip',value:null}]:[])]);
  case 'pickNumber':{const b=[];for(let n=3;n<=12;n++)b.push({label:`<b>${n}</b><small>${Math.round(probAtLeast(n)*100)}% chance</small>`,value:n,cls:'num'});
    return sheet(PNAME[9],`<p>Announce a number, then roll two dice. Meet or beat it to take that many ${W.cur}; otherwise take 2.</p>`,b,{grid:true});}
  case 'dice':{const[a,b]=d.dice,lo=Math.min(a,b);const btns=[{label:`Keep ${a+b}`,value:'keep',primary:true}];
    if(lo<4)btns.push({label:`Turn the ${lo} into 4 (total ${a+b-lo+4})`,value:'four'});btns.push({label:'Re-roll both',value:'reroll'});
    return sheet(`${GNAME.r} ${W.tile}`,`<div class="dice">${dieFace(a)}${dieFace(b)}</div><p>${d.purpose==='tea'?`You announced ${d.target}.`:`${GNAME.b}: 7–8 gives 1 · 9–10 gives 2 · 11–12 gives 3`}</p>`,btns);}
  case 'sell':return sellSheet(p,d);
  case 'cardSource':return sheet(PNAME[6],`<p>Take ${W.card} ${d.n} of 2.</p>`,[{label:'Draw from the pile',value:'deck',primary:true},{label:`Take “${CARD_DEFS[d.top].name}” from the discards`,value:'discard'}]);
  case 'discardCard':return sheet(d.title||'Discard a card',`<p>Choose a ${W.card} to discard.</p>`,p.cards.map((c,i)=>({label:`${CARD_DEFS[c].name} <small>${CARD_DEFS[c].text}</small>`,value:i})));
  case 'mosqueColor':return sheet(`Claim a ${W.tile}`,'<p>Pay 1 of the shown goods to take the tile.</p>',[...d.options.map(c=>({label:`${chip(c)} ${GNAME[c]} tile <small>needs ${G.mosque[c][0]} · ${TILE_ABIL[c]}</small>`,value:c})),{label:'Skip',value:null}]);
  case 'policeTarget':return sheet(PNAME[12],`<p>Send your ${W.family} to any place and take that action there. No ${W.assistant} needed and no encounters.</p>`,[...d.options.map(pl=>({label:PNAME[pl],value:pl})),{label:'Skip',value:null}],{grid:true});
  case 'familyReward':return sheet(`${W.family[0].toUpperCase()+W.family.slice(1)} caught`,`<p>You sent ${d.name}'s ${W.family} to the ${PNAME[12]}. Choose your reward.</p>`,[{label:`Take ${L(3)}`,value:'lira',primary:true},{label:`Draw a ${W.card}`,value:'card'}]);
  case 'govPay':return sheet(`Pay the ${W.gov}`,`<p>Pay ${L(2)} or discard a ${W.card}.</p>`,[...(p.lira>=2?[{label:`Pay ${L(2)}`,value:'lira',primary:true}]:[]),...p.cards.map((c,i)=>({label:'Discard “'+CARD_DEFS[c].name+'”',value:i}))]);
  case 'smugPay':return sheet(`Pay the ${W.smug}`,`<p>Pay ${L(2)} or 1 good.</p>`,[...(p.lira>=2?[{label:`Pay ${L(2)}`,value:'lira',primary:true}]:[]),...GOODS.filter(c=>p.goods[c]>0).map(c=>({label:`Pay 1 ${chip(c)} ${GNAME[c]}`,value:c}))]);
  }
}

/* ---------- human turn controls ---------- */
const liveCtx=()=>({G,sim:false,gen:GEN});
function isMine(q){if(!q||q.ai)return false;return ON.code?ownerOf(q)===ME:true;}
const myTurnNow=()=>G&&!G.over&&isMine(cur(G))&&(!ON.code||ON.driving)&&['move','post'].includes(UI.phase);
async function cardTap(pi,i){
  const p=G.players[pi];if(!p||UI.busy)return;
  if(ON.code?ownerOf(p)!==ME:p.ai)return;
  const myTurn=p===cur(G)&&(!ON.code||ON.driving);
  const t=p.cards[i],def=CARD_DEFS[t];const canAct=myTurn&&['move','post'].includes(UI.phase);const moving=myTurn&&UI.phase==='move';
  let playable=false,label='Play card',hint=myTurn?'':'You can play this on your turn.';
  if(t==='lira5'||t==='good')playable=canAct;
  if(t==='family'){playable=canAct&&p.family!==12;if(p.family===12)hint=`Your ${W.family} is already at the ${PNAME[12]}.`;}
  if(t==='stay'||t==='move34'){playable=moving;label=UI.mode===t?'Cancel':'Use for this move';if(!moving)hint='Only before you move.';}
  if(t==='recall'){playable=moving&&Object.keys(p.assist).length>0;if(!moving)hint='Only before you move.';else if(!playable)hint=`All your ${W.assistants} are already with you.`;}
  if(['dSultan','dPost','dGem','smAny'].includes(t))hint='You will be offered this card during that action.';
  UI.busy=true;
  try{
    const ok=await sheet(def.name,`<p>${def.text}</p>${hint?`<p class="muted">${hint}</p>`:''}`,playable?[{label,value:true,primary:true},{label:'Close',value:false}]:[{label:'Close',value:false}]);
    if(!ok)return;
    const ctx=liveCtx();
    if(t==='lira5'){useCard(G,p,t);p.lira+=5;log(ctx,`${p.name} plays “${def.name}”.`,p);}
    else if(t==='good'){const room=GOODS.filter(c=>p.goods[c]<cap(p));if(!room.length){toast(`Your ${W.cart} is full.`);return;}
      const c=await humanDecide(ctx,p,'pickGood',{title:def.name,text:'Choose a good.',options:room,allowSkip:true});if(c){useCard(G,p,t);p.goods[c]++;log(ctx,`${p.name} plays “${def.name}” for ${GNAME[c]}.`,p);}}
    else if(t==='family'){useCard(G,p,t);p.family=12;const r=await humanDecide(ctx,p,'familyReward',{name:'your own'});if(r==='card'){const c=drawCard(G);if(c)p.cards.push(c);}else p.lira+=3;log(ctx,`${p.name} calls the ${W.family} home.`,p);}
    else if(t==='stay'||t==='move34'){UI.mode=UI.mode===t?'normal':t;UI.sel=null;UI.sugg=null;}
    else if(t==='recall'){const pl=await pickAssistant(p);if(pl!=null){useCard(G,p,t);recallFrom(p,pl);log(ctx,`${p.name} plays “${def.name}”.`,p);}}
  }finally{UI.busy=false;render();}
}
function pickAssistant(p){const out=Object.keys(p.assist).map(Number);return sheet(`Bring an ${W.assistant} home`,`<p>Choose where to collect one ${W.assistant} from.</p>`,[...out.map(pl=>({label:PNAME[pl],value:pl})),{label:'Cancel',value:null}]);}
async function yellowTap(){
  const p=cur(G);if(UI.busy)return;UI.busy=true;
  try{const pl=await pickAssistant(p);if(pl!=null){p.lira-=2;p.yellowUsed=true;recallFrom(p,pl);log(liveCtx(),`${p.name} pays ${L(2)} to bring an ${W.assistant} home.`,p);}}
  finally{UI.busy=false;render();}
}
async function suggestMove(){
  if(UI.busy||UI.phase!=='move')return;const p=cur(G);UI.busy=true;
  const saved=RNG_N;
  try{const r=await rankMoves(G,p,[UI.mode]);if(r.length){UI.sugg=r[0].t;UI.sel=r[0].t;toast(`Suggested: ${PNAME[r[0].t]}`);}}
  finally{RNG_N=saved;UI.busy=false;render();}
}
function restoreInPlace(obj,snap){const s=JSON.parse(snap);Object.keys(obj).forEach(k=>delete obj[k]);Object.assign(obj,s);}

/* ---------- game loop ---------- */
async function playTurn(ctx){
  const p0=cur(G);p0.yellowUsed=false;UI.mode='normal';UI.sel=null;UI.sugg=null;
  log(ctx,p0.name==='You'?'Your turn':`${p0.name}'s turn`,p0,true);
  if(p0.ai){UI.phase='ai';render();await sleep(ctx,400);await aiTurn(ctx);await sleep(ctx,700);return;}
  TURN={snap:JSON.stringify(G),rng:RNG_N};
  for(;;){
    UI.phase='move';UI.sel=null;UI.sugg=null;render();
    const target=await new Promise(r=>pendingMove=r);pendingMove=null;checkGen(ctx);
    const mode=UI.mode;const p=cur(G);if(mode!=='normal')useCard(G,p,mode);
    UI.phase='busy';UI.sel=null;UI.sugg=null;render();
    await resolveMove(ctx,target,mode);checkGen(ctx);
    UI.phase='post';UI.sel=null;render();
    const r=await new Promise(r=>pendingEnd=r);pendingEnd=null;checkGen(ctx);
    if(r==='undo'&&RNG_N===TURN.rng){FX.quiet=true;restoreInPlace(G,TURN.snap);UI.mode='normal';toast('Move undone');continue;}
    break;
  }
}
function finishGame(ctx){
  const g=ctx.G;
  g.players.forEach(p=>{p.cards.slice().forEach(c=>{
    if(c==='lira5'){useCard(g,p,c);p.lira+=5;}
    if(c==='good'){const room=GOODS.filter(x=>p.goods[x]<cap(p));if(room.length){useCard(g,p,c);p.goods[room[0]]++;}}});});
  const rank=g.players.slice().sort((a,b)=>b.rubies-a.rubies||b.lira-a.lira||totalGoods(b)-totalGoods(a)||b.cards.length-a.cards.length);
  g.result=rank.map(p=>p.i);g.over=true;UI.phase='over';
  log(ctx,`${rank[0].name} wins the ${W.market}.`,rank[0],true);
}
function advanceTurn(ctx){const g=ctx.G;g.current=(g.current+1)%g.players.length;if(g.current===g.start){if(g.endTriggered)finishGame(ctx);else g.round++;}}
async function gameLoop(){
  const ctx=liveCtx();
  try{
    while(!G.over){save();await playTurn(ctx);checkGen(ctx);advanceTurn(ctx);}
    save();render();showEnd();
  }catch(e){if(e!==ABORT){console.error(e);toast('Something went wrong: '+e.message);}}
}
function save(){if(ON.code)return;try{localStorage.setItem(STORE,JSON.stringify(G));}catch(e){}}
function startGame(cfg){leaveOnline();showScreen('table');GEN++;pendingMove=pendingEnd=null;G=newGame(cfg);UI={phase:'idle',sel:null,mode:'normal',busy:false};$('#sheetWrap').hidden=true;render();gameLoop();}
function resumeGame(saved){leaveOnline();showScreen('table');GEN++;pendingMove=pendingEnd=null;G=saved;UI={phase:'idle',sel:null,mode:'normal',busy:false};$('#sheetWrap').hidden=true;render();if(G.over){UI.phase='over';render();}else gameLoop();}

/* ---------- sound (synthesised, no files) ---------- */
const SND={ctx:null,on:lsGet('istanbul-sound')!=='off'};
function actx(){if(!SND.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{SND.ctx=new A();}catch(e){return null;}}if(SND.ctx.state==='suspended')SND.ctx.resume();return SND.ctx;}
addEventListener('pointerdown',()=>{if(SND.on)actx();});
function tone(f,t0,dur,type,vol,f2){const c=SND.ctx;const t=c.currentTime+t0;const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.02);}
function noise(t0,dur,vol,freq){const c=SND.ctx;const t=c.currentTime+t0;const b=c.createBuffer(1,Math.ceil(c.sampleRate*dur),c.sampleRate);const a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=1.2;const g=c.createGain();g.gain.value=vol;s.connect(f).connect(g).connect(c.destination);s.start(t);}
const SFX={
  coin(){tone(1568,0,.16,'triangle',.11);tone(2093,.06,.22,'triangle',.09);},
  goods(){tone(392,0,.1,'triangle',.12,330);tone(523,.05,.12,'triangle',.08);},
  move(){tone(170,0,.14,'sine',.28,110);noise(0,.06,.18,700);},
  dice(){for(let i=0;i<6;i++)noise(i*.065+Math.random()*.02,.045,.35,1800+Math.random()*1800);},
  ruby(){[784,988,1175,1568].forEach((f,i)=>tone(f,i*.09,.6,'sine',.12));tone(2349,.4,.8,'sine',.05);},
  turn(){tone(659,0,.4,'sine',.14);tone(988,.13,.55,'sine',.1);},
  card(){noise(0,.14,.16,3200);},
  bad(){tone(196,0,.22,'triangle',.12,147);}
};
function sfx(n){if(!SND.on||!SND.ctx)return;try{if(SND.ctx.state==='suspended')SND.ctx.resume();SFX[n]();}catch(e){}}
function setSound(on){SND.on=on;lsSet('istanbul-sound',on?'on':'off');if(on){actx();sfx('coin');}renderSoundBtn();}
function renderSoundBtn(){const b=$('#soundBtn');b.setAttribute('aria-pressed',String(SND.on));b.title=SND.on?'Sound is on':'Sound is off';b.innerHTML=`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${SND.on?'<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>':'<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'}</svg><span class="sr">${SND.on?'Sound on':'Sound off'}</span>`;}

/* ---------- board-game effects: sliding tokens, gain pop-ups, dice, ruby flourish ---------- */
const FX={prev:null,quiet:false,rollSeen:null};
function fxSnap(){return{id:G.id,cur:G.current,over:G.over,roll:G.lastRoll?G.lastRoll.n:0,players:G.players.map(p=>({pos:p.pos,lira:p.lira,goods:{...p.goods},rubies:p.rubies,cards:p.cards.length,ext:p.ext,tiles:GOODS.reduce((s,c)=>s+p.tiles[c],0)}))};}
function tokenRects(){const b=$('#board');if(!b)return{};const br=b.getBoundingClientRect();const o={};b.querySelectorAll('[data-k]').forEach(el=>{const r=el.getBoundingClientRect();o[el.dataset.k]={x:r.left-br.left,y:r.top-br.top};});return o;}
function runFx(before){
  const prev=FX.prev,now=fxSnap();FX.prev=now;
  const same=prev&&prev.id===now.id&&prev.players.length===now.players.length;
  if(!same){FX.rollSeen=now.roll;FX.quiet=false;return;}
  const b=$('#board'),br=b.getBoundingClientRect();
  // slide tokens from where they were
  if(!REDUCED)b.querySelectorAll('[data-k]').forEach(el=>{const was=before[el.dataset.k];const r=el.getBoundingClientRect();
    if(was){const dx=was.x-(r.left-br.left),dy=was.y-(r.top-br.top);if(Math.abs(dx)+Math.abs(dy)>2)el.animate([{translate:`${dx}px ${dy}px`},{translate:'0 0'}],{duration:520,easing:'cubic-bezier(.3,.75,.25,1)'});}
    else el.animate([{scale:0,opacity:0},{scale:1.25,opacity:1,offset:.6},{scale:1}],{duration:380,easing:'ease-out'});});
  const sounds=new Set();
  if(now.players.some((p,i)=>p.pos!==prev.players[i].pos))sounds.add('move');
  if(!FX.quiet){
    now.players.forEach((p,i)=>{
      const q=prev.players[i],bits=[];
      const dl=p.lira-q.lira;if(dl)bits.push(`<span class="${dl>0?'up':'down'}">${dl>0?'+':'−'}${Math.abs(dl)} ${W.curShort}</span>`);
      GOODS.forEach(c=>{const d=p.goods[c]-q.goods[c];if(d)bits.push(`<span class="${d>0?'up':'down'}">${d>0?'+':'−'}${Math.abs(d)}${chip(c)}</span>`);});
      const dc=p.cards-q.cards;if(dc>0)bits.push(`<span class="up">+${dc} ${plural(dc,'card','cards')}</span>`);
      if(p.ext>q.ext)bits.push(`<span class="up">${W.cart} +1</span>`);
      if(p.tiles>q.tiles)bits.push(`<span class="up">+1 tile</span>`);
      if(dl>0)sounds.add('coin');if(GOODS.some(c=>p.goods[c]>q.goods[c]))sounds.add('goods');if(dc>0)sounds.add('card');
      if(bits.length)popGain(i,bits.join(''));
      if(bits.length){const el=document.querySelector(`.pl[data-pi="${i}"]`);if(el&&!REDUCED)el.animate([{background:'color-mix(in srgb, var(--turq) 22%, transparent)'},{background:'transparent'}],{duration:1200});}
      if(p.rubies>q.rubies){rubyFlourish(i,p.rubies);sounds.add('ruby');}
    });
  }
  FX.quiet=false;
  if(now.roll!==FX.rollSeen&&G.lastRoll){FX.rollSeen=now.roll;showDice(G.lastRoll);sounds.add('dice');}
  if(now.cur!==prev.cur&&!now.over&&isMine(G.players[now.cur]))sounds.add('turn');
  if(sounds.has('ruby'))sounds.delete('coin');
  [...sounds].forEach((s,k)=>setTimeout(()=>sfx(s),k*90));
}
function popGain(i,html){
  const tok=document.querySelector(`#board [data-k="m${i}"]`);if(!tok)return;
  const r=tok.getBoundingClientRect();const el=document.createElement('div');el.className='gain';el.innerHTML=html;
  el.style.left=(r.left+r.width/2)+'px';el.style.top=(r.top)+'px';document.body.appendChild(el);
  const a=el.animate([{transform:'translate(-50%,0)',opacity:0},{transform:'translate(-50%,-14px)',opacity:1,offset:.15},{transform:'translate(-50%,-34px)',opacity:1,offset:.75},{transform:'translate(-50%,-48px)',opacity:0}],{duration:REDUCED?1400:1900,easing:'ease-out'});
  a.onfinish=()=>el.remove();
}
function rubyFlourish(i,n){
  const p=G.players[i];const el=document.createElement('div');el.className='flourish';
  el.innerHTML=`<svg viewBox="0 0 64 56" width="76" height="66" aria-hidden="true"><path d="M14 2h36l14 16-32 36L0 18z" fill="var(--bole)"/><path d="M14 2l6 16h24l6-16M0 18h64M20 18l12 36 12-36" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none"/></svg><b>${esc(p.name)}</b><span>earns a ${W.ruby} · ${n} of ${winTarget(G)}</span>`;
  document.body.appendChild(el);
  const a=el.animate(REDUCED?[{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.85},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-50%) scale(.4) rotate(-12deg)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.08) rotate(3deg)',offset:.18},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.3},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.82},{opacity:0,transform:'translate(-50%,-58%) scale(.96)'}],{duration:2100,easing:'ease-out'});
  a.onfinish=()=>el.remove();
}
let diceEl=null;
function showDice(r){
  if(diceEl)diceEl.remove();
  const p=G.players[r.who];const el=document.createElement('div');el.className='diceroll';diceEl=el;
  const s=r.d[0]+r.d[1];
  let res='';
  if(r.purpose==='tea')res=s>=r.target?`Needed ${r.target}: takes ${L(r.target)}`:`Needed ${r.target}: takes ${L(2)}`;
  else{const blue=s>=11?3:s>=9?2:s>=7?1:0;res=blue?`+${blue} ${GNAME.b}`:`No ${GNAME.b}`;}
  el.innerHTML=`<div class="who"><i class="mer c-${p.color}"></i>${esc(p.name)}${r.note?` · ${r.note}`:''}</div><div class="dice">${dieFace(1)}${dieFace(1)}</div><div class="res"><b>${s}</b> <span>${res}</span></div>`;
  document.body.appendChild(el);
  const faces=el.querySelectorAll('.die'),resEl=el.querySelector('.res');resEl.style.visibility='hidden';
  let k=0;const spin=REDUCED?0:9;
  const tick=()=>{if(k<spin){faces.forEach(f=>f.outerHTML);faces[0].innerHTML=dieFace(1+Math.floor(Math.random()*6)).replace(/^<span[^>]*>|<\/span>$/g,'');faces[1].innerHTML=dieFace(1+Math.floor(Math.random()*6)).replace(/^<span[^>]*>|<\/span>$/g,'');faces.forEach(f=>f.animate([{rotate:'-14deg'},{rotate:'12deg'}],{duration:70}));k++;setTimeout(tick,65);}
    else{faces[0].innerHTML=dieFace(r.d[0]).replace(/^<span[^>]*>|<\/span>$/g,'');faces[1].innerHTML=dieFace(r.d[1]).replace(/^<span[^>]*>|<\/span>$/g,'');resEl.style.visibility='visible';}};
  tick();
  el.animate([{opacity:0,transform:'translate(-50%,-12px)'},{opacity:1,transform:'translate(-50%,0)',offset:.08},{opacity:1,transform:'translate(-50%,0)',offset:.9},{opacity:0,transform:'translate(-50%,-6px)'}],{duration:2600}).onfinish=()=>{el.remove();if(diceEl===el)diceEl=null;};
}

/* ---------- clarity: hints, recap, rules ---------- */
function hintFor(p,pl,mode){
  const g=G;
  if(pl!==7&&!(mode!=='stay'&&p.assist[pl])&&p.stack<=0)return{t:`No ${W.assistant}`,k:'bad'};
  if(pl!==7){const n=g.players.filter(q=>q!==p&&q.pos===pl).length+g.neutrals.filter(x=>x.pos===pl).length;if(p.lira<2*n)return{t:`Can't pay ${2*n}${W.curShort}`,k:'bad'};}
  const fam=pl!==12&&g.players.some(q=>q!==p&&q.family===pl)?' +catch':'';
  const H=(t,k)=>({t:t+fam,k:k||(fam?'good':'')});
  switch(pl){
  case 1:return p.ext>=3?H('Fully extended','meh'):p.lira>=7?H(p.ext===2?`◆ Extend`:'Extend cart',p.ext===2?'ruby':'good'):H(`Need ${7-p.lira}${W.curShort} more`,'meh');
  case 2:case 3:case 4:{const c={2:'r',3:'g',4:'y'}[pl];const n=cap(p)-p.goods[c];return n?H(`+${n} ${chip(c)}`,'good'):H('Already full','meh');}
  case 5:{let l=0,gd=0;postItems(g).forEach(it=>{if(it.l)l+=it.l;else if(p.goods[it.g]<cap(p))gd++;});return H(`+${l}${W.curShort} +${gd} goods`,'good');}
  case 6:return H('+1 card','good');
  case 7:{let n=0;for(const k in p.assist)n+=p.assist[k];return n?H(`${n} home`,'good'):H('Nothing out','meh');}
  case 8:return H('Good + roll','good');
  case 9:return H('Gamble','good');
  case 10:case 11:{const mk=pl===10?g.large:g.small;const t=tileCount(mk[0]);let n=Math.min(5,GOODS.reduce((s,c)=>s+Math.min(t[c],p.goods[c]),0));if(pl===11&&hasCard(p,'smAny'))n=Math.max(n,Math.min(5,totalGoods(p)));return n?H(`Sell ${n}: ${REV[pl][n]}${W.curShort}`,'good'):H('Nothing to sell','meh');}
  case 12:return p.family===12?H('Free action','good'):H(`${W.family} away`,'meh');
  case 13:{if(g.sultanTaken>=g.sultanRubies)return H('Sold out','meh');const m=sultanMissing(p,sultanReq(g));return m?H(`Need ${m} more`,'meh'):H(`◆ Deliver`,'ruby');}
  case 14:case 15:{const cols=MOSQUE[pl];const ok=cols.filter(c=>!p.tiles[c]&&g.mosque[c].length&&p.goods[c]>=g.mosque[c][0]);
    if(ok.length){const done=cols.every(c=>p.tiles[c]||ok.includes(c))&&cols.filter(c=>!p.tiles[c]).length===1;return H(done?'◆ Tile':'Claim tile',done&&g.mosqueRubies[pl]>0?'ruby':'good');}
    const left=cols.filter(c=>!p.tiles[c]&&g.mosque[c].length);if(!left.length)return H('Done','meh');
    const c=left.sort((a,b)=>(g.mosque[a][0]-p.goods[a])-(g.mosque[b][0]-p.goods[b]))[0];return H(`Need ${g.mosque[c][0]} ${chip(c)}`,'meh');}
  case 16:{if(g.gemTaken>=g.gemRubies)return H('Sold out','meh');const pr=gemPrice(g);return p.lira>=pr?H(`◆ ${pr}${W.curShort}`,'ruby'):H(`Need ${pr-p.lira}${W.curShort} more`,'meh');}
  }
  return H('');
}
function recapFor(p){
  const out=[];
  for(let i=1;i<G.log.length;i++){const e=G.log[i];if(e.s&&e.c===p.color)break;out.push(e);}
  return out.reverse().slice(-16);
}
function rulesSheet(){
  const pl=Object.keys(T.places).map(Number).sort((a,b)=>a-b);
  sheet('How to play',`<div class="rules">
    <p><b>Goal.</b> Be the first to collect ${winTarget(G||{players:[1,2,3]})===6?6:5} ${W.rubies} (6 with two players). The round then finishes so everyone has had the same number of turns. Ties go to the most ${W.cur}.</p>
    <h4>Your turn, in order</h4>
    <ol>
      <li><b>Move</b> your ${W.merchant} 1 or 2 places (no diagonals). You may first play ${W.cards} that say “before moving”.</li>
      <li><b>${W.assistants[0].toUpperCase()+W.assistants.slice(1)}.</b> Leave one ${W.assistant} at the place, or pick up the one waiting there. With no ${W.assistant} along, your turn ends. The ${PNAME[7]} needs none.</li>
      <li><b>Other ${W.merchants}.</b> Pay ${L(2)} to each other ${W.merchant} already there.</li>
      <li><b>Action.</b> Take the place's action (it's optional).</li>
      <li><b>Encounters.</b> Catch another player's ${W.family} for a reward, and deal with the ${W.gov} or ${W.smug} if they're here.</li>
    </ol>
    <h4>Places</h4>
    <div class="rplaces">${pl.map(n=>`<div><b>${n}. ${PNAME[n]}</b><span>${PDESC[n]}</span></div>`).join('')}</div>
    <h4>${W.tiles[0].toUpperCase()+W.tiles.slice(1)}</h4>
    <div class="rplaces">${GOODS.map(c=>`<div><b>${chip(c)} ${GNAME[c]}</b><span>${TILE_ABIL[c]}</span></div>`).join('')}</div>
    <h4>${W.cards[0].toUpperCase()+W.cards.slice(1)}</h4>
    <div class="rplaces">${Object.values(CARD_DEFS).map(d=>`<div><b>${d.name} ×${d.n}</b><span>${d.text}</span></div>`).join('')}</div>
    <h4>Tips</h4>
    <p>Reachable places show a hint of what you'd get. ◆ marks a ${W.ruby} you can take right now. <b>Suggest</b> asks the AI for its pick, and <b>Undo</b> takes back a move as long as no dice were rolled and no cards were drawn.</p>
  </div>`,[{label:'Close',value:null,primary:true}],{wide:true});
}

/* ---------- rendering ---------- */
function tileStatus(pl){
  switch(pl){
  case 1:return `<span class="ruby">◆${G.wainRubies}</span> 7${W.curShort}`;
  case 2:case 3:case 4:return `${chip({2:'r',3:'g',4:'y'}[pl])} fill up`;
  case 5:return postItems(G).map(it=>it.g?chip(it.g):`${it.l}${W.curShort}`).join(' ');
  case 6:return '+2 −1 cards';
  case 7:return `${W.assistants} home`;
  case 8:return 'good + dice';
  case 9:return 'bet 3–12';
  case 10:return G.large[0].map(chip).join('');
  case 11:return G.small[0].map(chip).join('');
  case 12:return 'free action';
  case 13:{const left=G.sultanRubies-G.sultanTaken;return left?`<span class="ruby">◆${left}</span> ${sultanReq(G).length} goods`:'sold out';}
  case 14:case 15:return MOSQUE[pl].map(c=>`${chip(c)}${G.mosque[c].length?G.mosque[c][0]:'–'}`).join(' ')+` <span class="ruby">◆${G.mosqueRubies[pl]}</span>`;
  case 16:{const left=G.gemRubies-G.gemTaken;return left?`<span class="ruby">◆${left}</span> ${gemPrice(G)}${W.curShort}`:'sold out';}
  }
}
function merchantToken(q,active){
  const art=T.art.merchants&&T.art.merchants[q.color];
  return `<i class="mer c-${q.color} ${active?'active':''} ${art?'standee':''}" data-k="m${q.i}" title="${esc(q.name)}">${art?`<img src="${art}" alt="">`:q.stack}</i>`;
}
function tokens(pl){
  const p=cur(G);let h='';
  G.players.forEach(q=>{if(q.pos===pl)h+=merchantToken(q,q===p&&!G.over);});
  G.neutrals.forEach((x,k)=>{if(x.pos===pl)h+=`<i class="mer c-grey" data-k="n${k}" title="Neutral ${W.merchant}"></i>`;});
  G.players.forEach(q=>{if(q.assist[pl])h+=`<i class="ast c-${q.color}" data-k="a${q.i}-${pl}" title="${esc(q.name)}'s ${W.assistant}">${q.assist[pl]>1?q.assist[pl]:''}</i>`;});
  G.players.forEach(q=>{if(q.family===pl)h+=`<i class="fam c-${q.color}" data-k="f${q.i}" title="${esc(q.name)}'s ${W.family}"></i>`;});
  if(G.gov===pl)h+=`<i class="gov" data-k="gov" title="${W.gov}"><b>${W.gov[0]}</b></i>`;
  if(G.smug===pl)h+=`<i class="smg" data-k="smug" title="${W.smug}"><b>${W.smug[0]}</b></i>`;
  return h;
}
function placeDetail(pl){
  const p=cur(G);
  switch(pl){
  case 1:return `<div class="detail"><span><span class="k">${W.rubies} left</span><span class="ruby">◆ ${G.wainRubies}</span></span><span><span class="k">Your extensions</span>${p.ext}/3</span></div>`;
  case 5:return `<div class="detail"><span><span class="k">Showing now</span><span class="chips">${postItems(G).map(it=>it.g?chip(it.g)+' '+GNAME[it.g]:L(it.l)).join(' · ')}</span></span></div>`;
  case 10:case 11:{const mk=pl===10?G.large:G.small;return `<div class="detail"><span><span class="k">Demand tile</span><span class="chips">${mk[0].map(chip).join('')}</span></span><span><span class="k">Next</span><span class="chips">${mk[1].map(chip).join('')}</span></span></div>`;}
  case 12:{const f=G.players.filter(q=>q.family===12).map(q=>esc(q.name));return `<div class="detail"><span><span class="k">${W.family}s here</span>${f.length?f.join(', '):'none'}</span></div>`;}
  case 13:{const left=G.sultanRubies-G.sultanTaken;return `<div class="detail"><span><span class="k">Next delivery</span>${left?`<span class="chips">${sultanReq(G).map(chip).join('')}</span>`:'—'}</span><span><span class="k">${W.rubies} left</span><span class="ruby">◆ ${left}</span></span></div>`;}
  case 14:case 15:return `<div class="detail">${MOSQUE[pl].map(c=>`<span><span class="k">${GNAME[c]} tile</span>${G.mosque[c].length?`needs ${G.mosque[c][0]} ${chip(c)}`:'gone'} <small class="muted">${TILE_ABIL[c]}</small></span>`).join('')}<span><span class="k">${W.rubies} left</span><span class="ruby">◆ ${G.mosqueRubies[pl]}</span></span></div>`;
  case 16:{const left=G.gemRubies-G.gemTaken;return `<div class="detail"><span><span class="k">Price</span>${left?L(gemPrice(G)):'—'}</span><span><span class="k">${W.rubies} left</span><span class="ruby">◆ ${left}</span></span></div>`;}
  }
  return '';
}
function preview(p,pl,mode){
  const out=[];
  if(pl===7)out.push({t:`No ${W.assistant} needed at the ${PNAME[7]}.`});
  else if(mode!=='stay'&&p.assist[pl])out.push({t:`Your ${W.assistant} is waiting here; you pick it up.`,c:'good'});
  else if(p.stack>0)out.push({t:`Leave 1 ${W.assistant} here (${p.stack-1} stay with you).`});
  else out.push({t:`No ${W.assistant} with you. Your turn would end on arrival.`,c:'bad'});
  if(pl!==7){const n=G.players.filter(q=>q!==p&&q.pos===pl).length+G.neutrals.filter(x=>x.pos===pl).length;
    if(n)out.push({t:`Pay ${L(2*n)} to the ${plural(n,W.merchant,W.merchants)} here.`,c:p.lira>=2*n?'':'bad'});}
  const h=hintFor(p,pl,mode);if(h.t&&h.k!=='bad')out.push({t:`You'd get: ${h.t.replace(' +catch','')}`,c:h.k==='meh'?'':'good'});
  const fams=G.players.filter(q=>q!==p&&q.family===pl&&pl!==12);
  if(fams.length)out.push({t:`Catch ${fams.map(q=>esc(q.name)).join(', ')}'s ${W.family} for a reward.`,c:'good'});
  if(G.gov===pl)out.push({t:`The ${W.gov} is here: draw a ${W.card} for ${L(2)} or a card.`});
  if(G.smug===pl)out.push({t:`The ${W.smug} is here: take a good for ${L(2)} or a good.`});
  return out;
}
function render(){
  if(!G)return;
  const before=tokenRects();
  const p=cur(G);
  $('#roundInfo').textContent=G.over?'Game over':`Round ${G.round}${G.endTriggered?' · final':''}`;
  const mineNow=isMine(p)&&(!ON.code||ON.driving);
  // banner
  let msg='',acts='';
  if(G.over)msg='The game is over.';
  else if(UI.phase==='ai')msg=esc(G.log[0]&&!G.log[0].s?G.log[0].t:`${p.name} is thinking…`);
  else if(UI.phase==='move'&&mineNow)msg=UI.mode==='stay'?'Stay put: tap your own place, then Stay here.':UI.mode==='move34'?'Long stride: tap a place 3 or 4 steps away.':'Tap a highlighted place, then Move here.';
  else if(UI.phase==='busy')msg=esc(G.log[0]&&!G.log[0].s?G.log[0].t:'Resolving your action…');
  else if(UI.phase==='post')msg='Play a card if you like, then end your turn.';
  else{const e=G.log.find(x=>!x.s);msg=esc(e?e.t:`Waiting for ${p.name}…`);}
  if(!G.over&&mineNow){
    if(UI.phase==='move')acts+=`<button class="btn" id="suggBtn">Suggest</button>`;
    if(['move','post'].includes(UI.phase)&&p.tiles.y&&!p.yellowUsed&&p.lira>=2&&Object.keys(p.assist).length)acts+=`<button class="btn" id="yelBtn">${chip('y')} Recall (${L(2)})</button>`;
    if(UI.phase==='post'&&RNG_N===TURN.rng)acts+=`<button class="btn" id="undoBtn">Undo move</button>`;
    if(UI.phase==='post')acts+=`<button class="btn primary" id="endBtn">End turn</button>`;
  }
  if(G.over)acts=`<button class="btn primary" id="resBtn">Results</button>`;
  $('#banner').innerHTML=`<span class="who">${merchantToken(p,false).replace(/data-k="[^"]*"/,'')}${G.over?'':esc(p.name)+(p.ai?' (AI)':'')}</span><span class="msg">${msg}</span><span class="acts">${acts}</span>`;
  $('#banner').classList.toggle('mine',mineNow&&!G.over);
  const eb=$('#endBtn');if(eb)eb.onclick=()=>pendingEnd&&pendingEnd('end');
  const ub=$('#undoBtn');if(ub)ub.onclick=()=>pendingEnd&&pendingEnd('undo');
  const yb=$('#yelBtn');if(yb)yb.onclick=yellowTap;
  const sb=$('#suggBtn');if(sb)sb.onclick=suggestMove;
  const rb=$('#resBtn');if(rb)rb.onclick=showEnd;
  // board
  const moving=UI.phase==='move'&&mineNow;
  const reach=new Set(moving?reachable(G,p,UI.mode):[]);
  $('#board').innerHTML=G.layout.map(pl=>{
    const art=T.art.tiles&&T.art.tiles[pl];const h=reach.has(pl)?hintFor(p,pl,UI.mode):null;
    return `<button class="tile k-${KIND[pl]} ${art?'art':''} ${reach.has(pl)?'reach':''} ${moving&&!reach.has(pl)?'dim':''} ${UI.sel===pl?'sel':''} ${UI.sugg===pl?'sugg':''}" data-pl="${pl}" aria-label="${PNAME[pl]}${h?': '+h.t.replace(/<[^>]+>/g,''):''}" ${art?`style="--art:url('${art}')"`:''}><span class="pn">${pl}</span><span class="nm">${SHORT[pl]}</span><span class="st">${tileStatus(pl)}</span>${h&&h.t?`<span class="hint h-${h.k||'plain'}">${h.t}</span>`:''}<span class="tok">${tokens(pl)}</span></button>`;}).join('');
  document.querySelectorAll('.tile').forEach(t=>t.onclick=()=>{UI.sel=+t.dataset.pl;render();});
  // panel
  const pl=UI.sel??p.pos;
  let h='';
  if(moving&&!UI.recapHidden){const rec=recapFor(p);if(rec.length&&G.round+G.current>1)h+=`<div class="recap"><div class="rh"><h4>Since your last turn</h4><button class="btn" id="recapX">Hide</button></div><ul class="log">${rec.map(e=>`<li class="${e.s?'sep':''}">${e.c?`<i class="c-${e.c}"></i>`:''}<span>${esc(e.t)}</span></li>`).join('')}</ul></div>`;}
  h+=`<div class="ph"><span class="pnum">${pl}</span><h3>${PNAME[pl]}</h3></div><p class="pd">${PDESC[pl]}</p>${placeDetail(pl)}`;
  if(moving){
    if(reach.has(pl))h+=`<ul class="pv">${preview(p,pl,UI.mode).map(x=>`<li class="${x.c||''}">${x.t}</li>`).join('')}</ul><button class="btn primary big" id="moveBtn">${UI.mode==='stay'?'Stay here':'Move here'}</button>`;
    else if(pl===p.pos)h+=`<p class="muted">Your ${W.merchant} is here. Pick a different place to move to.</p>`;
    else h+=`<p class="muted">Out of reach: ${dist(G,p.pos,pl)} steps away.</p>`;
  }
  $('#panel').innerHTML=h;
  const mb=$('#moveBtn');if(mb)mb.onclick=()=>{if(pendingMove){UI.recapHidden=false;pendingMove(pl);}};
  const rx=$('#recapX');if(rx)rx.onclick=()=>{UI.recapHidden=true;render();};
  // players
  const tgt=winTarget(G);
  $('#players').innerHTML=G.players.map(q=>{
    const me=q===p&&!G.over;const mine=ON.code?ownerOf(q)===ME:false;const away=ON.code&&!q.ai&&!(ON.data&&ON.data.presence&&ON.data.presence[ownerOf(q)]);const out=Object.entries(q.assist).map(([k,n])=>SHORT[k]+(n>1?' ×'+n:'')).join(', ');
    const showHand=ON.code?mine:(me&&!q.ai);
    const canRejoin=ON.code&&away&&!q.ai&&!G.players.some(x=>ownerOf(x)===ME);
    return `<div class="pl" data-pi="${q.i}"><div class="plh"><i class="mer c-${q.color}"></i><span class="nm">${esc(q.name)}</span>${q.ai?'<span class="tag">AI</span>':''}${mine?'<span class="tag">You</span>':''}${away?'<span class="tag">Away</span>':''}${me?'<span class="tag turn">Turn</span>':''}
      <span class="rubies" aria-label="${q.rubies} ${W.rubies}">${[...Array(tgt)].map((_,i)=>`<span class="${i<q.rubies?'ruby':'off'}">◆</span>`).join('')}${q.rubies>tgt?`<span class="ruby">+${q.rubies-tgt}</span>`:''}</span></div>
      <div class="stats"><span><b>${q.lira}</b> ${W.cur}</span><span><b>${q.stack}</b> ${plural(q.stack,W.assistant,W.assistants)} along${out?` <span class="muted">· out: ${out}</span>`:''}</span><span class="muted">${W.family[0].toUpperCase()+W.family.slice(1)}: ${SHORT[q.family]}</span>
      <span class="tiles4" title="${W.tiles}">${GOODS.map(c=>`<span class="mt ${q.tiles[c]?'on g-'+c:''}" title="${GNAME[c]} tile"></span>`).join('')}</span></div>
      <div class="meters">${GOODS.map(c=>`<div class="meter"><span class="lbl">${chip(c)} ${GNAME[c]} ${q.goods[c]}</span><span class="pips">${[...Array(cap(q))].map((_,i)=>`<span class="pip ${i<q.goods[c]?'g-'+c:''}"></span>`).join('')}</span></div>`).join('')}</div>
      ${showHand?`<div class="hand">${q.cards.length?q.cards.map((c,i)=>`<button class="cardchip ${UI.mode===c?'armed':''}" data-card="${q.i}:${i}">${CARD_DEFS[c].name}</button>`).join(''):`<span class="muted">No ${W.cards}</span>`}</div>`:`<div class="stats muted">${q.cards.length} ${plural(q.cards.length,W.card,W.cards)}</div>`}
      ${canRejoin?`<button class="btn" style="margin-top:8px" data-rejoin="${q.i}">This is me: play as ${esc(q.name)}</button>`:''}
    </div>`;}).join('');
  document.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{const[a,c]=b.dataset.card.split(':');cardTap(+a,+c);});
  document.querySelectorAll('[data-rejoin]').forEach(b=>b.onclick=()=>rejoinSeat(+b.dataset.rejoin));
  // log
  $('#log').innerHTML=G.log.slice(0,60).map(e=>`<li class="${e.s?'sep':''}">${e.c?`<i class="c-${e.c}"></i>`:''}<span>${esc(e.t)}</span></li>`).join('');
  const myTurn=ON.code&&!G.over&&isMine(p);
  document.title=myTurn?`● Your turn · ${T.name}`:T.name;
  $('#codeChip').hidden=!ON.code;if(ON.code)$('#codeChip').textContent='Game '+ON.code;
  runFx(before);
  if(ON.code&&ON.driving)queueLive();
}
function showEnd(){
  if(!G||!G.over)return;
  const rows=G.result.map((i,k)=>{const q=G.players[i];return `<tr><td>${k+1}</td><td><i class="mer c-${q.color}" style="width:12px;height:12px;vertical-align:-1px"></i> ${esc(q.name)}</td><td class="ruby">◆ ${q.rubies}</td><td>${q.lira}</td><td>${totalGoods(q)}</td></tr>`;}).join('');
  sheet(`${esc(G.players[G.result[0]].name)} wins`,`<table class="rank"><tr><th>#</th><th>${W.merchant[0].toUpperCase()+W.merchant.slice(1)}</th><th>${W.rubies}</th><th>${W.cur}</th><th>Goods</th></tr>${rows}</table><p class="muted">Ties go to most ${W.cur}, then goods, then ${W.cards}.</p>`,[{label:'Back to the menu',value:'new',primary:true},{label:'Look at the board',value:null}]).then(v=>{if(v==='new')goHome();});
}
function setupSheet(){
  const prev=(G&&G.cfg&&!ON.code)?G.cfg:{players:[{name:lsGet('istanbul-name')||'You',ai:false},{name:AI_NAMES[1],ai:true},{name:AI_NAMES[2],ai:true}],layout:'short'};
  const names=[lsGet('istanbul-name')||'You',...AI_NAMES.slice(1)];
  const st={n:prev.players.length,players:names.map((n,i)=>prev.players[i]?{name:prev.players[i].name,ai:prev.players[i].ai}:{name:n,ai:true}),layout:prev.layout};
  const w=$('#sheetWrap'),s=$('#sheet');s.className='';
  const draw=()=>{
    s.innerHTML=`<h2>New game on this device</h2><div class="form">
      <div><h4>Players</h4><div class="seg" id="nseg">${[2,3,4,5].map(n=>`<button data-n="${n}" class="${st.n===n?'on':''}">${n}</button>`).join('')}</div></div>
      ${st.players.slice(0,st.n).map((pl,i)=>`<div class="prow"><i class="mer c-${COLORS[i]}"></i><input id="pname${i}" value="${esc(pl.name)}" aria-label="Player ${i+1} name" maxlength="16"><div class="seg">${['Human','AI'].map(k=>`<button data-p="${i}" data-ai="${k==='AI'?1:0}" class="${(pl.ai?'AI':'Human')===k?'on':''}">${k}</button>`).join('')}</div></div>`).join('')}
      <div><h4>Board layout</h4><select id="layoutSel"><option value="short" ${st.layout==='short'?'selected':''}>Short paths (learning)</option><option value="order" ${st.layout==='order'?'selected':''}>In order (similar places together)</option><option value="random" ${st.layout==='random'?'selected':''}>Random</option></select></div>
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

/* ---------- shared helpers for screens ---------- */
function rid(n){const a='abcdefghijkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<n;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
function rcode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
const shareLink=code=>location.origin+location.pathname+'?game='+code+(T.id!=='istanbul'?'&theme='+T.id:'');
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Link copied');}catch(e){toast(t);}}
function showScreen(name){['home','lobby','table'].forEach(n=>$('#'+n).hidden=n!==name);if(name!=='table'){$('#roundInfo').textContent='';document.title=T.name;}$('#codeChip').hidden=!ON.code;if(ON.code)$('#codeChip').textContent='Game '+ON.code;}

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
function mockNet(){ // same-browser stand-in used for testing: add ?mock to the URL
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
  ON.code=code;ON.version=0;ON.data=null;ON.shownEnd=false;FX.prev=null;
  history.replaceState(null,'','?game='+code+(MOCK?'&mock':''));
  showScreen('lobby');$('#lobby').innerHTML=`<div class="card panel"><h2>Joining game ${code}…</h2><p class="muted">Connecting to the ${W.market}.</p></div>`;
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
function parseState(s){const g=JSON.parse(s);g.players.forEach(p=>p.name=cleanName(p.name)||W.merchant);return g;}
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
    <h2>Gather the ${W.merchants}</h2>
    <p>Send this link to your friends. They open it, take an open seat and type a name. No account needed.</p>
    <div class="share"><code id="shareLink">${esc(link)}</code><button class="btn" id="copyBtn">Copy link</button></div>
    ${mine<0&&open?`<label class="fld" for="joinName">Your name<input id="joinName" maxlength="16" value="${esc(keepName)}" placeholder="Your name"></label>`:''}
    <h4>Seats</h4>
    <div class="seats">${seats.map((s,i)=>{
      const st=s.ai?`<span class="tag">AI ${W.merchant}</span>`:s.owner==='-'?'<span class="tag">Open seat</span>':`<span class="dot ${here[s.owner]?'on':''}"></span><span class="muted">${here[s.owner]?'Here':'Away'}</span>`;
      let act='';
      if(s.owner==='-'&&mine<0)act=`<button class="btn primary" data-take="${i}">Take this seat</button>`;
      if(mine>=0&&s.owner==='-')act=`<button class="btn" data-ai="${i}">Fill with AI</button>`;
      if(mine>=0&&s.ai)act=`<button class="btn" data-open="${i}">Open for a friend</button>`;
      return `<div class="seat"><i class="mer c-${COLORS[i]}"></i><span class="nm">${s.owner==='-'?'Waiting for a friend':esc(s.name)}${s.owner===ME?' <span class="tag">You</span>':''}</span>${st}<span class="act">${act}</span></div>`;}).join('')}</div>
    <div class="row">${mine>=0?`<button class="btn primary big" id="startBtn" ${open?'disabled':''}>${open?`Waiting for ${open} more ${plural(open,'player','players')}`:'Start the game'}</button>`:''}</div>
    <p class="muted small">Board: ${{short:'Short paths',order:'In order',random:'Random'}[d.layout]||esc(d.layout)}. Any seated player can start once every seat is filled.</p></div>`;
  $('#copyBtn').onclick=()=>copyText(link);
  document.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>takeSeat(+b.dataset.take));
  document.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>ON.net.set(`games/${ON.code}/seats/${b.dataset.ai}`,{name:AI_NAMES[+b.dataset.ai]||W.merchant,ai:true,owner:'ai'}));
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>ON.net.set(`games/${ON.code}/seats/${b.dataset.open}`,{name:'Friend',ai:false,owner:'-'}));
  const sb=$('#startBtn');if(sb)sb.onclick=startOnline;
}
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
  <div class="hero"><p class="eyebrow">${T.eyebrow}</p>
    <h2 class="display">${T.headline}</h2>
    <p class="lede">${T.lede}</p></div>
  <div class="modes">
    <div class="card panel">
      <h3>Play online</h3>
      <p class="muted">Create a game and send the link. Friends join in their browser with no account.</p>
      <label class="fld" for="homeName">Your name<input id="homeName" maxlength="16" value="${esc(name)}" placeholder="Your name"></label>
      <div class="fld">Players<div class="seg" id="hn">${[2,3,4,5].map(n=>`<button data-n="${n}" class="${HOME.n===n?'on':''}">${n}</button>`).join('')}</div></div>
      <div class="seatcfg">${[...Array(HOME.n-1)].map((_,k)=>`<div class="prow"><i class="mer c-${COLORS[k+1]}"></i><span>Seat ${k+2}</span><div class="seg">${['friend','ai'].map(v=>`<button data-s="${k+1}" data-v="${v}" class="${HOME.seats[k+1]===v?'on':''}">${v==='ai'?'AI':'Friend'}</button>`).join('')}</div></div>`).join('')}</div>
      <label class="fld" for="homeLayout">Board layout<select id="homeLayout"><option value="short" ${HOME.layout==='short'?'selected':''}>Short paths (learning)</option><option value="order" ${HOME.layout==='order'?'selected':''}>In order</option><option value="random" ${HOME.layout==='random'?'selected':''}>Random</option></select></label>
      <button class="btn primary big" id="createBtn">Create game</button>
      <div class="join"><label class="fld" for="joinCode">Have a code?<input id="joinCode" maxlength="8" placeholder="e.g. K7X2P" autocapitalize="characters"></label><button class="btn" id="joinBtn">Join</button></div>
    </div>
    <div class="card panel">
      <h3>Play on this device</h3>
      <p class="muted">Pass-and-play with friends at the table, or practise against AI ${W.merchants}.</p>
      <button class="btn primary big" id="localBtn">Set up a game</button>
      ${saved&&!saved.over&&saved.players?`<button class="btn big" id="resumeBtn">Continue saved game <small>· round ${saved.round}, ${saved.players.length} players</small></button>`:''}
      <button class="btn big" id="rulesBtn2">How to play</button>
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
  $('#rulesBtn2').onclick=rulesSheet;
  const rb=$('#resumeBtn');if(rb)rb.onclick=()=>resumeGame(saved);
}

/* ---------- boot ---------- */
$('#newBtn').onclick=goHome;
$('#rulesBtn').onclick=rulesSheet;
$('#soundBtn').onclick=()=>setSound(!SND.on);
$('#codeChip').onclick=()=>copyText(shareLink(ON.code));
(function boot(){
  document.title=T.name;$('#brandName').textContent=T.name;$('#footText').textContent=T.foot;
  renderSoundBtn();
  const code=new URLSearchParams(location.search).get('game');
  if(code)enterOnline(code);else{showScreen('home');renderHome();}
})();
