import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { categories, transactions } from '../models/model.js';
import { verifyAuth } from "../controllers/utils.js";
import {
  createGroup,
  getGroups,
  getGroup,
  removeFromGroup,
  addToGroup,
  deleteUser,
  deleteGroup,
} from "../controllers/users.js";

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("../models/User.js")
jest.mock("../models/model.js")
jest.mock('../controllers/utils.js')

//Necessary step to ensure that the functions in utils.js can be mocked correctly
jest.mock('../controllers/utils.js', () => ({
  verifyAuth: jest.fn(),
}))

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  jest.resetAllMocks()
})

describe("getUsers", () => {
  test("should return 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    //verifyAuth = jest.fn().mockResolvedValueOnce({ authorized: false, message: "Wrong role" });
    //jest.replaceProperty(verifyAuth, 'verifyAuth', jest.fn(() => returnVerify));
    const verifyMock = { authorized: false, message: "Wrong role" };
    
    verifyAuth.mockReturnValue(verifyMock)
    
    const response = await request(app)
      .get("/api/users")
      
    expect(response.status).toBe(401)
    expect(response.body).toEqual({error: "Wrong role"})
  })

  test("should return 200 and empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const verifyMock = { authorized: true, message: "Authorized" };
    
    verifyAuth.mockReturnValue(verifyMock)
    jest.spyOn(User, "find").mockImplementation(() => [])
    const response = await request(app)
      .get("/api/users")

    expect(response.status).toBe(200)
    expect(response.body).toEqual({data: []})
  })

  test("should retrieve 200 and list of all users", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    
    verifyAuth.mockReturnValue(verifyMock)
    const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', role:"Admin" }, { username: 'test2', email: 'test2@example.com', role:"Regular" }]
    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers)
    const response = await request(app)
      .get("/api/users")

    expect(response.status).toBe(200)
    expect(response.body).toEqual({data: retrievedUsers})
  })
})

describe("getUser", () => { 
  test("should return 200 and a regular user", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const verifyMock = { authorized: true, message: "Authorized" };
    const mockUser = { username: 'test1', email: 'test1@example.com', role:"Regular" };

    verifyAuth.mockReturnValue(verifyMock)
    jest.spyOn(User, "findOne").mockImplementation(() => mockUser)
    const response = await request(app)
      .get("/api/users/:username")

    expect(response.status).toBe(200)
    expect(response.body).toEqual({data: mockUser})
  })

  test("should return 400 if the username passed as the route parameter does not represent a user in the database", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const verifyMock = { authorized: true, message: "Authorized" };

    verifyAuth.mockReturnValue(verifyMock)
    jest.spyOn(User, "findOne").mockImplementation(() => null)
    const response = await request(app)
      .get("/api/users/:username")

    expect(response.status).toBe(400)
    expect(response.body).toEqual({message: "User not found."})
  })

  test("should return 401 if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const verifyMock = { authorized: false, message: "Mismatched users, accessed one requires for another" };

    verifyAuth.mockReturnValue(verifyMock)
    jest.spyOn(User, "findOne").mockImplementation(() => null)
    const response = await request(app)
      .get("/api/users/:username")

    expect(response.status).toBe(401)
    expect(response.body).toEqual({error: "Mismatched users, accessed one requires for another"})
  })

})

