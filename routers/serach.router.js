const {
    searchCourseByName,
    searchUserByName
  } = require("../controllers/search.controller");
  const express = require("express");
  const router = express.Router();
  
 
  router.get("/searchCourses", searchCourseByName);
  router.get("/searchuser", searchUserByName);
  
  module.exports = router;
      