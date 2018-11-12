const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const helperFunction = require("./helperFunction.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: [""],
    maxAge: 24 * 60 * 60 * 1000
  })
);

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      urls: helperFunction.urlsForUser(req.session.user_id),
      email: helperFunction.getUserEmail(req.session.user_id),
      username: req.session.user_id,
      users: helperFunction.users
    }; //pass all the variales that will be invoked in the EJS template
    res.render("urls_index", templateVars);
  } else {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    if (req.body.longURL) {
      var shorteningURL = helperFunction.generateRamdomString();
      helperFunction.urlDatabase[shorteningURL] = {
        longURL: req.body.longURL,
        userID: req.session.user_id
      }; //add the longURL and user_id which creates the shortened URL to the object of shoetened URL
      res.redirect("/urls");
    } else {
      res.send(
        '<p>Please input a valid URL and <a href="/urls/new">try </a> again.</p>'
      );
    }
  } else {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      longURL: helperFunction.urlDatabase[req.params.id],
      email: helperFunction.getUserEmail(req.session.user_id),
      username: req.session.user_id,
      users: helperFunction.users
    };
    res.render("urls_new", templateVars);
  } else {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  }
});

app.get("/urls/:id", (req, res) => {
  if (!helperFunction.urlDatabase[req.params.id]) {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  } else {
    if (
      req.session.user_id === helperFunction.urlDatabase[req.params.id].userID
    ) {
      let templateVars = {
        shortURL: req.params.id,
        longURL: helperFunction.urlDatabase[req.params.id].longURL,
        email: helperFunction.getUserEmail(req.session.user_id),
        username: req.session.user_id,
        users: helperFunction.users
      };
      res.render("urls_show_updateURL", templateVars);
    } else {
      res.status(401).send("You don't have the access to this URL");
    }
  }
});

//edit the shortURL-longURL pair by updating a new long URL
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    if (req.body.longURL) {
      helperFunction.urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls");
    } else {
      res.send(
        `<p>Please input a valid URL and <a href="/urls/${
          req.params.id
        }">try </a> again.</p>`
      );
    }
  } else {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (!helperFunction.urlDatabase[req.params.id]) {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  } else {
    if (
      req.session.user_id === helperFunction.urlDatabase[req.params.id].userID
    ) {
      delete helperFunction.urlDatabase[req.params.id];
      res.redirect("/urls");
    } else {
      res.status(401).send("You don't have the access to this URL");
    }
  }
});

//redirect to the website according to the long URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = helperFunction.urlDatabase[req.params.shortURL].longURL;
  if (longURL) {
    res.redirect(`${longURL}`);
  } else {
    res
      .status(401)
      .send(
        '<p>Boo! There is no way to go. Back to the <a href="/urls">main page</a></p>'
      );
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: helperFunction.urlDatabase[req.params.id],
      username: req.session.user_id,
      email: helperFunction.getUserEmail(req.session.user_id),
      users: helperFunction.users
    };
    res.render("urls_login", templateVars);
  }
});

//allow user to log in by checking the email and password of user's; report errow message when input the wrong information
app.post("/login", (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(403).send("Please input your username/password");
  } else {
    let verifyID = false; //assign the veryfyID to be true only when inputs match both the password and username in user database
    for (userID in helperFunction.users) {
      if (
        helperFunction.users[userID].email === req.body.username &&
        bcrypt.compareSync(
          req.body.password,
          helperFunction.users[userID].password
        ) //compare the hashed password and input password
      ) {
        verifyID = true;
        req.session.user_id = userID;
        break;
      }
    }
    if (verifyID) {
      res.redirect("/urls"); //redirect to the main page when successfully logging in
    } else {
      res.send(
        '<p>Please register first <a href="/register">Register here</a></p>'
      );
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: helperFunction.urlDatabase[req.params.id],
      username: req.session.user_id,
      users: helperFunction.users
    };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.send(
      '<p> Please fill the required field <a href="/register"> Go back</a></p>'
    );
  } else {
    let isUnique = true;
    for (user in helperFunction.users) {
      if (helperFunction.users[user].email === req.body.username) {
        isUnique = false; // assigned when the inout email already existed in the user database
        break;
      }
    }

    if (isUnique) {
      let newID = helperFunction.generateRamdomString();
      let origPassword = req.body.password;
      helperFunction.users[newID] = {
        id: newID,
        email: req.body.username,
        password: bcrypt.hashSync(origPassword, 10) //check the consistency of hashed password and input one when log-in
      };
      req.session.user_id = newID;
      res.redirect("/urls"); // redirect to the main page when registration succeeds
    } else {
      res.send(
        '<p> Seemingly you have already an account, please <a href="/login"> login</a></p>'
      );
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});
