import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { verifyAuth, handleDateFilterParams } from '../controllers/utils';

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

// necessary setup to ensure that each test can insert the data it needs
beforeEach(async () => {
  await categories.deleteMany({});
  await transactions.deleteMany({});
  await User.deleteMany({});
  await Group.deleteMany({});
});

// TOKENS
const adminAccessTokenValid = jwt.sign(
  {
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin",
  },
  process.env.ACCESS_KEY,
  { expiresIn: "1y" }
);

const testerAccessTokenValid = jwt.sign(
  {
    email: "tester@test.com",
    username: "tester",
    role: "Regular",
  },
  process.env.ACCESS_KEY,
  { expiresIn: "1y" }
);

const testerNotAuthenticated = jwt.sign(
  {
    email: "tester2@test.com",
    username: "tester2",
    role: "Simple",
  },
  process.env.ACCESS_KEY,
  { expiresIn: "1y" }
);

//These tokens can be used in order to test the specific authentication error scenarios inside verifyAuth (no need to have multiple authentication error tests for the same route)
const testerAccessTokenExpired = jwt.sign(
  {
    email: "tester@test.com",
    username: "tester",
    role: "Regular",
  },
  process.env.ACCESS_KEY,
  { expiresIn: "0s" }
);
const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" });


describe("getUsers", () => {
    //Farisan  
  test("getUsers: Returns `data` Content: an array of objects, each one having attributes `username`, `email` and `role`", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        role: "Admin",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        role: "Regular",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
      username: "user3",
      email: "user3@test.com",
      password: "securePass",
      role: "Regular",
      _id: "646890f680e56ce0bcbfd16c",
    },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);

    // API Request
    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
            expect.objectContaining({
              username: "user1",
              email: "user1@test.com",
              role: "Admin",
            }),
            expect.objectContaining({
              username: "user2",
              email: "user2@test.com",
              role: "Regular",
            }),
            expect.objectContaining({
              username: "user3",
              email: "user3@test.com",
              role: "Regular",
            }),
          ]),
    );
  });

  test("getUsers: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        role: "Admin",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        role: "Regular",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
      username: "user3",
      email: "user3@test.com",
      password: "securePass",
      role: "Regular",
      _id: "646890f680e56ce0bcbfd16c",
    },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);

    // API Request
    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
      .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: "Wrong role",
        })
      );
  });
})

describe("getUser", () => { 
  //Farisan
  test("getUser: Returns `data` Content: an object having attributes `username`, `email` and `role`", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        role: "Admin",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        role: "Regular",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
      username: "user3",
      email: "user3@test.com",
      password: "securePass",
      role: "Regular",
      _id: "646890f680e56ce0bcbfd16c",
    },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);

    // API Request
    const response = await request(app)
      .get("/api/users/user1")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
            expect.objectContaining({
              username: "user1",
              email: "user1@test.com",
              role: "Admin",
            }),
    );
  });

  test("getUser: Returns a 400 error if the username passed as the route parameter does not represent a user in the database", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        role: "Admin",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        role: "Regular",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
      username: "user3",
      email: "user3@test.com",
      password: "securePass",
      role: "Regular",
      _id: "646890f680e56ce0bcbfd16c",
    },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);

    // API Request
    const response = await request(app)
      .get("/api/users/user4")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
            message: "User not found.",
          })
      );
  });

  test("getUser: Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        role: "Admin",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        role: "Regular",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
      username: "user3",
      email: "user3@test.com",
      password: "securePass",
      role: "Regular",
      _id: "646890f680e56ce0bcbfd16c",
    },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);

    // API Request
    const response = await request(app)
      .get("/api/users/user3")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
      .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
          expect.objectContaining({
              error: expect.any(String),
          })
      );
  });
})

