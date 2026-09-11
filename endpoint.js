function getLogs() {
    try {
        return JSON.parse(localStorage.getItem('apibreak_logs')) || [];
    } catch (e) {
        return [];
    }
}

function renderEndpoints() {
    const logs = getLogs();
    const el = document.getElementById('endpointsList');
    if (!el) return;

    // Search filter
    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    // ===== GROUP BY ENDPOINT =====
    const groups = {};

    logs.forEach(log => {
        const key = log.method + ' ' + log.url;
        if (!groups[key]) {
            groups[key] = {
                method: log.method,
                url: log.url,
                total: 0,
                failed: 0,
                times: [],
                statuses: {}
            };
        }
        const g = groups[key];
        g.total++;
        g.times.push(log.time);
        if (!log.success) g.failed++;
        g.statuses[log.status] = (g.statuses[log.status] || 0) + 1;
    });

    // ===== CALCULATE STATS =====
    let list = Object.values(groups).map(g => {
        const avg = Math.round(g.times.reduce((a, b) => a + b, 0) / g.times.length);
        const min = Math.min(...g.times);
        const max = Math.max(...g.times);
        const failRate = ((g.failed / g.total) * 100).toFixed(1);

        // Short URL
        let shortUrl = g.url;
        try {
            shortUrl = new URL(g.url).pathname;
        } catch (e) {}

        return {
            method: g.method,
            url: shortUrl,
            calls: g.total,
            avg: avg,
            min: min,
            max: max,
            failRate: failRate,
            statuses: g.statuses
        };
    });

    // ===== SEARCH FILTER =====
    if (search) {
        list = list.filter(item =>
            item.url.toLowerCase().includes(search) ||
            item.method.toLowerCase().includes(search)
        );
    }

    // ===== SORT BY CALLS (MOST FIRST) =====
    list.sort((a, b) => b.calls - a.calls);

    // ===== EMPTY STATE =====
    if (list.length === 0) {
        el.innerHTML = `
            <div class="endpoints-empty">
                <span class="endpoints-empty-icon">🔗</span>
                <p>${logs.length === 0 ? 'No endpoints tracked yet' : 'No endpoints match your search'}</p>
            </div>
        `;
        return;
    }

    // ===== RENDER =====
    el.innerHTML = list.map(item => {
        // Status pills
        const statusPills = Object.entries(item.statuses)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
                const code = parseInt(status);
                const isSuccess = code >= 200 && code < 400;
                return `<span class="status-pill ${isSuccess ? 'success' : 'fail'}">${status} × ${count}</span>`;
            })
            .join('');

        const failClass = parseFloat(item.failRate) > 5 ? 'fail' : 'fail low';

        return `
            <div class="endpoint-card">
                <div class="endpoint-top">
                    <span class="method-badge ${item.method}">${item.method}</span>
                    <span class="endpoint-url">${item.url}</span>
                    <span class="endpoint-calls">${item.calls} calls</span>
                </div>

                <div class="endpoint-metrics">
                    <div class="metric avg">Avg ${item.avg}ms</div>
                    <div class="metric min">Min ${item.min}ms</div>
                    <div class="metric max">Max ${item.max}ms</div>
                    <div class="metric ${failClass}">Fail Rate ${item.failRate}%</div>
                </div>

                <div class="endpoint-statuses">
                    ${statusPills}
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderEndpoints();
    setInterval(renderEndpoints, 3000);
});