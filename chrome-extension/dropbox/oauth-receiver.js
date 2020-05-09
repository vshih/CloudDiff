
'strict';

window.addEventListener('load', () => {
	let token = window.location.hash;
alert(token);
	chrome.runtime.sendMessage(
		{
			type: 'setAuth',
			token: token
		},
		(response) => { /*window.close();*/ }
	);
});

