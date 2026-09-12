
const USERS_KEY = 'apibreak_users';
const SESSION_KEY = 'apibreak_session';

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }

    hideMessage();
}


function showMessage(text, type = 'error') {
    const msg = document.getElementById('message');
    msg.innerText = text;
    msg.className = 'message ' + type;
}

function hideMessage() {
    const msg = document.getElementById('message');
    msg.className = 'message';
    msg.innerText = '';
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}


function handleSignup(event) {
    event.preventDefault();
    hideMessage();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    const users = getUsers();

    if (users.find(u => u.email === email)) {
        showMessage('Email already registered. Please login.', 'error');
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,   
        createdAt: Date.now()
    };

    users.push(newUser);
    saveUsers(users);

    showMessage('✅ Account created! Redirecting...', 'success');

    // Auto-login
    setTimeout(() => {
        loginUser(newUser);
    }, 1000);
}

function handleLogin(event) {
    event.preventDefault();
    hideMessage();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showMessage('Invalid email or password', 'error');
        return;
    }

    showMessage('✅ Login successful! Redirecting...', 'success');

    setTimeout(() => {
        loginUser(user);
    }, 800);
}


function loginUser(user) {
    const session = {
        id: user.id,
        name: user.name,
        email: user.email,
        loginTime: Date.now()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    window.location.href = 'dashboard.html';
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {
        return null;
    }
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}


if (window.location.pathname.includes('login.html')) {
    const user = getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html';
    }
}