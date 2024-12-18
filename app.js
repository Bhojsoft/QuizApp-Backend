const express = require("express");
const app = express();
const testroute = require("./routers/Test.router");
const userroute = require("./routers/user.routes");
const adminRouter = require("./routers/admin.router");
const practicetestRouter = require("./routers/practicetest.router");
const instituteRoutes = require("./routers/Institutes_routes"); 
const teacherRoutes = require('./routers/Teacher.js');
const collegesRoute = require('./routers/colleges');
require("dotenv").config();

const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

const path = require("path");

// Serve static files from the 'public' directory
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/tests", testroute);
app.use("/api", userroute);
app.use("/admin", adminRouter);
app.use("/practicetest", practicetestRouter);

const notificationRoutes = require("./routers/Notification.router");
app.use("/notifications", notificationRoutes);

const courseRoute = require("./routers/course.router");
app.use("/course", courseRoute);

const reviewRoute = require("./routers/review.router");
app.use("/review", reviewRoute);
app.use("/api/institute", instituteRoutes);
app.use('/api/teachers', teacherRoutes);

app.use(collegesRoute);


const globalSearch = require("./routers/serach.router");
app.use("/search", globalSearch);
app.get("/", (req, res) => {
  res.send("welcome :-)");
});

module.exports = app;