describe("createGroup", () => {
  // Riccardo
  test("should return composite object if group was created by user", async () => {
    const reqMock = {
      name: "Family",
      memberEmails: ["mario.red@email.com", "luigi.red@email.com", "tester@test.com"],
    };

    await User.insertMany([
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "tester", email: "tester@test.com", password: "test" },
    ]);

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        group: {
          name: "Family",
          members: expect.arrayContaining([
            { email: "tester@test.com" },
            { email: "mario.red@email.com" },
            { email: "luigi.red@email.com" },
          ]),
        },
        membersNotFound: [],
        alreadyInGroup: [],
      },
    });
  });

  test("should return composite object if group was created by user, user who calls not pass his email and is added in automatic", async () => {
    const reqMock = {
      name: "Family",
      memberEmails: ["mario.red@email.com", "luigi.red@email.com"],
    };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        group: {
          name: "Family",
          members: expect.arrayContaining([
            { email: "tester@test.com" },
            { email: "mario.red@email.com" },
            { email: "luigi.red@email.com" },
          ]),
        },
        membersNotFound: [],
        alreadyInGroup: [],
      },
    });
  });

  test("should return 400 error if the request body does not contain all the necessary attributes (name)", async () => {
    const reqMock = { memberEmails: ["mario.red@email.com", "luigi.red@email.com"] };

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'name' field cannot be empty." });
  });

  test("should return 400 error if the request body does not contain all the necessary attributes (members)", async () => {
    const reqMock = { name: "Family" };

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Must specify an array of users to add." });
  });

  test("should return 400 error if the group name passed in the request body is an empty string", async () => {
    const reqMock = { name: " ", memberEmails: ["mario.red@email.com", "luigi.red@email.com"] };

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'name' field cannot be empty." });
  });

  test("should return 400 error if the group name passed in the request body represents an already existing group in the database", async () => {
    const reqMock = {
      name: "Family",
      memberEmails: ["mario.red@email.com", "luigi.red@email.com"],
    };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [{ email: "mario.red@email.com", id: 111 }],
    });

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Group with the same name already exists." });
  });

  test("should return 400 error if all the provided emails (the ones in the array, the email of the user calling the function does not have to be considered in this case) represent users that do not exist in the database", async () => {
    const reqMock = {
      name: "Work",
      memberEmails: ["marione.red@email.com", "luigione.red@email.com"],
    };

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All the members do not exist." });
  });

  test("should return 400 error if all the provided emails (the ones in the array, the email of the user calling the function does not have to be considered in this case) represent users that are already in a group or do not exist in the database", async () => {
    const reqMock = {
      name: "Work",
      memberEmails: ["marione.red@email.com", "luigi.red@email.com"],
    };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [{ email: "luigi.red@email.com", id: 111 }],
    });

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "All the members do not exist or are already in a group.",
    });
  });

  test("should return 400 error if the user who calls the API is already in a group", async () => {
    const reqMock = { name: "Work", memberEmails: ["mario.red@email.com", "luigi.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({ name: "Family", members: [{ email: "tester@test.com", id: 111 }] });

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "User who wants to create a group is already in a group.",
    });
  });

  test("should return 400 error if at least one of the member emails is not in a valid email format", async () => {
    const reqMock = { name: "Work", memberEmails: ["mario.redcom", "luigi.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Wrong email format." });
  });

  test("should return 400 error if at least one of the member emails is an empty string", async () => {
    const reqMock = { name: "Work", memberEmails: [" ", "luigi.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'email' field cannot be empty." });
  });

  test("should return 401 error if called by a user who is not authenticated (authType = Simple)", async () => {
    const reqMock = { name: "Work", memberEmails: ["mario.redcom", "luigi.red@email.com"] };

    await User.insertMany([
      { username: "tester2", email: "tester2@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);

    const response = await request(app)
      .post("/api/groups")
      .set("Cookie", `refreshToken=${testerNotAuthenticated};accessToken=${testerNotAuthenticated}`)
      .send(reqMock);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Wrong role" });
  });
});

describe("getGroups", () => {
  // Lorenzo
  test("getGroups: Returns an array of objects, each one having a string attribute for the name of the group and an array for the members of the group", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16a",
      },
    ];

    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          },
          {
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          },
        ],
      },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);
    await Group.insertMany(mockGroups);

    // API Request
    const response = await request(app)
      .get("/api/groups")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "group1",
          members: expect.arrayContaining([
            expect.objectContaining({
              email: "user1@test.com",
              user: "646890f680e56ce0bcbfd16b",
            }),
            expect.objectContaining({
              email: "user2@test.com",
              user: "646890f680e56ce0bcbfd16a",
            }),
          ]),
        }),
      ])
    );
  });

  test("getGroups: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16a",
      },
    ];

    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          },
          {
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          },
        ],
      },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);
    await Group.insertMany(mockGroups);

    // API Request
    const response = await request(app)
      .get("/api/groups")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Wrong role",
      })
    );
  });
});

