import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import { verifyAuth, handleAmountFilterParams, handleDateFilterParams} from '../controllers/utils.js';
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  getCategories,
  getAllTransactions,
  getTransactionsByUser,
  deleteCategory,
  getTransactionsByUserByCategory,
  deleteTransactions,
  getTransactionsByGroup,
  getTransactionsByGroupByCategory,
  updateCategory,
} from "../controllers/controller.js";
import { User, Group } from "../models/User";

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
  handleAmountFilterParams: jest.fn(),
  handleDateFilterParams: jest.fn()
}))

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  jest.resetAllMocks()
});

describe("createCategory", () => {
  // Lorenzo
  test("createCategory: Creates a new category and returns type and color", async () => {
    // Mocked category
    const mockCategory = {
      type: "test",
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(null);
    categories.prototype.save.mockReturnValueOnce(mockCategory);

    // Request object
    const mockReq = {
      params: {},
      body: mockCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await createCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining(mockCategory),
      })
    );
  });

  test("createCategory: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    // Mocked category
    const mockCategory = {
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(null);
    categories.prototype.save.mockReturnValueOnce(mockCategory);

    // Request object
    const mockReq = {
      params: {},
      body: mockCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await createCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "\'type\' field cannot be empty."
      })
    );
  });

  test("createCategory: Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
    // Mocked category
    const mockCategory = {
      type: "test",
      color: "",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(null);
    categories.prototype.save.mockReturnValueOnce(mockCategory);

    // Request object
    const mockReq = {
      params: {},
      body: mockCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await createCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "\'color\' field cannot be empty."
      })
    );
  });

  test("createCategory: Returns a 400 error if the type of category passed in the request body represents an already existing category in the database", async () => {
    // Mocked category
    const mockCategory = {
      type: "test",
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(1);
    categories.prototype.save.mockReturnValueOnce(mockCategory);

    // Request object
    const mockReq = {
      params: {},
      body: mockCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await createCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Category test already exists."
      })
    );
  });
  
  test("createCategory: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    // Mocked category
    const mockCategory = {
      type: "test",
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    categories.findOne.mockResolvedValueOnce(null);
    categories.prototype.save.mockReturnValueOnce(mockCategory);

    // Request object
    const mockReq = {
      params: {},
      body: mockCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await createCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Wrong role"
      })
    );
  });

});

describe("updateCategory", () => {
  // Lorenzo
  test("updateCategory: Returns a message for confirmation and the number of updated transactions", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      type: "newtest",
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockOldCategory);
    categories.findOne.mockResolvedValueOnce(null);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.any(String),
          count: 2,
        }),
      })
    );
  });

  test("updateCategory: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockOldCategory);
    categories.findOne.mockResolvedValueOnce(null);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "\'type\' field cannot be empty."
      })
    );
  });

  test("updateCategory: Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      type: "newtest",
      color: "",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockOldCategory);
    categories.findOne.mockResolvedValueOnce(null);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "\'color\' field cannot be empty."
      })
    );
  });

  test("updateCategory: Returns a 400 error if the type of category passed as a route parameter does not represent a category in the database", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      type: "newtest",
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(null);
    categories.findOne.mockResolvedValueOnce(null);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Category test does not exist."
      })
    );
  });

  test("updateCategory: Returns a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database and that category is not the same as the requested one", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      type: "newtest",
      color: "white",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockOldCategory);
    categories.findOne.mockResolvedValueOnce(mockNewCategory);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Category newtest already exists."
      })
    );
  });

  test("updateCategory: Returns a message for confirmation and the number of updated transactions, with same category name", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      type: "test",
      color: "black",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockOldCategory);
    categories.findOne.mockResolvedValueOnce(mockNewCategory);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.any(String),
          count: 2,
        }),
      })
    );
  });

  test("updateCategory: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    // Mocked category
    const mockOldCategory = {
      type: "test",
      color: "white",
    };

    const mockNewCategory = {
      type: "newtest",
      color: "black",
    };

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    categories.findOne.mockResolvedValueOnce(mockOldCategory);
    categories.findOne.mockResolvedValueOnce(null);

    categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: { type: "test" },
      body: mockNewCategory,
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories/test",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await updateCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Wrong role"
      })
    );
  });

});

