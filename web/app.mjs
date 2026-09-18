import { filterGraph, labelFor, termFor, statuses, periods, predicates, safeUrl, translateRelation, validateKnowledge } from './src/knowledge.mjs';
import { layoutGraph } from './src/layout.mjs';
const $ = selector => document.querySelector(selector);
function el(tag, text, className) { const n = document.createElement(tag); if (text != null) n.textContent = text; if (className) n.className = className; return n; }
function button(text, fn, className) { const n = el('button', text, className); n.type = 'button'; n.addEventListener('click', fn); return n; }
function link(text, url) { const n = el('a', text); if (safeUrl(url)) { n.href = url; n.target = '_blank'; n.rel = 'noopener noreferrer'; } return n; }
const hasImage = entity => entity.visual?.kind?.startsWith('official-');
const embeddedImages = JSON.parse(document.querySelector('#embedded-images')?.textContent || '{}');
const imageUrl = entity => embeddedImages[entity.visual?.url] || entity.visual?.url;
const imageLabel = entity => ({'official-portrait':'官方头像','official-scene':'官方剧情配图','official-logo':'官方组织标志','official-excerpt':'官方漫画局部'}[entity.visual?.kind] || '名称占位图 · 待补图');
function avatar(entity, className = '') {
  const name = labelFor(kb, entity.id), node = el('span', name.slice(0, entity.kind==='organization'?2:1), 'avatar '+entity.kind+' '+className);
  node.setAttribute('role','img');
  node.setAttribute('aria-label', name + '：' + imageLabel(entity));
  node.title = imageLabel(entity);
  if(hasImage(entity) && entity.visual.crop) {
    node.append(framedImage(entity, {class:'avatar-frame','aria-hidden':'true'}));
  } else if(hasImage(entity)) {
    const img=el('img');img.src=imageUrl(entity);img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.style.objectPosition=(entity.visual.position||'center')+' center';
    img.addEventListener('error',()=>{img.remove();node.title='图片暂时无法加载 · 显示名称图标';});
    node.append(img);
  }
  return node;
}
function svg(tag, attrs = {}, text) { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text) n.textContent = text; return n; }
function framedImage(entity, attrs = {}) {
  const v=entity.visual;
  const frame=svg('svg',{viewBox:v.crop.join(' '),preserveAspectRatio:'xMidYMid meet',overflow:'hidden',...attrs});
  const photo=svg('image',{href:imageUrl(entity),width:v.sourceSize[0],height:v.sourceSize[1]});
  photo.addEventListener('error',()=>frame.remove());frame.append(photo);return frame;
}
const state = { query: '', kind: 'all', status: 'all', period: 'all', predicate: 'all', selected: 'ana', relation: null, focus: true, zoom: 1, x: 0, y: 0, view: 'graph' };
let kb, current, positions, graphWidth = 1000, graphHeight = 780;

