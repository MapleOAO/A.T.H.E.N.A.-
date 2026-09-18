// Original deterministic component layout. No upstream coordinates are used.
// Route each unordered endpoint pair together, so direction and input ordering
// cannot collapse different facts onto the same curve.
export function routeRelations(positions, relations) {
  const groups = new Map(), result = new Map(), handles = [];
  for (const relation of relations) {
    const key = [relation.from, relation.to].sort().join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(relation);
  }
  const point = (a, c, b, t) => a.map((v, i) => (1-t)**2*v + 2*(1-t)*t*c[i] + t*t*b[i]);
  for (const key of [...groups.keys()].sort()) {
    const group = groups.get(key).sort((a,b) => a.id.localeCompare(b.id));
    const [first, second] = key.split('|'), a = positions.get(first), b = positions.get(second);
    if (!a || !b) continue;
    const dx = b[0]-a[0], dy = b[1]-a[1], length = Math.hypot(dx,dy) || 1;
    const start = [a[0]+dx/length*42,a[1]+dy/length*42];
    const end = [b[0]-dx/length*42,b[1]-dy/length*42];
    const obstacles = [...positions].filter(([id]) => id!==first && id!==second).map(([,p]) => p);
    for (const [index, relation] of group.entries()) {
      const base = group.length===1 ? 22 : (index-(group.length-1)/2)*80;
      let best;
      for (const shift of [0,80,-80,160,-160,240,-240,320,-320,400,-400]) {
        const bend = base+shift;
        const control = [(start[0]+end[0])/2-dy/length*bend,(start[1]+end[1])/2+dx/length*bend];
        const handle = point(start,control,end,.5);
        let penalty = handles.reduce((sum,p)=>sum+Math.max(0,38-Math.hypot(handle[0]-p[0],handle[1]-p[1]))*5,0);
        for (let step=1;step<20;step++) {
          const p=point(start,control,end,step/20);
          for (const obstacle of obstacles) penalty+=Math.max(0,58-Math.hypot(p[0]-obstacle[0],p[1]-obstacle[1]));
        }
        if (!best || penalty<best.penalty) best={control,handle,penalty};
        if (!penalty) break;
      }
      const [from,to] = relation.from===first ? [start,end] : [end,start];
      result.set(relation.id,{path:`M${from.join(',')} Q${best.control.join(',')} ${to.join(',')}`,handle:best.handle});
      handles.push(best.handle);
    }
  }
  return result;
}

export function layoutGraph(entities, relations, selected) {
  const adjacency = new Map(entities.map(e => [e.id, new Set()]));
  for (const r of relations) {
    if (adjacency.has(r.from) && adjacency.has(r.to)) {
      adjacency.get(r.from).add(r.to); adjacency.get(r.to).add(r.from);
    }
  }
  const seen = new Set(), components = [];
  for (const e of entities) {
    if (seen.has(e.id)) continue;
    const component = [], queue = [e.id]; seen.add(e.id);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i]; component.push(id);
      for (const next of adjacency.get(id)) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    components.push(component);
  }
  components.sort((a,b) => b.length-a.length || a[0].localeCompare(b[0]));
  const blocks = components.map(ids => {
    const root = ids.includes(selected) ? selected : [...ids].sort((a,b)=>adjacency.get(b).size-adjacency.get(a).size || a.localeCompare(b))[0];
    const points = new Map([[root,[0,0]]]);
    const rest = ids.filter(id=>id!==root).sort((a,b)=>Number(adjacency.get(root).has(b))-Number(adjacency.get(root).has(a)) || a.localeCompare(b));
    let cursor=0, ring=1, radius=0;
    while (cursor<rest.length) {
      radius=ring*240;
      const count=Math.min(rest.length-cursor,Math.floor(2*Math.PI*radius/180));
      for(let i=0;i<count;i++){const angle=-Math.PI/2+i*2*Math.PI/count;points.set(rest[cursor++],[Math.cos(angle)*radius,Math.sin(angle)*radius]);}
      ring++;
    }
    return {points,width:radius*2+320,height:radius*2+240};
  });
  const target=Math.max(1000,Math.sqrt(blocks.reduce((sum,b)=>sum+b.width*b.height,0))*1.25);
  const positions=new Map(); let x=0,y=0,rowHeight=0,width=1000;
  for(const block of blocks){
    if(x && x+block.width>target){x=0;y+=rowHeight;rowHeight=0;}
    for(const [id,[px,py]] of block.points)positions.set(id,[x+block.width/2+px,y+block.height/2+py]);
    x+=block.width;rowHeight=Math.max(rowHeight,block.height);width=Math.max(width,x);
  }
  return {positions, width, height:Math.max(780,y+rowHeight)};
}
