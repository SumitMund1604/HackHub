// ===== HackHub - Frontend JS with Backend API =====

var API = 'http://localhost:3000/api';

function getUser() {
    var data = localStorage.getItem('hackhub_user');
    return data ? JSON.parse(data) : null;
}

function saveUser(user) {
    localStorage.setItem('hackhub_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('hackhub_user');
    window.location.href = 'login.html';
}

function checkAuth() {
    if (!getUser()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function showAlert(msg, type) {
    var div = document.createElement('div');
    div.className = 'alert alert-' + (type || 'info');
    div.textContent = msg;
    var container = document.querySelector('.container') || document.querySelector('.auth-wrapper');
    if (container) container.insertBefore(div, container.firstChild);
    setTimeout(function() { div.remove(); }, 3000);
}

// ==================== LOGIN ====================
function handleLogin(e) {
    e.preventDefault();
    var email = document.getElementById('email').value;
    var pass = document.getElementById('password').value;
    if (!email || !pass) { showAlert('Please fill in all fields!', 'danger'); return; }
    fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pass })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            saveUser(data.user);
            showAlert('Login successful!', 'success');
            setTimeout(function() { window.location.href = 'dashboard.html'; }, 1000);
        } else { showAlert(data.message || 'Login failed!', 'danger'); }
    })
    .catch(function(err) { showAlert('Server error: ' + err.message, 'danger'); });
}

// ==================== REGISTER ====================
function handleRegister(e) {
    e.preventDefault();
    var name = document.getElementById('fullname').value;
    var username = document.getElementById('username').value;
    var email = document.getElementById('email').value;
    var college = document.getElementById('college').value;
    var department = document.getElementById('department').value;
    var year = document.getElementById('year').value;
    var role = document.getElementById('role').value;
    var pass = document.getElementById('password').value;
    var cpass = document.getElementById('confirm-password').value;
    if (!name || !email || !pass || !cpass) { showAlert('Please fill in all fields!', 'danger'); return; }
    if (pass !== cpass) { showAlert('Passwords do not match!', 'danger'); return; }
    fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            full_name: name, username: username, email: email, password: pass,
            college: college, department: department,
            year_of_study: parseInt(year) || null, role: role
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('Registration successful! Redirecting...', 'success');
            setTimeout(function() { window.location.href = 'login.html'; }, 1500);
        } else { showAlert(data.message || 'Registration failed!', 'danger'); }
    })
    .catch(function(err) { showAlert('Server error: ' + err.message, 'danger'); });
}

// ==================== PROFILE ====================
function loadProfile() {
    var user = getUser();
    if (!user) return;
    fetch(API + '/users/' + user.user_id)
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success) return;
        var u = data.user;
        var el = function(id) { return document.getElementById(id); };
        if (el('profile-avatar')) el('profile-avatar').textContent = (u.full_name || '?')[0].toUpperCase();
        if (el('profile-name')) el('profile-name').textContent = u.full_name;
        if (el('profile-username')) el('profile-username').textContent = '@' + u.username;
        if (el('profile-info')) el('profile-info').textContent = '📍 ' + (u.college || 'N/A') + ' · ' + (u.department || 'N/A') + ' · ' + (u.year_of_study ? u.year_of_study + getSuffix(u.year_of_study) + ' Year' : 'N/A');
        if (el('profile-points')) el('profile-points').textContent = '🏆 ' + (u.points || 0) + ' Points';
        if (el('profile-role-badge')) el('profile-role-badge').innerHTML = '<span class="badge badge-blue">' + (u.role || 'student') + '</span>';
        if (el('profile-bio')) el('profile-bio').innerHTML = '<strong>Bio:</strong> ' + (u.bio || 'No bio added yet. Click Edit Profile to add one.');
        if (el('profile-github')) {
            el('profile-github').href = u.github_url || '#';
            el('profile-github').textContent = u.github_url ? 'GitHub' : 'Not set';
        }
        if (el('profile-linkedin')) {
            el('profile-linkedin').href = u.linkedin_url || '#';
            el('profile-linkedin').textContent = u.linkedin_url ? 'LinkedIn' : 'Not set';
        }
        if (el('profile-portfolio')) {
            el('profile-portfolio').href = u.portfolio_url || '#';
            el('profile-portfolio').textContent = u.portfolio_url ? 'Portfolio' : 'Not set';
        }
        // Skills
        var tbody = el('profile-skills');
        if (tbody && data.skills) {
            if (data.skills.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888;">No skills added yet</td></tr>';
            } else {
                tbody.innerHTML = '';
                data.skills.forEach(function(s) {
                    var color = s.proficiency === 'expert' ? 'purple' : s.proficiency === 'advanced' ? 'green' : s.proficiency === 'intermediate' ? 'blue' : 'orange';
                    tbody.innerHTML += '<tr><td>' + s.skill_name + '</td><td>' + (s.category || '') + '</td><td><span class="badge badge-' + color + '">' + capitalize(s.proficiency) + '</span></td></tr>';
                });
            }
        }
    })
    .catch(function(err) { console.log('Profile load error:', err); });
}