describe("createGroup", () => {
  let reqMock;
  let vett;
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    reqMock = {
      // Inizializza reqMock con i valori desiderati per ogni test
      name: "",
      memberEmails: []
    };
    vett = [];
  });

  test("should return composite object if group was created by user", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    vett = [{ email: "mario.red@email.com", _id: 123, isInGroup: 0 },{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(200);
    expect(response.body).toEqual({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, membersNotFound: [], alreadyInGroup: []}})
  })
  
  test("should return 400 error if the request body does not contain all the necessary attributes (name)", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);
    
    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'name\' field cannot be empty."})
  })

  test("should return 400 error if the request body does not contain all the necessary attributes (members)", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Family"};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);
    
    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Must specify an array of users to add." })
  })

  test("should return 400 error if the group name passed in the request body is an empty string", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: " ", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);
    
    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'name\' field cannot be empty."})
  })

  test("should return 400 error if the group name passed in the request body represents an already existing group in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    jest.spyOn(Group, "findOne").mockImplementation(() => true);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);
    
    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Group with the same name already exists." });
  })

  test("should return 400 error if all the provided emails (the ones in the array, the email of the user calling the function does not have to be considered in this case) represent users that do not exist in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    jest.spyOn(User, "aggregate").mockImplementation(() => []);
    
    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All the members do not exist." })
  })

  test("should return 400 error if all the provided emails (the ones in the array, the email of the user calling the function does not have to be considered in this case) represent users that are already in a group", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    Group.findOne.mockReturnValueOnce(null).mockReturnValueOnce(true).mockReturnValueOnce(true);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);
    
    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    vett = [{ email: "mario.red@email.com", _id: 223, isInGroup: 1 },{ email: "luigi.red@email.com", _id: 224, isInGroup: 1 }];
    Promise.prototype.all.mockRestore();
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All the members are already in a group." })
  })

  test("should return 400 error if all the provided emails (the ones in the array, the email of the user calling the function does not have to be considered in this case) represent users that are already in a group or do not exist in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "tot@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    Group.findOne.mockReturnValueOnce(null).mockReturnValueOnce(true).mockReturnValueOnce(true);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);
    
    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    vett = [{ email: "mario.red@email.com", _id: 223, isInGroup: 1 },{ email: "luigi.red@email.com", _id: 224, isInGroup: 1 }];
    Promise.prototype.all.mockRestore();
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All the members do not exist or are already in a group." })
  })

  test("should return 400 error if the user who calls the API is already in a group", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    reqMock = {name: "Work", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    Group.findOne.mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValueOnce(true).mockReturnValueOnce(true);
    const mockMember = [{_id: 123, email: "mario.red@email.com"}, {_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "aggregate").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    vett = [{ email: "mario.red@email.com", _id: 123, isInGroup: 1 },{ email: "luigi.red@email.com", _id: 124, isInGroup: 1 }];
    Promise.prototype.all.mockRestore();
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User who wants to create a group is already in a group." });
  })

  test("should return 400 error if at least one of the member emails is not in a valid email format", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {name: "Work", memberEmails: ["mario.redcom", "luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); 

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Wrong email format." });
  })

  test("should return 400 error if at least one of the member emails is an empty string", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {name: "Work", memberEmails: [" ", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); 

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "\'email\' field cannot be empty." });
  })

  test("should return 401 error if called by a user who is not authenticated (authType = Simple)", async () => {
    const verifyMock = { authorized: false, message: "Wrong role" };
    const reqMock = {name: "Work", memberEmails: ["mario.redcom", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); 

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Wrong role" });
  })

 })

