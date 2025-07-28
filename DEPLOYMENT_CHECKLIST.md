# 🚀 Vercel Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - PayPal client ID (sandbox/live)
- [ ] `PAYPAL_CLIENT_SECRET` - PayPal client secret (sandbox/live)
- [ ] `NEXT_PUBLIC_PAYPAL_ENVIRONMENT` - "sandbox" or "live"
- [ ] `GMAIL_USER` - Your Gmail address
- [ ] `GMAIL_APP_PASSWORD` - Gmail app password

### ✅ Database Setup
- [ ] Supabase project is active and running
- [ ] All database migrations have been applied
- [ ] Database indexes are created (for performance)
- [ ] RLS policies are properly configured

### ✅ Domain Setup
- [ ] Domain is purchased and active
- [ ] Domain DNS settings are accessible
- [ ] Domain is not currently pointing to another service

### ✅ Code Quality
- [ ] All TypeScript errors are resolved
- [ ] Build passes locally (`npm run build`)
- [ ] No console errors in development
- [ ] All critical features are tested

## Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository

### 2. Configure Environment Variables
1. In Vercel dashboard, go to Project Settings
2. Navigate to "Environment Variables"
3. Add all variables from the checklist above
4. Set environment to "Production"

### 3. Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Test the deployed site

### 4. Connect Custom Domain
1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

## Post-Deployment Checklist

### ✅ Functionality Tests
- [ ] Homepage loads correctly
- [ ] Browse page loads with photos
- [ ] Search and filters work
- [ ] Pack detail pages load
- [ ] Authentication works
- [ ] PayPal checkout works
- [ ] Contact form works
- [ ] Mobile responsiveness

### ✅ Performance Tests
- [ ] Page load times are acceptable
- [ ] Images load properly
- [ ] No console errors
- [ ] Lighthouse score is good

### ✅ Security Tests
- [ ] Environment variables are not exposed
- [ ] HTTPS is working
- [ ] No sensitive data in client-side code

## Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors and dependencies
2. **Environment variables not working**: Verify variable names and values
3. **Domain not working**: Check DNS configuration and wait for propagation
4. **Database connection issues**: Verify Supabase URL and keys
5. **PayPal not working**: Check PayPal credentials and environment

### Performance Optimization
1. **Enable Vercel Analytics** for performance monitoring
2. **Set up Vercel Speed Insights** for real user metrics
3. **Configure caching headers** for better performance
4. **Enable compression** for faster loading

## Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [PayPal Developer Documentation](https://developer.paypal.com/docs) 