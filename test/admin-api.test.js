import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import express from 'express';

process.env.ADMIN_PASSWORD = 'senha-de-teste';
process.env.ADMIN_TOKEN = 'token-de-teste';

const { configureApp } = await import('../src/app.js');
const idleState = { status: 'IDLE', teams: [] };

test('faz login e protege a sessão administrativa', async () => {
  let drawCalls = 0;
  let resetCalls = 0;
  const app = express();
  configureApp(app, {
    getState: async () => idleState,
    start: async () => { drawCalls += 1; return { status: 'DRAWING', teams: [] }; },
    reset: async () => { resetCalls += 1; return idleState; },
  });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const denied = await fetch(`${baseUrl}/api/admin/session`);
    assert.equal(denied.status, 401);

    const wrongLogin = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'incorreta' }),
    });
    assert.equal(wrongLogin.status, 401);

    const login = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'senha-de-teste' }),
    });
    assert.equal(login.status, 200);
    assert.deepEqual(await login.json(), { token: 'token-de-teste' });

    const session = await fetch(`${baseUrl}/api/admin/session`, {
      headers: { authorization: 'Bearer token-de-teste' },
    });
    assert.equal(session.status, 200);
    assert.deepEqual(await session.json(), { authenticated: true });

    const deniedDraw = await fetch(`${baseUrl}/api/admin/draw`, { method: 'POST' });
    assert.equal(deniedDraw.status, 401);

    const authorizedDraw = await fetch(`${baseUrl}/api/admin/draw`, {
      method: 'POST', headers: { authorization: 'Bearer token-de-teste' },
    });
    assert.equal(authorizedDraw.status, 202);
    assert.equal(drawCalls, 1);

    const authorizedReset = await fetch(`${baseUrl}/api/admin/reset`, {
      method: 'POST', headers: { authorization: 'Bearer token-de-teste' },
    });
    assert.equal(authorizedReset.status, 200);
    assert.equal(resetCalls, 1);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
