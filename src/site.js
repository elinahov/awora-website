// Contact channels. Fill these in; empty values are hidden on the site.
export const SITE = {
  instagram: '', // e.g. 'https://www.instagram.com/awora.home/'
  telegram: '',  // e.g. 'https://t.me/awora'
  email: ''      // e.g. 'hello@awora.am'
};

export const contactLinks = () => [
  SITE.instagram && { id: 'instagram', label: 'Instagram', href: SITE.instagram },
  SITE.telegram && { id: 'telegram', label: 'Telegram', href: SITE.telegram },
  SITE.email && { id: 'email', label: SITE.email, href: `mailto:${SITE.email}` }
].filter(Boolean);
