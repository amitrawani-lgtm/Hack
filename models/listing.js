const mongoose = require("mongoose");
const User = require("./user.js");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    food: {
        type: String,
        required: true,
    },
    image:{
        type:String,
    },
    location:{
        type:String,
    },
    geometry:{
     type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
    },
    owner:{
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    quantity:{
        type:Number,
    }
})

let Listing = mongoose.model("Listing",listingSchema);

module.exports = Listing;