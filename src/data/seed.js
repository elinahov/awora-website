// Bundled catalog. Mirrors the Supabase tables in supabase/schema.sql.
// The app uses this when VITE_SUPABASE_URL is not set, or if Supabase is unreachable.
// Prices are placeholders in AMD — edit them here or in Supabase.

// Printable colors = the filaments in stock (Bambu Lab). Hex values are approximations from photos;
// swap in the filament's official hex when you have it. `filament` is for the shop only.
export const COLORS = [
  { id: 'white', hex: '#F6F4EF', name: { en: 'White', hy: 'Սպիտակ' }, filament: 'PLA Lite Matte White' },
  { id: 'sand', hex: '#E8C5A5', name: { en: 'Sand', hy: 'Բեժ' }, filament: 'PLA Lite Matte Skin tone' },
  { id: 'yellow', hex: '#F5D02A', name: { en: 'Yellow', hy: 'Դեղին' }, filament: 'PLA Lite Matte Yellow' },
  { id: 'sunflower', hex: '#F2A51C', name: { en: 'Sunflower', hy: 'Դեղին' }, filament: 'PLA Lite Matte Sunflower' },
  { id: 'orange', hex: '#EE6A24', name: { en: 'Orange', hy: 'Նարնջագույն' }, filament: 'PLA Lite Matte Orange' },
  { id: 'red', hex: '#E0403A', name: { en: 'Red', hy: 'Կարմիր' }, filament: 'PLA Lite Matte Red' },
  { id: 'burgundy', hex: '#8B2335', name: { en: 'Burgundy', hy: 'Բորդո' }, filament: 'PLA-CF Burgundy Red 14200' },
  { id: 'green', hex: '#3FAE4E', name: { en: 'Green', hy: 'Կանաչ' }, filament: 'PLA Lite Matte Green' },
  { id: 'misty', hex: '#7590AC', name: { en: 'Misty blue', hy: 'Մշուշոտ կապույտ' }, filament: 'PETG Basic Misty Blue 30108' },
  { id: 'blue', hex: '#3E86D4', name: { en: 'Blue', hy: 'Կապույտ' }, filament: 'PLA Lite Matte Blue' },
  { id: 'navy', hex: '#2D3A6A', name: { en: 'Navy', hy: 'Մուգ կապույտ' }, filament: 'PLA Matte Dark Blue 11602' },
  { id: 'black', hex: '#232125', name: { en: 'Black', hy: 'Սև' }, filament: 'PLA Lite Matte Black' }
];

// Ready-made color combinations: base / pattern / accent (keys, rim, inner mount…)
export const COMBOS = [
  { id: 'classic', name: { en: 'Classic Awora', hy: 'Դասական Awora' }, base: 'white', pattern: 'burgundy', accent: 'burgundy' },
  { id: 'wine', name: { en: 'Wine', hy: 'Գինի' }, base: 'burgundy', pattern: 'sand', accent: 'white' },
  { id: 'poppy', name: { en: 'Poppy', hy: 'Կակաչ' }, base: 'red', pattern: 'white', accent: 'white' },
  { id: 'sunny', name: { en: 'Sunny', hy: 'Արևոտ' }, base: 'yellow', pattern: 'orange', accent: 'white' },
  { id: 'garden', name: { en: 'Garden', hy: 'Այգի' }, base: 'green', pattern: 'sunflower', accent: 'white' },
  { id: 'sea', name: { en: 'Sea', hy: 'Ծով' }, base: 'blue', pattern: 'white', accent: 'navy' },
  { id: 'night', name: { en: 'Night', hy: 'Գիշեր' }, base: 'navy', pattern: 'sunflower', accent: 'white' },
  { id: 'mist', name: { en: 'Mist', hy: 'Մշուշ' }, base: 'misty', pattern: 'white', accent: 'white' },
  { id: 'ink', name: { en: 'Ink', hy: 'Թանաք' }, base: 'white', pattern: 'black', accent: 'black' }
];

