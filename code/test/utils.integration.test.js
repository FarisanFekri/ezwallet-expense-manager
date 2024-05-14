import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';

dotenv.config()

beforeEach(() => {
    jest.resetAllMocks()
});

const testerAccessTokenValid = jwt.sign(
    {
      email: "tester@test.com",
      username: "tester",
      role: "Regular",
      id: "123" 
    },
    process.env.ACCESS_KEY,
    { expiresIn: "300d" }
  );

  const accessToken = jwt.sign({
    email: "admin@example.com",
    id: "1",
    username: "admin",
    role: "Admin"
  }, process.env.ACCESS_KEY, { expiresIn: '0s' })
  
  //CREATE REFRESH TOKEN
  const refreshToken = jwt.sign({
    email: "admin@example.com",
    id: "1",
    username: "admin",
    role: "Admin"
  }, process.env.ACCESS_KEY, { expiresIn: '0s' })

const testerAccessTokenExpired = jwt.sign(
  {
    email: "tester@test.com",
    username: "tester",
    role: "Regular",
    id: "123" 
  },
  process.env.ACCESS_KEY,
  { expiresIn: "0s" }
);

const testerRefreshTokenExpired = jwt.sign(
    {
      email: "tester@test.com",
      username: "tester",
      role: "Regular",
      id: "123" 
    },
    process.env.ACCESS_KEY,
    { expiresIn: "0s" }
  );

describe("handleDateFilterParams", () => { 
    test('return empty object if no params specified', async () => {
        const mockReq = { query: {}};

        const response = handleDateFilterParams(mockReq);
        expect(response).toEqual({});
    });

    test('return error if params date is present with upTo', async () => {
        const mockReq = { query: {date: "2023-05-17", upTo:"2023-05-20"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return error if params date is present with from', async () => {
        const mockReq = { query: {date: "2023-05-17", from:"2023-05-20"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return error if from and upTo are present but from is NAN', async () => {
        const mockReq = { query: {from:"abc", upTo:"2023-05-18"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return error if from and upTo are present but upTo is NAN', async () => {
        const mockReq = { query: {from:"2023-05-18", upTo:"abc"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return error if from and upTo are present but from is greather than upTo', async () => {
        const mockReq = { query: {from:"2023-05-18", upTo:"2023-05-15"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return interval dates object if from and upTo are present and not NAN', async () => {
        const mockReq = { query: {from:"2023-05-15", upTo:"2023-05-20"}};

        const response = handleDateFilterParams(mockReq);
        expect(response).toEqual({date:{$gte : new Date("2023-05-15"), $lte : new Date("2023-05-20T23:59:59.999Z")}});
    });

    test('return error if there is only from and is NAN', async () => {
        const mockReq = { query: {from:"abc"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return gte object if there is only from and not NAN', async () => {
        const mockReq = { query: {from:"2023-05-15"}};

        const response = handleDateFilterParams(mockReq);
        expect(response).toEqual({date:{$gte : new Date("2023-05-15")}});
    });

    test('return error if there is only upTo and is NAN', async () => {
        const mockReq = { query: {upTo:"abc"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return lte object if there is only upTo and not NAN', async () => {
        const mockReq = { query: {upTo:"2023-05-15"}};

        const response = handleDateFilterParams(mockReq);
        expect(response).toEqual({date:{$lte : new Date("2023-05-15T23:59:59.999Z")}});
    });

    test('return error if there is only date and is NAN', async () => {
        const mockReq = { query: {date:"abc"}};

        expect(()=>handleDateFilterParams(mockReq)).toThrow(Error("Invalid Date"));
    });

    test('return interval dates object if there is only date and not NAN', async () => {
        const mockReq = { query: {date:"2023-05-15"}};

        const response = handleDateFilterParams(mockReq);
        expect(response).toEqual({date:{$gte : new Date("2023-05-15"), $lte : new Date("2023-05-15T23:59:59.999Z")}});
    });
})

describe("verifyAuth", () => { 
    test('return error if accessToken is missing', async () => {
        const mockReq = { cookies: {refreshToken: "11111111"}};

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Unauthorized" });
    });

    test('Return error refreshToken & accessToken are expired', () => {
        const mockRes ={
            
        }
        const mockReq ={cookies:{accessToken: accessToken, refreshToken: refreshToken}}
        const response = verifyAuth(mockReq,mockRes)  
        expect(response).toEqual({ authorized: false, message: "Perform login again" });
    });

    test("accessToken Expired, refreshed", async () => {
        const mockReq = { cookies: {accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenValid}};
        const info = {authType: "Regular"}

        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options}
        }
        let res = {
            cookie: cookieMocked,
            locals: {}
        }

        res = verifyAuth(mockReq, res, info);
        expect(res).toEqual({ authorized: true, message: "Authorized"});
    });

    test('return error if refreshToken is missing', async () => {
        const mockReq = { cookies: {accessToken: "11111111"}};

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Unauthorized" });
    });

    test('return error if decodedAccessToken is missing (username)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        jwt.verify = jest.fn().mockResolvedValue(mockDecodedAccessToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Token is missing information" });
    });

    test('return error if decodedAccessToken is missing (email)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            role: "Regular"
        }

        jwt.verify = jest.fn().mockResolvedValue(mockDecodedAccessToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Token is missing information" });
    });

    test('return error if decodedAccessToken is missing (role)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
        }

        jwt.verify = jest.fn().mockResolvedValue(mockDecodedAccessToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Token is missing information" });
    });

    test('return error if decodedRefreshToken is missing (username)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Token is missing information" });
    });

    test('return error if decodedRefreshToken is missing (email)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            role: "Regular"
        }

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Token is missing information" });
    });

    test('return error if decodedRefreshToken is missing (role)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com"
        }

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Token is missing information" });
    });

    test('return error if decodedRefreshToken is different from decodedAccessToken (username)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario2",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Mismatched users" });
    });

    test('return error if decodedRefreshToken is different from decodedAccessToken (email)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario2.red@gmail.com",
            role: "Regular"
        }

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Mismatched users" });
    });

    test('return error if decodedRefreshToken is different from decodedAccessToken (role)', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Admin"
        }

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq);
        expect(response).toEqual({ authorized: false, message: "Mismatched users" });
    });

    test('return error if decodedRefreshToken.role is different from info.authtype and info.authtype not group', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const info = {authType: "Admin"}

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq, {}, info);
        expect(response).toEqual({ authorized: false, message: "Wrong role" });
    });

    test('return error if decodedRefreshToken.email is different from info.email', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const info = {authType: "Regular", email: "mario2.red@gmail.com"}

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq, {}, info);
        expect(response).toEqual({ authorized: false, message: "Mismatched users, accessed one requires for another" });
    });

    test('return error if decodedRefreshToken.username is different from info.username', async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const info = {authType: "Regular", username: "Mario2"}

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq, {}, info);
        expect(response).toEqual({ authorized: false, message: "Mismatched users, accessed one requires for another" });
    });

    test("return error if decodedRefreshToken.email isn't in info.emailInGroup (for user who has to require for his group) ", async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const info = {authType: "Regular", emailInGroup: ["mario2.red@gmail.com", "mario3.red@gmail.com"]}

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq, {}, info);
        expect(response).toEqual({ authorized: false, message: "User can add-remove-get only in his group" });
    });

    test("return email and id of decodedRefreshToken if info.authType is Group ", async () => {
        const mockReq = { cookies: {accessToken: "11111111", refreshToken: "11111111"}};

        const mockDecodedAccessToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Mario",
            email: "mario.red@gmail.com",
            role: "Regular",
            id: "111"
        }

        const info = {authType: "Group"}

        jwt.verify = jest.fn().mockReturnValueOnce(mockDecodedAccessToken)
        .mockReturnValueOnce(mockDecodedRefreshToken);

        const response = verifyAuth(mockReq, {}, info);
        expect(response).toEqual({ authorized: true, email: "mario.red@gmail.com", id:"111" });
    });

})

