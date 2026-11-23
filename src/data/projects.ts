/**
 * Showcase projects for the work index and case-study pages.
 *
 * NOTE: Narrative copy (overview, challenge, approach, outcomes, quotes) is
 * placeholder writing built around the artwork in /public/images. Replace it
 * with real project details as they become available — the page layouts read
 * every field from here, so no component changes are needed.
 */

export interface ProjectSwatch {
  name: string
  hex: string
}

export type ProjectFrame =
  /** A regular image, shown in full. */
  | { kind: 'image'; src: string; alt: string; caption?: string; fit?: boolean }
  /**
   * The artwork shown at a moderate size on a brand-colour panel: a poster hung
   * on a coloured wall, or a logo printed on a business card with its reverse
   * behind it. Never upscaled, so it stays sharp.
   */
  | { kind: 'mockup'; variant: 'poster' | 'card'; src: string; alt: string; caption?: string; tint: string; reverse?: string }
  /** A light-background artwork multiplied onto a brand colour, like a print on stock. */
  | { kind: 'tint'; src: string; alt: string; caption?: string; tint: string }

export interface ProjectOutcome {
  title: string
  body: string
}

export interface Project {
  slug: string
  title: string
  client: string
  tagline: string
  industry: string
  services: string[]
  deliverables: string[]
  year: string
  cover: string
  coverAlt: string
  /**
   * cover: full-bleed photograph cropped to the frame. contain: artwork on a plain
   * ground. fit: unknown proportions (CMS uploads); shown whole over a blurred fill.
   */
  coverFit: 'cover' | 'contain' | 'fit'
  /** Background behind contained artwork; should match the artwork's own ground. */
  surface: string
  accent: string
  palette: ProjectSwatch[]
  overview: string
  challenge: string
  approach: string
  outcomes: ProjectOutcome[]
  frames: ProjectFrame[]
  quote?: { text: string; author: string }
}

export const projectAccents = ['#ffb000', '#b9ff32', '#ff4fa3', '#22d9ee']

