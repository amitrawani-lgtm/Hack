const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  food: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  freshness: {
    type: String,
    enum: ["Freshly Cooked", "Leftover (Same Day)", "Packaged Food"],
    required: true,
  },
  safehrs: {
    type: Number, // Safe to eat in hours
    required: true,
  },
  availablity: {
    type: String, // e.g., "6:00 PM - 9:00 PM"
    required: true,
  },
  image: {
    type: String, // image URL
    default: "https://via.placeholder.com/300", // fallback image
  },

  // Relations
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  // Location Info
  location: {
    type: String, // Textual location (e.g., Hostel Mess, Block A)
    required: true,
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
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date, // you can auto-calc: createdAt + safehrs
  },

  // Status (useful for volunteer flow)
  status: {
    type: String,
    enum: ["Available", "Picked Up", "Expired"],
    default: "Available",
  },
});

listingSchema.pre("save", function (next) {
  if (this.safehrs) {
    // createdAt defaults to now, so expiresAt = createdAt + safehrs
    this.expiresAt = new Date(Date.now() + this.safehrs * 60 * 60 * 1000);
  }
  next();
});


// ✅ Add geospatial index for queries like $near
listingSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Listing", listingSchema);
