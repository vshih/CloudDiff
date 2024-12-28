
//const webpack = require('webpack');


module.exports = {
	mode: 'production',

	entry: './src/clouddiff.js',

	output: {
		filename: 'clouddiff/bundle.js',
		path: __dirname + '/chrome-extension',
		globalObject: 'this',
		library: {
			type: 'module',
		},
	},

	experiments: {
		outputModule: true,
	},
};

