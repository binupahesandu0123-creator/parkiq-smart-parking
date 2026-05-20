const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  phone: String,
  vehicleNumber: String,
  vehicleType: String,
  password: String,
  walletBalance: {
    type: Number,
    default: 0
  },
  sessions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);