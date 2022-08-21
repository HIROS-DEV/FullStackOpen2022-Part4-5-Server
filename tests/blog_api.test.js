const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);

const User = require('../models/user');
const Blog = require('../models/blog');

describe('when there is initially some blogs saved', () => {
	let user, token;
	beforeEach(async () => {
		await User.deleteMany({});

		const passwordHash = await bcrypt.hash('secret', 10);
		user = new User({ username: 'root', passwordHash });

		await user.save();
		const userForToken = {
			username: user.username,
			id: user._id,
		};

		token = jwt.sign(userForToken, process.env.JWT_SECRET);
		await Blog.deleteMany({});
		await Blog.insertMany(helper.initialBlogs);
	});

	test('blogs are returned as json', async () => {
		await api
			.get('/api/blogs')
			.set('Authorization', `bearer ${token}`)
			.expect(200)
			.expect('Content-Type', /application\/json/);
	});

	test('all blogs are returned', async () => {
		const response = await api
			.get('/api/blogs')
			.set('Authorization', `bearer ${token}`);

		expect(response.body).toHaveLength(helper.initialBlogs.length);
	});

	test('all blogs id is not undefined', async () => {
		const response = await api
			.get('/api/blogs')
			.set('Authorization', `bearer ${token}`);
		const blogId = await response.body.map((blog) => blog.id);

		expect(blogId).toBeDefined();
	});

	describe('addition of a new blog', () => {
		test('succeeds with valid data', async () => {
			const newBlog = {
				url: 'https://unsplash.com/photos/D6TqIa-tWRY',
				title: "Giraffe's Kiss",
				author: 'Andy Holmes',
				likes: 15,
				userId: '62fb4ae7d645763285a91bd8',
			};

			await api
				.post('/api/blogs')
				.send(newBlog)
				.set('Authorization', `bearer ${token}`)
				.expect(201)
				.expect('Content-Type', /application\/json/);

			const blogsAtEnd = await helper.blogsInDb();
			expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

			const titles = blogsAtEnd.map((b) => b.title);
			expect(titles).toContain("Giraffe's Kiss");
		}, 100000);

		test('succeeds with default like number', async () => {
			const newBlog = {
				title: 'Tiger is coming',
				author: 'root',
				url: 'https://unsplash.com/photos/Fbdr6gXJBVY',
			};

			await api
				.post('/api/blogs')
				.send(newBlog)
				.set('Authorization', `bearer ${token}`)
				.expect(201)
				.expect('Content-Type', /application\/json/);

			const blogsAtEnd = await helper.blogsInDb();
			expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

			const likes = await blogsAtEnd.map((b) => b.likes);
			expect(likes).toContain(0);
		}, 100000);

		test('fails with status code 400 if data invaild', async () => {
			const newBlog = {
				author: 'root',
				likes: 20,
			};

			await api
				.post('/api/blogs')
				.send(newBlog)
				.set('Authorization', `bearer ${token}`)
				.expect(400);

			const blogsAtEnd = await helper.blogsInDb();
			expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
		}, 100000);

		test('fails with status code 401 if token invaild', async () => {
			const newBlog = {
				author: 'root',
				likes: 20,
			};

			await api
				.post('/api/blogs')
				.send(newBlog)
				.set('Authorization', `bearer invalidtoken`)
				.expect(401);

			const blogsAtEnd = await helper.blogsInDb();
			expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
		}, 100000);
	});

	describe('updation of a blog', () => {
		test('updates blog with the amount of likes', async () => {
			const blogsAtStart = await helper.blogsInDb();

			const uploadedBlog = {
				title: 'From Cute Cat to Cute Dog',
				author: 'root',
				user: user._id,
				url: 'https://unsplash.com/photos/oU6KZTXhuvk',
				likes: 100,
			};

			const blogToUpdate = blogsAtStart[0];

			await api
				.put(`/api/blogs/${blogToUpdate.id}`)
				.send(uploadedBlog)
				.set('Authorization', `bearer ${token}`)
				.expect(200)
				.expect('Content-Type', /application\/json/);

			const blogsAtEnd = await helper.blogsInDb();
			expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);

			const likes = blogsAtEnd.map((b) => b.likes);
			expect(likes).toContain(100);
		});
	});

	describe('deletion of a blog', () => {
		test('succeeds with status code 204 if id is valid', async () => {
			const blogsAtStart = await helper.blogsInDb();
			const blogToDelete = blogsAtStart[0];

			await api
				.delete(`/api/blogs/${blogToDelete.id}`)
				.set('Authorization', `bearer ${token}`)
				.expect(204);

			const blogsAtEnd = await helper.blogsInDb();

			expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

			const titles = blogsAtEnd.map((b) => b.title);

			expect(titles).not.toContain(blogToDelete.title);
		});
	}, 100000);
});

describe('when there is initially one user in db', () => {
	let user;
	beforeEach(async () => {
		await User.deleteMany({});

		const passwordHash = await bcrypt.hash('secret', 10);
		user = new User({ username: 'root', passwordHash });

		await user.save();
	});

	test('creation succeeds with a fresh username', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: 'mluukkai',
			name: 'Matti Luukkainen',
			password: 'salainen',
		};

		await api
			.post('/api/users')
			.send(newUser)
			.expect(201)
			.expect('Content-Type', /application\/json/);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

		const usernames = usersAtEnd.map((u) => u.username);
		expect(usernames).toContain(newUser.username);
	});

	test('creation fails with proper statuscode and message if username already taken', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: 'root',
			name: 'Superuser',
			password: 'salainen',
		};

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(result.body.error).toContain('username must be unique');

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toEqual(usersAtStart);
	});

	test('creation fails with proper statuscode and message if username is less than 3 characters', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: 'ne',
			name: 'newuser',
			password: '1234',
		};

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(result.body.error).toContain(
			'username must be more than 3 characters'
		);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toEqual(usersAtStart);
	});

	test('creation fails with proper statuscode and message if password is less than 3 characters', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: 'new',
			name: 'newuser',
			password: '12',
		};

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(result.body.error).toContain(
			'password must be more than 3 characters'
		);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toEqual(usersAtStart);
	});

	test('creation fails with proper statuscode and message if username and password do not input', async () => {
		const usersAtStart = await helper.usersInDb();

		const newUser = {
			username: '',
			password: '',
		};

		const result = await api
			.post('/api/users')
			.send(newUser)
			.expect(400)
			.expect('Content-Type', /application\/json/);

		expect(result.body.error).toContain(
			'username and password must be input'
		);

		const usersAtEnd = await helper.usersInDb();
		expect(usersAtEnd).toEqual(usersAtStart);
	});
});

afterAll(() => {
	mongoose.connection.close();
});
