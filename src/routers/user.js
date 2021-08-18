const express = require('express');
const router = new express.Router();
const auth = require('../middleware/authentication');
const User = require('../models/user');
const multer = require('multer');
const sharp = require('sharp');

//USER ROUTES

//sending a new user data in the DB
router.post("/users", async (req, res) => {
    
    const user = new User(req.body);

    try {

        await user.save()
        const token = await user.generateAuthToken();
        res.status(200)
        .send({ user, token });

    } catch (error) {

        res.status(400)
        .send("error");

    }
});

//login users
router.post('/users/login', async(req, res) => {

    try{

        const user = await User.findByCredentials(req.body.email, req.body.password);

        if(!user)
        {
            res.status(404).send();
        }

        const token = await user.generateAuthToken();

        res.send({ user, token });

    } catch(error) {

        res.status(500).send("error");

    }

});

//logout single user
router.post('/users/logout', auth, async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => {

            return token.token !== req.token;

        })

        await req.user.save();

        res.status(200).send("LOGGED OUT SUCCESFULLY");

    } catch(error) {

        res.status(500).send();

    }

})

//logout all the users
router.post('/users/logoutAll', auth, async(req, res) => {

    try {

        req.user.tokens = [];

        await req.user.save();

        res.status(200).send("LOGGED OUT OF ALL DEVICES");

    } catch(error) {

        res.status(500).send();

    }

})

//showing the user Profile
router.get('/users/me', auth, async (req, res) => {

    try {

        res.send(req.user);

    } catch (error) {

        res.status(500)
        .send("error");

    }

});

//We should not be able to get the info of a user by ID, only through the user profile

// //showing a single user filtered by ID
// //             ':' creates a dynamic parameter to use in routes 
// router.get('/users/:id', async (req, res) => {

//     // console.log(req.params); //shows all the parameters we get from web
//     const _id = req.params.id;

//     // Check if it's a valid ObjectId
//     if (!_id.match(/^[0-9a-fA-F]{24}$/)) {

//         return res.status(404).send("Invalid ID format");

//     }

//     try {

//         const user = await User.findById(_id);

//         if(!user)
//         {
//             return res.status(404).send();
//         }

//         res.send(user);

//     } catch(error) {

//         res.status(500)
//         .send(error);

//     }

// });

//updating the user info, the data is provided in the body of the request
router.patch('/users/me', auth, async (req, res) => {

    //inorder to make sure that body only contains valid keys
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidUpdate = updates.every((update) => {

        return allowedUpdates.includes(update);

    });

    if(!isValidUpdate)
    {
        return res.status(400).send();
    }

    // //NO NEED FOR CHECKING _id SINCE WE ARE UPDATING OUR OWN ID ONLY
    // const _id = req.user.id;

    // // Check if it's a valid ObjectId
    // if (!_id.match(/^[0-9a-fA-F]{24}$/)) {

    //     return res.status(404).send("Invalid ID format");

    // }

    try {

        // //findByIdAndUpdate() bypasses mongoose that is why we have to pass in speacial arguments such as runValidators and new,
        // //so we use traditional mongoose methods in order to make sure our password always goes through the hashing process.
        // //                                                         new -> returns the updated value
        // //                                                         runValidators -> runs the validators before sending the data
        // const user = await User.findByIdAndUpdate(_id, updates, { new: true, runValidators: true });

        const user = req.user;

        updates.forEach((update) => {

            user[update] = req.body[update]; //iterating object dynamically instead of statically

        });

        await user.save();

        res.send(user);

    } catch(error) {

        res.status(500)
        .send("error");

    }

});

router.delete('/users/me', auth, async (req, res) => {

    try {
    
        // const user = await User.findByIdAndDelete(req.user._id);
        
        // if(!user) 
        // {
        //     return res.status(404).send();
        // }

        await req.user.remove();

        res.send(req.user);

    } catch(error) {

        res.status(500).send("error");

    }

});

const upload = multer({

    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) 
        {
            return cb(new Error('Please upload an image of .jpg, .jpeg or .png format'));
        }

        cb(undefined, true);

    }

})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer(); //converts the files to png and resizes them to 250*250

    req.user.avatar = buffer; //binary data of our file

    await req.user.save();

    res.send();

}, (error, req, res, next) => {

    res.status(400).send({ error: error.message });

})

router.delete('/users/me/avatar', auth, async (req, res) => {

    req.user.avatar = undefined;
    await req.user.save();

    res.send();

})

router.get('/users/:id/avatar', async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) 
        {
            throw new Error();
        }

        res.set('Content-Type', 'image/png'); //header which specifies the type of data we are sending, its json by default
        res.send(user.avatar);

    } catch(error) {

        res.status(404).send();

    }

})

module.exports = router;

