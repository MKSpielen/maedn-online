const assert=require('assert');
const COLORS={red:0,green:8,purple:16,yellow:24,black:32,blue:40};
function target(c,pos,r){if(pos===-1)return r===6?COLORS[c]:null;if(pos>=0&&pos<48){const pr=(pos-COLORS[c]+48)%48,np=pr+r;if(np>51)return null;return np<48?(COLORS[c]+np)%48:np}return null}
function legal(arr,c,r){const start=COLORS[c],home=arr.filter(x=>x===-1).length,on=arr.findIndex(x=>x===start);const can=i=>{const to=target(c,arr[i],r);return to!==null&&!arr.some((x,j)=>j!==i&&x===to)};if(r===6&&home){if(on>=0){if(can(on))return[on];return arr.map((x,i)=>x===-1||i===on?null:(can(i)?i:null)).filter(x=>x!==null)}return arr.map((x,i)=>x===-1&&can(i)?i:null).filter(x=>x!==null)}return arr.map((x,i)=>x===-1?null:(can(i)?i:null)).filter(x=>x!==null)}
for(const c of Object.keys(COLORS)){
  // A captured pawn is the last remaining home pawn; another own pawn still sits on A.
  const a=[COLORS[c],(COLORS[c]+10)%48,(COLORS[c]+20)%48,-1];
  assert.deepStrictEqual(legal(a,c,6),[0],c+': last home pawn must force clearing A with 6');
  // If A is blocked by another own pawn, another legal pawn may be selected.
  const b=[COLORS[c],(COLORS[c]+6)%48,(COLORS[c]+10)%48,-1];
  assert.deepStrictEqual(legal(b,c,6),[1,2],c+': blocked A allows another legal pawn');
}
console.log('CAPTURE/START-FIELD 6 TESTS PASSED');
