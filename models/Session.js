const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({

  userEmail: String,

  vehicleNumber: String,

  vehicleType: String,

  slot: String,

  zone: String,

  areaName: String,

  province: String,

  entryTime: {
    type: Date,
    default: Date.now
  },

  exitTime: Date,

  duration: Number,

  cost: Number,

  status: {
    type: String,
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("Session", SessionSchema);