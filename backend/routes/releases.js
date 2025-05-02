const express = require('express');
const router = express.Router();
const Release = require('../models/Release');
const JiraTicket = require('../models/JiraTicket');
const mongoose = require('mongoose');

// Get all releases
router.get('/', async (req, res) => {
    try {
        let query = {};

        // Filter by serviceId if provided
        if (req.query.serviceId) {
            query.serviceId = req.query.serviceId;
        }

        const releases = await Release.find(query)
            .populate('jiraTickets')
            .sort({ createdAt: -1 });

        res.json(releases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific release
router.get('/:id', async (req, res) => {
    try {
        console.log(`GET /api/releases/${req.params.id} - Fetching release details`);
        const { id } = req.params;

        // No longer need to validate ObjectId format since we're using strings
        const release = await Release.findById(id).populate('jiraTickets');

        if (!release) {
            console.log(`Release not found with ID: ${id}`);
            return res.status(404).json({ message: 'Release not found' });
        }

        console.log(`Found release: ${release.version}`);
        res.json(release);
    } catch (err) {
        console.error('Error fetching release:', err);
        res.status(500).json({ message: err.message });
    }
});

// Create a new release
router.post('/', async (req, res) => {
    try {
        // Check if a release with this version already exists
        const existingRelease = await Release.findOne({ version: req.body.version });
        if (existingRelease) {
            return res.status(400).json({
                message: `A release with version ${req.body.version} already exists`
            });
        }

        // Extract JIRA tickets from the request
        const ticketsFromRequest = req.body.tickets || [];
        const jiraTicketIds = [];

        if (ticketsFromRequest.length > 0) {
            console.log(`Processing ${ticketsFromRequest.length} tickets`);

            // Process each ticket
            for (const ticket of ticketsFromRequest) {
                // Check if the ticket already exists
                let jiraTicket = await JiraTicket.findOne({ ticketId: ticket.ticketId });

                if (!jiraTicket) {
                    console.log(`Creating new JIRA ticket: ${ticket.ticketId}`);
                    // Create a new ticket if it doesn't exist
                    jiraTicket = new JiraTicket({
                        ticketId: ticket.ticketId,
                        summary: ticket.summary,
                        status: ticket.status,
                        priority: ticket.priority,
                        assignee: ticket.assignee,
                        created: ticket.created,
                        updated: ticket.updated,
                        components: ticket.components || [],
                        fixVersions: ticket.fixVersions || []
                        // componentId is now optional, no need to provide a placeholder
                    });

                    try {
                        await jiraTicket.save();
                        console.log(`Saved ticket: ${ticket.ticketId}`);
                    } catch (ticketError) {
                        console.error(`Error saving ticket ${ticket.ticketId}:`, ticketError);
                        // Continue with other tickets even if one fails
                    }
                } else {
                    console.log(`Using existing ticket: ${ticket.ticketId}`);
                }

                if (jiraTicket && jiraTicket._id) {
                    jiraTicketIds.push(jiraTicket._id);
                }
            }
        }

        // Create the release object with _id same as version
        const release = new Release({
            _id: req.body.version,
            version: req.body.version,
            createdAt: req.body.createdAt || new Date(),
            status: req.body.status || 'Planned',
            jiraTickets: jiraTicketIds,
            commits: req.body.commits || [],
            notes: req.body.notes || '',
            additionalPoints: req.body.additionalPoints || [],
            componentDeliveries: req.body.componentDeliveries || [],
            releasedBy: req.body.releasedBy,
            jenkinsBuildUrl: req.body.jenkinsBuildUrl,
            serviceId: req.body.serviceId
        });

        const newRelease = await release.save();
        console.log(`Release ${newRelease._id} created with ${jiraTicketIds.length} tickets`);

        // Populate the jiraTickets field for the response
        const populatedRelease = await Release.findById(newRelease._id)
            .populate('jiraTickets');

        res.status(201).json(populatedRelease);
    } catch (err) {
        console.error('Error creating release:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update a release
router.put('/:id', async (req, res) => {
    try {
        console.log(`PUT /api/releases/${req.params.id} - Updating release`);
        const { id } = req.params;

        // No longer need to validate ObjectId format since we're using strings

        // Check if the release exists
        const release = await Release.findById(id);
        if (!release) {
            console.log(`Release not found with ID: ${id}`);
            return res.status(404).json({ message: 'Release not found' });
        }

        // Handle version changes - check if the new version conflicts with another release
        if (req.body.version && req.body.version !== id) {
            const existingRelease = await Release.findOne({ version: req.body.version });
            if (existingRelease && existingRelease._id.toString() !== id) {
                return res.status(400).json({
                    message: `A release with version ${req.body.version} already exists`
                });
            }
            // If changing version, need to create a new document with new ID and delete the old one
            // This is because MongoDB doesn't allow changing the _id field
            req.body._id = req.body.version;
        }

        // Handle JIRA ticket updates if provided
        if (req.body.tickets) {
            console.log(`Updating tickets for release: ${id}`);
            const ticketsFromRequest = req.body.tickets;
            const jiraTicketIds = [];

            // Process each ticket
            for (const ticket of ticketsFromRequest) {
                // Check if the ticket already exists
                let jiraTicket = await JiraTicket.findOne({ ticketId: ticket.ticketId });

                if (!jiraTicket) {
                    console.log(`Creating new JIRA ticket: ${ticket.ticketId}`);
                    // Create a new ticket if it doesn't exist
                    jiraTicket = new JiraTicket({
                        ticketId: ticket.ticketId,
                        summary: ticket.summary,
                        status: ticket.status,
                        priority: ticket.priority,
                        assignee: ticket.assignee,
                        created: ticket.created,
                        updated: ticket.updated,
                        components: ticket.components || [],
                        fixVersions: ticket.fixVersions || []
                        // componentId is now optional, no need to provide a placeholder
                    });

                    try {
                        await jiraTicket.save();
                        console.log(`Saved ticket: ${ticket.ticketId}`);
                    } catch (ticketError) {
                        console.error(`Error saving ticket ${ticket.ticketId}:`, ticketError);
                        // Continue with other tickets even if one fails
                    }
                } else {
                    console.log(`Using existing ticket: ${ticket.ticketId}`);
                }

                if (jiraTicket && jiraTicket._id) {
                    jiraTicketIds.push(jiraTicket._id);
                }
            }

            req.body.jiraTickets = jiraTicketIds;
            // Remove the tickets field to avoid conflicts
            delete req.body.tickets;
        }

        // Update the release
        const updatedRelease = await Release.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('jiraTickets');

        console.log(`Release ${id} updated successfully`);
        res.json(updatedRelease);
    } catch (err) {
        console.error('Error updating release:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete a release
router.delete('/:id', async (req, res) => {
    try {
        console.log(`DELETE /api/releases/${req.params.id} - Deleting release`);
        const { id } = req.params;

        // No longer need to validate ObjectId format since we're using strings

        const release = await Release.findById(id);

        if (!release) {
            console.log(`Release not found with ID: ${id}`);
            return res.status(404).json({ message: 'Release not found' });
        }

        await Release.findByIdAndDelete(id);
        console.log(`Release ${id} deleted successfully`);
        res.json({ message: 'Release deleted successfully' });
    } catch (err) {
        console.error('Error deleting release:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 