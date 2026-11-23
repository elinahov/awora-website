// Bundled catalog. Mirrors the Supabase tables in supabase/schema.sql.
// The app uses this when VITE_SUPABASE_URL is not set, or if Supabase is unreachable.
// Prices are placeholders in AMD — edit them here or in Supabase.

export const COLORS = [
  { id: 'mulberry', hex: '#641C35', name: { en: 'Mulberry', hy: 'Թթագույն' } },
  { id: 'persimmon', hex: '#EF704F', name: { en: 'Persimmon', hy: 'Խուրմա' } },
  { id: 'petal', hex: '#F3BDD0', name: { en: 'Petal', hy: 'Թերթիկ' } },
  { id: 'periwinkle', hex: '#B9C8EE', name: { en: 'Periwinkle', hy: 'Երկնակապույտ' } },
  { id: 'ivory', hex: '#FFF9EF', name: { en: 'Ivory', hy: 'Փղոսկր' } },
  { id: 'butter', hex: '#F5D47E', name: { en: 'Butter', hy: 'Կարագ' } },
  { id: 'mint', hex: '#BFE0CB', name: { en: 'Mint', hy: 'Անանուխ' } },
  { id: 'lilac', hex: '#CDBDEB', name: { en: 'Lilac', hy: 'Յասաման' } },
  { id: 'cherry', hex: '#C8324A', name: { en: 'Cherry', hy: 'Բալ' } },
  { id: 'sage', hex: '#9DB58E', name: { en: 'Sage', hy: 'Եղեսպակ' } },
  { id: 'cocoa', hex: '#7B4A3A', name: { en: 'Cocoa', hy: 'Կակաո' } },
  { id: 'graphite', hex: '#3A3236', name: { en: 'Graphite', hy: 'Գրաֆիտ' } }
];

// Ready-made color combinations: base / pattern / accent (keys, rim, inner mount…)
export const COMBOS = [
  { id: 'berry-milk', name: { en: 'Berry milk', hy: 'Հատապտղային կաթ' }, base: 'petal', pattern: 'mulberry', accent: 'ivory' },
  { id: 'peach-sky', name: { en: 'Peach sky', hy: 'Դեղձագույն երկինք' }, base: 'periwinkle', pattern: 'persimmon', accent: 'ivory' },
  { id: 'classic', name: { en: 'Classic Awora', hy: 'Դասական Awora' }, base: 'ivory', pattern: 'mulberry', accent: 'mulberry' },
  { id: 'sunset', name: { en: 'Sunset', hy: 'Մայրամուտ' }, base: 'persimmon', pattern: 'petal', accent: 'ivory' },
  { id: 'night-plum', name: { en: 'Night plum', hy: 'Գիշերային սալոր' }, base: 'mulberry', pattern: 'petal', accent: 'ivory' },
  { id: 'butter-mint', name: { en: 'Butter & mint', hy: 'Կարագ և անանուխ' }, base: 'butter', pattern: 'mint', accent: 'ivory' },
  { id: 'lilac-cocoa', name: { en: 'Lilac cocoa', hy: 'Յասաման և կակաո' }, base: 'lilac', pattern: 'cocoa', accent: 'ivory' },
  { id: 'garden', name: { en: 'Garden', hy: 'Այգի' }, base: 'sage', pattern: 'butter', accent: 'ivory' }
];

export const COVER_SHAPES = [
  { id: 'square', name: { en: 'Square', hy: 'Քառակուսի' }, price: 0 },
  { id: 'oval', name: { en: 'Oval', hy: 'Օվալ' }, price: 0 },
  { id: 'cookie', name: { en: 'Cookie', hy: 'Թխվածքաբլիթ' }, price: 600 },
  { id: 'cracker', name: { en: 'Cracker', hy: 'Կրեկեր' }, price: 600 },
  { id: 'cartouche', name: { en: 'Cartouche', hy: 'Քարտուշ' }, price: 900 }
];

export const SECTION_TYPES = [
  { id: 'socket', name: { en: 'Socket', hy: 'Վարդակ' } },
  { id: 'k1', name: { en: '1 key', hy: '1 ստեղն' } },
  { id: 'k2', name: { en: '2 keys', hy: '2 ստեղն' } },
  { id: 'k3', name: { en: '3 keys', hy: '3 ստեղն' } },
  { id: 'blank', name: { en: 'Blank', hy: 'Դատարկ' } }
];

