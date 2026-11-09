/* API location. Local dev: Live Server (5500) -> backend on 3000. In production set to your backend URL, or '' if the backend serves the site. */
window.API_BASE = (location.protocol === 'file:' || /^55\d\d$/.test(location.port)) ? 'http://localhost:3000' : '';
