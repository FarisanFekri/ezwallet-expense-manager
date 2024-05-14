import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import {mongo} from 'mongoose';

jest.mock("bcryptjs")
jest.mock('../models/User.js');

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

    test('should return 400 if the email is already registered', async () => {
        /*const response = await request(app) //email già presente nel db
          .post('/api/register')
          .send({ username: 'Mario', email: 'mario@example.com', password: 'securePass' });*/
        
        //User.findOne.mockResolvedValue(true); // Configura il mock per restituire sempre true
    
        User.findOne = jest.fn().mockImplementation((query) => {
            if (query.email === 'mario.red@email.com') {
              return Promise.resolve(true); // Simulate existing user with the same username
            }
            return Promise.resolve(false); //in caso si puo provare a sostituire il comportamento facendo ritornare direttamente l'utente con email uguale o username uguale x migliore affidabilità cosi sicuro guarda quei campi
          });

        const response = await request(app)
            .post('/api/register')
            .send({ username: 'Luca', email: 'mario.red@email.com', password: 'securePass' });
      
    
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'You are already registered.' });
      });

    test('should return 400 if the username is already taken', async () => {
        /*const response = await request(app) //username già presente nel db
          .post('/api/register')
          .send({ username: 'user2', email: 'mario@example.com', password: 'securePass' });*/

        User.findOne = jest.fn().mockImplementation((query) => {
            if (query.username === 'Mario') {
              return Promise.resolve(true); // Simulate existing user with the same username
            }
            return Promise.resolve(false);
          });
        
        const response = await request(app)
          .post('/api/register')
          .send({ username: 'Mario', email: 'mario.red@email.com', password: 'securePass' });
    
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'An user with that username already exists.' });
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
        User.findOne = jest.fn().mockImplementation((query) => {
            if (query.email === 'admin@email.com') {
              return Promise.resolve(true); // Simulate existing user with the same username
            }
            return Promise.resolve(false);
          });

        const response = await request(app)
            .post('/api/admin')
            .send({ username: 'admin', email: 'admin@email.com', password: 'securePass' });
      
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'You are already registered.' });
      });

    test('should return 400 if the username is already taken', async () => {
        User.findOne = jest.fn().mockImplementation((query) => {
            if (query.username === 'admin') {
              return Promise.resolve(true); // Simulate existing user with the same username
            }
            return Promise.resolve(false);
          });
        
        const response = await request(app)
          .post('/api/admin')
          .send({ username: 'admin', email: 'admin@email.com', password: 'securePass' });
    
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'An user with that username already exists.' });
      });
    
})

describe('login', () => {
    test('should return 200 and tokens if login is successful', async () => {
        const requestBody = { email: 'mario.red@email.com', password: 'securePass' };
        const hashedPassword = await bcrypt.hash(requestBody.password, 12);
        const existingUser = {
            email: requestBody.email,
            password: hashedPassword, // Use the hashed password
            id: mongo.ObjectId("64691265489ca00e66dba547"),
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
        bcrypt.compare = jest.fn().mockResolvedValue(true);
        process.env.ACCESS_KEY = 'EZWALLET';

        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data.accessToken');
        expect(response.body).toHaveProperty('data.refreshToken');
      });
    
    test('should return 400 if any required field is missing (email)', async () => {
        const requestBody = { password: 'securePass' };
        const hashedPassword = await bcrypt.hash(requestBody.password, 12); //console.log(hashedPassword)
        const existingUser = {
            email: 'mario.red@email.com',
            password: hashedPassword, // Use the hashed password
            id: 'user123',
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
    
        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
      });

    test('should return 400 if any required field is missing (password)', async () => {
        const requestBody = { email: 'mario.red@email.com' };
        const hashedPassword = await bcrypt.hash(requestBody.password, 12);
        const existingUser = {
            email: 'mario.red@email.com',
            password: hashedPassword, // Use the hashed password
            id: 'user123',
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
    
        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "\'password\' field cannot be empty." });
      });

    test('should return 400 if any required field is an empty string (email)', async () => {
        const requestBody = { email: ' ', password: 'securePass' };
        const hashedPassword = await bcrypt.hash(requestBody.password, 12);
        const existingUser = {
            email: 'mario.red@email.com',
            password: hashedPassword, // Use the hashed password
            id: 'user123',
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
    
        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
      });

    test('should return 400 if any required field is an empty string (password)', async () => {
        const requestBody = { email: 'mario.red@email.com', password: ' ' };
        const hashedPassword = await bcrypt.hash(requestBody.password, 12);
        const existingUser = {
            email: 'mario.red@email.com',
            password: hashedPassword, // Use the hashed password
            id: 'user123',
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
    
        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "\'password\' field cannot be empty." });
      });

    test('should return 400 if the email is not in a valid format', async () => {
        const requestBody = { email: 'invalid-email', password: 'securePass' };
        const hashedPassword = await bcrypt.hash(requestBody.password, 12);
        const existingUser = {
            email: 'mario.red@email.com',
            password: hashedPassword, // Use the hashed password
            id: 'user123',
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
    
        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Wrong email format." });
      });

    test('should return 400 if the email in the request body does not identify a user in the database', async () => {
        const requestBody = { email: 'mario.red@email.com', password: 'securePass' };
        User.findOne.mockResolvedValue(null); // Simulate existing user
    
        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Please you need to register." });
      });

    test('should return 400 if the supplied password does not match with the one in the database', async () => {
        const requestBody = { email: 'mario.red@email.com', password: 'securePass2' };
        const hashedPassword = await bcrypt.hash("securePass", 12);
        const existingUser = {
            email: requestBody.email,
            password: hashedPassword, // Use the hashed password
            id: mongo.ObjectId("64691265489ca00e66dba547"),
            username: 'Mario',
            role: 'user',
            save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
        };
        User.findOne.mockResolvedValue(existingUser); // Simulate existing user
        bcrypt.compare = jest.fn().mockResolvedValue(false);
        process.env.ACCESS_KEY = 'EZWALLET';

        const response = await request(app)
          .post('/api/login')
          .send(requestBody);
          
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Wrong credentials." });
      });
    
});

describe('logout', () => { 
  beforeAll(() => {
    User.findOne.mockReset();
  });

  test('should return 200 and message if logout is successful', async () => {
    
    User.findOne = jest.fn().mockResolvedValue({
      email: 'mario.red@email.com',
      password: 'pass', 
      id: '646890f680e56ce0bcbfd16b',
      username: 'Mario',
      role: 'user',
      save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
      refreshToken: 'refr'
  });

    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', 'refreshToken=refrToken; accessToken=acceToken')
      .send();
      
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data:{ message: "Successfully logged out." }});
  });

  test('should return 400 error if the request does not have a refresh token in the cookies', async () => {
    
    User.findOne = jest.fn().mockResolvedValue({
      email: 'mario.red@email.com',
      password: 'pass', 
      id: '646890f680e56ce0bcbfd16b',
      username: 'Mario',
      role: 'user',
      save: jest.fn().mockResolvedValueOnce({}), // Mock the save() method of the user
      refreshToken: 'refr'
  });

    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', 'accessToken=acceToken')
      .send();
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User's refreshToken not found." });
  });

  test("should return 400 error if the refresh token in the request's cookies does not represent a user in the database", async () => {
    
    User.findOne.mockResolvedValue(false);

    const response = await request(app)
      .get('/api/logout')
      .set('Cookie', 'refreshToken=refrToken; accessToken=acceToken')
      .send();
      
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User not found in db." });
  });

});