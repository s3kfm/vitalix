import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real server layout with isolated authentication and database boundaries.
const source = readFileSync(
  new URL('../app/(authenticated)/(workspace)/layout.tsx', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function layoutFor({ user, patients = [], databaseError }) {
  const lookups = [];
  const exports = {};
  const dependencies = {
    'react/jsx-runtime': {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    'next/navigation': {
      redirect: (path) => {
        throw new Error(`redirect:${path}`);
      },
    },
    '@/src/lib/auth/session': { currentUser: async () => user },
    '@/src/db/patient': {
      listPatients: async (id) => {
        lookups.push(id);
        if (databaseError) throw databaseError;
        return patients;
      },
    },
    '@/src/context/HealthRecordsContext': { HealthRecordsProvider: 'HealthRecordsProvider' },
    '@/src/components/assistant/AssistantBubble': { AssistantBubble: 'AssistantBubble' },
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return { render: exports.default, lookups };
}

test('signed-out visitors go to login without reading patient records', async () => {
  const { render, lookups } = layoutFor({ user: null });
  await assert.rejects(render({ children: 'dashboard' }), /redirect:\/login/);
  assert.deepEqual(lookups, []);
});

test('an account with no patients is redirected to enrollment on the server', async () => {
  const { render, lookups } = layoutFor({ user: { id: 'account-a' } });
  await assert.rejects(render({ children: 'dashboard' }), /redirect:\/enroll/);
  assert.deepEqual(lookups, ['account-a']);
});

test('an account with a patient can render its workspace', async () => {
  const { render } = layoutFor({ user: { id: 'account-a' }, patients: [{ id: 'patient-a' }] });
  const result = await render({ children: 'dashboard' });
  assert.equal(result.props.children[0], 'dashboard');
});

test('a failed patient lookup is not treated as an empty account', async () => {
  const { render } = layoutFor({
    user: { id: 'account-a' },
    databaseError: new Error('Database unavailable'),
  });
  await assert.rejects(render({ children: 'dashboard' }), /Database unavailable/);
});
