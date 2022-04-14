export async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
}

export function sendMessage(tabId, type, value) {
    chrome.tabs.sendMessage(tabId, {
        type,
        value
    });
}