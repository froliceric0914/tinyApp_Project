const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser())



var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

const getKey = (obj,val) => Object.keys(obj).find(key => obj[key] === val);


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
  let templateVars = { urls: urlDatabase,
                       username: req.cookies["user_id"],
                       users: users};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let newID = generateRamdomString();
  urlDatabase[newID] = req.body.longURL;
  let shortURL = newID;
  // console.log(urlDatabase)
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});



app.get("/urls/:id", (req,res)=>{
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      username: req.cookies["user_id"],
                      users: users}
  res.render("urls_show_updateURL", templateVars);
});

app.post("/urls/:id", (req,res)=>{
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls')

})


app.post("/urls/:id/delete", (req, res)=> {
  delete urlDatabase[req.params.id];
  // console.log(urlDatabase)
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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
    res.sendStatus(403);
  }
  else {
    let verifyID = false;
    for (user in users) {
      if (users[user].email === req.body.username
        && users[user].password === req.body.password){
         console.log("Wrong credentials")
        //console.log("password:", users[user].password)
        verifyID = true;
        break;
      }
    }
    if (verifyID){
        // need to find the userID according to the email
        res.cookie("user_id", req.body.username);
        res.redirect('/urls');
    } else {
      res.sendStatus(403);
    }
  }
  //need to react differently when name wrong or password wrong
})

app.post("/logout", (req, res)=>{
  res.clearCookie("user_id");
  console.log(users)
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
        break; // continue the iteration
      }
    }//avoid to send the res.redirect inside the interation;
    if(isUnique) {
      let newID = generateRamdomString();
        users[newID] = {id: newID,
                        email: req.body.username,
                        password: req.body.password};
        res.cookie("user_id", req.body.username);
        res.redirect('/urls');
    } else {
      res.sendStatus(400);
    }
  }
});



app.listen(PORT, ()=>{
  console.log(`Example app is listening on port ${PORT}`) });
