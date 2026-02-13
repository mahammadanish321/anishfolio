export const view = async () => {
    const counterDisplay = document.getElementById('viewCountDisplay');
    // Note: ID changed from viewCounter to viewCountDock in index.html
    const counterContainer = document.getElementById('viewCountDock') || document.getElementById('viewCounter');

    if (!counterDisplay || !counterContainer) {
        console.error('View Counter Debug: Elements not found');
        return;
    }

    const VIEW_KEY = 'portfolio_viewed_session';
    const isFirstVisit = !sessionStorage.getItem(VIEW_KEY);

    try {
        let count = null;

        if (isFirstVisit) {
            // First visit in this session: Increment view count
            // Endpoint: POST /api/analytics/view
            const response = await fetch((window.API_BASE) + '/api/analytics/view', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                count = data.count || data.views || data.totalViews || data.visits;
                sessionStorage.setItem(VIEW_KEY, 'true');
            }
        } else {
            // Subsequent visits: Try to get current count without incrementing
            try {
                // Endpoint: GET /api/analytics/views
                const response = await fetch((window.API_BASE) + '/api/analytics/views');
                if (response.ok) {
                    const data = await response.json();
                    count = data.count || data.views || data.totalViews || data.visits;
                }
            } catch (err) {
                console.warn('View fetch failed', err);
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
        console.error('View Counter Debug: Main Error', error);
        counterDisplay.innerText = '...';
        counterContainer.style.opacity = '1';
    }

    // Real-time updates via Socket.IO
    try {
        if (typeof io !== 'undefined') {
            const socket = io(window.API_BASE);

            socket.on('connect', () => {
                // Connected
            });

            socket.on('connect_error', (err) => {
                console.error('View Counter Debug: Socket Connection Error', err);
            });

            socket.on('views:updated', (payload) => {
                if (payload && typeof payload.count !== 'undefined') {
                    counterDisplay.innerText = payload.count;
                    counterContainer.style.opacity = '1';
                }
            });
        } else {
            console.warn('View Counter Debug: Socket.IO not loaded');
        }
    } catch (e) {
        console.error('View Counter Debug: Socket Error', e);
    }
};