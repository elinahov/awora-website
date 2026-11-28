import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useCatalog } from '../../lib/catalog.jsx';
import { formatAMD, initialConfig, isPlate, priceOf, sectionTypesFor, shapesFor } from '../../lib/config.js';
import { DECOR_SIZES, PATTERNS } from '../../data/seed.js';
import ProductPreview from '../../components/ProductPreview.jsx';
import { Opts } from '../../components/Options.jsx';
import { Input, Msg, Select } from '../../components/Form.jsx';

const KINDS = ['cover', 'outline', 'tray', 'frame', 'mirror'];
const KIND_LABEL = { cover: 'Switch / socket cover', outline: 'Outline frame (sides only)' };
const categoryOf = kind => isPlate(kind) ? kind : 'decor';
const defaultsFor = (kind, combo) => isPlate(kind)
  ? { sections: 1, slots: ['k1'], shape: kind === 'outline' ? 'wavy' : 'square', orientation: 'h', pattern: 'plain', combo }
  : { shape: shapesFor(kind)[0].id, size: DECOR_SIZES[kind][0].id, pattern: 'plain', combo };
const blank = combo => ({ slug: '', category: 'cover', kind: 'cover', collection: '', name: { en: '', hy: '' }, blurb: { en: '', hy: '' }, defaults: defaultsFor('cover', combo), published: false });
const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function ProductEdit() {
  const { slug } = useParams();
  const isNew = slug === 'new';
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { combos, collections, pricing } = catalog;
  const [p, setP] = useState(isNew ? blank(combos[0]?.id) : null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    supabase.from('products').select('*').eq('slug', slug).maybeSingle()
      .then(({ data, error }) => data ? setP(data) : setMsg({ err: error?.message || 'Product not found' }));
  }, [slug, isNew]);

  const cfg = useMemo(() => p && initialConfig(p, combos), [p, combos]);
  if (!p) return <div><Link className="linkish" to="..">← All products</Link><Msg kind="error">{msg.err}</Msg></div>;

  const set = patch => { setP(v => ({ ...v, ...patch })); setMsg({}); };
  const setI18n = (k, lang, v) => set({ [k]: { ...p[k], [lang]: v } });
  const setD = patch => set({ defaults: { ...p.defaults, ...patch } });
  const d = p.defaults;
  const cover = isPlate(p.kind);
  const setKind = kind => set({ kind, category: categoryOf(kind), defaults: defaultsFor(kind, d.combo) });

  const save = async e => {
    e.preventDefault();
    const row = { ...p, slug: isNew ? slugify(p.slug) : p.slug, collection: p.collection || null };
    if (cover) row.defaults = { ...d, slots: d.slots.slice(0, d.sections) };
    if (!row.slug) return setMsg({ err: 'Slug is required (letters, numbers and dashes).' });
    if (!row.name.en || !row.name.hy) return setMsg({ err: 'Name is required in both languages.' });
    setBusy(true);
    let r;
    if (isNew) {
      const { data: last } = await supabase.from('products').select('sort').order('sort', { ascending: false }).limit(1);
      r = await supabase.from('products').insert({ ...row, sort: (last?.[0]?.sort ?? -1) + 1 }).select().single();
    } else {
      const { slug: _s, created_at: _c, ...rest } = row;
      r = await supabase.from('products').update(rest).eq('slug', p.slug).select().single();
    }
    setBusy(false);
    if (r.error) return setMsg({ err: r.error.code === '23505' ? 'A product with this slug already exists.' : r.error.message });
    catalog.reload();
    if (isNew) navigate(`../${r.data.slug}`, { relative: 'path', replace: true });
    else { setP(r.data); setMsg({ ok: 'Saved' }); }
  };

  const remove = async () => {
    if (!confirm(`Delete "${p.name.en}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('slug', p.slug);
    if (error) return setMsg({ err: error.message });
    catalog.reload();
    navigate('..', { relative: 'path' });
  };

  const comboOpts = combos.map(c => ({ value: c.id, label: c.name.en }));

  return (
    <form className="pedit" onSubmit={save}>
      <Link className="linkish" to="..">← All products</Link>
      <div className="pedit__grid">
        <div className="pedit__stage">
          <div className="stage stage--neutral"><ProductPreview config={cfg} className="stage__img" /></div>
          <p className="small">Starting price: <b>{formatAMD(priceOf(cfg, pricing), 'en')}</b>. Customers can change everything in the configurator; these are the starting choices.</p>
          {!isNew && p.published && <p className="small"><a href={`/en/product/${p.slug}`} target="_blank" rel="noreferrer">Open on the site ↗</a></p>}
        </div>

        <div className="form">
          <h2 className="h3">{isNew ? 'New product' : p.name.en || p.slug}</h2>
          <div className="form__grid">
            <Input label="Slug (URL)" value={p.slug} readOnly={!isNew} required hint={isNew ? 'e.g. cloud-tray. Cannot be changed later.' : 'Cannot be changed.'}
              onChange={e => set({ slug: e.target.value })} onBlur={e => isNew && set({ slug: slugify(e.target.value) })} />
            <Select label="Kind" value={p.kind} onChange={e => setKind(e.target.value)} options={KINDS.map(k => ({ value: k, label: KIND_LABEL[k] || k }))} />
            <Input label="Name (English)" value={p.name.en} required onChange={e => setI18n('name', 'en', e.target.value)} />
            <Input label="Name (Armenian)" value={p.name.hy} required onChange={e => setI18n('name', 'hy', e.target.value)} />
            <Input className="span2" label="Description (English)" textarea rows={3} value={p.blurb.en} onChange={e => setI18n('blurb', 'en', e.target.value)} />
            <Input className="span2" label="Description (Armenian)" textarea rows={3} value={p.blurb.hy} onChange={e => setI18n('blurb', 'hy', e.target.value)} />
            <Select label="Collection" value={p.collection || ''} onChange={e => set({ collection: e.target.value })}
              options={[{ value: '', label: '— none —' }, ...collections.map(c => ({ value: c.id, label: c.name.en }))]} />
            <Select label="Color combo" value={d.combo} onChange={e => setD({ combo: e.target.value })} options={comboOpts} />
          </div>

          <h3 className="pedit__sub">Starting configuration</h3>
          {cover ? <>
            <div className="field"><span className="field__label">Sections</span>
              <Opts value={d.sections} onChange={n => setD({ sections: n, slots: Array.from({ length: n }, (_, i) => d.slots[i] || d.slots[d.slots.length - 1] || 'k1') })}
                options={[1, 2, 3, 4].map(n => ({ id: n, label: String(n) }))} /></div>
            <div className="field"><span className="field__label">Shape</span>
              <Opts value={d.shape} onChange={v => setD({ shape: v })} options={shapesFor(p.kind).map(s => ({ id: s.id, label: s.name.en }))} /></div>
            {Array.from({ length: d.sections }, (_, i) => (
              <div className="field" key={i}><span className="field__label">Section {i + 1}</span>
                <Opts value={d.slots[i]} onChange={v => setD({ slots: Array.from({ length: d.sections }, (_, j) => j === i ? v : d.slots[j] || 'k1') })}
                  options={sectionTypesFor(p.kind).map(s => ({ id: s.id, label: s.name.en }))} /></div>
            ))}
            {d.sections > 1 && <div className="field"><span className="field__label">Orientation</span>
              <Opts value={d.orientation || 'h'} onChange={v => setD({ orientation: v })} options={[{ id: 'h', label: 'Horizontal' }, { id: 'v', label: 'Vertical' }]} /></div>}
          </> : <>
            <div className="field"><span className="field__label">Shape</span>
              <Opts value={d.shape} onChange={v => setD({ shape: v })} options={shapesFor(p.kind).map(s => ({ id: s.id, label: s.name.en }))} /></div>
            <div className="field"><span className="field__label">Size</span>
              <Opts value={d.size} onChange={v => setD({ size: v })} options={DECOR_SIZES[p.kind].map(s => ({ id: s.id, label: `${s.id.toUpperCase()} · ${s.dims}` }))} /></div>
          </>}
          <div className="field"><span className="field__label">Pattern</span>
            <Opts value={d.pattern} onChange={v => setD({ pattern: v })} options={PATTERNS.map(s => ({ id: s.id, label: s.name.en }))} /></div>

          <label className="toggle pedit__pub"><input type="checkbox" checked={p.published} onChange={e => set({ published: e.target.checked })} /><span>Published (visible in the shop)</span></label>
          <Msg kind="error">{msg.err}</Msg><Msg>{msg.ok}</Msg>
          <div className="row-actions">
            <button className="btn btn--ink" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}</button>
            {!isNew && <button type="button" className="btn btn--line danger" onClick={remove}>Delete</button>}
          </div>
        </div>
      </div>
    </form>
  );
}
