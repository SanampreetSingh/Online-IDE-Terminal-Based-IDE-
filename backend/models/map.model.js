const mongoose = require('mongoose');

const MapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true, // Enforces one active IDE instance per user
        index: true,
    },
    containerId: {
        type: String,
        required: [true, 'Container ID is required'],
        unique: true, 
    },
    status: {
        type: String,
        enum: ['active', 'stopped', 'paused'],
        default: 'active',
    },
    lastActive: {
        type: Date,
        default: Date.now,
        index: true, // Crucial for optimizing the cleanup service queries
    },
    volumePath: {
        type: String,
        required: [true, 'Volume path is required'],
    },
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Helper method to quickly update activity timestamp when a user interacts via WebSockets or saves a file
MapSchema.methods.touch = function() {
    this.lastActive = Date.now();
    return this.save();
};

module.exports = mongoose.model('Map', MapSchema);