function getSuffix(n) {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ==================== ADD SKILL ====================
function handleAddSkill() {
    var user = getUser();
    if (!user) { showAlert('Please login first!', 'danger'); return; }
    var name = document.getElementById('new-skill-name').value.trim();
    var cat = document.getElementById('new-skill-category').value;
    var prof = document.getElementById('new-skill-proficiency').value;
    if (!name) { showAlert('Please enter a skill name!', 'danger'); return; }
    fetch(API + '/users/' + user.user_id + '/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_name: name, category: cat, proficiency: prof })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('Skill added!', 'success');
            document.getElementById('new-skill-name').value = '';
            loadProfile();
        } else { showAlert(data.message || 'Failed', 'danger'); }
    })
    .catch(function(err) { showAlert('Error: ' + err.message, 'danger'); });
}

// ==================== EDIT PROFILE ====================
function loadEditProfile() {
    var user = getUser();
    if (!user) return;
    fetch(API + '/users/' + user.user_id)
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success) return;
        var u = data.user;
        var set = function(id, val) { var e = document.getElementById(id); if (e) e.value = val || ''; };
        set('edit-fullname', u.full_name);
        set('edit-username', u.username);
        set('edit-email', u.email);
        set('edit-college', u.college);
        set('edit-department', u.department);
        set('edit-year', u.year_of_study);
        set('edit-bio', u.bio);
        set('edit-github', u.github_url);
        set('edit-linkedin', u.linkedin_url);
        set('edit-portfolio', u.portfolio_url);
    })
    .catch(function(err) { console.log('Edit profile load error:', err); });
}

function handleEditProfile(e) {
    e.preventDefault();
    var user = getUser();
    if (!user) { showAlert('Please login first!', 'danger'); return; }
    var val = function(id) { var e = document.getElementById(id); return e ? e.value : ''; };
    fetch(API + '/users/' + user.user_id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            full_name: val('edit-fullname'),
            username: val('edit-username'),
            college: val('edit-college'),
            department: val('edit-department'),
            year_of_study: parseInt(val('edit-year')) || null,
            bio: val('edit-bio'),
            github_url: val('edit-github'),
            linkedin_url: val('edit-linkedin'),
            portfolio_url: val('edit-portfolio')
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('Profile updated!', 'success');
            setTimeout(function() { window.location.href = 'profile.html'; }, 1500);
        } else { showAlert(data.message || 'Update failed!', 'danger'); }
    })
    .catch(function(err) { showAlert('Server error: ' + err.message, 'danger'); });
}

// ==================== SUBMIT IDEA ====================
function handleIdeaSubmit(e) {
    e.preventDefault();
    var user = getUser();
    if (!user) { showAlert('Please login first!', 'danger'); return; }
    var val = function(id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var title = val('idea-title');
    var desc = val('idea-desc');
    if (!title || !desc) { showAlert('Please fill in required fields!', 'danger'); return; }
    fetch(API + '/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            hackathon_id: 1, user_id: user.user_id, title: title,
            idea_description: desc,
            problem_statement: val('idea-problem'),
            proposed_solution: val('idea-solution'),
            tech_stack: val('idea-tech'),
            repo_url: val('idea-repo'),
            demo_url: val('idea-demo')
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('Idea submitted! AI evaluation complete.', 'success');
            setTimeout(function() { window.location.href = 'results.html?id=' + data.submission.submission_id; }, 1500);
        } else { showAlert(data.message || 'Submission failed!', 'danger'); }
    })
    .catch(function(err) { showAlert('Server error: ' + err.message, 'danger'); });
}

