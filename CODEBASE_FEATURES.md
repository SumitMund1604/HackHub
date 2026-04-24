# HackHub - Codebase & Features

This document provides a detailed breakdown of the HackHub codebase and its implemented features.

---

## 1. Feature Breakdown

### 1.1 Authentication & Profile
- **Registration & Login:** Securely stores users using `bcryptjs` for password hashing.
- **Role-Based Access:** Distinguishes between `student`, `organizer`, and `admin`.
- **Skill Management:** Users can add and view skills on their profile, categorized by proficiency.

### 1.2 Hackathon Management
- **Hackathon Discovery:** Listing of all hackathons (Draft, Open, Closed, etc.).
- **Detail View:** Shows description, theme, registration deadlines, and evaluation criteria.
- **Status Lifecycle:** Tracks whether a hackathon is in registration, judging, or completed phase.

### 1.3 AI Pre-Assessment (NLP Engine)
This unique feature uses the internal `nlp.js` module to score project ideas instantly:
- **Innovation (30%):** Compares the idea to others in the same hackathon. Lower similarity scores higher for novelty.
- **Feasibility (25%):** Analyzes the tech stack and solution detail for technical viability.
- **Relevance (25%):** Checks how well the idea aligns with the hackathon's theme using cosine similarity.
- **Clarity (20%):** Uses readability heuristics to judge the structural quality of the proposal.

### 1.4 Team Collaboration
- **Team Dashboard:** Manage members, role assignments (Leader, Member), and active submissions.
- **Teammate Finder:** Search for users with complementary skills.
- **Join Requests:** Students can apply to join open teams directly from the UI.

### 1.5 Messaging & Notifications
- **Direct Messaging:** One-on-one communication between users.
- **Team Chat:** Shared messaging space for team members.
- **System Notifications:** Alerts for team invites, submission results, and hackathon updates.

---

## 2. Codebase Organization

### 2.1 Backend (`HackHub-Backend/`)
- `server.js`: The central Express.js entry point containing all REST API endpoints.
- `db.js`: PostgreSQL connection pool and configuration.
- `nlp.js`: Internal "AI" logic for scoring ideas without external APIs.
- `seed.sql`: Initial data to populate the database for testing.

### 2.2 Frontend (`HackHub-Frontend/`)
- `index.html`: Main landing page.
- `dashboard.html`: Personalized student view with stats and active hackathons.
- `results.html`: Dynamic page that visualizes AI evaluation results.
- `style.css`: Modern SaaS-style stylesheet (No frameworks used).
- `script.js`: Global frontend logic for API calls, authentication, and DOM updates.

---

## 3. Database Schema Highlights

The system follows a relational model in PostgreSQL:
- `users`: Core user data and global points.
- `hackathons`: Event data and registration limits.
- `submissions`: Project ideas and final project URLs.
- `ai_evaluations`: Detailed breakdown of scores and feedback for each submission.
- `teams` & `team_members`: Mappings for collaborative participation.

---

## 4. Key Implementation Details

### NLP Scoring Logic (`nlp.js`)
Instead of heavy Python libraries, it uses:
- **`Set` & `Object`:** For fast word frequency counting.
- **`Math.sqrt` & `dotProduct`:** For calculating Cosine Similarity.
- **`Set` of Stop Words:** To filter out common words like "the", "and", "is".

### UI Responsiveness (`style.css`)
- Uses **CSS Grid** for the dashboard layout.
- Uses **Flexbox** for navbars, cards, and button groups.
- Mobile-first approach for responsive scaling on tablets and phones.
