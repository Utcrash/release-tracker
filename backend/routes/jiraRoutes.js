const express = require('express');
const router = express.Router();
const JiraTicket = require('../models/JiraTicket');
const axios = require('axios');

// JIRA API Configuration with safe fallbacks (no credentials)
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://appveen.atlassian.net';
const JIRA_API_VERSION = process.env.JIRA_API_VERSION || '3';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

console.log('=== JIRA Configuration in jiraRoutes ===');
console.log('JIRA_BASE_URL:', JIRA_BASE_URL);
console.log('JIRA_API_VERSION:', JIRA_API_VERSION);
console.log('JIRA_EMAIL set:', !!JIRA_EMAIL);
console.log('JIRA_API_TOKEN set:', !!JIRA_API_TOKEN);
console.log('======================================');

// Verify that credentials are provided
if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.warn('WARNING: Missing JIRA credentials. JIRA integration may not work properly.');
}

// Create JIRA API client
const jiraClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL || ''}:${JIRA_API_TOKEN || ''}`).toString('base64')}`,
    }
});

// Proxy endpoint for JIRA API requests
router.use('/proxy', async (req, res) => {
    try {
        // Get the path after /proxy
        const jiraPath = req.url.split('?')[0].replace(/^\//, '');

        // Build the complete URL with the JIRA base URL
        const url = `${JIRA_BASE_URL}/rest/api/${JIRA_API_VERSION}/${jiraPath}`;
        console.log('Proxying JIRA request to:', url, 'with params:', req.query);

        const response = await jiraClient.get(url, { params: req.query });
        res.json(response.data);
    } catch (error) {
        console.error('JIRA API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
});

// Get a specific JIRA ticket
router.get('/:ticketId', async (req, res) => {
    try {
        const ticket = await JiraTicket.findOne({ ticketId: req.params.ticketId });
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 