describe("getGroups", () => {
  // Lorenzo
  test("getGroups: Returns an array of objects, each one having a string attribute for the name of the group and an array for the members of the group", async () => {
    // Mocked group list
    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "user1",
          },
          {
            email: "user2@test.com",
            user: "user2",
          },
        ],
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    Group.find.mockResolvedValueOnce(mockGroups);

    // Request object
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getGroups(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining(mockGroups),
      })
    );
  });

  test("getGroups: Returns a 401 error if called by a user who is not an Admin", async () => {
    // Mocked group list
    const mockGroups = [
      {
        name: "group1",
        members: [
          {
            email: "user1@test.com",
            user: "user1",
          },
          {
            email: "user2@test.com",
            user: "user2",
          },
        ],
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    Group.find.mockResolvedValueOnce(mockGroups);

    // Request object
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getGroups(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});

describe("getGroup", () => {
  test("getGroup: Returns a string attribute for the name of the group and an array for the members of the group", async () => {
    // Mocked group list
    const mockGroup = {
      name: "group1",
      members: [
        {
          email: "user1@test.com",
          user: "user1",
        },
        {
          email: "user2@test.com",
          user: "user2",
        },
      ],
    };

    // Mocks
    Group.findOne.mockResolvedValueOnce(mockGroup);
    verifyAuth
      .mockReturnValue({ authorized: false, message: "Wrong role" })
      .mockReturnValueOnce({ authorized: true, message: "Authorized" });

    // Request object
    const mockReq = {
      params: {
        name: "group1",
      },
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups/group1",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining(mockGroup),
      })
    );
  });

  test("getGroup: Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    // Mocks
    Group.findOne.mockResolvedValueOnce(null);

    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });

    // Request object
    const mockReq = {
      params: {
        name: "group1",
      },
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups/group1",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("getGroup: Returns a 401 error if called by a user who is neither part of the group (authType = Group) nor an admin (authType = Admin)", async () => {
    // Mocked group list
    const mockGroup = {
      name: "group1",
      members: [
        {
          email: "user1@test.com",
          user: "user1",
        },
        {
          email: "user2@test.com",
          user: "user2",
        },
      ],
    };

    // Mocks
    Group.findOne.mockResolvedValueOnce(mockGroup);

    verifyAuth.mockReturnValueOnce({
      authorized: false,
      message: "User can add-remove-get only in his group",
    });
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });

    // Request object
    const mockReq = {
      params: {
        name: "group1",
      },
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups/group1",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});

describe("addToGroup", () => { 
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  });

  test("should return composite object if user added to his group", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock);
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    const emailVec2 = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group2 = {
      name: "Family",
      members: emailVec2
    };
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(null).mockReturnValueOnce(group2);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/add")
      .send(reqMock)

    expect(response.status).toBe(200);
    expect(response.body).toEqual({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, membersNotFound: [], alreadyInGroup: []}})
  })

  test("should return composite object if admin added to a group", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock);
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    const emailVec2 = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group2 = {
      name: "Family",
      members: emailVec2
    };
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(null).mockReturnValueOnce(group2);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/insert")
      .send(reqMock)

    expect(response.status).toBe(200);
    expect(response.body).toEqual({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, membersNotFound: [], alreadyInGroup: []}})
  })

  test("should return 400 error if the request body does not contain all the necessary attributes", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Must specify an array of users to add."})
  })

  test("should return 400 error if the request body does not contain all the necessary attributes, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Must specify an array of users to add."})
  })

  test("should return 400 error if the request body does not contain all the necessary attributes - empty vector", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: []};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'email\' field cannot be empty."})
  })

  test("should return 400 error if the request body does not contain all the necessary attributes - empty vector, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: []};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'email\' field cannot be empty."})
  })

  test("should return 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Group does not exist."})
  })

  test("should return 400 error if the group name passed as a route parameter does not represent a group in the database, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => null);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Group does not exist."})
  })

  test("should return 400 error if all the provided emails represent users that do not exist in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users do not exist."})
  })

  test("should return 400 error if all the provided emails represent users that do not exist in the database, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users do not exist."})
  })

  test("should return 400 error if all the provided emails represent users that are already in a group", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users are already in a group."})
  })

  test("should return 400 error if all the provided emails represent users that are already in a group admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users are already in a group."})
  })

  test("should return 400 error if all the provided emails represent users that are already in a group or do not exist in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@email.com", "lucone@email.it"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(true);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All the members do not exist or are already in a group."})
  })

  test("should return 400 error if all the provided emails represent users that are already in a group or do not exist in the database, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@email.com", "lucone@email.it"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(true);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All the members do not exist or are already in a group."})
  })

  test("should return 400 error if at least one of the member emails is not in a valid email format", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@emailcom"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Wrong email format."})
  })

  test("should return 400 error if at least one of the member emails is not in a valid email format, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["mario.red@emailcom"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/insert")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Wrong email format."})
  })

  test("should return 400 error if at least one of the member emails is an empty string", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: [" "]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'email\' field cannot be empty."})
  })

  test("should return 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add", async () => {
    const verifyMock = { authorized: false, message: "User can add-remove-get only in his group" };
    const reqMock = {emails: ["mario.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/add")
      .send(reqMock)

    expect(response.status).toBe(401);
    expect(response.body).toEqual({error: "User can add-remove-get only in his group"})
  })

  test("should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert", async () => {
    const verifyMock = { authorized: false, message: "Wrong role" };
    const reqMock = {emails: ["mario.red@email.com"]};

    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); //user who calls create
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();

    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0 }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Work/insert")
      .send(reqMock)

    expect(response.status).toBe(401);
    expect(response.body).toEqual({error: "Wrong role"})
  })

})

