let chart = null;

function initChart() {
    const canvas = document.getElementById('timeChart');
    if (!canvas) return;

    chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response time',
                borderColor: '#a4f',
                backgroundColor: 'rgba(164, 68, 255, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#4af',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                borderWidth: 2,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } }
                }
            }
        }
    });
}

function prepareChartData() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    if (logs.length === 0) return { labels: [], data: [] };

    const now = Date.now();
    const WINDOW = 15 * 60 * 1000;
    const BUCKET = 2 * 60 * 1000;

    const recent = logs.filter(l => (now - l.timestamp) < WINDOW);
    if (recent.length === 0) return { labels: [], data: [] };

    const windowStart = now - WINDOW;
    const buckets = [];

    for (let t = windowStart; t <= now; t += BUCKET) {
        const date = new Date(t);
        const label = date.getHours().toString().padStart(2, '0') + ':' +
                      date.getMinutes().toString().padStart(2, '0');
        buckets.push({ label, start: t, end: t + BUCKET, times: [] });
    }

    recent.forEach(log => {
        const b = buckets.find(b => log.timestamp >= b.start && log.timestamp < b.end);
        if (b) b.times.push(log.time);
    });

    let lastValue = 0;
    const labels = buckets.map(b => b.label);
    const data = buckets.map(b => {
        if (b.times.length === 0) return lastValue;
        lastValue = Math.round(b.times.reduce((a, b) => a + b, 0) / b.times.length);
        return lastValue;
    });

    return { labels, data };
}

function updateChart() {
    if (!chart) return;
    const { labels, data } = prepareChartData();
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

function renderSlowest() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    const el = document.getElementById('slowestList');
    if (!el) return;

    if (logs.length === 0) {
        el.innerHTML = '<p class="empty">No data</p>';
        return;
    }

    const group = {};
    logs.forEach(log => {
        const key = log.method + ' ' + log.url;
        if (!group[key]) {
            group[key] = { method: log.method, url: log.url, times: [] };
        }
        group[key].times.push(log.time);
    });

    const list = Object.values(group).map(g => ({
        method: g.method,
        url: g.url,
        avg: Math.round(g.times.reduce((a, b) => a + b, 0) / g.times.length)
    }));

    list.sort((a, b) => b.avg - a.avg);
    const top5 = list.slice(0, 5);

    if (top5.length === 0) {
        el.innerHTML = '<p class="empty">Koi data nahi</p>';
        return;
    }

    const maxTime = top5[0].avg || 1;

    el.innerHTML = top5.map(item => {
        const width = (item.avg / maxTime) * 100;
        let shortUrl = item.url;
        try { shortUrl = new URL(item.url).pathname; } catch (e) {}
        if (shortUrl.length > 18) shortUrl = shortUrl.substring(0, 18) + '...';

        return `
            <div class="slowest-item">
                <span class="method-badge ${item.method}">${item.method}</span>
                <span class="slowest-url">${shortUrl}</span>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${width}%"></div>
                </div>
                <span class="slowest-time">${item.avg}ms</span>
            </div>
        `;
    }).join('');
}

function renderStats() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    const total = logs.length;
    const failed = logs.filter(l => !l.success).length;
    const avg = total ? Math.round(logs.reduce((a, b) => a + b.time, 0) / total) : 0;
    const slowest = total ? Math.max(...logs.map(l => l.time)) : 0;

    const totalEl = document.getElementById('totalValue');
    if (totalEl) totalEl.innerText = total;

    const failEl = document.getElementById('failValue');
    if (failEl) failEl.innerText = failed;

    const avgEl = document.getElementById('avgValue');
    if (avgEl) avgEl.innerText = avg + 'ms';

    const slowEl = document.getElementById('slowestValue');
    if (slowEl) slowEl.innerText = slowest ? slowest + 'ms' : '-';
}

function renderIssues() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    const el = document.getElementById('recentIssues');
    if (!el) return;

    const failed = logs.filter(l => !l.success).reverse().slice(0, 4);

    if (failed.length === 0) {
        el.innerHTML = '<p class="empty">No issue 🎉</p>';
        return;
    }

    el.innerHTML = failed.map(log => {
        let shortUrl = log.url;
        try { shortUrl = new URL(log.url).pathname; } catch (e) {}
        if (shortUrl.length > 20) shortUrl = shortUrl.substring(0, 20) + '...';

        const ago = timeAgo(log.timestamp);

        return `
            <div class="issue-item">
                <div class="issue-header">
                    <span class="method-badge ${log.method}">${log.method}</span>
                    <span class="issue-url">${shortUrl}</span>
                </div>
                <div class="issue-detail">
                    <span class="issue-status">${log.status}</span>
                    <span>${ago}</span>
                </div>
            </div>
        `;
    }).join('');
}

function timeAgo(timestamp) {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

function renderLiveFeed() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    const el = document.getElementById('liveFeed');
    if (!el) return;

    const recent = logs.slice().reverse().slice(0, 10);

    if (recent.length === 0) {
        el.innerHTML = '<p class="empty">Abhi koi API call nahi</p>';
        return;
    }

    el.innerHTML = recent.map(log => {
        let shortUrl = log.url;
        try { shortUrl = new URL(log.url).pathname; } catch (e) {}
        if (shortUrl.length > 25) shortUrl = shortUrl.substring(0, 25) + '...';

        const time = new Date(log.timestamp).toLocaleTimeString();

        let emoji = '✅';
        let rowClass = 'success';

        if (!log.success) {
            emoji = '❌';
            rowClass = 'fail';
        } else if (log.time > 1000) {
            emoji = '🐌';
            rowClass = 'slow';
        }

        return `
            <div class="feed-row ${rowClass}">
                <span class="feed-emoji">${emoji}</span>
                <span class="method-badge ${log.method}">${log.method}</span>
                <span class="feed-url">${shortUrl}</span>
                <span class="feed-status">${log.status}</span>
                <span class="feed-time ${log.time > 1000 ? 'slow' : ''}">${log.time}ms</span>
                <span class="feed-timestamp">${time}</span>
            </div>
        `;
    }).join('');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4af, #a4f);
        color: white;
        padding: 14px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 8px 32px rgba(68,170,255,0.4);
        animation: slideIn 0.3s ease;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function exportPDF() {
    const element = document.querySelector('.container');

    if (!element) {
        alert('Dashboard not found!');
        return;
    }

    const btn = document.querySelector('.btn-export');
    if (btn) {
        btn.disabled = true;
        btn.innerText = '⏳ Generating...';
    }

    const options = {
        margin: 5,
        filename: 'apibreak-report-' + new Date().toISOString().slice(0, 10) + '.pdf',
        image: { type: 'jpeg', quality: 0.85 },
        html2canvas: {
            scale: 0.7,
            backgroundColor: '#0a0a1a',
            useCORS: true,
            logging: false
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    html2pdf()
        .set(options)
        .from(element)
        .save()
        .then(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerText = '📄 Export PDF';
            }
            console.log('✅ PDF exported successfully');
        })
        .catch((err) => {
            console.error('❌ PDF export failed:', err);
            if (btn) {
                btn.disabled = false;
                btn.innerText = '📄 Export PDF';
            }
            alert('PDF export failed. Try again.');
        });
}

function renderAll() {
    updateChart();
    renderSlowest();
    renderStats();
    renderIssues();
    renderLiveFeed();
}

window.addEventListener('storage', (event) => {
    if (event.key === 'apibreak_logs') {
        renderAll();
        showToast('📡 New API call detected!');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);

    initChart();
    renderAll();

    setInterval(renderAll, 3000);
});