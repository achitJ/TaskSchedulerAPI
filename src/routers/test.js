const express = require('express');
const router = new express.Router();
const Test = require('../models/test');

router.post('/test', (req, res) => {

    const value = new Test(req.body);

    value.save()
    .then(() => {

        res.send(value);
        console.log(value.index);

    })
    .catch((error) => {

        res.send(error);

    })

})

module.exports = router;