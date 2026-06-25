// TypesList.jsx — Settings → Component types. The clean on-ramp (a Quimby listing
// table). Rows open the unified config page; "New component type" launches it blank.

function pathLabel(t) {
  if (t.path === 'non-system') {
    const a = [...window.ATTACH_GROUPS.flatMap(g => g.options), ...window.ATTACH_MORE].find(o => o.id === t.attach);
    return { icon: 'fa-cube', text: 'Non-system', sub: a ? a.name : null };
  }
  const s = window.SETUP_SYSTEMS.find(x => x.id === t.system);
  return { icon: 'fa-diagram-project', text: 'System', sub: s ? s.name : null };
}

function TypesList({ types, onOpen, onNew, onDuplicate, onUpdate }) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [renamingId, setRenamingId] = React.useState(null);
  const [renameVal, setRenameVal] = React.useState('');
  const cats = ['all', ...Array.from(new Set(types.map(t => t.category)))];
  const rows = types.filter(t =>
    (cat === 'all' || t.category === cat) &&
    (!q || t.name.toLowerCase().includes(q.toLowerCase())));

  const startRename = (e, t) => { e.stopPropagation(); setRenamingId(t.id); setRenameVal(t.name); };
  const commitRename = () => { if (renamingId && renameVal.trim()) onUpdate && onUpdate(renamingId, { name: renameVal.trim() }); setRenamingId(null); };
  const stop = (e) => e.stopPropagation();

  return (
    <div className="set-body">
      <div className="set-toolbar">
        <div className="set-toolbar__search">
          <i className="fa-light fa-magnifying-glass"></i>
          <input placeholder="Search component types" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="set-filter" value={cat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
        </select>
        <div className="set-toolbar__spacer"></div>
        <button className="qmb-ui-button qmb-ui-button--primary" onClick={onNew}><i className="fa-light fa-plus"></i>New component type</button>
      </div>

      <div className="qmb-ui-table qmb-ui-table--detail qmb-ui-table--x-full">
        <table>
          <thead>
            <tr>
              <th className="table-column--primary">Component type</th>
              <th>Placement</th>
              <th>Questions</th>
              <th>Compatibility</th>
              <th className="table-cell--align-right">In use</th>
              <th className="table-cell--align-right"><span className="set-sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(t => {
              const p = pathLabel(t);
              const qs = window.QUESTION_SETS.find(x => x.id === t.questionSet);
              return (
                <tr key={t.id} className="table-row--clickable" onClick={() => onOpen(t)}>
                  <td className="table-column--primary">
                    {renamingId === t.id ? (
                      <input className="cfg-input set-rename" autoFocus value={renameVal}
                        onClick={stop}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitRename(); } if (e.key === 'Escape') setRenamingId(null); }}
                        onBlur={commitRename} />
                    ) : (
                      <span className="set-namecell">
                        <span className="cell-link">{t.name}</span>
                        <STag color={window.CATEGORY_COLOR[t.category] || 'gray'}>{t.category}</STag>
                        <button className="set-rowedit" aria-label="Rename" title="Rename" onClick={e => startRename(e, t)}><i className="fa-light fa-pen"></i></button>
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="set-pathchip"><i className={`fa-light ${p.icon}`}></i>{p.text}{p.sub ? ` · ${p.sub}` : ''}</span>
                  </td>
                  <td>{qs ? <span className="cell-muted">{qs.questions.length} · {qs.code}</span> : <span className="set-cell-empty">None</span>}</td>
                  <td>{t.compatible.length ? <span className="cell-muted">{t.compatible.length} sub-type{t.compatible.length === 1 ? '' : 's'}</span> : <span className="set-cell-empty">—</span>}</td>
                  <td className="table-cell--align-right"><span className="set-cell-count">{t.inUse.toLocaleString()}</span></td>
                  <td className="table-cell--align-right" onClick={stop}>
                    <button className="set-rowact" aria-label="Duplicate" title="Duplicate / use as template" onClick={() => onDuplicate && onDuplicate(t)}><i className="fa-light fa-copy"></i></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div className="compat-empty" style={{ padding: 24, textAlign: 'center' }}>No component types match your search.</div>}
    </div>
  );
}

window.TypesList = TypesList;
window.pathLabel = pathLabel;
