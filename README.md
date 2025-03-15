# 🎟️ Coupon Management System

A web application that enables users to **manage and claim coupons**, with a dedicated **Admin Dashboard** for better control. This system supports secure operations with cooldown prevention, session tracking, and basic authentication.

---

## ✨ Features

### 👤 **User Features**
- ✅ Claim available coupons
- 🔍 View list of available coupons
- ⏳ 24-hour cooldown for claiming coupons (prevents abuse)

### 🛠️ **Admin Features**
- ➕ Add new coupons  
- ✏️ Update coupon details (code, status)  
- ❌ Delete coupons  
- 📄 View all coupons and claims  
- 🗑️ Delete claim entries  

### 🔒 **Security**
- 🔐 Basic authentication for admin routes  
- 🕵️ Session tracking using IP & browser session

---

## 🧰 Technologies Used
- **Backend:** Node.js, Express.js  
- **Database:** MySQL  
- **Frontend:** EJS (Embedded JavaScript Templates)  
- **Middleware:** body-parser, cookie-parser, cors, express-basic-auth  
- **Database Connector:** MySQL2  

---

## ⚙️ Prerequisites
Ensure the following are installed:
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm (Node Package Manager)

---

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/coupon-management-system.git
cd coupon-management-system
