import { getActiveTabURL, sendMessage, setBookmarkAttributes } from "./utils.js";

let currentVideo;
let current = [];

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("edit", onEdit, controlsElement);
  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks=[]) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }
};

const saveEditedBookmarkTitle = (bookmarkElement, bookmarkTitle, editTitleBtn) => {
  const newBookmarkTitle = bookmarkTitle.getElementsByTagName("input")[0].value;
  const editedBookmarkTime = bookmarkElement.getAttribute("timestamp");
  const editedBookmark = current.filter((b) => b.time == editedBookmarkTime)[0];

  editTitleBtn.setAttribute("data-editing", false);
  editTitleBtn.src = "assets/edit.png";
  bookmarkTitle.innerHTML = newBookmarkTitle;

  editedBookmark.desc = newBookmarkTitle;
  chrome.storage.sync.set({ [currentVideo]: JSON.stringify(current) });
};

const onEdit = (e) => {
  const editTitleBtn = e.target;
  const bookmarkElement = editTitleBtn.parentNode.parentNode;
  const bookmarkTitle = bookmarkElement.getElementsByClassName("bookmark-title")[0];
  const editingAttr = editTitleBtn.getAttribute("data-editing");
  const isEditing = !editingAttr;

  if (isEditing && bookmarkTitle) {
    const bookmarkTitleText = bookmarkTitle.innerHTML;
    const titleTextBox = document.createElement("input");

    bookmarkTitle.innerHTML = "";
    editTitleBtn.src = "assets/save.png";

    titleTextBox.className = "textbox";
    titleTextBox.value = bookmarkTitleText;

    titleTextBox.addEventListener("keypress", (e) => {
      e.key === "Enter" &&
        saveEditedBookmarkTitle(bookmarkElement, bookmarkTitle, editTitleBtn);
    });

    titleTextBox.select();

    // set editing attribute
    editTitleBtn.setAttribute("data-editing", true);

    bookmarkTitle.appendChild(titleTextBox);
  } else {
    saveEditedBookmarkTitle(bookmarkElement, bookmarkTitle, editTitleBtn);
  }
};

const onPlay = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  sendMessage({ tabId: activeTab.id, type: "PLAY", value: bookmarkTime });
};

const onDelete = async (e) => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );

  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  sendMessage({ tabId: activeTab.id, type: "DELETE", value: bookmarkTime });

  current = current.filter((b) => b.time != bookmarkTime);
  chrome.storage.sync.set({ [currentVideo]: JSON.stringify(current) });
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();

  try{
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    currentVideo = urlParameters.get("v");

    if (activeTab.url.includes("youtube.com") && currentVideo) {
      chrome.storage.sync.get([currentVideo], (data) => {
        current = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

        viewBookmarks(current);
      });
    } else {
      const container = document.getElementsByClassName("container")[0];

      container.innerHTML = '<i class="row">No bookmarks to show</i>';
    }
  } catch(e) {
    console.log("This is not a youtube page.")
  }
});