describe("getGroup", () => {
  // Lorenzo
  test("getGroup: [ADMIN] Returns an object having a string attribute for the name of the group and an array for the members of the group", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16a",
      },
    ];

    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          },
          {
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          },
        ],
      },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);
    await Group.insertMany(mockGroups);

    // API Request
    const response = await request(app)
      .get("/api/groups/group1")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        name: "group1",
        members: expect.arrayContaining([
          expect.objectContaining({
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          }),
          expect.objectContaining({
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          }),
        ]),
      })
    );
  });

  test("getGroup: [USER] Returns an object having a string attribute for the name of the group and an array for the members of the group", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
        username: "tester",
        email: "tester@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16e",
      },
    ];

    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          },
          {
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          },
          {
            email: "tester@test.com",
            user: "646890f680e56ce0bcbfd16e",
          },
        ],
      },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);
    await Group.insertMany(mockGroups);

    // API Request
    const response = await request(app)
      .get("/api/groups/group1")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        name: "group1",
        members: expect.arrayContaining([
          expect.objectContaining({
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          }),
          expect.objectContaining({
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          }),
          expect.objectContaining({
            email: "tester@test.com",
            user: "646890f680e56ce0bcbfd16e",
          }),
        ]),
      })
    );
  });

  test("getGroup: Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
        username: "tester",
        email: "tester@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16e",
      },
    ];

    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          },
          {
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          },
          {
            email: "tester@test.com",
            user: "646890f680e56ce0bcbfd16e",
          },
        ],
      },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);
    await Group.insertMany(mockGroups);

    // API Request
    const response = await request(app)
      .get("/api/groups/group2")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Group does not exist.",
      })
    );
  });

  test("getGroup: Returns a 401 error if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin)", async () => {
    // Test group list
    const mockUsers = [
      {
        username: "user1",
        email: "user1@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16b",
      },
      {
        username: "user2",
        email: "user2@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16a",
      },
      {
        username: "tester",
        email: "tester@test.com",
        password: "securePass",
        _id: "646890f680e56ce0bcbfd16e",
      },
    ];

    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "646890f680e56ce0bcbfd16b",
          },
          {
            email: "user2@test.com",
            user: "646890f680e56ce0bcbfd16a",
          },
        ],
      },
    ];

    // Populate the DB
    await User.insertMany(mockUsers);
    await Group.insertMany(mockGroups);

    // API Request
    const response = await request(app)
      .get("/api/groups/group1")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});

