import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useCatalog } from '../../lib/catalog.jsx';
import { Msg } from '../../components/Form.jsx';

// Inline-editable table for small catalog tables (collections, colors, combos).
// columns: [{ key: 'name.en', label, type: 'text' | 'color' | 'select' | 'number', options?: [{value,label}] }]
const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
const setPath = (o, path, val) => {
  const [k, ...rest] = path.split('.');
  return { ...o, [k]: rest.length ? setPath(o[k] || {}, rest.join('.'), val) : val };
};

const friendly = e => e.code === '23503' ? 'It is still used somewhere (a product, combo or collection). Change those first.'
  : e.code === '23505' ? 'That id already exists.' : e.message;

export default function RowsEditor({ table, title, columns, blank, hint }) {
  const catalog = useCatalog();
  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState({});
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(() => supabase.from(table).select('*').order('sort')
    .then(({ data, error }) => { if (error) setErr(error.message); setRows((data || []).map(r => ({ ...r, _saved: true }))); setDirty({}); }), [table]);
  useEffect(() => { load(); }, [load]);

  const edit = (i, key, val) => { setRows(rs => rs.map((r, j) => j === i ? setPath(r, key, val) : r)); setDirty(d => ({ ...d, [i]: true })); setOk(''); };
  const done = async () => { await load(); catalog.reload(); };

  const save = async i => {
    const { _saved, ...row } = rows[i];
    if (!row.id?.trim()) return setErr('Id is required.');
    row.id = row.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    row.sort = Number(row.sort) || 0;
    const { error } = _saved
      ? await supabase.from(table).update(row).eq('id', row.id)
      : await supabase.from(table).insert(row);
    if (error) return setErr(friendly(error));
    setErr(''); setOk(`Saved "${row.id}"`); done();
  };
  const remove = async i => {
    const r = rows[i];
    if (!r._saved) { setRows(rs => rs.filter((_, j) => j !== i)); return; }
    if (!confirm(`Delete "${r.id}"?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', r.id);
    if (error) return setErr(friendly(error));
    setErr(''); setOk(`Deleted "${r.id}"`); done();
  };
  const add = () => setRows(rs => [...rs, { ...blank, sort: rs.length, _saved: false }]);

  return (
    <div className="rows">
      <div className="admin__bar"><h2 className="h3">{title}</h2><button className="btn btn--line" onClick={add}>+ Add</button></div>
      {hint && <p className="small">{hint}</p>}
      <Msg kind="error">{err}</Msg><Msg>{ok}</Msg>
      {rows === null ? <p className="small">Loading…</p> : (
        <div className="tbl-wrap">
          <table className="tbl tbl--edit">
            <thead><tr><th>Id</th>{columns.map(c => <th key={c.key}>{c.label}</th>)}<th /></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._saved ? r.id : `new-${i}`}>
                  <td><input value={r.id || ''} readOnly={r._saved} onChange={e => edit(i, 'id', e.target.value)} placeholder="new-id" size={12} /></td>
                  {columns.map(c => (
                    <td key={c.key}>
                      {c.type === 'select'
                        ? <select value={get(r, c.key) || ''} onChange={e => edit(i, c.key, e.target.value || null)}>
                          {c.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        : c.type === 'color'
                          ? <span className="colorcell"><input type="color" value={get(r, c.key) || '#000000'} onChange={e => edit(i, c.key, e.target.value.toUpperCase())} />
                            <input value={get(r, c.key) || ''} onChange={e => edit(i, c.key, e.target.value)} size={8} /></span>
                          : <input type={c.type === 'number' ? 'number' : 'text'} value={get(r, c.key) ?? ''} onChange={e => edit(i, c.key, e.target.value)} size={c.type === 'number' ? 4 : 16} />}
                    </td>
                  ))}
                  <td className="nowrap">
                    <button className="linkish" disabled={!dirty[i] && r._saved} onClick={() => save(i)}>{r._saved ? 'Save' : 'Create'}</button> · <button className="linkish danger" onClick={() => remove(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
