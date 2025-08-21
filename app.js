const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const flash = require("connect-flash");

const sessionOption = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs",ejsMate);

main()
  .then((res) => console.log("connected successfully"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Kindplate");
}

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.messageA = req.flash("success");
  res.locals.messageE = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


app.get("/demouser", async (req,res)=>{
   let fakeUser = new User({
      email:"helo@gmail.com",
      username:"amit"
   })
   let saveUser = await User.register(fakeUser,"hello123");
   console.log(saveUser);
})


app.get("/",(req,res)=>{
    res.render("listings/index.ejs");
})

app.get("/signup",(req,res)=>{
   let role = req.query.role;
   res.render("user/signup.ejs",{role});
})

app.post("/signup", async (req, res, next) => {
  try {
    let user = req.body.user;
    let newUser = new User({
      username: user.username,
      email: user.email,
      role: user.role,
    });

    let saveUser = await User.register(newUser, user.password);

    // ✅ log in user immediately after signup
    req.login(saveUser, (err) => {
      if (err) return next(err);
      res.redirect("/welcome");   // 👉 go to welcome page route
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

app.get("/welcome", (req, res) => {
  if (!req.user) {
    req.flash("error", "Please log in first!");
    return res.redirect("/login");
  }
  res.render("listings/welcome.ejs");
});


// app.post("/signup",async (req,res)=>{
//    let user = req.body.user;
//    let newUser = new User({
//       username:user.username,
//       email : user.email,
//       role : user.role,
//    });
//     let saveUser = await User.register(newUser,user.password);
//     console.log(saveUser);
//     res.render("listings/welcome.ejs",{saveUser});
// })

app.get("/login",(req,res)=>{
    res.render("user/login.ejs");
})

app.post("/login",passport.authenticate("local",{
   failureRedirect: "/login",
   failureFlash: true,}), async (req,res)=>{
       res.redirect(`/dashboard/${req.user._id}`);
   })


app.get("/listings", async(req,res)=>{
   let allListings = await Listing.find();
   res.render("listings/listing.ejs",{allListings});
})


app.post("/listing", async(req,res)=>{
   // console.log(req.body)
   let newListing = new Listing(req.body.listing);
   let saveListing = await newListing.save();
   console.log(saveListing);
   res.redirect("/listings");
})

app.get("/dashboard/:id", async(req,res)=>{
    let {id} = req.params;
    let donar = await User.findById(id);
    res.render("listings/donardash.ejs",{donar, currUser: req.user});
})

app.get("/donate/:id",async (req,res)=>{
   let {id} = req.params;
   let user = await User.findById(id);
   res.render("listings/donar/details.ejs",{user});
});

app.post("/donate/:id",async(req,res)=>{
   let {id} = req.params;
    let newList = await Listing(req.body.donar);
    console.log(req.body.donar);
    console.log(newList);
    let user = await User.findById(id);
    newList.owner = user._id;
    let saveList = await newList.save();
    console.log(saveList);
    res.redirect(`/donate/${newList.owner._id}/lists`);
})

app.get("/donate/:id/lists", async(req,res)=>{
    let {id}  = req.params;
     let donarListings = await Listing.find({ owner: id }).populate("owner");
     res.render("listings/donar/list.ejs",{donarListings});

})


app.listen(8080, () => {
  console.log("listing to the port 8080");
});
