(function() {
  const originalFetch = window.fetch;
  const STORAGE_KEY = 'apibreak_logs';

  function saveLog(log) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    logs.push(log);
    if (logs.length > 500) logs.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  window.fetch = async function(...args) {
    const start = performance.now();
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const method = (args[1]?.method || 'GET').toUpperCase();
    
    try {
      const response = await originalFetch(...args);
      const time = Math.round(performance.now() - start);
      
      saveLog({
        url: url,
        method: method,
        status: response.status,
        time: time,
        success: response.ok,
        timestamp: Date.now()
      });
      
      return response;
    } catch (error) {
      const time = Math.round(performance.now() - start);
      saveLog({
        url: url,
        method: method,
        status: 'ERROR',
        time: time,
        success: false,
        timestamp: Date.now()
      });
      throw error;
    }
  };

  console.log('🚀 APIBreak activated');
})();