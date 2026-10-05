const assert=require('assert');
const COLORS={red:0,green:8,purple:16,yellow:24,black:32,blue:40};
function target(c,pos,r){if(pos===-1)return r===6?COLORS[c]:null;if(pos>=48&&pos<=51)return pos+r<=51?pos+r:null;if(pos>=0&&pos<48){const p=(pos-COLORS[c]+48)%48;const n=p+r;if(n>51)return null;return n<48?(COLORS[c]+n)%48:n}return null}
function canLand(arr,i,c,r){const to=target(c,arr[i],r);if(to===null)return false;return !arr.some((x,j)=>j!==i&&x===to)}
function legal(arr,c,r,priorityStart=false){const home=arr.map((x,i)=>x===-1?i:null).filter(i=>i!==null);const start=COLORS[c];const onStart=arr.findIndex(x=>x===start);
  if(priorityStart&&home.length&&onStart>=0){if(canLand(arr,onStart,c,r))return[onStart];return arr.map((x,i)=>x===-1?null:(canLand(arr,i,c,r)?i:null)).filter(i=>i!==null)}
  if(r===6&&home.length){if(onStart>=0&&home.length>1)return canLand(arr,onStart,c,r)?[onStart]:[];return home.filter(i=>canLand(arr,i,c,r))}
  return arr.map((x,i)=>x===-1?null:(canLand(arr,i,c,r)?i:null)).filter(i=>i!==null)
}
for(const c of Object.keys(COLORS)){
  const start=COLORS[c];
  // After a 6 brought a piece to A, the next roll must move A if possible.
  const a=[start, -1, (start+10)%48, (start+20)%48];
  assert.deepStrictEqual(legal(a,c,3,true),[0],`${c}: A has priority`);
  // If A's destination is blocked by own piece, another legal piece may be chosen.
  const blocked=[start,(start+3)%48,-1,(start+10)%48];
  // r=3: A would land on pawn 1, so pawn 3 is available instead.
  const fallback=legal(blocked,c,3,true);assert(fallback.includes(1)&&!fallback.includes(0),`${c}: blocked A allows another piece`);
  // If no home piece remains, priority is disabled and any legal piece is allowed.
  const noHome=[start,(start+10)%48,(start+20)%48,(start+30)%48];
  const free=legal(noHome,c,3,true);assert(free.includes(0)&&free.length>1,`${c}: no home means no A priority restriction`);
}
console.log('PRIORITY START ALL-COLORS TESTS PASSED');
