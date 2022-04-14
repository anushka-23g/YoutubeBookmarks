let currentVideo;
let current = [];

const setBookmarkAttributes = (src, eventlistener, controls) => {
  const obj = document.createElement("img");
  obj.src = "assets/" + src + ".png";
  obj.title = src;
  obj.addEventListener("click", eventlistener);
  controls.appendChild(obj);
  return obj;
};

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarks, bookmark) => {
  // bookmark title element
  const bookmarkTitle = document.createElement("div");
  bookmarkTitle.textContent = bookmark.desc;
  bookmarkTitle.className = "bookmark-title";

  // bookmark controls - edit bookmark title, play from bookmark
  const controls = document.createElement("div");
  controls.className = "bookmark-controls";

  const editTitle = setBookmarkAttributes("edit", onEdit, controls);
  const playBookmark = setBookmarkAttributes("play", onPlay, controls);
  const removeBookmark = setBookmarkAttributes("delete", onDelete, controls);

  const newBookmarkObj = document.createElement("div");
  newBookmarkObj.id = "bookmark-" + bookmark.time;
  newBookmarkObj.className = "bookmark";
  newBookmarkObj.setAttribute("timestamp", bookmark.time);

  newBookmarkObj.appendChild(bookmarkTitle);
  newBookmarkObj.appendChild(controls);
  bookmarks.appendChild(newBookmarkObj);
};

const viewBookmarks = (bookmarksList) => {
  const bookmarks = document.getElementById("bookmarks");
  bookmarks.innerHTML = ""; // removes anything in the previous list

  if (bookmarksList && bookmarksList.length > 0) {
    //array

    for (let i = 0; i < bookmarksList.length; i++) {
      const bookmark = bookmarksList[i];
      addNewBookmark(bookmarks, bookmark);
    }
  } else {
    bookmarks.innerHTML = '<i class="row">No bookmarks to show</i>';
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
  try{
    const tab = await getActiveTabURL();
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    currentVideo = urlParameters.get("v");

    if (tab.url.indexOf("youtube.com") > -1 && currentVideo) {
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

async function getActiveTabURL() {
  const tabs = await chrome.tabs.query({
      currentWindow: true,
      active: true
  });

  return tabs[0];
}

