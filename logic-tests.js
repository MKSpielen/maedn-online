const assert=require('assert');
const COLORS={red:0,green:8,purple:16,yellow:24,black:32,blue:40};
const colorNames=Object.keys(COLORS);
function progress(color,pos){
  if(pos===-1)return null;
  if(Number.isInteger(pos)&&pos>=48&&pos<=51)return pos;
  if(Number.isInteger(pos)&&pos>=0&&pos<48)return (pos-COLORS[color]+48)%48;
  return null;
}
function target(color,pos,r){
  if(!(color in COLORS)||!Number.isInteger(r)||r<1||r>6)return null;
  if(pos===-1)return r===6?COLORS[color]:null;
  const pr=progress(color,pos); if(pr===null)return null;
  const np=pr+r; if(np>51)return null;
  return np<48?(COLORS[color]+np)%48:np;
}
// Exhaustive: every color, every legal track/goal position, every die 1..6.
for(const c of colorNames){
  for(let pos=0;pos<52;pos++) for(let r=1;r<=6;r++){
    const pr=progress(c,pos);
    assert.notStrictEqual(pr,null);
    const expected=pr+r>51?null:(pr+r<48?(COLORS[c]+pr+r)%48:pr+r);
    assert.strictEqual(target(c,pos,r),expected,`${c} pos=${pos} r=${r}`);
  }
  assert.strictEqual(target(c,-1,6),COLORS[c]);
  for(let r=1;r<=5;r++)assert.strictEqual(target(c,-1,r),null);
}
// Every goal entry transition: the track square immediately before goal 1 is start+47.
for(const c of colorNames){
  const before=(COLORS[c]+47)%48;
  assert.strictEqual(target(c,before,1),48,`${c}: exact goal-1 entry`);
  assert.strictEqual(target(c,before,2),49,`${c}: goal entry +2`);
  assert.strictEqual(target(c,before,3),50,`${c}: goal entry +3`);
  assert.strictEqual(target(c,before,4),51,`${c}: goal entry +4`);
  assert.strictEqual(target(c,before,5),null,`${c}: overrun`);
  assert.strictEqual(target(c,before,6),null,`${c}: overrun`);
}
// Every goal position and die: passing occupied intermediate goal fields is allowed;
// only the actual landing field is blocked.
for(const c of colorNames){
  for(let from=48;from<=51;from++) for(let r=1;r<=6;r++){
    const to=target(c,from,r);
    if(to!==null) assert(to>=48&&to<=51,`${c} goal ${from} r${r}`);
  }
}
// Landing occupancy model: one own figure on target blocks, but occupied intermediate goal cells don't.
function canLand(to,occupied){return to!==null&&!occupied.has(to)}
assert.strictEqual(canLand(target('red',48,2),new Set([49])),true); // skip occupied goal 2, land goal 3
assert.strictEqual(canLand(target('red',48,2),new Set([50])),false); // actual landing occupied
assert.strictEqual(canLand(target('red',49,2),new Set([50])),true); // skip goal 3, land goal 4
assert.strictEqual(canLand(target('red',49,1),new Set([50])),false); // actual landing occupied
// Three-player state does not alter target/goal arithmetic.
const threePlayers=[{id:'a',color:'red'},{id:'b',color:'yellow'},{id:'c',color:'blue'}];
for(const p of threePlayers){for(let from=0;from<52;from++)for(let r=1;r<=6;r++){
  const t=target(p.color,from,r);
  if(t!==null){assert(t>=0&&t<=51);}
}}
console.log('EXHAUSTIVE GOAL TESTS PASSED');
// Board-order regression: the red goal lane must start at the field closest to the red track entry.
const redGoal=[[750,314],[750,394],[750,474],[750,554]];
const redPre=[750,222];
function d2(a,b){return (a[0]-b[0])**2+(a[1]-b[1])**2}
assert.strictEqual(Math.min(...redGoal.map(g=>d2(redPre,g))),d2(redPre,redGoal[0]));
// All goal lanes must have their logical field 1 closest to their track-entry square.
const board={
 red:{start:0,goal:[[750,314],[750,394],[750,474],[750,554]]},
 green:{start:8,goal:[[1128,532],[1059,572],[990,612],[921,652]]},
 purple:{start:16,goal:[[1128,968],[1059,928],[990,888],[921,848]]},
 yellow:{start:24,goal:[[750,1186],[750,1106],[750,1026],[750,946]]},
 black:{start:32,goal:[[372,968],[441,928],[510,888],[579,848]]},
 blue:{start:40,goal:[[372,532],[441,572],[510,612],[579,652]]}
};
const track=[[842,222],[842,314],[842,406],[922,452],[1002,498],[1082,452],[1162,406],[1208,486],[1254,566],[1174,612],[1094,658],[1094,750],[1094,842],[1174,888],[1254,934],[1208,1014],[1162,1094],[1082,1048],[1002,1002],[922,1048],[842,1094],[842,1186],[842,1278],[750,1278],[658,1278],[658,1186],[658,1094],[578,1048],[498,1002],[418,1048],[338,1094],[292,1014],[246,934],[326,888],[406,842],[406,750],[406,658],[326,612],[246,566],[292,486],[338,406],[418,452],[498,498],[578,452],[658,406],[658,314],[658,222],[750,222]];
for(const c of Object.keys(board)){
 const pre=track[(board[c].start+47)%48];
 assert(d2(pre,board[c].goal[0])<d2(pre,board[c].goal[3]),`${c}: goal order reversed`);
}
console.log('BOARD GOAL ORDER TESTS PASSED');
