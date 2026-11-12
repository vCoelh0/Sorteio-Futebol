import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mantém o deploy automático condicionado aos testes da main', async () => {
  const blueprint = await readFile(new URL('../render.yaml', import.meta.url), 'utf8');

  assert.match(blueprint, /^\s+branch: main$/m);
  assert.match(blueprint, /^\s+autoDeployTrigger: checksPass$/m);
  assert.match(blueprint, /^\s+buildCommand: npm ci && npm run migrate && npm run seed$/m);
  assert.match(blueprint, /^\s+healthCheckPath: \/api\/health$/m);
  assert.match(blueprint, /key: ADMIN_TOKEN\s+generateValue: true/);
});
