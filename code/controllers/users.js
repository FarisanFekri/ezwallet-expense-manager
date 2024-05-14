import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
    // Controllato da: Lorenzo
    try {
      const adminAuth = verifyAuth(req, res, {authType: "Admin"});

        if(!adminAuth.authorized){
            return res.status(401).json({error: adminAuth.message});
        }

        // Return all Users
        const users = await User.find();
        const result = users.map(us => ({ 
          username: us.username, 
          email: us.email,
          role: us.role
        }));

        res.status(200).json({data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(500).json(error.message);
    }
}

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
    // Controllato da: Lorenzo
    try {
      // User/Admin auth
      const userAuth = verifyAuth(req, res, {authType: "Regular", username: req.params.username});
      const adminAuth = verifyAuth(req, res, {authType: "Admin"});
      
      if(!userAuth.authorized && !adminAuth.authorized) {
        return res.status(401).json({error: userAuth.message});
      }

      // Check if user exists
      const user = await User.findOne({ username: req.params.username });

      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }

      const result = { 
        username: user.username, 
        email: user.email,
        role: user.role
      };

      res.status(200).json({data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
      res.status(500).json(error.message);
    }
}

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
    // Controllato da: Lorenzo
    // TODO: check if input validation works (it should)
    try {
      // User/Admin auth
      const userAuth = verifyAuth(req, res, { authType: "Regular", username: req.params.username });
      const adminAuth = verifyAuth(req, res, { authType: "Admin" });

      if(!userAuth.authorized && !adminAuth.authorized) {
        return res.status(401).json({error: userAuth.message});
      }

      const name = req.body.name;
      const members = req.body.memberEmails;

      // Input validation
      if (!name || name === "" || !name.trim()) {
        return res.status(400).json({error: "\'name\' field cannot be empty."});
      }
      if (!members || !Array.isArray(members)) {
        return res.status(400).json({ error: "Must specify an array of users to add." });
      }
      if (members.length === 0 || members.some(element => !element.trim())) {
        return res.status(400).json({ error: "\'email\' field cannot be empty." });
      }
      if (!members.every(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
        // REGEX to test if the string is an email
        return res.status(400).json({ error: "Wrong email format." });
      }

      // Check if group already exists
      const groupDB = await Group.findOne({ name: name });

      if (groupDB != null) {
        return res.status(400).json({ error: "Group with the same name already exists." });
      }

      // Check if all users dont exist
      const idUsersDB = await User.aggregate([
        {
          $match: {
            email: { $in: members }
          }
        },
        {
          $project: {
            _id: 1,
            email: 1
          }
        }
      ])

      if (idUsersDB == null || idUsersDB.length === 0) {
        return res.status(400).json({ error: "All the members do not exist." });
      }

      // Check if all users are already in a group
      const usersInGroup = await Promise.all(idUsersDB.map(async (user) => {
        let group = await Group.findOne({ "members.email": user.email });
        if (group == null) {
          return { email: user.email, _id: user._id, isInGroup: 0 };
        } else {
          return { email: user.email, _id: user._id, isInGroup: 1 };
        }
      }));

      const totUsersInGroup = usersInGroup.reduce((sum, obj) => {
        if (obj.isInGroup === 1) {
          return sum + 1;
        } else {
          return sum;
        }
      }, 0); //se questo numero sarà pari alla lunghezza del vettore delle email iniziali allora tutti gli users sono gia in un gruppo

      if (totUsersInGroup === members.length) {
        return res.status(400).json({ error: "All the members are already in a group." });
      }

      const usersToAdd = usersInGroup.filter(user => {
        if (user.isInGroup === 1)
          return false;
        else
          return true;
      }).map(user => {
        return { email: user.email, _id: user._id }
      });

      if (usersToAdd.length == 0) {
        return res.status(400).json({ error: "All the members do not exist or are already in a group." });
      }

      if (userAuth.authorized || adminAuth.authorized) {
        let userEmail = verifyAuth(req, res, { authType: "Group" }); //solo user deve x forza aggiungersi al gruppo che crea
        let userIsAlrInGroup = await Group.findOne({ "members.email": userEmail.email });
        if(userIsAlrInGroup){
          return res.status(400).json({ error: "User who wants to create a group is already in a group." });
        }

        if(!usersToAdd.find(obj => obj.email === userEmail.email)){ //se non trovo l'user creatore lo aggiungo
          usersToAdd.push({ email: userEmail.email, id: userEmail.id });
        }
      }

      // Create group
      let new_group = new Group({ name: name, members: usersToAdd });
      new_group = await new_group.save();

      // Create object to return
      let usersNotFound = members.filter(user => {
        for (let u of idUsersDB) {
          if (u.email === user)
            return false;
        }
        return true;
      }).map(m => {return {email: m.email}});

      let usersAlrInGroup = usersInGroup.filter(user => {
        if (user.isInGroup === 0)
          return false;
        else
          return true;
      }).map(user => {
        return {email: user.email}
      });//console.log(new_group.members)

      let membEmalis = new_group.members.map(m =>{return {email: m.email}});
      
      let objectToReturn = {};
      objectToReturn.group = {};
      objectToReturn.group.name = new_group.name;
      objectToReturn.group.members = membEmalis;
      objectToReturn.alreadyInGroup = usersAlrInGroup;
      objectToReturn.membersNotFound = usersNotFound;

      return res.status(200).json({data: objectToReturn, refreshedTokenMessage: res.locals.refreshedTokenMessage});

    } catch (err) {
      res.status(500).json(err.message)
    }
}

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  // Controllato da: Lorenzo
  try {
    const userAuth = verifyAuth(req, res, {authType: "Admin"});

    if(!userAuth.authorized){
        return res.status(401).json({ error: userAuth.message });
    }

    const groups = await Group.find({})
    const result = groups.map(gr => ({ name: gr.name, members: gr.members }))

    return res.status(200).json({data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage})
} catch (error) {
    res.status(500).json({ error: error.message })
}
}

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
    // Controllato da: Lorenzo
    try {
      
      // Check if group exists
      const group = await Group.findOne({name: req.params.name})
      if(group == null){
        return res.status(400).json({message: "Group does not exist."});
      }
      
      // User/Admin auth
      // TODO: vedere se usare "Group" o "Regular"
      const groupMembers = group.members.map(m => {return m.email});
      const userAuth = verifyAuth(req, res, { authType: "Regular", emailInGroup: groupMembers });
      const adminAuth = verifyAuth(req, res, { authType: "Admin" });

      if(!userAuth.authorized && !adminAuth.authorized) {
        return res.status(401).json({error: userAuth.message});
      }
  
      const result = { 
        name: group.name, 
        members: group.members 
      };

      return res.status(200).json({data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
}

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
    // Controllato da: Lorenzo
    // TODO: check if input validation works (it should)
    try {
      if (req.url.indexOf("/insert") >= 0) {
        // ADMIN Route
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });

        if (!adminAuth.authorized) {
          return res.status(401).json({ error: adminAuth.message });
        }

        const emailsToAdd = req.body.emails;

        // Input validation
        if (!emailsToAdd || !Array.isArray(emailsToAdd)) {
          return res.status(400).json({ error: "Must specify an array of users to add." });
        }
        if (emailsToAdd.length === 0 || emailsToAdd.some(element => !element.trim())) {
          return res.status(400).json({ error: "\'email\' field cannot be empty." });
        }
        if (!emailsToAdd.every(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
          // REGEX to test if the string is an email
          return res.status(400).json({ error: "Wrong email format." });
        }

        // Check if group exists
        const groupDB = await Group.findOne({ name: req.params.name });

        if (groupDB == null) {
          return res.status(400).json({ error: "Group does not exist." });
        }

        // Check if all user do not exist
        let users = await User.find(
          { email: { $in: req.body.emails } },
          { email: 1, _id: 1 });
        if (users.length == 0) {
          return res.status(400).json({ error: "All users do not exist." });
        }

        // Check if all users are already in a group
        const usersInGroup = await Promise.all(users.map(async (user) => {
          let group = await Group.findOne({ "members.email": user.email });
          if (group == null) {
            return { email: user.email, _id: user._id, isInGroup: 0 };
          } else {
            return { email: user.email, _id: user._id, isInGroup: 1 };
          }
        }));

        const totUsersInGroup = usersInGroup.reduce((sum, obj) => {
          if (obj.isInGroup === 1) {
            return sum + 1;
          } else {
            return sum;
          }
        }, 0); //se questo numero sarà pari alla lunghezza del vettore delle email iniziali allora tutti gli users sono gia in un gruppo

        if (totUsersInGroup === req.body.emails.length) {
          return res.status(400).json({ error: "All users are already in a group." });
        }

        const usersToAdd = usersInGroup.filter(user => {
          if (user.isInGroup === 1)
            return false;
          else
            return true;
        }).map(user => {
          return { email: user.email, _id: user._id }
        });

        if (usersToAdd.length == 0) {
          return res.status(400).json({ error: "All the members do not exist or are already in a group." });
        }

        // Add User in Group
        let result = await Group.updateOne(
          {
            name: req.params.name
          },
          {
            $push: { members: usersToAdd }
          }
        );

        let usersAlrInGroup = usersInGroup.filter(user => {
          if (user.isInGroup === 0)
            return false;
          else
            return true;
        }).map(user => {
          return {email: user.email}
        });

        users = users.map(u => { return u.email });

        let usersNotFound = req.body.emails.filter(user => {
          for (let u of users) {
            if (u === user)
              return false;
          }
          return true;
        }).map(m => {return {email: m}});

        let updatedGroup = await Group.findOne({ name: req.params.name });
        let membEmalis = updatedGroup.members.map(m =>{return {email: m.email}});

        let objectToReturn = {};
        objectToReturn.group = {};
        objectToReturn.group.name = updatedGroup.name;
        objectToReturn.group.members = membEmalis;
        objectToReturn.alreadyInGroup = usersAlrInGroup;
        objectToReturn.membersNotFound = usersNotFound;

        return res.status(200).json({data: objectToReturn, refreshedTokenMessage: res.locals.refreshedTokenMessage});

      } else {
        // USER Route
        // Check if group exists
        const groupDB = await Group.findOne({ name: req.params.name });

        if (groupDB == null) {
          return res.status(400).json({ error: "Group does not exist." });
        }

        // User auth
        // Check if user is in group TODO: vedere se usare "Group" o "Regular"
        const groupMembers = groupDB.members.map(m => {return m.email});
        const userAuth = verifyAuth(req, res, { authType: "Regular", emailInGroup: groupMembers });

        if (!userAuth.authorized) {
          return res.status(401).json({ error: userAuth.message });
        }

        const emailsToAdd = req.body.emails;

        // Input validation
        if (!emailsToAdd || !Array.isArray(emailsToAdd)) {
          return res.status(400).json({ error: "Must specify an array of users to add." });
        }
        if (emailsToAdd.length === 0 || emailsToAdd.some(element => !element.trim())) {
          return res.status(400).json({ error: "\'email\' field cannot be empty." });
        }
        if (!emailsToAdd.every(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
          // REGEX to test if the string is an email
          return res.status(400).json({ error: "Wrong email format." });
        }

        // Check if all user do not exist
        let users = await User.find(
          { email: { $in: req.body.emails } },
          { email: 1, _id: 1 });
        if (users.length == 0) {
          return res.status(400).json({ error: "All users do not exist." });
        }

        // Check if all users are already in a group
        const usersInGroup = await Promise.all(users.map(async (user) => {
          let group = await Group.findOne({ "members.email": user.email });
          if (group == null) {
            return { email: user.email, _id: user._id, isInGroup: 0 };
          } else {
            return { email: user.email, _id: user._id, isInGroup: 1 };
          }
        }));

        const totUsersInGroup = usersInGroup.reduce((sum, obj) => {
          if (obj.isInGroup === 1) {
            return sum + 1;
          } else {
            return sum;
          }
        }, 0); //se questo numero sarà pari alla lunghezza del vettore delle email iniziali allora tutti gli users sono gia in un gruppo

        if (totUsersInGroup === req.body.emails.length) {
          return res.status(400).json({ error: "All users are already in a group." });
        }

        const usersToAdd = usersInGroup.filter(user => {
          if (user.isInGroup === 1)
            return false;
          else
            return true;
        }).map(user => {
          return { email: user.email, _id: user._id }
        });

        if (usersToAdd.length == 0) {
          return res.status(400).json({ error: "All the members do not exist or are already in a group." });
        }

        // Add User in Group
        let result = await Group.updateOne(
          {
            name: req.params.name
          },
          {
            $push: { members: usersToAdd }
          }
        );

        let usersAlrInGroup = usersInGroup.filter(user => {
          if (user.isInGroup === 0)
            return false;
          else
            return true;
        }).map(user => {
          return {email: user.email}
        });

        users = users.map(u => { return u.email });

        let usersNotFound = req.body.emails.filter(user => {
          for (let u of users) {
            if (u === user)
              return false;
          }
          return true;
        }).map(m => {return {email: m}});

        let updatedGroup = await Group.findOne({ name: req.params.name });
        let membEmalis = updatedGroup.members.map(m =>{return {email: m.email}});

        let objectToReturn = {};
        objectToReturn.group = {};
        objectToReturn.group.name = updatedGroup.name;
        objectToReturn.group.members = membEmalis;
        objectToReturn.alreadyInGroup = usersAlrInGroup;
        objectToReturn.membersNotFound = usersNotFound;

        return res.status(200).json({data: objectToReturn, refreshedTokenMessage: res.locals.refreshedTokenMessage});
      }

    } catch (err) {
      res.status(500).json(err.message)
    }
}

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
    // Controllato da: Lorenzo
    // TODO: check if input validation works (it should)
    try {
      if (req.url.indexOf("/pull") >= 0) {
        // ADMIN Route
        const adminAuth = verifyAuth(req, res, { authType: "Admin" });
        
        if (!adminAuth.authorized) {
          return res.status(401).json({ error: adminAuth.message });
        }

        // Check if group exists
        const group = await Group.findOne({ name: req.params.name });

        if (group == null) {
          return res.status(400).json({ error: "Group does not exist." });
        }

        const emailsToRemove = req.body.emails;

        // Input validation
        if (!emailsToRemove || !Array.isArray(emailsToRemove)) {
          return res.status(400).json({ error: "Must specify an array of users to remove." });
        }
        if (emailsToRemove.length === 0 || emailsToRemove.some(element => !element.trim())) {
          return res.status(400).json({ error: "\'email\' field cannot be empty." });
        }
        if (!emailsToRemove.every(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
          // REGEX to test if the string is an email
          return res.status(400).json({ error: "Wrong email format." });
        }

        // Check if all user do not exist
        let users = await User.find({ email: { $in: emailsToRemove } });

        if (users.length == 0) {
          return res.status(400).json({ error: "All users do not exist." });
        }

        // Check if all users are inside the group
        const usersInGroup = await Promise.all(users.map(async (user) => {
          let group = await Group.findOne({ "members.email": user.email });
          if (group == null) {
            return { email: user.email, _id: user._id, isInGroup: 0 };
          } else {
            return { email: user.email, _id: user._id, isInGroup: 1, nameGroup: group.name }; //se l'utente è in un gruppo faccio ritornare il nome di esso
          }
        }));

        const totUsersInGroup = usersInGroup.reduce((sum, obj) => {
          if (obj.isInGroup === 0) {
            return sum + 1;
          } else {
            return sum;
          }
        }, 0);

        if (totUsersInGroup === req.body.emails.length) {
          return res.status(400).json({ error: "All users are not in the group." });
        }

        let usersToRem = usersInGroup.filter(user => {
          if (user.isInGroup === 0 || user.nameGroup !== req.params.name) //se il gruppo dell'utente non è quello specificato lo levo, inoltre il primo non può essere mai levato
            return false;
          else
            return true;
        }).map(user => {
          return user.email;
        });

        if (usersToRem.length == 0 || usersToRem.length == group.members.length) { //se la lunghezza degli utenti da rimuovere è quanto quella dei membri del gruppo allora rimarrebbe vuoto e non va bene
          return res.status(400).json({ error: "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members." });
        }

        let result = await Group.updateOne({ name: req.params.name }, { $pull: { members: { email: { $in: usersToRem } } } });

        users = users.map(u => { return u.email });

        let usersNotFound = req.body.emails.filter(user => {
          for (let u of users) {
            if (u === user)
              return false;
          }
          return true;
        }).map(m => {return {email: m}});

        let usersNotInGroup = usersInGroup.filter(user => {
          if (user.isInGroup === 0 || user.nameGroup!=req.params.name)
            return true;
          else
            return false;
        }).map(user => {
          return {email: user.email};
        });

        usersToRem = usersToRem.map(m =>{return {email: m}});
        //usersNotInGroup = usersNotInGroup.concat(usersToRem);
        let updatedGroup = await Group.findOne({ name: req.params.name });
        let membEmalis = updatedGroup.members.map(m =>{return {email: m.email}});

        let objectToReturn = {};
        objectToReturn.group = {};
        objectToReturn.group.name = group.name;
        objectToReturn.group.members = membEmalis;
        objectToReturn.notInGroup = usersNotInGroup;
        objectToReturn.membersNotFound = usersNotFound;

        return res.status(200).json({data: objectToReturn, refreshedTokenMessage: res.locals.refreshedTokenMessage});
      } else {
        // USER Route
        // Check if group exists
        const group = await Group.findOne({ name: req.params.name });

        if (group == null) {
          return res.status(400).json({ error: "Group does not exist." });
        }

        // User auth
        // Check if user is in group TODO: vedere se usare "Group" o "Regular"
        const groupMembers = group.members.map(m => {return m.email});
        const userAuth = verifyAuth(req, res, { authType: "Regular", emailInGroup: groupMembers });

        if (!userAuth.authorized) {
          return res.status(401).json({ error: userAuth.message });
        }

        const emailsToRemove = req.body.emails;

        // Input validation
        if (!emailsToRemove || !Array.isArray(emailsToRemove)) {
          return res.status(400).json({ error: "Must specify an array of users to remove." });
        }
        if (emailsToRemove.length === 0 || emailsToRemove.some(element => !element.trim())) {
          return res.status(400).json({ error: "\'email\' field cannot be empty." });
        }
        if (!emailsToRemove.every(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
          // REGEX to test if the string is an email
          return res.status(400).json({ error: "Wrong email format." });
        }

        // Check if all user do not exist
        let users = await User.find({ email: { $in: emailsToRemove } });

        if (users.length == 0) {
          return res.status(400).json({ error: "All users do not exist." });
        }

        // Check if all users are inside the group
        const usersInGroup = await Promise.all(users.map(async (user) => {
          let group = await Group.findOne({ "members.email": user.email });
          if (group == null) {
            return { email: user.email, _id: user._id, isInGroup: 0 };
          } else {
            return { email: user.email, _id: user._id, isInGroup: 1, nameGroup: group.name }; //se l'utente è in un gruppo faccio ritornare il nome di esso
          }
        }));

        const totUsersInGroup = usersInGroup.reduce((sum, obj) => {
          if (obj.isInGroup === 0) {
            return sum + 1;
          } else {
            return sum;
          }
        }, 0);

        if (totUsersInGroup === req.body.emails.length) {
          return res.status(400).json({ error: "All users are not in the group." });
        }

        let usersToRem = usersInGroup.filter(user => {
          if (user.isInGroup === 0 || user.nameGroup !== req.params.name) //se il gruppo dell'utente non è quello specificato lo levo, inoltre il primo non può essere mai levato
            return false;
          else
            return true;
        }).map(user => {
          return user.email;
        });

        if (usersToRem.length == 0 || usersToRem.length == group.members.length) {
          return res.status(400).json({ error: "Cannot remove: all memberEmail don't exist, aren't in a group, are in another group or tried to left group with 0 members." });
        }

        let result = await Group.updateOne({ name: req.params.name }, { $pull: { members: { email: { $in: usersToRem } } } });

        users = users.map(u => { return u.email });

        let usersNotFound = req.body.emails.filter(user => {
          for (let u of users) {
            if (u === user)
              return false;
          }
          return true;
        }).map(m => {return {email: m}});

        let usersNotInGroup = usersInGroup.filter(user => {
          if (user.isInGroup === 0 || user.nameGroup!=req.params.name)
            return true;
          else
            return false;
        }).map(user => {
          return {email: user.email};
        });

        usersToRem = usersToRem.map(m =>{return {email: m}});
        //usersNotInGroup = usersNotInGroup.concat(usersToRem);
        let updatedGroup = await Group.findOne({ name: req.params.name });
        let membEmalis = updatedGroup.members.map(m =>{return {email: m.email}});

        let objectToReturn = {};
        objectToReturn.group = {};
        objectToReturn.group.name = group.name;
        objectToReturn.group.members = membEmalis;
        objectToReturn.notInGroup = usersNotInGroup;
        objectToReturn.membersNotFound = usersNotFound;

        return res.status(200).json({data: objectToReturn, refreshedTokenMessage: res.locals.refreshedTokenMessage});
      }
    } catch (err) {
      res.status(500).json({error: err.message})
    }
}

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
    // Controllato da: Lorenzo
    try {
      const userAuth = verifyAuth(req, res, { authType: "Admin" });

      if (!userAuth.authorized) {
        return res.status(401).json({ error: userAuth.message });
      }

      const emailToDelete = req.body.email;

      // Input validation
      if (!emailToDelete || !emailToDelete.trim()) {
        return res.status(400).json({ message: "'email' field cannot be empty." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToDelete)) {
        // REGEX to test if the string is an email
        return res.status(400).json({ message: "Wrong email format." });
      }

      // Check if user exists
      const user = await User.findOne({ email: emailToDelete });
      if (user == null) {
        return res.status(400).json({ message: "User not found." });
      }

      // Check if user to delete is not an admin
      if (user.role === "Admin") {
        return res.status(400).json({ message: "Cannot delete an Admin." });
      }

      // Delete all transactions
      const deletedTrans = await transactions.deleteMany({ username: user.username });

      // If in group, delete from group
      let inGroup = false;
      const group = await Group.findOne({ "members.email": user.email });
      if (group != null) {
        // In group
        inGroup = true;
        if (group.members.length === 1) {
          // If alone in the group, also delete the group
          await Group.deleteOne({ name: group.name });
        } else {
          // If not, just remove from the group
          await Group.updateOne(
            { name: group.name },
            { $pull: { members: { email: user.email } } }
          );
        }
      }

      // Delete user
      await User.deleteOne({ username: user.username });

      let objectToReturn = {};
      objectToReturn.deletedTransactions = deletedTrans.deletedCount;
      objectToReturn.deletedFromGroup = inGroup;

      return res
        .status(200)
        .json({ data: objectToReturn, refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
  // Controllato da: Lorenzo
  try {
    const userAuth = verifyAuth(req, res, { authType: "Admin" });

    if (!userAuth.authorized) {
      return res.status(401).json({ error: userAuth.message });
    }

    const name = req.body.name;

    // Input validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "'name' field cannot be empty." });
    }

    // Check if group exists
    let group = await Group.findOne({ name: name });
    if (group == null) {
      return res.status(400).json({ message: "Group does not exists." });
    }

    // Delete group
    await Group.deleteOne({ name: name });

    return res
      .status(200)
      .json({
        data: {message: "Group successfully deleted."},
        refreshedTokenMessage: res.locals.refreshedTokenMessage,
      });
  } catch (err) {
    res.status(500).json(err.message);
  }
};