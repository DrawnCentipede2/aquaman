#!/usr/bin/env node

/**
 * Environment Variables Fix Script
 * Updates .env.local with correct NEXT_PUBLIC_ prefixes for client-side access
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Next.js Environment Fix Script');
console.log('==================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Please create your .env.local file first with your environment variables.');
  process.exit(1);
}

console.log('✅ Found .env.local file');

// Read current environment file
const currentContent = fs.readFileSync(envPath, 'utf8');
const lines = currentContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('📋 Current environment variables found:');
lines.forEach((line, index) => {
  const [key] = line.split('=');
  if (key) {
    console.log(`   ${index + 1}. ${key}`);
  }
});

console.log('\n🔍 Analyzing variables...\n');

// Check what needs to be fixed
const issues = [];
const recommendations = [];

// Required client-side variables (need NEXT_PUBLIC_ prefix)
const clientVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_ENVIRONMENT'];
const serverOnlyVars = ['SUPABASE_SERVICE_ROLE_KEY', 'PAYPAL_CLIENT_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'GOOGLE_MAPS_API_KEY_SERVER', 'NEXTAUTH_SECRET'];

clientVars.forEach(varName => {
  const hasCurrent = lines.some(line => line.startsWith(`${varName}=`));
  const hasPublic = lines.some(line => line.startsWith(`NEXT_PUBLIC_${varName}=`));

  if (hasCurrent && !hasPublic) {
    issues.push(`❌ ${varName} needs NEXT_PUBLIC_ prefix for client-side access`);
    recommendations.push(`   ➡️  Change: ${varName}=... to: NEXT_PUBLIC_${varName}=...`);
  } else if (hasPublic) {
    console.log(`✅ NEXT_PUBLIC_${varName} is correctly configured`);
  }
});

// Check for server-only variables that shouldn't have NEXT_PUBLIC_ prefix
serverOnlyVars.forEach(varName => {
  const hasPublic = lines.some(line => line.startsWith(`NEXT_PUBLIC_${varName}=`));
  if (hasPublic) {
    issues.push(`⚠️  ${varName} should NOT have NEXT_PUBLIC_ prefix (server-only)`);
    recommendations.push(`   ➡️  Change: NEXT_PUBLIC_${varName}=... to: ${varName}=...`);
  }
});

// Check for required variables
const requiredVars = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
requiredVars.forEach(varName => {
  const hasVar = lines.some(line => line.startsWith(`${varName}=`));
  if (!hasVar) {
    issues.push(`❌ Missing required variable: ${varName}`);
  } else {
    console.log(`✅ ${varName} is present`);
  }
});

if (issues.length > 0) {
  console.log('\n🚨 ISSUES FOUND:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });

  console.log('\n🛠️  RECOMMENDED FIXES:');
  recommendations.forEach(rec => {
    console.log(rec);
  });

  console.log('\n📝 To fix this automatically, I can create a corrected .env.local file.');
  console.log('   Would you like me to generate the corrected version?');
  console.log('   (Make sure to backup your current .env.local first!)');

} else {
  console.log('\n🎉 All environment variables are correctly configured!');
  console.log('   Your app should work without Supabase URL errors.');
}

console.log('\n💡 Next.js Environment Variable Rules:');
console.log('   • Client-side variables: NEXT_PUBLIC_VARIABLE_NAME');
console.log('   • Server-only variables: VARIABLE_NAME (no NEXT_PUBLIC_)');
console.log('   • Never put secrets in NEXT_PUBLIC_ variables');

console.log('\n🧪 Test your setup:');
console.log('   npm run env:test');
console.log('   npm run dev');
