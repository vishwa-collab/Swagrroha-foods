# 📱 PJR Swagruha Foods — Android Mobile App Guide

Your web application has been converted into a **native Android app** using **Capacitor**!

---

## 🛠️ What has been configured:

1. **Capacitor Configuration**: [`capacitor.config.ts`](file:///c:/Users/user/Desktop/Swagrroha%20foods/frontend/capacitor.config.ts)
   - **App Name**: `PJR Swagruha Foods`
   - **App ID (Package)**: `com.pjrswagrooha.foods`
   - **Web Assets Directory**: `frontend/dist`
2. **Native Android Project**: [`frontend/android/`](file:///c:/Users/user/Desktop/Swagrroha%20foods/frontend/android/)
   - Fully generated Android project ready to open in Android Studio.
   - Configured with Internet permissions, app labels, and icons.
3. **Automated NPM Scripts**: In [`frontend/package.json`](file:///c:/Users/user/Desktop/Swagrroha%20foods/frontend/package.json):
   - `npm run cap:build` : Rebuilds the frontend & syncs code to the Android app.
   - `npm run cap:sync`  : Copies new frontend changes to the Android app.
   - `npm run cap:open`  : Opens the Android project directly in **Android Studio**.

---

## 🚀 How to generate your `.apk` file:

### Method 1: Using Android Studio (Recommended & Easiest)

1. **Install Android Studio** (if you don't already have it):
   - Download for free from: [developer.android.com/studio](https://developer.android.com/studio)
2. In terminal, run:
   ```bash
   cd "frontend"
   npm run cap:open
   ```
   *(Or open Android Studio, click **Open**, and select the folder `c:\Users\user\Desktop\Swagrroha foods\frontend\android`)*
3. Wait 1–2 minutes for Gradle to index the project.
4. **Generate APK**:
   - In the top menu, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - Once finished, click **locate** in the popup notification to get your `app-debug.apk`.
   - Send this `.apk` to your phone via WhatsApp or USB and tap to install! 📲

---

### Method 2: Whenever you make changes to the website

Whenever you change menu items, prices, or designs in the web app:
```bash
cd "frontend"
npm run cap:build
```
This automatically compiles your latest web changes and updates the Android project!
