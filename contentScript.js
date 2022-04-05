(() => {

	let ytLeftControls, ytPlayer;
	let currentVid = null;  // id of the currently playing video
	let lastVid = null;   // id of the last handled video
	let BmsList = [];  // list of the video bookmarks
    
		/* Fetch all bookmarks for current video */
		const fetchBookmarks = () => {
			return new Promise(resolve => {
				// get all bookmarks for current video and create bookmark elements
				chrome.storage.sync.get([ currentVid ], (obj) => {
					resolve(obj[currentVid] ? JSON.parse(obj[currentVid]) : [])
				});
			});
		}
	
		/* Clear out all previous bookmarks */
		const delOldBms = () => {
			// remove bookmarks from previous video
			const oldBms = document.getElementsByClassName('bookmark');
			while(oldBms[0]) { oldBms[0].parentNode.removeChild(oldBms[0]);}
		}
	
		/* get current video's duration */
		const getVideoDuration = () => {
			if (ytPlayer) { return parseInt(ytPlayer.duration);}
			return null;
		}

			/* Handle request to add new bookmark */
			const addNewBmEventHandler = () => {
	
		let currentTime = null;
		if (ytPlayer) {
		 currentTime = parseInt(ytPlayer.currentTime);
		}

		if (currentTime) {

			const newBm = { time: currentTime, desc: 'Bookmark at ' + getTime(currentTime) };

			fetchBookmarks().then(obj => {
				
				BmsList = obj;
				BmsList.push(newBm);
				BmsList = BmsList.sort((a, b) => ( a.time - b.time));
				chrome.storage.sync.set({[currentVid]: JSON.stringify(BmsList)});
			});
		}
	}

		/* this checks for whenever a new video is loaded or the current tab is reloaded */
		const newVideoLoaded = (refreshed) => {

			delOldBms();
			BmsList = [];
			ytLeftControls = document.getElementsByClassName('ytp-left-controls')[0];
			ytPlayer = document.getElementsByClassName("html5-main-video")[0];
		
	
			const fetchBmsPromise = fetchBookmarks();
	
			const videoBmTimePromise = new Promise((resolve) => {
				const getCurrentTime = () => {
					ytPlayer.removeEventListener('playing', getCurrentTime);
					resolve(getVideoDuration());
				}
	
				if (refreshed) {
					resolve(getVideoDuration());
				} else {
					ytPlayer.addEventListener('playing', getCurrentTime);
				}
			});
	
			Promise.all([fetchBmsPromise, videoBmTimePromise])
				.then(obj => {
					BmsList = obj[0];
	
				// Adding bookmark button 
				let bmBtn = document.getElementsByClassName('bookmark-btn')[0];
	
				if (!bmBtn) {
					const bmBtn = document.createElement('img');
		
					bmBtn.src = chrome.runtime.getURL('assets/bookmark.png');
					bmBtn.className = 'ytp-button ' + 'bookmark-btn';
					bmBtn.title = 'Click to bookmark current timestamp';
		
					ytLeftControls.appendChild(bmBtn);
		
					bmBtn.addEventListener('click', addNewBmEventHandler);
				}
				});
	
				lastVid = currentVid;
		}

	/* respond to messages from background or popup pages */
	chrome.runtime.onMessage.addListener( (obj,sender, sendResponse) => {
	
		if(obj.type=='NEW') 
			{
				currentVid = obj.videoId;
				if (currentVid && lastVid !== currentVid) {
					newVideoLoaded(false);
				}
			}
		
		else if ((obj.type=='PLAY')&&(ytPlayer))
			{
				ytPlayer.currentTime = obj.value;
			}
			
		else if(obj.type=='DELETE' && BmsList && BmsList.length > 0)
			{
				delOldBms();
				BmsList = BmsList.filter( (b) => ( b.time != obj.value) );
			}
		
		sendResponse({});
	
	});

		/* Getting the query parameter for the current tab url on refreshing the tab*/
		const url_parameters = new URLSearchParams(location.search);
		currentVid =  url_parameters.get('v');
	
		if (currentVid) {
			newVideoLoaded(true);
		}

})();

const getTime = (t) => {

	let hour, minute, sec, h1;

	hour = Math.floor(t/60/60);
	minute = Math.floor((t/60/60 - hour)*60);
	sec = Math.floor(((t/60/60 - hour)*60 - minute)*60);

	sec = sec < 10 ? `0${sec}`: `${sec}`;
	minute = minute < 10 ? `0${minute}`: `${minute}`;
	h1 = hour < 10 ? `0${hour}`: `${hour}`;

	return hour > 0 ? `${h1}:${minute}:${sec}` : `${minute}:${sec}`;
}