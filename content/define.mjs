// Helpers for authoring knowledge objects. Keeps content files readable and fills safe defaults.
export const VERIFIED = '2026-10-19';

export function k(o) {
  return {
    version: 1,
    kind: 'check', // check | task | decision | gate
    provenance: 'official', // official = derived from Microsoft documentation; practice = ArMoHub practical guidance (not a Microsoft requirement)
    confidence: 'high',
    validation: 'docs-verified', // docs-verified | needs-review (sources conflict or are ambiguous)
    lastVerified: VERIFIED,
    applicability: null,
    applicabilityNote: '',
    dependsOn: [],
    roles: [],
    prerequisites: [],
    where: [],
    when: '',
    steps: [],
    snippets: [],
    expected: '',
    interpret: [],
    record: [],
    evidence: [],
    remediation: [],
    rollback: [],
    caveats: [],
    practiceNotes: [],
    sources: [],
    testable: false,
    changesState: false,
    ...o,
  };
}

export const src = (id, supports) => ({ id, supports });
export const q = (id) => ({ q: id });
export const any = (...rules) => ({ any: rules });
export const all = (...rules) => ({ all: rules });
export const not = (rule) => ({ not: rule });
export const at = (portal, path) => ({ portal, path });
export const outcome = (outcome, meaning) => ({ outcome, meaning });
