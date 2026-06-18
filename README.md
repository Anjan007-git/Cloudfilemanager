# ☁️ CloudFile Manager

A modern cloud storage and file management platform that enables users to securely upload, organize, preview, download, and manage files from anywhere.

Built with a production-style architecture using React, TypeScript, Firebase Authentication, AWS S3, Firestore, Railway, and Vercel.

---

## 🚀 Live Features

### Secure Authentication

* Google Sign-In
* Email & Password Authentication
* Email Verification Workflow
* Session Management
* Protected Routes

### Cloud Storage

* Upload Files
* Download Files
* File Preview
* Folder Organization
* File Management Dashboard
* Storage Usage Tracking

### Storage Management

* Free Plan Storage Limits
* Dynamic Usage Calculation
* Storage Analytics
* Upgrade Flow
* Subscription Vault

### User Experience

* Real-Time Dashboard
* Responsive Design
* Modern SaaS Interface
* Notification Center
* Search & Navigation

---

## 🏗 Architecture

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS

Authentication:

* Firebase Authentication

Database:

* Firestore

Storage:

* AWS S3

Backend:

* Node.js
* Express
* Railway

Deployment:

* Vercel

---

## 🔄 System Flow

User Login
↓
Firebase Authentication
↓
JWT Verification
↓
Railway Backend
↓
Firestore Metadata
↓
AWS S3 File Storage
↓
Dashboard & Analytics

---

## 🔒 Security Features

* User Isolation
* Protected API Endpoints
* Firebase Authentication
* Token Verification
* Storage Quota Enforcement
* Secure File Access
* Per-User Data Segregation

---

## 💡 Real Problems Solved

### 1. Cloud Storage Cost Control

Problem:
Providing large free storage allowances can create significant cloud infrastructure costs.

Solution:
Implemented plan-based storage limits with upload validation before storage allocation.

Result:
Prevents unnecessary AWS S3 storage consumption and enables scalable subscription models.

---

### 2. Cross-Account Notification Leakage

Problem:
Notifications created by one user appeared in another user's session.

Solution:
Implemented user-scoped notification ownership and state cleanup on account changes.

Result:
Complete account isolation and secure multi-user experience.

---

### 3. Authentication State Race Conditions

Problem:
Firestore profile reads failed during login due to authentication state timing conflicts.

Solution:
Refactored authentication synchronization and profile initialization workflows.

Result:
Stable login experience with proper user state management.

---

### 4. Firestore Quota Exhaustion Investigation

Problem:
Unexpected Firestore read spikes caused application instability.

Solution:
Performed deep debugging of synchronization loops, dependency tracking, and real-time listeners.

Result:
Eliminated unnecessary database operations and improved application efficiency.

---

### 5. Secure File Storage Architecture

Problem:
Need secure file storage while maintaining scalable cloud infrastructure.

Solution:
Separated file binaries and metadata.

AWS S3:
Stores file content.

Firestore:
Stores file metadata and ownership information.

Result:
Improved scalability and maintainability.

---

## 📊 Technical Highlights

* Cloud-Native Architecture
* Multi-Service Integration
* Authentication & Authorization
* Storage Quota Enforcement
* AWS S3 Integration
* REST API Development
* Firestore Data Modeling
* Real-Time State Management
* SaaS Dashboard Design
* Production Deployment Pipeline

---

## 📸 Screenshots

Add screenshots here:

### Dashboard

![Dashboard](https://raw.githubusercontent.com/Anjan007-git/Cloudfilemanager/9cd54daa2a5204b4931065036ed88eaa1ffa8b46/Screenshot%202026-06-19%20002959.png)

### File Manager

![Files](screenshots/files.png)

### Upload Workflow

![Upload](screenshots/upload.png)

### Subscription Vault

![Subscription](screenshots/subscription.png)

---

## 🎯 Future Roadmap

* File Sharing Links
* Team Workspaces
* Role-Based Access Control
* Activity Logs
* File Versioning
* AI File Search
* Advanced Analytics
* Mobile Application

---

## 👨‍💻 Developer

Developed by Anjan Prajapati

Cloud & Data Engineering Student

Passionate about Cloud Computing, Full-Stack Development, Data Engineering, and AI-Powered Applications.

LinkedIn: [Your LinkedIn]
Portfolio: [Your Portfolio]
GitHub: [Your GitHub]

---

⭐ If you found this project interesting, consider giving it a star.
