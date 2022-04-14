/* Event listener added for events fired when a tab is updated. */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tab.url.indexOf("youtube.com") != -1 &&
    tab.status == "complete"
  ) {
    const query_parameters = tab.url.split("?")[1];
    const url_parameters = new URLSearchParams(query_parameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: url_parameters.get("v"),
    });
  }
});
