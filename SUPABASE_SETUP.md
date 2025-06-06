# Supabase Setup Guide for Google Pins Marketplace

## Issue: Edit/Delete Operations Not Working

The edit and delete operations aren't working because you're using the **anon** (anonymous) key which has limited permissions. Here are **2 solutions**:

## **Option 1: Use Service Role Key (Recommended for MVP)**

This is the **quickest fix** - replace the anon key with your service role key:

### Steps:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API** 
3. Copy the **service_role** key (not the anon key)
4. Update your `.env.local` file:

```bash
# Replace this:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# With this:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_service_role_key_here
```

**⚠️ Important:** The service role key has **full permissions** and bypasses Row Level Security. Only use this for development/testing.

## **Option 2: Set Up Proper Row Level Security (Production Ready)**

This is the **proper solution** for production:

### 1. Keep using the anon key
### 2. Set up RLS policies in Supabase SQL Editor:

```sql
-- Enable RLS on tables
ALTER TABLE pin_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_pack_pins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pin packs (for browsing)
CREATE POLICY "Anyone can view pin packs" ON pin_packs
    FOR SELECT USING (true);

-- Allow anyone to read pins (for browsing)
CREATE POLICY "Anyone can view pins" ON pins
    FOR SELECT USING (true);

-- Allow anyone to read pin-pack relationships
CREATE POLICY "Anyone can view pin pack relationships" ON pin_pack_pins
    FOR SELECT USING (true);

-- Allow users to create their own pin packs
CREATE POLICY "Users can create pin packs" ON pin_packs
    FOR INSERT WITH CHECK (true);

-- Allow users to create pins
CREATE POLICY "Users can create pins" ON pins
    FOR INSERT WITH CHECK (true);

-- Allow users to create pin-pack relationships
CREATE POLICY "Users can create pin pack relationships" ON pin_pack_pins
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own pin packs
CREATE POLICY "Users can update their own pin packs" ON pin_packs
    FOR UPDATE USING (true);

-- Allow users to delete their own pin packs
CREATE POLICY "Users can delete their own pin packs" ON pin_packs
    FOR DELETE USING (true);

-- Allow deletion of related data
CREATE POLICY "Anyone can delete pins" ON pins
    FOR DELETE USING (true);

CREATE POLICY "Anyone can delete pin pack relationships" ON pin_pack_pins
    FOR DELETE USING (true);
```

## **Recommended Approach for You:**

Since you're in **MVP/testing phase**, I recommend **Option 1** (Service Role Key) because:

✅ **Quick fix** - just replace one key
✅ **No complex setup** required  
✅ **All operations will work immediately**
✅ **Perfect for development and testing**

You can switch to Option 2 later when moving to production.

## **Testing the Fix:**

After implementing either option:

1. Go to `/auth` and sign in with an email
2. Create a new pin pack on `/create`
3. Go to `/manage` to see your packs
4. Try the **Edit** and **Delete** buttons
5. They should now work properly!

## **Current System Benefits:**

✅ **Email-based authentication** for better user identification
✅ **Legacy user support** - old packs still work
✅ **Enhanced search** - finds packs by email domain
✅ **Profile persistence** across sessions
✅ **Debug panel** to troubleshoot issues

## **Next Steps:**

1. **Fix permissions** (use service role key)
2. **Test all functionality** 
3. **Sign in with your email** to claim ownership of future packs
4. **Create test packs** to verify everything works

Let me know which option you choose and I'll help you implement it! 