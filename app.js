const express = require('express');
const app = express()
const testroute = require('./routers/Test.router');
const userroute =require('./routers/user.routes');
const adminRouter = require('./routers/admin.router');
const practicetestRouter= require('./routers/practicetest.router')




const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());



app.use('/api/tests', testroute);
app.use('/api', userroute);
app.use('/admin', adminRouter);
app.use('/practicetest', practicetestRouter);

const notificationRoutes = require("./routers/Notification.router");
app.use("/notifications", notificationRoutes);
 
const courseRoute = require("./routers/course.router");
app.use("/course", courseRoute);

// const reviewRoute= require("./routers/review.router");
// app.use("/review", reviewRoute);

module.exports = app;