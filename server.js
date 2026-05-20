require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const User = require("./models/User");
const Session = require("./models/Session");
const WalletTransaction = require("./models/WalletTransaction");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log("MongoDB Error:", err));

app.post("/register", async (req, res) => {
  try {
    const { fname, lname, email, phone, vehicleNumber, vehicleType, password } = req.body;

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.json({
        success: false,
        message: "Email already registered"
      });
    }

    const user = new User({
      fname,
      lname,
      email,
      phone,
      vehicleNumber,
      vehicleType,
      password,
      walletBalance: 0,
      sessions: 0,
      totalSpent: 0,
      status: "active"
    });

    await user.save();

    res.json({
      success: true,
      message: "User registered successfully",
      user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    res.json({
      success: true,
      message: "Login success",
      user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/entry", async (req, res) => {
  try {
    const {
      userEmail,
      vehicleNumber,
      vehicleType,
      slot,
      zone,
      areaName,
      province
    } = req.body;

    const session = new Session({
      userEmail,
      vehicleNumber,
      vehicleType,
      slot,
      zone,
      areaName,
      province,
      status: "active"
    });

    await session.save();

    res.json({
      success: true,
      message: "Parking session started",
      session
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/exit", async (req, res) => {
  try {
    const { userEmail, sessionId, duration, cost } = req.body;

    const session = await Session.findOne({
      userEmail,
      status: "active"
    }).sort({ entryTime: -1 });

    if (!session) {
      return res.json({
        success: false,
        message: "No active parking session"
      });
    }

    const exitTime = new Date();
    const durationMs = exitTime - session.entryTime;

    const durationMinutes =
      Number(duration) ||
      Math.max(1, Math.ceil(durationMs / 60000));

    const finalCost =
      Number(cost) ||
      durationMinutes * 10;

    session.exitTime = exitTime;
    session.duration = durationMinutes;
    session.cost = finalCost;
    session.status = "completed";

    await session.save();

    const user = await User.findOne({ email: userEmail });

    if (user) {
      user.walletBalance = (user.walletBalance || 0) - finalCost;
      user.sessions = (user.sessions || 0) + 1;
      user.totalSpent = (user.totalSpent || 0) + finalCost;

      await user.save();
    }

    res.json({
      success: true,
      message: "Exit successful",
      duration: durationMinutes,
      cost: finalCost,
      user,
      session
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/history/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const sessions = await Session.find({
      userEmail: email
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      sessions
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/topup", async (req, res) => {

  try {

    const {
      userEmail,
      amount,
      method
    } = req.body;

    const user =
      await User.findOne({
        email: userEmail
      });

    if (!user) {

      return res.json({
        success: false,
        message: "User not found"
      });

    }

    user.walletBalance =
      (user.walletBalance || 0) +
      Number(amount);

    await user.save();

    const txn =
      new WalletTransaction({

        userEmail,

        type: "credit",

        amount: Number(amount),

        method,

        description:
          "Wallet Top Up"

      });

    await txn.save();

    res.json({

      success: true,

      walletBalance:
        user.walletBalance,

      transaction: txn

    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});