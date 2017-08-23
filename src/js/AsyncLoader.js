export const load = (url, type) => {

	if (typeof url === 'object') {
		url = url.map(filePath => {
			return load(filePath, type);
		});
		return Promise.all(url);
	}

	url = url.substr(0, 3) == 'htt' ? url : '/' + url;

	return new Promise(function(resolve, reject) {
		let r = false;
		let t = undefined;
		let s = undefined;

		switch (type) {
			case 'css':
				t = document.getElementsByTagName("link")[0];
				s = document.createElement("link");
				s.rel = 'stylesheet';
				s.href = url;
				break;

			case 'js':
			default:
				t = document.getElementsByTagName("script")[0];
				s = document.createElement("script");
				s.type = "text/javascript";
				s.src = url;
				s.async = true;

				break;
		}

		s.onload = s.onreadystatechange = function() {
			if (!r && (!this.readyState || this.readyState == "complete")) {
				r = true;
				resolve(this);
				// console.log('onload', this);
			}
		};
		s.onerror = s.onabort = function() {
			// console.log('onerror', this);
			reject()
		};
		t.parentNode.insertBefore(s, t);
	});
};

export const getFile = (type, url) => {
	return new Promise(function(resolve, reject) {
		if (!url) {
			url = type;
			type = 'text/html';
		}

		const xhr = new XMLHttpRequest();
		xhr.open("get", url, true);
		xhr.responseType = type;
		xhr.onload = function() {
			if (xhr.status === 200) {
				resolve(xhr.response);
			} else {
				reject(xhr.status);
			}
		};
		xhr.send();
	});
};

export const getJSON = (url) => {
	return getFile('json', url);
};