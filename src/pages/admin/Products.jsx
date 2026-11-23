import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useCatalog } from '../../lib/catalog.jsx';
import { formatAMD, fromPrice, initialConfig } from '../../lib/config.js';
import ProductPreview from '../../components/ProductPreview.jsx';
import { Msg } from '../../components/Form.jsx';

export default function Products() {
  const catalog = useCatalog();
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => supabase.from('products').select('*').order('sort')
    .then(({ data, error }) => { if (error) setErr(error.message); setList(data || []); }), []);
  useEffect(() => { load(); }, [load]);

  const after = async ({ error }) => { if (error) setErr(error.message); else { setErr(''); await load(); catalog.reload(); } };
  const togglePublished = p => supabase.from('products').update({ published: !p.published }).eq('slug', p.slug).then(after);
  const remove = p => confirm(`Delete "${p.name.en}"? This cannot be undone. Past orders keep their own copy.`) &&
    supabase.from('products').delete().eq('slug', p.slug).then(after);
  const move = async (i, dir) => {
    const a = list[i], b = list[i + dir];
    if (!b) return;
    // re-number everything so equal sort values can't get stuck
    const next = [...list]; next[i] = b; next[i + dir] = a;
    const r = await Promise.all(next.map((p, k) => p.sort === k ? null : supabase.from('products').update({ sort: k }).eq('slug', p.slug)));
    after(r.find(x => x?.error) || {});
  };

  const collName = id => catalog.collections.find(c => c.id === id)?.name?.en || id || '—';

  return (
    <div>
      <div className="admin__bar">
        <p className="small">{list ? `${list.length} products` : ''}</p>
        <Link className="btn btn--ink" to="new">+ New product</Link>
      </div>
      <Msg kind="error">{err}</Msg>
      {list === null ? <p className="small">Loading…</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th /><th>Product</th><th>Kind</th><th>Collection</th><th>From</th><th>Visible</th><th>Order</th><th /></tr></thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.slug} className={p.published ? '' : 'is-off'}>
                  <td><div className="tbl__thumb"><ProductPreview config={initialConfig(p, catalog.combos)} /></div></td>
                  <td><Link to={p.slug}><b>{p.name.en}</b></Link><br /><span className="small">{p.name.hy} · {p.slug}</span></td>
                  <td>{p.kind}</td>
                  <td>{collName(p.collection)}</td>
                  <td>{formatAMD(fromPrice(p, catalog.combos, catalog.pricing), 'en')}</td>
                  <td><label className="toggle"><input type="checkbox" checked={p.published} onChange={() => togglePublished(p)} /><span>{p.published ? 'Published' : 'Hidden'}</span></label></td>
                  <td className="nowrap">
                    <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                    <button className="icon-btn" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  </td>
                  <td className="nowrap"><Link className="linkish" to={p.slug}>Edit</Link> · <button className="linkish danger" onClick={() => remove(p)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
