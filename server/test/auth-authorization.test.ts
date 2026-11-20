import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAssignRole, canUseRealtimeEvents, hashToken, isPublicRegistrationRole, loadSecurityConfig } from '../src/config/security';
import { checkRole } from '../src/middleware/rbac';
import { authenticateToken } from '../src/middleware/auth';
import { logout, refresh, register } from '../src/controllers/authController';
import { User } from '../src/models/User';
import { Session } from '../src/models/Session';
import jwt from 'jsonwebtoken';

const validEnv = {
  JWT_SECRET: 'access-secret-that-is-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'refresh-secret-that-is-also-at-least-32-characters'
};

test('security configuration rejects absent, short, and reused secrets', () => {
  assert.throws(() => loadSecurityConfig({}), /JWT_SECRET/);
  assert.throws(() => loadSecurityConfig({ ...validEnv, JWT_SECRET: 'short' }), /at least 32/);
  assert.throws(() => loadSecurityConfig({ JWT_SECRET: validEnv.JWT_SECRET, JWT_REFRESH_SECRET: validEnv.JWT_SECRET }), /different values/);
  assert.equal(loadSecurityConfig(validEnv).accessTokenTtl, '15m');
});

test('public registration permits only the USER role', () => {
  assert.equal(isPublicRegistrationRole(undefined), true);
  assert.equal(isPublicRegistrationRole('USER'), true);
  assert.equal(isPublicRegistrationRole('ADMIN'), false);
  assert.equal(isPublicRegistrationRole('SUPER_ADMIN'), false);
});

test('administrator role assignment follows role hierarchy', () => {
  assert.equal(canAssignRole('ADMIN', 'USER', 'OPERATOR'), true);
  assert.equal(canAssignRole('ADMIN', 'USER', 'ADMIN'), false);
  assert.equal(canAssignRole('ADMIN', 'USER', 'SUPER_ADMIN'), false);
  assert.equal(canAssignRole('ADMIN', 'SUPER_ADMIN'), false);
  assert.equal(canAssignRole('ADMIN', 'ADMIN', 'USER'), false);
  assert.equal(canAssignRole('SUPER_ADMIN', 'USER', 'SUPER_ADMIN'), true);
});

test('real-time access requires an active operator role and valid session', () => {
  assert.equal(canUseRealtimeEvents('OPERATOR', true, true), true);
  assert.equal(canUseRealtimeEvents('USER', true, true), false);
  assert.equal(canUseRealtimeEvents('ADMIN', false, true), false);
  assert.equal(canUseRealtimeEvents('ADMIN', true, false), false);
});

test('RBAC middleware rejects missing and disallowed roles, and allows permitted roles', () => {
  const response: any = { statusCode: 200, body: undefined, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } };
  let passed = false;
  const next = () => { passed = true; };
  const guard = checkRole(['ADMIN', 'SUPER_ADMIN']);

  guard({ user: undefined } as any, response, next as any);
  assert.equal(response.statusCode, 401);
  assert.equal(passed, false);

  response.statusCode = 200;
  guard({ user: { role: 'USER' } } as any, response, next as any);
  assert.equal(response.statusCode, 403);
  assert.equal(passed, false);

  guard({ user: { role: 'ADMIN' } } as any, response, next as any);
  assert.equal(passed, true);
});

test('public registration rejects privileged role requests before touching persistence', async () => {
  const response: any = { statusCode: 200, body: undefined, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } };
  await register({ body: { name: 'Escalation', email: 'person@example.com', password: 'very-secure-password', role: 'SUPER_ADMIN' } } as any, response);
  assert.equal(response.statusCode, 403);
  assert.match(response.body.message, /USER role/);
});

