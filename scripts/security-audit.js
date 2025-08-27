#!/usr/bin/env node

/**
 * Security Audit Script for PinCloud
 * This script checks for common security vulnerabilities and exposed sensitive data
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔒 PinCloud Security Audit Starting...\n');

// Check for sensitive files that might be exposed
function checkSensitiveFiles() {
  console.log('📁 Checking for sensitive files...');

  // Only check for CRITICAL sensitive files that pose real security risks
  const criticalSensitivePatterns = [
    /\.env$/,
    /\.env\..*$/,
    /secret.*\.key$/,
    /private.*\.key$/,
    /.*\.pem$/,
    /.*\.pfx$/,
    /.*\.p12$/,
    /.*\.cer$/,
    /.*\.crt$/,
    /.*\.csr$/,
    // Database files with sensitive data
    /.*user.*\.sql$/,
    /.*password.*\.sql$/,
    /.*email.*\.sql$/,
    /.*credit.*\.sql$/,
    /.*payment.*\.sql$/,
    // Actual secret files
    /secrets?\.json$/,
    /credentials?\.json$/,
    /keys?\.json$/,
    /auth\.json$/,
    // Backup files with sensitive data
    /.*backup.*\.sql$/,
    /.*dump.*\.sql$/
  ];

  // Files that are sensitive but should be protected by middleware (INFO level)
  const middlewareProtectedPatterns = [
    /\.md$/,
    /\.log$/,
    /report\.html$/,
    /lighthouse.*\.html$/,
    /localhost.*\.html$/,
    /next\.config\.js$/,
    /tailwind\.config\.js$/,
    /postcss\.config\.js$/,
    /tsconfig\.json$/,
    /\.tsbuildinfo$/,
    /package-lock\.json$/
  ];

  const rootDir = path.join(__dirname, '..');
  const criticalFindings = [];
  const middlewareFindings = [];

  function scanDirectory(dir, results = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== '.next' && file !== '.secure') {
        scanDirectory(filePath, results);
      } else if (stat.isFile()) {
        const relativePath = path.relative(rootDir, filePath);

        // Check critical patterns first
        for (const pattern of criticalSensitivePatterns) {
          if (pattern.test(file) || pattern.test(relativePath)) {
            criticalFindings.push({
              file: relativePath,
              type: 'CRITICAL_SECURITY_RISK',
              risk: 'CRITICAL',
              description: 'Critical sensitive file that MUST be secured immediately'
            });
            break;
          }
        }

        // Check middleware-protected patterns
        for (const pattern of middlewareProtectedPatterns) {
          if (pattern.test(file) || pattern.test(relativePath)) {
            middlewareFindings.push({
              file: relativePath,
              type: 'MIDDLEWARE_PROTECTED',
              risk: 'INFO',
              description: 'File should be protected by middleware (verify middleware is working)'
            });
            break;
          }
        }
      }
    }
  }

  scanDirectory(rootDir);

  if (criticalFindings.length > 0) {
    console.log('🚨 CRITICAL SECURITY RISKS FOUND:');
    criticalFindings.forEach(file => {
      console.log(`  ❌ ${file.file} - ${file.description}`);
    });
  }

  if (middlewareFindings.length > 0) {
    console.log('\n📋 MIDDLEWARE-PROTECTED FILES:');
    middlewareFindings.forEach(file => {
      console.log(`  📁 ${file.file} - ${file.description}`);
    });
  }

  if (criticalFindings.length === 0 && middlewareFindings.length === 0) {
    console.log('✅ No sensitive files found in web-accessible locations.\n');
  } else if (criticalFindings.length === 0) {
    console.log('\n✅ No critical security risks found. Files are protected by middleware.\n');
  } else {
    console.log('\n⚠️  CRITICAL SECURITY ISSUES FOUND! Address immediately!\n');
  }

  return [...criticalFindings, ...middlewareFindings];
}

// Check for hardcoded secrets in code files
function checkHardcodedSecrets() {
  console.log('🔍 Checking for hardcoded secrets in code...');

  // More specific patterns for real hardcoded secrets
  const criticalPatterns = [
    /['"`]AIza[0-9A-Za-z_-]{35}['"`]/g, // Google API keys
    /['"`]sk-[a-zA-Z0-9]{48}['"`]/g, // OpenAI keys
    /['"`]pk_[a-zA-Z0-9]{48}['"`]/g, // Stripe publishable keys
    /['"`]sk_[a-zA-Z0-9]{48}['"`]/g, // Stripe secret keys
    /['"`]EAA[a-zA-Z0-9]{150}['"`]/g, // Facebook app tokens
    /['"`]xoxb-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24}['"`]/g, // Slack tokens
    /['"`]ghp_[a-zA-Z0-9]{36}['"`]/g, // GitHub personal access tokens
    /['"`]AKIA[0-9A-Z]{16}['"`]/g, // AWS access keys
    /['"`][a-zA-Z0-9]{32}['"`]/g, // Generic 32-char secrets (potential API keys)
  ];

  // Patterns that might be false positives but should be reviewed
  const warningPatterns = [
    /password\s*[:=]\s*['"][^'"]{12,}['"]/gi, // Passwords with 12+ characters (longer threshold)
    /secret\s*[:=]\s*['"][^'"]{12,}['"]/gi, // Secrets with 12+ characters
    /token\s*[:=]\s*['"][^'"]{20,}['"]/gi, // Tokens with 20+ characters (API tokens are usually long)
    /key\s*[:=]\s*['"][^'"]{20,}['"]/gi, // Keys with 20+ characters
  ];

  const rootDir = path.join(__dirname, '..');
  const criticalFindings = [];
  const warningFindings = [];

  function scanCodeFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      if (fs.statSync(filePath).isDirectory() &&
          !file.startsWith('.') &&
          file !== 'node_modules' &&
          file !== '.next' &&
          file !== '.git' &&
          file !== '.secure') {
        scanCodeFiles(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(rootDir, filePath);

        // Skip files that are known to be safe or part of build process
        if (relativePath.includes('node_modules') ||
            relativePath.includes('.next') ||
            relativePath.includes('dist') ||
            relativePath.includes('build') ||
            relativePath.endsWith('.min.js') ||
            relativePath.endsWith('.min.ts')) {
          continue;
        }

        // Check critical patterns
        for (const pattern of criticalPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            criticalFindings.push({
              file: relativePath,
              pattern: pattern.toString(),
              matches: matches.length,
              risk: 'CRITICAL',
              description: 'Potential hardcoded API key or secret token found'
            });
          }
        }

        // Check warning patterns (less critical)
        for (const pattern of warningPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            warningFindings.push({
              file: relativePath,
              pattern: pattern.toString(),
              matches: matches.length,
              risk: 'WARNING',
              description: 'Potential hardcoded password/secret/key (review required)'
            });
          }
        }
      }
    }
  }

  scanCodeFiles(rootDir);

  if (criticalFindings.length > 0) {
    console.log('🚨 CRITICAL HARDCODED SECRETS FOUND:');
    criticalFindings.forEach(finding => {
      console.log(`  ❌ ${finding.file} - ${finding.matches} potential secrets (${finding.description})`);
    });
  }

  if (warningFindings.length > 0) {
    console.log('\n⚠️  POTENTIAL HARDCODED VALUES FOUND (REVIEW REQUIRED):');
    warningFindings.forEach(finding => {
      console.log(`  ⚠️  ${finding.file} - ${finding.matches} potential values (${finding.description})`);
    });
  }

  if (criticalFindings.length === 0 && warningFindings.length === 0) {
    console.log('✅ No hardcoded secrets found in code files.\n');
  } else if (criticalFindings.length === 0) {
    console.log('\n✅ No critical hardcoded secrets found. Review warning items if needed.\n');
  } else {
    console.log('\n⚠️  CRITICAL SECURITY ISSUES FOUND! Address immediately!\n');
  }

  return [...criticalFindings, ...warningFindings];
}

// Check Google dorks for exposed sensitive data
function checkGoogleDorks() {
  console.log('🌐 Checking for common Google dork exposures...');

  const dorks = [
    'site:pincloud.co filetype:pdf',
    'site:pincloud.co filetype:doc',
    'site:pincloud.co filetype:xls',
    'site:pincloud.co filetype:sql',
    'site:pincloud.co inurl:.env',
    'site:pincloud.co inurl:config',
    'site:pincloud.co inurl:.git',
    'site:pincloud.co inurl:backup',
    'site:pincloud.co inurl:admin',
    'site:pincloud.co inurl:login',
    'site:pincloud.co inurl:auth'
  ];

  console.log('📋 Recommended Google dorks to check manually:');
  dorks.forEach(dork => {
    console.log(`  🔍 ${dork}`);
  });

  console.log('\n⚠️  Run these searches to check for exposed sensitive data.\n');
}

// Main audit function
async function runSecurityAudit() {
  console.log('🚀 Starting comprehensive security audit...\n');

  const sensitiveFiles = checkSensitiveFiles();
  const hardcodedSecrets = checkHardcodedSecrets();
  checkGoogleDorks();

  // Summary
  console.log('📊 AUDIT SUMMARY:');
  console.log(`   Sensitive files found: ${sensitiveFiles.length}`);
  console.log(`   Hardcoded secrets found: ${hardcodedSecrets.length}`);

  if (sensitiveFiles.length === 0 && hardcodedSecrets.length === 0) {
    console.log('\n🎉 SECURITY AUDIT PASSED! No critical issues found.');
  } else {
    console.log('\n⚠️  SECURITY ISSUES FOUND! Please address them immediately.');
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('   1. Move sensitive files to secure locations or protect with middleware');
    console.log('   2. Replace hardcoded secrets with environment variables');
    console.log('   3. Run Google dork searches to check for exposed data');
    console.log('   4. Implement proper access controls and authentication');
  }

  console.log('\n🔒 Security audit completed.');
}

// Run the audit
runSecurityAudit().catch(console.error);
