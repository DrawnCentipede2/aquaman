# PinPacks - Local Travel Pins Marketplace

A marketplace where locals can create and sell selected Google Maps pin collections to travelers. Get authentic travel recommendations from people who actually live there, not tourist traps!

## Features

- **Create Pin Packs**: Locals can create collections of Google Maps pins
- **NEW! Google Maps List Import**: Import places from existing Google Maps lists
- **Browse & Download**: Travelers can browse and download pin packs
- **Local Verification**: Simple IP-based location verification for creators
- **One-Click Import**: Download pins as text files for easy Google Maps import
- **Free MVP**: No payments required for testing with friends

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (recommended)
- **Icons**: Lucide React

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to your project settings → API
3. Copy your Project URL and anon public key
4. Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` and run it
3. This will create all necessary tables and policies

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## How It Works

### For Locals (Pin Pack Creators)
1. Visit `/create` to create a new pin pack
2. Add basic information (title, description, city, country)
3. **NEW!** Import from Google Maps List:
   - Share your Google Maps list URL for quick import guidance
   - Or paste multiple Google Maps URLs to quickly add several places
   - Edit each imported place to add your personal insights
4. Or add individual pins manually with Google Maps URLs
5. Submit to make it available for download

### For Travelers (Pin Pack Buyers)
1. Browse available pin packs on the homepage
2. Click "Download Pack" to get a text file
3. Import the pins to Google Maps (or use the URLs directly)

## Database Structure

### Tables
- **pins**: Individual location pins with Google Maps URLs
- **pin_packs**: Collections of pins created by locals
- **pin_pack_pins**: Junction table linking pins to packs

### Key Features
- Automatic coordinate extraction from Google Maps URLs
- IP-based location verification for creators
- Flexible pricing (currently set to free for MVP)

## Development Notes

### Local Verification
Currently using IP-based geolocation (ipapi.co) for simple local verification. This is basic but sufficient for MVP testing.

### Google Maps Integration
- Users paste Google Maps URLs
- App extracts coordinates automatically
- Downloads include both URLs and descriptions
- Future: Could integrate with Google Maps API for enhanced features

### Pricing
- Set to free ($0) for MVP testing
- Ready for payment integration (Stripe recommended)
- Price field exists in database for future use

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the MVP

### Test Creating a Pin Pack
1. Go to `/create`
2. Fill in pack information
3. Add a few pins with real Google Maps URLs
4. Submit and verify it appears on homepage

### Test Downloading
1. Browse to homepage
2. Click "Download Pack" on any pack
3. Open the downloaded text file
4. Verify it contains titles, descriptions, and URLs

### Test with Friends
- Share your deployed URL
- Ask friends to create packs for their cities
- Download and test importing to Google Maps

## Future Enhancements

### Authentication & Payments
- User accounts with Supabase Auth
- Stripe integration for payments
- User profiles and purchase history

### Enhanced Features
- Google Maps API integration
- Visual map previews
- Rating and review system
- Search and filtering
- Mobile app with React Native

### Local Verification
- Phone number verification
- Government ID verification
- Community reporting system
- Local business partnerships

## Contributing

This is an MVP built for rapid testing. Feel free to:
- Report bugs and issues
- Suggest improvements
- Add new features
- Improve the UI/UX

## License

MIT License - feel free to use this for your own projects!

---

**Remember to commit your changes!** 

Need help? The code is well-commented and follows simple patterns. Each component has clear explanations of what it does and why. 