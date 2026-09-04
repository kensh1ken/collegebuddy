const mongoose = require('mongoose')
const eventSchema = new mongoose.Schema({
   title: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    organizer: {
        type: String
    },

    eventDate: {
        type: Date,
        required: true
    },

    registrationDeadline: {
        type: Date
    },

    endDate: {
        type: Date
    },

    location: {
        type: String
    },

    registrationUrl: {
        type: String
    },

    imageUrl: {
        type: String
    },

    type: {
        type: String,
        enum: [
            "hackathon",
            "workshop",
            "competition",
            "seminar",
            "other"
        ],
        default: "other"
    }
    ,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true
}
)

eventSchema.index({ eventDate: 1, type: 1 });
eventSchema.index({ title: 'text', description: 'text', organizer: 'text', location: 'text' });

module.exports = mongoose.model('Event', eventSchema)
