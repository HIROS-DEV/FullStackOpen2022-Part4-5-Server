const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		minLength: 3,
	},
	name: String,
	passwordHash: {
		type: String,
		required: true,
	},
	blogs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Blog'
		}
	]
});

userSchema.set('toJSON', {
	transform: (document, returnedObjet) => {
		returnedObjet.id = returnedObjet._id.toString();
		delete returnedObjet._id;
		delete returnedObjet.__v;
		delete returnedObjet.passwordHash;
	},
});

module.exports = mongoose.model('User', userSchema);