describe("removeFromGroup", () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetAllMocks()
  });

  test("removeFromGroup: [ADMIN] Removes members from a group and returns the updated group information, notInGroup members, and membersNotFound", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("group");
  });

  test("removeFromGroup: Removes members from a group and returns the updated group information, notInGroup members, and membersNotFound", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("group");
  });

  test("removeFromGroup: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Must specify an array of users to remove."});
  });

  test("removeFromGroup: Returns a 400 error if the request body does not contain all the necessary attributes, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Must specify an array of users to remove."});
  });

  test("removeFromGroup: Returns a 400 error if the request body does not contain all the necessary attributes - empty vector", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: []};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'email\' field cannot be empty."});
  });

  test("removeFromGroup: Returns a 400 error if the request body does not contain all the necessary attributes - empty vector, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: []};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'email\' field cannot be empty."});
  });

  test("removeFromGroup: Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    // Mocks
    jest.spyOn(Group, "findOne").mockImplementation(() => null);

    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });

    // Request object
    const mockReq = {
      body: {
        emailsToRemove: ["user1@test.com"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups/NonExistingGroup/remove",
    };

    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(mockReq)

    // Expected results
    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Group does not exist."});
  });

  test("removeFromGroup: Returns a 400 error if the group name passed as a route parameter does not represent a group in the database, admin", async () => {
    // Mocks
    jest.spyOn(Group, "findOne").mockImplementation(() => null);

    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });

    // Request object
    const mockReq = {
      body: {
        emailsToRemove: ["user1@test.com"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups/NonExistingGroup/pull",
    };

    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(mockReq)

    // Expected results
    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Group does not exist."});
  });

  test("removeFromGroup: Returns a 400 error if all the provided emails represent users that do not exist in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["marione@email.it"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users do not exist."});
  });

  test("removeFromGroup: Returns a 400 error if all the provided emails represent users that do not exist in the database, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["marione@email.it"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users do not exist."});
  });

  test("removeFromGroup: Returns a 400 error if all the provided emails represent users that do not belong to the group or do not exist in the database", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com", "tot@email.com"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(null);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0}];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members."});
  });

  test("removeFromGroup: Returns a 400 error if all the provided emails represent users that do not belong to the group", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(null);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0}];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users are not in the group."});
  });

  test("removeFromGroup: Returns a 400 error if all the provided emails represent users that do not belong to the group, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(null);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0}];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "All users are not in the group."});
  });

  test("removeFromGroup: Returns a 400 error if all the provided emails represent users that do not belong to the group or do not exist in the database, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["luigi.red@email.com", "tot@email.com"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    Group.findOne.mockReturnValueOnce(group).mockReturnValueOnce(null);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 0}];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members."});
  });

  test("removeFromGroup: Returns a 400 error if at least one of the emails is not in a valid email format", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["marioemail.it"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Wrong email format."});
  });

  test("removeFromGroup: Returns a 400 error if at least one of the emails is not in a valid email format, admin", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: ["marioemail.it"]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/pull")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Wrong email format."});
  });

  test("removeFromGroup: Returns a 400 error if at least one of the member emails is an empty string", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = {emails: [" "]};
    const emailVec = [
      { email: "mario.red@email.com" },
      { email: "luigi.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "luigi.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => []);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "luigi.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "\'email\' field cannot be empty."});
  });

  test("removeFromGroup: Returns a 400 error if the group contains only one member before deleting any user", async () => {
    const verifyMock = { authorized: true, message: "Authorized" };
    const reqMock = { emails: ["mario.red@email.com"] };
    const emailVec = [
      { email: "mario.red@email.com" }
    ];
    const group = {
      name: "Family",
      members: emailVec
    };

    verifyAuth.mockReturnValueOnce(verifyMock);
    jest.spyOn(Group, "findOne").mockImplementation(() => group);
    const mockMember = [{_id: 124, email: "mario.red@email.com"}];
    jest.spyOn(User, "find").mockImplementation(() => mockMember);

    Promise.prototype.all = jest.fn();
    Group.prototype.save = jest.fn();
    
    const vett = [{ email: "mario.red@email.com", _id: 124, isInGroup: 1, nameGroup: "Family" }];
    Promise.prototype.all.mockResolvedValueOnce(vett);
    Group.prototype.save.mockResolvedValueOnce(group);
    const response = await request(app)
      .patch("/api/groups/Family/remove")
      .send(reqMock)

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members."});
  });

  test("should return 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove", async () => {
    const verifyMock = { authorized: false, message: "User can add-remove-get only in his group" };
    const reqMock = {name: "Work", memberEmails: ["mario.redcom", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); 

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "User can add-remove-get only in his group" });
  })

  test("should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull", async () => {
    const verifyMock = { authorized: false, message: "Wrong role" };
    const reqMock = {name: "Work", memberEmails: ["mario.redcom", "luigi.red@email.com"]};
    
    verifyAuth.mockReturnValueOnce(verifyMock)
    .mockReturnValueOnce({authorized: false})
    .mockReturnValueOnce({email: "mario.red@email.com"}); 

    const response = await request(app)
      .post("/api/groups")
      .send(reqMock)

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Wrong role" });
  })

});


