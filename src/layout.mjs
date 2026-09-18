// Original deterministic component layout. No upstream coordinates are used.
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
