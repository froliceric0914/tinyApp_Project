const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser())

const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);

/*
GET /

if user is logged in:
(Minor) redirect to /urls
if user is not logged in:
(Minor) redirect to /login

Cookie   set the expired date

*/

var urlDatabase = {
    "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "user_id1"},
    "9sm5xK": {longURL: "http://www.google.com", userID: "user_id2"},
};

const users = {
  "userRandomID": {
    id: "user1RandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// find the email by the user_id


// comparing the userID with the logged-in user's ID.
// which returns the subset of the URL database that belongs to the user with ID id

var urlsForUser = function (someUser) {
  let filtered = {}
  for (shortURL in urlDatabase){
    if (someUser == urlDatabase[shortURL].userID){
      filtered[shortURL] = urlDatabase[shortURL];
    }
  }
  return filtered;//return outside the loop, so could grape all the url with the id
}



function generateRamdomString () {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};


app.get("/", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

function getUserEmail(user_id) {
  if(user_id){
    if (users[user_id]) {
      return users[user_id].email;
    } else {
      return "that user doesn't exist";
    }
  } else {
    return "user_id1";
  }
}

// let getUserEmail = (user_id) => users[user_id].email

 // console.log(users['user_id1'].email);
// console.log(getUserEmail('user_id1'))

app.get("/urls", (req, res) => {
  console.log(users);
  if (req.cookies['user_id']) {
    let fliteredDatabase = urlsForUser(req.cookies['user_id']);
    let userEmail = getUserEmail(req.cookies["user_id"]);
    let templateVars = {urls: fliteredDatabase,
                        email: userEmail,
                       // shortURL: urlDatabase[]
                       username: req.cookies["user_id"],
                       users: users};
    res.render("urls_index", templateVars);
  } else {
    res.send('<p>Please log in first <a href="/login">Login here</a></p>')
    res.redirect(401, "/login");
  }
});

app.post("/urls", (req, res) => {
  var shorteningURL = generateRamdomString();
  urlDatabase[shorteningURL] = {longURL: req.body.longURL,
                                userID: req.cookies["user_id"]}
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let userEmail = getUserEmail(req.cookies["user_id"]);
    let templateVars = {longURL: urlDatabase[req.params.id],
                        email: userEmail,
                        username: req.cookies["user_id"],
                        users: users}
  res.render("urls_new", templateVars);
  } else {
    // res.redirect(401, '/login');
    res.send('<p>whatever <a href="http://google.com">meep!</a></p>')
  }
});

app.get("/urls/:id", (req,res)=>{
  //if a URL for the given ID does not exist:
let userEmail = getUserEmail(req.cookies["user_id"]);

  if(req.cookies['user_id'] === urlDatabase[req.params.id].userID) {
    let templateVars = {shortURL: req.params.id,
                    longURL: urlDatabase[req.params.id].longURL,
                    email: userEmail,
                    username: req.cookies["user_id"],
                    users: users}
    res.render("urls_show_updateURL", templateVars);
  } else {
    res.status(401).send("You don't have the access to this URL")
  }
});

app.post("/urls/:id", (req,res)=>{
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls')

})

app.post("/urls/:id/delete", (req, res)=> {
  if(req.cookies['user_id'] === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(401).send("You don't have the access to this URL")
  }

});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(`${longURL}`);
});


app.get("/login", (req, res)=>{
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      username: req.cookies["user_id"],
                      users: users}
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) =>{
  if (!req.body.username || !req.body.password) {
    res.status(403).send("Please input your username/password");
  }
  else {
    let verifyID = false;
    for (userID in users) {
      // console.log (users)
      // console.log(req.body.password)
      // console.log(users[user].password)
      if (users[userID].email === req.body.username
      && bcrypt.compareSync(req.body.password, users[userID].password)){
        verifyID = true;
        res.cookie("user_id", userID);
        break;
      }
    }
    if (verifyID){
        // need to find the userID according to the email
        res.redirect('/urls');
    } else {
      res.send('<p>Please register first <a href="/register">Register here</a></p>');

      res.redirect(403, '/register');
    }
  }
})

app.post("/logout", (req, res)=>{
  res.clearCookie("user_id");
  res.redirect('/urls');
});

app.get("/register", (req, res)=>{
   let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      username: req.cookies["user_id"],
                      users: users}
  res.render("urls_register",templateVars);
})

app.post("/register", (req, res)=>{
  if (!req.body.username || !req.body.password) {
    res.sendStatus(400);
  } else {
    let isUnique = true; //declare a marker, to see whether the any record matches the input
    for (user in users) {
      if (users[user].email === req.body.username) {
        isUnique = false;
        break; // break from the iteration and continue to do the next funtionality within the scoope
      }
    }//avoid to send the res.redirect inside the interation;
    if(isUnique) {
      let newID = generateRamdomString();
      let origPassword = req.body.password;
        users[newID] = {id: newID,
                        email: req.body.username,
                        password: bcrypt.hashSync(origPassword, 10)};
        console.log(users[newID]);
        console.log(bcrypt.compareSync(req.body.password, users[newID].password));
        res.cookie("user_id", newID);
        res.redirect('/urls');
    } else {
      res.redirect(400, '/login');
    }
  }
});



app.listen(PORT, ()=>{
  console.log(`Example app is listening on port ${PORT}`) });
