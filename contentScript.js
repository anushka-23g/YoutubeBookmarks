(() => {
  let ytLeftControls, ytPlayer;
  let currentVideo = null; // id of the currently playing video
  let lastVideo = null; // id of the last handled video
  let bookmarksList = []; // list of the video bookmarks

 //gettinh bookmarks from chrome local storage
  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  /* get current video's duration */
  const getVideoDuration = () => {
    if (ytPlayer) return parseInt(ytPlayer.duration);
    return null;
  };

  /* Handle request to add new bookmark */
  const addNewBookmarkEventHandler = () => {
    let currentTime = null;
    if (ytPlayer) currentTime = parseInt(ytPlayer.currentTime);

    if (currentTime) {
      const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getTime(currentTime),
      };

      fetchBookmarks().then((obj) => {
        bookmarksList = obj;
        let newBookmarksList = bookmarksList.concat(newBookmark);
        newBookmarksList = newBookmarksList.sort((a, b) => a.time - b.time);
        chrome.storage.sync.set({
          [currentVideo]: JSON.stringify(newBookmarksList),
        });
      });
    }
  };

  /* this checks for whenever a new video is loaded or the current tab is reloaded */
  const newVideoLoaded = (refreshed) => {
    bookmarksList = [];
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
        bookmarksList = obj[0];

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
  chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    if (obj.type === "NEW" && obj.videoId && lastVideo !== obj.videoId) {
      currentVideo = obj.videoId;
      newVideoLoaded(false);
    } else if (obj.type === "PLAY" && ytPlayer) {
      ytPlayer.currentTime = obj.value;
    } else if (
      obj.type === "DELETE" &&
      bookmarksList &&
      bookmarksList.length > 0
    ) {
      bookmarksList = bookmarksList.filter((b) => b.time != obj.value);
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
