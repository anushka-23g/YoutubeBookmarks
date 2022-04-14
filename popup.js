import { getActiveTabURL } from "./utils.js";

let currentVideo;
let current = [];

const setBookmarkAttributes = (src, eventlistener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventlistener);
  controlParentElement.appendChild(controlElement);

  return controlElement;
};

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarks, bookmark) => {
  // bookmark title element
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
  bookmarksElement.innerHTML = ""; // removes anything in the previous list

  if (currentBookmarks) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }
};

const saveEditedBookmarkTitle = (bookmarkEle, bookmarkTitle, editTitleBtn) => {
  const newBookmarkTitle = bookmarkTitle.getElementsByTagName("input")[0].value;

  editTitleBtn.setAttribute("data-editing", false);
  editTitleBtn.src = "assets/edit.png";
  bookmarkTitle.innerHTML = newBookmarkTitle;

  const editedBookmarkTime = bookmarkEle.getAttribute("timestamp");
  const editedBookmark = current.filter((b) => b.time == editedBookmarkTime)[0];
  editedBookmark.desc = newBookmarkTitle;
  chrome.storage.sync.set({ [currentVideo]: JSON.stringify(current) });
};

const onEdit = (e) => {
  const editTitleBtn = e.target;
  const bookmarkEle = editTitleBtn.parentNode.parentNode;
  const bookmarkTitle = bookmarkEle.getElementsByClassName("bookmark-title")[0];
  const editingAttr = editTitleBtn.getAttribute("data-editing");
  // first time it does not exist and after one edit it becomes false
  const isEditing = !editingAttr || editingAttr == "false";

  if (bookmarkTitle) {
    if (isEditing) {
      const bookmarkTitleText = bookmarkTitle.innerHTML;
      bookmarkTitle.innerHTML = "";
      editTitleBtn.src = "assets/save.png";

      const titleTextBox = document.createElement("input");
      titleTextBox.className = "textbox";
      titleTextBox.value = bookmarkTitleText;
      titleTextBox.addEventListener("keypress", (e) => {
        //checking if enter/return key is pressed
        e.key === "Enter" &&
          saveEditedBookmarkTitle(bookmarkEle, bookmarkTitle, editTitleBtn);
      });

      setTimeout(() => {
        titleTextBox.select();
      }); // select textbox text

      // set editing attribute
      editTitleBtn.setAttribute("data-editing", true);

      bookmarkTitle.appendChild(titleTextBox);
    } else {
      // saving
      saveEditedBookmarkTitle(bookmarkEle, bookmarkTitle, editTitleBtn);
    }
  }
};

const onPlay = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");

  // deleting a bookmark from popup
  const bookmarkEleToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );
  bookmarkEleToDelete.parentNode.removeChild(bookmarkEleToDelete);

  // send message to delete bookmark
  const activeTab = await getActiveTabURL();
  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  });

  // saving it to local chrome storage
  current = current.filter((b) => b.time != bookmarkTime);
  chrome.storage.sync.set({ [currentVideo]: JSON.stringify(current) });
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();

  try{
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    currentVideo = urlParameters.get("v");

    if (activeTab.url.indexOf("youtube.com") > -1 && currentVideo) {
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

