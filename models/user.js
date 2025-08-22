const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["donar", "volunteer"],  // restrict to only these values
        required: true
    },
    location:{
        type : String,
    },
    geometry: {
    type: {
      type: String,
      enum: ["Point"], // GeoJSON type must be Point
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    }
   }

});

userSchema.plugin(passportLocalMongoose);

userSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
