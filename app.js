(()=>{'use strict';
const COLORS={
 red:{name:'Rot',hex:'#ef1111',start:0,home:[[1280,110],[1280,220],[1390,110],[1390,220]],goal:[[750,314],[750,394],[750,474],[750,554]]},
 green:{name:'Grün',hex:'#009b00',start:8,home:[[1280,695],[1280,805],[1390,695],[1390,805]],goal:[[1128,532],[1059,572],[990,612],[921,652]]},
 purple:{name:'Lila',hex:'#b000b0',start:16,home:[[1280,1280],[1280,1390],[1390,1280],[1390,1390]],goal:[[1128,968],[1059,928],[990,888],[921,848]]},
 yellow:{name:'Gelb',hex:'#f2e900',start:24,home:[[220,1280],[220,1390],[110,1280],[110,1390]],goal:[[750,1186],[750,1106],[750,1026],[750,946]]},
 black:{name:'Schwarz',hex:'#111111',start:32,home:[[110,695],[110,805],[220,695],[220,805]],goal:[[372,968],[441,928],[510,888],[579,848]]},
 blue:{name:'Blau',hex:'#0090ff',start:40,home:[[110,110],[110,220],[220,110],[220,220]],goal:[[372,532],[441,572],[510,612],[579,652]]}
};
const GAME_CONFIG = window.GAME_CONFIG || {};
const $ = id => document.getElementById(id);
const FUNCTION_URL = `${GAME_CONFIG.SUPABASE_URL || ''}/functions/v1/game-access`;
async function verifyGamePassword(password){
  if(!GAME_CONFIG.SUPABASE_URL || GAME_CONFIG.SUPABASE_URL.includes('DEIN-PROJEKT')){
    throw new Error('Supabase-URL fehlt in config.js.');
  }
  if(!GAME_CONFIG.SUPABASE_PUBLISHABLE_KEY || GAME_CONFIG.SUPABASE_PUBLISHABLE_KEY.includes('DEIN_PUBLISHABLE_KEY')){
    throw new Error('Supabase Publishable Key fehlt in config.js.');
  }
  let res;
  try{
    res=await fetch(FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':GAME_CONFIG.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({action:'verify-game-password',password})});
  }catch(err){
    throw new Error('Supabase ist nicht erreichbar. Bitte Internetverbindung und Function game-access prüfen.');
  }
  let data={}; try{data=await res.json()}catch{}
  if(!res.ok || !data.ok) throw new Error(data.error||`Passwortprüfung fehlgeschlagen (HTTP ${res.status}).`);
  return true;
}
function unlockGame(){
  $('passwordGate')?.classList.add('hidden');
  $('setup')?.classList.remove('hidden');
  if(typeof Peer!=='undefined') setTimeout(()=>connectToLobby(()=>{}),0);
}
function setupPasswordGate(){
  const gate=$('passwordGate');
  if(!gate)return;
  $('adminLoginButton').onclick=()=>{location.href='admin.html'};
  $('passwordForm').onsubmit=async e=>{
    e.preventDefault();
    const msg=$('passwordMsg'); const btn=e.submitter;
    msg.textContent='Prüfe Passwort…'; if(btn)btn.disabled=true;
    try{await verifyGamePassword($('accessPassword').value);sessionStorage.setItem('gameUnlocked','1');unlockGame();}
    catch(err){msg.textContent=err.message||'Falsches Spielpasswort.';}
    finally{if(btn)btn.disabled=false;}
  };
  if(sessionStorage.getItem('gameUnlocked')==='1') unlockGame();
}
setupPasswordGate();
const TRACK=[[842,222],[842,314],[842,406],[922,452],[1002,498],[1082,452],[1162,406],[1208,486],[1254,566],[1174,612],[1094,658],[1094,750],[1094,842],[1174,888],[1254,934],[1208,1014],[1162,1094],[1082,1048],[1002,1002],[922,1048],[842,1094],[842,1186],[842,1278],[750,1278],[658,1278],[658,1186],[658,1094],[578,1048],[498,1002],[418,1048],[338,1094],[292,1014],[246,934],[326,888],[406,842],[406,750],[406,658],[326,612],[246,566],[292,486],[338,406],[418,452],[498,498],[578,452],[658,406],[658,314],[658,222],[750,222]];
const KEYS=Object.keys(COLORS);
const LOBBY_ID='maedn6-global-lobby-v1';
const S={room:null,host:false,peer:null,conn:null,myId:null,connections:[],players:[],phase:'lobby',turn:0,dice:null,lastDice:null,diceOwner:null,pawns:{},opening:{order:[],index:0,results:{}},houseRolls:0,priorityStart:false,joinPending:false,lobbyKnown:false};
const colorChoices=$('colorChoices');
KEYS.forEach(k=>{const b=document.createElement('button');b.type='button';b.className='color-choice';b.dataset.color=k;const dot=document.createElement('span');dot.className='color-dot'+(k==='black'?' black':'');dot.style.background=COLORS[k].hex;const label=document.createElement('span');label.textContent=COLORS[k].name;b.append(dot,label);b.onclick=()=>selectColor(k);colorChoices.append(b)});
function selectColor(k){if(!COLORS[k])return;const current=$('color').value;const mine=me();const taken=S.players.some(p=>p.color===k&&p.id!==S.myId);if(taken)return;if(mine){if(S.phase==='lobby'){if(S.host){if(colorFree(k,mine.id)){mine.color=k;S.pawns[mine.id]=basePawns();broadcast()}}else if(S.conn&&S.conn.open){send(S.conn,{type:'color',id:S.myId,color:k})}else return}}$('color').value=k;updateColorChoices();if(current!==k)render()}
selectColor('red');
function setupMsg(x){$('setupMsg').textContent=x||''}function gameMsg(x){$('gameMsg').textContent=x||''}
function cleanCode(x){return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)}
function peerId(code){return 'maedn6-'+code.toLowerCase()}
function newCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function colorFree(k,except){return !S.players.some(p=>p.color===k&&p.id!==except)}
function me(){return S.players.find(p=>p.id===S.myId)}
function basePawns(){return [-1,-1,-1,-1]}
function createPlayer(id,name,color,host=false){return{id,name:String(name||'Spieler').trim().slice(0,18)||'Spieler',color,host}}
function snapshot(){return{room:S.room,players:S.players,phase:S.phase,turn:S.turn,dice:S.dice,lastDice:S.lastDice,diceOwner:S.diceOwner,pawns:S.pawns,opening:S.opening,houseRolls:S._houseRolls||0,priorityStart:!!S.priorityStart}}
function apply(s,reveal=true){S.room=s.room;S.players=s.players||[];S.phase=s.phase||'lobby';S.turn=Number.isInteger(s.turn)?s.turn:0;S.dice=s.dice==null?null:Number(s.dice);S.lastDice=s.lastDice==null?null:Number(s.lastDice);S.diceOwner=s.diceOwner||null;S.pawns=s.pawns||{};S.opening=s.opening||{order:[],index:0,results:{}};S._houseRolls=Number.isInteger(s.houseRolls)?s.houseRolls:0;S.priorityStart=!!s.priorityStart;if(reveal)showGame();render()}
function send(c,m){if(c&&c.open)c.send(JSON.stringify(m))}
function broadcast(){if(!S.host)return;const m={type:'state',state:snapshot()};S.connections.forEach(c=>send(c,m));render()}
function initPeer(id,done,onError){if(typeof Peer==='undefined'){setupMsg('PeerJS konnte nicht geladen werden.');return}S.peer=new Peer(id);S.peer.on('open',pid=>{S.myId=pid;done()});S.peer.on('error',e=>{console.error(e);if(onError)onError(e);else{setupMsg(e.type==='peer-unavailable'?'Lobby nicht erreichbar.':'Verbindungsfehler: '+e.type);$('netLabel').textContent='Fehler'}});S.peer.on('disconnected',()=>{$('netLabel').textContent='Getrennt'})}
function addConnection(c){S.connections.push(c);c.on('open',()=>{$('netLabel').textContent='Online'});c.on('data',raw=>{let m;try{m=typeof raw==='string'?JSON.parse(raw):raw}catch{return}hostMessage(c,m)});c.on('close',()=>{S.connections=S.connections.filter(x=>x!==c);if(S.host){const removed=c.peer;S.players=S.players.filter(p=>p.id!==removed);delete S.pawns[removed];S.opening.order=S.opening.order.filter(id=>id!==removed);if(S.opening.index>=S.opening.order.length)S.opening.index=0;if(S.phase!=='lobby'&&S.turn>=S.players.length)S.turn=0;broadcast()}});c.on('error',console.error)}
function hostMessage(c,m){if(!S.host)return;
 if(m.type==='observe'){send(c,{type:'state',state:snapshot()});return}
 if(m.type==='join'){if(S.phase!=='lobby'){send(c,{type:'reject',reason:'Das Spiel läuft bereits.'});return}if(S.players.length>=6){send(c,{type:'reject',reason:'Der Raum ist voll.'});return}if(S.players.some(p=>p.id===m.id))return;const col=COLORS[m.color]&&colorFree(m.color)?m.color:KEYS.find(k=>colorFree(k));const p=createPlayer(m.id,m.name,col,false);S.players.push(p);S.pawns[p.id]=basePawns();send(c,{type:'state',state:snapshot()});broadcast();return}
 if(m.type==='color'){const p=S.players.find(x=>x.id===m.id);if(p&&S.phase==='lobby'&&COLORS[m.color]&&colorFree(m.color,p.id)){p.color=m.color;S.pawns[p.id]=basePawns();broadcast()}return}
 if(m.type==='start'){startGame();return}
 if(m.type==='newGame'){newGame();return}
 if(m.type==='roll'&&m.id===currentRollerId()){roll(m.id);return}
 if(m.type==='move'&&S.phase==='playing'&&m.id===S.players[S.turn]?.id){move(m.pawn);return}
}
function connectToLobby(onReady){
  if(S.conn&&S.conn.open){ if(onReady)onReady(); return; }
  const temp='maedn6-client-'+Math.random().toString(36).slice(2,10);
  initPeer(temp,()=>{
    $('netLabel').textContent='Verbinde…';
    S.conn=S.peer.connect(LOBBY_ID,{reliable:true});
    S.conn.on('open',()=>{send(S.conn,{type:'observe'});if(onReady)onReady();});
    S.conn.on('data',raw=>{
      let m;try{m=typeof raw==='string'?JSON.parse(raw):raw}catch{return}
      if(m.type==='state'){
        const reveal=S.joinPending;
        S.lobbyKnown=true;
        apply(m.state,reveal);
        S.joinPending=false;
        updateColorChoices();
      }
      if(m.type==='reject'){
        gameMsg(m.reason);
        $('join').disabled=false;
      }
    });
    S.conn.on('close',()=>{$('netLabel').textContent='Getrennt'});
    S.conn.on('error',e=>{console.error(e);$('netLabel').textContent='Fehler'});
  },e=>{
    if(e.type==='unavailable-id'||e.type==='unavailable'){
      setupMsg('');
      if(S.peer&&S.peer.destroyed)S.peer=null;
      return;
    }
    setupMsg(e.type==='peer-unavailable'?'Die gemeinsame Lobby ist gerade nicht erreichbar.':'Verbindungsfehler: '+e.type);
    $('netLabel').textContent='Fehler';
  });
}
function becomeLobbyHost(){
  if(S.peer&&!S.peer.destroyed){try{S.peer.destroy()}catch{}}
  S.peer=null;S.conn=null;S.myId=null;S.room='global';S.host=true;
  initPeer(LOBBY_ID,()=>{
    S.lobbyKnown=true;
    S.players=[createPlayer(S.myId,$('name').value,$('color').value,true)];
    S.pawns[S.myId]=basePawns();
    showGame();$('netLabel').textContent='Lobby online';
    S.peer.on('connection',addConnection);
    render();gameMsg('Lobby bereit. Bis zu 6 Spieler können sich anmelden.');
  },e=>{
    if(e.type==='unavailable-id'||e.type==='unavailable'){
      try{S.peer.destroy()}catch{}
      S.peer=null;S.host=false;
      connectToLobby(()=>{
        if(!S.conn||!S.conn.open){setupMsg('Die gemeinsame Lobby ist gerade nicht erreichbar.');$('join').disabled=false;return;}
        const chosen=$('color').value;
        const taken=S.players.some(p=>p.color===chosen);
        if(taken){setupMsg('Diese Farbe ist bereits vergeben. Bitte eine graue/freie Farbe auswählen.');$('join').disabled=false;updateColorChoices();return;}
        S.joinPending=true;
        send(S.conn,{type:'join',id:S.myId,name:$('name').value,color:chosen});
      });
      return;
    }
    setupMsg('Verbindungsfehler: '+e.type);$('netLabel').textContent='Fehler';$('join').disabled=false;
  });
}
function joinLobby(){
  updateColorChoices();
  const name=$('name').value.trim();
  if(!name){setupMsg('Bitte einen Namen eingeben.');return}
  $('join').disabled=true;
  setupMsg('Verbinde mit der gemeinsamen Lobby…');
  // If a lobby connection was prepared already, the current color availability is known.
  if(S.conn&&S.conn.open&&S.players.length){
    const chosen=$('color').value;
    if(S.players.some(p=>p.color===chosen)){
      setupMsg('Diese Farbe ist bereits vergeben. Bitte eine freie Farbe auswählen.');
      $('join').disabled=false;updateColorChoices();return;
    }
    S.joinPending=true;
    send(S.conn,{type:'join',id:S.myId,name,color:chosen});
    return;
  }
  becomeLobbyHost();
}
function startGame(){if(S.phase!=='lobby'||S.players.length<2)return;if(!S.host){send(S.conn,{type:'start',id:S.myId});return}S.phase='opening';S.dice=null;S.lastDice=null;S.diceOwner=null;S.turn=0;S._houseRolls=0;S.priorityStart=false;S.opening={order:S.players.map(p=>p.id),index:0,results:{}};S.players.forEach(p=>S.pawns[p.id]=basePawns());gameMsg('Startwurf: Die niedrigste Zahl beginnt. Jede Person würfelt einmal.');broadcast()}
function newGame(){if(!S.host){send(S.conn,{type:'newGame',id:S.myId});return}S.phase='lobby';S.dice=null;S.lastDice=null;S.diceOwner=null;S.turn=0;S._houseRolls=0;S.priorityStart=false;S.opening={order:[],index:0,results:{}};S.players.forEach(p=>S.pawns[p.id]=basePawns());broadcast();gameMsg('Neues Spiel: Bis zu 6 Spieler können in der Lobby sein.')}
function die(){return 1+Math.floor(Math.random()*6)}
// A figure's position is encoded as: -1 = home, 0..47 = track, 48..51 = goal 1..4.
// progress() returns the exact number of steps already travelled from that player's A/start field.
function progress(color,pos){
  if(pos===-1)return null;
  // Goal positions are already stored as their absolute logical distance: 48..51.
  if(Number.isInteger(pos)&&pos>=48&&pos<=51)return pos;
  if(Number.isInteger(pos)&&pos>=0&&pos<48){
    const start=COLORS[color]?.start;
    if(!Number.isInteger(start))return null;
    return (pos-start+48)%48;
  }
  return null;
}

// Returns the exact landing position for a forward move.
// Logical positions are: 0..47 = track, 48..51 = goal 1..4.
// A move may pass occupied goal fields; only its actual landing field is checked later.
function target(color,pos,r){
  if(!COLORS[color]||!Number.isInteger(r)||r<1||r>6)return null;
  if(pos===-1)return r===6?COLORS[color].start:null;
  const pr=progress(color,pos);
  if(pr===null)return null;
  const np=pr+r;
  // There are exactly four goal fields. No move may go beyond goal 4.
  if(np>51)return null;
  // Still on the common 48-field track.
  if(np<48)return (COLORS[color].start+np)%48;
  // Enter/advance through the private goal lane.
  return 48+(np-48);
}
function hasTrackPiece(id){return(S.pawns[id]||basePawns()).some(x=>x>=0&&x<48)}
function allHome(id){return(S.pawns[id]||basePawns()).every(x=>x===-1)}
function needsHouseRolls(id){const arr=S.pawns[id]||basePawns();return arr.some(x=>x===-1)&&!arr.some(x=>x>=0&&x<48)}
function occupied(pos,exceptId,exceptPawn){const a=[];const owner=S.players.find(x=>x.id===exceptId);for(const p of S.players)for(let i=0;i<4;i++){if(p.id===exceptId&&i===exceptPawn)continue;const q=(S.pawns[p.id]||[])[i];if(q!==pos)continue;/* Goal positions 48..51 are private lanes: the same numeric goal slot exists once per color. */if(pos>=48&&owner&&p.color!==owner.color)continue;a.push({p,i})}return a}
function canLand(p,i,r){
  const arr=S.pawns[p.id]||basePawns();
  const from=arr[i];
  const to=target(p.color,from,r);
  if(to===null)return false;
  const blockers=occupied(to,p.id,i);
  // In the goal there is no jumping restriction: intermediate goal fields are irrelevant.
  // Only the field on which the figure actually lands must be empty.
  if(to>=48)return blockers.length===0;
  // On the track, own figures cannot be stacked; opponents may be captured on landing.
  return !blockers.some(o=>o.p.id===p.id);
}
function legal(id,r){
  const p=S.players.find(x=>x.id===id);if(!p)return[];
  const arr=S.pawns[id]||basePawns();
  const home=arr.map((x,i)=>x===-1?i:null).filter(x=>x!==null);
  const start=COLORS[p.color].start;
  const onStart=arr.findIndex(x=>x===start);

  // A 6 must first bring a waiting home piece onto A while any B pieces remain.
  // If A is already occupied and there are still other home pieces waiting,
  // that A-piece has to be moved with the 6. This applies identically to ALL colors.
  // Exception requested for this game: if the piece being brought out is the LAST
  // piece in the house, it may remain on A; the player is not forced to clear A
  // immediately just because the 6 was used to bring that last home piece out.
  // After a 6 has just been used, the start field has priority again on the
  // following roll as long as at least one own piece is still in the house.
  // If the start-piece is blocked by another own piece, any other legal own
  // piece may be selected instead.
  // After a 6, the start-field pawn has absolute priority on the next roll.
  // S.priorityStart is set only when at least one pawn is still in the house,
  // so no additional home-count check is needed here. If the start pawn cannot
  // make the rolled move because its destination is occupied by an own pawn,
  // the restriction is released and every other legal own pawn may be chosen.
  if(S.priorityStart && onStart>=0){
    if(canLand(p,onStart,r)) return [onStart];
    return arr.map((x,i)=>x===-1?null:(canLand(p,i,r)?i:null)).filter(x=>x!==null);
  }

  // A 6 must first bring a waiting home piece onto A while any B pieces remain.
  // If A is already occupied and there are still other home pieces waiting,
  // that A-piece has to be moved with the 6. This applies identically to ALL colors.
  // Exception requested for this game: if the piece being brought out is the LAST
  // piece in the house, it may remain on A; the player is not forced to clear A
  // immediately just because the 6 was used to bring that last home piece out.
  if(r===6&&home.length){
    // If a home piece is waiting and A/start is occupied by one of our own
    // pieces, the 6 must be used to clear A first. This also applies when
    // the waiting piece is the LAST piece in the house (e.g. after one of
    // our pieces was captured). Only if the A-piece is blocked by another
    // own piece may a different legal own piece be chosen.
    if(onStart>=0){
      if(canLand(p,onStart,r)) return [onStart];
      return arr.map((x,i)=>x===-1?null:(i===onStart?null:(canLand(p,i,r)?i:null))).filter(x=>x!==null);
    }
    return home.filter(i=>canLand(p,i,r));
  }
  return arr.map((x,i)=>x===-1?null:(canLand(p,i,r)?i:null)).filter(x=>x!==null)
}
function currentRollerId(){if(S.phase==='opening')return S.opening.order[S.opening.index]||null;if(S.phase==='playing')return S.players[S.turn]?.id||null;return null}
function openingRoll(id){if(S.phase!=='opening'||id!==currentRollerId())return;const r=die();S.opening.results[id]=r;S.dice=r;S.lastDice=r;S.diceOwner=id;S.opening.index++;if(S.opening.index<S.opening.order.length){broadcast();return}const vals=S.opening.order.map(pid=>S.opening.results[pid]);const min=Math.min(...vals);const tied=S.opening.order.filter(pid=>S.opening.results[pid]===min);if(tied.length>1){S.opening.order=tied;S.opening.index=0;S.opening.results={};S.dice=null;S.diceOwner=null;gameMsg('Gleichstand bei der niedrigsten Zahl – nur diese Spieler würfeln erneut.');broadcast();return}S.turn=S.players.findIndex(p=>p.id===tied[0]);S.phase='playing';S.dice=null;S.diceOwner=null;gameMsg((S.players[S.turn]?.name||'Spieler')+' beginnt. Zum Herauskommen ist eine 6 nötig.');broadcast()}
function roll(id){if(S.phase==='opening'){openingRoll(id);return}if(S.phase!=='playing'||id!==S.players[S.turn]?.id)return;const p=S.players[S.turn];const houseRetry=needsHouseRolls(p.id)&&S.dice!==null&&S.diceOwner===p.id&&S._houseRolls>0;if(S.dice!==null&&!houseRetry)return;const r=die();S.dice=r;S.lastDice=r;S.diceOwner=p.id;const moves=legal(p.id,r);if(moves.length===0){const canTryAgain=needsHouseRolls(p.id)&&r!==6;if(canTryAgain){S._houseRolls=(S._houseRolls||0)+1;if(S._houseRolls<3){gameMsg(p.name+' hat eine '+r+' gewürfelt – keine 6. Noch '+(3-S._houseRolls)+' Versuch'+(3-S._houseRolls===1?'':'e')+'.');broadcast();return}S.dice=null;S.diceOwner=null;S._houseRolls=0;nextTurn();gameMsg(p.name+' hat '+r+' gewürfelt. Keine 6 in drei Versuchen – '+(S.players[S.turn]?.name||'Der nächste Spieler')+' ist am Zug.');broadcast();return}S.dice=null;S.diceOwner=null;S._houseRolls=0;nextTurn();gameMsg(p.name+' kann mit dieser Zahl nicht ziehen.');broadcast();return}S._houseRolls=0;broadcast()}
function move(i){if(S.phase!=='playing'||S.dice===null)return;const p=S.players[S.turn],arr=S.pawns[p.id]||basePawns(),r=S.dice;if(!Number.isInteger(i)||i<0||i>3)return;const allowed=legal(p.id,r);if(!allowed.includes(i))return;if(S.priorityStart){const startIndex=arr.findIndex(x=>x===COLORS[p.color].start);if(startIndex>=0&&canLand(p,startIndex,r)&&i!==startIndex)return;}const from=arr[i],to=target(p.color,from,r);arr[i]=to;S.pawns[p.id]=arr;if(to<48){occupied(to,p.id,i).forEach(o=>{S.pawns[o.p.id][o.i]=-1})}const won=arr.every(x=>x>=48);const extra=r===6&&!won;S.priorityStart=extra&&arr.some(x=>x===-1);S.dice=null;S.diceOwner=null;if(won){S.phase='finished';gameMsg(p.name+' hat alle 4 Figuren im Ziel und gewinnt!');broadcast();return}if(extra){gameMsg(p.name+' hat eine 6 gewürfelt und darf erneut würfeln.')}else{nextTurn();gameMsg(S.players[S.turn]?.name+' ist am Zug.')}broadcast()}
function nextTurn(){S.turn=(S.turn+1)%S.players.length;S._houseRolls=0;S.priorityStart=false}
function showGame(){$('setup').classList.add('hidden');$('game').classList.remove('hidden');$('roomLabel').textContent='Gemeinsame Lobby'}
function coords(p,i){if(i<48)return TRACK[i];return COLORS[p.color].goal[i-48]}
function updateColorChoices(){
  const mine=S.myId;
  const minePlayer=S.players.find(p=>p.id===mine);
  let selected=$('color').value;
  const buttons=[...colorChoices.querySelectorAll('.color-choice')];
  buttons.forEach(b=>{
    const k=b.dataset.color;
    const taken=S.players.some(p=>p.color===k&&p.id!==mine);
    b.classList.toggle('taken',taken);
    b.disabled=!!taken;
  });
  if(minePlayer) selected=minePlayer.color;
  else if(S.lobbyKnown && S.players.some(p=>p.color===selected)){
    const free=KEYS.find(k=>!S.players.some(p=>p.color===k));
    if(free) selected=free;
  }
  $('color').value=selected;
  buttons.forEach(b=>b.classList.toggle('selected',b.dataset.color===selected && !b.disabled));
}
function render(){if($('game').classList.contains('hidden'))return;const m=me(),p=S.players[S.turn];$('count').textContent=S.players.length+'/6';$('turnLabel').textContent=S.phase==='opening'?'Startwurf':S.phase==='playing'?'Am Zug: '+(p?.name||'–'):S.phase==='finished'?'Spiel beendet':'Lobby';$('die').textContent=S.lastDice??'–';if(m){$('color').value=m.color;updateColorChoices()}
let text='';if(S.phase==='lobby')text='Lobby – der Host startet ab 2 Spielern.';else if(S.phase==='opening'){const rid=currentRollerId();text=rid===m?.id?'Du bist dran: würfle für den Start.':'Warte auf '+(S.players.find(x=>x.id===rid)?.name||'Spieler')+'.';if(S.dice!==null)text+=' Letzter Startwurf: '+S.dice+'.'}else if(S.phase==='playing'){if(needsHouseRolls(m?.id||'')&&S.dice!==null&&S.diceOwner===m?.id&&S._houseRolls>0){text=S.dice===6?'6 – Figur kann aus dem Haus.':'Keine 6 – Wurf '+S._houseRolls+'/3. Noch '+(3-S._houseRolls)+' Versuch'+(3-S._houseRolls===1?'':'e')+'.';}else if(S.dice!==null)text=S.diceOwner===m?.id?'Du hast eine '+S.dice+' gewürfelt. Wähle eine Figur.':(S.players.find(x=>x.id===S.diceOwner)?.name||'Spieler')+' hat '+S.dice+' gewürfelt.';else text=p?.id===m?.id?'Du bist dran.':'Warte auf '+(p?.name||'Spieler')+'.'}else text='Spiel beendet.';$('diceText').textContent=text;
const canRoll=(S.phase==='opening'&&currentRollerId()===m?.id)||(S.phase==='playing'&&p?.id===m?.id&&(S.dice===null||(needsHouseRolls(m.id)&&S.diceOwner===m.id&&S._houseRolls>0)));$('roll').disabled=!canRoll;$('roll').textContent=S.phase==='opening'?'Startwurf':'Würfeln';$('start').disabled=!(S.phase==='lobby'&&S.players.length>=2);$('start').classList.toggle('hidden',S.phase!=='lobby');$('newGame').classList.toggle('hidden',false);$('lobbyHint').textContent=S.phase==='lobby'?'Ab 2 Spielern kann jeder Spieler den Startwurf starten.':S.phase==='opening'?'Jede Person würfelt einmal. Die niedrigste Zahl beginnt.':S.phase==='playing'?'Eine Figur kommt nur mit 6 aus dem Haus.':'Spiel beendet.';
$('players').innerHTML='';S.players.forEach((x,idx)=>{const row=document.createElement('div');row.className='player-row';const sw=document.createElement('span');sw.className='swatch';sw.style.background=COLORS[x.color].hex;const n=document.createElement('span');n.className='player-name';n.textContent=x.name+(S.phase==='opening'&&currentRollerId()===x.id?' 🎲':S.phase==='playing'&&idx===S.turn?' 🎲':'');const meta=document.createElement('span');meta.className='player-meta';if(S.phase==='opening'&&S.opening.results[x.id]!=null)meta.textContent='Start: '+S.opening.results[x.id];else meta.textContent=x.id===S.myId?'Du':(x.host?'Host':'');row.append(sw,n,meta);$('players').append(row)});renderTokens()}
function renderTokens(){const layer=$('tokenLayer');layer.innerHTML='';for(const p of S.players){const arr=S.pawns[p.id]||basePawns();arr.forEach((pos,i)=>{const [x,y]=pos===-1?COLORS[p.color].home[i]:coords(p,pos);const b=document.createElement('button');b.type='button';b.className='token'+(p.color==='black'?' black':'');b.style.left=(x/1500*100)+'%';b.style.top=(y/1500*100)+'%';b.style.background=COLORS[p.color].hex;b.textContent=i+1;b.title=p.name+' – Figur '+(i+1)+(pos===-1?' – Haus':'');const can=S.phase==='playing'&&S.dice!==null&&p.id===S.myId&&S.players[S.turn]?.id===S.myId&&legal(p.id,S.dice).includes(i);if(can){b.classList.add('selectable');b.onclick=()=>S.host?move(i):send(S.conn,{type:'move',id:S.myId,pawn:i})}layer.append(b)})}}
$('join').onclick=joinLobby;$('start').onclick=startGame;$('newGame').onclick=newGame;$('roll').onclick=()=>S.host?roll(S.myId):send(S.conn,{type:'roll',id:S.myId});
})();
