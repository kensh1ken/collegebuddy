const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Electronics",
        "Books",
        "ID Card",
        "Wallet",
        "Keys",
        "Clothing",
        "Accessories",
        "Other",
        "Others",
      ],
    },

    type: {
      type: String,
      required: true,
      enum: ["Lost", "Found"],
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Open", "Claimed"],
      default: "Open",
    },

    contactNumber: {
      type: String,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LostFound", lostFoundSchema);