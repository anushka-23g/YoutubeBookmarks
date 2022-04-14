/* Event listener added for events fired when a tab is updated. */
chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url.includes("youtube.com")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });
  }
});
