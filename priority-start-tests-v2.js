const assert=require('assert');
const COLORS={red:0,green:8,purple:16,yellow:24,black:32,blue:40};
function target(c,pos,r){if(pos===-1)return r===6?COLORS[c]:null;if(pos>=0&&pos<48){const pr=(pos-COLORS[c]+48)%48,np=pr+r;if(np>51)return null;return np<48?(COLORS[c]+np)%48:np}return null}
function legal(arr,c,r,priority=false){const start=COLORS[c],home=arr.filter(x=>x===-1).length,on=arr.findIndex(x=>x===start);const can=i=>{const to=target(c,arr[i],r);return to!==null&&!arr.some((x,j)=>j!==i&&x===to)};if(priority&&on>=0){if(can(on))return[on];return arr.map((x,i)=>x===-1?null:(can(i)?i:null)).filter(x=>x!==null)}if(r===6&&home){if(on>=0&&home>1)return can(on)?[on]:[];return arr.map((x,i)=>x===-1&&can(i)?i:null).filter(x=>x!==null)}return arr.map((x,i)=>x===-1?null:(can(i)?i:null)).filter(x=>x!==null)}
for(const c of Object.keys(COLORS)){
 const a=[COLORS[c],(COLORS[c]+10)%48,(COLORS[c]+20)%48,-1];
 assert.deepStrictEqual(legal(a,c,3,true),[0],c+' start priority');
 const blocked=[COLORS[c],(COLORS[c]+3)%48,-1,(COLORS[c]+10)%48];
 const b=legal(blocked,c,3,true); assert(!b.includes(0)&&b.includes(1),c+' blocked fallback');
 const noHome=[COLORS[c],(COLORS[c]+10)%48,(COLORS[c]+20)%48,(COLORS[c]+30)%48];
 const n=legal(noHome,c,3,false); assert(n.includes(0)&&n.includes(1),c+' no priority');
}
console.log('PRIORITY START V2 TESTS PASSED');