try {
  const response = await fetch('./data/knowledge.json', { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  kb = await response.json();
  const errors = validateKnowledge(kb);
  if (errors.length) throw new Error(`知识库校验失败：${errors[0]}`);
  boot();
} catch (error) {
  $('#boot').replaceChildren(el('h2', '暂时无法载入知识库'), el('p', `请通过项目服务或构建后的静态站点访问。${error.message}`), button('重新载入', () => location.reload()));
}

function boot() {
  $('.version b').textContent = 'v'+kb.version;
  $('#boot').hidden = true; $('#workspace').hidden = false;
  for (const [key, name] of Object.entries(periods)) $('#period').append(new Option(name, key));
  $('#predicate').append(new Option('全部关系', 'all'));
  for (const [key, p] of Object.entries(predicates)) $('#predicate').append(new Option(p.label, key));
  const counts = [[kb.entities.length, '收录实体'], [kb.relations.filter(r => r.status === 'verified').length, '已核验关系'], [kb.relations.filter(r => r.status === 'pending').length, '待核验']];
  for (const [count, name] of counts) { const n = el('div', null, 'stat'); n.append(el('strong', String(count).padStart(2, '0')), el('small', name)); $('#stats').append(n); }
  $('#data-date').textContent = `资料核验 ${kb.asOf} · 历史关系不等于当前身份`;
  $('#search').addEventListener('input', e => { state.query = e.target.value; state.focus = false; $('#focus').checked = false; fit(); render(); });
  for (const key of ['kind', 'status', 'period', 'predicate']) $(`#${key}`).addEventListener('change', e => { state[key] = e.target.value; render(); });
  $('#focus').addEventListener('change', e => { state.focus = e.target.checked; render(); });
  $('#reset').onclick = reset; $('#empty-reset').onclick = reset;
  $('#zoom-in').onclick = () => zoom(1.2); $('#zoom-out').onclick = () => zoom(1 / 1.2); $('#fit').onclick = fit;
  document.querySelectorAll('[data-view]').forEach(n => n.onclick = () => switchView(n.dataset.view));
  $('#focus').checked = state.focus;
  $('#glossary-search').addEventListener('input', renderGlossary);
  $('#glossary-status').addEventListener('change', renderGlossary);
  for(const id of ['media-kind','media-status'])$('#'+id).addEventListener('change',renderMedia);
  initPan(); renderTables(); readHash(); render();
  window.addEventListener('hashchange', () => { readHash(); render(); });
}
function reset() { Object.assign(state, { query:'', kind:'all', status:'all', period:'all', predicate:'all', focus:false, relation:null }); $('#search').value = ''; for (const key of ['kind','status','period','predicate']) $(`#${key}`).value = 'all'; $('#focus').checked = false; fit(); setHash(); render(); }
function fit() { state.zoom = 1; state.x = state.y = 0; transform(); }
function zoom(factor) { state.zoom = Math.min(8, Math.max(.5, state.zoom * factor)); transform(); }
function transform() { $('#viewport').setAttribute('transform', `translate(${graphWidth/2 + state.x} ${graphHeight/2 + state.y}) scale(${state.zoom}) translate(${-graphWidth/2} ${-graphHeight/2})`); $('#zoom-level').textContent = `${Math.round(state.zoom * 100)}%`; }
function initPan() {
  let drag = null;
  $('#graph').addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.08 : 1 / 1.08); }, { passive:false });
  $('#graph').addEventListener('pointerdown', e => { if (e.target.closest('.graph-node,.edge-hit')) return; drag = [e.clientX, e.clientY, state.x, state.y]; $('#graph').setPointerCapture(e.pointerId); });
  $('#graph').addEventListener('pointermove', e => { if (!drag) return; const box = $('#graph').getBoundingClientRect(); const scale = Math.max(graphWidth / box.width, graphHeight / box.height); state.x = drag[2] + (e.clientX - drag[0]) * scale; state.y = drag[3] + (e.clientY - drag[1]) * scale; transform(); });
  for (const event of ['pointerup','pointercancel']) $('#graph').addEventListener(event, () => { drag = null; });
}
function setHash() { const value = new URLSearchParams({ view:state.view, entity:state.selected }); if (state.relation) value.set('relation',state.relation); history.replaceState(null,'',`#${value}`); }
function readHash() { const params = new URLSearchParams(location.hash.slice(1)); if (kb.entities.some(e => e.id === params.get('entity'))) state.selected = params.get('entity'); state.relation = kb.relations.some(r => r.id === params.get('relation')) ? params.get('relation') : null; if (['graph','glossary','sources','review','coverage'].includes(params.get('view'))) switchView(params.get('view'),false); }
function switchView(view, hash = true) {
  state.view = view;
  const headings = { graph:'人物与组织关系网络', glossary:'中文术语知识库', sources:'资料来源与出处', review:'待核验关联', coverage:'收录与核验进度' };
  $('#page-heading').textContent = headings[view];
  for (const key of Object.keys(headings)) $(`#${key}-view`).hidden = key !== view;
  document.querySelectorAll('[data-view]').forEach(n => { n.classList.toggle('active',n.dataset.view === view); if (n.dataset.view === view) n.setAttribute('aria-current','page'); else n.removeAttribute('aria-current'); });
  if (hash) setHash();
}
function selectEntity(id) { state.selected = id; state.relation = null; fit(); setHash(); render(); }
function selectRelation(r) { state.relation = r.id; if (![r.from,r.to].includes(state.selected)) state.selected = r.from; setHash(); renderGraph(); renderDetail(); }
function render() {
  current = filterGraph(kb, { ...state, focus:state.focus ? state.selected : null });
  if (state.relation && !current.relations.some(r => r.id === state.relation)) state.relation = null;
  $('#result-count').textContent = `${current.entities.length} 个实体 · ${current.relations.length} 条关系`;
  const directory = filterGraph(kb, { ...state, focus:null }).entities;
  $('#entity-count').textContent = directory.length;
  $('#empty').hidden = current.entities.length > 0;
  $('#entity-list').replaceChildren(...directory.map(e => { const n = button('', () => selectEntity(e.id), `entity-item${e.id === state.selected ? ' selected' : ''}`); n.setAttribute('aria-label',`查看${labelFor(kb,e.id)}`); const name = el('span',labelFor(kb,e.id)); name.append(el('small',e.name)); n.append(avatar(e,'list-avatar'),name); return n; }));
  const computed = layoutGraph(current.entities, current.relations, state.selected);
  positions = computed.positions; graphWidth = computed.width; graphHeight = computed.height;
  $('#graph').setAttribute('viewBox', `0 0 ${graphWidth} ${graphHeight}`);
  renderGraph(); renderDetail();
}
function renderGraph() {
  const near = new Set(current.relations.filter(r => r.from === state.selected || r.to === state.selected).flatMap(r => [r.from,r.to]));
  $('#edges').replaceChildren(); $('#nodes').replaceChildren();
  for (const [i,r] of current.relations.entries()) {
    const [ax,ay] = positions.get(r.from), [bx,by] = positions.get(r.to), dx = bx-ax, dy = by-ay, len = Math.hypot(dx,dy)||1;
    const offset = 34, x1 = ax+dx/len*offset, y1 = ay+dy/len*offset, x2 = bx-dx/len*offset, y2 = by-dy/len*offset;
    const bend = i%2 ? 22 : -22, mx = (x1+x2)/2-dy/len*bend, my = (y1+y2)/2+dx/len*bend;
    const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
    const related = r.from === state.selected || r.to === state.selected;
    const line = svg('path',{d,class:`edge ${r.status} ${r.id===state.relation?'selected':related?'neighbor':'edge-dim'}`});
    if (!predicates[r.predicate].symmetric) line.setAttribute('marker-end','url(#arrow)');
    const name = `${labelFor(kb,r.from)} · ${predicates[r.predicate].label} · ${labelFor(kb,r.to)}（${statuses[r.status]}）`;
    const hit = svg('path',{d,class:'edge-hit',role:'button',tabindex:0,'aria-label':name}); hit.append(svg('title',{},name));
    hit.onclick = () => selectRelation(r); hit.onkeydown = e => { if (e.key==='Enter'||e.key===' ') {e.preventDefault();selectRelation(r);} };
    $('#edges').append(line,hit);
  }
  for (const entity of current.entities) {
    const [x,y] = positions.get(entity.id), name = labelFor(kb,entity.id), org = entity.kind === 'organization';
    const n = svg('g',{transform:`translate(${x} ${y})`,class:`graph-node ${entity.kind} ${entity.cluster} ${entity.id===state.selected?'selected':!near.has(entity.id)&&near.size?'dimmed':''}`,role:'button',tabindex:0,'aria-label':`图谱节点：${name}`,'aria-pressed':entity.id===state.selected});
    n.append(svg('title',{}, `${name} / ${entity.name}`));
    n.append(svg('circle',{r:42,class:'halo'}));
    n.append(org ? svg('rect',{x:-28,y:-28,width:56,height:56,rx:9,transform:'rotate(45)',class:'body'}) : svg('circle',{r:28,class:'body'}));
    n.append(svg('text',{class:'symbol',y:0},org?name.slice(0,2):name.slice(0,1)),svg('text',{class:'name',y:org?66:58},name.length>12?name.slice(0,11)+'…':name),svg('text',{class:'en',y:org?86:78},entity.name.length>24?entity.name.slice(0,23)+'…':entity.name));
    if(hasImage(entity)) {
      const clip=svg('clipPath',{id:'portrait-'+entity.id,clipPathUnits:'userSpaceOnUse'});clip.append(svg('circle',{r:27}));
      const defs=svg('defs');defs.append(clip);
      const photo=entity.visual.crop ? svg('g',{'clip-path':`url(#portrait-${entity.id})`}) : svg('image',{href:imageUrl(entity),x:-27,y:-27,width:54,height:54,'clip-path':`url(#portrait-${entity.id})`,preserveAspectRatio:entity.visual.kind==='official-logo'?'xMidYMid meet':({left:'xMinYMid slice',center:'xMidYMid slice',right:'xMaxYMid slice'}[entity.visual.position]||'xMidYMin slice'),class:'node-portrait'});
      if(entity.visual.crop)photo.append(framedImage(entity,{x:-27,y:-27,width:54,height:54,class:'node-portrait'}));
      photo.addEventListener('error',()=>photo.remove());n.append(defs,photo);
    }
    n.onclick = () => selectEntity(entity.id); n.onkeydown = e => { if(e.key==='Enter'||e.key===' ') {e.preventDefault();selectEntity(entity.id);} };
    $('#nodes').append(n);
  }
  transform();
}
function badge(text, status = '') { return el('span',text,`badge ${status}`); }
function evidenceCard(ev) { const source = kb.sources.find(s => s.id===ev.sourceId); const n = el('div',null,source.kind==='community'?'evidence pending-note':'evidence'); n.append(link(source.title,source.url),el('p',ev.locator,'locator'),el('p',ev.noteZh)); return n; }
function renderDetail() {
  const pane = $('#detail'); pane.replaceChildren();
  const entity = kb.entities.find(e=>e.id===state.selected);
  if (!entity) return;
  const relation = kb.relations.find(r=>r.id===state.relation);
  if (relation) {
    pane.append(el('span','RELATION / EVIDENCE','eyebrow'),el('h2',predicates[relation.predicate].label),badge(statuses[relation.status],relation.status));
    pane.append(el('p',`${labelFor(kb,relation.from)} ${predicates[relation.predicate].symmetric?'↔':'→'} ${labelFor(kb,relation.to)}`,'detail-lead'));
    const nav=el('div',null,'detail-nav'); nav.append(button(labelFor(kb,relation.from),()=>selectEntity(relation.from)),button(labelFor(kb,relation.to),()=>selectEntity(relation.to))); pane.append(nav);
    pane.append(el('p',relation.summaryZh,'detail-lead'));
    const dl=el('dl'); for(const [key,value] of [['故事时期',periods[relation.period]],['审核日期',relation.review?.date || '尚未核验'],['中文依据',`术语库 v${kb.glossaryVersion}`],['翻译状态',translateRelation(kb,relation).status==='approved'?'术语已对齐':'含待确认译名']]) dl.append(el('dt',key),el('dd',value)); pane.append(dl);
    pane.append(el('h3','证据与定位'),...relation.evidence.map(evidenceCard));
    if (relation.candidateIds.length) { pane.append(el('h3','Atlas 输入记录')); for(const id of relation.candidateIds) { const c=kb.candidates.find(c=>c.id===id), box=el('div',null,'evidence pending-note'); box.append(el('p',c.originalNames.join(' ↔ ')),el('p',c.pointer,'locator'),el('code',`commit ${c.commit}`),el('p','关联输入保留署名；具体关系语义由官方证据独立确认。')); pane.append(box); } }
    pane.append(button('返回实体档案',()=>selectEntity(state.selected),'focus-button'));
    return;
  }
  const term = termFor(kb,entity.id), relations = current.relations.filter(r=>r.from===entity.id||r.to===entity.id);
  pane.append(avatar(entity,'detail-avatar'));
  pane.append(el('span','ENTITY / '+(entity.kind==='person'?'人物档案':'组织档案'),'eyebrow'),el('h2',labelFor(kb,entity.id)),el('p',entity.name,'detail-en'),badge(term.status==='approved'?'国服译名已核对':'暂译 · 待确认',term.status==='approved'?'verified':'pending'));
  const intro = {ana:'守望先锋创始成员。她与组织的历史关系、亲属关系和召回时期的行动，分条记录。',genji:'从岛田家族到暗影守望，再到禅雅塔门下。不同人生阶段，不合并为一个“当前阵营”。',overwatch:'连接人物与组织的历史节点。加入、领导和部门隶属，各有不同含义。'};
  pane.append(el('p',intro[entity.id] || '选择下方关系，查看具体含义、故事时期与出处。没有连线仅表示本库尚未录入关系，不代表该实体没有故事关联。','detail-lead'));
  if (!current.entities.some(e=>e.id===entity.id)) pane.append(el('p','该实体不在当前筛选结果中。','small-note'));
  pane.append(button(state.focus?'查看完整网络':'聚焦一跳关系',()=>{state.focus=!state.focus;$('#focus').checked=state.focus;render();},'focus-button'));
  pane.append(el('div',null,'detail-separator'),el('h3',`当前筛选中的关系 · ${relations.length}`));
  if (!relations.length) pane.append(el('p','当前筛选条件下没有关联。','small-note'));
  for (const r of relations) {
    const other = r.from===entity.id?r.to:r.from;
    const n=button('',()=>selectRelation(r),'connection-button');
    const text=el('span',labelFor(kb,other)); text.append(el('small',`${r.from===entity.id?'→':'←'} ${predicates[r.predicate].label} · ${periods[r.period]}`));
    n.append(text,el('span',r.status==='pending'?'待核验':'↗',r.status==='pending'?'badge pending':'arrow')); pane.append(n);
  }
  pane.append(el('h3','图像来源'));
  if(hasImage(entity)) {
    pane.append(link(imageLabel(entity)+' · 查看出处',entity.visual.sourcePage));
    if(['official-scene','official-logo','official-excerpt'].includes(entity.visual.kind)) {
      const figure=el('figure',null,'scene-figure'),img=el('img');img.src=imageUrl(entity);img.alt=entity.visual.captionZh;img.loading='lazy';img.referrerPolicy='no-referrer';
      img.addEventListener('error',()=>{img.remove();figure.prepend(el('p','配图暂时无法加载，可通过出处查看原图。','small-note'));});
      figure.append(img,el('figcaption',entity.visual.captionZh));pane.append(figure);
    }
    if(entity.visual.locator)pane.append(el('p',entity.visual.locator,'small-note'));
    pane.append(el('p',entity.visual.rights,'small-note'));
  } else {
    pane.append(el('p','本站名称占位图 · 待补可靠的头像或组织标志。此图不是官方形象。','small-note'));
  }
  pane.append(el('h3','中文名称依据'));
  for(const id of term.sourceIds) {const s=kb.sources.find(s=>s.id===id);pane.append(link(s.title,s.url));}
  pane.append(el('p',term.note,'small-note'));
  if (entity.origins?.length) { const o=entity.origins[0]; pane.append(el('h3','实体收录出处'),link('Atlas 固定版本',kb.sources.find(s=>s.id===o.sourceId).url),el('p',`${o.pointer} · ${o.originalName}`,'small-note')); }
  if(!term.sourceIds.length) pane.append(el('p','未找到官方中文依据，不自动批准。','small-note'));
  pane.append(el('p',`实体 ID · ${entity.id}`,'small-note'));
}
function renderTables() {
  renderGlossary(); renderCoverage(); renderMedia();
  for(const s of kb.sources){const card=el('article',null,'source-card');card.append(badge(s.kind==='official'?'官方资料':'社区输入',s.kind==='community'?'pending':'verified'),el('h3',s.title),el('p',s.locator),el('p',s.rights),el('p',`读取日期 ${s.accessedAt} · ${s.language}`),link('查看原始资料 ↗',s.url));if(s.commit)card.append(el('p','固定版本'),el('code',s.commit));$('#source-cards').append(card);}
  for(const c of kb.candidates.filter(c=>c.status==='pending')){const card=el('article',null,'review-card');card.append(badge('关系性质待核验','pending'),el('h3',`${labelFor(kb,c.from)} ↔ ${labelFor(kb,c.to)}`),el('p',c.note),el('p',`Atlas ${c.pointer}`),button('在图谱中查看',()=>{reset();switchView('graph');state.selected=c.from;state.focus=true;$('#focus').checked=true;render();selectRelation(kb.relations.find(r=>r.candidateIds.includes(c.id)));$('#detail').scrollIntoView({block:'nearest'});}));$('#review-cards').append(card);}
}

