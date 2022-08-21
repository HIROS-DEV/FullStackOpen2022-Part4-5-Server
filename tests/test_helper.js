const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
	{
		title: 'Cute Cat',
		author: 'root',
		url: 'https://unsplash.com/photos/nKC772R_qog',
		likes: 5,
	},
	{
		title: 'Greeting Bear',
		author: 'Hiros Dev',
		url: 'https://unsplash.com/photos/qQWV91TTBrE',
		likes: 3,
	},
];

const nonExistingId = async () => {
	const blog = new Blog({
		title: 'willremovethissoon',
		url: 'willremovethissoon',
		likes: 0,
	});
	await blog.save();
	await blog.remove();

	return blog._id.toString();
};

const blogsInDb = async () => {
	const blogs = await Blog.find({}).populate('user', {
		username: 1,
		name: 1,
		id: 1,
	});
	return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
	const users = await User.find({});
	return users.map((u) => u.toJSON());
};

module.exports = {
	initialBlogs,
	nonExistingId,
	blogsInDb,
	usersInDb,
};
