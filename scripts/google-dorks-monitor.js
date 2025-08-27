#!/usr/bin/env node

/**
 * Google Dorks Security Monitor for PinCloud
 * Automated script to test for exposed sensitive data
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    targetDomain: 'pincloud.co',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    delayBetweenRequests: 2000, // 2 seconds between requests to avoid rate limiting
    maxRetries: 3,
    timeout: 10000 // 10 seconds timeout
};

// Critical Google dork queries to test
const CRITICAL_DORKS = [
    {
        name: 'SQL Files',
        query: `site:${CONFIG.targetDomain} filetype:sql`,
        risk: 'CRITICAL',
        description: 'Database files that could contain sensitive data'
    },
    {
        name: 'Environment Files',
        query: `site:${CONFIG.targetDomain} filetype:env`,
        risk: 'CRITICAL',
        description: 'Environment configuration files with secrets'
    },
    {
        name: 'Environment URLs',
        query: `site:${CONFIG.targetDomain} inurl:.env`,
        risk: 'CRITICAL',
        description: 'Environment files accessible via URL'
    },
    {
        name: 'YAML Config Files',
        query: `site:${CONFIG.targetDomain} filetype:yml`,
        risk: 'HIGH',
        description: 'YAML configuration files'
    },
    {
        name: 'JSON Config Files',
        query: `site:${CONFIG.targetDomain} filetype:json`,
        risk: 'HIGH',
        description: 'JSON configuration files'
    },
    {
        name: 'Config URLs',
        query: `site:${CONFIG.targetDomain} inurl:config`,
        risk: 'HIGH',
        description: 'Configuration files accessible via URL'
    },
    {
        name: 'Git Repository',
        query: `site:${CONFIG.targetDomain} inurl:.git`,
        risk: 'CRITICAL',
        description: 'Git repository exposed to public'
    },
    {
        name: 'Backup Files',
        query: `site:${CONFIG.targetDomain} filetype:bak`,
        risk: 'HIGH',
        description: 'Backup files that might contain sensitive data'
    },
    {
        name: 'Log Files',
        query: `site:${CONFIG.targetDomain} filetype:log`,
        risk: 'MEDIUM',
        description: 'Log files that might leak sensitive information'
    },
    {
        name: 'Markdown Files',
        query: `site:${CONFIG.targetDomain} filetype:md`,
        risk: 'LOW',
        description: 'Documentation files (usually safe but check content)'
    },
    {
        name: 'Admin Panels',
        query: `site:${CONFIG.targetDomain} inurl:admin`,
        risk: 'MEDIUM',
        description: 'Admin panels that might be exposed'
    },
    {
        name: 'Login Pages',
        query: `site:${CONFIG.targetDomain} inurl:login`,
        risk: 'LOW',
        description: 'Login pages (expected to exist)'
    },
    {
        name: 'API Endpoints',
        query: `site:${CONFIG.targetDomain} inurl:api`,
        risk: 'MEDIUM',
        description: 'API endpoints that might leak data'
    },
    {
        name: 'PDF Documents',
        query: `site:${CONFIG.targetDomain} filetype:pdf`,
        risk: 'LOW',
        description: 'PDF files (check for sensitive content)'
    }
];

// Function to make HTTP request to Google
function makeGoogleRequest(query, retryCount = 0) {
    return new Promise((resolve, reject) => {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?q=${encodedQuery}&num=10`;

        const options = {
            hostname: 'www.google.com',
            path: `/search?q=${encodedQuery}&num=10`,
            method: 'GET',
            headers: {
                'User-Agent': CONFIG.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: CONFIG.timeout
        };

        const req = https.request(options, (res) => {
            let data = '';

            // Handle gzip compression
            if (res.headers['content-encoding'] === 'gzip') {
                const zlib = require('zlib');
                res.pipe(zlib.createGunzip()).on('data', chunk => data += chunk);
            } else {
                res.on('data', chunk => data += chunk);
            }

            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });

        req.on('error', (error) => {
            if (retryCount < CONFIG.maxRetries) {
                console.log(`⚠️  Request failed, retrying... (${retryCount + 1}/${CONFIG.maxRetries})`);
                setTimeout(() => {
                    resolve(makeGoogleRequest(query, retryCount + 1));
                }, CONFIG.delayBetweenRequests * (retryCount + 1));
            } else {
                reject(error);
            }
        });

        req.on('timeout', () => {
            req.destroy();
            if (retryCount < CONFIG.maxRetries) {
                console.log(`⏰ Request timed out, retrying... (${retryCount + 1}/${CONFIG.maxRetries})`);
                setTimeout(() => {
                    resolve(makeGoogleRequest(query, retryCount + 1));
                }, CONFIG.delayBetweenRequests * (retryCount + 1));
            } else {
                reject(new Error('Request timeout'));
            }
        });

        req.end();
    });
}

// Function to parse Google results and check for sensitive files
function analyzeResults(query, response) {
    const findings = [];

    if (response.status !== 200) {
        return [{
            type: 'ERROR',
            message: `HTTP ${response.status} - Could not fetch results`,
            risk: 'UNKNOWN'
        }];
    }

    const html = response.data;

    // Check for common patterns that indicate exposed sensitive files
    const sensitivePatterns = [
        /\.sql['"]/gi,
        /\.env['"]/gi,
        /\.git['"]/gi,
        /config\.js['"]/gi,
        /settings\.js['"]/gi,
        /\.bak['"]/gi,
        /\.log['"]/gi,
        /backup['"]/gi,
        /secret['"]/gi,
        /password['"]/gi,
        /token['"]/gi,
        /api[_-]?key['"]/gi
    ];

    for (const pattern of sensitivePatterns) {
        const matches = html.match(pattern);
        if (matches) {
            findings.push({
                type: 'SENSITIVE_FILE_DETECTED',
                pattern: pattern.toString(),
                matches: matches.length,
                message: `Found ${matches.length} potential sensitive file(s) matching pattern: ${pattern}`,
                risk: 'HIGH'
            });
        }
    }

    // Check if results contain actual file links (not just search suggestions)
    const urlPattern = /https?:\/\/[^\s<>"']+\.(sql|env|git|config|bak|log|yml|yaml|json)/gi;
    const urlMatches = html.match(urlPattern);
    if (urlMatches) {
        findings.push({
            type: 'DIRECT_FILE_LINKS',
            matches: urlMatches.length,
            urls: urlMatches.slice(0, 5), // Show first 5 URLs
            message: `Found ${urlMatches.length} direct links to sensitive files`,
            risk: 'CRITICAL'
        });
    }

    // Check for "No results found" or similar messages
    if (html.includes('did not match any documents') ||
        html.includes('No results found') ||
        html.includes('Your search -') && html.includes('- did not match any documents')) {
        findings.push({
            type: 'NO_RESULTS',
            message: 'No sensitive files found - this is GOOD!',
            risk: 'LOW'
        });
    }

    return findings.length > 0 ? findings : [{
        type: 'CLEAN',
        message: 'No obvious sensitive data found in search results',
        risk: 'LOW'
    }];
}

// Function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to generate HTML report
function generateHTMLReport(results, scanTime) {
    const reportPath = path.join(__dirname, '..', 'security-reports', 'google-dorks-report.html');

    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Dorks Security Report - ${CONFIG.targetDomain}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #d32f2f;
            border-bottom: 3px solid #d32f2f;
            padding-bottom: 10px;
        }
        .summary {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #1976d2;
        }
        .result {
            margin: 15px 0;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid;
        }
        .critical { border-left-color: #d32f2f; background: #ffebee; }
        .high { border-left-color: #f57c00; background: #fff3e0; }
        .medium { border-left-color: #fbc02d; background: #fffde7; }
        .low { border-left-color: #388e3c; background: #e8f5e8; }
        .unknown { border-left-color: #757575; background: #f5f5f5; }
        .scan-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
        }
        .recommendations {
            background: #fff3e0;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #f57c00;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Google Dorks Security Report</h1>
        <div class="scan-info">
            <strong>Target Domain:</strong> ${CONFIG.targetDomain}<br>
            <strong>Scan Time:</strong> ${scanTime}<br>
            <strong>Queries Tested:</strong> ${CRITICAL_DORKS.length}<br>
            <strong>Status:</strong> <span style="color: ${results.some(r => r.findings.some(f => f.risk === 'CRITICAL')) ? '#d32f2f' : '#388e3c'};">${results.some(r => r.findings.some(f => f.risk === 'CRITICAL')) ? 'CRITICAL ISSUES FOUND' : 'CLEAN SCAN'}</span>
        </div>

        <div class="summary">
            <h3>📊 Executive Summary</h3>
            <p><strong>Critical Issues:</strong> ${results.filter(r => r.findings.some(f => f.risk === 'CRITICAL')).length}</p>
            <p><strong>High Risk Issues:</strong> ${results.filter(r => r.findings.some(f => f.risk === 'HIGH')).length}</p>
            <p><strong>Total Tests:</strong> ${results.length}</p>
            <p><strong>Scan Duration:</strong> ${Math.round((Date.now() - new Date(scanTime).getTime()) / 1000)} seconds</p>
        </div>

        <h2>🔬 Detailed Results</h2>
        ${results.map(result => `
            <div class="result ${result.dork.risk.toLowerCase()}">
                <h3>${result.dork.name}</h3>
                <p><strong>Query:</strong> <code>${result.dork.query}</code></p>
                <p><strong>Risk Level:</strong> ${result.dork.risk}</p>
                <p><strong>Description:</strong> ${result.dork.description}</p>
                <div>
                    <strong>Findings:</strong>
                    ${result.findings.map(finding => `
                        <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">
                            <strong>${finding.type}:</strong> ${finding.message}
                            ${finding.matches ? `<br><strong>Matches:</strong> ${finding.matches}` : ''}
                            ${finding.urls ? `<br><strong>URLs:</strong> ${finding.urls.join(', ')}` : ''}
                            ${finding.pattern ? `<br><strong>Pattern:</strong> ${finding.pattern}` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        <div class="recommendations">
            <h3>🛡️ Security Recommendations</h3>
            <ul>
                <li><strong>Immediate Action:</strong> Address all CRITICAL and HIGH risk findings</li>
                <li><strong>Regular Monitoring:</strong> Run this scan weekly during development</li>
                <li><strong>Pre-deployment:</strong> Always run before deploying to production</li>
                <li><strong>Middleware Protection:</strong> Ensure all sensitive file types are blocked</li>
                <li><strong>Access Controls:</strong> Implement proper authentication and authorization</li>
                <li><strong>Regular Audits:</strong> Use automated tools like this script for ongoing security</li>
            </ul>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    return reportPath;
}

// Main function to run all tests
async function runGoogleDorksScan() {
    console.log(`🔍 Starting Google Dorks Security Scan for ${CONFIG.targetDomain}`);
    console.log(`📊 Testing ${CRITICAL_DORKS.length} critical queries...\n`);

    const results = [];
    const startTime = new Date();

    for (let i = 0; i < CRITICAL_DORKS.length; i++) {
        const dork = CRITICAL_DORKS[i];

        console.log(`🔎 [${i + 1}/${CRITICAL_DORKS.length}] Testing: ${dork.name}`);
        console.log(`   Query: ${dork.query}`);

        try {
            const response = await makeGoogleRequest(dork.query);
            const findings = analyzeResults(dork.query, response);

            results.push({
                dork: dork,
                findings: findings,
                success: true
            });

            // Display results
            console.log(`   📋 Findings: ${findings.length}`);
            findings.forEach(finding => {
                const emoji = finding.risk === 'CRITICAL' ? '🚨' :
                             finding.risk === 'HIGH' ? '⚠️' :
                             finding.risk === 'MEDIUM' ? '🟡' : '✅';
                console.log(`     ${emoji} ${finding.message}`);
            });

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.push({
                dork: dork,
                findings: [{
                    type: 'ERROR',
                    message: `Failed to execute query: ${error.message}`,
                    risk: 'UNKNOWN'
                }],
                success: false
            });
        }

        // Delay between requests to avoid rate limiting
        if (i < CRITICAL_DORKS.length - 1) {
            console.log(`   ⏳ Waiting ${CONFIG.delayBetweenRequests}ms before next request...\n`);
            await delay(CONFIG.delayBetweenRequests);
        }
    }

    const endTime = new Date();
    const scanDuration = endTime - startTime;

    console.log(`\n🎯 Scan Complete!`);
    console.log(`📊 Duration: ${Math.round(scanDuration / 1000)} seconds`);
    console.log(`🔍 Queries tested: ${results.length}`);

    // Summary
    const criticalCount = results.filter(r => r.findings.some(f => f.risk === 'CRITICAL')).length;
    const highCount = results.filter(r => r.findings.some(f => f.risk === 'HIGH')).length;
    const mediumCount = results.filter(r => r.findings.some(f => f.risk === 'MEDIUM')).length;
    const lowCount = results.filter(r => r.findings.some(f => f.risk === 'LOW')).length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`   🚨 Critical Issues: ${criticalCount}`);
    console.log(`   ⚠️  High Risk: ${highCount}`);
    console.log(`   🟡 Medium Risk: ${mediumCount}`);
    console.log(`   ✅ Low Risk: ${lowCount}`);

    // Generate HTML report
    try {
        const reportPath = generateHTMLReport(results, startTime.toISOString());
        console.log(`\n📄 HTML Report generated: ${reportPath}`);
        console.log(`   Open in browser: file://${reportPath}`);
    } catch (error) {
        console.log(`\n⚠️  Could not generate HTML report: ${error.message}`);
    }

    // Final assessment
    if (criticalCount > 0) {
        console.log(`\n🚨 CRITICAL SECURITY ISSUES FOUND!`);
        console.log(`   Immediate action required!`);
    } else if (highCount > 0) {
        console.log(`\n⚠️  HIGH RISK ISSUES FOUND!`);
        console.log(`   Address these issues promptly.`);
    } else {
        console.log(`\n✅ SCAN PASSED!`);
        console.log(`   No critical security vulnerabilities found.`);
    }

    console.log(`\n🛡️  Security monitoring complete for ${CONFIG.targetDomain}`);
}

// Run the scan if this script is executed directly
if (require.main === module) {
    runGoogleDorksScan().catch(console.error);
}

module.exports = { runGoogleDorksScan, CRITICAL_DORKS };
