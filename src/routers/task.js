const express = require('express');
const router = new express.Router();
const auth = require('../middleware/authentication');
const Task = require('../models/task');

//TASK ROUTES

//sending a new task in the DB
router.post("/tasks", auth, async (req, res) => {

    const task = new Task({

        ...req.body, //copies the content of body
        owner: req.user._id

    })

    try {

        task.populate('owner').execPopulate(); //updating the entire user inside the task instaed of just the id
        await task.save();
        res.send(task);

    } catch(error) {

        res.status(500)
        .send("error");

    }

});

//showing all the tasks of a user
//GET /tasks?completed=bool_val

//GET /tasks?limit=int_val&skip=int_val
//if limit = 10 and skip = 0  => 1st page
//if limit = 10 and skip = 10 => 2nd page
//if limit = 10 and skip = 20 => 3rd page

//GET /tasks?sortBy=document_key:desc_or_asc
// /tasks?sortBy=createdAt:desc
// /tasks?sortBy=createdAt:asc
// /tasks?sortBy=completed:desc
router.get("/tasks", auth, async (req, res) => {

    const match = {};
    const sort = {};

    if(req.query.completed)
    {
        match.completed = req.query.completed === 'true';
    }

    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split(':'); //we get [key_val, desc_or_asc]

        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {

        // const tasks = await Task.find({owner: req.user._id});
        //OR
        //creates an array 'tasks' and fills it with the task on the user we get 
        //from request
        await req.user.populate({

            path: 'tasks',
            match, //for specifying the fields of the document like 'completed'
            options: {
                limit: parseInt(req.query.limit), //limits the amount of data sent
                skip: parseInt(req.query.skip), //skips the data
                sort //sorting
            }

        }).execPopulate();
        
        res.send(req.user.tasks);

    } catch(error) {

        res.status(500).send("error");

    }

});

//showing a single task filtered by ID
router.get("/tasks/:id", auth, async (req, res) => {

    const _id = req.params.id;

    // Check if it's a valid ObjectId
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) 
    {
        return res.status(404).send("Invalid ID format");
    }

    try {

        const task = await Task.findOne({ _id, owner: req.user._id });

        if(!task)
        {
            return res.status(404).send();
        }

        res.send(task);

    } catch(error) {

        res.status(500)
        .send("error");

    }

});

//updating the task info, the data is provided in the body of the request
router.patch("/tasks/:id", auth,async (req, res) => {

    //inorder to make sure that body only contains valid keys
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidUpdate = updates.every((update) => {

        return allowedUpdates.includes(update);

    });

    if(!isValidUpdate)
    {
        return res.status(400).send();
    }

    const _id = req.params.id;

    // Check if it's a valid ObjectId
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) 
    {
        return res.status(404).send("Invalid ID format");
    }

    try {

        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});

        if(!task)
        {
            return res.status(404).send();
        }

        updates.forEach((update) => {

            task[update] = req.body[update];

        });

        await task.save();

        res.send(task);

    } catch(error) {

        res.status(500)
        .send("error");

    }

});

router.delete("/tasks/:id", auth, async (req, res) => {

    try {
    
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});

        if(!task) 
        {
            return res.status(404).send();
        }

        await task.remove();

        res.send(task);

    } catch(error) {

        res.status(500).send("error");

    }

})

module.exports = router;