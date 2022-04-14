(() => {
  let ytLeftControls, ytPlayer;
  let currentVideo = "";
  let lastVideo = "";
  let currentVideoBookmarks = [];

 /* getting bookmarks from chrome local storage */
  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  /* getting this video's length */
  const getVideoDuration = () => {
    if (ytPlayer) return parseInt(ytPlayer.duration);
    return null;
  };

   /* adding new bookmark to the chrome local storage */
  const addNewBookmarkEventHandler = () => {
    let currentTime = null;
    if (ytPlayer) currentTime = parseInt(ytPlayer.currentTime);

    if (currentTime) {
      const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getTime(currentTime),
      };

      fetchBookmarks().then((obj) => {
        currentVideoBookmarks = obj;
        let newBookmarksList = currentVideoBookmarks.concat(newBookmark);
        newBookmarksList = newBookmarksList.sort((a, b) => a.time - b.time);
        chrome.storage.sync.set({
          [currentVideo]: JSON.stringify(newBookmarksList),
        });
      });
    }
  };

  /* this checks for whenever a new video is loaded or the current tab is reloaded */
  const newVideoLoaded = (refreshed) => {
    currentVideoBookmarks = [];
    ytLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
    ytPlayer = document.getElementsByClassName("html5-main-video")[0];

    const fetchBookmarksPromise = fetchBookmarks();

    const videoBookmarkTimePromise = new Promise((resolve) => {
      const getCurrentTime = () => {
        ytPlayer.removeEventListener("playing", getCurrentTime);
        resolve(getVideoDuration());
      };

      if (refreshed) {
        resolve(getVideoDuration());
        return;
      }
      ytPlayer.addEventListener("playing", getCurrentTime);
    });

    Promise.all([fetchBookmarksPromise, videoBookmarkTimePromise]).then(
      (obj) => {
        currentVideoBookmarks = obj[0];

        // Adding bookmark button
        let bookmarkBtn = document.getElementsByClassName("bookmark-btn")[0];

        if (!bookmarkBtn) {
          const bookmarkBtn = document.createElement("img");

          bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
          bookmarkBtn.className = "ytp-button " + "bookmark-btn";
          bookmarkBtn.title = "Click to bookmark current timestamp";

          ytLeftControls.appendChild(bookmarkBtn);

          bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
      }
    );

    lastVideo = currentVideo;
  };

  /* respond to messages from background or popup pages */
  chrome.runtime.onMessage.addListener((obj, sendResponse) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded(false);
    } else if (type === "PLAY") {
      ytPlayer.currentTime = value;
    } else if ( type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
    }

    sendResponse({});
  });

  /* Getting the query parameter for the current tab url on refreshing the tab*/
  const url_parameters = new URLSearchParams(location.search);
  currentVideo = url_parameters.get("v");

  if (currentVideo) {
    newVideoLoaded(true);
  }
})();

const getTime = (t) => {
  let hour, minute, sec, h1;

  hour = Math.floor(t / 60 / 60);
  minute = Math.floor((t / 60 / 60 - hour) * 60);
  sec = Math.floor(((t / 60 / 60 - hour) * 60 - minute) * 60);

  sec = sec < 10 ? `0${sec}` : `${sec}`;
  minute = minute < 10 ? `0${minute}` : `${minute}`;
  h1 = hour < 10 ? `0${hour}` : `${hour}`;

  return hour > 0 ? `${h1}:${minute}:${sec}` : `${minute}:${sec}`;
};
