import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useCatalog } from '../../lib/catalog.jsx';
import { COVER_SHAPES, DECOR_SIZES, PATTERNS } from '../../data/seed.js';
import { mergePricing } from '../../lib/config.js';
import { Msg } from '../../components/Form.jsx';

const Num = ({ label, value, onChange }) => (
  <label className="price-row"><span>{label}</span><input type="number" min="0" step="100" value={value} onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} /><span className="small">֏</span></label>
);

// Prices in AMD. Saved to settings.pricing; the storefront and /api/order both use it.
export default function Prices() {
  const catalog = useCatalog();
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState({});

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'pricing').maybeSingle()
      .then(({ data, error }) => { if (error) setMsg({ err: error.message }); setP(mergePricing(data?.value)); });
  }, []);
  if (!p) return <p className="small">Loading…</p>;

  const upd = fn => { setP(v => fn(structuredClone(v))); setMsg({}); };
  const save = async () => {
    const { error } = await supabase.from('settings').upsert({ key: 'pricing', value: p, updated_at: new Date().toISOString() });
    if (error) setMsg({ err: error.message }); else { setMsg({ ok: 'Prices saved' }); catalog.reload(); }
  };

  return (
    <div className="prices">
      <p className="small">A cover costs: first section + each extra section + shape + pattern + each lever topper. An object costs: size + pattern. Orders already placed keep their prices.</p>
      <div className="prices__grid">
        <div className="card-box">
          <h3>Covers</h3>
          <Num label="First section" value={p.coverFirst} onChange={v => upd(x => { x.coverFirst = v; return x; })} />
          <Num label="Each extra section" value={p.coverExtra} onChange={v => upd(x => { x.coverExtra = v; return x; })} />
          <Num label="Lever topper (each)" value={p.lever} onChange={v => upd(x => { x.lever = v; return x; })} />
          <h4>Shape surcharge</h4>
          {COVER_SHAPES.map(s => <Num key={s.id} label={s.name.en} value={p.shapes[s.id]} onChange={v => upd(x => { x.shapes[s.id] = v; return x; })} />)}
        </div>
        <div className="card-box">
          <h3>Pattern surcharge</h3>
          <p className="small">Applies to covers and objects.</p>
          {PATTERNS.map(s => <Num key={s.id} label={s.name.en} value={p.patterns[s.id]} onChange={v => upd(x => { x.patterns[s.id] = v; return x; })} />)}
        </div>
        <div className="card-box">
          <h3>Objects by size</h3>
          {Object.entries(DECOR_SIZES).map(([kind, sizes]) => (
            <div key={kind}><h4>{kind}</h4>
              {sizes.map(s => <Num key={s.id} label={`${s.id.toUpperCase()} · ${s.dims}`} value={p.sizes[kind][s.id]} onChange={v => upd(x => { x.sizes[kind][s.id] = v; return x; })} />)}
            </div>
          ))}
        </div>
      </div>
      <Msg kind="error">{msg.err}</Msg><Msg>{msg.ok}</Msg>
      <button className="btn btn--ink" onClick={save}>Save prices</button>
    </div>
  );
}
