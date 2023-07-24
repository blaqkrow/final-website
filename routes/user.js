
/**
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 */
var sqlite3 = require('sqlite3').verbose();
const express = require("express");
const { body, validationResult } = require('express-validator');
const router = express.Router();
const assert = require('assert');
var db = new sqlite3.Database('database.db');
const session = require('express-session');
const moment = require('moment')

/**
 * @desc retrieves the current users
 */
// renders the draft route
router.get("/create-draft", (req, res) => {
  res.render("create-new-draft");
});

// fetches the article to edit
router.get("/update-record/:id", (req, res, next) => {
  const id = req.params.id;
  var query = "SELECT * FROM testUserRecords WHERE test_record_id = ?"

  db.serialize(function () {
    db.get(query, [id], function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        const data = {
          blog: rows
        }
        res.render("edit-user-record", data)
      }
    });
  });

});

//updates the article in question 
router.post('/update-record', (req, res, next) => {
  const id = parseInt(req.body.id)
  const title = req.body.title;
  const content = req.body.content;
  const subtitle = req.body.subtitle;
  var now = new moment().format('MM/DD/YYYY hh:mm:ss')
  console.log(now)


  db.serialize(function () {
    db.run('UPDATE testUserRecords SET test_record_title = ?, test_record_content = ?, test_record_subtitle = ?, test_record_date = ? WHERE test_record_id = ?', [title, content, subtitle, now, id], (err) => {
      if (err) {
        console.log(err)
        return res.status(500).send('Error updating blog.');
      }
      else {
        res.redirect('/user/home');
      }
    });
  });

});

// create a new draft
router.get("/create-draft", (req, res) => {
  res.render("create-new-draft");
});

// Route to handle form submission and save the new draft
router.post('/save-draft', (req, res, next) => {
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const content = req.body.content;
  var userId = req.session.userId;
  var now = new moment().format('MM/DD/YYYY hh:mm:ss')
  console.log(now)

  db.serialize(function () {
    db.run(
      "INSERT INTO testUserRecords ('test_record_title','test_record_subtitle', 'test_record_content', 'test_user_id', 'test_record_date', 'test_isPublished') VALUES( ?, ?, ?, ?, ?, ?);",
      [title, subtitle, content, userId, now, 0],
      function (err) {
        if (err) {
          next(err); //send the error on to the error handler
        } else {
          res.redirect('/user/home');
          next();
        }
      }
    );
  });

});

// Read the article in question
router.get("/read/:id", (req, res, next) => {
  const id = req.params.id;
  console.log(id)
  var query = "SELECT * FROM testUserRecords WHERE test_record_id = ?"
  var username = req.session.username
  db.serialize(function () {
    db.get(query, [id], function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        const data = {
          blog: rows,
          username: username
        }
        console.log(data)
        res.render("read-article", data)
      }
    });
  })
})

router.get("/record-list", (req, res, next) => {
  var query = "SELECT * FROM testUserRecords WHERE test_isPublished = ?"
  var username = req.session.username
  db.serialize(function () {
    db.all(query, [1], function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        const data = {
          records: rows,
          username: username
        }
        console.log(data)
        res.render("reader-homepage", data)
      }
    });
  })
})


router.post('/publish', (req, res, next) => {
  var isPublished = 1
  var now = new moment().format('MM/DD/YYYY hh:mm:ss')
  const postId = parseInt(req.body.postId);
  console.log(now)


  db.serialize(function () {
    db.run('UPDATE testUserRecords SET test_isPublished = ?, test_record_date = ? WHERE test_record_id = ?', [isPublished, now, postId], (err) => {
      if (err) {
        return res.status(500).send('Error updating blog.');
      }
      else {
        res.redirect('/user/home');
      }
    });
  });

});



router.get("/settings", (req, res, next) => {
  var query = "SELECT * FROM testUsers WHERE test_name = ?"
  var username = req.session.username
  db.serialize(function () {
    db.get(query, [username], function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        const data = {
          user: rows
        }
        res.render("author-settings", data)
      }
    });
  })
})


