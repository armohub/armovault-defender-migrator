// Markup vocabulary shared by the content, the renderer (src/ui/rich.js) and the validator.
//   **bold**
//   [[ITEM-ID]] or [[ITEM-ID|label]]   link to another guided step (shown with its title)
//   [[go:TARGET|label]]                link to a page of the app
//   [[do:ACTION|label]]                a button that does the thing right on the step page
// The full writing rules live in docs/content-style-guide.md.

export const GO_TARGETS = {
  project: '#/project',
  window: '#/project/window',
  environments: '#/project/environments',
  owners: '#/project/owners',
  questionnaire: '#/questionnaire',
  answers: '#/answers',
  overview: '#/overview',
  'stage:prepare': '#/stage/prepare',
  'stage:test': '#/stage/test',
  'stage:transition': '#/stage/transition',
  'stage:validate': '#/stage/validate',
  register: '#/register',
  evidence: '#/evidence',
  reports: '#/reports',
  'report:prepare': '#/report/prepare',
  'report:test': '#/report/test',
  'report:transition': '#/report/transition',
  'report:validate': '#/report/validate',
  'report:final': '#/report/final',
  'knowledge:changes': '#/knowledge/changes',
  'knowledge:portal': '#/knowledge/portal',
  'knowledge:dates': '#/knowledge/dates',
  'knowledge:terms': '#/knowledge/terms',
  'knowledge:sources': '#/knowledge/sources',
  settings: '#/settings',
  about: '#/about',
};

// Actions are only available on a step page, because they act on that step.
export const DO_ACTIONS = {
  'add-decision': 'Opens a new decision in the register, linked to this step',
  'add-risk': 'Opens a new risk in the register, linked to this step',
  'add-issue': 'Opens a new issue in the register, linked to this step',
  'add-action': 'Opens a new action in the register, linked to this step',
  'add-exception': 'Opens a new exception (risk acceptance) in the register, linked to this step',
  'add-note': 'Adds an observation note as evidence on this step',
  'add-screenshot': 'Attaches a screenshot as evidence on this step',
  'add-file': 'Attaches a file (CSV, JSON, PDF, text) as evidence on this step',
  'add-link': 'Adds a link as evidence on this step',
  'set-owner': 'Moves focus to the Owner field of this step',
  'set-due': 'Moves focus to the Due date field of this step',
  'write-notes': 'Moves focus to the Notes field of this step',
  'record-gate': 'Moves focus to the gate decision form (gate steps only)',
  'open-tool': 'Moves to the "Do it here" form of this step (steps with a tool only)',
  'waive-evidence': 'Records that this step needs no evidence, with a reason',
  'save-snapshot': 'Saves a snapshot of this stage\'s report right away',
  'import-inventory': 'Opens the import of the inventory script results',
  'download-inventory-script': 'Downloads the read-only inventory script',
};

export const MARKUP_TOKEN = /\*\*([^*]+)\*\*|\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g;
export const ITEM_ID = /\b(?:PREP|TEST|TRN|VAL)-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/;