describe("handleAmountFilterParams", () => { 
    test('return empty object if no params specified', async () => {
        const mockReq = { query: {}};

        const response = handleAmountFilterParams(mockReq);
        expect(response).toEqual({});
    });

    test('return error if max and min are present but max is NAN', async () => {
        const mockReq = { query: {max:"abc", min:"2023-05-18"}};

        expect(()=>handleAmountFilterParams(mockReq)).toThrow(Error("Invalid Parameters"));
    });

    test('return error if max and min are present but min is NAN', async () => {
        const mockReq = { query: {max:"2023-05-18", min:"abc"}};

        expect(()=>handleAmountFilterParams(mockReq)).toThrow(Error("Invalid Parameters"));
    });

    test('return error if max and min are present but min is greather than max', async () => {
        const mockReq = { query: {max:"200", min:"2000"}};

        expect(()=>handleAmountFilterParams(mockReq)).toThrow(Error("Invalid Parameters"));
    });

    test('return amount interval object if max and min are present and numbers', async () => {
        const mockReq = { query: {max:"2500", min:"2000"}};

        const response = handleAmountFilterParams(mockReq);
        expect(response).toEqual({amount: {$gte: 2000, $lte: 2500}});
    });

    test('return error if there is only min but is NAN', async () => {
        const mockReq = { query: {min:"abc"}};

        expect(()=>handleAmountFilterParams(mockReq)).toThrow(Error("Invalid Parameters"));
    });

    test('return interval if there is only min and non NAN', async () => {
        const mockReq = { query: {min:2000}};

        const response = handleAmountFilterParams(mockReq);
        expect(response).toEqual({amount: {$gte: 2000}});
    });

    test('return error if there is only max but is NAN', async () => {
        const mockReq = { query: {max:"abc"}};

        expect(()=>handleAmountFilterParams(mockReq)).toThrow(Error("Invalid Parameters"));
    });

    test('return interval if there is only max and non NAN', async () => {
        const mockReq = { query: {max:2000}};

        const response = handleAmountFilterParams(mockReq);
        expect(response).toEqual({amount: {$lte: 2000}});
    });
})
