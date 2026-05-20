const mongoose = require("mongoose");

const WalletTransactionSchema =
  new mongoose.Schema({

    userEmail: String,

    type: String,

    amount: Number,

    method: String,

    description: String

  }, { timestamps: true });

module.exports =
  mongoose.model(
    "WalletTransaction",
    WalletTransactionSchema
  );