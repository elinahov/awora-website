import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { formatAMD } from '../../lib/config.js';
import { Msg } from '../../components/Form.jsx';

export const STATUSES = ['new', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'];
export const STATUS_LABEL = { new: 'New', confirmed: 'Confirmed', in_production: 'Printing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
export const fmtDate = d => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.from('orders').select('id, number, created_at, name, phone, email, city, items, total, status, user_id')
      .order('created_at', { ascending: false }).limit(1000)
      .then(({ data, error }) => { if (error) setErr(error.message); setOrders(data || []); });
  }, []);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map(s => [s, (orders || []).filter(o => o.status === s).length])), [orders]);
  const shown = (orders || []).filter(o => (!status || o.status === status) &&
    (!q || `${o.number} ${o.name} ${o.phone} ${o.email} ${o.city}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div className="admin__bar">
        <div className="chips">
          <button className={`chip${!status ? ' on' : ''}`} onClick={() => setStatus('')}>All · {orders?.length ?? 0}</button>
          {STATUSES.map(s => <button key={s} className={`chip${status === s ? ' on' : ''}`} onClick={() => setStatus(s)}>{STATUS_LABEL[s]} · {counts[s]}</button>)}
        </div>
        <input className="admin__search" type="search" placeholder="Search name, phone, email, #" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <Msg kind="error">{err}</Msg>
      {orders === null ? <p className="small">Loading…</p> : shown.length === 0 ? <p className="small">No orders.</p> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>City</th><th>Pcs</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {shown.map(o => (
                <tr key={o.id}>
                  <td><Link to={o.id}><b>#{o.number}</b></Link></td>
                  <td>{fmtDate(o.created_at)}</td>
                  <td><Link to={o.id}>{o.name}</Link><br /><span className="small">{o.phone}</span></td>
                  <td>{o.city}</td>
                  <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td>{formatAMD(o.total, 'en')}</td>
                  <td><span className={`status status--${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
