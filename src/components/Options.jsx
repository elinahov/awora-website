import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';

// Option pills/tiles and color swatches used by the configurator and the admin product editor.
export function Opts({ value, options, onChange, label, className = '' }) {
  return (
    <div className={`opts ${className}`} role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button type="button" key={o.id} role="radio" aria-checked={value === o.id} className={`opt${value === o.id ? ' on' : ''}`} onClick={() => onChange(o.id)}>
          {o.icon}{o.label && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

export function Swatches({ value, onChange, label }) {
  const t = useT();
  const { colors } = useCatalog();
  return (
    <div className="field">
      <span className="field__label">{label}: <b>{t.pick(colors.find(c => c.id === value)?.name)}</b></span>
      <div className="sw-row" role="radiogroup" aria-label={label}>
        {colors.map(c => (
          <button type="button" key={c.id} role="radio" aria-checked={value === c.id} title={t.pick(c.name)} aria-label={t.pick(c.name)}
            className={`sw${value === c.id ? ' on' : ''}`} style={{ '--c': c.hex }} onClick={() => onChange(c.id)} />
        ))}
      </div>
    </div>
  );
}
