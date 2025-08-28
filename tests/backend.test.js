const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Ticketing System Backend API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ticketing_system_test', { autoIndex: true });
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('General', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Solo Role', () => {
    let soloToken;
    it('should register solo user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Solo User',
          registrationNumber: 'SOLO001',
          yearOfStudy: '2',
          phoneNumber: '1111111111',
          email: 'solo@example.com',
          residenceType: 'Hosteller',
          password: 'Solo@1234',
        });
      expect(res.statusCode).toBe(201);
    });
    it('should verify solo user email (simulate)', async () => {
      await mongoose.connection.collection('users').updateOne(
        { email: 'solo@example.com' },
        { $set: { isEmailVerified: true } }
      );
    });
    it('should login solo user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'solo@example.com', password: 'Solo@1234' });
      expect(res.statusCode).toBe(200);
      soloToken = res.body.token;
    });
    it('should access solo dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/solo')
        .set('Authorization', `Bearer ${soloToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('teams');
    });
    it('should not access leader dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/leader')
        .set('Authorization', `Bearer ${soloToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Leader & Member Role', () => {
    let leaderToken, memberToken, teamId;
    it('should register leader user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Leader User',
          registrationNumber: 'LEAD001',
          yearOfStudy: '3',
          phoneNumber: '2222222222',
          email: 'leader@example.com',
          residenceType: 'Day Scholar',
          password: 'Leader@1234',
        });
      expect(res.statusCode).toBe(201);
    });
    it('should verify leader email (simulate)', async () => {
      await mongoose.connection.collection('users').updateOne(
        { email: 'leader@example.com' },
        { $set: { isEmailVerified: true } }
      );
    });
    it('should login leader user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'leader@example.com', password: 'Leader@1234' });
      expect(res.statusCode).toBe(200);
      leaderToken = res.body.token;
    });
    it('should register a team with leader and member', async () => {
      const res = await request(app)
        .post('/api/register/team')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          teamName: 'Team Alpha',
          leader: {
            name: 'Leader User',
            registrationNumber: 'LEAD001',
            yearOfStudy: '3',
            phoneNumber: '2222222222',
            email: 'leader@example.com',
            residenceType: 'Day Scholar',
          },
          members: [
            {
              name: 'Member User',
              registrationNumber: 'MEM001',
              yearOfStudy: '2',
              phoneNumber: '3333333333',
              email: 'member@example.com',
              residenceType: 'Hosteller',
              password: 'Member@1234',
            },
          ],
        });
      expect(res.statusCode).toBe(201);
      teamId = res.body.teamId;
    });
    it('should verify member email (simulate)', async () => {
      await mongoose.connection.collection('users').updateOne(
        { email: 'member@example.com' },
        { $set: { isEmailVerified: true } }
      );
    });
    it('should login member user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'member@example.com', password: 'Member@1234' });
      expect(res.statusCode).toBe(200);
      memberToken = res.body.token;
    });
    it('leader should access leader dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/leader')
        .set('Authorization', `Bearer ${leaderToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('team');
    });
    it('member should access member dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/member')
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('team');
    });
    it('member should not access organizer dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/organizer')
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Organizer Role', () => {
    let organizerToken;
    it('should create organizer (admin)', async () => {
      const res = await request(app)
        .post('/api/auth/create-organizer')
        .send({
          name: 'Organizer',
          email: 'organizer@example.com',
          password: 'Organizer@1234',
          secret: process.env.ORGANIZER_SECRET || 'testsecret',
        });
      expect([201, 409]).toContain(res.statusCode); // 409 if already exists
    });
    it('should verify organizer email (simulate)', async () => {
      await mongoose.connection.collection('users').updateOne(
        { email: 'organizer@example.com' },
        { $set: { isEmailVerified: true } }
      );
    });
    it('should login organizer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'organizer@example.com', password: 'Organizer@1234' });
      expect(res.statusCode).toBe(200);
      organizerToken = res.body.token;
    });
    it('organizer should access organizer dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('teams');
      expect(res.body).toHaveProperty('solos');
      expect(res.body).toHaveProperty('paymentsSummary');
    });
    it('organizer should access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/teams')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('teams');
    });
    it('organizer should not allow access to admin endpoints without token', async () => {
      const res = await request(app)
        .get('/api/admin/teams');
      expect(res.statusCode).toBe(401);
    });
  });
});
