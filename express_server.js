const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: [""],
    maxAge: 24 * 60 * 60 * 1000
  })
);

var urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "user_id1" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user_id2" }
};

const users = {
  userRandomID: {
    id: "user1RandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

var urlsForUser = function(someUser) {
  let filtered = {};
  for (shortURL in urlDatabase) {
    if (someUser == urlDatabase[shortURL].userID) {
      filtered[shortURL] = urlDatabase[shortURL];
    }
  }
  return filtered;
};

function generateRamdomString() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

function getUserEmail(user_id) {
  if (user_id) {
    if (users[user_id]) {
      return users[user_id].email;
    } else {
      return "that user doesn't exist";
    }
  } else {
    return "user_id1";
  }
}

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let fliteredDatabase = urlsForUser(req.session.user_id);
    let userEmail = getUserEmail(req.session.user_id);
    let templateVars = {
      urls: fliteredDatabase,
      email: userEmail,
      username: req.session.user_id,
      users: users
    };
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
      var shorteningURL = generateRamdomString();
      urlDatabase[shorteningURL] = {
        longURL: req.body.longURL,
        userID: req.session.user_id
      };
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
      longURL: urlDatabase[req.params.id],
      email: getUserEmail(req.session.user_id),
      username: req.session.user_id,
      users: users
    };
    res.render("urls_new", templateVars);
  } else {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  }
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  } else {
    if (req.session.user_id === urlDatabase[req.params.id].userID) {
      let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id].longURL,
        email: getUserEmail(req.session.user_id),
        username: req.session.user_id,
        users: users
      };
      res.render("urls_show_updateURL", templateVars);
    } else {
      res.status(401).send("You don't have the access to this URL");
    }
  }
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    if (req.body.longURL) {
      urlDatabase[req.params.id].longURL = req.body.longURL;
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
  if (!urlDatabase[req.params.id]) {
    res.send(
      '<p>Please <a href="/login"> log in</a> first </p></ br><p>Or <a href="/register">register</a> here</p>'
    );
  } else {
    if (req.session.user_id === urlDatabase[req.params.id].userID) {
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
    } else {
      res.status(401).send("You don't have the access to this URL");
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
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
      longURL: urlDatabase[req.params.id],
      username: req.session.user_id,
      email: getUserEmail(req.session.user_id),
      users: users
    };
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(403).send("Please input your username/password");
  } else {
    let verifyID = false;
    for (userID in users) {
      if (
        users[userID].email === req.body.username &&
        bcrypt.compareSync(req.body.password, users[userID].password)
      ) {
        verifyID = true;
        req.session.user_id = userID;
        break;
      }
    }
    if (verifyID) {
      res.redirect("/urls");
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
      longURL: urlDatabase[req.params.id],
      username: req.session.user_id,
      users: users
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
    for (user in users) {
      if (users[user].email === req.body.username) {
        isUnique = false;
        break;
      }
    }

    if (isUnique) {
      let newID = generateRamdomString();
      let origPassword = req.body.password;
      users[newID] = {
        id: newID,
        email: req.body.username,
        password: bcrypt.hashSync(origPassword, 10)
      };
      req.session.user_id = newID;
      res.redirect("/urls");
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
