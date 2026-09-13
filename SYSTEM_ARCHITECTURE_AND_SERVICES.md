# 📜 PJR Swagrooha Foods — Complete Tech Stack, Services & Credentials Guide
> **Save this document for future reference, maintenance, and website management.**

---

## 🌐 1. Hosting, Domains & Infrastructure

| Service | Platform / Provider | URL / Dashboard | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Website** | **Vercel** | [vercel.com](https://vercel.com) | Hosts the React + Vite frontend application. Automatically redeploys whenever changes are pushed to GitHub `main` branch. |
| **Live Custom Domain** | **Custom Domain DNS** | `https://pjrswagrooha.in` | The official customer-facing website domain with SSL encryption. |
| **Backend API Server** | **Render** | [dashboard.render.com](https://dashboard.render.com) | Hosts the Node.js / Express backend server (`https://swagrroha-foods.onrender.com`). |
| **Source Code Repository** | **GitHub** | [github.com/vishwa-collab/Swagrroha-foods](https://github.com/vishwa-collab/Swagrroha-foods) | All code is version-controlled on the `main` branch. |

---

## 🗄️ 2. Database (MongoDB Atlas)

* **Provider**: [MongoDB Atlas](https://cloud.mongodb.com)
* **Cluster Name**: `Cluster0`
* **Database Name**: `swagrooha`
* **Collection**: `orders`
* **Purpose**: Stores all customer orders, item breakdowns, payment statuses, delivery stages, and customer review ratings.
* **Connection String**: Saved securely in `backend/server/.env` under `MONGODB_URI`.

---

## 💬 3. WhatsApp Messaging & Notifications

* **Provider**: **Meta WhatsApp Cloud API** (Facebook Developers)
* **Dashboard**: [business.facebook.com](https://business.facebook.com) / [developers.facebook.com](https://developers.facebook.com)
* **WhatsApp App Name**: `PJR Swagruha Foods`
* **Phone Number ID**: `1373522895833900`
* **System User**: `swagroohabot` (Role: Admin)
* **Token Type**: **Permanent System User Access Token** (`Never` expires)
* **Permissions Granted**: `whatsapp_business_messaging`, `whatsapp_business_management`
* **Owner Notification Number**: `+91 8125154114`
* **Alternative / Fallback Providers Supported in Code**:
  * **UltraMsg** ([ultramsg.com](https://ultramsg.com)) — QR-code based, zero-template restriction fallback.
  * **Twilio WhatsApp API** ([twilio.com](https://twilio.com)).

---

## 💳 4. Payment Gateway (Razorpay & UPI)

### A. Razorpay Payment Gateway
* **Provider**: [Razorpay](https://dashboard.razorpay.com)
* **Account**: Live Production Mode
* **Supported Methods**: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards, Net Banking.
* **Security**: Backend generates order IDs and performs cryptographic HMAC-SHA256 signature verification before confirming any order.

### B. Direct UPI & QR Code
* **Payee UPI ID**: `8125154114@ybl` (PJR Swagruha Foods)
* **Payee Name**: PJR Swagruha Foods / Vishwa
* **Dynamic QR Generator**: Generates instant QR codes pre-filled with the exact order grand total. Customers can download the QR to their phone gallery to pay via PhonePe / GPay.

---

## ✉️ 5. Email Receipts (Gmail SMTP)

* **Provider**: Google Gmail SMTP Server (`smtp.gmail.com`, Port 465 SSL)
* **Sender Email**: `vishwa81251@gmail.com`
* **Authentication**: Google App Password (16-character application-specific password created under Google Account Security).
* **Purpose**: Sends branded HTML order confirmation receipts and delivery notification emails with full order itemization to customers.

---

## 💻 6. Frontend Libraries & Technologies

| Tool / Library | Package Name | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | `react` (v18) + `typescript` | High-performance user interface with full type safety. |
| **Build Tool** | `vite` (v6) | Ultra-fast development server and optimized production bundler. |
| **Styling** | `tailwindcss` (v3) + `postcss` | Custom responsive design system with mobile-first layout. |
| **PDF Invoice Generator** | `jspdf` | **Generates downloadable PDF invoices** directly inside the customer's browser upon order confirmation. |
| **Icons** | `lucide-react` | Lightweight vector icons across the entire website. |
| **Celebration Confetti** | `canvas-confetti` | Confetti fireworks animation on successful payment confirmation. |
| **Screenshot Renderer** | `html2canvas` | Used for payment screenshot verification tools. |

---

## 🔐 7. Admin & Owner Control Panel

* **Web Access URL**: `https://pjrswagrooha.in/?admin`
* **Secret Keyboard Shortcut**: Press `Ctrl + Shift + A` on the website from any page.
* **Admin Email**: `vishwa81251@gmail.com`
* **Admin Features**:
  * Live sound chime alerts when new orders arrive.
  * Move orders through the 5 preparation stages (Placed &rarr; Confirmed &rarr; Preparing &rarr; Out for Delivery &rarr; Delivered).
  * Auto-send WhatsApp & Email delivery confirmation to the customer with 1 click.
  * View uploaded payment screenshot proofs.
  * View total revenue analytics, active orders, and customer ratings.

---

## 📍 8. Google Search Console & Maps (SEO & Discovery)

* **Google Search Console**: 
  * **Purpose**: Used for tracking website search performance, submitting sitemaps (`/sitemap.xml`), and ensuring the site is indexed on Google Search.
  * **Verification**: Verified via `google-site-verification` meta tag in the frontend `index.html`.
  * **Dashboard**: [search.google.com/search-console](https://search.google.com/search-console)
* **Google Business Profile (Google Maps)**:
  * **Purpose**: Manages the physical location and business listing of PJR Swagruha Foods on Google Maps. Allows customers to find the store, leave reviews, and get directions.
  * **Dashboard**: [business.google.com](https://business.google.com)
* **Structured Data (SEO)**: The website uses JSON-LD schema markup (`FoodEstablishment`) to provide rich search results (like location, cuisine, and alternative names) directly in Google Search and Maps.
