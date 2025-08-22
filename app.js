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
const {getCoordinates} = require("./middleware.js");
const Notification = require("./models/notification");
const {autoExpireListings} = require("./middleware.js");

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
    let userData = req.body.user;
    console.log(userData);

    // ✅ Get coordinates from location string
    const coordinate = await getCoordinates(userData.location);
    console.log(coordinate);

    let newUser = new User({
      username: userData.username,
      email: userData.email,
      location: userData.location.toUpperCase().trim(),
      role: userData.role,
      geometry: coordinate   // save as GeoJSON
    });

    let saveUser = await User.register(newUser, userData.password);

    // ✅ log in user immediately after signup
    req.login(saveUser, (err) => {
      if (err) return next(err);
      res.redirect("/welcome");
    });
  } catch (e) {
    console.error(e);
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


app.get("/listings", async (req, res) => {
    try {
        // Ensure user is logged in
        if (!req.user) {
            req.flash("error", "You need to login first!");
            return res.redirect("/login");
        }

        let filter = {};

        if (req.user.role === "volunteer" && req.user.location) {
            filter.location = req.user.location;
        }

        const allListings = await Listing.find(filter);
        console.log("Listings found:", allListings);     //printing all listing that matches
        res.render("listings/listing.ejs", { allListings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});




app.post("/listing", async(req,res)=>{
   // console.log(req.body)
   let newListing = new Listing(req.body.listing);
   let saveListing = await newListing.save();
   console.log(saveListing);
   res.redirect("/listings");
})

app.get("/listings/:id", async (req, res) => {
    try {
        await autoExpireListings();
        let { id } = req.params;
        let listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        res.render("listings/show.ejs", { listing });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

// Mark listing as Picked Up
app.post("/listings/:id/pickup", async (req, res) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // ✅ Update status
        listing.status = "Picked Up";
        await listing.save();

        req.flash("success", "You have picked up this donation!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});



app.get("/dashboard/:id", async (req, res) => {
  let { id } = req.params;
  let user = await User.findById(id);

  let notifications = [];
  let donorListings = [];
  let totalMeals = 0;
  let totalCO2 = 0;

  if (user.role === "volunteer") {
    notifications = await Notification.find({ recipient: user._id }).sort({ createdAt: -1 });
     let deliveredListings = await Listing.find({  
    volunteer: user._id, 
    status: { $in: ["picked Up"] } 
  })

    totalMeals = deliveredListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
    totalCO2 = totalMeals * 2.5; 
  }

  if (user.role === "donar") {
    donorListings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });

    // calculate stats
    totalMeals = donorListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
    totalCO2 = totalMeals * 2.5; 
  }

  res.render("listings/donardash.ejs", { 
    donar: user, 
    currUser: req.user, 
    notifications,
    donorListings,
    totalMeals,
    totalCO2
  });
});




app.get("/donate/:id",async (req,res)=>{
   let {id} = req.params;
   let user = await User.findById(id);
   res.render("listings/donar/details.ejs",{user});
});



app.post("/donate/:id", async (req,res) => {
  try {
    const coordinate = await getCoordinates(req.body.donar.location);
    let { id } = req.params;

    let newList = new Listing(req.body.donar);
    location: req.body.donar.location.toUpperCase().trim();
    let user = await User.findById(id);

    newList.owner = user._id;
    newList.geometry = coordinate;

    let saveList = await newList.save();
    console.log("Donation saved:", saveList);

    // ✅ Find volunteers within 5km
    const volunteers = await User.find({
      role: "volunteer",
      geometry: {
        $near: {
          $geometry: { type: "Point", coordinates: coordinate.coordinates },
          $maxDistance: 5000 // 5km radius
        }
      }
    });

    console.log("Nearby Volunteers:", volunteers);

    for (let v of volunteers) {
    await Notification.create({
    recipient: v._id,
    message: `${user.username} donated ${newList.food} at ${newList.location}`,
    listing: newList._id
  });
    }

    // ✅ Here you can trigger notifications (email or in-app)
    // volunteers.forEach(v => sendEmail(v.email, user.username, newList.food, newList.location));

    req.flash("success", "Donation listed successfully, volunteers notified!");
    res.redirect(`/donate/${newList.owner._id}/lists`);

  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while adding donation.");
    res.redirect(`/donate/${req.params.id}`);
  }
});


app.get("/donate/:id/lists", async (req, res) => {
    let { id } = req.params;
    let donarListings = await Listing.find({ owner: id }).populate("owner");

    // Calculate time left for each listing
    const now = new Date();
    donarListings = donarListings.map(list => {
        if (list.expiresAt) {
            const diffMs = list.expiresAt - now;
            if (diffMs > 0) {
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                list.timeLeft = `${hours}h ${minutes}m left`;
            } else {
                list.timeLeft = "Expired";
                list.status = "Expired"; // Auto mark expired
            }
        }
        return list;
    });

    res.render("listings/donar/list.ejs", { donarListings });
});

app.get("/leaderboard", async (req, res) => {
  // Fetch donors only
  let donors = await User.find({ role: "donar" });

  // For each donor, calculate meals donated
  let donorStats = [];
  for (let donor of donors) {
    let listings = await Listing.find({ owner: donor._id, status: { $in: ["Available", "Picked Up"] } });
    let totalMeals = listings.reduce((sum, l) => sum + (l.quantity || 0), 0);

    // Assign badge 🎖️
    let badge = "🌱 Starter";
    if (totalMeals >= 100) badge = "🥇 Gold Donor";
    else if (totalMeals >= 50) badge = "🥈 Silver Donor";
    else if (totalMeals >= 20) badge = "🥉 Bronze Donor";

    donorStats.push({
      username: donor.username,
      totalMeals,
      badge
    });
  }

  // Sort donors by meals donated (highest first)
  donorStats.sort((a, b) => b.totalMeals - a.totalMeals);

  res.render("listings/leaderboard.ejs", { donorStats });
});



app.listen(8080, () => {
  console.log("listing to the port 8080");
});
