const mongoose = require("mongoose");
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
})

let Listing = mongoose.model("Listing",listingSchema);

module.exports = Listing;