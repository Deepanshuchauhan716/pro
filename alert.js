function getLogs() {
    try {
        return JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    } catch (e) {
        return [];
    }
}

function timeAgo(timestamp) {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60) return s + ' seconds ago';
    if (s < 3600) return Math.floor(s / 60) + ' minutes ago';
    if (s < 86400) return Math.floor(s / 3600) + ' hours ago';
    return Math.floor(s / 86400) + ' days ago';
}

function generateAlerts() {
    const logs = getLogs();
    const alerts = [];

    if (logs.length === 0) return alerts;

    const endpointStats = {};

    logs.forEach(log => {
        const key = log.method + ' ' + log.url;
        if (!endpointStats[key]) {
            endpointStats[key] = {
                method: log.method,
                url: log.url,
                total: 0,
                failed: 0,
                totalTime: 0,
                times: [],
                statuses: {}
            };
        }
        const s = endpointStats[key];
        s.total++;
        s.totalTime += log.time;
        s.times.push(log.time);
        if (!log.success) s.failed++;
        s.statuses[log.status] = (s.statuses[log.status] || 0) + 1;
    });


    Object.values(endpointStats).forEach(stat => {
        const avgTime = Math.round(stat.totalTime / stat.total);
        const failRate = (stat.failed / stat.total) * 100;
        let shortUrl = stat.url;
        try {
            shortUrl = new URL(stat.url).pathname;
        } catch (e) {}

        if (failRate > 30) {
            const statusCodes = Object.keys(stat.statuses).join(', ');
            alerts.push({
                severity: 'critical',
                title: 'Endpoint failing',
                method: stat.method,
                url: shortUrl,
                message: `${stat.method} ${shortUrl} has returned ${statusCodes} errors in ${Math.round(failRate)}% of requests in the last 15 minutes.`,
                suggestion: 'Check downstream service status and recent deploys.',
                timestamp: Date.now()
            });
        } else if (failRate > 10) {
            alerts.push({
                severity: 'warning',
                title: 'Elevated failure rate',
                method: stat.method,
                url: shortUrl,
                message: `${stat.method} ${shortUrl} is returning errors in ${Math.round(failRate)}% of requests, higher than usual.`,
                suggestion: 'Check for recent changes or stale client-side IDs.',
                timestamp: Date.now()
            });
        }

        if (avgTime > 2000) {
            alerts.push({
                severity: 'critical',
                title: 'Endpoint very slow',
                method: stat.method,
                url: shortUrl,
                message: `${stat.method} ${shortUrl} average latency has climbed to ${avgTime}ms.`,
                suggestion: 'Consider adding caching, pagination, or query optimization.',
                timestamp: Date.now()
            });
        } else if (avgTime > 1000) {
            alerts.push({
                severity: 'warning',
                title: 'Endpoint slowing down',
                method: stat.method,
                url: shortUrl,
                message: `${stat.method} ${shortUrl} average latency has climbed to ${avgTime}ms, up from a baseline.`,
                suggestion: 'Consider adding pagination or caching to this endpoint.',
                timestamp: Date.now()
            });
        }

        // RULE 3: Traffic spike
        if (stat.total > 20) {
            alerts.push({
                severity: 'info',
                title: 'Traffic spike detected',
                method: stat.method,
                url: shortUrl,
                message: `${stat.method} ${shortUrl} saw a ${stat.total} calls increase in requests over the last hour.`,
                suggestion: 'No action needed — monitor for sustained load.',
                timestamp: Date.now()
            });
        }
    });

    const order = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    return alerts;
}

function renderAlerts() {
    const el = document.getElementById('alertsList');
    const countEl = document.getElementById('alertCount');
    if (!el) return;

    const alerts = generateAlerts();

    if (countEl) {
        countEl.textContent = alerts.length === 0
            ? 'All systems operational'
            : `${alerts.length} active alert${alerts.length > 1 ? 's' : ''} requiring attention`;
    }

    if (alerts.length === 0) {
        el.innerHTML = `
            <div class="alert-empty">
                <span class="alert-empty-icon">🎉</span>
                <p class="alert-empty-text">No alerts! All systems operational.</p>
            </div>
        `;
        return;
    }

    el.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.severity}">
            <div class="alert-header">
                <span class="alert-dot"></span>
                <span class="alert-card-title">${alert.title}</span>
                <span class="alert-badge ${alert.severity}">${alert.severity.toUpperCase()}</span>
                <span class="alert-time">${timeAgo(alert.timestamp)}</span>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-suggestion">${alert.suggestion}</div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderAlerts();
    setInterval(renderAlerts, 5000);
});