describe("addToGroup", () => {
  // Riccardo
  test("should 200 and return composite object having an attribute group, a alreadyInGroup vector and membersNotFound vector, user in his group", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        group: {
          name: "Family",
          members: [
            { email: "luigi.red@email.com" },
            { email: "tester@test.com" },
            { email: "mario.red@email.com" },
          ],
        },
        membersNotFound: [],
        alreadyInGroup: [],
      },
    });
  });

  test("should 200 and return composite object having an attribute group, a alreadyInGroup vector and membersNotFound vector, admin add in any group", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "admin", email: "admin@email.com", password: "test" },
      { username: "test", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 123 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/insert")
      .set("Cookie", `refreshToken=${adminAccessTokenValid};accessToken=${adminAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        group: {
          name: "Family",
          members: [
            { email: "luigi.red@email.com" },
            { email: "tester@test.com" },
            { email: "mario.red@email.com" },
          ],
        },
        membersNotFound: [],
        alreadyInGroup: [],
      },
    });
  });

  test("should return 400 error if the request body does not contain all the necessary attributes", async () => {
    const reqMock = {};

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Must specify an array of users to add." });
  });

  test("should return 400 error if the request body does not contain all the necessary attributes - empty vector", async () => {
    const reqMock = { emails: [] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'email' field cannot be empty." });
  });

  test("should return 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Work/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Group does not exist." });
  });

  test("should return 400 error if all the provided emails represent users that do not exist in the database", async () => {
    const reqMock = { emails: ["marione.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All users do not exist." });
  });

  test("should return 400 error if all the provided emails represent users that do not belong to the group or do not exist in the database", async () => {
    const reqMock = { emails: ["marione.red@email.com", "mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "All the members do not exist or are already in a group.",
    });
  });

  test("should return 400 error if at least one of the emails is not in a valid email format", async () => {
    const reqMock = { emails: ["marioneemail.com", "mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Wrong email format." });
  });

  test("should return 400 error if at least one of the emails is an empty string", async () => {
    const reqMock = { emails: [" ", "mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'email' field cannot be empty." });
  });

  test("should return 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add", async () => {
    const reqMock = { emails: ["tester@test.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({ name: "Work", members: [{ email: "tester@test.com", id: 122 }] });
    await Group.insertMany({
      name: "Family",
      members: [{ email: "luigi.red@email.com", id: 122 }],
    });

    const response = await request(app)
      .patch("/api/groups/Family/add")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "User can add-remove-get only in his group" });
  });

  test("should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({ name: "Work", members: [{ email: "tester@test.com", id: 122 }] });
    await Group.insertMany({
      name: "Family",
      members: [{ email: "luigi.red@email.com", id: 122 }],
    });

    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Wrong role" });
  });
});

describe("removeFromGroup", () => {
  // Riccardo
  test("should 200 and return composite object having an attribute group, a notInGroup vector and membersNotFound vector, user in his group", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        group: {
          name: "Family",
          members: [{ email: "luigi.red@email.com" }, { email: "tester@test.com" }],
        },
        membersNotFound: [],
        notInGroup: [],
      },
    });
  });

  test("should 200 and return composite object having an attribute group, a notInGroup vector and membersNotFound vector, admin remove from any group", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "admin", email: "admin@email.com", password: "test" },
      { username: "test", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 123 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 143 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .set("Cookie", `refreshToken=${adminAccessTokenValid};accessToken=${adminAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        group: {
          name: "Family",
          members: [{ email: "luigi.red@email.com" }, { email: "tester@test.com" }],
        },
        membersNotFound: [],
        notInGroup: [],
      },
    });
  });

  test("should return 400 error if the request body does not contain all the necessary attributes", async () => {
    const reqMock = {};

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Must specify an array of users to remove." });
  });

  test("should return 400 error if the request body does not contain all the necessary attributes - empty vector", async () => {
    const reqMock = { emails: [] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'email' field cannot be empty." });
  });

  test("should return 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    const reqMock = { emails: ["mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Work/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Group does not exist." });
  });

  test("should return 400 error if all the provided emails represent users that do not exist in the database", async () => {
    const reqMock = { emails: ["marione.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
        { email: "mario.red@email.com", id: 123 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All users do not exist." });
  });

  test("should return 400 error if all the provided emails represent users that do not belong to the group or do not exist in the database", async () => {
    const reqMock = { emails: ["marione.red@email.com", "mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members.",
    });
  });

  test("should return 400 error if at least one of the emails is not in a valid email format", async () => {
    const reqMock = { emails: ["marioneemail.com", "mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Wrong email format." });
  });

  test("should return 400 error if at least one of the emails is an empty string", async () => {
    const reqMock = { emails: [" ", "mario.red@email.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({
      name: "Family",
      members: [
        { email: "luigi.red@email.com", id: 111 },
        { email: "tester@test.com", id: 122 },
      ],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'email' field cannot be empty." });
  });

  test("should return 400 error if the group contains only one member before deleting any user", async () => {
    const reqMock = { emails: ["tester@test.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({ name: "Family", members: [{ email: "tester@test.com", id: 122 }] });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members.",
    });
  });

  test("should return 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove", async () => {
    const reqMock = { emails: ["tester@test.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({ name: "Work", members: [{ email: "tester@test.com", id: 122 }] });
    await Group.insertMany({
      name: "Family",
      members: [{ email: "luigi.red@email.com", id: 122 }],
    });

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "User can add-remove-get only in his group" });
  });

  test("should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull", async () => {
    const reqMock = { emails: ["tester@test.com"] };

    await User.insertMany([
      { username: "tester", email: "tester@test.com", password: "test" },
      { username: "mario", email: "mario.red@email.com", password: "securePass" },
      { username: "luigi", email: "luigi.red@email.com", password: "securePass" },
    ]);
    await Group.insertMany({ name: "Work", members: [{ email: "tester@test.com", id: 122 }] });
    await Group.insertMany({
      name: "Family",
      members: [{ email: "luigi.red@email.com", id: 122 }],
    });

    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .set("Cookie", `refreshToken=${testerAccessTokenValid};accessToken=${testerAccessTokenValid}`)
      .send(reqMock);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Wrong role" });
  });
});

describe("deleteUser", () => {
  // Farisan
  test("deleteUser: Returns an object having an attribute that lists the number of `deletedTransactions` and an attribute that specifies whether the user was also `deletedFromGroup` or not", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "test@example.com" })
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        deletedFromGroup: true,
        deletedTransactions: 2,
      })
    );
  });

  test("deleteUser: If the user is the last user of a group then the group is deleted as well", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "test@example.com" })
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        deletedFromGroup: true,
        deletedTransactions: 2,
      })
    );
  });

  test("deleteUser: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({})
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body is an empty string", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "" })
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body is not in correct email format", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "anotherexamplecom" })
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body does not represent a user in the database", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "test@example.com",
            username: "test",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "testtwo@example.com" })
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body represents an admin", async () => {
    await User.insertMany([
      {
        username: "admin",
        email: "admin@email.com",
        role: "Admin",
        password: "test",
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "admin@email.com",
            username: "admin",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "admin@email.com",
            username: "admin",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "admin",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "admin",
        category: "Category 2",
        amount: 11,
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "admin@email.com" })
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  test("deleteUser: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    await User.insertMany([
      {
        username: "test",
        email: "test@example.com",
        password: "test",
        refreshToken: testerAccessTokenValid,
      },
    ]);

    await Group.insertMany([
      {
        name: "Group 1",
        members: [
          {
            email: "admin@email.com",
            username: "admin",
          },
          {
            email: "user@example.com",
            username: "user",
          },
        ],
      },
      {
        name: "Group 2",
        members: [
          {
            email: "admin@email.com",
            username: "admin",
          },
          {
            email: "another@example.com",
            username: "another",
          },
        ],
      },
    ]);
    await transactions.insertMany([
      {
        username: "test",
        category: "Category 1",
        amount: 10,
        date: "2022-08-10",
      },
      {
        username: "test",
        category: "Category 2",
        date: "2022-08-10",
      },
    ]);

    const response = await request(app)
      .delete("/api/users")
      .send({ email: "test@example.com" })
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      );

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});

