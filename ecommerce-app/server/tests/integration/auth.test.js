/**
 * INTEGRATION TESTS — TC-I-01 .. TC-I-14
 * Under test: the /api/auth routes end to end — router, validation chain,
 * controller, model and database together, exercised over real HTTP.
 */
const { app, request, createUser, auth } = require('../helpers');
const User = require('../../src/models/User');

const validRegistration = {
  name: 'Kailash Kumar Jha',
  email: 'kailash@example.com',
  password: 'Passw0rd!',
};

describe('POST /api/auth/register', () => {
  test('TC-I-01 creates an account and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('kailash@example.com');
    expect(res.body.data.user.role).toBe('customer');
  });

  test('TC-I-02 never returns the password hash in the response body', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration);

    expect(res.body.data.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('Passw0rd!');
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
  });

  test('TC-I-03 refuses a duplicate email address with 409', async () => {
    await request(app).post('/api/auth/register').send(validRegistration);
    const res = await request(app).post('/api/auth/register').send(validRegistration);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('TC-I-04 rejects a weak password and lists the reason', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validRegistration, password: 'alllowercase' });

    expect(res.status).toBe(422);
    expect(res.body.details.map((d) => d.field)).toContain('password');
  });

  test('TC-I-05 rejects a malformed email address', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validRegistration, email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.details.map((d) => d.field)).toContain('email');
  });

  test('TC-I-06 ignores a role supplied in the body (privilege escalation)', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validRegistration, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');

    const stored = await User.findOne({ email: validRegistration.email });
    expect(stored.role).toBe('customer');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validRegistration);
  });

  test('TC-I-07 signs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: validRegistration.email, password: validRegistration.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('TC-I-08 rejects a wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: validRegistration.email, password: 'Wrongpass1' });

    expect(res.status).toBe(401);
  });

  test('TC-I-09 gives an identical message for unknown email and wrong password', async () => {
    const unknown = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Passw0rd!' });
    const wrong = await request(app).post('/api/auth/login')
      .send({ email: validRegistration.email, password: 'Wrongpass1' });

    // Identical responses prevent an attacker from discovering which email
    // addresses are registered.
    expect(unknown.status).toBe(wrong.status);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  test('TC-I-10 resists a NoSQL operator injection in the credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.data?.token).toBeUndefined();
  });

  test('TC-I-11 refuses a deactivated account with 403', async () => {
    await User.updateOne({ email: validRegistration.email }, { isActive: false });

    const res = await request(app).post('/api/auth/login')
      .send({ email: validRegistration.email, password: validRegistration.password });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('GET /api/auth/me', () => {
  test('TC-I-12 returns the signed-in user for a valid token', async () => {
    const { user, token } = await createUser();
    const res = await request(app).get('/api/auth/me').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  test('TC-I-13 refuses a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('TC-I-14 refuses a tampered token', async () => {
    const { token } = await createUser();
    const tampered = `${token.slice(0, -4)}AAAA`;

    const res = await request(app).get('/api/auth/me').set(auth(tampered));
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid authentication token/i);
  });
});

describe('PATCH /api/auth/me/password', () => {
  test('TC-I-15 changes the password and issues a fresh token', async () => {
    const { user, token } = await createUser();

    const res = await request(app).patch('/api/auth/me/password').set(auth(token))
      .send({ currentPassword: 'Passw0rd!', newPassword: 'NewPassw0rd!' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));

    const login = await request(app).post('/api/auth/login')
      .send({ email: user.email, password: 'NewPassw0rd!' });
    expect(login.status).toBe(200);
  });

  test('TC-I-16 refuses the change when the current password is wrong', async () => {
    const { token } = await createUser();

    const res = await request(app).patch('/api/auth/me/password').set(auth(token))
      .send({ currentPassword: 'Nothexright1', newPassword: 'NewPassw0rd!' });

    expect(res.status).toBe(401);
  });
});
