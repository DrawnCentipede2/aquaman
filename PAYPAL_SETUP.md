# PayPal Payment Integration Setup Guide

This guide will help you set up PayPal payments for your Google Pins marketplace. The integration is designed to be simple and secure.

## 🚀 Quick Setup Steps

### 1. Create PayPal Developer Account

1. **Visit PayPal Developer Portal**: Go to [https://developer.paypal.com/](https://developer.paypal.com/)
2. **Sign In**: Use your existing PayPal account or create a new one
3. **Navigate to Apps**: Click on "My Apps & Credentials"

### 2. Create a PayPal Application

1. **Create New App**: Click "Create App" button
2. **Fill App Details**:
   - **App Name**: `Google Pins Marketplace` (or your preferred name)
   - **Merchant**: Select your business account or leave default
   - **Features**: Select "Accept payments"
   - **Products**: Select "Checkout" under "Accept Payments"

3. **Choose Environment**:
   - **Sandbox**: For testing (recommended to start with)
   - **Live**: For production (only when ready to accept real payments)

### 3. Get Your API Credentials

After creating the app, you'll see:
- **Client ID**: A public identifier for your app
- **Client Secret**: A private key (keep this secure!)

### 4. Configure Your Environment

1. **Copy your `.env.example` to `.env.local`**:
   ```bash
   cp env.example .env.local
   ```

2. **Add your PayPal credentials to `.env.local`**:
   ```env
   # PayPal Configuration
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_actual_client_id_here
   PAYPAL_CLIENT_SECRET=your_actual_client_secret_here
   NEXT_PUBLIC_PAYPAL_ENVIRONMENT=sandbox
   ```

   **Important**: 
   - Replace `your_actual_client_id_here` with your real Client ID
   - Replace `your_actual_client_secret_here` with your real Client Secret
   - Keep `sandbox` for testing, change to `live` for production

### 5. Update Your Database

Run the database migration to add the orders tables:

1. **Open Supabase Dashboard**: Go to your Supabase project
2. **Navigate to SQL Editor**: In the left sidebar
3. **Run the Migration**: Copy and paste the contents of `database-migration.sql` and execute it

### 6. Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Add items to cart**: Browse pin packs and add some to your cart
3. **Test checkout**: Go to `/cart` and click "Proceed to Checkout"
4. **Use PayPal sandbox account**: 
   - Email: `sb-test@personal.example.com`
   - Password: `testpassword123`
   - Or create your own sandbox account in the PayPal Developer Dashboard

## 🔧 Configuration Options

### Sandbox vs Live Environment

**Sandbox (Testing)**:
- Use for development and testing
- No real money is transferred
- PayPal provides test accounts
- Set `NEXT_PUBLIC_PAYPAL_ENVIRONMENT=sandbox`

**Live (Production)**:
- Use for real payments
- Real money will be transferred
- Requires business verification
- Set `NEXT_PUBLIC_PAYPAL_ENVIRONMENT=live`

### Payment Flow

1. **User clicks checkout** → Cart shows PayPal buttons
2. **PayPal payment** → User completes payment on PayPal
3. **Order completion** → Our system records the successful payment
4. **Download access** → User gets access to purchased pin packs

## 🛡️ Security Notes

- **Never commit** `.env.local` to version control
- **Keep Client Secret secure** - never expose it in client-side code
- **Use HTTPS** in production for secure payment processing
- **Test thoroughly** in sandbox before going live

## 🧪 Testing with Sandbox

PayPal provides test accounts for sandbox testing:

**Test Credit Card**:
- Card Number: `4111111111111111`
- Expiry: Any future date
- CVV: `123`

**Test PayPal Account**:
- You can create test accounts in the PayPal Developer Dashboard
- Or use the default sandbox accounts provided

## 🚨 Troubleshooting

### Common Issues

**1. "PayPal Not Configured" Error**:
- Check that `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set in your `.env.local`
- Restart your development server after adding environment variables

**2. "Payment Failed" Error**:
- Verify your credentials are correct
- Check that you're using the right environment (sandbox/live)
- Look at browser console for detailed error messages

**3. Database Errors**:
- Make sure you've run the database migration
- Check Supabase connection and permissions

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Look at the Network tab to see API request failures
3. Verify your PayPal app settings in the Developer Dashboard
4. Test with a simple sandbox transaction first

## 📈 Going Live

When ready for production:

1. **Switch to Live Environment**:
   - Create a new PayPal app with "Live" environment
   - Update your `.env.local` with live credentials
   - Change `NEXT_PUBLIC_PAYPAL_ENVIRONMENT=live`

2. **Business Verification**:
   - Complete PayPal business account verification
   - May require business documents and bank account verification

3. **Final Testing**:
   - Test with small real amounts first
   - Verify money appears in your PayPal account
   - Test refund process if needed

## 💡 Features Included

✅ **PayPal Checkout**: Full PayPal payment integration
✅ **Order Tracking**: Database records of all orders
✅ **Error Handling**: Proper error messages and retry logic
✅ **Cart Management**: Automatic cart clearing after purchase
✅ **Download Tracking**: Increment download counts after purchase
✅ **Responsive Design**: Works on mobile and desktop
✅ **Loading States**: Visual feedback during payment processing

---

**Need help?** The PayPal integration is designed to be simple and reliable. If you run into issues, most problems are related to environment configuration or API credentials. 