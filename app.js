require("dotenv").config();
///////////////////////////////////////////DEPENDENCIES////////////////////
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-find-or-create");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//////////////////////////////////////SESSION COOKIE////////////////////////
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

////////////////////////////////////////PASSPORT/SESSION INIT///////////////////
app.use(passport.initialize());
app.use(passport.session());

///////////////////////////////////////////MONGOOSE CONNNECT//////////////////////
mongoose.connect("mongodb://0.0.0.0:27017/userDB");

////////////////////////////////////////////NEW MONGOOSE SCHEMA//////////////////
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  username: String,
  googleId: String,
  secret: String
});

//////////////////////////////////////ATTACTCH PASSPORT TO MONGOOSE///////////////
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

/////////////////////////////////////////////////////MONGOOSE MODEL/////////////
const User = new mongoose.model("User", userSchema);

//////////////////////////////////////////////////////////NEW STRAGETY/////////
passport.use(User.createStrategy());

/////////////////////////////////////////////////////SERIALIZE/DESERIALIZE//////

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

/////////////////////////////////////////////////////////GOOGLE STRATEGY////////

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate(
        { username: profile.emails[0].value, googleId: profile.id },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

//////////////////////////////////GET/////////////////////////////

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["openid", "profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {


  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers){
        res.render("secrets", {usersWithSecrets: foundUsers});
      };
    };
  });
});


app.get("/submit", function(req, res){

  if (req.isAuthenticated()){
    res.render("submit")
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

//////////////////////////////////POST//////////////////////////////

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user._id.toString(), function(err, foundUser){
    if (err) {
      console.log (err);
    } else {
      if (foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets")
        });
      }else {
        res.send("User not found")
      }
    }
  })

})

//////////////////////////////////////////////////LISTEN/////////////
app.listen(3000, function () {
  console.log("Server started on port: 3000");
});
