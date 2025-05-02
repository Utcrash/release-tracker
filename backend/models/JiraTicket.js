const mongoose = require('mongoose');

const jiraTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        index: true
    },
    summary: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    assignee: {
        type: String,
        default: 'Unassigned'
    },
    priority: {
        type: String,
        default: 'Medium'
    },
    components: [{
        type: String
    }],
    fixVersions: [{
        type: String
    }],
    created: {
        type: String,
        required: true
    },
    updated: {
        type: String,
        required: true
    },
    lastSyncedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Simple index on ticketId
jiraTicketSchema.index({ ticketId: 1 });

module.exports = mongoose.model('JiraTicket', jiraTicketSchema); 