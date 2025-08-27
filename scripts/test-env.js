#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * Tests if all required environment variables are properly set
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        // Remove quotes if present
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key.trim()] = value;
      }
    }
  });

  return envVars;
}

// Load environment variables
const envVars = loadEnvFile();

// Required environment variables (including NEXT_PUBLIC_ variants)
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL', // Client-side Supabase URL
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', // Client-side Supabase anon key
  'SUPABASE_SERVICE_ROLE_KEY', // Server-side service role key
  'GOOGLE_MAPS_API_KEY_SERVER', // Server-side Google Maps key
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID', // Client-side PayPal client ID
  'PAYPAL_CLIENT_SECRET', // Server-side PayPal secret
  'NEXT_PUBLIC_PAYPAL_ENVIRONMENT', // Client-side PayPal environment
  'GMAIL_USER', // Server-side Gmail user
  'GMAIL_APP_PASSWORD', // Server-side Gmail app password
  'NEXTAUTH_SECRET', // Server-side NextAuth secret
  'NEXTAUTH_URL' // NextAuth URL
];

console.log('🔍 Testing Environment Variables...\n');

let allValid = true;
const issues = [];

requiredVars.forEach(varName => {
  const value = envVars[varName] || process.env[varName];

  if (!value || value.trim() === '') {
    issues.push({
      variable: varName,
      status: 'MISSING',
      message: `${varName} is not set or is empty`
    });
    allValid = false;
    console.log(`❌ ${varName}: MISSING`);
  } else {
    // Basic validation for specific variables
    let isValid = true;
    let message = '';

    switch (varName) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        isValid = value.startsWith('https://') && value.includes('.supabase.co');
        message = isValid ? 'Valid Supabase URL' : 'Should be https://xxx.supabase.co';
        break;
      case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
        isValid = value.length > 20;
        message = isValid ? 'Valid anon key' : 'Anon key seems too short';
        break;
      case 'NEXTAUTH_SECRET':
        isValid = value.length >= 32;
        message = isValid ? `Valid secret (${value.length} chars)` : 'Secret should be at least 32 characters';
        break;
      case 'NEXTAUTH_URL':
        isValid = value.startsWith('http');
        message = isValid ? 'Valid URL' : 'Should start with http:// or https://';
        break;
      case 'GMAIL_USER':
        isValid = value.includes('@');
        message = isValid ? 'Valid email' : 'Should be a valid email address';
        break;
      case 'NEXT_PUBLIC_PAYPAL_ENVIRONMENT':
        isValid = ['sandbox', 'live'].includes(value);
        message = isValid ? 'Valid environment' : 'Should be "sandbox" or "live"';
        break;
      case 'NEXT_PUBLIC_PAYPAL_CLIENT_ID':
        isValid = value.length > 10;
        message = isValid ? 'Valid PayPal client ID' : 'PayPal client ID seems too short';
        break;
      default:
        message = 'Present and not empty';
    }

    if (isValid) {
      console.log(`✅ ${varName}: ${message}`);
    } else {
      issues.push({
        variable: varName,
        status: 'INVALID',
        message: `${varName}: ${message}`
      });
      allValid = false;
      console.log(`⚠️  ${varName}: ${message}`);
    }
  }
});

console.log(`\n📊 SUMMARY:`);
console.log(`   Status: ${allValid ? '✅ ALL VALID' : '❌ ISSUES FOUND'}`);
console.log(`   Variables checked: ${requiredVars.length}`);
console.log(`   Issues found: ${issues.length}`);

if (issues.length > 0) {
  console.log(`\n🚨 ISSUES TO FIX:`);
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.message}`);
  });
}

console.log(`\n💡 If issues persist, check your .env.local file format:`);
console.log(`   - No spaces around =`);
console.log(`   - No quotes unless value contains spaces`);
console.log(`   - Each variable on its own line`);
console.log(`   - No empty lines between variables`);

if (allValid) {
  console.log(`\n🎉 Your environment is ready! Run 'npm run dev' to start your app.`);
} else {
  console.log(`\n🔧 Fix the issues above, then run 'npm run dev'`);
}