router.post('/settings', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], (
  req, res, next) => {
  var isPublished = 1
  var now = new moment().format('MM/DD/YYYY hh:mm:ss')
  console.log(now)

  var userId = req.body.userId


  db.serialize(function () {
    const username = req.body.updateUsername;
    const password = req.body.updatePassword;
    const pastUsername = req.body.username
    const pastPassword = req.body.password

    if (username == pastUsername) {
      db.run('UPDATE testUsers SET test_password = ? WHERE userId = ?', [password, userId], (err) => {
        if (err) {
          return res.status(500).send('Error updating user settings.');
        }
        res.redirect('/');
      });
    }
    else if (pastPassword == password) {
      db.run('UPDATE testUsers SET test_name = ?  WHERE userId = ?', [username, userId], (err) => {
        if (err) {
          return res.status(500).send('Error updating user settings.');
        }
        res.redirect('/');
      });
    }
    else {
      db.run('UPDATE testUsers SET test_name= ?, test_password = ?  WHERE userId = ?', [username, password, userId], (err) => {
        if (err) {
          return res.status(500).send('Error updating user settings.');
        }
        res.redirect('/');
      });
    }
  });

});


// Route to handle blog post deletion
router.post('/deletePost', (req, res) => {
  const postId = parseInt(req.body.postId);
  db.run('DELETE FROM testUserRecords WHERE test_record_id = ?', postId, (err) => {
    if (err) {
      return res.status(500).send('Error deleting blog post.');
    }
    res.redirect('/user/home');
  });
});


router.get("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }

    res.redirect('/');
  });
})

router.get("/get-test-users", (req, res, next) => {

  //Use this pattern to retrieve data
  //NB. it's better NOT to use arrow functions for callbacks with this library
  db.serialize(function () {
    db.all("SELECT * FROM testUsers", function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.json(rows);
      }
    });
  })

});

/**
 * @desc retrieves the current user records
 */
router.get("/get-user-records", (req, res, next) => {
  //USE this pattern to retrieve data
  //NB. it's better NOT to use arrow functions for callbacks with this library

  db.serialize(function () {
    db.all("SELECT * FROM testUserRecords", function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        res.json(rows);
      }
    });
  })
});
/* Renders the home page for both authors & readers */
router.get("/home", (req, res) => {

  var userId = req.session.userId
  var username = req.session.username
  var records;

  var query = "SELECT * FROM testUserRecords where test_user_id = ?"

  db.serialize(function () {
    db.all(query, [userId], function (err, rows) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        console.log(rows)
        records = rows
        const data = {
          isLoggedIn: false,
          username: username,
          records: records
        }


        res.render("homepage", data);
      }
    });
  })
});

/**
 * @desc Renders the page for creating a user record
 */
router.get("/create-user-record", (req, res) => {
  res.render("create-user-record");
});

/**
 * @desc Add a new user record to the database for user id = 1
 */
router.post("/create-user-record", (req, res, next) => {
  //USE this pattern to update and insert data
  //NB. it's better NOT to use arrow functions for callbacks with this library
  const data = generateRandomData(10);
  db.serialize(function () {
    db.run(
      "INSERT INTO testUserRecords ('test_record_title', 'test_record_content', 'test_user_id') VALUES( ?, ?, ?);",
      [data, data, 1],
      function (err) {
        if (err) {
          next(err); //send the error on to the error handler
        } else {
          res.send(`New data inserted @ id ${this.lastID}!`);
          next();
        }
      }
    );
  });

});

///////////////////////////////////////////// HELPERS ///////////////////////////////////////////

/**
 * @desc A helper function to generate a random string
 * @returns a random lorem ipsum string
 */
function generateRandomData(numWords = 5) {
  const str =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";

  const words = str.split(" ");

  let output = "";

  for (let i = 0; i < numWords; i++) {
    output += choose(words);
    if (i < numWords - 1) {
      output += " ";
    }
  }

  return output;
}

/**
 * @desc choose and return an item from an array
 * @returns the item
 */
function choose(array) {
  assert(Array.isArray(array), "Not an array");
  const i = Math.floor(Math.random() * array.length);
  return array[i];
}

module.exports = router;
