const _ = require('lodash');

const dummy = (blogs) => {
	return 1;
};

const totalLikes = (blogs) => {
	const blog = blogs.map((blog) => blog.likes);

	const reducer = (sum, item) => {
		return sum + item;
	};

	return blog.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
	const mostLikesBlog = blogs.reduce((pre, crr) =>
		pre.likes > crr.likes ? pre : crr
	);

	const returnedBlogObject = {
		title: mostLikesBlog.title,
		author: mostLikesBlog.author,
		likes: mostLikesBlog.likes,
	};

	return returnedBlogObject;
};

module.exports = { dummy, totalLikes, favoriteBlog };
