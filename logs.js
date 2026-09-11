
let currentFilter = 'all';

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderLogs();
}

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    const el = document.getElementById('logsList');
    if (!el) return;

    let filtered = logs;

    if (currentFilter === 'success') {
        filtered = filtered.filter(l => l.success);
    } else if (currentFilter === 'failed') {
        filtered = filtered.filter(l => !l.success);
    } else if (currentFilter === 'slow') {
        filtered = filtered.filter(l => l.time > 1000);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const search = searchInput.value.toLowerCase();
        if (search) {
            filtered = filtered.filter(l =>
                l.url.toLowerCase().includes(search) ||
                l.method.toLowerCase().includes(search) ||
                String(l.status).toLowerCase().includes(search)
            );
        }
    }

    filtered = filtered.slice().reverse();

    if (filtered.length === 0) {
        el.innerHTML = '<p class="empty">No logs found</p>';
        return;
    }

    el.innerHTML = filtered.map(log => {
        let shortUrl = log.url;
        try {
            shortUrl = new URL(log.url).pathname;
        } catch (e) {}

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
            <div class="log-row ${rowClass}">
                <span class="log-emoji">${emoji}</span>
                <span class="log-method ${log.method}">${log.method}</span>
                <span class="log-url">${shortUrl}</span>
                <span class="log-status">${log.status}</span>
                <span class="log-time ${log.time > 1000 ? 'slow' : ''}">${log.time}ms</span>
                <span class="log-timestamp">${time}</span>
            </div>
        `;
    }).join('');
}

function exportCSV() {
    const logs = JSON.parse(localStorage.getItem('apibreak_logs')) || [];

    if (logs.length === 0) {
        alert('no log for export');
        return;
    }

    const headers = ['Timestamp', 'Method', 'URL', 'Status', 'Time (ms)', 'Success'];

    const rows = logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.method,
        log.url,
        log.status,
        log.time,
        log.success
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apibreak-logs-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
    renderLogs();
    setInterval(renderLogs, 3000);
});