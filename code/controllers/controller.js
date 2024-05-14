import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const adminAuth = verifyAuth(req, res, {authType: "Admin"});

        if(!adminAuth.authorized){
            return res.status(401).json({error: adminAuth.message});
        }

        const { type, color } = req.body;

        // Input validation
        if (!type || !type.trim()) {
            return res.status(400).json({message: "\'type\' field cannot be empty."});
        }
        if (!color || !color.trim()) {
            return res.status(400).json({message: "\'color\' field cannot be empty."});
        }

        // Check if a category with that name already exists
        const category = await categories.findOne({ type: type });

        if (category) {
            return res.status(400).json({message: "Category "+type+" already exists."});
        }

        // Create new category
        const newCategory = new categories({ type, color });
        const data = await newCategory.save();
        return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    
    } catch (error) {
        res.status(500).json({ error: error.message });
    } 
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });

        if (!adminAuth.authorized) {
            return res.status(401).json({ error: adminAuth.message });
        }

        const oldCategoryName = req.params.type;
        const { type, color } = req.body;

        // Input validation
        if (!type || !type.trim()) {
            return res.status(400).json({message: "\'type\' field cannot be empty."});
        }
        if (!color || !color.trim()) {
            return res.status(400).json({message: "\'color\' field cannot be empty."});
        }

        // Check if old category exists
        const oldCategory = await categories.findOne({ type: oldCategoryName });
        if (oldCategory == null) {
            return res.status(400).json({ message: "Category "+oldCategoryName+" does not exist." });
        }

        // Check if a category with the new name already exists
        const newCategory = await categories.findOne({ type: type });
        if (newCategory != null && newCategory.type !== oldCategory.type) {
            return res.status(400).json({ message: "Category "+type+" already exists." });
        }

        // Update category values
        await categories.updateOne(
            {
                type: oldCategoryName
            },
            {
                $set: { type: oldCategoryName },
                type: type, 
                color: color
            }
        );

        // Update category field for affected transactions
        const updateResult = await transactions.updateMany(
            { type: { $in: oldCategoryName } },
            { $set: { type: type } }
        );

        return res.status(200).json({
            data: {
                message: "Successfully updated category "+type+".", 
                count: updateResult.modifiedCount, 
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });

        if (!adminAuth.authorized) {
            return res.status(401).json({ error: adminAuth.message });
        }

        let types = req.body.types;
        
        // Input validation
        if (!types || !Array.isArray(types)) {
            return res.status(400).json({message: "Must specify an array of categories to delete."});
        }
        if (types.length === 0 || types.some(element => !element.trim())) {
            return res.status(400).json({message: "\'type\' field cannot be empty."});
        }
        
        const existingCategories = await categories.find({ type: { $in: types } });
        const nonExistingCategories = types.filter((type) => {
            return !existingCategories.some((category) => category.type === type);
          });

        if (nonExistingCategories.length > 0) {
            return res.status(400).json({ message: "One or more categories in the list do not exist." });
        }

        // Check if at least one category would remain after deletion
        const remainingCategories = await categories.find();
        const oldFirstCategory = remainingCategories[0];

        // Check if only one category exists
        if (remainingCategories.length === 1) {
            return res.status(400).json({ message: "Cannot remove with only one existing category." });
        }
        
        // If all existing categories need to be deleted, leave the first one and update transactions
        if (types.length === remainingCategories.length) {
            types = types.filter((cat) => cat !== oldFirstCategory.type);
        }
        
        // Delete categories
        const deleteResult = await categories.deleteMany({ type: { $in: types } });
        
        // Get new first Category
        const firstCategory = await categories.findOne();
        
        // Reset category field to first category for all affected transactions
        const updateResult = await transactions.updateMany(
            { type: { $in: types } },
            { $set: { type: firstCategory.type } }
        );

        return res.status(200).json({
            data: {
                message: "Successfully deleted categories.", 
                count: updateResult.modifiedCount, 
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const userAuth = verifyAuth(req, res, {authType: "Simple"});

        if(!userAuth.authorized){
            return res.status(401).json({error: userAuth.message});
        }

        // Get all categories
        const cats = await categories.find();
        const result = cats.map(cat => ({ type: cat.type, color: cat.color }));

        return res.status(200).json({data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        // User/Admin auth
        const userAuth = verifyAuth(req, res, {authType: "Regular", username: req.params.username});
        const adminAuth = verifyAuth(req, res, {authType: "Admin", username: req.params.username});
        
        if(!userAuth.authorized && !adminAuth.authorized) {
            return res.status(401).json({error: userAuth.message});
        }

        const { username, amount, type } = req.body;

        // Input validation
        if (!username || !username.trim()) {
            return res.status(400).json({message: "\'username\' field cannot be empty."});
        }
        let amountParsed = parseInt(amount);
        if (!(Number.isInteger(amountParsed))) {
            return res.status(400).json({message: "\'amount\' field must be a number."});
        }
        if (!type || !type.trim()) {
            return res.status(400).json({message: "\'type\' field cannot be empty."});
        }

        // Check if the user matches with the one in the params
        if (username !== req.params.username){
            return res.status(400).json({message: "Username in params and the one in body have to be the same."});    
        }

        // Check if category and user exist
        const catDB = await categories.findOne({type: type});
        const userDB = await User.findOne({username: username});
        if(catDB == null){
            return res.status(400).json({message: "Category "+type+" does not exist."});
        }
        if(userDB == null){
            return res.status(400).json({message: "User not found."});
        }

        // Add transaction
        const newTransaction = new transactions({ username, type, amount });
        const trans = await newTransaction.save();
        const result = { 
            username: trans.username, 
            type: trans.type,
            amount: trans.amount,
            date: trans.date
        };

        return res.status(200).json({data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const adminAuth = verifyAuth(req, res, {authType: "Admin"});

        if(!adminAuth.authorized){
            return res.status(401).json({error: adminAuth.message});
        }

        // MongoDB equivalent to the query "SELECT * FROM transactions, 
        //  categories WHERE transactions.type = categories.type"
        transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            const data = result.map((v) => ({
                username: v.username,
                type: v.type,
                amount: v.amount,
                date: v.date,
                color: v.categories_info.color,
            }));

            return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        // Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //  and different behaviors and access rights
        if (req.url.indexOf("/transactions/users/") >= 0) {
            // ADMIN Route
            const adminAuth = verifyAuth(req, res, { authType: "Admin" });

            if (!adminAuth.authorized) {
                return res.status(401).json({ error: adminAuth.message });
            }

            // Check if user exists
            const userDB = await User.findOne({username: req.params.username});
            if(userDB == null){
                return res.status(400).json({error: "User not found."});
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            transactions.aggregate([
                {
                    $match: {
                        username: req.params.username,
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            })

        } else {
            // USER Route
            const userAuth = verifyAuth(req, res, { authType: "Regular", username: req.params.username });

            if (!userAuth.authorized) {
                return res.status(401).json({ error: userAuth.message });
            }

            // Check if user exists
            const userDB = await User.findOne({username: req.params.username});
            if(userDB == null){
                return res.status(400).json({error: "User not found."});
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            // MongoDB equivalent to the query "SELECT * FROM transactions, 
            //  categories WHERE transactions.type = categories.type"
            transactions.aggregate([
                {
                    $match: {
                        username: req.params.username,
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        if (req.url.indexOf("/transactions/users/") >= 0) {
            // ADMIN Route
            const adminAuth = verifyAuth(req, res, { authType: "Admin" });

            if (!adminAuth.authorized) {
                return res.status(401).json({ error: adminAuth.message });
            }

            // Check if user exists
            const userDB = await User.findOne({ username: req.params.username });
            if (userDB == null) {
                return res.status(400).json({ error: "User not found." });
            }

            // Check if category exists
            const category = await categories.findOne({ type: req.params.category });
            if (category == null) {
                return res.status(400).json({ error: "Category does not exist." })
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            // MongoDB equivalent to the query "SELECT * FROM transactions, 
            //  categories WHERE transactions.type = categories.type"
            transactions.aggregate([
                {
                    $match: {
                        username: req.params.username,
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match: {
                        type: category.type
                    }
                }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });

        } else {
            // USER Route
            const userAuth = verifyAuth(req, res, { authType: "Regular", username: req.params.username });

            if (!userAuth.authorized) {
                return res.status(401).json({ error: userAuth.message });
            }

            // Check if user exists
            const userDB = await User.findOne({ username: req.params.username });
            if (userDB == null) {
                return res.status(400).json({ error: "User not found." });
            }

            // Check if category exists
            const category = await categories.findOne({ type: req.params.category });
            if (category == null) {
                return res.status(400).json({ error: "Category does not exist." })
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            // MongoDB equivalent to the query "SELECT * FROM transactions, 
            //  categories WHERE transactions.type = categories.type"
            transactions.aggregate([
                {
                    $match: {
                        username: req.params.username,
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match: {
                        type: category.type
                    }
                }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    // Auth: Riccardo
    // Controllato da: Lorenzo
    try {
        if (req.url.indexOf("/transactions/groups") >= 0) {
            // ADMIN Route
            const adminAuth = verifyAuth(req, res, { authType: "Admin" });

            if (!adminAuth.authorized) {
                return res.status(401).json({ error: adminAuth.message });
            }

            // Check if group exists
            const groupDB = await Group.findOne({ name: req.params.name });

            if (groupDB == null) {
                return res.status(400).json({ error: "Group does not exist." });
            }

            // Gather users of the group
            const emailsOfGroup = groupDB.members.map(g => { return g.email });
            let usersInGroup = await User.find({ email: { $in: emailsOfGroup } });
            usersInGroup = usersInGroup.map(u => { return u.username });

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            transactions.aggregate([
                {
                    $match: {
                        username: { $in: usersInGroup },
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });
        } else {
            // USER Route
            // Check if group exists
            const groupDB = await Group.findOne({ name: req.params.name });

            if (groupDB == null) {
                return res.status(400).json({ error: "Group does not exist." });
            }

            // Gather users of the group
            const emailsOfGroup = groupDB.members.map(g => { return g.email });
            let usersInGroup = await User.find({ email: { $in: emailsOfGroup } });
            usersInGroup = usersInGroup.map(u => { return u.username });

            // Check if user is in group TODO: vedere se usare "Group" o "Regular"
            const userAuth = verifyAuth(req, res, { authType: "Regular", emailInGroup: emailsOfGroup });

            if (!userAuth.authorized) {
                return res.status(401).json({ error: userAuth.message });
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            transactions.aggregate([
                {
                    $match: {
                        username: { $in: usersInGroup },
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        if (req.url.indexOf("/transactions/groups") >= 0) {
            // ADMIN Route
            const adminAuth = verifyAuth(req, res, {authType: "Admin"});

            if(!adminAuth.authorized){
                return res.status(401).json({error: adminAuth.message});
            }

            // Check if group exists
            const groupDB = await Group.findOne({ name: req.params.name });

            if (groupDB == null) {
                return res.status(400).json({ error: "Group does not exist." });
            }

            // Gather users of the group
            const emailsOfGroup = groupDB.members.map(g => { return g.email });
            let usersInGroup = await User.find({ email: { $in: emailsOfGroup } });
            usersInGroup = usersInGroup.map(u => { return u.username });

            // Check if category exists
            const category = await categories.findOne({type: req.params.category});
            if(category == null){
                return res.status(400).json({error: "Category does not exist."})
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            transactions.aggregate([
                {
                    $match:{
                        username: {$in: usersInGroup},
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match:{
                        type: category.type
                    }
                }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });
        }else{
            // USER Route
            // Check if group exists
            const groupDB = await Group.findOne({ name: req.params.name });

            if (groupDB == null) {
                return res.status(400).json({ error: "Group does not exist." });
            }

            // Gather users of the group
            const emailsOfGroup = groupDB.members.map(g => { return g.email });
            let usersInGroup = await User.find({ email: { $in: emailsOfGroup } });
            usersInGroup = usersInGroup.map(u => { return u.username });

            // Check if user is in group TODO: vedere se usare "Group" o "Regular"
            const userAuth = verifyAuth(req, res, { authType: "Regular", emailInGroup: emailsOfGroup });

            if (!userAuth.authorized) {
                return res.status(401).json({ error: userAuth.message });
            }

            // Check if category exists
            const category = await categories.findOne({type: req.params.category});
            if(category == null){
                return res.status(400).json({error: "Category does not exist."})
            }

            // Checks on Filters if present
            const amount = handleAmountFilterParams(req);

            const date = handleDateFilterParams(req);

            transactions.aggregate([
                {
                    $match:{
                        username: {$in: usersInGroup},
                        ...amount, //fai oggetto unico con data e amount, a seconda vedi i campi
                        ...date
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" },
                {
                    $match:{
                        type: category.type
                    }
                }
            ]).then((result) => {
                const data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                return res.status(200).json({data: data, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        // User/Admin auth
        const userAuth = verifyAuth(req, res, {authType: "Regular", username: req.params.username});
        const adminAuth = verifyAuth(req, res, {authType: "Admin"});
        
        if(!userAuth.authorized && !adminAuth.authorized) {
            return res.status(401).json({error: userAuth.message});
        }

        const id = req.body._id;

        // Input Validation
        if (!id || !id.trim()) {
            return res.status(400).json({message: "\'id\' field cannot be empty."});
        }

        // Check if user and transaction exist
        const user = await User.findOne({username: req.params.username});
        const transaction = await transactions.findOne({_id: id});

        if(user === null){
            return res.status(400).json({message: "User "+req.params.username+" does not exist."});    
        }
        
        // Check if the transaction exists
        if(transaction === null){
            return res.status(400).json({message: "Transaction not found."});
        }

        // Check if the user matches with the one in the params
        if (user.username !== transaction.username){
            return res.status(400).json({message: "Username in params and the one in body have to be the same."});    
        }

        // Delete transaction
        const data = await transactions.deleteOne({ _id: req.body._id });

        return res.status(200).json({data: {message: "Transaction deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
    // Controllato da: Lorenzo
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });

        if (!adminAuth.authorized) {
            return res.status(401).json({ error: adminAuth.message });
        }
        
        const trans = req.body._ids;

        // Input validation
        if (!trans || !Array.isArray(trans)) {
            return res.status(400).json({message: "Must specify an array of transactions to delete."});
        }
        if (trans.some(element => !element.trim())) {
            return res.status(400).json({message: "\'id\' field cannot be empty."});
        }

        // Check if all the requested transactions exist
        const existingTransactions = await transactions.find({ _id: { $in: trans } });

        if (existingTransactions.length !== trans.length) {
            return res.status(400).json({ message: "One or more transactions in the list do not exist." });
        }

        // Delete transactions
        const deleteResult = await transactions.deleteMany({ _id: { $in: trans } });
        return res.status(200).json({data: {message: "Successfully deleted transactions."}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
