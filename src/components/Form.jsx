// Small form kit shared by account, checkout and admin pages.
export function Input({ label, hint, textarea, className = '', ...props }) {
  const El = textarea ? 'textarea' : 'input';
  return (
    <label className={`inp ${className}`}>
      <span className="inp__label">{label}</span>
      <El {...props} />
      {hint && <span className="inp__hint">{hint}</span>}
    </label>
  );
}

export function Select({ label, options, className = '', ...props }) {
  return (
    <label className={`inp ${className}`}>
      <span className="inp__label">{label}</span>
      <select {...props}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </label>
  );
}

export const Msg = ({ kind = 'info', children }) => children ? <p className={`msg msg--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</p> : null;
