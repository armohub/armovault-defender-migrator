// The end of the move: when the sign-off is recorded, the last step, a celebration thanks the people who did it,
// shows the route from the Azure portal to the Defender portal, points to the makers and the community, and leads
// to the final report. The change being complete (TRN-17) gets a smaller milestone on the way, with validation
// still ahead. Reduced motion shows both without animation.
import { h, celebrate, externalLink } from './dom.js';
import { state } from '../app/store.js';
import { BRAND } from '../brand.js';
import { go, nudgeSave } from './shell.js';

export async function celebrateMigration() {
  const p = state.project;
  if (!p) return;
  const withRisks = !!(p.gates['VAL-18'] && p.gates['VAL-18'].decision === 'signed_off_with_risks');
  const link = (url, text) => externalLink(url, text, { title: `${text} on LinkedIn (opens in a new tab, needs internet)` });
  const route = h('div', { class: 'finale-route', 'aria-hidden': 'true' },
    h('span', { class: 'finale-stop' }, 'Azure portal'),
    h('span', { class: 'finale-line' }, h('span', { class: 'finale-fill' }), h('span', { class: 'finale-dot' })),
    h('span', { class: 'finale-stop to' }, 'Defender portal'));
  const makers = BRAND.makers.filter((m) => m.profileUrl);
  const credits = h('div', { class: 'finale-credits' },
    h('p', null, 'Made by ', ...makers.flatMap((m, i) => [i ? ' and ' : '', link(m.profileUrl, m.name)]), '.'),
    BRAND.community ? h('p', null, 'Join the ', link(BRAND.community.url, `${BRAND.community.name} community`), ' on LinkedIn.') : null);
  const keep = h('p', { class: 'finale-keep' }, `Keep the final report and the project package with your change records${p.isDemo ? '' : ', and save the package now'}.`);
  const choice = await celebrate({
    title: 'You are in the Defender portal!',
    text: `Congratulations: the move is signed off${withRisks ? ', with the remaining risks accepted' : ''}, and you have successfully migrated with the ${BRAND.productName}. Consider sharing your appreciation or feedback with the community. We hope it was a good help.`,
    milestone: true,
    grand: true,
    extra: h('div', { class: 'finale-extra' }, route, credits, keep),
    actions: [{ label: 'Stay here', value: 'stay' }, { label: 'Open the final report', kind: 'primary', value: 'report' }],
  });
  if (choice === 'report') go('#/report/final');
}

// The change is complete: a milestone, with one stage left before the sign-off.
export async function celebrateChangeComplete() {
  const choice = await celebrate({
    title: 'The change is complete',
    text: 'One stage is left: check that everything works in the Defender portal, then sign off the move.',
    milestone: true,
    actions: [{ label: 'Stay here', value: 'stay' }, { label: 'Next: validate everything', kind: 'primary', value: 'next' }],
  });
  if (choice === 'next') go('#/stage/validate');
  nudgeSave('The change is complete.');
}
