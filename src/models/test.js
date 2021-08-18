const mongoose = require('mongoose');

const testSchema = new  mongoose.Schema({

    _id: {
        type: String,
    }

})

const test = mongoose.model('Test', testSchema)

module.exports = test;