function renderGlossary() {
  const query = $('#glossary-search').value.toLocaleLowerCase().trim(), status = $('#glossary-status').value;
  const terms = kb.glossary.filter(t => (status==='all'||t.status===status) && [t.zh,t.en,...t.aliases].some(x=>x.toLocaleLowerCase().includes(query)));
  $('#glossary-rows').replaceChildren();
  $('#glossary-count').textContent = `${terms.length} / ${kb.glossary.length} 条术语`;
  for (const t of terms) {
    const tr=el('tr'), chinese=el('td',t.zh), english=el('td',t.en), status=el('td'), source=el('td');
    if(t.aliases.length)english.append(el('small',t.aliases.join(' / ')));
    status.append(badge(t.status==='approved'?'已核对':'暂译待审',t.status==='approved'?'verified':'pending'));
    for(const id of t.sourceIds){const s=kb.sources.find(s=>s.id===id);source.append(link(s.title,s.url));}
    if(!t.sourceIds.length)source.textContent='尚无官方命名依据';source.append(el('small',t.locator));tr.append(chinese,english,status,source);$('#glossary-rows').append(tr);
  }
}
function renderCoverage() {
  const origin = kb.entities.flatMap(e=>e.origins||[]).filter(o=>/^\/nodes\/\d+$/.test(o.pointer));
  const data = [
    ['英雄目录', origin.filter(o=>o.kind==='hero').length, kb.atlasVersion.heroNodes],
    ['其他角色目录', origin.filter(o=>o.kind==='npc').length, kb.atlasVersion.npcNodes],
    ['组织目录', origin.filter(o=>o.kind==='faction').length, kb.atlasVersion.organizationNodes],
    ['显式关联记录', kb.candidates.length, kb.atlasVersion.connections],
    ['中文译名核对', kb.glossary.filter(t=>t.status==='approved').length, kb.glossary.length],
    ['具体关系核验', kb.relations.filter(r=>r.status==='verified').length, kb.relations.length],
    ['官方图像（含剧情配图）', kb.entities.filter(hasImage).length, kb.entities.length]
  ];
  for(const [label,done,total] of data) {
    const card=el('article',null,'source-card'), progress=el('progress');
    progress.max=total; progress.value=done; progress.setAttribute('aria-label',label);
    card.append(el('h3',label),el('strong',`${done} / ${total}`),progress); $('#coverage-cards').append(card);
  }
  $('#coverage-note').textContent = `固定 Atlas 版本 ${kb.atlasVersion.commit.slice(0,8)}。实体目录与显式关联输入已收齐；尚有 ${kb.glossary.filter(t=>t.status==='pending').length} 条译名和 ${kb.relations.filter(r=>r.status==='pending').length} 条关系待核验。目录之外另有 Talon 及 Colloseo 异拼条目。Liao / Echo 的双向原始记录保留两个出处，图中共用一条关系。`;
}

function renderMedia() {
  const kind=$('#media-kind').value, status=$('#media-status').value;
  const items=kb.entities.filter(e=>(kind==='all'||e.kind===kind)&&(status==='all'||hasImage(e)===(status==='official')));
  $('#media-count').textContent=`${items.length} 个实体`;
  $('#media-gallery').replaceChildren(...items.map(e=>{
    const card=button('',()=>{reset();state.focus=true;$('#focus').checked=true;switchView('graph');selectEntity(e.id);$('#detail').scrollIntoView({block:'nearest'});},'media-card');
    card.append(avatar(e,'detail-avatar'),el('strong',labelFor(kb,e.id)),el('small',e.name),badge(imageLabel(e),hasImage(e)?'verified':'pending'));
    return card;
  }));
}
