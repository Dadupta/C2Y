# 🔥 Firebase Setup for C2Y Tool

Follow these steps to connect your C2Y project to Firebase:

---

## 1️⃣ Create Firebase Project

- Go to [https://console.firebase.google.com](https://console.firebase.google.com)
- Click **Add Project**
- Name it something like `c2y-tool`
- Disable Analytics (optional)
- Finish setup

---

## 2️⃣ Enable Firestore

- In the Firebase Console, go to **Firestore Database**
- Click **Create Database**
- Start in **Test Mode** (or apply rules below)
- Copy the rules from `firestore.rules`

---

## 3️⃣ Enable Google Sign-In

- Go to **Authentication > Sign-in Method**
- Enable **Google**
- Add your app domain (e.g., localhost or your hosted URL)

---

## 4️⃣ Add a Web App

- In Firebase Console, go to **Project Settings > General**
- Scroll to **Your apps** → click `</>` (Web)
- Name it: `C2Y App`
- Register (no hosting needed)
- Copy the config and paste it into `public/firebaseConfig.js`

---

## 5️⃣ Deploy

You can now host the `/public` folder using:
- Netlify
- Vercel
- GitHub Pages (with minor tweaks)

---

## ✅ Firestore Structure

