import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import { User, Group } from "../models/User";

dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseController";
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

//necessary setup to ensure that each test can insert the data it needs
beforeEach(async () => {
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
});

/**
 * Alternate way to create the necessary tokens for authentication without using the website
 */
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


describe("createCategory", () => {
    // Farisan
    test("createCategories: Returns an object having an attribute type and color", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "cars", color: "yellow" });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(expect.objectContaining({ type: "cars", color: "yellow" }));
    });

    test("createCategories: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "cars" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createCategories: Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "cars", color: "" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createCategories: Returns a 400 error if the type of category passed in the request body represents an already existing category in the database", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "food", color: "yellow" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createCategories: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .post("/api/categories")
            .set(
                "Cookie",
                `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
            )
            .send({ type: "cars", color: "yellow" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String),
            })
        );
    });
});

describe("updateCategory", () => {
    // Farisan
    test("updateCategories: Returns an object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09",
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10",
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "foods", color: "red" });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.objectContaining({
                message: expect.any(String),
                count: 2,
            })
        );
    });

    test("updateCategories: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09",
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10",
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "foods" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("updateCategories: Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09",
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10",
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "foods", color: "" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("updateCategories: Returns a 400 error if the type of category passed as a route parameter does not represent a category in the database", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09",
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10",
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .patch("/api/categories/cars")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "foods", color: "yellow" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("updateCategories: Returns a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database and that category is not the same as the requested one", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09",
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10",
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "health", color: "red" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("updateCategories: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09",
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10",
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .patch("/api/categories/food")
            .set(
                "Cookie",
                `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
            )
            .send({ type: "food", color: "yellow" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String),
            })
        );
    });
});

