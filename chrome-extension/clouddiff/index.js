
(async () => {
	const src = chrome.runtime.getURL('clouddiff/bundle.js');
	await import(src);
})();

