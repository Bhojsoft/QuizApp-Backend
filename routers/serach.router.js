const {
    searchCourseByName
  } = require("../controllers/search.controller");
  const express = require("express");
  const router = express.Router();
  
 
  router.get("/searchCourses", searchCourseByName);
  
  module.exports = router;
  