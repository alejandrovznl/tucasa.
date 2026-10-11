import ts from 'typescript';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const dir = mkdtempSync(join(tmpdir(), 'tucasa-public-beta-'));
async function load(name) {
  const source = readFileSync(new URL(`../../lib/${name}.ts`, import.meta.url), 'utf8').replace("from 'zod'", `from '${pathToFileURL(require.resolve('zod')).href}'`);
  const file = join(dir, `${name}.mjs`);
  writeFileSync(file, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
  return import(pathToFileURL(file));
}
function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
try {
  const beta = await load('beta-workspace');
  const firstBrowser = storage(), otherBrowser = storage();
  assert.equal(beta.readBetaSession(firstBrowser), null);
  const first = beta.startBetaSession(firstBrowser, '  Ana Rojas  ', 'Independiente');
  assert.equal(first.name, 'Ana Rojas'); assert.equal(first.company, 'Independiente');
  assert.equal(beta.readBetaSession(firstBrowser).id, first.id);
  const firstWorkspace = beta.readBetaWorkspace(firstBrowser, first);
  assert.equal(firstWorkspace.profile.advisor, 'Ana Rojas'); assert.equal(firstWorkspace.favorites.length, 0);
  firstWorkspace.favorites.push({ id: 'class-property', title: 'Selección de Ana' });
  beta.writeBetaWorkspace(firstBrowser, first, firstWorkspace);
  beta.rememberBetaSearch(firstBrowser, first, { id: 'search-one', filters: { type: 'casa' }, properties: [{ id: 'class-property' }], createdAt: new Date().toISOString() });
  assert.equal(beta.readBetaWorkspace(firstBrowser, first).favorites[0].id, 'class-property');
  assert.equal(beta.readBetaWorkspace(firstBrowser, first).history[0].count, 1);
  beta.endBetaSession(firstBrowser); assert.equal(beta.readBetaSession(firstBrowser), null);
  const returning = beta.startBetaSession(firstBrowser, 'Ana Rojas', 'Independiente');
  assert.equal(returning.id, first.id); assert.equal(beta.readBetaWorkspace(firstBrowser, returning).favorites.length, 1);
  beta.endBetaSession(firstBrowser);
  const returningWithUsername = beta.startBetaSession(firstBrowser, 'ana rojas');
  assert.equal(returningWithUsername.id, first.id); assert.equal(returningWithUsername.company, 'Independiente');
  assert.equal(beta.readBetaWorkspace(firstBrowser, returningWithUsername).favorites.length, 1);
  const sameNameElsewhere = beta.startBetaSession(otherBrowser, 'Ana Rojas', 'Independiente');
  assert.notEqual(sameNameElsewhere.id, first.id); assert.equal(beta.readBetaWorkspace(otherBrowser, sameNameElsewhere).favorites.length, 0);
  const another = beta.startBetaSession(firstBrowser, 'Juan Soto', 'RE/MAX');
  assert.notEqual(another.id, first.id); assert.equal(beta.readBetaWorkspace(firstBrowser, another).history.length, 0);
  const usernameOnly = beta.startBetaSession(otherBrowser, 'usuario de prueba');
  assert.equal(usernameOnly.name, 'usuario de prueba'); assert.equal(usernameOnly.company, 'Mi inmobiliaria');
  assert.throws(() => beta.startBetaSession(firstBrowser, ' ', 'Independiente'));

  const contacts = await load('publication-contacts');
  const deber = Array.from({ length: 6 }, (_, i) => contacts.samplePublicationContact('deber', i));
  assert.ok(deber.every(contact => contact.phone)); assert.ok(deber.some(contact => !contact.name) && deber.some(contact => contact.name));
  const facebook = Array.from({ length: 6 }, (_, i) => contacts.samplePublicationContact('marketplace', i));
  assert.ok(facebook.every(contact => contact.name && contact.messengerDemo && !contact.messengerUrl));
  assert.ok(facebook.some(contact => contact.phone) && facebook.some(contact => !contact.phone));
  assert.equal(contacts.samplePublicationContact('century', 0), undefined);
  for (const messengerUrl of ['javascript:alert(1)', 'https://m.me.evil.example/person', 'https://m.me@evil.example/person', 'http://m.me/person', 'https://facebook.com/person']) assert.equal(contacts.validatedMessengerUrl({ messengerUrl }), null);
  assert.equal(contacts.validatedMessengerUrl({ messengerUrl: 'https://m.me/verified-source-page' }), 'https://m.me/verified-source-page');
  console.log('PASS: demo entry, logout, browser persistence and isolation, publisher name/phone variation, no fabricated Messenger destinations.');
} finally { rmSync(dir, { recursive: true, force: true }); }
