const STORAGE_KEY = 'smash_speed_history';
const MAX_HISTORY = 10;

function saveResult(resultObject) {
    const history = getHistory();
    
    const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        ...resultObject
    };

    history.unshift(newEntry); // Add to beginning

    // Keep only last MAX_HISTORY items
    if (history.length > MAX_HISTORY) {
        history.pop();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return history;
}

function getHistory() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("Error parsing history", e);
        return [];
    }
}

function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    return [];
}

window.StorageAPI = {
    saveResult,
    getHistory,
    clearHistory
};
