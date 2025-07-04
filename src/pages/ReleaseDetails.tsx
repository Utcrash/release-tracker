import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Release, JiraTicket } from '../types';
import { releaseService } from '../services/releaseService';
import { jiraService } from '../services/jiraService';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/darkTheme.css';
import '../pages/JiraTickets.css';

type RouteParams = {
  id?: string;
};

const ReleaseDetails: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [release, setRelease] = useState<Release | null>(null);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jiraQuery, setJiraQuery] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        console.log('Fetching release with ID:', id);

        try {
          const releaseData = await releaseService.getReleaseById(id);
          setRelease(releaseData);

          // Process tickets
          let ticketsToShow: JiraTicket[] = [];

          // If release has populated tickets directly
          if (releaseData.tickets && releaseData.tickets.length > 0) {
            // These are already JiraTicket objects
            ticketsToShow = [...releaseData.tickets];
          }
          // If release has jiraTickets that are populated
          else if (
            releaseData.jiraTickets &&
            releaseData.jiraTickets.length > 0
          ) {
            if (typeof releaseData.jiraTickets[0] === 'string') {
              // These are just IDs, need to fetch the actual tickets
              console.log(
                'Fetching ticket details for IDs:',
                releaseData.jiraTickets
              );
              // This would require another API call to fetch details for these IDs
            } else {
              // These are already populated JiraTicket objects
              ticketsToShow = [...(releaseData.jiraTickets as JiraTicket[])];
            }
          }

          setTickets(ticketsToShow);
        } catch (releaseError) {
          console.error('Error fetching release:', releaseError);
          setError('Release not found. Please check the URL and try again.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Generate JIRA Query Language (JQL) for the tickets in this release
  const generateJiraQuery = () => {
    if (tickets.length === 0) {
      return;
    }

    // Use ticket IDs for the query
    const ticketIds = tickets.map((ticket) => ticket.ticketId);
    const query = `key in (${ticketIds.join(',')})`;

    setJiraQuery(query);
  };

  // Close the JIRA query dialog
  const closeJiraQuery = () => {
    setJiraQuery(null);
  };

  // Copy JIRA query to clipboard
  const copyJiraQuery = () => {
    if (jiraQuery) {
      navigator.clipboard
        .writeText(jiraQuery)
        .then(() => {
          // Success notification could be added here
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  // Generate release document in a new tab
  const generateReleaseDocument = () => {
    if (!release) return;

    // Create HTML content for the document
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Release Document - ${release.version}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 5px;
          }
          .logo {
            background-color: transparent;
            padding: 10px;
            border-radius: 5px;
            width: 300px;
          }
          h1 {
            margin-bottom: 5px;
          }
          .project-info {
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 13px;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          td.ticket-id {
            white-space: nowrap;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .component-delivery {
            margin-bottom: 20px;
          }
          .component-name {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .delivery-links {
            margin-left: 15px;
          }
          .link-row {
            display: flex;
            margin-bottom: 5px;
          }
          .link-label {
            font-weight: bold;
            min-width: 120px;
          }
          .additional-points {
            padding-left: 20px;
          }
          .cover-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            position: relative;
            page-break-after: always;
          }
          .cover-content {
            width: 100%;
            display: flex;
            margin: 0 auto;
            max-width: 1000px;
          }
          .logo-section {
            width: 50%;
            padding-right: 20px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
          }
          .cover-logo {
            width: 300px;
          }
          .divider {
            width: 1px;
            background-color: #4169e1;
            height: 200px;
            margin: 0 20px;
          }
          .title-section {
            width: 50%;
            padding-left: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .release-title {
            font-size: 2.5em;
            margin-bottom: 20px;
          }
          .version-number {
            font-size: 1.5em;
            color: #555;
          }
          .disclaimer-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            page-break-after: always;
          }
          .disclaimer-content {
            max-width: 1000px;
            margin: 0 auto;
            width: 100%;
          }
          .main-content {
            padding-top: 40px;
          }
          .disclaimer-section {
            margin-bottom: 30px;
          }
          .disclaimer-header {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .all-caps {
            text-transform: uppercase;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @media print {
            .page-break {
              page-break-before: always;
              break-before: page;
            }
            .no-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="cover-page">
          <div class="cover-content">
            <div class="logo-section">
               <svg width="450px" height="115px" viewBox="0 0 712 164" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M397.942 67.24C403.275 67.24 407.595 68.8667 410.902 72.12C414.209 75.32 415.862 79.96 415.862 86.04V111.88H408.662V87.08C408.662 82.7067 407.569 79.3733 405.382 77.08C403.195 74.7333 400.209 73.56 396.422 73.56C392.582 73.56 389.515 74.76 387.222 77.16C384.982 79.56 383.862 83.0533 383.862 87.64V111.88H376.582V68.04H383.862V74.28C385.302 72.04 387.249 70.3067 389.702 69.08C392.209 67.8533 394.955 67.24 397.942 67.24Z" fill="#214392"/>
                  <path d="M431.514 60.92C430.127 60.92 428.954 60.44 427.994 59.48C427.034 58.52 426.554 57.3467 426.554 55.96C426.554 54.5733 427.034 53.4 427.994 52.44C428.954 51.48 430.127 51 431.514 51C432.847 51 433.967 51.48 434.874 52.44C435.834 53.4 436.314 54.5733 436.314 55.96C436.314 57.3467 435.834 58.52 434.874 59.48C433.967 60.44 432.847 60.92 431.514 60.92ZM435.034 68.04V111.88H427.754V68.04H435.034Z" fill="#214392"/>
                  <path d="M500.162 67.24C503.575 67.24 506.615 67.96 509.282 69.4C511.948 70.7867 514.055 72.8933 515.602 75.72C517.148 78.5467 517.922 81.9867 517.922 86.04V111.88H510.722V87.08C510.722 82.7067 509.628 79.3733 507.442 77.08C505.308 74.7333 502.402 73.56 498.722 73.56C494.935 73.56 491.922 74.7867 489.682 77.24C487.442 79.64 486.322 83.1333 486.322 87.72V111.88H479.122V87.08C479.122 82.7067 478.028 79.3733 475.842 77.08C473.708 74.7333 470.802 73.56 467.122 73.56C463.335 73.56 460.322 74.7867 458.082 77.24C455.842 79.64 454.722 83.1333 454.722 87.72V111.88H447.442V68.04H454.722V74.36C456.162 72.0667 458.082 70.3067 460.482 69.08C462.935 67.8533 465.628 67.24 468.562 67.24C472.242 67.24 475.495 68.0667 478.322 69.72C481.148 71.3733 483.255 73.8 484.642 77C485.868 73.9067 487.895 71.5067 490.722 69.8C493.548 68.0933 496.695 67.24 500.162 67.24Z" fill="#214392"/>
                  <path d="M537.144 76.2C538.637 73.5867 540.824 71.4533 543.704 69.8C546.584 68.1467 549.864 67.32 553.544 67.32C557.49 67.32 561.037 68.2533 564.184 70.12C567.33 71.9867 569.81 74.6267 571.624 78.04C573.437 81.4 574.344 85.32 574.344 89.8C574.344 94.2267 573.437 98.1733 571.624 101.64C569.81 105.107 567.304 107.8 564.104 109.72C560.957 111.64 557.437 112.6 553.544 112.6C549.757 112.6 546.424 111.773 543.544 110.12C540.717 108.467 538.584 106.36 537.144 103.8V111.88H529.864V52.68H537.144V76.2ZM566.904 89.8C566.904 86.4933 566.237 83.6133 564.904 81.16C563.57 78.7067 561.757 76.84 559.464 75.56C557.224 74.28 554.744 73.64 552.024 73.64C549.357 73.64 546.877 74.3067 544.584 75.64C542.344 76.92 540.53 78.8133 539.144 81.32C537.81 83.7733 537.144 86.6267 537.144 89.88C537.144 93.1867 537.81 96.0933 539.144 98.6C540.53 101.053 542.344 102.947 544.584 104.28C546.877 105.56 549.357 106.2 552.024 106.2C554.744 106.2 557.224 105.56 559.464 104.28C561.757 102.947 563.57 101.053 564.904 98.6C566.237 96.0933 566.904 93.16 566.904 89.8Z" fill="#214392"/>
                  <path d="M622.806 68.04V111.88H615.526V105.4C614.139 107.64 612.193 109.4 609.686 110.68C607.233 111.907 604.513 112.52 601.526 112.52C598.113 112.52 595.046 111.827 592.326 110.44C589.606 109 587.446 106.867 585.846 104.04C584.299 101.213 583.526 97.7733 583.526 93.72V68.04H590.726V92.76C590.726 97.08 591.819 100.413 594.006 102.76C596.193 105.053 599.18 106.2 602.966 106.2C606.86 106.2 609.926 105 612.166 102.6C614.406 100.2 615.526 96.7067 615.526 92.12V68.04H622.806Z" fill="#214392"/>
                  <path d="M650.618 112.6C647.258 112.6 644.245 112.04 641.578 110.92C638.911 109.747 636.805 108.147 635.258 106.12C633.711 104.04 632.858 101.667 632.698 99H640.218C640.431 101.187 641.445 102.973 643.258 104.36C645.125 105.747 647.551 106.44 650.538 106.44C653.311 106.44 655.498 105.827 657.098 104.6C658.698 103.373 659.498 101.827 659.498 99.96C659.498 98.04 658.645 96.6267 656.938 95.72C655.231 94.76 652.591 93.8267 649.018 92.92C645.765 92.0667 643.098 91.2133 641.018 90.36C638.991 89.4533 637.231 88.1467 635.738 86.44C634.298 84.68 633.578 82.3867 633.578 79.56C633.578 77.32 634.245 75.2667 635.578 73.4C636.911 71.5333 638.805 70.0667 641.258 69C643.711 67.88 646.511 67.32 649.658 67.32C654.511 67.32 658.431 68.5467 661.418 71C664.405 73.4533 666.005 76.8133 666.218 81.08H658.938C658.778 78.7867 657.845 76.9467 656.138 75.56C654.485 74.1733 652.245 73.48 649.418 73.48C646.805 73.48 644.725 74.04 643.178 75.16C641.631 76.28 640.858 77.7467 640.858 79.56C640.858 81 641.311 82.2 642.218 83.16C643.178 84.0667 644.351 84.8133 645.738 85.4C647.178 85.9333 649.151 86.5467 651.658 87.24C654.805 88.0933 657.365 88.9467 659.338 89.8C661.311 90.6 662.991 91.8267 664.378 93.48C665.818 95.1333 666.565 97.2933 666.618 99.96C666.618 102.36 665.951 104.52 664.618 106.44C663.285 108.36 661.391 109.88 658.938 111C656.538 112.067 653.765 112.6 650.618 112.6Z" fill="#214392"/>
                  <path d="M180.96 89.96C180.96 85.5333 181.867 81.6133 183.68 78.2C185.547 74.7867 188.053 72.1467 191.2 70.28C194.4 68.36 197.947 67.4 201.84 67.4C204.72 67.4 207.547 68.04 210.32 69.32C213.147 70.5467 215.387 72.2 217.04 74.28V53H226.24V112.2H217.04V105.56C215.547 107.693 213.467 109.453 210.8 110.84C208.187 112.227 205.173 112.92 201.76 112.92C197.92 112.92 194.4 111.96 191.2 110.04C188.053 108.067 185.547 105.347 183.68 101.88C181.867 98.36 180.96 94.3867 180.96 89.96ZM217.04 90.12C217.04 87.08 216.4 84.44 215.12 82.2C213.893 79.96 212.267 78.2533 210.24 77.08C208.213 75.9067 206.027 75.32 203.68 75.32C201.333 75.32 199.147 75.9067 197.12 77.08C195.093 78.2 193.44 79.88 192.16 82.12C190.933 84.3067 190.32 86.92 190.32 89.96C190.32 93 190.933 95.6667 192.16 97.96C193.44 100.253 195.093 102.013 197.12 103.24C199.2 104.413 201.387 105 203.68 105C206.027 105 208.213 104.413 210.24 103.24C212.267 102.067 213.893 100.36 215.12 98.12C216.4 95.8267 217.04 93.16 217.04 90.12Z" fill="#E03D5F"/>
                  <path d="M235.179 89.96C235.179 85.5333 236.085 81.6133 237.899 78.2C239.765 74.7867 242.272 72.1467 245.419 70.28C248.619 68.36 252.139 67.4 255.979 67.4C259.445 67.4 262.459 68.0933 265.019 69.48C267.632 70.8133 269.712 72.4933 271.259 74.52V68.12H280.459V112.2H271.259V105.64C269.712 107.72 267.605 109.453 264.939 110.84C262.272 112.227 259.232 112.92 255.819 112.92C252.032 112.92 248.565 111.96 245.419 110.04C242.272 108.067 239.765 105.347 237.899 101.88C236.085 98.36 235.179 94.3867 235.179 89.96ZM271.259 90.12C271.259 87.08 270.619 84.44 269.339 82.2C268.112 79.96 266.485 78.2533 264.459 77.08C262.432 75.9067 260.245 75.32 257.899 75.32C255.552 75.32 253.365 75.9067 251.339 77.08C249.312 78.2 247.659 79.88 246.379 82.12C245.152 84.3067 244.539 86.92 244.539 89.96C244.539 93 245.152 95.6667 246.379 97.96C247.659 100.253 249.312 102.013 251.339 103.24C253.419 104.413 255.605 105 257.899 105C260.245 105 262.432 104.413 264.459 103.24C266.485 102.067 268.112 100.36 269.339 98.12C270.619 95.8267 271.259 93.16 271.259 90.12Z" fill="#E03D5F"/>
                  <path d="M303.077 75.56V99.96C303.077 101.613 303.451 102.813 304.197 103.56C304.997 104.253 306.331 104.6 308.197 104.6H313.797V112.2H306.597C302.491 112.2 299.344 111.24 297.157 109.32C294.971 107.4 293.877 104.28 293.877 99.96V75.56H288.677V68.12H293.877V57.16H303.077V68.12H313.797V75.56H303.077Z" fill="#E03D5F"/>
                  <path d="M319.163 89.96C319.163 85.5333 320.07 81.6133 321.883 78.2C323.75 74.7867 326.256 72.1467 329.403 70.28C332.603 68.36 336.123 67.4 339.963 67.4C343.43 67.4 346.443 68.0933 349.003 69.48C351.616 70.8133 353.696 72.4933 355.243 74.52V68.12H364.443V112.2H355.243V105.64C353.696 107.72 351.59 109.453 348.923 110.84C346.256 112.227 343.216 112.92 339.803 112.92C336.016 112.92 332.55 111.96 329.403 110.04C326.256 108.067 323.75 105.347 321.883 101.88C320.07 98.36 319.163 94.3867 319.163 89.96ZM355.243 90.12C355.243 87.08 354.603 84.44 353.323 82.2C352.096 79.96 350.47 78.2533 348.443 77.08C346.416 75.9067 344.23 75.32 341.883 75.32C339.536 75.32 337.35 75.9067 335.323 77.08C333.296 78.2 331.643 79.88 330.363 82.12C329.136 84.3067 328.523 86.92 328.523 89.96C328.523 93 329.136 95.6667 330.363 97.96C331.643 100.253 333.296 102.013 335.323 103.24C337.403 104.413 339.59 105 341.883 105C344.23 105 346.416 104.413 348.443 103.24C350.47 102.067 352.096 100.36 353.323 98.12C354.603 95.8267 355.243 93.16 355.243 90.12Z" fill="#E03D5F"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M163 93.2618C163 107.352 151.186 118.775 136.612 118.775L67.482 118.774C61.6717 118.774 56.3761 116.643 52.386 113.146L85.7466 94.023C88.8497 92.2443 92.7565 92.7415 95.3151 95.2408L99.824 99.645C102.583 102.34 106.871 102.683 110.023 100.461L150.649 71.8257C157.965 76.3574 163 84.2435 163 93.2618ZM131.637 64.3923C126.879 51.9054 114.463 43 99.8964 43C81.3417 43 66.2774 57.4487 66.0836 75.3435C54.3185 76.0416 45 85.4878 45 97.0383C45 102.636 47.1884 107.739 50.7832 111.592L85.8893 87.8196C88.8962 85.7834 92.8974 86.028 95.6339 88.4152L98.4773 90.8956C101.837 93.8266 106.945 93.4452 109.832 90.0479L131.637 64.3923Z" fill="#214392"/>
                </svg>
            </div>
            <div class="divider"></div>
            <div class="title-section">
              <h1 class="release-title">Release Notes</h1>
              <h2 class="version-number">DNIO ${release.version}</h2>
            </div>
          </div>
        </div>
        
        <div class="disclaimer-page">
          <div class="disclaimer-content">
            <h2 class="text-center mb-4">Disclaimer</h2>
            
            <div class="disclaimer-section">
              <p>
                <strong>Copyright 2024 DataNimbus Inc. (DataNimbus).</strong> All rights are reserved. This document is not published for
                public consumption, and the following notice is affixed to protect DataNimbus in the event of any unauthorized
                or inadvertent publication, both offline and online. Without the prior written consent of DataNimbus, this
                document, or any of its parts, cannot be reproduced in any form – including electronic transmission,
                photocopying, etc. This document contains information that is confidential to DataNimbus, and disclosure of
                this information, or of the existence of this document in detail, is not authorized unless expressed explicitly by
                DataNimbus. Copyright protection includes material generated from our software programs displayed on the
                screen, such as icons, screen displays, and the like.
              </p>
            </div>
            
            <div class="disclaimer-section">
              <div class="disclaimer-header"><strong>Trademarks</strong></div>
              <p>
                All brand and product names are trademarks or registered trademarks of their respective holders and are
                hereby acknowledged. Technologies described herein are either covered by existing patents or patent
                applications are in progress.
              </p>
            </div>
            
            <div class="disclaimer-section">
              <div class="disclaimer-header"><strong>Confidentiality</strong></div>
              <p>
                The information in this document is subject to change without notice. This document contains information that
                is confidential and proprietary to DataNimbus and may not be copied, published, or disclosed to others, or
                used for any purposes other than review, without written authorization of an officer of DataNimbus.
                Submission of this document does not represent a commitment to implement any portion of this specification
                in the products of the submitters.
              </p>
            </div>
            
            <div class="disclaimer-section">
              <div class="disclaimer-header"><strong>Content Warranty</strong></div>
              <p>
                The information in this document is subject to change without notice. <strong>THIS DOCUMENT IS PROVIDED "AS
                IS" AND DATANIMBUS MAKES ABSOLUTELY NO WARRANTY, EXPRESS, IMPLIED, OR STATUTORY,
                INCLUDING BUT NOT LIMITED TO ALL WARRANTIES FOR A PARTICULAR PURPOSE.</strong> DataNimbus
                shall not be liable for errors contained herein or for incidental or consequential damages in connection with
                the furnishing, performance or use of this material.
              </p>
            </div>
          </div>
        </div>
        
        <div class="main-content">
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                  <svg width="300px" height="115px" viewBox="0 0 712 164" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M397.942 67.24C403.275 67.24 407.595 68.8667 410.902 72.12C414.209 75.32 415.862 79.96 415.862 86.04V111.88H408.662V87.08C408.662 82.7067 407.569 79.3733 405.382 77.08C403.195 74.7333 400.209 73.56 396.422 73.56C392.582 73.56 389.515 74.76 387.222 77.16C384.982 79.56 383.862 83.0533 383.862 87.64V111.88H376.582V68.04H383.862V74.28C385.302 72.04 387.249 70.3067 389.702 69.08C392.209 67.8533 394.955 67.24 397.942 67.24Z" fill="#214392"/>
                    <path d="M431.514 60.92C430.127 60.92 428.954 60.44 427.994 59.48C427.034 58.52 426.554 57.3467 426.554 55.96C426.554 54.5733 427.034 53.4 427.994 52.44C428.954 51.48 430.127 51 431.514 51C432.847 51 433.967 51.48 434.874 52.44C435.834 53.4 436.314 54.5733 436.314 55.96C436.314 57.3467 435.834 58.52 434.874 59.48C433.967 60.44 432.847 60.92 431.514 60.92ZM435.034 68.04V111.88H427.754V68.04H435.034Z" fill="#214392"/>
                    <path d="M500.162 67.24C503.575 67.24 506.615 67.96 509.282 69.4C511.948 70.7867 514.055 72.8933 515.602 75.72C517.148 78.5467 517.922 81.9867 517.922 86.04V111.88H510.722V87.08C510.722 82.7067 509.628 79.3733 507.442 77.08C505.308 74.7333 502.402 73.56 498.722 73.56C494.935 73.56 491.922 74.7867 489.682 77.24C487.442 79.64 486.322 83.1333 486.322 87.72V111.88H479.122V87.08C479.122 82.7067 478.028 79.3733 475.842 77.08C473.708 74.7333 470.802 73.56 467.122 73.56C463.335 73.56 460.322 74.7867 458.082 77.24C455.842 79.64 454.722 83.1333 454.722 87.72V111.88H447.442V68.04H454.722V74.36C456.162 72.0667 458.082 70.3067 460.482 69.08C462.935 67.8533 465.628 67.24 468.562 67.24C472.242 67.24 475.495 68.0667 478.322 69.72C481.148 71.3733 483.255 73.8 484.642 77C485.868 73.9067 487.895 71.5067 490.722 69.8C493.548 68.0933 496.695 67.24 500.162 67.24Z" fill="#214392"/>
                    <path d="M537.144 76.2C538.637 73.5867 540.824 71.4533 543.704 69.8C546.584 68.1467 549.864 67.32 553.544 67.32C557.49 67.32 561.037 68.2533 564.184 70.12C567.33 71.9867 569.81 74.6267 571.624 78.04C573.437 81.4 574.344 85.32 574.344 89.8C574.344 94.2267 573.437 98.1733 571.624 101.64C569.81 105.107 567.304 107.8 564.104 109.72C560.957 111.64 557.437 112.6 553.544 112.6C549.757 112.6 546.424 111.773 543.544 110.12C540.717 108.467 538.584 106.36 537.144 103.8V111.88H529.864V52.68H537.144V76.2ZM566.904 89.8C566.904 86.4933 566.237 83.6133 564.904 81.16C563.57 78.7067 561.757 76.84 559.464 75.56C557.224 74.28 554.744 73.64 552.024 73.64C549.357 73.64 546.877 74.3067 544.584 75.64C542.344 76.92 540.53 78.8133 539.144 81.32C537.81 83.7733 537.144 86.6267 537.144 89.88C537.144 93.1867 537.81 96.0933 539.144 98.6C540.53 101.053 542.344 102.947 544.584 104.28C546.877 105.56 549.357 106.2 552.024 106.2C554.744 106.2 557.224 105.56 559.464 104.28C561.757 102.947 563.57 101.053 564.904 98.6C566.237 96.0933 566.904 93.16 566.904 89.8Z" fill="#214392"/>
                    <path d="M622.806 68.04V111.88H615.526V105.4C614.139 107.64 612.193 109.4 609.686 110.68C607.233 111.907 604.513 112.52 601.526 112.52C598.113 112.52 595.046 111.827 592.326 110.44C589.606 109 587.446 106.867 585.846 104.04C584.299 101.213 583.526 97.7733 583.526 93.72V68.04H590.726V92.76C590.726 97.08 591.819 100.413 594.006 102.76C596.193 105.053 599.18 106.2 602.966 106.2C606.86 106.2 609.926 105 612.166 102.6C614.406 100.2 615.526 96.7067 615.526 92.12V68.04H622.806Z" fill="#214392"/>
                    <path d="M650.618 112.6C647.258 112.6 644.245 112.04 641.578 110.92C638.911 109.747 636.805 108.147 635.258 106.12C633.711 104.04 632.858 101.667 632.698 99H640.218C640.431 101.187 641.445 102.973 643.258 104.36C645.125 105.747 647.551 106.44 650.538 106.44C653.311 106.44 655.498 105.827 657.098 104.6C658.698 103.373 659.498 101.827 659.498 99.96C659.498 98.04 658.645 96.6267 656.938 95.72C655.231 94.76 652.591 93.8267 649.018 92.92C645.765 92.0667 643.098 91.2133 641.018 90.36C638.991 89.4533 637.231 88.1467 635.738 86.44C634.298 84.68 633.578 82.3867 633.578 79.56C633.578 77.32 634.245 75.2667 635.578 73.4C636.911 71.5333 638.805 70.0667 641.258 69C643.711 67.88 646.511 67.32 649.658 67.32C654.511 67.32 658.431 68.5467 661.418 71C664.405 73.4533 666.005 76.8133 666.218 81.08H658.938C658.778 78.7867 657.845 76.9467 656.138 75.56C654.485 74.1733 652.245 73.48 649.418 73.48C646.805 73.48 644.725 74.04 643.178 75.16C641.631 76.28 640.858 77.7467 640.858 79.56C640.858 81 641.311 82.2 642.218 83.16C643.178 84.0667 644.351 84.8133 645.738 85.4C647.178 85.9333 649.151 86.5467 651.658 87.24C654.805 88.0933 657.365 88.9467 659.338 89.8C661.311 90.6 662.991 91.8267 664.378 93.48C665.818 95.1333 666.565 97.2933 666.618 99.96C666.618 102.36 665.951 104.52 664.618 106.44C663.285 108.36 661.391 109.88 658.938 111C656.538 112.067 653.765 112.6 650.618 112.6Z" fill="#214392"/>
                    <path d="M180.96 89.96C180.96 85.5333 181.867 81.6133 183.68 78.2C185.547 74.7867 188.053 72.1467 191.2 70.28C194.4 68.36 197.947 67.4 201.84 67.4C204.72 67.4 207.547 68.04 210.32 69.32C213.147 70.5467 215.387 72.2 217.04 74.28V53H226.24V112.2H217.04V105.56C215.547 107.693 213.467 109.453 210.8 110.84C208.187 112.227 205.173 112.92 201.76 112.92C197.92 112.92 194.4 111.96 191.2 110.04C188.053 108.067 185.547 105.347 183.68 101.88C181.867 98.36 180.96 94.3867 180.96 89.96ZM217.04 90.12C217.04 87.08 216.4 84.44 215.12 82.2C213.893 79.96 212.267 78.2533 210.24 77.08C208.213 75.9067 206.027 75.32 203.68 75.32C201.333 75.32 199.147 75.9067 197.12 77.08C195.093 78.2 193.44 79.88 192.16 82.12C190.933 84.3067 190.32 86.92 190.32 89.96C190.32 93 190.933 95.6667 192.16 97.96C193.44 100.253 195.093 102.013 197.12 103.24C199.2 104.413 201.387 105 203.68 105C206.027 105 208.213 104.413 210.24 103.24C212.267 102.067 213.893 100.36 215.12 98.12C216.4 95.8267 217.04 93.16 217.04 90.12Z" fill="#E03D5F"/>
                    <path d="M235.179 89.96C235.179 85.5333 236.085 81.6133 237.899 78.2C239.765 74.7867 242.272 72.1467 245.419 70.28C248.619 68.36 252.139 67.4 255.979 67.4C259.445 67.4 262.459 68.0933 265.019 69.48C267.632 70.8133 269.712 72.4933 271.259 74.52V68.12H280.459V112.2H271.259V105.64C269.712 107.72 267.605 109.453 264.939 110.84C262.272 112.227 259.232 112.92 255.819 112.92C252.032 112.92 248.565 111.96 245.419 110.04C242.272 108.067 239.765 105.347 237.899 101.88C236.085 98.36 235.179 94.3867 235.179 89.96ZM271.259 90.12C271.259 87.08 270.619 84.44 269.339 82.2C268.112 79.96 266.485 78.2533 264.459 77.08C262.432 75.9067 260.245 75.32 257.899 75.32C255.552 75.32 253.365 75.9067 251.339 77.08C249.312 78.2 247.659 79.88 246.379 82.12C245.152 84.3067 244.539 86.92 244.539 89.96C244.539 93 245.152 95.6667 246.379 97.96C247.659 100.253 249.312 102.013 251.339 103.24C253.419 104.413 255.605 105 257.899 105C260.245 105 262.432 104.413 264.459 103.24C266.485 102.067 268.112 100.36 269.339 98.12C270.619 95.8267 271.259 93.16 271.259 90.12Z" fill="#E03D5F"/>
                    <path d="M303.077 75.56V99.96C303.077 101.613 303.451 102.813 304.197 103.56C304.997 104.253 306.331 104.6 308.197 104.6H313.797V112.2H306.597C302.491 112.2 299.344 111.24 297.157 109.32C294.971 107.4 293.877 104.28 293.877 99.96V75.56H288.677V68.12H293.877V57.16H303.077V68.12H313.797V75.56H303.077Z" fill="#E03D5F"/>
                    <path d="M319.163 89.96C319.163 85.5333 320.07 81.6133 321.883 78.2C323.75 74.7867 326.256 72.1467 329.403 70.28C332.603 68.36 336.123 67.4 339.963 67.4C343.43 67.4 346.443 68.0933 349.003 69.48C351.616 70.8133 353.696 72.4933 355.243 74.52V68.12H364.443V112.2H355.243V105.64C353.696 107.72 351.59 109.453 348.923 110.84C346.256 112.227 343.216 112.92 339.803 112.92C336.016 112.92 332.55 111.96 329.403 110.04C326.256 108.067 323.75 105.347 321.883 101.88C320.07 98.36 319.163 94.3867 319.163 89.96ZM355.243 90.12C355.243 87.08 354.603 84.44 353.323 82.2C352.096 79.96 350.47 78.2533 348.443 77.08C346.416 75.9067 344.23 75.32 341.883 75.32C339.536 75.32 337.35 75.9067 335.323 77.08C333.296 78.2 331.643 79.88 330.363 82.12C329.136 84.3067 328.523 86.92 328.523 89.96C328.523 93 329.136 95.6667 330.363 97.96C331.643 100.253 333.296 102.013 335.323 103.24C337.403 104.413 339.59 105 341.883 105C344.23 105 346.416 104.413 348.443 103.24C350.47 102.067 352.096 100.36 353.323 98.12C354.603 95.8267 355.243 93.16 355.243 90.12Z" fill="#E03D5F"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M163 93.2618C163 107.352 151.186 118.775 136.612 118.775L67.482 118.774C61.6717 118.774 56.3761 116.643 52.386 113.146L85.7466 94.023C88.8497 92.2443 92.7565 92.7415 95.3151 95.2408L99.824 99.645C102.583 102.34 106.871 102.683 110.023 100.461L150.649 71.8257C157.965 76.3574 163 84.2435 163 93.2618ZM131.637 64.3923C126.879 51.9054 114.463 43 99.8964 43C81.3417 43 66.2774 57.4487 66.0836 75.3435C54.3185 76.0416 45 85.4878 45 97.0383C45 102.636 47.1884 107.739 50.7832 111.592L85.8893 87.8196C88.8962 85.7834 92.8974 86.028 95.6339 88.4152L98.4773 90.8956C101.837 93.8266 106.945 93.4452 109.832 90.0479L131.637 64.3923Z" fill="#214392"/>
                  </svg>
                </div>
              </div>
              <h1>Release Document: ${release.version}</h1>
              <p>Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div class="project-info">
              <h2>Project: datanimbus.io</h2>
              <p><strong>Release Date:</strong> ${new Date(
                release.createdAt
              ).toLocaleDateString()}</p>
              ${
                Array.isArray(release.customers) && release.customers.length > 0
                  ? `<p><strong>Customers:</strong> ${release.customers.join(', ')}</p>`
                  : ''
              }
              ${
                release.notes
                  ? `<p><strong>Notes:</strong> ${release.notes}</p>`
                  : ''
              }
            </div>
            
            <div class="section no-break-inside">
              <div class="section-title">Tickets (${tickets.length})</div>
              ${
                tickets.length > 0
                  ? `<table>
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Summary</th>
                        <th>Components</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tickets
                        .map(
                          (ticket) => `
                        <tr>
                          <td class="ticket-id">
                            <a href="${
                              process.env.REACT_APP_JIRA_BASE_URL ||
                              'https://jira.example.com'
                            }/browse/${ticket.ticketId}" target="_blank">${
                            ticket.ticketId
                          }</a>
                          </td>
                          <td>${ticket.summary}</td>
                          <td>${ticket.components.join(', ') || 'N/A'}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>`
                  : '<p>No tickets found for this release.</p>'
              }
            </div>
                    
            ${
              release.componentDeliveries &&
              release.componentDeliveries.length > 0
                ? `<div class="section no-break-inside">
                  <div class="section-title">Component Deliveries</div>
                  ${release.componentDeliveries
                    .map(
                      (component) => `
                    <div class="component-delivery">
                      <div class="component-name">${component.name}</div>
                      <div class="delivery-links">
                        ${
                          component.dockerHubLink
                            ? `<div class="link-row">
                               <div class="link-label">DockerHub:</div>
                               <div><a href="${component.dockerHubLink}" target="_blank">${component.dockerHubLink}</a></div>
                             </div>`
                            : ''
                        }
                        ${
                          component.eDeliveryLink
                            ? `<div class="link-row">
                               <div class="link-label">E-Delivery:</div>
                               <div><a href="${component.eDeliveryLink}" target="_blank">${component.eDeliveryLink}</a></div>
                             </div>`
                            : ''
                        }
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
                : ''
            }
            
            ${
              release.additionalPoints && release.additionalPoints.length > 0
                ? `<div class="section no-break-inside">
                  <div class="section-title">Additional Points</div>
                  <ul class="additional-points">
                    ${release.additionalPoints
                      .map((point) => `<li>${point}</li>`)
                      .join('')}
                  </ul>
                </div>`
                : ''
            }
            
            <div class="section no-break-inside">
              <div class="section-title">Support</div>
              <p>For any incidents, queries or feedback, please contact your DataNimbus account representative, or e-mail us at support@datanimbus.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open a new tab and write the HTML content
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(htmlContent);
      newTab.document.close();
    }
  };

  if (loading) {
    return (
      <div className="dark-theme min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark-theme min-vh-100 py-4">
        <div className="container">
          <div className="alert alert-danger m-3">{error}</div>
          <Link to="/releases" className="btn btn-primary">
            Back to Releases
          </Link>
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="dark-theme min-vh-100 py-4">
        <div className="container">
          <div className="alert alert-warning m-3">Release not found</div>
          <Link to="/releases" className="btn btn-primary">
            Back to Releases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-theme min-vh-100 py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-light">Release: {release.version}</h1>
          <div>
            <button
              onClick={generateReleaseDocument}
              className="btn btn-success me-2"
            >
              <i className="bi bi-file-earmark-text me-1"></i>
              Generate Doc
            </button>
            <Link
              to={`/edit-release/${release._id}`}
              className="btn btn-primary me-2"
            >
              Edit Release
            </Link>
            <Link to="/releases" className="btn btn-outline-secondary">
              Back to Releases
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header border-secondary">
                <h5 className="mb-0 text-light">Release Details</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Version:</div>
                  <div className="col-md-8 text-light">{release.version}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Release Date:</div>
                  <div className="col-md-8 text-light">
                    {new Date(release.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Status:</div>
                  <div className="col-md-8">
                    <span
                      className={`badge bg-${
                        release.status.toLowerCase() === 'released'
                          ? 'success'
                          : release.status.toLowerCase() === 'planned'
                          ? 'info'
                          : 'warning'
                      }`}
                    >
                      {release.status}
                    </span>
                  </div>
                </div>
                {Array.isArray(release.customers) && release.customers.length > 0 && (
                  <div className="row mb-3">
                    <div className="col-md-4 text-light-muted">Customers:</div>
                    <div className="col-md-8 text-light">{release.customers.join(', ')}</div>
                  </div>
                )}
                <div className="row mb-3">
                  <div className="col-md-4 text-light-muted">Released By:</div>
                  <div className="col-md-8 text-light">
                    {release.releasedBy || 'N/A'}
                  </div>
                </div>
                {release.notes && (
                  <div className="row mb-3">
                    <div className="col-md-4 text-light-muted">Notes:</div>
                    <div className="col-md-8 text-light">{release.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-light">Tickets ({tickets.length})</h5>
                {tickets.length > 0 && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={generateJiraQuery}
                  >
                    <i className="bi bi-code-square me-1"></i>
                    Generate JIRA Query
                  </button>
                )}
              </div>
              <div className="card-body">
                {tickets.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr className="border-secondary">
                          <th className="border-secondary">Ticket ID</th>
                          <th className="border-secondary">Summary</th>
                          <th className="border-secondary">Status</th>
                          <th className="border-secondary">Assignee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <tr
                            key={ticket.ticketId}
                            className="border-secondary"
                          >
                            <td className="border-secondary">
                              <a
                                href={`${
                                  process.env.REACT_APP_JIRA_BASE_URL ||
                                  'https://jira.example.com'
                                }/browse/${ticket.ticketId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-info text-decoration-none"
                              >
                                {ticket.ticketId}
                              </a>
                            </td>
                            <td className="border-secondary text-light">
                              {ticket.summary}
                            </td>
                            <td className="border-secondary text-light">
                              {ticket.status}
                            </td>
                            <td className="border-secondary text-light">
                              {ticket.assignee}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-light-muted">
                    No tickets found for this release.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            {release.componentDeliveries &&
              release.componentDeliveries.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Components</h5>
                  </div>
                  <div className="card-body">
                    <div className="list-group bg-dark">
                      {release.componentDeliveries.map((component, index) => (
                        <div
                          key={index}
                          className="list-group-item bg-dark border-secondary text-light"
                        >
                          <h6>{component.name}</h6>
                          {component.dockerHubLink && (
                            <div className="mb-2">
                              <small className="text-light-muted">
                                DockerHub:
                              </small>{' '}
                              <a
                                href={component.dockerHubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-info text-decoration-none"
                              >
                                {component.dockerHubLink}
                              </a>
                            </div>
                          )}
                          {component.eDeliveryLink && (
                            <div>
                              <small className="text-light-muted">
                                E-Delivery:
                              </small>{' '}
                              <a
                                href={component.eDeliveryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-info text-decoration-none"
                              >
                                {component.eDeliveryLink}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {release.additionalPoints &&
              release.additionalPoints.length > 0 && (
                <div className="card bg-dark border-secondary mb-4">
                  <div className="card-header border-secondary">
                    <h5 className="mb-0 text-light">Additional Points</h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group bg-dark">
                      {release.additionalPoints.map((point, index) => (
                        <li
                          key={index}
                          className="list-group-item bg-dark border-secondary text-light"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* JIRA Query Modal Dialog */}
        {jiraQuery && (
          <div className="jira-query-dialog">
            <div className="jira-query-content">
              <div className="jira-query-header">
                <h5>JIRA Query for Release {release.version}</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={closeJiraQuery}
                  aria-label="Close"
                ></button>
              </div>
              <div className="jira-query-body">
                <pre>{jiraQuery}</pre>
              </div>
              <div className="jira-query-footer">
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={copyJiraQuery}
                >
                  <i className="bi bi-clipboard me-1"></i>
                  Copy to Clipboard
                </button>
                <a
                  href={`${
                    process.env.REACT_APP_JIRA_BASE_URL
                  }/issues/?jql=${encodeURIComponent(jiraQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm ms-2"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  Open in JIRA
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseDetails;
