(() => {
  const POLL_INTERVAL_MS = 1000;
  let lastModified = null;

  const getTargetUrl = () => {
    const path = window.location.pathname || '/index.html';
    return `${path}?_=${Date.now()}`;
  };

  const checkForUpdates = async () => {
    try {
      const response = await fetch(getTargetUrl(), {
        method: 'GET',
        cache: 'no-store',
      });
      const modified = response.headers.get('Last-Modified');
      if (!modified) {
        return;
      }
      if (lastModified && modified !== lastModified) {
        window.location.reload();
        return;
      }
      lastModified = modified;
    } catch (error) {
      // Ignore transient errors while server restarts.
    }
  };

  setInterval(checkForUpdates, POLL_INTERVAL_MS);
})();