describe("deleteCategory", () => {
  // Lorenzo
  test("deleteCategory: Delete all the categories specified inside types, case N > T", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    const mockAllCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
      {
        type: "health",
        color: "red",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockAllCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: ["test", "food"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.any(String),
          count: 2,
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("deleteCategory: Delete all the categories specified inside types, case N = T", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: ["test", "food"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.any(String),
          count: 2,
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("deleteCategory: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    const mockAllCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
      {
        type: "health",
        color: "red",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockAllCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Must specify an array of categories to delete.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteCategory: Returns a 400 error if called when there is only one category in the database", async () => {
    // Mocked category
    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.findOne.mockResolvedValueOnce(mockDelCategories);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: ["test"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Cannot remove with only one existing category.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteCategory: Returns a 400 error if at least one of the types in the array is an empty string", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    const mockAllCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
      {
        type: "health",
        color: "red",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockAllCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: [" ", "test"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "'type' field cannot be empty.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteCategory: Returns a 400 error if the array passed in the request body is empty", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    const mockAllCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
      {
        type: "health",
        color: "red",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockAllCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: [],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "'type' field cannot be empty.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteCategory: Returns a 400 error if at least one of the types in the array does not represent a category in the database", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    const mockAllCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
      {
        type: "health",
        color: "red",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockAllCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: ["test", "investment"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "One or more categories in the list do not exist.",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteCategory: Returns a 400 error if at least one of the types in the array does not represent a category in the database", async () => {
    // Mocked category
    const firstCategory = {
      type: "test",
      color: "white",
    };

    const mockDelCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
    ];

    const mockAllCategories = [
      {
        type: "test",
        color: "white",
      },
      {
        type: "food",
        color: "green",
      },
      {
        type: "health",
        color: "red",
      },
    ];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    categories.find.mockResolvedValueOnce(mockDelCategories);
    categories.find.mockResolvedValueOnce(mockAllCategories);
    categories.findOne.mockResolvedValueOnce(firstCategory);

    categories.deleteMany.mockResolvedValueOnce(null);
    transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

    // Request object
    const mockReq = {
      params: {},
      body: {
        types: ["test"],
      },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await deleteCategory(mockReq, mockRes);

    // Expected results
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Wrong role",
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

describe("getCategories", () => {
  // Lorenzo
  test("getCategories: Get all the categories by returning an array of objects, each one having attributes type and color", async () => {
    // Mocked category
    const mockCategories = [{
      type: "food",
      color: "white",
    },
    {
      type: "family",
      color: "green",
    }];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.find.mockResolvedValueOnce(mockCategories);

    // Request object
    const mockReq = {
      params: { },
      body: { },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getCategories(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockCategories
      })
    );
  });

  test("getCategories: Returns a 401 error if called by a user who is not authenticated (authType = Simple)", async () => {
    // Mocked category
    const mockCategories = [{
      type: "food",
      color: "white",
    },
    {
      type: "family",
      color: "green",
    }];

    // Mocks
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    categories.find.mockResolvedValueOnce(mockCategories);

    // Request object
    const mockReq = {
      params: { },
      body: { },
      cookies: {
        accessToken: "validAccessToken",
        refreshToken: "validRefreshToken",
      },
      url: "/api/categories",
    };

    // Response object
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };

    // Function Call
    await getCategories(mockReq, mockRes);

    // Expected results
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Wrong role"
      })
    );
  });

});

//DONE: Giancarlo
describe("createTransaction", () => {

  test("createTransaction: return 200 and response: (username, type, amount and date)", async () => {
    // -------- Mocked items --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{ username: "Mario",amount: 100, type: "food"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Mario/transactions",
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining(mockTransaction)})
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
    
  test("createTransaction: Returns a 400 error if request body does not contain all necessary attributes", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white"};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{},      //DA QUA HO LEVATO IL CONTENUTO DEL BODY
      cookies: {  accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/user/Mario/transactions",
    };
    // -------- Response object --------
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: { refreshedTokenMessage: "" },
    };
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.status).toHaveBeenCalledWith(400);                                 // AGGIUSTATO IL VALORE DI STATUS
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "\'username\' field cannot be empty."})      //HO CAMBIATO IL CONTENUTO ATTESO
    );
  });
    
  test("createTransaction: Returns a 400 error if at least one parameter in request body is an empty string", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{ username: "",amount: 100, type: "food"},       //MARIO ---> STRINGA VUOTA
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Mario/transactions",
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "\'username\' field cannot be empty." })
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("createTransaction: Returns a 400 error if the type of category passed in the request body does not represent a category in the database", async () => {
     // -------- Mocked category --------
     const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
     const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
     const mockCategory = null;
     // -------- Mocks ---------
     verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
     verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
     categories.findOne.mockResolvedValueOnce(mockCategory);
     User.findOne.mockResolvedValueOnce(mockUser);
     transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
     // -------- Request object --------
     const mockReq = {
       params: { username : "Mario" },
       body:{ username: "Mario",amount: 100, type: "food"},
       cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
       url: "/api/user/Mario/transactions",
     };
     // -------- Response object --------
     const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
     // -------- Function Call --------
     await createTransaction(mockReq, mockRes);
     // -------- Expected results  -------- 
     expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "Category food does not exist."})
     );
     expect(mockRes.status).toHaveBeenCalledWith(400);
   });

  test("createTransaction: Returns a 400 error if the username passed in the request body is not equal to the one passed as a route parameter", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Pippo", email: "pippo@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Pippo" },           //MARIO --> PIPPO
      body:{ username: "Mario",amount: 100, type: "food"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Pippo/transactions",
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "Username in params and the one in body have to be the same."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
  
  test("createTransaction: Returns a 400 error if the username passed in the request body does not represent a user in the database", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = null       //mock USER --> NULL
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{ username: "Mario",amount: 100, type: "food"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Mario/transactions",
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "User not found."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
  
  test("createTransaction: Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Mismatched users, accessed one requires for another" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(null);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{ username: "Mario",amount: 100, type: "food"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Pippo/transactions",     //MARIO --> PIPPO 
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({message: "User not found."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });       

  test("createTransaction: Returns a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted)", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{ username: "Mario",amount: "centodiciotto", type: "food"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Mario/transactions",
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "\'amount\' field must be a number."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("createTransaction: Returns a 401 error if called by an authenticated user who is not the same user as the one in the route parameter (authType = User)", async () => {
    // -------- Mocked category --------
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food",color: "white",};
    // -------- Mocks ---------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" }); //una per ogni verAuth
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    categories.findOne.mockResolvedValueOnce(mockCategory);
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.prototype.save.mockReturnValueOnce(mockTransaction);//la safe è sempre prototype
    // -------- Request object --------
    const mockReq = {
      params: { username : "Mario" },
      body:{ username: "Mario",amount: 100, type: "food"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/user/Mario/transactions",
    };
    // -------- Response object --------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // -------- Function Call --------
    await createTransaction(mockReq, mockRes);
    // -------- Expected results  -------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Wrong role"})
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

//DONE: Giancarlo
describe("getAllTransactions", () => {

  test("getAllTransactions: return 200 and json with all transaction" ,async()=>{
    // -------- Mocked items --------
    const mockTransactions = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", categories_info: {color: "green"}},
      {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", categories_info:{color: "red"}}
    ];

    const mockReturnValue = mockTransactions.map((element) => {
      const { categories_info, ...rest } = element;
      return {
        ...rest,
        color: categories_info.color
      };
    });
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized" });
    transactions.aggregate.mockResolvedValueOnce(mockTransactions);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await getAllTransactions(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({data: mockReturnValue, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("getAllTransactions: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)",async () => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", categories_info: {color: "green"}},
      {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", categories_info: {color: "red"}}
    ];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await getAllTransactions(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Wrong role"})
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

describe("getTransactionsByUser", () => {
  test("getTransactionsByUser: return 200 and json with all transaction", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", categories_info: {color: "green"}}
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    User.findOne.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await getTransactionsByUser(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}] , refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("getTransactionsByUser: Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", categories_info: {color: "green"}}
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    User.findOne.mockResolvedValueOnce(null);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await getTransactionsByUser(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "User not found."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("getTransactionsByUser:  Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is /api/users/:username/transactions", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", categories_info: {color: "green"}}
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({authorized: false, message: "Mismatched users"});
    User.findOne.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await getTransactionsByUser(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Mismatched users"})
    );  
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/users/:username", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
      {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", categories_info: {color: "green"}}
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await getTransactionsByUser(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Wrong role"})
    );  
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

});

describe("getTransactionsByUserByCategory", () => {

  test("getTransactionsByUserByCategory: return 200 and json with all transaction", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food", color: "red"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    User.findOne.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByUserByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}] , refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
      );  
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test("getTransactionsByUserByCategory: Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food", color: "red"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    User.findOne.mockResolvedValueOnce(null);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByUserByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "User not found."})
      );  
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("getTransactionsByUserByCategory: Returns a 400 error if the category passed as a route parameter does not represent a category in the database", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food", color: "red"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    User.findOne.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(null);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByUserByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Category does not exist."})
      );  
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("getTransactionsByUserByCategory: Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is /api/users/:username/transactions/category/:category", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food", color: "red"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Mismatched users"});
    User.findOne.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByUserByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error" : "Mismatched users"})
      );  
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test("getTransactionsByUserByCategory: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/users/:username/category/:category", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockCategory = {type: "food", color: "red"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByUserByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error" : "Wrong role"})
      );  
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

describe("getTransactionsByGroup", () => {

  test("getTransactionsByGroup: return 200 and json with all transaction", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/groups/Mario/transactions"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroup(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}] , refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
      );  
  });

  test("getTransactionsByGroup: Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    Group.findOne.mockResolvedValueOnce(null);
    User.find.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/groups/Mario/transactions"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroup(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Group does not exist."})
      );  
  });

  test("getTransactionsByGroup: Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is /api/groups/:name/transactions", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    // ----------- Mocks ------------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Mismatched users"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/groups/Mario/transactions"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroup(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Mismatched users"})
      );  
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test("getTransactionsByGroup: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/groups/:name", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    // ----------- Mocks ------------
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/groups/Mario/transactions"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroup(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Wrong role"})
      );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

});

describe("getTransactionsByGroupByCategory", () => {
  test("getTransactionsByGroup: return 200 and json with all transaction", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    const mockCategory = {type: "food",color: "red",};

    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroupByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}] , refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
      );  
  });

  test("getTransactionsByGroupByCategory: Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    const mockCategory = {type: "food",color: "red",};

    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    Group.findOne.mockResolvedValueOnce(null);
    User.find.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroupByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Group does not exist." })
      );  
  });

  test("getTransactionsByGroupByCategory: Returns a 400 error if the category passed as a route parameter does not represent a category in the database", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    const mockCategory = {type: "food",color: "red",};

    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(null);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroupByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Category does not exist."})
    );
    });

  test("getTransactionsByGroupByCategory: Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is /api/groups/:name/transactions/category/:category", async() => {
    // -------- Mocked items --------
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    const mockCategory = {type: "food",color: "red",};

    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Mismatched users"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroupByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Mismatched users"})
    );
  });

  test("getTransactionsByGroupByCategory: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/groups/:name/category/:category", async() => {
    const mockReturnValue = [
      {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", categories_info: {color: "red"}}, 
    ];
    const mockGroups = {name: "nameofG",members: [{email: "mario.red@email.com",user: "mario",}]};
    const mockUser = [{username: "Mario", email: "mario.red@email.com", password: "securePass"}];
    const mockCategory = {type: "food",color: "red",};

    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    Group.findOne.mockResolvedValueOnce(mockGroups);
    User.find.mockResolvedValueOnce(mockUser);
    categories.findOne.mockResolvedValueOnce(mockCategory);
    handleAmountFilterParams.mockReturnValueOnce({filter: {amount: { $gte : "1", $lte : "100"}}});
    handleDateFilterParams.mockReturnValueOnce({filter: {date: { $gte : "2024-05-19T10:00:00", $lte : "2021-05-19T10:00:00"}}})
    transactions.aggregate.mockResolvedValueOnce(mockReturnValue);
    // ------- Request object -------
    const mockReq = {
      params: {username: "Mario", category: "food"},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/users/Mario/transactions/category/food"
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage:""}};
    // ------- Function Call --------
    await getTransactionsByGroupByCategory(mockReq, mockRes);
    // ----- Expected results ------- 
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Wrong role"})
    );
  });

});

//DONE: Giancarlo
describe("deleteTransaction", () => {

  test("deleteTransaction: status 200 and transaction deleted ", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.findOne.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{_id: "6hjkohgfc8nvu786"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: {message: "Transaction deleted"}, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });  
  
  test("deleteTransaction: Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.findOne.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{},              //HO LEVATO IL BODY
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "\'id\' field cannot be empty."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });  
  
  test("deleteTransaction: Returns a 400 error if the `_id` in the request body is an empty string", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.findOne.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{_id: ""},              //_id STRINGA VUOTA
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "\'id\' field cannot be empty."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });  
  
  test("deleteTransaction: Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(null);
    transactions.findOne.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Pippo"}, //MARIO --> PIPPO
      body:{_id: "6hjkohgfc8nvu786"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "User "+mockReq.params.username+" does not exist."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });  

  test("deleteTransaction: Returns a 400 error if the `_id` in the request body does not represent a transaction in the database", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.findOne.mockResolvedValueOnce(null);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{_id: "6hjkohgfc8nvu786"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "Transaction not found."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
  
  test("deleteTransaction: [ADMIN] Returns a 400 error if the `_id` in the request body represents a transaction made by a different user than the one in the route", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Peppe", email: "peppe@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role"});
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.findOne.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Peppe"},
      body:{_id: "6hjkohgfc8nvu786"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({message: "Username in params and the one in body have to be the same."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("deleteTransaction: Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)", async() => {
    // -------- Mocked items --------
    const mockUser = {username: "Mario", email: "mario.red@email.com", password: "securePass"};
    const mockTransaction = {username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"};
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Mismatched users"});
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Mismatched users"});
    User.findOne.mockResolvedValueOnce(mockUser);
    transactions.findOne.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {username: "Mario"},
      body:{_id: "6hjkohgfc8nvu786"},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransaction(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({error: "Mismatched users"})
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
   });

});

//DONE: Giancarlo
describe("deleteTransactions", () => {
  test("deleteTransactions: Return status 200 and deleted transactions", async() => {
    // -------- Mocked items --------
    const mockTransaction = [{username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    transactions.find.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{
        _ids: ["6hjkohgfc8nvu786"]
      },
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransactions(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: {message: "Successfully deleted transactions."}, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
      );
    expect(mockRes.status).toHaveBeenCalledWith(200);
   });

  test("deleteTransactions: Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
    // -------- Mocked items --------
    const mockTransaction = [{username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    transactions.find.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{},
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransactions(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"message": "Must specify an array of transactions to delete."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
   });

   test("deleteTransactions: Returns a 400 error if at least one of the ids in the array is an empty string", async() => {
    // -------- Mocked items --------
    const mockTransaction = [{username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    transactions.find.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{
        _ids: [""]
      },
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransactions(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"message": "'id' field cannot be empty."})
    );
    expect(mockRes.status).toHaveBeenCalledWith(400);
   });

   test("deleteTransactions: Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database", async() => {
    // -------- Mocked items --------
    const mockTransaction = [{username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: true, message: "Authorized"});
    transactions.find.mockResolvedValueOnce(null);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{
        _ids: ["6hjkohgfc8nvu786", ""]
      },
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransactions(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"message": "'id' field cannot be empty."})
      );
    expect(mockRes.status).toHaveBeenCalledWith(400);
   });

  test("deleteTransactions: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async() => {
    // -------- Mocked items --------
    const mockTransaction = [{username: "Mario",amount: 100,type: "food",date: "2023-05-19T00:00:00"}];
    // ----------- Mocks ------------ 
    verifyAuth.mockReturnValueOnce({ authorized: false, message: "Wrong role" });
    transactions.find.mockResolvedValueOnce(mockTransaction);
    // ------- Request object -------
        const mockReq = {
      params: {},
      body:{
        _ids: ["6hjkohgfc8nvu786"]
      },
      cookies: {accessToken: "validAccessToken",refreshToken: "validRefreshToken"},
      url: "/api/transactions",
    };
    // ------ Response object -------
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn(), locals: { refreshedTokenMessage: "" }};
    // ------- Function Call --------
    await deleteTransactions(mockReq, mockRes);
    // ----- Expected results -------
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({"error": "Wrong role"})
      );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});