import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { verifyAuth } from './utils.js';

/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const register = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !username.trim()) {
            return res.status(400).json({error: "\'username\' field cannot be empty."});
        }
        if (!email || !email.trim()) {
            return res.status(400).json({error: "\'email\' field cannot be empty."});
        }
        if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
            // REGEX to test if the string is an email
            return res.status(400).json({error: "Wrong email format."});
        }
        if (!password || !password.trim()) {
            return res.status(400).json({error: "\'password\' field cannot be empty."});
        }

        // Check if already registered
        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
            return res.status(400).json({ error: "You are already registered." });
        }

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: "An user with that username already exists." });
        }

        // Register User
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        res.status(200).json({data: {message: "User added successfully"}});
    } catch (err) {
        res.status(500).json(err);
    }
};

/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
export const registerAdmin = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const { username, email, password } = req.body

        // Input validation
        if (!username || !username.trim()) {
            return res.status(400).json({error: "\'username\' field cannot be empty."});
        }
        if (!email || !email.trim()) {
            return res.status(400).json({error: "\'email\' field cannot be empty."});
        }
        if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
            // REGEX to test if the string is an email
            return res.status(400).json({error: "Wrong email format."});
        }
        if (!password || !password.trim()) {
            return res.status(400).json({error: "\'password\' field cannot be empty."});
        }

        // Check if already registered
        const existingEmail = await User.findOne({ email: req.body.email });
        if (existingEmail) {
            return res.status(400).json({ error: "You are already registered." });
        }

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: "An user with that username already exists." });
        }

        // Register Admin
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "Admin"
        });

        res.status(200).json({data: {message: "Admin added successfully"}});
    } catch (err) {
        res.status(500).json(err);
    }

}

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - error 400 is returned if the supplied password does not match with the one in the database
 */
export const login = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const { email, password } = req.body
        const cookie = req.cookies
        const existingUser = await User.findOne({ email: email })

        // Input validation
        if (!email || !email.trim()) {
            return res.status(400).json({error: "\'email\' field cannot be empty."});
        }
        if (!password || !password.trim()) {
            return res.status(400).json({error: "\'password\' field cannot be empty."});
        }
        if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
            // REGEX to test if the string is an email
            return res.status(400).json({error: "Wrong email format."});
        }
        
        if (!existingUser) return res.status(400).json({error: 'Please you need to register.'})

        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) return res.status(400).json({error: 'Wrong credentials.'})

        //CREATE ACCESSTOKEN
        const accessToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '1h' })

        //CREATE REFRESH TOKEN
        const refreshToken = jwt.sign({
            email: existingUser.email,
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
        }, process.env.ACCESS_KEY, { expiresIn: '7d' })

        //SAVE REFRESH TOKEN TO DB
        existingUser.refreshToken = refreshToken
        const savedUser = await existingUser.save()
        res.cookie("accessToken", accessToken, { httpOnly: true, domain: "localhost", path: "/api", maxAge: 60 * 60 * 1000, sameSite: "none", secure: true })
        res.cookie('refreshToken', refreshToken, { httpOnly: true, domain: "localhost", path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'none', secure: true })
        
        res.status(200).json({ data: { accessToken: accessToken, refreshToken: refreshToken } })
    } catch (error) {
        res.status(500).json(error)
    }
}

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    - error 400 is returned if the user does not exist
 */
export const logout = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.status(400).json({error: "User's refreshToken not found."})
        
        const user = await User.findOne({ refreshToken: refreshToken })
        if (!user) return res.status(400).json({error: "User not found in db."})

        user.refreshToken = null
        res.cookie("accessToken", "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
        res.cookie('refreshToken', "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
        const savedUser = await user.save()
        
        res.status(200).json({data: {message: "Successfully logged out."}})
    } catch (error) {
        res.status(500).json(error);
    }
}
