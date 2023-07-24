const express = require('express');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const moment = require('moment')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//initialize the database 
global.db = new sqlite3.Database('./database.db', function (err) {
  if (err) {
    console.error(err);
    process.exit(1); //Bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); //This tells SQLite to pay attention to foreign key constraints
  }
});

// Session middleware setup
app.use(session({
  secret: 'assignment2040', // Change this to a strong, random string in production
  resave: false,
  saveUninitialized: true,
}));


// create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS testUsers (
        test_user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        test_if_author BOOLEAN DEFAULT 0,
        test_password TEXT NOT NULL, 
        test_created TEXT
    );`);

  db.run(`CREATE TABLE IF NOT EXISTS testUserRecords (
      test_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_record_content TEXT,
      test_record_title TEXT NOT NULL, 
      test_record_subtitle TEXT,
      test_record_date TEXT,
      test_isPublished BOOLEAN, 
      test_user_id INT, --the user that the record belongs to
      FOREIGN KEY (test_user_id) REFERENCES testUsers(test_user_id)
  );`)

  var now = new moment().format('MM/DD/YYYY hh:mm:ss')
  console.log(now)
  // remember to undo this before I submit
  db.run('INSERT INTO testUsers ("test_name", "test_if_author", "test_password", "test_created") VALUES (?, ?, ?, ?);', ["Simon Star", 1, "password", now])
  db.run('INSERT INTO testUserRecords ("test_record_content", "test_user_id", "test_record_title", "test_isPublished") VALUES(?, ?, ?, ?);', 
  ["This is a test article", 1, "Test", 0])

});



const userRoutes = require('./routes/user');

//set the app to use ejs ordering
app.set('view engine', 'ejs');

// login page is the default homepage
app.get('/', (req, res) => {
  const data = {
    isLoggedIn: false,
    errors: [],
    loginError: '',
  }
  res.render("login", data);
});


app.post('/', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { errors: errors.array() });
  }
  const username = req.body.username;
  const password = req.body.password;
  var query = "SELECT * FROM testUsers WHERE test_name = ?"
  db.serialize(function () {
    db.get(query, [username], function (err, user) {
      if (err) {
        next(err); //send the error on to the error handler
      } else {
        if (!user || user.test_password !== password) {
          return res.render('login', { loginError: 'Invalid username or password', errors: [] });
          
        }
        req.session.userId = user.test_user_id;
        req.session.username = user.test_name
        if (user.test_if_author) { 
          res.redirect('/user/home');
        }
        else { 
          res.redirect('/user/record-list')
        }
      }
    });

  })
});

//signup page
app.get('/signup', (req, res) => {
  const data = {
    errors: ''
  }
  res.render("signup", data);
});

// Route to handle the form submission with validation
app.post('/signup', [
  body('username').notEmpty().isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('signup', { errors: errors.array() });
  }

  // Here, you can handle the valid input data, for example, save it to a database.
  const { username, password } = req.body;
  var isAuthor = 0; 
  
  // ...
  var now = new moment().format('MM/DD/YYYY hh:mm:ss')
  console.log(now)

  db.serialize(function () {
    db.run(
      "INSERT INTO testUsers ('test_name','test_password', 'test_if_author', 'test_created') VALUES( ?, ?, ?, ?);",
      [username, password, isAuthor, now],
      function (err) {
        if (err) {
          next(err); //send the error on to the error handler
        } else {
          res.redirect('/')
          next();
        } 
      }
    );
  });
});

//this adds all the userRoutes to the app under the path /user
app.use('/user', userRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
