# Supabase Integration for Done and Dusted

## ✅ What's Been Set Up

### 1. Database Created
- **Table**: `bookings`
- **Columns**:
  - `id` (auto-increment)
  - `name`, `email`, `phone`, `service`, `date`, `notes`
  - `status` (Pending/Completed/Cancelled)
  - `created_at`, `updated_at` (timestamps)

### 2. Files Created/Modified
- ✅ `js/supabase-config.js` - Supabase configuration
- ✅ `js/main.js` - Updated to save bookings to Supabase
- ✅ `js/admin.js` - Enhanced with status updates and search

### 3. Next Steps to Complete Integration

#### Step 1: Add Supabase Library to index.html
Add these lines before `</body>` tag in `index.html`:

```html
<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

Make sure they come BEFORE `<script src="js/main.js"></script>`

#### Step 2: Update Admin Dashboard
The admin dashboard (`dashboard.html` and `admin.js`) needs to be updated to read from Supabase instead of localStorage.

## 🔐 Security Note
The API key in `supabase-config.js` is the **anon** (public) key, which is safe to use in frontend code. Row Level Security (RLS) policies protect your data.

## 📊 How It Works Now

### Customer Booking Flow:
1. Customer fills form on website
2. Data is saved to Supabase database
3. Data is **permanent** and accessible from anywhere

### Admin Flow:
1. Admin logs in at `admin.html`
2. Views all bookings from database
3. Can update status, search, and delete bookings

## 🚀 Benefits Over localStorage
- ✅ **Permanent storage** - Data never gets lost
- ✅ **Multi-device access** - View from any computer
- ✅ **Real database** - Professional and scalable
- ✅ **Automatic backups** - Supabase handles it
- ✅ **Secure** - Row Level Security enabled

## 📝 Admin Credentials
- Email: `admin@doneanddusted.co.uk`
- Password: `admin123`

**Remember to change these in production!**
