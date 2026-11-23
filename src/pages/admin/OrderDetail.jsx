import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useCatalog } from '../../lib/catalog.jsx';
import { formatAMD } from '../../lib/config.js';
import ProductPreview from '../../components/ProductPreview.jsx';
import { Msg, Select, Input } from '../../components/Form.jsx';
import { STATUSES, STATUS_LABEL, fmtDate } from './Orders.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useCatalog();
  const [o, setO] = useState(null);
  const [draft, setDraft] = useState({ status: 'new', admin_note: '' });
  const [msg, setMsg] = useState({});

  useEffect(() => {
    supabase.from('orders').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { setMsg({ err: error?.message || 'Order not found' }); return; }
      setO(data); setDraft({ status: data.status, admin_note: data.admin_note || '' });
    });
  }, [id]);

  const save = async () => {
    setMsg({});
    const { data, error } = await supabase.from('orders').update(draft).eq('id', id).select().single();
    if (error) setMsg({ err: error.message }); else { setO(data); setMsg({ ok: 'Saved' }); }
  };
  const remove = async () => {
    if (!confirm(`Delete order #${o.number}? This cannot be undone.`)) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) setMsg({ err: error.message }); else navigate('..', { relative: 'path' });
  };
  const colorName = cid => colors.find(c => c.id === cid)?.name?.en || cid;

  if (!o) return <div><Link className="linkish" to="..">← All orders</Link><Msg kind="error">{msg.err}</Msg></div>;

  return (
    <div className="order">
      <Link className="linkish" to="..">← All orders</Link>
      <div className="order__head">
        <h2 className="h3">Order #{o.number}</h2>
        <span className="small">{fmtDate(o.created_at)} · {o.user_id ? 'signed-in customer' : 'guest'} · {o.lang.toUpperCase()}</span>
      </div>
      <div className="order__grid">
        <div className="card-box">
          <h3>Customer</h3>
          <dl className="kv">
            <dt>Name</dt><dd>{o.name}</dd>
            <dt>Phone</dt><dd><a href={`tel:${o.phone}`}>{o.phone}</a></dd>
            <dt>Email</dt><dd><a href={`mailto:${o.email}`}>{o.email}</a></dd>
            <dt>City</dt><dd>{o.city}</dd>
            <dt>Address</dt><dd>{o.address}</dd>
            {o.note && <><dt>Note</dt><dd>{o.note}</dd></>}
          </dl>
        </div>
        <div className="card-box">
          <h3>Status</h3>
          <div className="form">
            <Select label="Status" value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
              options={STATUSES.map(s => ({ value: s, label: STATUS_LABEL[s] }))} />
            <Input label="Internal note" textarea rows={3} value={draft.admin_note} onChange={e => setDraft(d => ({ ...d, admin_note: e.target.value }))} />
            <Msg kind="error">{msg.err}</Msg><Msg>{msg.ok}</Msg>
            <div className="row-actions">
              <button className="btn btn--ink" onClick={save}>Save</button>
              <button className="btn btn--line danger" onClick={remove}>Delete order</button>
            </div>
          </div>
        </div>
      </div>
      <div className="card-box">
        <h3>Items</h3>
        <ul className="summary__list">
          {o.items.map((i, k) => (
            <li key={k}>
              <div className="line__img"><ProductPreview config={i.config} /></div>
              <div>
                <b>{i.name?.en || i.slug}</b> <span className="small">({i.slug})</span>
                <code>{i.code}</code>
                <span className="small">Base {colorName(i.config.colors.base)} · pattern {colorName(i.config.colors.pattern)} · accent {colorName(i.config.colors.accent)} · {formatAMD(i.price, 'en')} × {i.qty}</span>
              </div>
              <span>{formatAMD(i.price * i.qty, 'en')}</span>
            </li>
          ))}
        </ul>
        <div className="drawer__total"><span>Total</span><b>{formatAMD(o.total, 'en')}</b></div>
      </div>
    </div>
  );
}