// ==================== CREATE TEAM ====================
function handleCreateTeam(e) {
    e.preventDefault();
    var user = getUser();
    if (!user) { showAlert('Please login first!', 'danger'); return; }
    var name = document.getElementById('team-name').value;
    if (!name) { showAlert('Please enter a team name!', 'danger'); return; }
    var val = function(id) { var e = document.getElementById(id); return e ? e.value : ''; };
    fetch(API + '/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            team_name: name, hackathon_id: 1, leader_id: user.user_id,
            description: val('team-desc'),
            looking_for: val('team-looking'),
            is_open: val('team-open') !== 'no'
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('Team created!', 'success');
            setTimeout(function() { window.location.href = 'team-dashboard.html'; }, 1500);
        } else { showAlert(data.message || 'Failed!', 'danger'); }
    })
    .catch(function(err) { showAlert('Server error: ' + err.message, 'danger'); });
}

// ==================== SCHEDULE MEETING ====================
function handleScheduleMeeting(e) {
    e.preventDefault();
    var user = getUser();
    if (!user) { showAlert('Please login first!', 'danger'); return; }
    var val = function(id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var title = val('meet-title');
    var date = val('meet-date');
    var time = val('meet-time');
    if (!title || !date || !time) { showAlert('Please fill in required fields!', 'danger'); return; }
    fetch(API + '/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title,
            description: val('meet-desc'),
            organizer_id: user.user_id,
            meeting_time: date + 'T' + time + ':00',
            duration_mins: parseInt(val('meet-duration')) || 30,
            meeting_link: val('meet-link'),
            location: val('meet-location')
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showAlert('Meeting scheduled!', 'success');
            loadMeetings();
            document.querySelector('form').reset();
        } else { showAlert(data.message || 'Failed!', 'danger'); }
    })
    .catch(function(err) { showAlert('Server error: ' + err.message, 'danger'); });
}

function loadMeetings() {
    var user = getUser();
    if (!user) return;
    var tbody = document.getElementById('meetings-list');
    if (!tbody) return;
    fetch(API + '/meetings?user_id=' + user.user_id)
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success || data.meetings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">No meetings yet</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        data.meetings.forEach(function(m) {
            var d = new Date(m.meeting_time);
            tbody.innerHTML += '<tr><td>' + m.title + '</td><td>' + d.toLocaleDateString() + '</td><td>' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</td><td>' + (m.meeting_link ? '<a href="' + m.meeting_link + '" target="_blank" style="color:#3498db;">Join</a>' : (m.location || 'N/A')) + '</td></tr>';
        });
    })
    .catch(function() { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">Could not load</td></tr>'; });
}

// ==================== SEND MESSAGE ====================
function handleSendMessage(e) {
    e.preventDefault();
    var input = document.getElementById('msg-input');
    var msg = input.value.trim();
    if (!msg) return;
    var chatBox = document.querySelector('.chat-box');
    var bubble = document.createElement('div');
    bubble.className = 'bubble sent';
    bubble.innerHTML = msg + '<div class="meta">Just now</div>';
    chatBox.appendChild(bubble);
    var clear = document.createElement('div');
    clear.style.clear = 'both';
    chatBox.appendChild(clear);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ==================== SEARCH FILTER ====================
function filterTable(inputId, tableId) {
    var filter = document.getElementById(inputId).value.toLowerCase();
    var rows = document.getElementById(tableId).getElementsByTagName('tr');
    for (var i = 1; i < rows.length; i++) {
        var text = rows[i].textContent.toLowerCase();
        rows[i].style.display = text.indexOf(filter) > -1 ? '' : 'none';
    }
}

// ==================== DASHBOARD ====================
function loadDashboard() {
    var user = getUser();
    if (!user) return;
    fetch(API + '/dashboard/' + user.user_id)
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success) return;
        var d = data.dashboard;
        var title = document.querySelector('.page-title');
        if (title) title.textContent = 'Welcome back, ' + d.user.full_name.split(' ')[0] + '!';
        var numbers = document.querySelectorAll('.stat-box .number');
        if (numbers.length >= 4) {
            numbers[0].textContent = d.user.points;
            numbers[1].textContent = '#' + d.rank;
            numbers[2].textContent = d.team_count;
            numbers[3].textContent = d.submission_count;
        }
    })
    .catch(function(err) { console.log('Dashboard error:', err); });
}