export const projects: Project[] = [
  {
    slug: 'intentional',
    title: 'Intentional',
    client: 'Intentional Collective',
    tagline: 'A poster series that gives culture a louder, sharper voice.',
    industry: 'Editorial',
    services: ['Art Direction', 'Campaign', 'Typography', 'Photography'],
    deliverables: ['Poster series', 'Social cut-downs', 'Type system'],
    year: '2026',
    cover: '/images/work1.webp',
    coverAlt: 'FORM poster from the Intentional series, a portrait framed by oversized orange letterforms',
    coverFit: 'cover',
    surface: '#111111',
    accent: '#ff7a1a',
    palette: [
      { name: 'Ember', hex: '#E8732A' },
      { name: 'Ink', hex: '#111111' },
      { name: 'Bone', hex: '#EDE6DA' },
      { name: 'Brass', hex: '#C9A15B' },
    ],
    overview:
      'Intentional is a cultural collective that hosts talks, showcases and gatherings for young creatives. They needed a campaign language bold enough to stop people mid-scroll and flexible enough to carry a new message every month.',
    challenge:
      'Each event had a different theme, speaker line-up and audience, but the collective wanted every poster to feel unmistakably theirs. The system had to hold a single word, a single face and a lot of information without collapsing into noise.',
    approach:
      'We built the series around one oversized word per poster, cropped hard against high-contrast portraiture. A handwritten signature mark carries warmth across every piece, while a strict side-rail grid keeps the event details calm and legible.',
    outcomes: [
      { title: 'One word, one idea', body: 'Every poster leads with a single statement word — FORM, SHIFT — so the theme reads in under a second.' },
      { title: 'A repeatable grid', body: 'A fixed information rail means new editions can be produced quickly without redesigning the layout.' },
      { title: 'Made for every screen', body: 'Each poster breaks down into story, feed and banner formats from the same master artwork.' },
    ],
    frames: [
      { kind: 'image', src: '/images/work2.webp', alt: 'SHIFT poster from the Intentional series, a portrait with tall gold letterforms', caption: 'SHIFT — second edition of the series' },
      { kind: 'mockup', variant: 'poster', src: '/images/work1.webp', alt: 'FORM poster displayed on an ember-orange wall', caption: 'FORM, printed for the launch event', tint: '#E8732A' },
    ],
    quote: { text: 'It finally looks like the energy in the room.', author: 'Programme lead, Intentional Collective' },
  },
  {
    slug: 'zahara-hotels',
    title: 'Zahara',
    client: 'Zahara Hotels & Resorts',
    tagline: 'A quiet-luxury identity rooted in arches, gardens and gold light.',
    industry: 'Hospitality',
    services: ['Brand Identity', 'Logo Design', 'Brand Guidelines'],
    deliverables: ['Logomark & wordmark', 'App icon', 'Colour & type system', 'Signage concepts'],
    year: '2025',
    cover: '/images/work10.webp',
    coverAlt: 'Zahara Hotels & Resorts logo, an arched gold monogram above an emerald serif wordmark',
    coverFit: 'contain',
    surface: '#FEFAF2',
    accent: '#1E4D3A',
    palette: [
      { name: 'Garden', hex: '#1E4D3A' },
      { name: 'Gilt', hex: '#C9A45C' },
      { name: 'Sandstone', hex: '#FAF4EA' },
      { name: 'Dusk', hex: '#2B2B2B' },
    ],
    overview:
      'Zahara is a boutique hospitality group opening resort properties with a focus on calm, craft and local architecture. They came to us before their first opening to define how the brand should look, feel and welcome guests.',
    challenge:
      'Luxury hospitality is crowded with gold serif logos that all look the same. Zahara needed to signal premium service while feeling warm and grounded rather than cold or flashy.',
    approach:
      'We drew the monogram from the shape of a courtyard arch, nesting the Z inside a doorway so the mark reads as both a letter and an invitation. A deep garden green replaces the expected black, and gilt is used sparingly as an accent, never a background.',
    outcomes: [
      { title: 'A mark with a story', body: 'The arched monogram gives staff and guests a simple story: every Zahara is a doorway into somewhere calmer.' },
      { title: 'Built for small sizes', body: 'A simplified app icon and stamp version keep the mark crisp on key cards, signage and mobile.' },
      { title: 'A complete toolkit', body: 'Guidelines cover colour ratios, typography, photography mood and signage placement for future properties.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work10.webp', alt: 'Zahara business card with the arched monogram, garden-green reverse behind it', caption: 'Stationery in garden green and sandstone', tint: '#EADBC2', reverse: '#1E4D3A' },
      { kind: 'tint', src: '/images/work10.webp', alt: 'Zahara logo printed on warm sandstone stock', caption: 'Primary lockup on sandstone', tint: '#EADBC2' },
    ],
  },
  {
    slug: 'nova-lux-eclipse',
    title: 'Eclipse',
    client: 'Aurora × Nova Lux',
    tagline: 'A one-night fashion event poster that sold out the room.',
    industry: 'Events',
    services: ['Event Branding', 'Art Direction', 'Poster Design'],
    deliverables: ['Hero poster', 'Ticketing assets', 'Social countdown'],
    year: '2026',
    cover: '/images/work3.webp',
    coverAlt: 'Eclipse event poster, a model in pale blue denim in front of oversized condensed type',
    coverFit: 'cover',
    surface: '#F5F5F2',
    accent: '#A9C6E3',
    palette: [
      { name: 'Glacier', hex: '#A9C6E3' },
      { name: 'Paper', hex: '#F5F5F2' },
      { name: 'Graphite', hex: '#121212' },
      { name: 'Chrome', hex: '#C9CCD1' },
    ],
    overview:
      'Aurora partnered with Nova Lux to host Eclipse, a midnight fashion showcase. We were asked to create the campaign artwork that would launch ticket sales and carry through to the night itself.',
    challenge:
      'With only three weeks between announcement and event, the poster had to do everything at once: introduce the theme, feature the hero look and make the date impossible to miss.',
    approach:
      'We let the type sit behind the model so the figure literally eclipses the title. A cool, almost monochrome palette keeps attention on the garment, while a tight header and footer handle the practical details.',
    outcomes: [
      { title: 'Concept in the layout', body: 'The model overlapping the word ECLIPSE turns the event name into the image itself.' },
      { title: 'Clear hierarchy', body: 'Date, venue and reservations sit in fixed zones, so the artwork stays clean.' },
      { title: 'A countdown kit', body: 'The master poster was adapted into a week of social countdown frames.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'poster', src: '/images/work3.webp', alt: 'Eclipse poster on a glacier-blue wall', caption: 'The hero poster, as it ran around the venue', tint: '#A9C6E3' },
    ],
  },
  {
    slug: 'maltora',
    title: 'Maltora',
    client: 'Maltora Brewing Co.',
    tagline: 'A premium beer identity that brings the brewhouse to the label.',
    industry: 'Food & Beverage',
    services: ['Brand Identity', 'Logo Design', 'Packaging Direction'],
    deliverables: ['Monogram', 'Wordmark', 'App icon', 'Label system'],
    year: '2025',
    cover: '/images/work6.webp',
    coverAlt: 'Maltora Premium Beer logo, an M monogram with a cog crown and wheat ear',
    coverFit: 'contain',
    surface: '#FDFBF7',
    accent: '#C99A3B',
    palette: [
      { name: 'Barley', hex: '#C99A3B' },
      { name: 'Stout', hex: '#2B2B2B' },
      { name: 'Foam', hex: '#FBF7EF' },
      { name: 'Copper', hex: '#9C6B2E' },
    ],
    overview:
      'Maltora is an independent brewery moving from taproom favourite to retail shelves. They needed an identity that could stand next to established premium brands without losing their craft roots.',
    challenge:
      'The founders wanted to honour both sides of brewing — the grain and the machinery — in one mark, without it turning into a busy illustration.',
    approach:
      'We combined a brewing cog and a wheat ear inside the M itself, so the industrial and the natural meet in a single letterform. A refined serif wordmark and a tight gold-and-charcoal palette carry the premium positioning.',
    outcomes: [
      { title: 'Grain meets gear', body: 'The monogram tells the brewing story without needing a single word.' },
      { title: 'Shelf-ready', body: 'The mark holds up at bottle-cap size and on six-pack sleeves.' },
      { title: 'Room to grow', body: 'A label system lets seasonal brews change colour while staying recognisably Maltora.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work6.webp', alt: 'Maltora business card with a stout-charcoal reverse', caption: 'Brewery stationery', tint: '#E9D7B4', reverse: '#2B2B2B' },
      { kind: 'tint', src: '/images/work6.webp', alt: 'Maltora lockup on a barley-toned ground', caption: 'Lockup on kraft label stock', tint: '#E9D7B4' },
    ],
  },
  {
    slug: 'noir-beauty',
    title: 'NÖIR',
    client: 'NÖIR Skin',
    tagline: 'Beauty in depth — a campaign that whispers instead of shouts.',
    industry: 'Beauty',
    services: ['Campaign', 'Art Direction', 'Retouching'],
    deliverables: ['Key visual', 'Print ads', 'Product launch social'],
    year: '2026',
    cover: '/images/img4.webp',
    coverAlt: 'NÖIR campaign poster, a black-and-white beauty portrait under a bold NÖIR wordmark',
    coverFit: 'cover',
    surface: '#1A1A1A',
    accent: '#ff4fa3',
    palette: [
      { name: 'Onyx', hex: '#0E0E0E' },
      { name: 'Porcelain', hex: '#F3F1EE' },
      { name: 'Smoke', hex: '#9A9A9A' },
      { name: 'Blush', hex: '#E7B7A9' },
    ],
    overview:
      'NÖIR is a skincare label built on minimal, high-performance formulas. For their launch campaign they wanted imagery that felt like a fashion editorial, not a product ad.',
    challenge:
      'Most beauty advertising leans on saturated colour and glossy close-ups. NÖIR wanted restraint — monochrome, soft and confident — while still putting the brand name front and centre.',
    approach:
      'We shot in black and white with a single soft light source, then placed the wordmark at a scale that frames the face. A thin focus box draws the eye to the skin, echoing the brand promise of depth over surface.',
    outcomes: [
      { title: 'Editorial, not advertorial', body: 'The campaign reads like a magazine cover, giving the brand instant premium credibility.' },
      { title: 'Monochrome discipline', body: 'Keeping colour out lets the product packaging become the only accent in-store.' },
      { title: 'One shoot, many formats', body: 'The key visual was cropped into print, story and banner layouts from a single session.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'poster', src: '/images/img4.webp', alt: 'NÖIR campaign poster on a blush wall', caption: 'Key visual, print edition', tint: '#E7B7A9' },
    ],
  },
  {
    slug: 'riverstone-night-mode',
    title: 'Night Mode',
    client: 'Riverstone Hotel',
    tagline: 'An after-dark series that made a hotel lounge the place to be.',
    industry: 'Events',
    services: ['Event Branding', 'Poster Design', 'Art Direction'],
    deliverables: ['Event poster', 'Digital screens', 'Invitation suite'],
    year: '2025',
    cover: '/images/work4.webp',
    coverAlt: 'Night Mode poster for Riverstone Hotel, a man in a suit beneath tall silver type',
    coverFit: 'cover',
    surface: '#1A1A1A',
    accent: '#C8A24A',
    palette: [
      { name: 'Midnight', hex: '#1A1A1A' },
      { name: 'Silver', hex: '#BDBDBD' },
      { name: 'Champagne', hex: '#C8A24A' },
      { name: 'Linen', hex: '#F2F0EB' },
    ],
    overview:
      'Riverstone Hotel launched Night Mode, a monthly evening of music and cocktails in its lounge. They needed promotional artwork that would attract locals, not just hotel guests.',
    challenge:
      'Hotel event marketing often feels corporate. Riverstone wanted the poster to look like a premium night out while still carrying the hotel brand and practical details.',
    approach:
      'We set NIGHT MODE in towering metallic type, layered behind a confident, well-dressed figure. Side columns carry the line-up and booking details, and a champagne accent ties back to the bar.',
    outcomes: [
      { title: 'A night with a face', body: 'A strong human figure makes the event feel social and inviting, not corporate.' },
      { title: 'Lobby to Instagram', body: 'Artwork was built for in-lobby screens, printed invitations and social posts.' },
      { title: 'A repeatable series', body: 'The layout supports a new host and date each month with minimal changes.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'poster', src: '/images/work4.webp', alt: 'Night Mode poster on a champagne-gold wall', caption: 'Lobby poster for the launch night', tint: '#C8A24A' },
    ],
  },
  {
    slug: 'loomis-shirting',
    title: 'Loomis',
    client: 'Loomis Shirting',
    tagline: 'Shirting, refined — an identity tailored down to the collar.',
    industry: 'Fashion',
    services: ['Brand Identity', 'Logo Design', 'Packaging Direction'],
    deliverables: ['Monogram', 'Wordmark', 'Swing tags', 'App icon'],
    year: '2025',
    cover: '/images/work8.webp',
    coverAlt: 'Loomis Shirting logo, an LL monogram shaped like a shirt collar above a spaced serif wordmark',
    coverFit: 'contain',
    surface: '#FEFEFE',
    accent: '#B9A68E',
    palette: [
      { name: 'Ink', hex: '#151515' },
      { name: 'Taupe', hex: '#B9A68E' },
      { name: 'Ivory', hex: '#F7F3EC' },
      { name: 'Oxford', hex: '#3E4A5C' },
    ],
    overview:
      'Loomis makes made-to-measure shirts for people who care about fit. As they moved online, they needed an identity that conveyed precision and craft at every size.',
    challenge:
      'The brand had to feel premium without feeling stuffy, and the mark needed to work stitched into a collar as well as on a website header.',
    approach:
      'We shaped two Ls into an open collar, with a small button detail at the neck. The wordmark is widely spaced like a tailor\'s label, and a taupe accent nods to unbleached cotton.',
    outcomes: [
      { title: 'Product in the mark', body: 'The collar monogram tells customers exactly what Loomis makes.' },
      { title: 'Stitch-friendly', body: 'Simple, solid shapes embroider cleanly at small sizes.' },
      { title: 'Calm retail presence', body: 'Generous spacing and a muted palette give packaging a boutique feel.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work8.webp', alt: 'Loomis business card with an oxford-blue reverse', caption: 'Swing tag and card set', tint: '#EFE6D6', reverse: '#3E4A5C' },
      { kind: 'tint', src: '/images/work8.webp', alt: 'Loomis lockup on ivory cotton tone', caption: 'Lockup on cotton ivory', tint: '#EFE6D6' },
    ],
  },
  {
    slug: 'savora',
    title: 'Savora',
    client: 'Savora Culinary House',
    tagline: 'A restaurant identity with steam, spice and a signature S.',
    industry: 'Food & Beverage',
    services: ['Brand Identity', 'Logo Design', 'Menu Design'],
    deliverables: ['Logomark', 'Wordmark', 'Menu system', 'App icon'],
    year: '2026',
    cover: '/images/work11.webp',
    coverAlt: 'Savora Culinary House logo, a burgundy S formed from a rising wisp of steam over a bowl',
    coverFit: 'contain',
    surface: '#FCF5E9',
    accent: '#7A1F2B',
    palette: [
      { name: 'Merlot', hex: '#7A1F2B' },
      { name: 'Cream', hex: '#FBF1E6' },
      { name: 'Clay', hex: '#C67B5C' },
      { name: 'Char', hex: '#2A2222' },
    ],
    overview:
      'Savora is a modern culinary house serving shared plates in a warm, intimate setting. They needed a name-led identity ready for signage, menus and delivery packaging.',
    challenge:
      'The owners wanted a mark that felt handcrafted and appetising, but still sharp enough to work as a small delivery sticker or app icon.',
    approach:
      'We formed the S from a rising wisp of steam above a bowl, so the letter and the food become one. A deep merlot and soft cream palette sets an evening dining mood.',
    outcomes: [
      { title: 'Appetite appeal', body: 'Steam suggests something freshly served — the mark makes people hungry.' },
      { title: 'Small-size strength', body: 'A boxed icon version stays legible on delivery bags and order screens.' },
      { title: 'Menu-ready', body: 'The type pairing extends naturally into menus and table cards.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work11.webp', alt: 'Savora business card with a merlot reverse', caption: 'Reservation cards in merlot and cream', tint: '#F1D9C6', reverse: '#7A1F2B' },
      { kind: 'tint', src: '/images/work11.webp', alt: 'Savora logo on a warm clay ground', caption: 'Lockup on menu stock', tint: '#F1D9C6' },
    ],
  },
  {
    slug: 'fragments',
    title: 'Fragments',
    client: 'Picarview Studio',
    tagline: 'A self-initiated study in colour blocks, crops and composure.',
    industry: 'Art Direction',
    services: ['Art Direction', 'Editorial Design', 'Photography'],
    deliverables: ['Three-piece series', 'Exhibition prints'],
    year: '2026',
    cover: '/images/img1.webp',
    coverAlt: 'Editorial composition of a portrait split into mustard, black and rust colour blocks',
    coverFit: 'cover',
    surface: '#F2EBDD',
    accent: '#ffb000',
    palette: [
      { name: 'Mustard', hex: '#D9A520' },
      { name: 'Terracotta', hex: '#C9622F' },
      { name: 'Sage', hex: '#6B7A5A' },
      { name: 'Parchment', hex: '#F2EBDD' },
    ],
    overview:
      'Fragments is a studio project exploring how far a portrait can be broken apart before it stops reading as a person. It became a playground for the grid systems we now use in client work.',
    challenge:
      'We set ourselves a strict rule: a limited palette, simple rectangles and arcs, and no retouching beyond the crop.',
    approach:
      'Each piece starts with a single photograph, sliced and offset across a modular grid. Flat colour blocks balance the image, and negative space does as much work as the subject.',
    outcomes: [
      { title: 'A tested grid', body: 'The modular grid from this series now underpins several of our campaign layouts.' },
      { title: 'Colour discipline', body: 'Four earthy tones proved enough to give every piece a distinct mood.' },
      { title: 'Printed large', body: 'The series was produced as large-format prints for the studio walls.' },
    ],
    frames: [
      { kind: 'image', src: '/images/img2.webp', alt: 'Composition of a portrait framed by terracotta arcs and sage panels', caption: 'Fragment II' },
      { kind: 'image', src: '/images/img5.webp', alt: 'A portrait broken into a grid of yellow and orange tiles', caption: 'Fragment III' },
    ],
  },
  {
    slug: 'vendra',
    title: 'Vendra',
    client: 'Vendra Commerce',
    tagline: 'A bold, secure-feeling mark for a new kind of marketplace.',
    industry: 'Tech',
    services: ['Brand Identity', 'Logo Design', 'UI Direction'],
    deliverables: ['Logomark', 'Wordmark', 'App icon', 'UI kit starter'],
    year: '2025',
    cover: '/images/work5.webp',
    coverAlt: 'Vendra logo, a heavy black V with a shopping-bag padlock cut-out',
    coverFit: 'contain',
    surface: '#FEFEFE',
    accent: '#22d9ee',
    palette: [
      { name: 'Carbon', hex: '#0B0B0B' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Signal', hex: '#22D9EE' },
      { name: 'Slate', hex: '#3C3C3C' },
    ],
    overview:
      'Vendra is an online marketplace focused on safe payments between independent sellers and buyers. They needed a brand that felt trustworthy from the first tap.',
    challenge:
      'Marketplace logos tend to be playful and forgettable. Vendra needed to feel secure and dependable without looking like a bank.',
    approach:
      'We built a heavy, confident V and cut a shopping bag into it that doubles as a padlock. The wordmark is friendly and rounded to balance the weight of the mark.',
    outcomes: [
      { title: 'Trust at a glance', body: 'The bag-and-lock symbol makes the safety promise visible.' },
      { title: 'Icon-first', body: 'The mark was designed to work as a home-screen icon before anything else.' },
      { title: 'Ready for product', body: 'A starter UI kit carries the brand into the app experience.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work5.webp', alt: 'Vendra business card with a carbon-black reverse', caption: 'Seller welcome card', tint: '#C8F4FA', reverse: '#0B0B0B' },
      { kind: 'tint', src: '/images/work5.webp', alt: 'Vendra logo on a signal-blue ground', caption: 'Lockup on signal tint', tint: '#C8F4FA' },
    ],
  },
  {
    slug: 'velaro',
    title: 'Velaro',
    client: 'Velaro Tailoring',
    tagline: 'Tailored for everyday — an identity cut like a good lapel.',
    industry: 'Fashion',
    services: ['Brand Identity', 'Logo Design', 'Brand Guidelines'],
    deliverables: ['Monogram', 'Wordmark', 'Garment labels', 'App icon'],
    year: '2025',
    cover: '/images/work9.webp',
    coverAlt: 'Velaro logo, a V formed by a jacket lapel and tie beside a thin serif wordmark',
    coverFit: 'contain',
    surface: '#FEFEFE',
    accent: '#C8B79E',
    palette: [
      { name: 'Charcoal', hex: '#2A2A2A' },
      { name: 'Sand', hex: '#C8B79E' },
      { name: 'Chalk', hex: '#FAFAF8' },
      { name: 'Tobacco', hex: '#7A5C3E' },
    ],
    overview:
      'Velaro offers everyday tailoring at an accessible price. They wanted to look as considered as a bespoke house while staying approachable.',
    challenge:
      'The name had to carry sophistication on its own, and the mark needed to say “tailoring” without resorting to scissors or needles.',
    approach:
      'We drew the V from a jacket lapel with a tie at its centre, so the letter becomes the garment. A fine, high-contrast serif and a vertical strapline give it a fashion-house feel.',
    outcomes: [
      { title: 'The letter is the suit', body: 'A single shape communicates both the name and the product.' },
      { title: 'Label-ready', body: 'The monogram works woven into inner jacket labels and hang tags.' },
      { title: 'Approachable luxury', body: 'Soft sand tones keep the brand warm rather than exclusive.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work9.webp', alt: 'Velaro business card with a tobacco-brown reverse', caption: 'Garment label and card', tint: '#E8DDCB', reverse: '#7A5C3E' },
      { kind: 'tint', src: '/images/work9.webp', alt: 'Velaro lockup on sand-coloured stock', caption: 'Lockup on sand stock', tint: '#E8DDCB' },
    ],
  },
  {
    slug: 'brevan',
    title: 'Brevan',
    client: 'Brevan Brewing',
    tagline: 'A bottle hidden in a B — premium beer, distilled to one shape.',
    industry: 'Food & Beverage',
    services: ['Brand Identity', 'Logo Design'],
    deliverables: ['Logomark', 'Wordmark', 'Bottle-neck label concept'],
    year: '2025',
    cover: '/images/work7.webp',
    coverAlt: 'Brevan Premium Beer logo, a bold B with a bottle silhouette in its negative space',
    coverFit: 'contain',
    surface: '#FEFEFE',
    accent: '#b9ff32',
    palette: [
      { name: 'Black Lager', hex: '#0F0F0F' },
      { name: 'Label White', hex: '#FFFFFF' },
      { name: 'Hop', hex: '#8C8577' },
      { name: 'Amber', hex: '#D89A3A' },
    ],
    overview:
      'Brevan is a premium lager brand preparing its first national launch. The brief was simple: a logo people would remember after one glance at the bar.',
    challenge:
      'Beer branding is full of crests, banners and illustrations. Brevan wanted something cleaner — a mark confident enough to stand alone on a tap handle.',
    approach:
      'We carved a bottle silhouette into the negative space of a heavy B. Wide-tracked capitals and a small hop emblem complete the lockup without adding clutter.',
    outcomes: [
      { title: 'Hidden in plain sight', body: 'The bottle in the B rewards a second look and makes the mark memorable.' },
      { title: 'Tap-handle ready', body: 'A single-colour mark reproduces cleanly on glass, metal and wood.' },
      { title: 'Minimal by design', body: 'Restraint sets Brevan apart on a crowded shelf.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work7.webp', alt: 'Brevan business card with an amber reverse', caption: 'Trade card for bars and stockists', tint: '#F2D7A8', reverse: '#D89A3A' },
      { kind: 'tint', src: '/images/work7.webp', alt: 'Brevan lockup on amber-toned stock', caption: 'Lockup on amber stock', tint: '#F2D7A8' },
    ],
  },
  {
    slug: 'create',
    title: 'Create',
    client: 'Picarview Studio',
    tagline: 'Our own visual identity poster — light, script and a single verb.',
    industry: 'Art Direction',
    services: ['Visual Identity', 'Art Direction', 'Lettering'],
    deliverables: ['Studio poster', 'Lettering set', 'Social templates'],
    year: '2026',
    cover: '/images/img3.webp',
    coverAlt: 'Create poster, a portrait on deep teal overlaid with glowing gold script lettering',
    coverFit: 'cover',
    surface: '#1E3A40',
    accent: '#D9B77E',
    palette: [
      { name: 'Deep Teal', hex: '#1E3A40' },
      { name: 'Champagne', hex: '#D9B77E' },
      { name: 'Jet', hex: '#0D0D0D' },
      { name: 'Mist', hex: '#E9E6DF' },
    ],
    overview:
      'Create is the poster that sums up how we work: one clear idea, crafted carefully. It anchors our studio presentations and social presence.',
    challenge:
      'We wanted a piece that felt personal and expressive, yet clean enough to sit alongside our client work without stealing focus.',
    approach:
      'Hand-drawn script lettering glows across a moody portrait like neon on glass. A tight editorial header and our wordmark ground the expressive type.',
    outcomes: [
      { title: 'A studio signature', body: 'The Create script has become a recurring motif across our materials.' },
      { title: 'Expressive but ordered', body: 'Loose lettering sits inside a strict editorial frame.' },
      { title: 'Templated', body: 'The layout doubles as a template for future studio announcements.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'poster', src: '/images/img3.webp', alt: 'Create poster on a champagne wall', caption: 'Studio poster, printed', tint: '#D9B77E' },
    ],
  },
  {
    slug: 'meltora',
    title: 'Meltora',
    client: 'Meltora Creamery',
    tagline: 'A swirl of cocoa and strawberry for a small-batch creamery.',
    industry: 'Food & Beverage',
    services: ['Brand Identity', 'Logo Design', 'Packaging Direction'],
    deliverables: ['Logomark', 'Wordmark', 'Tub labels', 'App icon'],
    year: '2026',
    cover: '/images/work12.webp',
    coverAlt: 'Meltora logo, an ice-cream cone with a swirled scoop and a pink drip beside a geometric wordmark',
    coverFit: 'contain',
    surface: '#FCF5E9',
    accent: '#E58FA0',
    palette: [
      { name: 'Cocoa', hex: '#4A3426' },
      { name: 'Strawberry', hex: '#E58FA0' },
      { name: 'Vanilla', hex: '#FFF6EC' },
      { name: 'Waffle', hex: '#C89B6D' },
    ],
    overview:
      'Meltora makes small-batch ice cream for cafés and its own scoop shop. They wanted a brand that felt joyful and handmade, with enough polish for retail tubs.',
    challenge:
      'The identity needed to appeal to kids and adults alike, and work on everything from tiny cups to shopfront signage.',
    approach:
      'We drew a single-line cone and swirl with one playful strawberry drip, paired with a clean geometric wordmark. Cocoa and strawberry tones keep the palette sweet but grown-up.',
    outcomes: [
      { title: 'Joy without clutter', body: 'One drip of colour adds personality without overloading the mark.' },
      { title: 'Line-art flexibility', body: 'The single-weight drawing scales cleanly from cups to shop windows.' },
      { title: 'Flavour-ready', body: 'The label system swaps accent colours for each seasonal flavour.' },
    ],
    frames: [
      { kind: 'mockup', variant: 'card', src: '/images/work12.webp', alt: 'Meltora business card with a cocoa reverse', caption: 'Scoop-shop loyalty card', tint: '#F8D3DA', reverse: '#4A3426' },
      { kind: 'tint', src: '/images/work12.webp', alt: 'Meltora logo on a strawberry-tinted ground', caption: 'Lockup on strawberry tub', tint: '#F8D3DA' },
    ],
  },
]

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug)
}

/** Projects in the same industry first, then the rest, excluding the current one. */
export function getRelatedProjects(project: Project, pool: Project[] = projects, count = 3) {
  const others = pool.filter((candidate) => candidate.slug !== project.slug)
  const sameIndustry = others.filter((candidate) => candidate.industry === project.industry)
  const rest = others.filter((candidate) => candidate.industry !== project.industry)
  return [...sameIndustry, ...rest].slice(0, count)
}

export function getNextProject(project: Project, pool: Project[] = projects) {
  const index = pool.findIndex((candidate) => candidate.slug === project.slug)
  return pool[(index + 1) % pool.length]
}

interface CmsProjectLike {
  id: string
  title: string
  subtitle: string
  description: string
  industry: string
  altText: string
  imageUrl: string
  images?: Array<{ id: string; imageUrl: string; altText: string; sortOrder: number }>
  year?: string
  services?: string[]
  deliverables?: string[]
  challenge?: string
  approach?: string
  outcomes?: ProjectOutcome[]
}

/**
 * Turns a CMS project into a full case study using the fields edited in the
 * admin. Story fields left empty fall back to neutral placeholder copy so the
 * page never renders empty; factual fields (year, services, deliverables) are
 * simply hidden when empty rather than invented.
 */
export function projectFromCms(item: CmsProjectLike, index: number): Project {
  const industry = item.industry || 'General'
  const title = item.title || `Project ${index + 1}`
  const images = item.images?.length
    ? [...item.images].sort((a, b) => a.sortOrder - b.sortOrder)
    : [{ id: `${item.id}-cover`, imageUrl: item.imageUrl, altText: item.altText, sortOrder: 0 }]
  const accent = projectAccents[index % projectAccents.length]

  return {
    slug: item.id,
    title,
    client: title,
    tagline: item.subtitle || `A ${industry.toLowerCase()} project shaped with clarity and craft.`,
    industry,
    services: item.services ?? [],
    deliverables: item.deliverables ?? [],
    year: item.year ?? '',
    cover: images[0].imageUrl,
    coverAlt: images[0].altText || item.altText || title,
    coverFit: 'fit',
    surface: '#111111',
    accent,
    palette: [
      { name: 'Ink', hex: '#111111' },
      { name: 'Paper', hex: '#F4F1EA' },
      { name: 'Accent', hex: accent.toUpperCase() },
    ],
    overview:
      item.description ||
      `${title} came to Picarview for a visual direction that could connect their idea with the people it is meant for.`,
    challenge:
      item.challenge ||
      'The brief was to cut through a crowded space with something distinctive, while staying true to who the client already is.',
    approach:
      item.approach ||
      'We started with research and conversation, then distilled the brand down to a few strong visual decisions — and applied them consistently everywhere.',
    outcomes: item.outcomes?.length ? item.outcomes : [
      { title: 'A clear idea', body: 'One strong concept ties every touchpoint together.' },
      { title: 'Consistent everywhere', body: 'Assets work across print, digital and social without losing character.' },
      { title: 'Built to grow', body: 'The system gives the team room to create new work on their own.' },
    ],
    frames: images.slice(1).map((image) => ({
      kind: 'image' as const,
      src: image.imageUrl,
      alt: image.altText || title,
      fit: true,
    })),
  }
}
