const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
const testRouter = require('./routers/test');

const app = express();
const port = process.env.PORT;

// app.use((req, res, next) => {

//     res
//     .status(503)
//     .send("Site is down for maintainence, will be back by tommorow");

// });

app.use(express.json());

app.use(userRouter);
app.use(taskRouter);
app.use(testRouter);

app.listen(port, () => {

    console.log("Server is up on port " + port);

});