export const PATTERNS = [
  { id: 'plain', name: { en: 'Plain', hy: 'Միագույն' }, price: 0 },
  { id: 'waves', name: { en: 'Waves', hy: 'Ալիքներ' }, price: 500 },
  { id: 'blobs', name: { en: 'Soft shapes', hy: 'Փափուկ ձևեր' }, price: 500 },
  { id: 'stripes', name: { en: 'Stripes', hy: 'Գծեր' }, price: 500 },
  { id: 'dots', name: { en: 'Dots', hy: 'Կետեր' }, price: 500 },
  { id: 'checks', name: { en: 'Checks', hy: 'Վանդակներ' }, price: 500 }
];

// Decor objects: each kind has its own shape and size options.
export const DECOR_SHAPES = {
  tray: [
    { id: 'bean', name: { en: 'Bean', hy: 'Լոբի' } },
    { id: 'cloud', name: { en: 'Cloud', hy: 'Ամպ' } },
    { id: 'flower', name: { en: 'Flower', hy: 'Ծաղիկ' } }
  ],
  frame: [
    { id: 'wavy', name: { en: 'Wavy', hy: 'Ալիքաձև' } },
    { id: 'scallop', name: { en: 'Scallop', hy: 'Ատամնաեզր' } }
  ],
  mirror: [
    { id: 'blob', name: { en: 'Puddle', hy: 'Ջրափոս' } },
    { id: 'arch', name: { en: 'Arch', hy: 'Կամար' } }
  ]
};

export const DECOR_SIZES = {
  tray: [
    { id: 's', dims: '12 × 9 cm', price: 5900 },
    { id: 'm', dims: '16 × 12 cm', price: 7900 },
    { id: 'l', dims: '22 × 16 cm', price: 9900 }
  ],
  frame: [
    { id: 's', dims: '10 × 15 cm photo', price: 6900 },
    { id: 'm', dims: '13 × 18 cm photo', price: 8900 }
  ],
  mirror: [
    { id: 'm', dims: '25 × 30 cm', price: 14900 },
    { id: 'l', dims: '35 × 42 cm', price: 19900 }
  ]
};

export const COVER_PRICING = { firstSection: 3900, extraSection: 2900 };

export const COLLECTIONS = [
  { id: 'everyday', name: { en: 'Everyday', hy: 'Ամենօրյա' }, color: 'ivory' },
  { id: 'waves', name: { en: 'Waves', hy: 'Ալիքներ' }, color: 'periwinkle' },
  { id: 'soft', name: { en: 'Soft shapes', hy: 'Փափուկ ձևեր' }, color: 'petal' },
  { id: 'graphic', name: { en: 'Checks & dots', hy: 'Վանդակներ և կետեր' }, color: 'butter' },
  { id: 'objects', name: { en: 'Objects', hy: 'Առարկաներ' }, color: 'persimmon' }
];

const cover = (slug, collection, name, blurb, d) => ({ slug, category: 'cover', kind: 'cover', collection, name, blurb, defaults: d });
const decor = (slug, kind, name, blurb, d) => ({ slug, category: 'decor', kind, collection: 'objects', name, blurb, defaults: d });

