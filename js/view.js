export const view = async () => {
    const counterDisplay = document.getElementById('viewCountDisplay');
    const counterContainer = document.getElementById('viewCounter');

    if (!counterDisplay || !counterContainer) return;

    try {
        // Use local backend to increment and fetch view count
        const response = await fetch((window.API_BASE) + '/api/views/hit', { method: 'POST' });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();

        counterDisplay.innerText = data.count;
        counterContainer.style.opacity = '1';

    } catch (error) {
        console.warn('View counter failed to load:', error);
        // Show 0 if API fails, so the element is not "removed"
        counterDisplay.innerText = '0';
        counterContainer.style.opacity = '1';
    }

    // Real-time updates via Socket.IO (if available)
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