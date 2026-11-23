/**
 * The Picarview team, shown on /about#the-team.
 *
 * NOTE: These are role placeholders. Replace each entry's `name` (and add a
 * `photo` path under /public/images/team/) with real people before launch.
 * Cards with `placeholder: true` show "Profile coming soon" instead of a name.
 */

export interface TeamMember {
  name: string
  role: string
  /** Optional portrait, e.g. '/images/team/ama.webp' (4:5, ~800px wide). */
  photo?: string
  /** Shown on the card's polaroid tile when there is no photo. */
  initial: string
  accent: string
  placeholder?: boolean
}

export const team: TeamMember[] = [
  { name: 'Founder', role: 'Founder & Creative Director', initial: 'F', accent: '#ffb000', placeholder: true },
  { name: 'Art Director', role: 'Art Director', initial: 'A', accent: '#b9ff32', placeholder: true },
  { name: 'Brand Designer', role: 'Senior Brand Designer', initial: 'B', accent: '#ff4fa3', placeholder: true },
  { name: 'Photographer', role: 'Photographer & Videographer', initial: 'P', accent: '#22d9ee', placeholder: true },
  { name: 'Strategist', role: 'Creative Strategist', initial: 'S', accent: '#ff7a1a', placeholder: true },
  { name: 'Studio Manager', role: 'Studio & Project Manager', initial: 'M', accent: '#c9a15b', placeholder: true },
]

export const principles = [
  {
    title: 'We keep it clear.',
    body: 'You have a business to run. Bring us the brief and we take it from there, with a simple process, honest timelines and no jargon. You always know what is happening and why.',
  },
  {
    title: 'We sweat the details.',
    body: 'Every kerning pair, crop and colour is a decision. We would rather take one more pass than ship something we are not proud of, because the work carries your name and ours.',
  },
  {
    title: 'We make it enjoyable.',
    body: 'Creative work should feel exciting, not exhausting. We become an extension of your team, bring energy to every session, and make the process something you look forward to.',
  },
]