export const PRODUCTS = [
  cover('wave-switch', 'waves',
    { en: 'Wave switch cover', hy: 'Ալիք անջատիչի համար' },
    { en: 'A slow wave across a single switch. Calm, but never plain.', hy: 'Դանդաղ ալիք մեկ անջատիչի վրա։ Հանգիստ, բայց ոչ ձանձրալի։' },
    { sections: 1, slots: ['k1'], shape: 'oval', orientation: 'h', pattern: 'waves', combo: 'peach-sky' }),
  cover('cookie-duo', 'soft',
    { en: 'Cookie double cover', hy: 'Կրկնակի «Թխվածքաբլիթ»' },
    { en: 'Two keys, soft scalloped edges and a floating shape in your colors.', hy: 'Երկու ստեղն, փափուկ ալիքավոր եզրեր և լողացող ձև քո գույներով։' },
    { sections: 2, slots: ['k1', 'k1'], shape: 'cookie', orientation: 'h', pattern: 'blobs', combo: 'berry-milk' }),
  cover('dotty-socket', 'graphic',
    { en: 'Dotty socket cover', hy: 'Կետավոր վարդակ' },
    { en: 'Polka dots around the socket you use every day.', hy: 'Կետեր այն վարդակի շուրջ, որից օգտվում ես ամեն օր։' },
    { sections: 1, slots: ['socket'], shape: 'square', orientation: 'h', pattern: 'dots', combo: 'butter-mint' }),
  cover('cracker-trio', 'graphic',
    { en: 'Cracker trio', hy: '«Կրեկեր» եռյակ' },
    { en: 'A switch and two sockets in one checked frame, with crisp cracker edges.', hy: 'Անջատիչ և երկու վարդակ մեկ վանդակավոր շրջանակում՝ կրեկերի եզրերով։' },
    { sections: 3, slots: ['k2', 'socket', 'socket'], shape: 'cracker', orientation: 'h', pattern: 'checks', combo: 'sunset' }),
  cover('plum-cartouche', 'everyday',
    { en: 'Plum cartouche', hy: 'Սալորագույն քարտուշ' },
    { en: 'A framed, slightly theatrical shape for a double switch.', hy: 'Շրջանակված, մի փոքր թատերական ձև կրկնակի անջատիչի համար։' },
    { sections: 1, slots: ['k2'], shape: 'cartouche', orientation: 'h', pattern: 'plain', combo: 'night-plum' }),
  cover('stripe-tower', 'everyday',
    { en: 'Stripe tower', hy: 'Գծավոր աշտարակ' },
    { en: 'Four stacked sections for the busy wall by the kitchen counter.', hy: 'Չորս հարկանի բլոկ խոհանոցի զբաղված պատի համար։' },
    { sections: 4, slots: ['k1', 'k1', 'socket', 'socket'], shape: 'square', orientation: 'v', pattern: 'stripes', combo: 'classic' }),
  cover('cloud-cookie', 'soft',
    { en: 'Cookie switch cover', hy: '«Թխվածքաբլիթ» անջատիչ' },
    { en: 'One key, soft scallops, one quiet color.', hy: 'Մեկ ստեղն, փափուկ եզրեր, մեկ հանգիստ գույն։' },
    { sections: 1, slots: ['k1'], shape: 'cookie', orientation: 'h', pattern: 'plain', combo: 'berry-milk' }),
  cover('sunny-sockets', 'waves',
    { en: 'Sunny double socket', hy: 'Արևոտ կրկնակի վարդակ' },
    { en: 'Two sockets wrapped in warm, rolling waves.', hy: 'Երկու վարդակ՝ տաք, գլորվող ալիքների մեջ։' },
    { sections: 2, slots: ['socket', 'socket'], shape: 'oval', orientation: 'h', pattern: 'waves', combo: 'sunset' }),
  decor('bean-tray', 'tray',
    { en: 'Bean tray', hy: '«Լոբի» սկուտեղ' },
    { en: 'A soft tray that catches keys, rings and the small things by the door.', hy: 'Փափուկ սկուտեղ բանալիների, մատանիների և դռան մոտի մանրուքների համար։' },
    { shape: 'bean', size: 'm', pattern: 'plain', combo: 'sunset' }),
  decor('cloud-tray', 'tray',
    { en: 'Cloud tray', hy: '«Ամպ» սկուտեղ' },
    { en: 'A cloud-shaped dish for a bedside table.', hy: 'Ամպաձև աման մահճակալի կողքի սեղանի համար։' },
    { shape: 'cloud', size: 's', pattern: 'dots', combo: 'peach-sky' }),
  decor('wavy-frame', 'frame',
    { en: 'Wavy photo frame', hy: 'Ալիքաձև լուսանկարի շրջանակ' },
    { en: 'A wobbly frame for the photo you actually look at.', hy: 'Ալիքավոր շրջանակ այն լուսանկարի համար, որին իսկապես նայում ես։' },
    { shape: 'wavy', size: 's', pattern: 'plain', combo: 'berry-milk' }),
  decor('puddle-mirror', 'mirror',
    { en: 'Puddle mirror', hy: '«Ջրափոս» հայելի' },
    { en: 'A soft-edged wall mirror with a colored rim.', hy: 'Փափուկ եզրերով պատի հայելի՝ գունավոր եզրագծով։' },
    { shape: 'blob', size: 'm', pattern: 'plain', combo: 'peach-sky' })
];
