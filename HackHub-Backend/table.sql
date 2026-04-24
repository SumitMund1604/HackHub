-- USERS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    college TEXT,
    department TEXT,
    year_of_study INT,
    role TEXT DEFAULT 'student',
    bio TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKILLS
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name TEXT UNIQUE,
    category TEXT
);

-- USER SKILLS
CREATE TABLE user_skills (
    user_skill_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    skill_id INT REFERENCES skills(skill_id),
    proficiency TEXT DEFAULT 'intermediate',
    UNIQUE(user_id, skill_id)
);

-- HACKATHONS
CREATE TABLE hackathons (
    hackathon_id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    theme TEXT,
    organizer_id INT REFERENCES users(user_id),
    max_participants INT,
    max_team_size INT DEFAULT 4,
    min_team_size INT DEFAULT 1,
    registration_start DATE,
    registration_end DATE,
    event_start DATE,
    event_end DATE,
    status TEXT DEFAULT 'draft',
    requires_preassessment BOOLEAN DEFAULT false,
    venue TEXT,
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EVALUATION CRITERIA
CREATE TABLE evaluation_criteria (
    criteria_id SERIAL PRIMARY KEY,
    hackathon_id INT REFERENCES hackathons(hackathon_id),
    criteria_name TEXT,
    weight FLOAT,
    description TEXT
);

-- TEAMS
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_name TEXT,
    hackathon_id INT REFERENCES hackathons(hackathon_id),
    leader_id INT REFERENCES users(user_id),
    description TEXT,
    looking_for TEXT,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_name, hackathon_id)
);

-- TEAM MEMBERS
CREATE TABLE team_members (
    team_member_id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(team_id),
    user_id INT REFERENCES users(user_id),
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- SUBMISSIONS
CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    hackathon_id INT REFERENCES hackathons(hackathon_id),
    user_id INT REFERENCES users(user_id),
    team_id INT REFERENCES teams(team_id),
    title TEXT,
    idea_description TEXT,
    problem_statement TEXT,
    proposed_solution TEXT,
    tech_stack TEXT,
    repo_url TEXT,
    demo_url TEXT,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI EVALUATIONS
CREATE TABLE ai_evaluations (
    evaluation_id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(submission_id),
    innovation_score FLOAT,
    feasibility_score FLOAT,
    relevance_score FLOAT,
    clarity_score FLOAT,
    overall_score FLOAT,
    ai_feedback TEXT,
    model_version TEXT DEFAULT 'hackhub-nlp-node-v1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MESSAGES
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(user_id),
    receiver_id INT REFERENCES users(user_id),
    team_id INT REFERENCES teams(team_id),
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MEETINGS
CREATE TABLE meetings (
    meeting_id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    organizer_id INT REFERENCES users(user_id),
    team_id INT REFERENCES teams(team_id),
    hackathon_id INT REFERENCES hackathons(hackathon_id),
    meeting_time TIMESTAMP,
    duration_mins INT DEFAULT 30,
    meeting_link TEXT,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MEETING ATTENDEES
CREATE TABLE meeting_attendees (
    attendee_id SERIAL PRIMARY KEY,
    meeting_id INT REFERENCES meetings(meeting_id),
    user_id INT REFERENCES users(user_id),
    UNIQUE(meeting_id, user_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    type TEXT,
    title TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LEADERBOARD
CREATE TABLE leaderboard_entries (
    entry_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    hackathon_id INT REFERENCES hackathons(hackathon_id),
    points INT DEFAULT 0,
    rank INT,
    badges TEXT
);

-- TEAMMATE RECOMMENDATIONS
CREATE TABLE teammate_recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    recommended_id INT REFERENCES users(user_id),
    hackathon_id INT REFERENCES hackathons(hackathon_id),
    match_score FLOAT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);