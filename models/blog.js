const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
	url: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	author: String,
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	likes: {
		type: Number,
		required: true,
		default: 0,
	},
});

blogSchema.set('toJSON', {
	transform: (document, returnedObjet) => {
		returnedObjet.id = returnedObjet._id.toString();
		delete returnedObjet._id;
		delete returnedObjet.__v;
	},
});

module.exports = mongoose.model('Blog', blogSchema);
