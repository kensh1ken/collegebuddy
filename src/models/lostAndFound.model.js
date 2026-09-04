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

    incidentDate: {
      type: Date,
      default: Date.now,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    imageStoragePath: {
      type: String,
      select: false,
    },

    status: {
      type: String,
      enum: ["Open", "Claimed", "Resolved"],
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

lostFoundSchema.index({ type: 1, status: 1, createdAt: -1 });
lostFoundSchema.index({ title: 'text', description: 'text', location: 'text' });

lostFoundSchema.set('toJSON', {
  transform: (_document, returned) => {
    delete returned.__v;
    delete returned.imageStoragePath;
    return returned;
  },
});

module.exports = mongoose.model("LostFound", lostFoundSchema);
