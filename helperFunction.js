module.exports = {
  urlDatabase: {
    b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "user_id1" },
    "9sm5xK": { longURL: "http://www.google.com", userID: "user_id2" }
  },
  users: {
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
  },
  urlsForUser: function(someUser) {
    let filtered = {};
    for (shortURL in this.urlDatabase) {
      if (someUser == this.urlDatabase[shortURL].userID) {
        filtered[shortURL] = this.urlDatabase[shortURL];
      }
    }
    return filtered;
  },
  generateRamdomString: function() {
    var text = "";
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  },
  getUserEmail: function(user_id) {
    if (user_id) {
      if (this.users[user_id]) {
        return this.users[user_id].email;
      } else {
        return "that user doesn't exist";
      }
    } else {
      return "user_id1";
    }
  }
};
