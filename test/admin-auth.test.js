import assert from 'node:assert/strict';
import test from 'node:test';
import { secureCompare } from '../src/services/admin-auth.js';

test('aceita credenciais idênticas', () => {
  assert.equal(secureCompare('senha-simples', 'senha-simples'), true);
});

test('recusa credenciais incorretas ou vazias', () => {
  assert.equal(secureCompare('senha-errada', 'senha-simples'), false);
  assert.equal(secureCompare('', 'senha-simples'), false);
  assert.equal(secureCompare(undefined, 'senha-simples'), false);
});
