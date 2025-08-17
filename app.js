const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");

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

app.get("/",(req,res)=>{
    res.render("listings/index.ejs");
})

app.get("/signup",(req,res)=>{
   res.render("listings/signup.ejs");
})

app.post("/signup",(req,res)=>{
   res.render("listings/welcome.ejs");
})

app.get("/listings", async(req,res)=>{
   let allListings = await Listing.find();
   console.log("all listing is :")
   res.render("listings/listing.ejs",{allListings});
})

app.post("/listing", async(req,res)=>{
   // console.log(req.body)
   let newListing = new Listing(req.body.listing);
   let saveListing = await newListing.save();
   console.log(saveListing);
   res.redirect("/listings");
})

app.get("/dashboard",(req,res)=>{
    res.render("listings/donardash.ejs");
})

app.listen(8080, () => {
  console.log("listing to the port 8080");
});
