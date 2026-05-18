# Style-BD Website Deployment Guide (Hostinger)

This folder contains a reorganized version of your project optimized for **Hostinger Shared Hosting**.

## Directory Structure
- `core/`: This contains all your Laravel application files. It should be uploaded **outside** the `public_html` folder on Hostinger for security.
- `public_html/`: This contains the contents of your Laravel `public` folder. The contents of this folder should be uploaded **inside** the `public_html` directory on Hostinger.
- `admin/`: This is your Next.js Admin dashboard source code.
- `Product Images/`: Original product images (source).

---

## 1. Deploying the Laravel Website

### Step A: Upload Files
1. Log in to Hostinger File Manager.
2. Go to your domain's root (usually `/home/u123456789/domains/yourdomain.com/`).
3. Upload the contents of the `core/` folder into a new folder named `core` (so it sits next to `public_html`).
4. Upload the contents of the `public_html/` folder into the existing `public_html` directory on Hostinger.

### Step B: Database Setup
1. Create a **MySQL Database** in Hostinger Panel.
2. Note down the Database Name, Username, and Password.
3. Open `core/.env` on the server and update these lines:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database_name
   DB_USERNAME=your_database_user
   DB_PASSWORD=your_database_password
   ```
4. Change `APP_ENV=production` and `APP_DEBUG=false`.
5. Update `APP_URL=https://yourdomain.com`.

### Step C: Run Migrations
Use Hostinger's Terminal (SSH) or a cron job to run:
```bash
php artisan migrate --force
```

### Step D: Storage Link
Since we moved the `public` folder, you need to ensure the storage link works. Run:
```bash
php artisan storage:link
```
If you don't have SSH access, create a route in `web.php` temporarily:
```php
Route::get('/link-storage', function () {
    Artisan::call('storage:link');
});
```
Then visit `yourdomain.com/link-storage`.

---

## 2. Deploying the Admin Dashboard (Next.js)

### Option 1: Hostinger Node.js Hosting (Recommended)
If your Hostinger plan supports Node.js:
1. Upload the `admin/` folder.
2. In Hostinger Panel, go to **Node.js** and set up the application.
3. Set the "Entry File" to `index.js` (after building) or use a custom script.
4. Make sure to set environment variables in `.env.local` for the API URL pointing to your Laravel backend.

### Option 2: Subdomain (e.g., admin.yourdomain.com)
You can point a subdomain to the `admin` folder or a separate directory.

---

## 3. Important Logic Changes Made
- **index.php**: Updated to point to `../core/` for vendor and bootstrap.
- **bootstrap/app.php**: Added `$app->usePublicPath(...)` to ensure Laravel knows the new location of the public directory.

---
*Created by Antigravity AI*
