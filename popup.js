
let currentVid;
let current = [];

// adding a new bookmark row to the popup
const addNewBm = (bms, bookmark) => {

	// bookmark title element
	const bmTitle = document.createElement('div');
	bmTitle.textContent = bookmark.desc;
	bmTitle.className = 'bookmark-title';

	const editBmTitle = document.createElement('img');
	editBmTitle.src = 'assets/edit.png';
	editBmTitle.title = 'Edit bookmark Title';
	editBmTitle.addEventListener('click', onEdit);

	const playBm = document.createElement('img');
	playBm.src = 'assets/play.png';
	playBm.title = 'Start play from bookmark';
	playBm.addEventListener('click', onPlay);

	const deleteBm = document.createElement('img');
	deleteBm.src = 'assets/delete.png';
	deleteBm.title = 'Delete bookmark';
	deleteBm.addEventListener('click', onDelete);
	
	// bookmark controls - edit bookmark title, play from bookmark
	const bmControls = document.createElement('div');
	bmControls.className = 'bookmark-controls';

	bmControls.appendChild(editBmTitle);
	bmControls.appendChild(playBm);
	bmControls.appendChild(deleteBm);

	const bm = document.createElement('div');
	bm.id = 'bookmark-'+bookmark.time;
	bm.className = 'bookmark';
	bm.setAttribute('timestamp', bookmark.time);
	
	bm.appendChild(bmTitle);
	bm.appendChild(bmControls);
	bms.appendChild(bm);
}

const viewBms = (bmsList) => {
	const bms = document.getElementById("bookmarks");
	bms.innerHTML = ''; // removes anything in the previous list

	if (bmsList && bmsList.length > 0) {
		bmsList.forEach((bookmark) => {
			addNewBm(bms, bookmark);
		});
	}
	else {
		bms.innerHTML = '<i class="row">No bookmarks to show</i>';
	}
}

const saveEditedBmTitle = (bmEle, bmTitle, editTitleBtn) => {
	const newBmTitle = bmTitle.getElementsByTagName('input')[0].value;
	editTitleBtn.setAttribute('data-editing', false);
	editTitleBtn.src = 'assets/edit.png';
	bmTitle.innerHTML = newBmTitle;

	const editedBookmarkTime = bmEle.getAttribute('timestamp');
	const editedBookmark = current.filter(b => (b.time == editedBookmarkTime))[0];
	editedBookmark.desc = newBmTitle;
	chrome.storage.sync.set({[currentVid]: JSON.stringify(current)});
}


const onEdit = (e) => {
	const editTitleBtn = e.target;
	const bookmarkEle = editTitleBtn.parentNode.parentNode;
	const bmTitle = bookmarkEle.getElementsByClassName('bookmark-title')[0];
	const editingAttr = editTitleBtn.getAttribute('data-editing');
	// first time it does not exist and after one edit it becomes false
	const isEditing = !(editingAttr) || editingAttr == "false";

	if(bmTitle) {
		if (isEditing) {
			const bmTitleText = bmTitle.innerHTML;
			bmTitle.innerHTML = '';
			editTitleBtn.src = 'assets/save.png';

			const titleTextBox = document.createElement('input');
			titleTextBox.className = 'textbox';
			titleTextBox.value = bmTitleText;
			titleTextBox.addEventListener('keypress', e => {
				//checking if enter/return key is pressed
				e.keyCode === 13 && saveEditedBmTitle(bookmarkEle, bmTitle, editTitleBtn);
			});

			setTimeout(() => {titleTextBox.select()}); // select textbox text

			// set editing attribute
			editTitleBtn.setAttribute('data-editing', true);

			bmTitle.appendChild(titleTextBox);
		}
		else { // saving
			saveEditedBmTitle(bookmarkEle, bmTitle, editTitleBtn);
		}
	}
}


const onPlay = (e) => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');

	chrome.tabs.query({currentWindow: true, active: true}, tabs => {
		const activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, { type: 'PLAY', value: bookmarkTime });
	});
}


const onDelete = e => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp');

	// deleting a bookmark from popup
	const bookmarkEleToDelete = document.getElementById('bookmark-'+bookmarkTime);
	bookmarkEleToDelete.parentNode.removeChild(bookmarkEleToDelete);

	// send message to delete bookmark
	chrome.tabs.query({currentWindow: true, active: true}, tabs => {
		const activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, { type: 'DELETE', value: bookmarkTime });
	});

	// save
	current = current.filter(b => ( b.time != bookmarkTime));
	chrome.storage.sync.set({[currentVid]: JSON.stringify(current)});
}

document.addEventListener("DOMContentLoaded", () => {

	chrome.tabs.query({currentWindow: true, active: true}, tabs => {
		const activeTab = tabs[0];
		const query_parameters = activeTab.url.split('?')[1];
		const url_parameters = new URLSearchParams(query_parameters);
		currentVid = url_parameters.get('v');

		if (activeTab.url.indexOf('youtube.com') > -1 && currentVid) {
			chrome.storage.sync.get([ currentVid ], data => {
				current = data[currentVid] ? JSON.parse(data[currentVid]) : [];
				viewBms(current);
			});
		}
		else {
			const container = document.getElementsByClassName('container')[0];
			container.innerHTML = '<i class="row">No bookmarks to show</i>';
		}
	});
});
