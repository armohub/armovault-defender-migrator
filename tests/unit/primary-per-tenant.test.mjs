// Several workspaces: one planned primary per tenant, every other workspace of the tenant is secondary.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kb } from './fixtures.mjs';
import { KB } from '../../content/kb.mjs';
import { createProject, setEnvironments, setPlannedPrimary, plannedPrimaryOf, plannedRole } from '../../src/core/model.js';
import { validateProject } from '../../src/core/schema.js';
import { buildReportModel } from '../../src/core/report.js';

const four = [{ alias: 'PROD-1', kind: 'production' }, { alias: 'PROD-2', kind: 'production' }, { alias: 'PROD-3', kind: 'production' }, { alias: 'PROD-4', kind: 'production' }];

test('several production workspaces in one tenant: one primary, the rest secondary', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setEnvironments(p, four);
  assert.deepEqual(p.meta.environments.map((e) => plannedRole(p, e)), ['', '', '', ''], 'no roles before a primary is chosen');
  setPlannedPrimary(p, '', 'PROD-2');
  assert.deepEqual(p.meta.environments.map((e) => plannedRole(p, e)), ['secondary', 'primary', 'secondary', 'secondary']);
  assert.ok(p.audit.some((a) => a.action === 'project.primary' && /PROD-2/.test(a.summary || a.detail || JSON.stringify(a))));
});

test('with tenants, each tenant has its own primary', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setEnvironments(p, [{ alias: 'EU-1', tenant: 'EU' }, { alias: 'EU-2', tenant: 'EU' }, { alias: 'US-1', tenant: 'US' }]);
  setPlannedPrimary(p, 'EU', 'EU-2');
  setPlannedPrimary(p, 'US', 'US-1');
  assert.equal(plannedPrimaryOf(p, 'EU'), 'EU-2');
  assert.equal(plannedPrimaryOf(p, 'US'), 'US-1');
  assert.deepEqual(p.meta.environments.map((e) => plannedRole(p, e)), ['secondary', 'primary', 'primary']);
  setPlannedPrimary(p, 'US', '');
  assert.equal(plannedRole(p, p.meta.environments[2]), '', 'clearing a tenant leaves its workspace without a role');
});

test('a primary chosen before tenants were entered still counts for its tenant', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setEnvironments(p, [{ alias: 'A' }, { alias: 'B' }]);
  setPlannedPrimary(p, '', 'A');
  setEnvironments(p, [{ alias: 'A', tenant: 'EU' }, { alias: 'B', tenant: 'EU' }]);
  assert.equal(plannedPrimaryOf(p, 'EU'), 'A');
  setPlannedPrimary(p, 'EU', 'B');
  assert.equal(p.meta.plannedPrimary, '', 'the old single choice is replaced, not left behind');
  assert.equal(plannedPrimaryOf(p, 'EU'), 'B');
});

test('planned roles reach the report and survive import', () => {
  const p = createProject({ meta: { operatorName: 'Sam' } });
  setEnvironments(p, [{ alias: 'EU-1', tenant: 'EU' }, { alias: 'EU-2', tenant: 'EU' }]);
  setPlannedPrimary(p, 'EU', 'EU-1');
  const m = buildReportModel('prepare', KB, p, { appVersion: 't' });
  assert.deepEqual(m.project.environments.map((e) => e.plannedRole), ['primary', 'secondary']);
  const raw = JSON.parse(JSON.stringify(p));
  raw.meta.plannedPrimaries.__proto__ = 'x';
  raw.meta.plannedPrimaries[''] = 'empty tenant key';
  raw.meta.plannedPrimaries.US = 42;
  const q = validateProject(raw, { kb }).project;
  assert.deepEqual(q.meta.plannedPrimaries, { EU: 'EU-1', US: '42' });
});
