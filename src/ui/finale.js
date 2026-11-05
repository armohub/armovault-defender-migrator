// The moment the move is done: when the change is recorded as complete, a celebration thanks the people who did
// it, shows the route from the Azure portal to the Defender portal, and points to the makers and the community.
// Shown once per project in a session. Reduced motion shows it without animation.
import { h, celebrate, externalLink } from './dom.js';
import { state } from '../app/store.js';
import { BRAND } from '../brand.js';
import { go } from './shell.js';

const shown = new Set();

export const migrationComplete = (p) => !!(p && p.gates['TRN-17'] && ['complete', 'complete_with_exceptions'].includes(p.gates['TRN-17'].decision));

export async function celebrateMigration() {
  const p = state.project;
  if (!p || shown.has(p.id)) return;
  shown.add(p.id);
  const link = (url, text) => externalLink(url, text, { title: `${text} on LinkedIn (opens in a new tab, needs internet)` });
  const route = h('div', { class: 'finale-route', 'aria-hidden': 'true' },
    h('span', { class: 'finale-stop' }, 'Azure portal'),
    h('span', { class: 'finale-line' }, h('span', { class: 'finale-fill' }), h('span', { class: 'finale-dot' })),
    h('span', { class: 'finale-stop to' }, 'Defender portal'));
  const makers = BRAND.makers.filter((m) => m.profileUrl);
  const credits = h('div', { class: 'finale-credits' },
    h('p', null, 'Made by ', ...makers.flatMap((m, i) => [i ? ' and ' : '', link(m.profileUrl, m.name)]), '.'),
    BRAND.community ? h('p', null, 'Join the ', link(BRAND.community.url, `${BRAND.community.name} community`), ' on LinkedIn.') : null);
  const choice = await celebrate({
    title: 'You are in the Defender portal!',
    text: `Congratulations: you have successfully migrated with the ${BRAND.productName}. Consider sharing your appreciation or feedback with the community. We hope it was a good help.`,
    milestone: true,
    grand: true,
    extra: h('div', { class: 'finale-extra' }, route, credits),
    actions: [{ label: 'Stay here', value: 'stay' }, { label: 'Next: validate everything', kind: 'primary', value: 'next' }],
  });
  if (choice === 'next') go('#/stage/validate');
}
