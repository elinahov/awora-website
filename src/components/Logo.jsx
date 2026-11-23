// The AWORA wordmark and AW mark are brand-book artwork, used as masks so they take the current text color.
export const Wordmark = ({ className = '' }) => <span className={`logo logo--word ${className}`} role="img" aria-label="Awora" />;
export const AWMark = ({ className = '' }) => <span className={`logo logo--aw ${className}`} role="img" aria-label="Awora" />;
