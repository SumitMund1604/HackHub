const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const nlp = require('./nlp');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ==================== AUTH ====================

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, username, email, password, college, department, year_of_study, role } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (full_name, username, email, password_hash, college, department, year_of_study, role)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING user_id, full_name, username, email, role`,
            [full_name, username, email, hash, college, department, year_of_study, role || 'student']
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ success: false, message: 'Email or username already exists' });
        res.status(500).json({ success: false, message: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is deactivated' });
        const { password_hash, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== USERS ====================

// Get user profile
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT user_id, full_name, username, email, role, college, department, year_of_study, bio, github_url, linkedin_url, portfolio_url, points, is_active, created_at FROM users WHERE user_id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        // Get skills
        const skills = await pool.query(
            'SELECT s.skill_name, s.category, us.proficiency FROM user_skills us JOIN skills s ON us.skill_id = s.skill_id WHERE us.user_id = $1',
            [req.params.id]
        );
        res.json({ success: true, user: result.rows[0], skills: skills.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const { full_name, username, college, department, year_of_study, bio, github_url, linkedin_url, portfolio_url } = req.body;
        const result = await pool.query(
            `UPDATE users SET full_name=$1, username=$2, college=$3, department=$4, year_of_study=$5, bio=$6, github_url=$7, linkedin_url=$8, portfolio_url=$9, updated_at=CURRENT_TIMESTAMP
             WHERE user_id=$10 RETURNING user_id, full_name, username, email, role`,
            [full_name, username, college, department, year_of_study, bio, github_url, linkedin_url, portfolio_url, req.params.id]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// List all users (admin)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Toggle user active status (admin)
app.put('/api/users/:id/toggle', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING user_id, full_name, is_active',
            [req.params.id]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== SKILLS ====================

// Add skill to user
app.post('/api/users/:id/skills', async (req, res) => {
    try {
        const { skill_name, category, proficiency } = req.body;
        let skill = await pool.query('SELECT skill_id FROM skills WHERE skill_name = $1', [skill_name]);
        if (skill.rows.length === 0) {
            skill = await pool.query('INSERT INTO skills (skill_name, category) VALUES ($1,$2) RETURNING skill_id', [skill_name, category || 'tool']);
        }
        await pool.query(
            'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ($1,$2,$3) ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency=$3',
            [req.params.id, skill.rows[0].skill_id, proficiency || 'intermediate']
        );
        res.json({ success: true, message: 'Skill added' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== HACKATHONS ====================

// List hackathons
app.get('/api/hackathons', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM hackathons ORDER BY event_start DESC');
        res.json({ success: true, hackathons: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get hackathon detail
app.get('/api/hackathons/:id', async (req, res) => {
    try {
        const hack = await pool.query('SELECT * FROM hackathons WHERE hackathon_id = $1', [req.params.id]);
        if (hack.rows.length === 0) return res.status(404).json({ success: false, message: 'Hackathon not found' });
        const criteria = await pool.query('SELECT * FROM evaluation_criteria WHERE hackathon_id = $1', [req.params.id]);
        const teamCount = await pool.query('SELECT COUNT(*) as count FROM teams WHERE hackathon_id = $1', [req.params.id]);
        res.json({ success: true, hackathon: hack.rows[0], criteria: criteria.rows, team_count: teamCount.rows[0].count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create hackathon (organizer/admin)
app.post('/api/hackathons', async (req, res) => {
    try {
        const { title, description, theme, organizer_id, max_participants, max_team_size, min_team_size, registration_start, registration_end, event_start, event_end, status, requires_preassessment, venue, is_online } = req.body;
        const result = await pool.query(
            `INSERT INTO hackathons (title, description, theme, organizer_id, max_participants, max_team_size, min_team_size, registration_start, registration_end, event_start, event_end, status, requires_preassessment, venue, is_online)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
            [title, description, theme, organizer_id, max_participants, max_team_size || 4, min_team_size || 1, registration_start, registration_end, event_start, event_end, status || 'draft', requires_preassessment || false, venue, is_online || false]
        );
        res.status(201).json({ success: true, hackathon: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update hackathon status
app.put('/api/hackathons/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query('UPDATE hackathons SET status=$1 WHERE hackathon_id=$2 RETURNING *', [status, req.params.id]);
        res.json({ success: true, hackathon: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== TEAMS ====================

// Create team
app.post('/api/teams', async (req, res) => {
    try {
        const { team_name, hackathon_id, leader_id, description, looking_for, is_open } = req.body;
        const result = await pool.query(
            'INSERT INTO teams (team_name, hackathon_id, leader_id, description, looking_for, is_open) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [team_name, hackathon_id, leader_id, description, looking_for, is_open !== false]
        );
        // Add leader as team member
        await pool.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1,$2,$3)',
            [result.rows[0].team_id, leader_id, 'leader']
        );
        res.status(201).json({ success: true, team: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ success: false, message: 'Team name already taken for this hackathon' });
        res.status(500).json({ success: false, message: err.message });
    }
});

// List teams for a hackathon
app.get('/api/teams', async (req, res) => {
    try {
        const { hackathon_id } = req.query;
        let query = 'SELECT t.*, u.full_name as leader_name FROM teams t JOIN users u ON t.leader_id = u.user_id';
        let params = [];
        if (hackathon_id) { query += ' WHERE t.hackathon_id = $1'; params.push(hackathon_id); }
        query += ' ORDER BY t.created_at DESC';
        const result = await pool.query(query, params);
        res.json({ success: true, teams: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get team details with members
app.get('/api/teams/:id', async (req, res) => {
    try {
        const team = await pool.query('SELECT t.*, u.full_name as leader_name FROM teams t JOIN users u ON t.leader_id = u.user_id WHERE t.team_id = $1', [req.params.id]);
        if (team.rows.length === 0) return res.status(404).json({ success: false, message: 'Team not found' });
        const members = await pool.query(
            'SELECT tm.role, u.user_id, u.full_name, u.username, u.email FROM team_members tm JOIN users u ON tm.user_id = u.user_id WHERE tm.team_id = $1',
            [req.params.id]
        );
        res.json({ success: true, team: team.rows[0], members: members.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Join a team
app.post('/api/teams/:id/join', async (req, res) => {
    try {
        const { user_id } = req.body;
        await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1,$2,$3)', [req.params.id, user_id, 'member']);
        res.json({ success: true, message: 'Joined team successfully' });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ success: false, message: 'Already a member of this team' });
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== SUBMISSIONS ====================

// Submit an idea
app.post('/api/submissions', async (req, res) => {
    try {
        const { hackathon_id, user_id, team_id, title, idea_description, problem_statement, proposed_solution, tech_stack, repo_url, demo_url } = req.body;
        
        // 1. Insert submission
        const result = await pool.query(
            `INSERT INTO submissions (hackathon_id, user_id, team_id, title, idea_description, problem_statement, proposed_solution, tech_stack, repo_url, demo_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [hackathon_id, user_id, team_id, title, idea_description, problem_statement, proposed_solution, tech_stack, repo_url, demo_url]
        );
        const submission = result.rows[0];

        // 2. Award points
        if (user_id) {
            await pool.query('UPDATE users SET points = points + 15 WHERE user_id = $1', [user_id]);
        }

        // 3. Fetch past submissions for innovation scoring
        const pastSubsRes = await pool.query(
            "SELECT title, idea_description, proposed_solution FROM submissions WHERE hackathon_id = $1 AND submission_id != $2",
            [hackathon_id, submission.submission_id]
        );
        const pastSubmissionsText = pastSubsRes.rows.map(row => `${row.title || ''} ${row.idea_description || ''} ${row.proposed_solution || ''}`);

        // 4. Fetch hackathon theme for relevance scoring
        const hackRes = await pool.query("SELECT theme FROM hackathons WHERE hackathon_id = $1", [hackathon_id]);
        const theme = hackRes.rows.length > 0 ? hackRes.rows[0].theme : "";

        // 5. Run NLP Evaluation
        const evaluation = nlp.evaluateIdea(submission, pastSubmissionsText, theme);

        // 6. Insert AI Evaluation
        await pool.query(
            `INSERT INTO ai_evaluations (submission_id, innovation_score, feasibility_score, relevance_score, clarity_score, overall_score, ai_feedback, model_version)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                submission.submission_id,
                evaluation.innovation_score,
                evaluation.feasibility_score,
                evaluation.relevance_score,
                evaluation.clarity_score,
                evaluation.overall_score,
                evaluation.feedback,
                'hackhub-nlp-node-v1.0'
            ]
        );

        res.status(201).json({ success: true, submission, evaluation });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// List submissions for a hackathon
app.get('/api/submissions', async (req, res) => {
    try {
        const { hackathon_id } = req.query;
        let query = `SELECT s.*, u.full_name as submitted_by_name, t.team_name,
                     ae.overall_score, ae.innovation_score, ae.feasibility_score, ae.relevance_score, ae.clarity_score, ae.ai_feedback
                     FROM submissions s
                     LEFT JOIN users u ON s.user_id = u.user_id
                     LEFT JOIN teams t ON s.team_id = t.team_id
                     LEFT JOIN ai_evaluations ae ON ae.submission_id = s.submission_id`;
        let params = [];
        if (hackathon_id) { query += ' WHERE s.hackathon_id = $1'; params.push(hackathon_id); }
        query += ' ORDER BY ae.overall_score DESC NULLS LAST';
        const result = await pool.query(query, params);
        res.json({ success: true, submissions: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get single submission with AI evaluation
app.get('/api/submissions/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.full_name as submitted_by_name, t.team_name,
             ae.overall_score, ae.innovation_score, ae.feasibility_score, ae.relevance_score, ae.clarity_score, ae.ai_feedback
             FROM submissions s
             LEFT JOIN users u ON s.user_id = u.user_id
             LEFT JOIN teams t ON s.team_id = t.team_id
             LEFT JOIN ai_evaluations ae ON ae.submission_id = s.submission_id
             WHERE s.submission_id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Submission not found' });
        res.json({ success: true, submission: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== LEADERBOARD ====================

app.get('/api/leaderboard', async (req, res) => {
    try {
        const { hackathon_id } = req.query;
        let query, params = [];
        if (hackathon_id) {
            query = `SELECT le.*, u.full_name, u.username, u.college
                     FROM leaderboard_entries le JOIN users u ON le.user_id = u.user_id
                     WHERE le.hackathon_id = $1 ORDER BY le.points DESC`;
            params = [hackathon_id];
        } else {
            query = `SELECT u.user_id, u.full_name, u.username, u.college, u.points,
                     (SELECT COUNT(*) FROM submissions s JOIN ai_evaluations ae ON s.submission_id = ae.submission_id WHERE s.user_id = u.user_id) as hackathon_count
                     FROM users u WHERE u.is_active = true ORDER BY u.points DESC LIMIT 50`;
        }
        const result = await pool.query(query, params);
        res.json({ success: true, leaderboard: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== MESSAGES ====================

// Send message
app.post('/api/messages', async (req, res) => {
    try {
        const { sender_id, receiver_id, team_id, content } = req.body;
        const result = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, team_id, content) VALUES ($1,$2,$3,$4) RETURNING *',
            [sender_id, receiver_id, team_id, content]
        );
        res.status(201).json({ success: true, message: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get inbox
app.get('/api/messages/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.*, u.full_name as sender_name FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             WHERE m.receiver_id = $1 ORDER BY m.sent_at DESC`,
            [req.params.userId]
        );
        res.json({ success: true, messages: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Mark message as read
app.put('/api/messages/:id/read', async (req, res) => {
    try {
        await pool.query('UPDATE messages SET is_read = true WHERE message_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== MEETINGS ====================

// Schedule meeting
app.post('/api/meetings', async (req, res) => {
    try {
        const { title, description, organizer_id, team_id, hackathon_id, meeting_time, duration_mins, meeting_link, location } = req.body;
        const result = await pool.query(
            `INSERT INTO meetings (title, description, organizer_id, team_id, hackathon_id, meeting_time, duration_mins, meeting_link, location)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [title, description, organizer_id, team_id, hackathon_id, meeting_time, duration_mins || 30, meeting_link, location]
        );
        res.status(201).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get meetings for user
app.get('/api/meetings', async (req, res) => {
    try {
        const { user_id } = req.query;
        const result = await pool.query(
            `SELECT m.* FROM meetings m
             WHERE m.organizer_id = $1
             OR m.meeting_id IN (SELECT meeting_id FROM meeting_attendees WHERE user_id = $1)
             ORDER BY m.meeting_time DESC`,
            [user_id]
        );
        res.json({ success: true, meetings: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            [req.params.userId]
        );
        res.json({ success: true, notifications: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = true WHERE notification_id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== DASHBOARD ====================

app.get('/api/dashboard/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await pool.query('SELECT user_id, full_name, points FROM users WHERE user_id = $1', [userId]);
        if (user.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const rank = await pool.query('SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT points FROM users WHERE user_id = $1)', [userId]);
        const teams = await pool.query('SELECT COUNT(*) as count FROM team_members WHERE user_id = $1', [userId]);
        const submissions = await pool.query('SELECT COUNT(*) as count FROM submissions WHERE user_id = $1', [userId]);
        const notifications = await pool.query('SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC LIMIT 5', [userId]);
        const activeHackathons = await pool.query(
            `SELECT h.* FROM hackathons h
             JOIN teams t ON t.hackathon_id = h.hackathon_id
             JOIN team_members tm ON tm.team_id = t.team_id
             WHERE tm.user_id = $1 AND h.status IN ('open','in_progress') LIMIT 5`, [userId]
        );
        const recommendations = await pool.query(
            `SELECT tr.*, u.full_name, u.username FROM teammate_recommendations tr
             JOIN users u ON tr.recommended_id = u.user_id WHERE tr.user_id = $1 ORDER BY tr.match_score DESC LIMIT 3`, [userId]
        );

        res.json({
            success: true,
            dashboard: {
                user: user.rows[0],
                rank: parseInt(rank.rows[0].rank),
                team_count: parseInt(teams.rows[0].count),
                submission_count: parseInt(submissions.rows[0].count),
                notifications: notifications.rows,
                active_hackathons: activeHackathons.rows,
                recommendations: recommendations.rows
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== ADMIN STATS ====================

app.get('/api/admin/stats', async (req, res) => {
    try {
        const users = await pool.query('SELECT COUNT(*) as count FROM users');
        const hackathons = await pool.query('SELECT COUNT(*) as count FROM hackathons');
        const teams = await pool.query('SELECT COUNT(*) as count FROM teams');
        const submissions = await pool.query('SELECT COUNT(*) as count FROM submissions');
        const avgScore = await pool.query('SELECT COALESCE(AVG(overall_score), 0) as avg FROM ai_evaluations');
        res.json({
            success: true, stats: {
                total_users: parseInt(users.rows[0].count),
                total_hackathons: parseInt(hackathons.rows[0].count),
                total_teams: parseInt(teams.rows[0].count),
                total_submissions: parseInt(submissions.rows[0].count),
                avg_ai_score: parseFloat(avgScore.rows[0].avg).toFixed(1)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`HackHub Backend running on http://localhost:${PORT}`);
    console.log('API ready at http://localhost:' + PORT + '/api');
});
