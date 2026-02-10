export const view = async () => {
    const counterDisplay = document.getElementById('viewCountDisplay');
    const counterContainer = document.getElementById('viewCounter');

    if (!counterDisplay || !counterContainer) return;

    const VIEW_KEY = 'portfolio_viewed_session';
    const isFirstVisit = !sessionStorage.getItem(VIEW_KEY);

    try {
        let count = null;

        if (isFirstVisit) {
            // First visit in this session: Increment view count
            const response = await fetch((window.API_BASE) + '/api/views/hit', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                count = data.count;
                sessionStorage.setItem(VIEW_KEY, 'true');
            }
        } else {
            // Subsequent visits: Try to get current count without incrementing
            // We optimize by trying a GET request first, if that fails we rely on socket
            try {
                const response = await fetch((window.API_BASE) + '/api/views');
                if (response.ok) {
                    const data = await response.json();
                    count = data.count;
                }
            } catch (ignore) {
                // Endpoint might not exist, will wait for socket
            }
        }

        if (count !== null) {
            counterDisplay.innerText = count;
            counterContainer.style.opacity = '1';
        } else {
            // If we couldn't get count, show a placeholder or wait for socket
            counterContainer.style.opacity = '1';
        }

    } catch (error) {
        console.warn('View counter failed to load:', error);
        counterDisplay.innerText = '...';
        counterContainer.style.opacity = '1';
    }

    // Real-time updates via Socket.IO
    try {
        if (typeof io !== 'undefined') {
            const socket = io(window.API_BASE);
            socket.on('views:updated', (payload) => {
                if (payload && typeof payload.count !== 'undefined') {
                    counterDisplay.innerText = payload.count;
                    counterContainer.style.opacity = '1';
                }
            });
        }
    } catch (e) {
        // ignore socket errors
    }
};