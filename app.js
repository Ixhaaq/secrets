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

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//////////////////////////////////////SESSION COOKIE////////////////////////
app.use(
  session({
    secret: "Our little secret.",
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
});

//////////////////////////////////////ATTACTCH PASSPORT TO MONGOOSE///////////////
userSchema.plugin(passportLocalMongoose);

/////////////////////////////////////////////////////MONGOOSE MODEL/////////////
const User = new mongoose.model("User", userSchema);

//////////////////////////////////////////////////////////NEW STRAGETY/////////
passport.use(User.createStrategy());

/////////////////////////////////////////////////////SERIALIZE/DESERIALIZE//////
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//////////////////////////////////GET/////////////////////////////

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login")
    }
});

app.get("/logout", function (req, res) {

    req.logout((err) => {
        if(err){
            console.log(err)
        }else{
            res.redirect("/")
        }
    });
    
});

//////////////////////////////////POST//////////////////////////////

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password,
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

    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    })

});


//////////////////////////////////////////////////LISTEN/////////////
app.listen(3000, function () {
  console.log("Server started on port: 3000");
});
