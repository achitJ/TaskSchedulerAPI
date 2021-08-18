const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task')

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true, //trim spaces before and after
        lowercase: true, //turn everything into lowercase
        validate(value) //for additional validation
        {
            if(!validator.isEmail(value))
            {
                throw new Error("EMAIL invalid")
            }
        }
    },

    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value)
        {
            if(value.toLowerCase().includes("password"))
            {
                throw new Error(`Your password must not contain the word "password"`)
            }
        }
    },

    age: {
        type: Number,
        default: 0, //default value in case nothing is provided
        validate(value) 
        {
            if(value < 0)
            {
                throw new Error("Age must be a positive number");
            }
        }
    },

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],

    avatar: {
        type: Buffer
    }

}, {

    timestamps: true

});

//this field does not persists in the DB, when we call 'tasks', the tasks
//which have the same 'owner' as the current '_id' will form an array and 
//be saved as tasks
userSchema.virtual('tasks', {

    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'

})

//everytime a response is sent to the frontend, this function works and removes 
//the password and tokens. 
userSchema.methods.toJSON = function() {

    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;

}

userSchema.methods.generateAuthToken = async function() {

    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;

}

//user login check
//statics apply the function on the entire collection, it is used when doing work on the entire data
//the other one "schema_name.methods.function_name()" applies the function on individual document and is usefl for when working on single documents
userSchema.statics.findByCredentials = async (email, password) => {

    const user = await User.findOne({ email });

    if(!user) {

        throw new Error("Unable to login");

    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {

        throw new Error("Unable to login");

    }

    return user;
}

//Hashing Plain text password before saving
//we cannot use arrow functions because this property plays an important role 
userSchema.pre('save', async function(next) {

    const user = this;

    //      checks if the password is hashed or not
    if(user.isModified('password')) 
    {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next(); //calling next signifies that function should be executed

});

//delete user tasks when user is removed
userSchema.pre('remove', async function(next) {

    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();

})

//Creates a new model 'User' with fields name and age.
const User = mongoose.model('User', userSchema);

module.exports = User;