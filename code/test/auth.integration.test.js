import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('register', () => {
  test('should return 200 and a success message when all fields are provided correctly', async () => {
    const response = await request(app)
          .post('/api/register')
          .send({ username: 'Mario', email: 'mario.red@email.com', password: 'securePass' });
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: { message: 'User added successfully' } });
  });

  test('should return 400 if any required field is missing (email)', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'Mario', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email'\ field cannot be empty." });
  });

test('should return 400 if any required field is missing (username)', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ email: 'mario.red@email.com', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'username'\ field cannot be empty." });
  });

test('should return 400 if any required field is missing (password)', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'Mario', email: 'mario.red@email.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'password'\ field cannot be empty." });
  });

test('should return 400 if any required field is an empty string (username)', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: ' ', email: 'mario.red@email.com', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'username\' field cannot be empty." });
  });

test('should return 400 if any required field is an empty string (email)', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'Mario', email: ' ', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
  });

test('should return 400 if any required field is an empty string (password)', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'Mario', email: 'mario.red@email.com', password: ' ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'password\' field cannot be empty." });
  });

test('should return 400 if the email is not in a valid format', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'Mario', email: 'invalid-email', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Wrong email format.' });
  });

  test('should return 400 if the username is already taken', async () => {  
    const response = await request(app)
      .post('/api/register')
      .send({ username: 'Mario', email: 'mario2.red@email.com', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'An user with that username already exists.' });
  });

  test('should return 400 if the email is already registered', async () => {
    const response = await request(app)
        .post('/api/register')
        .send({ username: 'Luca', email: 'mario.red@email.com', password: 'securePass' });
  

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'You are already registered.' });
  });
});

describe("registerAdmin", () => { 
  test('should return 200 and a success message when all fields are provided correctly', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: "admin", email: "admin@email.com", password: 'securePass' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { message: 'Admin added successfully' } });
  });

  test('should return 400 if any required field is missing (email)', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: 'admin', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email'\ field cannot be empty." });
  });

test('should return 400 if any required field is missing (username)', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ email: 'admin@email.com', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'username'\ field cannot be empty." });
  });

test('should return 400 if any required field is missing (password)', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: 'admin', email: 'admin@email.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'password'\ field cannot be empty." });
  });

test('should return 400 if any required field is an empty string (username)', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: ' ', email: 'admin@email.com', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'username\' field cannot be empty." });
  });

test('should return 400 if any required field is an empty string (email)', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: 'admin', email: ' ', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
  });

test('should return 400 if any required field is an empty string (password)', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: 'admin', email: 'admin@email.com', password: ' ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'password\' field cannot be empty." });
  });

test('should return 400 if the email is not in a valid format', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: 'admin', email: 'invalid-email', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Wrong email format.' });
  });

  test('should return 400 if the email is already registered', async () => {
    const response = await request(app)
        .post('/api/admin')
        .send({ username: 'admin2', email: 'admin@email.com', password: 'securePass' });
  
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'You are already registered.' });
  });

test('should return 400 if the username is already taken', async () => {
    const response = await request(app)
      .post('/api/admin')
      .send({ username: 'admin', email: 'admin2@email.com', password: 'securePass' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'An user with that username already exists.' });
  });
})

describe('login', () => { 
  test('should return 200 and tokens if login is successful', async () => {
    const requestBody = { email: 'mario.red@email.com', password: 'securePass' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data.accessToken');
    expect(response.body).toHaveProperty('data.refreshToken');
  });

  test('should return 400 if any required field is missing (email)', async () => {
    const requestBody = { password: 'securePass' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
  });

  test('should return 400 if any required field is missing (password)', async () => {
    const requestBody = { email: 'mario.red@email.com' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'password\' field cannot be empty." });
  });

  test('should return 400 if any required field is an empty string (email)', async () => {
    const requestBody = { email: ' ', password: 'securePass' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
  });

  test('should return 400 if any required field is an empty string (password)', async () => {
    const requestBody = { email: 'mario.red@email.com', password: ' ' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'password\' field cannot be empty." });
  });

  test('should return 400 if the email is not in a valid format', async () => {
    const requestBody = { email: 'invalid-email', password: 'securePass' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Wrong email format." });
  });

  test('should return 400 if the email in the request body does not identify a user in the database', async () => {
    const requestBody = { email: 'mario2.red@email.com', password: 'securePass' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Please you need to register." });
  });

  test('should return 400 if the supplied password does not match with the one in the database', async () => {
    const requestBody = { email: 'mario.red@email.com', password: 'securePass2' };

    const response = await request(app)
      .post('/api/login')
      .send(requestBody);
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Wrong credentials." });
  });
});

describe('logout', () => { 
  test('should return 200 and message if logout is successful', async () => {
    const user = await User.findOne({email: "mario.red@email.com"});

    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', `refreshToken=${user.refreshToken};accessToken=${user.accessToken}`)
      .send();
      
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data:{ message: "Successfully logged out." }});
  });

  test('should return 400 error if the request does not have a refresh token in the cookies', async () => {
    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', 'accessToken=acceToken')
      .send();
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User's refreshToken not found." });
  });

  test("should return 400 error if the refresh token in the request's cookies does not represent a user in the database", async () => {
    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', 'refreshToken=refrToken; accessToken=acceToken')
      .send();
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User not found in db." });
  });
});
