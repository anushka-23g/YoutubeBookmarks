export async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
}

export function sendMessage({tabId, type, value}) {
    chrome.tabs.sendMessage(tabId, {
        type,
        value
    });
}

export function setBookmarkAttributes (src, eventlistener, controlParentElement) {
    const controlElement = document.createElement("img");

    controlElement.src = "assets/" + src + ".png";
    controlElement.title = src;
    controlElement.addEventListener("click", eventlistener);
    controlParentElement.appendChild(controlElement);

    return controlElement;
};