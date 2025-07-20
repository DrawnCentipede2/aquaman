# Testing Category Editing Feature

## Prerequisites

1. **Database Migration**: Run the migration to add categories column:
   ```sql
   -- Run this in your Supabase SQL editor
   ALTER TABLE pin_packs ADD COLUMN categories JSONB DEFAULT '[]'::jsonb;
   ALTER TABLE pin_packs ADD CONSTRAINT max_categories CHECK (jsonb_array_length(categories) <= 3);
   CREATE INDEX idx_pin_packs_categories ON pin_packs USING GIN (categories);
   ```

2. **Development Server**: Make sure the dev server is running:
   ```bash
   npm run dev
   ```

## Test Steps

### 1. Create a Test Pack (if needed)
1. Go to `/create`
2. Add some places to create a pack
3. Save the pack

### 2. Test Category Editing
1. Go to `/manage`
2. Click "Edit" on any pack
3. Scroll down to the "Categories" section
4. Test the following scenarios:

#### Scenario A: Adding Categories
- Click on different category buttons
- Verify only up to 3 categories can be selected
- Verify disabled state when limit is reached
- Verify selected categories appear as tags above

#### Scenario B: Removing Categories
- Click the X button on selected category tags
- Verify categories are removed
- Verify other categories become selectable again

#### Scenario C: Saving Changes
- Select some categories
- Click "Save Changes"
- Verify success message
- Refresh the page and verify categories are still selected

#### Scenario D: Preview Display
- Check the sidebar preview shows selected categories
- Verify only first 2 categories are shown with "+X" for additional ones

### 3. Database Verification
1. Check Supabase dashboard
2. Verify the `categories` column exists in `pin_packs` table
3. Verify categories are saved as JSONB array

## Expected Behavior

- ✅ Categories load from existing pack data
- ✅ Maximum 3 categories enforced
- ✅ Categories save correctly to database
- ✅ UI updates immediately on selection/deselection
- ✅ Preview shows categories correctly
- ✅ Error handling for save failures

## Troubleshooting

If categories don't appear:
1. Check if migration was run successfully
2. Verify the `categories` column exists in database
3. Check browser console for errors
4. Verify pack data includes categories field

If save fails:
1. Check network tab for API errors
2. Verify Supabase connection
3. Check database constraints 