describe("deleteUser", () => { 
  // Lorenzo
  test("deleteUser: Delete the user specified inside email, inside group with others", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    const mockGroup = {
      name: "test",
      members: [
        {
          email: "user1@test.com",
          username: "user1",
        },
        {
          email: "user2@test.com",
          username: "user2",
        }
      ]
    }

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(mockGroup);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        email: "user1@test.com",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deletedTransactions: 2,
          deletedFromGroup: true,
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("deleteUser: Delete the user specified inside email, inside group alone", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    const mockGroup = {
      name: "test",
      members: [
        {
          email: "user1@test.com",
          username: "user1",
        }
      ]
    }

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(mockGroup);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        email: "user1@test.com",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deletedTransactions: 2,
          deletedFromGroup: true,
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("deleteUser: Delete the user specified inside email, not inside group", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        email: "user1@test.com",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deletedTransactions: 2,
          deletedFromGroup: false,
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("deleteUser: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: { },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "\'email\' field cannot be empty."
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
  
  test("deleteUser: Returns a 400 error if the email passed in the request body is an empty string", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: { 
        email: " "
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "\'email\' field cannot be empty."
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body is not in correct email format", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: { 
        email: "invalid@email"
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Wrong email format."
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body does not represent a user in the database", async () => {
    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(null);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: { 
        email: "user@test.com"
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found."
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteUser: Returns a 400 error if the email passed in the request body represents an admin", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
      role: "Admin",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: { 
        email: "user1@test.com",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Cannot delete an Admin."
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteUser: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    // Mocked user
    const mockUser = {
      email: "user1@test.com",
      username: "user1",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    User.findOne.mockResolvedValueOnce(null);
    transactions.deleteMany.mockResolvedValueOnce( { deletedCount: 2 } );

    Group.findOne.mockResolvedValueOnce(mockUser);
    Group.deleteOne.mockResolvedValueOnce(null);
    Group.updateOne.mockResolvedValueOnce(null);

    User.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: { 
        email: "user1@test.com"
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/users",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteUser(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Wrong role"
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

})

describe("deleteGroup", () => {
  // Lorenzo
  test("deleteGroup: Delete the group specified inside name", async () => {
    // Mocked group
    const mockGroup = {
      name: "test",
      members: [
        {
          email: "user1@test.com",
          username: "user1",
        },
        {
          email: "user2@test.com",
          username: "user2",
        },
      ],
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });

    Group.findOne.mockResolvedValueOnce(mockGroup);
    Group.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        name: "test",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: "Group successfully deleted.",
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("deleteGroup: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    // Mocked group
    const mockGroup = {
      name: "test",
      members: [
        {
          email: "user1@test.com",
          username: "user1",
        },
        {
          email: "user2@test.com",
          username: "user2",
        },
      ],
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });

    Group.findOne.mockResolvedValueOnce(mockGroup);
    Group.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "'name' field cannot be empty.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteGroup: Returns a 400 error if the name passed in the request body is an empty string", async () => {
    // Mocked group
    const mockGroup = {
      name: "test",
      members: [
        {
          email: "user1@test.com",
          username: "user1",
        },
        {
          email: "user2@test.com",
          username: "user2",
        },
      ],
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });

    Group.findOne.mockResolvedValueOnce(mockGroup);
    Group.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        name: " ",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "'name' field cannot be empty.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteGroup: Returns a 400 error if the name passed in the request body does not represent a group in the database", async () => {
    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });

    Group.findOne.mockResolvedValueOnce(null);
    Group.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        name: "test",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Group does not exists.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteGroup: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    // Mocked group
    const mockGroup = {
      name: "test",
      members: [
        {
          email: "user1@test.com",
          username: "user1",
        },
        {
          email: "user2@test.com",
          username: "user2",
        },
      ],
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });

    Group.findOne.mockResolvedValueOnce(mockGroup);
    Group.deleteOne.mockResolvedValueOnce(null);

    // Request object
    const mockReq = {
      params: {},
      body: {
        name: "test",
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/groups",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteGroup(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Wrong role",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});