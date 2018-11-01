const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser())

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

/* find the email by the user_id
function getUserEmail(user_id) {
  return users[user_id].email;
}
*/

// comparing the userID with the logged-in user's ID.
// which returns the subset of the URL database that belongs to the user with ID id

var urlsForUser = function (someUser) {
  for (shortURL in urlDatabase){
    if (someUser === urlDatabase[shortURL].userID){
      return urlDatabase[shortURL];
      //only filter the only one object
    } else {
      console.log("not found ")
    }
  }
}

let result = urlsForUser("user_id1");

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

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  if (req.cookies['user_id']) {
    let fliteredDatabase = urlsForUser("user_id2");
    // let fliteredDatabase = urlsForUser(req.cookies['user_id']);
    console.log(urlsForUser("user_id2"))
    let templateVars = {urls: filteredDatabase,
                       // shortURL: urlDatabase[]
                       username: req.cookies["user_id"],
                       users: users};
    res.render("urls_index", templateVars);
  } else {
    res.redirect(401, "/login");
  }


  // let templateVars = { urls: urlDatabase,
  //                      // shortURL: urlDatabase[]
  //                      username: req.cookies["user_id"],
  //                      users: users};
    //display the useremail once login
    // console.log(users)

});

app.post("/urls", (req, res) => {
  var shorteningURL = generateRamdomString();
  // urlDatabase[newID] = req.body.longURL;
  urlDatabase[shorteningURL] = {longURL: req.body.longURL,
                                userID: req.cookies["user_id"]}
  // userID = {};
  // userID[shortURL] = req.body.longURL;
// console.log(shortURL);
  // uerID: {shortURL: longURL}
  //urlDatabase = {"userID": {shortURL: longURL} }
  res.redirect('/urls');
  // res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
      let templateVars = {longURL: urlDatabase[req.params.id],
                          username: req.cookies["user_id"],
                          users: users}
  res.render("urls_new", templateVars);
  } else {
    res.redirect(401, '/login');
  }
});



app.get("/urls/:id", (req,res)=>{
  //if a URL for the given ID does not exist:
//(Minor) returns HTML with a relevant error message
//if user is not logged in:
// returns HTML with a relevant error message
// if user is logged it but does not own the URL with the given ID:
// returns HTML with a relevant error message
let templateVars = {shortURL: req.params.id,
                    longURL: urlDatabase[req.params.id].longURL,
                    username: req.cookies["user_id"],
                    users: users}
  if(req.cookies['user_id'] === urlDatabase[req.params.id].userID) {
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
    res.redirect('/urls').send("delete successfully");
  } else {
    res.status(401).send("You don't have the access to this URL")
  }

});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect('/longURL');
  //the purposr og using this endpoint? shorteningURL part II
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
    for (user in users) {
      if (users[user].email === req.body.username
        && users[user].password === req.body.password){
        verifyID = true;
        var userID = users[user].id; //try to replace the var later
        break;
      }
    }
    if (verifyID){
        // need to find the userID according to the email
        res.cookie("user_id", userID);
        res.redirect('/urls');
    } else {
      res.redirect(403, '/register');
    }
  }
  //need to react differently when name wrong or password wrong
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
  //remove the templeVars later
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
        users[newID] = {id: newID,
                        email: req.body.username,
                        password: req.body.password};
        res.cookie("user_id", newID);
        res.redirect('/urls');
    } else {
      res.status(400).send('User already exists, please directly log in');
    }
  }
});



app.listen(PORT, ()=>{
  console.log(`Example app is listening on port ${PORT}`) });
