-- ============================================================
-- SEED DATA FOR HACKHUB
-- Run after schema is created: psql -d hackhub -f seed.sql
-- ============================================================

-- Users (passwords are bcrypt hash of "password123")
INSERT INTO users (full_name, username, email, password_hash, college, department, year_of_study, role, bio, github_url, linkedin_url, portfolio_url, points, is_active) VALUES
('Sumit Mund', 'sumitmund', 'sumit@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'XYZ Engineering College', 'Computer Science', 3, 'student', 'Full-stack developer passionate about building impactful solutions.', 'https://github.com/sumitmund', 'https://linkedin.com/in/sumitmund', NULL, 450, true),
('Ankit Patel', 'ankitpatel', 'ankit@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'XYZ Engineering College', 'Computer Science', 3, 'student', 'Backend developer with Python and Django experience.', 'https://github.com/ankitpatel', NULL, NULL, 380, true),
('Prof. Rajesh Kumar', 'profrajesh', 'rajesh@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'XYZ Engineering College', 'Computer Science', NULL, 'organizer', 'Professor and hackathon organizer.', NULL, NULL, NULL, 0, true),
('Priya Singh', 'priyasingh', 'priya@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'ABC College', 'Information Technology', 2, 'student', 'ML/AI enthusiast with TensorFlow experience.', NULL, NULL, NULL, 320, true),
('Vikram Reddy', 'vikramreddy', 'vikram@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'IIT Delhi', 'Computer Science', 4, 'student', 'Competitive programmer and full-stack developer.', NULL, NULL, NULL, 720, true),
('Meera Joshi', 'meerajoshi', 'meera@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'NIT Trichy', 'Computer Science', 3, 'student', 'Data science and AI researcher.', NULL, NULL, NULL, 650, true),
('Karan Shah', 'karanshah', 'karan@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'BITS Pilani', 'Electronics', 4, 'student', 'IoT and embedded systems enthusiast.', NULL, NULL, NULL, 580, true),
('Rohan Kumar', 'rohankumar', 'rohan@email.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'XYZ Engineering College', 'Computer Science', 3, 'student', 'DevOps and Docker enthusiast.', NULL, NULL, NULL, 350, true),
('Admin User', 'admin', 'admin@hackhub.com', '$2a$10$LbMKR1YGe0KBHP1sZEbzPObqxRcVjZCdWwJKqRhORjm6y1VHqE2VK', 'HackHub', 'Administration', NULL, 'admin', 'System administrator.', NULL, NULL, NULL, 0, true);

-- Skills
INSERT INTO skills (skill_name, category) VALUES
('Java', 'language'), ('Python', 'language'), ('JavaScript', 'language'), ('C++', 'language'),
('React', 'framework'), ('Django', 'framework'), ('Node.js', 'framework'), ('Flask', 'framework'),
('PostgreSQL', 'tool'), ('Docker', 'tool'), ('Git', 'tool'), ('TensorFlow', 'framework'),
('Machine Learning', 'domain'), ('DevOps', 'domain'), ('UI/UX Design', 'domain');

-- User Skills
INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES
(1, 1, 'advanced'), (1, 2, 'intermediate'), (1, 5, 'intermediate'), (1, 9, 'beginner'), (1, 11, 'expert'),
(2, 2, 'advanced'), (2, 6, 'advanced'), (2, 9, 'intermediate'),
(4, 2, 'advanced'), (4, 12, 'intermediate'), (4, 13, 'advanced'),
(8, 10, 'advanced'), (8, 14, 'advanced');

-- Hackathons
INSERT INTO hackathons (title, description, theme, organizer_id, max_participants, max_team_size, min_team_size, registration_start, registration_end, event_start, event_end, status, requires_preassessment, venue, is_online) VALUES
('FinTech Challenge 2026', 'Build innovative solutions that address real-world financial challenges.', 'Financial Innovation', 3, 200, 4, 2, '2026-04-01', '2026-05-10', '2026-05-15', '2026-05-17', 'open', true, 'Online (Hybrid)', true),
('AI/ML Hackathon', 'Explore artificial intelligence and machine learning solutions.', 'Artificial Intelligence', 3, 150, 4, 2, '2026-05-01', '2026-05-25', '2026-06-01', '2026-06-03', 'open', false, 'Campus Hall', false),
('Web Dev Sprint', 'Build modern web applications using cutting-edge technologies.', 'Web Technologies', 3, 100, 4, 1, '2026-06-01', '2026-07-05', '2026-07-10', '2026-07-12', 'draft', false, 'Online', true),
('Green Tech Hack', 'Create sustainability-focused technology solutions.', 'Sustainability', 3, 120, 4, 2, '2026-07-01', '2026-08-01', '2026-08-05', '2026-08-07', 'draft', false, 'TBD', false),
('HealthCare Innovation', 'Build healthcare technology solutions.', 'Healthcare', 3, 200, 4, 2, '2026-01-15', '2026-02-15', '2026-03-01', '2026-03-03', 'completed', true, 'Main Auditorium', false),
('Cybersecurity CTF', 'Capture the flag cybersecurity challenge.', 'Cybersecurity', 3, 100, 3, 1, '2026-03-15', '2026-04-15', '2026-04-20', '2026-04-22', 'in_progress', false, 'Lab Building', false);

-- Evaluation Criteria for FinTech Challenge
INSERT INTO evaluation_criteria (hackathon_id, criteria_name, weight, description) VALUES
(1, 'Innovation', 0.30, 'Uniqueness and creativity of the idea'),
(1, 'Feasibility', 0.25, 'Technical viability and realistic scope'),
(1, 'Relevance', 0.25, 'Alignment with the FinTech theme'),
(1, 'Clarity', 0.20, 'Quality of problem statement and solution description');

-- Teams
INSERT INTO teams (team_name, hackathon_id, leader_id, description, looking_for, is_open) VALUES
('CodeCrafters', 1, 1, 'Building a smart budget tracking app for students.', 'Looking for a UI/UX designer', true),
('BlockChain Boys', 1, 7, 'Crypto portfolio management tool.', 'Need a frontend developer', true),
('FinWiz', 1, 5, 'Student loan calculator and advisor.', NULL, false);

-- Team Members
INSERT INTO team_members (team_id, user_id, role) VALUES
(1, 1, 'leader'), (1, 2, 'member'), (1, 8, 'member'),
(2, 7, 'leader'), (2, 6, 'member'),
(3, 5, 'leader'), (3, 4, 'member');

-- Submissions
INSERT INTO submissions (hackathon_id, user_id, team_id, title, idea_description, problem_statement, proposed_solution, tech_stack, repo_url, demo_url, status) VALUES
(1, 1, 1, 'Smart Budget Tracker', 'An AI-powered budget tracking app for college students.', 'Students struggle to manage finances.', 'AI-based expense categorization and budget recommendations.', 'React, Node.js, PostgreSQL, Python', 'https://github.com/sumitmund/smart-budget', NULL, 'shortlisted'),
(1, 7, 2, 'Crypto Portfolio Manager', 'Manage and track crypto investments in one dashboard.', 'Crypto investors lack unified tools.', 'Aggregated portfolio view with real-time price tracking.', 'React, Web3.js, Node.js', NULL, NULL, 'under_review'),
(1, 5, 3, 'Student Loan Calculator', 'Compare and calculate student loan options.', 'Students confused by loan options.', 'Comparison engine with EMI calculator.', 'Python, Flask, PostgreSQL', NULL, NULL, 'rejected');

-- AI Evaluations
INSERT INTO ai_evaluations (submission_id, innovation_score, feasibility_score, relevance_score, clarity_score, overall_score, ai_feedback, model_version) VALUES
(1, 8.2, 7.5, 8.0, 7.5, 7.8, 'Strong idea with clear problem-solution fit. AI categorization is innovative. Consider adding gamification for student engagement.', 'hackhub-nlp-node-v1.0'),
(2, 7.0, 6.5, 7.0, 5.5, 6.5, 'Decent concept but market is crowded. Need more differentiation from existing portfolio trackers.', 'hackhub-nlp-node-v1.0'),
(3, 5.5, 6.0, 5.0, 5.2, 5.2, 'Basic concept with limited innovation. Similar tools already exist. Needs stronger unique value proposition.', 'hackhub-nlp-node-v1.0');

-- Messages
INSERT INTO messages (sender_id, receiver_id, team_id, content, is_read) VALUES
(2, 1, NULL, 'Hey! I saw your team CodeCrafters is looking for a Python developer.', false),
(3, 1, NULL, 'Your idea has been shortlisted. Congratulations!', false),
(4, 1, NULL, 'Thanks for the invite! Let me think about it.', true);

-- Notifications for Sumit
INSERT INTO notifications (user_id, type, title, message, link, is_read) VALUES
(1, 'hackathon_update', 'Registration Closing Soon', 'FinTech Challenge 2026 - Registration closing in 2 days!', '/hackathon-detail.html?id=1', false),
(1, 'submission_result', 'Idea Shortlisted', 'Your idea "Smart Budget Tracker" scored 7.8/10 - Shortlisted!', '/results.html?id=1', false),
(1, 'team_request', 'Join Request', 'Rahul Sharma wants to join your team "CodeCrafters"', '/team-dashboard.html?id=1', false);

-- Leaderboard Entries
INSERT INTO leaderboard_entries (user_id, hackathon_id, points, rank, badges) VALUES
(5, NULL, 720, 1, '["champion"]'), (6, NULL, 650, 2, '["innovator"]'), (7, NULL, 580, 3, '["top_idea"]'),
(1, NULL, 450, 12, '["rising_star"]'), (2, NULL, 380, 15, NULL);

-- Teammate Recommendations for Sumit
INSERT INTO teammate_recommendations (user_id, recommended_id, hackathon_id, match_score, reason) VALUES
(1, 2, 1, 0.92, 'Complementary skills in Python and Django. Same college.'),
(1, 4, 1, 0.87, 'Strong ML/AI skills would complement your full-stack abilities.'),
(1, 8, 1, 0.84, 'DevOps and Docker expertise would strengthen deployment capabilities.');

-- Meetings
INSERT INTO meetings (title, description, organizer_id, team_id, hackathon_id, meeting_time, duration_mins, meeting_link, location) VALUES
('Sprint Planning', 'Plan tasks for week 1 of hackathon.', 1, 1, 1, '2026-04-20 18:00:00', 60, 'https://meet.google.com/abc-defg-hij', NULL),
('Design Review', 'Review wireframes and UI mockups.', 1, 1, 1, '2026-04-22 19:30:00', 45, 'https://meet.google.com/xyz-uvwx-rst', NULL);