test('protected requests require an active account and a live server-side session', async () => {
  const oldFindById = User.findById;
  const oldSessionExists = Session.exists;
  const oldSecret = process.env.JWT_SECRET;
  const oldRefreshSecret = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_SECRET = validEnv.JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = validEnv.JWT_REFRESH_SECRET;
  try {
    let active = false;
    let sessionExists = true;
    (User as any).findById = () => ({ select: async () => ({ id: 'user-id', email: 'person@example.com', name: 'Person', role: 'OPERATOR', isActive: active }) });
    (Session as any).exists = async () => sessionExists;
    const token = jwt.sign({ id: 'user-id', sid: 'session-id', typ: 'access' }, validEnv.JWT_SECRET, { expiresIn: '1h' });
    const response: any = { statusCode: 200, body: undefined, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } };
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    let passed = false;
    await authenticateToken(req, response, () => { passed = true; });
    assert.equal(response.statusCode, 401);
    assert.equal(passed, false);
    active = true;
    sessionExists = false;
    await authenticateToken(req, response, () => { passed = true; });
    assert.equal(response.statusCode, 401);
    sessionExists = true;
    await authenticateToken(req, response, () => { passed = true; });
    assert.equal(passed, true);
    assert.equal(req.user.role, 'OPERATOR');
  } finally {
    (User as any).findById = oldFindById;
    (Session as any).exists = oldSessionExists;
    if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
    if (oldRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET; else process.env.JWT_REFRESH_SECRET = oldRefreshSecret;
  }
});

test('refresh rotates the stored token hash and rejects reuse of the old token', async () => {
  const oldFindOne = Session.findOne;
  const oldUpdateOne = Session.updateOne;
  const oldFindById = User.findById;
  const oldSecret = process.env.JWT_SECRET;
  const oldRefreshSecret = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_SECRET = validEnv.JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = validEnv.JWT_REFRESH_SECRET;
  const refreshToken = jwt.sign({ id: 'user-id', sid: 'session-id', typ: 'refresh' }, validEnv.JWT_REFRESH_SECRET, { expiresIn: '1h' });
  let currentHash = hashToken(refreshToken);
  (Session as any).findOne = async (query: any) => query.refreshTokenHash === currentHash ? { id: 'session-id', _id: 'session-id' } : null;
  (Session as any).updateOne = async (query: any, update: any) => {
    if (query.refreshTokenHash !== currentHash) return { modifiedCount: 0 };
    currentHash = update.$set.refreshTokenHash;
    return { modifiedCount: 1 };
  };
  (User as any).findById = async () => ({ _id: { toString: () => 'user-id' }, id: 'user-id', email: 'person@example.com', role: 'USER', name: 'Person', isActive: true });
  const invoke = async () => {
    const response: any = { statusCode: 200, body: undefined, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } };
    await refresh({ body: { refreshToken } } as any, response);
    return response;
  };
  try {
    const first = await invoke();
    assert.equal(first.statusCode, 200);
    assert.notEqual(first.body.refreshToken, refreshToken);
    assert.equal(currentHash, hashToken(first.body.refreshToken));
    const replay = await invoke();
    assert.equal(replay.statusCode, 401);
  } finally {
    (Session as any).findOne = oldFindOne;
    (Session as any).updateOne = oldUpdateOne;
    (User as any).findById = oldFindById;
    if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
    if (oldRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET; else process.env.JWT_REFRESH_SECRET = oldRefreshSecret;
  }
});

test('logout revokes the authenticated server-side session', async () => {
  const oldDeleteOne = Session.deleteOne;
  let deletedQuery: any;
  (Session as any).deleteOne = async (query: any) => { deletedQuery = query; return { deletedCount: 1 }; };
  const response: any = { body: undefined, json(body: unknown) { this.body = body; return this; } };
  try {
    await logout({ user: { sessionId: 'session-id' }, body: {} } as any, response);
    assert.deepEqual(deletedQuery, { _id: 'session-id' });
    assert.equal(response.body.success, true);
  } finally {
    (Session as any).deleteOne = oldDeleteOne;
  }
});
