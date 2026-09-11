
const consoleBody = document.getElementById('consoleBody');

function log(type, message) {
    const line = document.createElement('div');
    line.className = 'console-line ' + type;
    line.innerHTML = `
        <span class="prompt">$</span>
        <span class="text">${message}</span>
    `;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

function clearConsole() {
    consoleBody.innerHTML = '';
    log('info', 'Console cleared. Ready...');
}

function clearAllData() {
    if (confirm('Are you sure')) {
        localStorage.removeItem('apibreak_logs');
        consoleBody.innerHTML = '';
        log('info', '✅ All data cleared');
    }
}


const API_POOL = [
    // JSONPlaceholder — different endpoints
    { url: 'https://jsonplaceholder.typicode.com/users', method: 'GET', type: 'fast' },
    { url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET', type: 'fast' },
    { url: 'https://jsonplaceholder.typicode.com/comments', method: 'GET', type: 'medium' },
    { url: 'https://jsonplaceholder.typicode.com/albums', method: 'GET', type: 'fast' },
    { url: 'https://jsonplaceholder.typicode.com/photos', method: 'GET', type: 'slow' },
    { url: 'https://jsonplaceholder.typicode.com/todos', method: 'GET', type: 'fast' },
    { url: 'https://jsonplaceholder.typicode.com/users/1', method: 'GET', type: 'fast' },
    { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET', type: 'fast' },
    { url: 'https://jsonplaceholder.typicode.com/posts/1/comments', method: 'GET', type: 'medium' },

    // HTTPBin — different delays
    { url: 'https://httpbin.org/delay/1', method: 'GET', type: 'medium' },
    { url: 'https://httpbin.org/delay/3', method: 'GET', type: 'slow' },
    { url: 'https://httpbin.org/delay/5', method: 'GET', type: 'slow' },
    { url: 'https://httpbin.org/uuid', method: 'GET', type: 'fast' },
    { url: 'https://httpbin.org/ip', method: 'GET', type: 'fast' },
    { url: 'https://httpbin.org/user-agent', method: 'GET', type: 'fast' },
    { url: 'https://httpbin.org/headers', method: 'GET', type: 'fast' },

    // Failure APIs
    { url: 'https://httpbin.org/status/500', method: 'POST', type: 'fail' },
    { url: 'https://httpbin.org/status/404', method: 'GET', type: 'fail' },
    { url: 'https://httpbin.org/status/502', method: 'POST', type: 'fail' },
    { url: 'https://httpbin.org/status/401', method: 'GET', type: 'fail' },

    // Random APIs
    { url: 'https://api.publicapis.org/entries?category=animals&https=true', method: 'GET', type: 'medium' },
    { url: 'https://catfact.ninja/fact', method: 'GET', type: 'fast' },
    { url: 'https://api.coindesk.com/v1/bpi/currentprice.json', method: 'GET', type: 'medium' },
    { url: 'https://dog.ceo/api/breeds/image/random', method: 'GET', type: 'fast' },
    { url: 'https://official-joke-api.appspot.com/random_joke', method: 'GET', type: 'fast' },
];


let isRunning = false;

async function runAutoDemo() {
    if (isRunning) return;
    isRunning = true;

    const btn = document.querySelector('.auto-btn');
    btn.disabled = true;
    btn.innerText = '⏳ Running 20 calls...';

    localStorage.removeItem('apibreak_logs');

    log('info', '🚀 Starting auto demo — 20 random API calls...');
    log('dim', '─────────────────────────────────');

    // Shuffle API pool
    const shuffled = [...API_POOL].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 20; i++) {
        // Pick random API
        const api = shuffled[i % shuffled.length];

        const emoji = api.type === 'fast' ? '✅' : (api.type === 'slow' ? '🐌' : (api.type === 'fail' ? '❌' : '⏱️'));
        log('info', `${emoji} [${i + 1}/20] ${api.method} ${api.url.replace('https://', '').substring(0, 40)}...`);

        try {
            const start = performance.now();
            const res = await fetch(api.url, { method: api.method });
            const time = Math.round(performance.now() - start);

            if (res.ok) {
                if (time > 1000) {
                    log('warn', `   → ${res.status} OK · ${time}ms 🐌`);
                } else {
                    log('success', `   → ${res.status} OK · ${time}ms`);
                }
            } else {
                log('fail', `   → ${res.status} Error · ${time}ms`);
            }
        } catch (e) {
            log('fail', `   → NETWORK ERROR · ${e.message}`);
        }

        // Random delay between 500-1500ms
        const delay = Math.floor(Math.random() * 1000) + 500;
        await new Promise(r => setTimeout(r, delay));
    }

    log('dim', '─────────────────────────────────');
    log('success', '✅ Auto demo complete! 20 random calls tracked.');
    log('info', '📊 Dashboard kholo — graph mast dikhega!');

    btn.disabled = false;
    btn.innerText = '⚡ Run Auto Demo (20 Random APIs)';
    isRunning = false;
}

async function callFastAPI() {
    const apis = [
        'https://catfact.ninja/fact',
        'https://dog.ceo/api/breeds/image/random',
        'https://official-joke-api.appspot.com/random_joke',
        'https://jsonplaceholder.typicode.com/users/1',
        'https://httpbin.org/uuid'
    ];

    const url = apis[Math.floor(Math.random() * apis.length)];
    const start = performance.now();
    log('info', `GET ${url.replace('https://', '')}`);

    try {
        const response = await fetch(url);
        const time = Math.round(performance.now() - start);
        log('success', `→ ${response.status} OK · ${time}ms`);
    } catch (error) {
        const time = Math.round(performance.now() - start);
        log('fail', `→ ERROR · ${time}ms`);
    }
}

async function callSlowAPI() {
    const delays = [1, 2, 3, 4, 5];
    const delay = delays[Math.floor(Math.random() * delays.length)];
    const url = `https://httpbin.org/delay/${delay}`;

    const start = performance.now();
    log('info', `GET httpbin.org/delay/${delay}`);

    try {
        const response = await fetch(url);
        const time = Math.round(performance.now() - start);
        log('warn', `→ ${response.status} OK · ${time}ms 🐌`);
    } catch (error) {
        const time = Math.round(performance.now() - start);
        log('fail', `→ ERROR · ${time}ms`);
    }
}

async function callFailingAPI() {
    const codes = [500, 404, 502, 401, 403];
    const code = codes[Math.floor(Math.random() * codes.length)];
    const url = `https://httpbin.org/status/${code}`;

    const start = performance.now();
    log('info', `POST httpbin.org/status/${code}`);

    try {
        const response = await fetch(url, { method: 'POST' });
        const time = Math.round(performance.now() - start);
        log('fail', `→ ${response.status} Error · ${time}ms`);
    } catch (error) {
        const time = Math.round(performance.now() - start);
        log('fail', `→ ERROR · ${time}ms`);
    }
}

async function callNetworkFail() {
    const start = performance.now();
    log('info', 'GET invalid-domain');

    try {
        await fetch('https://this-domain-does-not-exist-' + Date.now() + '.com/api');
    } catch (error) {
        const time = Math.round(performance.now() - start);
        log('fail', `→ NETWORK ERROR · ${time}ms`);
    }
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    consoleBody.innerHTML = '';
    log('info', 'Ready... Har call ke liye alag API aur time aayega!');
});