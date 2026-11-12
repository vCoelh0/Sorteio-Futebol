import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import express from 'express';
import { configureApp } from '../src/app.js';

const state = {
  status: 'DRAWING',
  teams: [],
  startedAt: '2026-11-12T12:00:00.000Z',
  revealAt: '2026-11-12T12:00:07.000Z',
  completedAt: null,
};

test('entrega o estado real e o cliente Socket.IO na tela pública', async () => {
  const app = express();
  configureApp(app, {
    getState: async () => state,
    start: async () => state,
    reset: async () => state,
  });

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const apiResponse = await fetch(`http://127.0.0.1:${port}/api/draw`);
    assert.equal(apiResponse.status, 200);
    assert.deepEqual(await apiResponse.json(), state);

    const pageResponse = await fetch(`http://127.0.0.1:${port}/`);
    const html = await pageResponse.text();
    assert.equal(pageResponse.status, 200);
    assert.match(html, /socket\.io\/socket\.io\.js/);
    assert.match(html, /connection-status/);
    assert.match(html, /liga-futebas-2026\.png/);
    assert.match(html, /participants-list/);

    const scriptResponse = await fetch(`http://127.0.0.1:${port}/app.js`);
    const script = await scriptResponse.text();
    assert.match(script, /const \{ participants \} = await response\.json\(\)/);
    assert.match(script, /renderParticipants\(participants\)/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
