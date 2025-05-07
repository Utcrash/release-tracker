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
        console.log('\n=== JIRA API Request Details ===');
        console.log('Full URL:', url);
        console.log('Original Request URL:', req.url);
        console.log('Request Method:', req.method);
        console.log('Request Query:', JSON.stringify(req.query, null, 2));
        console.log('Request Headers:', JSON.stringify({
            ...req.headers,
            authorization: req.headers.authorization ? 'Present' : 'Missing'
        }, null, 2));
        console.log('Auth Header:', jiraClient.defaults.headers.Authorization ? 'Present' : 'Missing');
        console.log('================================\n');

        // Special handling for search endpoint
        if (jiraPath === 'search') {
            console.log('Processing JIRA search request');
            console.log('JQL:', req.query.jql);
            console.log('Fields:', req.query.fields);
        }

        const response = await jiraClient.get(url, {
            params: req.query,
            validateStatus: function (status) {
                return true; // Accept all status codes
            }
        });

        console.log('\n=== JIRA API Response Details ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', JSON.stringify(response.headers, null, 2));
        if (jiraPath === 'search') {
            console.log('Search Response:', JSON.stringify({
                total: response.data?.total,
                issues: response.data?.issues?.length,
                maxResults: response.data?.maxResults
            }, null, 2));
        } else {
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        }
        console.log('================================\n');

        if (response.status >= 400) {
            throw {
                response: {
                    status: response.status,
                    data: response.data
                }
            };
        }

        res.json(response.data);
    } catch (error) {
        console.error('\n=== JIRA API Error Details ===');
        console.error('Error Status:', error.response?.status);
        console.error('Error Status Text:', error.response?.statusText);
        console.error('Error Headers:', JSON.stringify(error.response?.headers, null, 2));
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
        console.error('================================\n');

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