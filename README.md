# ₹ PayBuddy — Expense Tracker & Bill Splitter 💸

A sleek, modern, dark-mode financial companion built for tracking personal expenses and settling balances with friends seamlessly. Designed with a mobile-first philosophy for a lightning-fast native app-like experience.

---

## 🚀 Live Demo & Deployment

- **Live Web App:** [https://paybuddy-app.vercel.app](https://paybuddy-app.vercel.app) *(or your deployed Vercel / Netlify / GitHub Pages link)*
- **GitHub Repository:** [https://github.com/KabileshK023/PAYBUDDY](https://github.com/KabileshK023/PAYBUDDY)

---

## ✨ Features

- 👥 **Friends Balance Manager:** Split bills, track who owes who, record "I Paid" and "Friend Paid", and settle up easily.
- 📊 **Daily & Period Expense Tracker:** Keep track of your daily expenses with breakdown periods (**W**eek, **M**onth, **Y**ear) and auto-categorized emojis.
- 📱 **Mobile-First Experience:** 
  - Safe-area inset support for notch and home bar displays.
  - Native touch feedback and 48px+ touch targets.
  - Smooth gradients, glassmorphism headers, and sleek dark aesthetic.
  - Prevents auto-zoom on mobile inputs.
- ⚡ **Lightning Fast:** Built on React 19 and Vite with zero lag and offline persistence via `localStorage`.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, JavaScript (ES6+)
- **Styling:** Custom CSS3 Design System (Glassmorphism, Vibrant Gradients, Safe Area Insets)
- **Bundler:** Vite
- **Database:** MongoDB Atlas (via Vercel Serverless Functions) & LocalStorage Cache fallback
- **Hosting:** Vercel

---

## 📦 How to Deploy on Vercel with MongoDB

1. Push your repository to GitHub: `https://github.com/KabileshK023/PAYBUDDY`
2. Go to **[Vercel](https://vercel.com)** and click **"Add New Project"**.
3. Import the **`PAYBUDDY`** repository.
4. Under **Environment Variables**, add:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://k75359023_db_user:ff2CQ5XzlJg8rANw@cluster0.8f4zm7k.mongodb.net/paybuddy?retryWrites=true&w=majority&appName=Cluster0`
5. Click **Deploy**. Vercel will build and provide your live link!

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/KabileshK023/PAYBUDDY.git

# Navigate into project directory
cd PAYBUDDY

# Install dependencies
npm install

# Start local dev server
npm run dev
```