describe("deleteGroup", () => {
  //Farisan
  test("deleteGroup: Returns `data` Content: A message confirming successful deletion", async () => {
		await User.insertMany([
			{
				username: "test",
				email: "test@example.com",
				password: "test",
				refreshToken: testerAccessTokenValid,
			},
		]);

		await Group.insertMany([
			{
				name: "Family",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "user@example.com",
						username: "user",
					},
				],
			},
			{
				name: "Friends",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "another@example.com",
						username: "another",
					},
				],
			},
		]);
		await transactions.insertMany([
			{
				username: "test",
				category: "Category 1",
				amount: 10,
        date: "2022-08-10"
			},
			{
				username: "test",
				category: "Category 2",
				date: "2022-08-10"
			},
		]);

		const response = await request(app)
			.delete("/api/groups")
			.send({name: "Family"})
			.set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
            message: expect.any(String),
        })
    );
	});

  test("deleteGroup: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
		await User.insertMany([
			{
				username: "test",
				email: "test@example.com",
				password: "test",
				refreshToken: testerAccessTokenValid,
			},
		]);

		await Group.insertMany([
			{
				name: "Family",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "user@example.com",
						username: "user",
					},
				],
			},
			{
				name: "Friends",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "another@example.com",
						username: "another",
					},
				],
			},
		]);
		await transactions.insertMany([
			{
				username: "test",
				category: "Category 1",
				amount: 10,
        date: "2022-08-10"
			},
			{
				username: "test",
				category: "Category 2",
				date: "2022-08-10"
			},
		]);

		const response = await request(app)
			.delete("/api/groups")
			.send({})
			.set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
          expect.objectContaining({
              message: expect.any(String),
          })
      );
	});

  test("deleteGroup: Returns a 400 error if the name passed in the request body is an empty string", async () => {
		await User.insertMany([
			{
				username: "test",
				email: "test@example.com",
				password: "test",
				refreshToken: testerAccessTokenValid,
			},
		]);

		await Group.insertMany([
			{
				name: "Family",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "user@example.com",
						username: "user",
					},
				],
			},
			{
				name: "Friends",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "another@example.com",
						username: "another",
					},
				],
			},
		]);
		await transactions.insertMany([
			{
				username: "test",
				category: "Category 1",
				amount: 10,
        date: "2022-08-10"
			},
			{
				username: "test",
				category: "Category 2",
				date: "2022-08-10"
			},
		]);

		const response = await request(app)
			.delete("/api/groups")
			.send({name: ""})
			.set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
          expect.objectContaining({
              message: expect.any(String),
          })
      );
	});

  test("deleteGroup: Returns a 400 error if the name passed in the request body does not represent a group in the database", async () => {
		await User.insertMany([
			{
				username: "test",
				email: "test@example.com",
				password: "test",
				refreshToken: testerAccessTokenValid,
			},
		]);

		await Group.insertMany([
			{
				name: "Family",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "user@example.com",
						username: "user",
					},
				],
			},
			{
				name: "Friends",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "another@example.com",
						username: "another",
					},
				],
			},
		]);
		await transactions.insertMany([
			{
				username: "test",
				category: "Category 1",
				amount: 10,
        date: "2022-08-10"
			},
			{
				username: "test",
				category: "Category 2",
				date: "2022-08-10"
			},
		]);

		const response = await request(app)
			.delete("/api/groups")
			.send({name: "School"})
			.set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
          expect.objectContaining({
              message: expect.any(String),
          })
      );
	});

  test("deleteGroup: Returns a 400 error if the name passed in the request body is an empty string", async () => {
		await User.insertMany([
			{
				username: "test",
				email: "test@example.com",
				password: "test",
				refreshToken: testerAccessTokenValid,
			},
		]);

		await Group.insertMany([
			{
				name: "Family",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "user@example.com",
						username: "user",
					},
				],
			},
			{
				name: "Friends",
				members: [
					{
						email: "test@example.com",
						username: "test",
					},
					{
						email: "another@example.com",
						username: "another",
					},
				],
			},
		]);
		await transactions.insertMany([
			{
				username: "test",
				category: "Category 1",
				amount: 10,
        date: "2022-08-10"
			},
			{
				username: "test",
				category: "Category 2",
				date: "2022-08-10"
			},
		]);

		const response = await request(app)
			.delete("/api/groups")
			.send({name: "Family"})
			.set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
          expect.objectContaining({
              error: expect.any(String),
          })
      );
  });
})
