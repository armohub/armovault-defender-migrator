// Small synthetic knowledge base used by unit tests (independent of the real content library).
export const kb = {
  meta: { version: 'test-kb' },
  questions: [
    { id: 'q_auto', text: 'Do you use automation rules?' },
    { id: 'q_multi', text: 'Is more than one workspace in scope?' },
    { id: 'q_itsm', text: 'Do you integrate with ITSM?' },
  ],
  checks: [
    { id: 'P-1', stage: 'prepare', criticality: 'critical', title: 'Always applies', applicability: null, order: 1 },
    { id: 'P-2', stage: 'prepare', criticality: 'high', title: 'Automation', applicability: { q: 'q_auto' }, order: 2 },
    { id: 'P-3', stage: 'prepare', criticality: 'medium', title: 'Multi or ITSM', applicability: { any: [{ q: 'q_multi' }, { q: 'q_itsm' }] }, order: 3 },
    { id: 'P-4', stage: 'prepare', criticality: 'low', title: 'Single only', applicability: { not: { q: 'q_multi' } }, order: 4 },
    { id: 'T-1', stage: 'transition', criticality: 'critical', title: 'Do the thing', applicability: null, dependsOn: ['P-1', 'P-2'], order: 1 },
  ],
};