// ==================== HACKATHONS ====================
function loadHackathons() {
    fetch(API + '/hackathons')
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success) return;
        var table = document.getElementById('hackTable');
        if (!table) return;
        while (table.rows.length > 1) table.deleteRow(1);
        data.hackathons.forEach(function(h) {
            var row = table.insertRow();
            var sc = h.status === 'open' ? 'status-open' : h.status === 'completed' ? 'status-closed' : h.status === 'in_progress' ? 'status-progress' : 'status-draft';
            row.innerHTML = '<td><strong>' + h.title + '</strong></td><td>' + (h.theme || '') + '</td><td>' + new Date(h.event_start).toLocaleDateString() + '</td><td><span class="status ' + sc + '">' + h.status.toUpperCase() + '</span></td><td><a href="hackathon-detail.html?id=' + h.hackathon_id + '" class="btn btn-primary">View</a></td>';
        });
    })
    .catch(function(err) { console.log('Hackathons error:', err); });
}

// ==================== LEADERBOARD ====================
function loadLeaderboard() {
    fetch(API + '/leaderboard')
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success) return;
        var list = data.leaderboard;
        var user = getUser();
        var podium = document.getElementById('podium');
        var tbody = document.getElementById('leaderboard-body');
        // Podium top 3
        if (podium && list.length > 0) {
            var medals = ['🥇', '🥈', '🥉'];
            var colors = ['#f1c40f', '#bdc3c7', '#e67e22'];
            var borders = ['#f1c40f', '#bdc3c7', '#cd7f32'];
            var html = '';
            for (var i = 0; i < Math.min(3, list.length); i++) {
                var p = list[i];
                html += '<div class="card text-center" style="border:2px solid ' + borders[i] + ';"><div style="font-size:36px;">' + medals[i] + '</div><div class="avatar" style="margin:8px auto;width:50px;height:50px;font-size:20px;background:' + colors[i] + ';">' + (p.full_name || '?')[0] + '</div><strong>' + p.full_name + '</strong><p style="color:' + colors[i] + ';font-weight:bold;font-size:20px;">' + p.points + ' pts</p><p style="color:#888;font-size:12px;">' + (p.college || '') + '</p></div>';
            }
            podium.innerHTML = html;
        }
        // Table
        if (tbody) {
            tbody.innerHTML = '';
            list.forEach(function(p, idx) {
                var isMe = user && (p.user_id === user.user_id);
                var style = isMe ? ' style="background:#eaf4ff;"' : '';
                tbody.innerHTML += '<tr' + style + '><td>' + (isMe ? '<strong>' : '') + (idx + 1) + (isMe ? '</strong>' : '') + '</td><td>' + (isMe ? '<strong>' + p.full_name + ' (You)</strong>' : p.full_name) + '</td><td>' + (p.college || '') + '</td><td><strong>' + p.points + '</strong></td><td>' + (p.hackathon_count || 0) + '</td></tr>';
            });
        }
    })
    .catch(function(err) { console.log('Leaderboard error:', err); });
}

// ==================== ADMIN ====================
function loadAdminStats() {
    fetch(API + '/admin/stats')
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.success) return;
        var s = data.stats;
        var set = function(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
        set('admin-users', s.total_users);
        set('admin-hackathons', s.total_hackathons);
        set('admin-teams', s.total_teams);
        set('admin-submissions', s.total_submissions);
        set('admin-avg-score', s.avg_ai_score);
    })
    .catch(function(err) { console.log('Admin stats error:', err); });
}

// ==================== AUTO-LOAD ====================
(function() {
    var page = window.location.pathname.split('/').pop();
    var protectedPages = ['dashboard.html', 'profile.html', 'edit-profile.html', 'submit-idea.html', 'create-team.html', 'schedule-meeting.html', 'team-dashboard.html', 'inbox.html', 'conversation.html', 'results.html', 'admin.html'];
    if (protectedPages.indexOf(page) > -1 && !getUser()) {
        window.location.href = 'login.html';
        return;
    }
    if (page === 'dashboard.html') loadDashboard();
    if (page === 'hackathons.html') loadHackathons();
    if (page === 'leaderboard.html') loadLeaderboard();
    if (page === 'profile.html') loadProfile();
    if (page === 'edit-profile.html') loadEditProfile();
    if (page === 'admin.html') loadAdminStats();
    if (page === 'schedule-meeting.html') loadMeetings();
})();