describe("deleteCategory", () => {
    test("deleteCategories: Returns an object with an attribute `message` that confirms successful deletion and an attribute `count` that specifies the number of transactions that have had their category type changed", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
            {
                type: "cars",
                color: "yellow",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({ types: ["food"] });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.objectContaining(
                {
                    message: expect.any(String),
                    count: 2,
                },
            ),
        );
    });

    test("deleteCategories: If N > T then all transactions with a category to delete must have their category set to the oldest category that is not in T", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
            {
                username: "user1",
                type: "health",
                amount: 7000,
                date: "2022-06-11"
            },
            {
                username: "user1",
                type: "health",
                amount: 5500,
                date: "2022-06-12"
            }
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "cars",
                color: "yellow",
            },
            {
                type: "education",
                color: "green",
            },
            {
                type: "food",
                color: "red",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({ types: ["food", "health"] });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.objectContaining(
                {
                    message: expect.any(String),
                    count: 4,
                },
            ),
        );
    });

    //Need fix
    test("deleteCategories: If N = T then the oldest created category cannot be deleted and all transactions must have their category set to that category", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
            {
                username: "user1",
                type: "health",
                amount: 7000,
                date: "2022-06-11"
            },
            {
                username: "user1",
                type: "health",
                amount: 5500,
                date: "2022-06-12"
            },
            {
                username: "user1",
                type: "cars",
                amount: 6066,
                date: "2022-06-13"
            },
            {
                username: "user1",
                type: "education",
                amount: 2400,
                date: "2022-06-14"
            }
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "cars",
                color: "yellow",
            },
            {
                type: "education",
                color: "green",
            },
            {
                type: "food",
                color: "red",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({ types: ["food", "health", "cars", "education"] });

            expect(response.body.data).toEqual(
                expect.objectContaining(
                    {
                        message: expect.any(String),
                        count: 4, // 2 are already 'health' and will not be changed
                    },
                ),
            );
        expect(response.status).toBe(200);
    });

    test("deleteCategories: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "food",
                color: "red",
            },
            {
                type: "cars",
                color: "yellow",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteCategories: Returns a 400 error if called when there is only one category in the database", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "health",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "health",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({types: ["health"]});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteCategories: Returns a 400 error if at least one of the types in the array is an empty string", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "food",
                color: "red",
            },
            {
                type: "cars",
                color: "yellow",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({ types: [""]});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteCategories: Returns a 400 error if the array passed in the request body is empty", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "food",
                color: "red",
            },
            {
                type: "cars",
                color: "yellow",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({types:[]});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteCategories: Returns a 400 error if at least one of the types in the array does not represent a category in the database", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "food",
                color: "red",
            },
            {
                type: "cars",
                color: "yellow",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
            )
            .send({types: ["food", "education"]});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteCategories: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
        // Test group list
        const mockTransaction = [
            {
                username: "user1",
                type: "food",
                amount: 1000,
                date: "2022-06-09"
            },
            {
                username: "user1",
                type: "food",
                amount: 2500,
                date: "2022-06-10"
            },
        ];
        const mockCategories = [
            {
                type: "health",
                color: "blue",
            },
            {
                type: "food",
                color: "red",
            },
            {
                type: "cars",
                color: "yellow",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/categories")
            .set(
                "Cookie",
                `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
            )
            .send({types: ["food"]});

            expect(response.status).toBe(401);
            expect(response.body).toEqual(
                expect.objectContaining({
                    error: expect.any(String),
                })
            );
        });

})

describe("getCategories", () => {
    // Farisan
    test("getCategories: Returns an array of objects, each one having attributes type and color", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .get("/api/categories")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining(
                    {
                        type: "food",
                        color: "red",
                    },
                    {
                        type: "health",
                        color: "blue",
                    }
                ),
            ])
        );
    });

    test("getCategories: Returns a 401 error if called by a user who is not authenticated (authType = Simple)", async () => {
        // Test group list
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        // Populate the DB
        await categories.insertMany(mockCategories);

        // API Request
        const response = await request(app)
            .get("/api/categories")
            .set(
                "Cookie",
                `accessToken=${testerAccessTokenExpired}; refreshToken=${testerAccessTokenExpired}`
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

describe("createTransaction", () => {
    // Lorenzo
    test("createTransaction: Returns the created transactions, an object having attributes `username`, `type`, `amount` and `date`", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: "health",
                amount: 100,
            });


        expect(response.body.data).toEqual(
            expect.objectContaining({
                username: "tester",
                type: "health",
                amount: 100,
                date: expect.any(String),
            }),
        );

        expect(response.status).toBe(200);
    });

    test("createTransaction: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: "health",
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: " ",
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 400 error if the type of category passed in the request body does not represent a category in the database", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: "cars",
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 400 error if the username passed in the request body is not equal to the one passed as a route parameter", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "user1",
                type: "health",
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 400 error if the username passed in the request body does not represent a user in the database", async () => {
        const mockUsers = [
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: "health",
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async () => {
        const mockUsers = [
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: "health",
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted)", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "tester",
                type: "health",
                amount: "abf",
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("createTransaction: Returns a 401 error if called by an authenticated user who is not the same user as the one in the route parameter (authType = User)", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                username: "user1",
                type: "health",
                amount: 2.44,
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String),
            })
        );
    });
})

describe("getAllTransactions", () => {
    // Lorenzo
    test("getAllTransactions: Returns an array of all the transactions, each one having attributes `username`, `type`, `amount`, `date` and `color`", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .get("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              username: "tester",
              type: "food",
              color: "red",
              amount: 40,
              date: "2023-05-19T08:00:00.000Z",
            }),
            expect.objectContaining({
              username: "tester",
              type: "health",
              color: "blue",
              amount: -10,
              date: "2023-05-19T08:00:00.000Z",
            }),
            expect.objectContaining({
              username: "user1",
              type: "health",
              color: "blue",
              amount: 50,
              date: "2023-05-19T08:00:00.000Z",
            }),
          ])
        );
    });

    test("getAllTransactions: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .get("/api/transactions")
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

describe("getTransactionsByUser", () => {
    test('should return 200 and array of transactions ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                  username: "tester",
                  type: "food",
                  color: "red",
                  amount: 40,
                  date: "2023-05-19T08:00:00.000Z",
                }),
                expect.objectContaining({
                  username: "tester",
                  type: "health",
                  color: "blue",
                  amount: -10,
                  date: "2023-05-19T08:00:00.000Z",
                })
              ])
        );
    });

    test('should return 200 and array of transactions, filter amount ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get("/api/users/tester/transactions?max=50&min=0")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                  username: "tester",
                  type: "food",
                  color: "red",
                  amount: 40,
                  date: "2023-05-19T08:00:00.000Z",
                })
              ])
        );
    });

    test('should return 200 and array of transactions, filter date ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-04-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/users/tester/transactions?date=2023-05-19')
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "tester",
                    type: "health",
                    color: "blue",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });
    test('should return 200 and array of transactions, admin get from any user ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester')
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "tester",
                    type: "food",
                    color: "red",
                    amount: 40,
                    date: "2023-05-19T08:00:00.000Z",
                  }),
                expect.objectContaining({
                    username: "tester",
                    type: "health",
                    color: "blue",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });

    test('should return 400 error if the username passed as a route parameter does not represent a user in the database ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester2')
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send();

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is /api/users/:username/transactions', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/users/tester2/transactions')
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/users/:username', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester2')
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });
})

describe("getTransactionsByUserByCategory", () => {
    test('should return 200 and array of transactions filtered by category ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get("/api/users/tester/transactions/category/food")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                  username: "tester",
                  type: "food",
                  color: "red",
                  amount: 40,
                  date: "2023-05-19T08:00:00.000Z",
                })
              ])
        );
    });

    test('should return 200 and array of transactions, filtered by category and amount ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 400,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get("/api/users/tester/transactions/category/food?max=50&min=0")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                  username: "tester",
                  type: "food",
                  color: "red",
                  amount: 40,
                  date: "2023-05-19T08:00:00.000Z",
                })
              ])
        );
    });

    test('should return 200 and array of transactions, filtered by category and date ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-04-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/users/tester/transactions/category/food?date=2023-05-19')
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "tester",
                    type: "food",
                    color: "red",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });
    test('should return 200 and array of transactions filtered by category, admin get from any user ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester/category/food')
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "tester",
                    type: "food",
                    color: "red",
                    amount: 40,
                    date: "2023-05-19T08:00:00.000Z"
                  })
              ])
        );
    });

    test('should return 400 error if the username passed as a route parameter does not represent a user in the database ', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester2/category/food')
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send();

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 400 error if the category passed as a route parameter does not represent a category in the database', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester/category/food2')
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send();

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is /api/users/:username/transactions/category/:category', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/users/tester2/transactions/category/food')
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/users/:username/category/:category', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        const response = await request(app)
            .get('/api/transactions/users/tester2/category/food')
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });
})

describe("getTransactionsByGroup", () => {
    test('should return 200 and array of transactions filtered by group', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/groups/Family/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                  username: "tester",
                  type: "food",
                  color: "red",
                  amount: 40,
                  date: "2023-05-19T08:00:00.000Z",
                }),
                expect.objectContaining({
                    username: "tester",
                    type: "health",
                    color: "blue",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                }),
                expect.objectContaining({
                    username: "user1",
                    type: "health",
                    color: "blue",
                    amount: 50,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });

    test('should return 200 and array of transactions filtered by any group, admin', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/transactions/groups/Family")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                  username: "tester",
                  type: "food",
                  color: "red",
                  amount: 40,
                  date: "2023-05-19T08:00:00.000Z",
                }),
                expect.objectContaining({
                    username: "tester",
                    type: "health",
                    color: "blue",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                }),
                expect.objectContaining({
                    username: "user1",
                    type: "health",
                    color: "blue",
                    amount: 50,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });

    test('should return 400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/groups/Family2/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 400 error if the group name passed as a route parameter does not represent a group in the database, admin', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/transactions/groups/Family2")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is /api/groups/:name/transactions', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany([{
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          },
          {
            name: "Family2",
            members: [
              { email: "user2@test.com", id: 123}
            ],
          }]);

        const response = await request(app)
            .get("/api/groups/Family2/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/groups/:name', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany([{
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          },
          {
            name: "Family2",
            members: [
              { email: "user2@test.com", id: 123}
            ],
          }]);

        const response = await request(app)
            .get("/api/transactions/groups/Family2")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });
})

describe("getTransactionsByGroupByCategory", () => {
    test('should return 200 and array of transactions filtered by group and category', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/groups/Family/transactions/category/health")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "tester",
                    type: "health",
                    color: "blue",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                }),
                expect.objectContaining({
                    username: "user1",
                    type: "health",
                    color: "blue",
                    amount: 50,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });

    test('should return 200 and array of transactions filtered by any group and category, admin', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ]
          });

        const response = await request(app)
            .get("/api/transactions/groups/Family/category/health")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "tester",
                    type: "health",
                    color: "blue",
                    amount: -10,
                    date: "2023-05-19T08:00:00.000Z"
                }),
                expect.objectContaining({
                    username: "user1",
                    type: "health",
                    color: "blue",
                    amount: 50,
                    date: "2023-05-19T08:00:00.000Z"
                })
              ])
        );
    });

    test('should return 400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/groups/Family2/transactions/category/health")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/transactions/groups/Family2/category/health")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 400 error if the category passed as a route parameter does not represent a category in the database', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/groups/Family/transactions/category/health2")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 400 error if the category passed as a route parameter does not represent a category in the database, admin', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            },
            {
                email: "admin@email.com",
                username: "admin",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany({
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          });

        const response = await request(app)
            .get("/api/transactions/groups/Family/category/health2")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is /api/groups/:name/transactions/category/:category', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany([{
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          },
          {
            name: "Family2",
            members: [
              { email: "user2@test.com", id: 123}
            ],
          }]);

        const response = await request(app)
            .get("/api/groups/Family2/transactions/category/health")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });

    test('should return 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/groups/:name/category/:category', async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            },
            {
                email: "user2@test.com",
                username: "user2",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];
        
        const mockTransaction = [
            {
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                username: "user2",
                type: "health",
                color: "blue",
                amount: 500,
                date: "2023-05-19T08:00:00.000Z"
            }
        ];
        
        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);
        await Group.insertMany([{
            name: "Family",
            members: [
              { email: "tester@test.com", id: 123 },
              { email: "user1@test.com", id: 123}
            ],
          },
          {
            name: "Family2",
            members: [
              { email: "user2@test.com", id: 123}
            ],
          }]);

        const response = await request(app)
            .get("/api/transactions/groups/Family2/category/health")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String)
            })
        );
    });
})

describe("deleteTransaction", () => {
    // Lorenzo
    test("deleteTransaction: [ADMIN] Returns a string indicating successful deletion of the transaction", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _id: "646890f680e56ce0bcbfd16c"
            });

        expect(response.body.data).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
        expect(response.status).toBe(200);

    });

    test("deleteTransaction: [USER] Returns a string indicating successful deletion of the transaction", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                _id: "646890f680e56ce0bcbfd16c"
            });
            
        expect(response.body.data).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
        expect(response.status).toBe(200);

    });

    test("deleteTransaction: Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );

    });

    test("deleteTransaction: Returns a 400 error if the `_id` in the request body is an empty string", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                _id: " "
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteTransaction: Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/user4/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _id: " "
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteTransaction: Returns a 400 error if the `_id` in the request body does not represent a transaction in the database", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _id: "646890f680e56ce0bcbfd140"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteTransaction: Returns a 400 error if the `_id` in the request body represents a transaction made by a different user than the one in the route", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/tester/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _id: "646890f680e56ce0bcbfd16b"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("deleteTransaction: Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                _id: "646890f680e56ce0bcbfd16b"
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                error: expect.any(String),
            })
        );
    });

})

describe("deleteTransactions", () => {
    // Lorenzo
    test("deleteTransactions: Returns a string indicating successful deletion of the transactions", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _ids: ["646890f680e56ce0bcbfd16c", "646890f680e56ce0bcbfd16b"]
            });

        expect(response.body.data).toEqual(
            expect.objectContaining({
                message: "Successfully deleted transactions.",
            })
        );
        expect(response.status).toBe(200);

    });

    test("deleteTransactions: 400 error if the request body does not contain all the necessary attributes", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ });

        expect(response.body).toEqual(
            expect.objectContaining({
                message: "Must specify an array of transactions to delete.",
            })
        );
        expect(response.status).toBe(400);

    });

    test("deleteTransactions: Returns a 400 error if at least one of the ids in the array is an empty string", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _ids: [" ", "646890f680e56ce0bcbfd16b"]
            });

        expect(response.body).toEqual(
            expect.objectContaining({
                message: "\'id\' field cannot be empty.",
            })
        );
        expect(response.status).toBe(400);

    });
    
    test("deleteTransactions: Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({
                _ids: ["646890f680e56ce0bcbfd165", "646890f680e56ce0bcbfd16b"]
            });

        expect(response.body).toEqual(
            expect.objectContaining({
                message: "One or more transactions in the list do not exist.",
            })
        );
        expect(response.status).toBe(400);

    });

    test("deleteTransactions: Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
        const mockUsers = [
            {
                email: "tester@test.com",
                username: "tester",
                password: "securePass",
            },
            {
                email: "user1@test.com",
                username: "user1",
                password: "securePass",
            }
        ]
        
        const mockCategories = [
            {
                type: "food",
                color: "red",
            },
            {
                type: "health",
                color: "blue",
            },
        ];

        const mockTransaction = [
            {
                _id: "646890f680e56ce0bcbfd16c",
                username: "tester",
                type: "food",
                color: "red",
                amount: 40,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16a",
                username: "tester",
                type: "health",
                color: "blue",
                amount: -10,
                date: "2023-05-19T08:00:00.000Z"
            },
            {
                _id: "646890f680e56ce0bcbfd16b",
                username: "user1",
                type: "health",
                color: "blue",
                amount: 50,
                date: "2023-05-19T08:00:00.000Z"
            },
        ];

        // Populate the DB
        await User.insertMany(mockUsers);
        await categories.insertMany(mockCategories);
        await transactions.insertMany(mockTransaction);

        // API Request
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({
                _ids: ["646890f680e56ce0bcbfd16c", "646890f680e56ce0bcbfd16b"]
            });

        expect(response.body).toEqual(
            expect.objectContaining({
                error: "Wrong role",
            })
        );
        expect(response.status).toBe(401);

    });

})
