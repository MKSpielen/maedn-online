const assert=require('assert');
const COLORS={red:0,green:8,purple:16,yellow:24,black:32,blue:40};
const names=Object.keys(COLORS);
function progress(color,pos){
  if(pos===-1)return null;
  if(pos>=48&&pos<=51)return pos;
  if(pos>=0&&pos<48)return (pos-COLORS[color]+48)%48;
  return null;
}
function target(color,pos,r){
  if(!(color in COLORS)||r<1||r>6)return null;
  if(pos===-1)return r===6?COLORS[color]:null;
  const pr=progress(color,pos); if(pr===null)return null;
  const np=pr+r; if(np>51)return null;
  return np<48?(COLORS[color]+np)%48:np;
}
function occupiedGoal(targetColor, targetPos, ownMask, otherMasks){
  if(targetPos<48)return false;
  const slot=targetPos-48;
  if(ownMask & (1<<slot))return true;
  // Goal lanes are private. Other colors never occupy this color's goal slot.
  for(const mask of otherMasks){ if(mask & (1<<slot)) return false; }
  return false;
}
function legalGoal(targetColor,from,r,ownMask,otherMasks){
  const to=target(targetColor,from,r);
  if(to===null)return false;
  if(to<48)return true;
  return !occupiedGoal(targetColor,to,ownMask,otherMasks);
}

// Exhaustive movement arithmetic: all 6 colors, all track positions, all die values.
for(const color of names){
  for(let from=0;from<48;from++) for(let r=1;r<=6;r++){
    const to=target(color,from,r);
    const pr=progress(color,from);
    const expected=pr+r>51?null:(pr+r<48?(COLORS[color]+pr+r)%48:pr+r);
    assert.strictEqual(to,expected,`${color} from track ${from} die ${r}`);
  }
  // Exact entrance from the track position immediately before this color's goal lane.
  const entry=(COLORS[color]+47)%48;
  for(let r=1;r<=6;r++){
    const expected=47+r;
    assert.strictEqual(target(color,entry,r),expected<=51?expected:null,`${color} entry die ${r}`);
  }
}

// Every possible own-goal occupancy mask: only the actual landing slot blocks.
for(const color of names){
  const entry=(COLORS[color]+47)%48;
  for(let r=1;r<=6;r++){
    const to=target(color,entry,r);
    if(to===null)continue;
    for(let ownMask=0;ownMask<16;ownMask++){
      const actualBlocked=to>=48 && !!(ownMask & (1<<(to-48)));
      assert.strictEqual(legalGoal(color,entry,r,ownMask,[]),!actualBlocked,
        `${color} entry die ${r} ownMask ${ownMask.toString(2)}`);
    }
  }
}

// Critical regression: with 3 players, the other two players may have ANY combination
// of goal pieces. Their private goal lanes must never block this player's goal lane.
for(const color of names){
  const others=names.filter(x=>x!==color).slice(0,2);
  const entry=(COLORS[color]+47)%48;
  for(let r=1;r<=6;r++){
    const to=target(color,entry,r);
    if(to===null || to<48)continue;
    for(let ownMask=0;ownMask<16;ownMask++){
      for(let m1=0;m1<16;m1++) for(let m2=0;m2<16;m2++){
        const otherMasks=[m1,m2];
        const expected=!((ownMask & (1<<(to-48)))!==0);
        assert.strictEqual(legalGoal(color,entry,r,ownMask,otherMasks),expected,
          `3p ${color} die ${r} own=${ownMask} other=${m1},${m2}`);
      }
    }
  }
}

// Concrete scenario from the reported bug: yellow is one track field before its goal,
// yellow goal slots 1-3 may be occupied, goal 4 is free. Die 4 must be legal.
const yellowEntry=(COLORS.yellow+47)%48;
assert.strictEqual(target('yellow',yellowEntry,4),51);
assert.strictEqual(legalGoal('yellow',yellowEntry,4,0b0111,[0b1111,0b1010]),true);
// Die 2/3 likewise land on goal 2/3 when those actual slots are free.
assert.strictEqual(legalGoal('yellow',yellowEntry,2,0b0000,[0b1111,0b1010]),true);
assert.strictEqual(legalGoal('yellow',yellowEntry,3,0b0000,[0b1111,0b1010]),true);
// If the actual yellow landing slot is occupied, it must be blocked.
assert.strictEqual(legalGoal('yellow',yellowEntry,4,0b1000,[0,0]),false);

console.log('GOAL EXHAUSTIVE TESTS PASSED');
