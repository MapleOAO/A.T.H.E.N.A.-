import test from 'node:test';
import assert from 'node:assert/strict';
import { routeRelations } from '../src/layout.mjs';
const positions=new Map([['a',[100,100]],['b',[580,100]],['middle',[340,100]]]);
const relations=[{id:'first',from:'a',to:'b'},{id:'second',from:'b',to:'a'},{id:'third',from:'a',to:'b'}];
test('parallel and reversed facts have separate controls away from an intervening node',()=>{
  const routes=routeRelations(positions,relations), points=[...routes.values()].map(r=>r.handle);
  assert.equal(routes.size,3);
  for (let i=0;i<points.length;i++) {
    assert.ok(Math.hypot(points[i][0]-340,points[i][1]-100)>=58);
    for(let j=0;j<i;j++)assert.ok(Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1])>=38);
  }
  assert.ok(routes.get('first').path.startsWith('M142,100'));
  assert.ok(routes.get('second').path.startsWith('M538,100'));
});
test('route placement is stable when source records are reordered',()=>{
  assert.deepEqual(routeRelations(positions,relations),routeRelations(new Map([...positions].reverse()),[...relations].reverse()));
  assert.equal(routeRelations(positions,[]).size,0);
});