export const COVER_SHAPES = [
  { id: 'square', name: { en: 'Square', hy: 'Քառակուսի' }, price: 0 },
  { id: 'circle', name: { en: 'Circle', hy: 'Շրջան' }, price: 0 },
  { id: 'clover', name: { en: 'Clover', hy: 'Երեքնուկ' }, price: 600 },
  { id: 'cloud', name: { en: 'Cloud', hy: 'Ամպ' }, price: 600 },
  { id: 'wavy', name: { en: 'Wavy', hy: 'Ալիքավոր' }, price: 600 },
  { id: 'flower', name: { en: 'Flower', hy: 'Ծաղիկ' }, price: 900 }
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

export const COVER_PRICING = { firstSection: 3900, extraSection: 2900, lever: 500 };

// Toppers for toggle-switch levers, chosen per key. 'none' = the plain lever. Priced per topper (COVER_PRICING.lever).
export const LEVER_SHAPES = [
  { id: 'none', name: { en: 'None', hy: 'Առանց' } },
  { id: 'circle', name: { en: 'Circle', hy: 'Շրջան' } },
  { id: 'heart', name: { en: 'Heart', hy: 'Սիրտ' } },
  { id: 'cloud', name: { en: 'Cloud', hy: 'Ամպ' } },
  { id: 'clover', name: { en: 'Clover', hy: 'Երեքնուկ' } },
  { id: 'flower', name: { en: 'Flower', hy: 'Ծաղիկ' } },
  { id: 'sun', name: { en: 'Sun', hy: 'Արև' } }
];

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
    { sections: 1, slots: ['k1'], shape: 'circle', orientation: 'h', pattern: 'waves', combo: 'sea' }),
  cover('clover-duo', 'soft',
    { en: 'Clover double cover', hy: 'Կրկնակի «Երեքնուկ»' },
    { en: 'Two keys, big round lobes and a floating shape in your colors.', hy: 'Երկու ստեղն, մեծ կլոր թերթեր և լողացող ձև քո գույներով։' },
    { sections: 2, slots: ['k1', 'k1'], shape: 'clover', orientation: 'h', pattern: 'blobs', combo: 'poppy' }),
  cover('dotty-socket', 'graphic',
    { en: 'Dotty socket cover', hy: 'Կետավոր վարդակ' },
    { en: 'Polka dots around the socket you use every day.', hy: 'Կետեր այն վարդակի շուրջ, որից օգտվում ես ամեն օր։' },
    { sections: 1, slots: ['socket'], shape: 'square', orientation: 'h', pattern: 'dots', combo: 'garden' }),
  cover('wavy-trio', 'graphic',
    { en: 'Wavy trio', hy: 'Ալիքավոր եռյակ' },
    { en: 'A switch and two sockets in one checked frame, with a wavy edge all round.', hy: 'Անջատիչ և երկու վարդակ մեկ վանդակավոր շրջանակում՝ ալիքավոր եզրով։' },
    { sections: 3, slots: ['k2', 'socket', 'socket'], shape: 'wavy', orientation: 'h', pattern: 'checks', combo: 'sunny' }),
  cover('flower-switch', 'everyday',
    { en: 'Flower double switch', hy: '«Ծաղիկ» կրկնակի անջատիչ' },
    { en: 'A round, petalled frame for a double switch.', hy: 'Կլոր, թերթավոր շրջանակ կրկնակի անջատիչի համար։' },
    { sections: 1, slots: ['k2'], shape: 'flower', orientation: 'h', pattern: 'plain', combo: 'wine' }),
  cover('stripe-tower', 'everyday',
    { en: 'Stripe tower', hy: 'Գծավոր աշտարակ' },
    { en: 'Four stacked sections for the busy wall by the kitchen counter.', hy: 'Չորս հարկանի բլոկ խոհանոցի զբաղված պատի համար։' },
    { sections: 4, slots: ['k1', 'k1', 'socket', 'socket'], shape: 'square', orientation: 'v', pattern: 'stripes', combo: 'classic' }),
  cover('cloud-switch', 'soft',
    { en: 'Cloud switch cover', hy: '«Ամպ» անջատիչ' },
    { en: 'One key, soft cloudy edges, one quiet color.', hy: 'Մեկ ստեղն, ամպի պես փափուկ եզրեր, մեկ հանգիստ գույն։' },
    { sections: 1, slots: ['k1'], shape: 'cloud', orientation: 'h', pattern: 'plain', combo: 'mist' }),
  cover('sunny-sockets', 'waves',
    { en: 'Sunny double socket', hy: 'Արևոտ կրկնակի վարդակ' },
    { en: 'Two sockets wrapped in warm, rolling waves.', hy: 'Երկու վարդակ՝ տաք, գլորվող ալիքների մեջ։' },
    { sections: 2, slots: ['socket', 'socket'], shape: 'circle', orientation: 'h', pattern: 'waves', combo: 'sunny' }),
  decor('bean-tray', 'tray',
    { en: 'Bean tray', hy: '«Լոբի» սկուտեղ' },
    { en: 'A soft tray that catches keys, rings and the small things by the door.', hy: 'Փափուկ սկուտեղ բանալիների, մատանիների և դռան մոտի մանրուքների համար։' },
    { shape: 'bean', size: 'm', pattern: 'plain', combo: 'poppy' }),
  decor('cloud-tray', 'tray',
    { en: 'Cloud tray', hy: '«Ամպ» սկուտեղ' },
    { en: 'A cloud-shaped dish for a bedside table.', hy: 'Ամպաձև աման մահճակալի կողքի սեղանի համար։' },
    { shape: 'cloud', size: 's', pattern: 'dots', combo: 'mist' }),
  decor('wavy-frame', 'frame',
    { en: 'Wavy photo frame', hy: 'Ալիքաձև լուսանկարի շրջանակ' },
    { en: 'A wobbly frame for the photo you actually look at.', hy: 'Ալիքավոր շրջանակ այն լուսանկարի համար, որին իսկապես նայում ես։' },
    { shape: 'wavy', size: 's', pattern: 'plain', combo: 'classic' }),
  decor('puddle-mirror', 'mirror',
    { en: 'Puddle mirror', hy: '«Ջրափոս» հայելի' },
    { en: 'A soft-edged wall mirror with a colored rim.', hy: 'Փափուկ եզրերով պատի հայելի՝ գունավոր եզրագծով։' },
    { shape: 'blob', size: 'm', pattern: 'plain', combo: 'sea' })
];
