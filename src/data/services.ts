/**
 * Picarview's service pillars, shared by the homepage and the /services page.
 */
export interface ServicePillar {
  title: string
  number: string
  statement: string
  offerings: string[]
  accent: string
}

export const servicePillars: ServicePillar[] = [
  {
    title: 'Discovery',
    number: '01',
    statement: 'Uncovering the creative opportunity.',
    offerings: [
      'Creative Idea Development',
      'Visual & Identity Exploration',
      'Creative Direction Alignment',
      'Creative Discovery Workshops',
    ],
    accent: '#ffb000',
  },
  {
    title: 'Strategy',
    number: '02',
    statement: 'Giving every creative decision a purpose.',
    offerings: [
      'Campaign Planning',
      'Concept Development',
      'Brand & Audience Research',
      'Creative Strategy & Insights',
    ],
    accent: '#b9ff32',
  },
  {
    title: 'Innovation',
    number: '03',
    statement: 'Building new ideas into tangible experiences.',
    offerings: [
      'Creative Innovation',
      'Product Development',
      'Creative Concept Development',
      'Picture & Art Development',
    ],
    accent: '#ff4fa3',
  },
  {
    title: 'Expression',
    number: '04',
    statement: 'Turning strategy into work people can feel.',
    offerings: [
      'Creative Design',
      'Brand Expression',
      'Photography & Videography',
      'Visual Art & Experimental Content',
    ],
    accent: '#22d9ee',
  },
]

/** Words for the scrolling service ticker at the top of /services. */
export const serviceTicker = [
  'Brand Identity',
  'Art Direction',
  'Campaigns',
  'Photography',
  'Videography',
  'Creative Strategy',
  'Logo Design',
  'Packaging',
  'Event Branding',
  'Editorial Design',
  'Social Content',
  'Visual Art',
]
