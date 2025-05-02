const express = require('express');
const router = express.Router();
const JiraTicket = require('../models/JiraTicket');
const axios = require('axios');

// JIRA API Configuration
const JIRA_BASE_URL = process.env.REACT_APP_JIRA_BASE_URL;
const JIRA_EMAIL = process.env.REACT_APP_JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;

// Create JIRA API client
const jiraClient = axios.create({
    baseURL: JIRA_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
    }
});

// Proxy endpoint for JIRA API requests
router.use('/proxy', async (req, res) => {
    try {
        // Get the path after /proxy
        const jiraPath = req.url.replace(/^\//, '');
        const queryString = Object.keys(req.query)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(req.query[key])}`)
            .join('&');

        const url = `/rest/api/3/${jiraPath}${queryString ? `?${queryString}` : ''}`;
        console.log('Proxying JIRA request to:', url);

        const response = await jiraClient.get(url);
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