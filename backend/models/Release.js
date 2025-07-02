const mongoose = require('mongoose');

const componentDeliverySchema = new mongoose.Schema({
    name: { type: String, required: true },
    dockerHubLink: { type: String, default: null },
    eDeliveryLink: { type: String, default: null }
}, { _id: false });

const releaseSchema = new mongoose.Schema({
    _id: { type: String },
    version: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Planned' },
    jiraTickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JiraTicket' }],
    commits: [{ type: String }],
    notes: { type: String, default: '' },
    additionalPoints: [{ type: String }],
    componentDeliveries: [componentDeliverySchema],
    releasedBy: { type: String },
    jenkinsBuildUrl: { type: String },
    serviceId: { type: String },
    customers: [{ type: String }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save middleware to set _id to version if not set
releaseSchema.pre('save', function (next) {
    if (!this._id) {
        this._id = this.version;
    }
    next();
});

module.exports = mongoose.model('Release', releaseSchema); 