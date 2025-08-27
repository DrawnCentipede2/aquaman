#!/usr/bin/env node

/**
 * Create Corrected .env.local Script
 * Generates a properly formatted .env.local file with correct NEXT_PUBLIC_ prefixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating Corrected .env.local File');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
const backupPath = path.join(__dirname, '..', '.env.local.backup');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  process.exit(1);
}

// Backup current file
console.log('📁 Backing up current .env.local...');
fs.copyFileSync(envPath, backupPath);
console.log('✅ Backup created: .env.local.backup');

// Read current environment file
const currentContent = fs.readFileSync(envPath, 'utf8');
const lines = currentContent.split('\n');

// Process each line
const correctedLines = lines.map(line => {
  line = line.trim();

  if (!line || line.startsWith('#')) {
    return line; // Keep comments and empty lines
  }

  // Fix client-side variables that need NEXT_PUBLIC_ prefix
  const clientVarMappings = {
    'SUPABASE_URL': 'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_ANON_KEY': 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'PAYPAL_CLIENT_ID': 'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
    'PAYPAL_ENVIRONMENT': 'NEXT_PUBLIC_PAYPAL_ENVIRONMENT'
  };

  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');

  if (clientVarMappings[key]) {
    console.log(`🔄 ${key} → ${clientVarMappings[key]}`);
    return `${clientVarMappings[key]}=${value}`;
  }

  // Warn about server-only variables that shouldn't have NEXT_PUBLIC_
  if (key.startsWith('NEXT_PUBLIC_')) {
    const baseKey = key.replace('NEXT_PUBLIC_', '');
    const serverOnlyVars = ['SUPABASE_SERVICE_ROLE_KEY', 'PAYPAL_CLIENT_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'GOOGLE_MAPS_API_KEY_SERVER', 'NEXTAUTH_SECRET'];

    if (serverOnlyVars.includes(baseKey)) {
      console.log(`⚠️  WARNING: ${key} should be server-only (remove NEXT_PUBLIC_ prefix)`);
      return `${baseKey}=${value}`;
    }
  }

  return line;
});

// Add helpful comments
const correctedContent = `# NextAuth Configuration (REQUIRED)
${correctedLines.find(line => line.includes('NEXTAUTH_SECRET')) || 'NEXTAUTH_SECRET=your-nextauth-secret-here'}
${correctedLines.find(line => line.includes('NEXTAUTH_URL')) || 'NEXTAUTH_URL=https://pincloud.co'}

# Supabase Configuration (Client-side - exposed to browser)
${correctedLines.find(line => line.includes('NEXT_PUBLIC_SUPABASE_URL')) || 'NEXT_PUBLIC_SUPABASE_URL=your-supabase-url'}
${correctedLines.find(line => line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) || 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key'}

# Supabase Service Role (Server-side only - NOT exposed to browser)
${correctedLines.find(line => line.includes('SUPABASE_SERVICE_ROLE_KEY')) || 'SUPABASE_SERVICE_ROLE_KEY=your-service-role-key'}

# Google Maps API (Server-side only)
${correctedLines.find(line => line.includes('GOOGLE_MAPS_API_KEY_SERVER')) || 'GOOGLE_MAPS_API_KEY_SERVER=your-google-maps-server-key'}

# PayPal Configuration
${correctedLines.find(line => line.includes('NEXT_PUBLIC_PAYPAL_CLIENT_ID')) || 'NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id'}
${correctedLines.find(line => line.includes('NEXT_PUBLIC_PAYPAL_ENVIRONMENT')) || 'NEXT_PUBLIC_PAYPAL_ENVIRONMENT=sandbox'}
PAYPAL_CLIENT_SECRET=${correctedLines.find(line => line.includes('PAYPAL_CLIENT_SECRET=') && !line.includes('NEXT_PUBLIC_'))?.split('=')[1] || 'your-paypal-client-secret'}

# Email Configuration (Server-side only)
${correctedLines.find(line => line.includes('GMAIL_USER=')) || 'GMAIL_USER=your-email@gmail.com'}
${correctedLines.find(line => line.includes('GMAIL_APP_PASSWORD=')) || 'GMAIL_APP_PASSWORD=your-gmail-app-password'}

# Environment
${correctedLines.find(line => line.includes('NODE_ENV=')) || 'NODE_ENV=development'}

# =================================================================
# SECURITY NOTES:
# =================================================================
# • NEXT_PUBLIC_ variables are exposed to the browser
# • Never put secrets (passwords, private keys) in NEXT_PUBLIC_ variables
# • Server-only variables (no NEXT_PUBLIC_) are only available on the server
# • This file is NOT committed to git (.gitignore protects it)
# =================================================================
`;

// Write corrected file
fs.writeFileSync(envPath, correctedContent);

console.log('\n✅ Corrected .env.local file created!');
console.log('📋 Summary of changes:');
console.log('   • Added NEXT_PUBLIC_ prefixes to client-side variables');
console.log('   • Removed NEXT_PUBLIC_ from server-only variables (if any)');
console.log('   • Added helpful comments and organization');
console.log('   • Original file backed up as .env.local.backup');

console.log('\n🧪 Test your corrected environment:');
console.log('   npm run env:test');
console.log('   npm run dev');

console.log('\n📚 Environment Variable Rules:');
console.log('   ✅ Client-side (browser): NEXT_PUBLIC_VARIABLE_NAME');
console.log('   ✅ Server-side only: VARIABLE_NAME');
console.log('   ❌ NEVER: NEXT_PUBLIC_ with secrets/passwords');

console.log('\n🎉 Your environment should now work without Supabase URL errors!');
