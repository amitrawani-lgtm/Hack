const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs",ejsMate);

app.get("/",(req,res)=>{
    res.render("listings/index.ejs");
})

app.get("/signup",(req,res)=>{
   res.render("listings/signup.ejs");
})

app.post("/signup",(req,res)=>{
   res.render("listings/welcome.ejs");
})

app.listen(8080, () => {
  console.log("listing to the port 8080");
});
