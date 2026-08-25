const test = require('node:test');
const assert = require('node:assert/strict');
const { WorkflowPlanner } = require('../dist/index.js');

const system = (id, status = 'online') => ({ id, name: id, type: 'service', status, lastHeartbeat: 1 });

test('plans without executing external actions', () => {
  const planner = new WorkflowPlanner();
  planner.registerSystem(system('api'));
  const plan = planner.plan({ id: 'deploy-check', steps: [{ id: 'step-1', action: 'health-check', target: 'api' }] });
  assert.equal(plan.executable, false);
  assert.deepEqual(plan.unavailableTargets, []);
});

test('reports unavailable and unknown targets', () => {
  const planner = new WorkflowPlanner();
  planner.registerSystem(system('db', 'maintenance'));
  const plan = planner.plan({
    id: 'readiness',
    steps: [
      { id: 'one', action: 'check', target: 'db' },
      { id: 'two', action: 'check', target: 'missing' },
    ],
  });
  assert.deepEqual(plan.unavailableTargets, ['db', 'missing']);
});

test('rejects duplicate step IDs', () => {
  const planner = new WorkflowPlanner();
  assert.throws(
    () => planner.plan({ id: 'bad', steps: [{ id: 'x', action: 'a', target: 's' }, { id: 'x', action: 'b', target: 's' }] }),
    /duplicate step id/,
  );
});

test('returns deterministic system status', () => {
  const planner = new WorkflowPlanner();
  planner.registerSystem(system('z'));
  planner.registerSystem(system('a', 'offline'));
  const status = planner.status();
  assert.equal(status.total, 2);
  assert.equal(status.online, 1);
  assert.deepEqual(status.systems.map((item) => item.id), ['a', 'z']);
});
