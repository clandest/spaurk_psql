
var fs = require('fs');

module.exports = function(app, db, upload){

	app.get('/', function(req, res, next){

		db('posts')
		.then(function(posts){
			res.render('index.html',{
				messages: req.flash('alert'),
				posts: posts,
				isLogged: req.session.isLogged,
				user: req.session.user,
				accountImage: req.session.accountImage,
			});
		})

	});

	app.get('/delete/:id', function(req, res, next){
		var postId = req.params.id;
		var postAudio;
		var postImage;
			db('posts')
			.where({ id: postId })
			.then(function(deletedPost){
				postAudio = deletedPost[0].audioFile;
				postImage = deletedPost[0].imageFile;
				return db('watchlist')
					.where({ post_id: deletedPost[0].id })
			})
			.then(function(watchlist){
				if(watchlist != ''){
					return db('watchlist')
					.where({ post_id: postId })
					.del()
					.then(function(watchlist){
						fs.unlink('views/static/uploads/' + postAudio), function(err){
							if(err)
								console.log(err);
							else
								console.log('deleted audio ' + postAudio);	
						};
						fs.unlink('views/static/uploads/' + postImage), function(err){
							if(err)
								console.log(err);
							else
								console.log('deleted image ' + postImage);	
						};
						return db('posts')
							.where('id', postId)
							.del()
					})
					.catch(function(error){
						console.log(error);
					});
				}else{
					return db('posts')
						.where({ id: postId })
						.del()
				}
			})
			.then(function(deleted){
				console.log('deleted post ');
				console.log(deleted);
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
	});


	app.get('/register', function(req, res, done){
			res.render('register.html',{
				messages: req.flash('alert')
			});
	});

	app.post('/register', upload.single('image'), function(req, res, next){
		var username = req.body.username;
		var password = req.body.password;
		var email		= req.body.email;
		var date =	new Date();
		var profileImage;
		if(req.file)
			var profileImage = req.file.filename;
		else
			var profileImage = 'defaultProfile.png';
		
		db('users').insert({
			username: username,
			password: password,
			email: email,
			created_at: date,
			profileImage: profileImage
		})
		.then(function(user){
			return db('users')
				.where({ username: username });
		})
		.then(function(user){
			username = user[0].username;
			profileImage = user[0].profileImage;
			return db('profiles')
				.insert({ user_id: user[0].uid });
		})
		.then(function(profile){
			req.session.regenerate(function(){
				req.flash('alert', 'user registered');
				req.session.user = username;
				req.session.accountImage = profileImage;
				req.session.isLogged = true;
				res.redirect('/p/' + username);
			});
		})
		.catch(function(error){
			req.flash('alert', 'Username taken');
			res.redirect('/register');
		});

	});

	app.post('/login/', function(req, res, next){
		var username = req.body.username;
		var password = req.body.password;
		
		db('users').where({ username: username, password: password }).then(function(user){
			if(user != ''){
				req.session.regenerate(function(){
					req.session.user = user[0].username;
					req.session.accountImage = user[0].profileImage;
					req.session.isLogged = true;
					res.redirect('/');
				});
			}else{
				req.flash('alert', 'Invalid username or password');
				res.redirect('/register');
			}
		});
	});

	app.get('/logout', function(req, res, next){
		req.session.destroy(function(){
			res.redirect('/');
		});
	});

	app.get('/upload', function(req, res, next){
		if(!req.session.isLogged){
			req.flash('alert', 'Login to make a new upload');
			res.redirect('/')
		} else {
			res.render('upload.html', {
				title: 'New Upload',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				isLogged: req.session.isLogged
			});
		}
	});

	var manageUpload = upload.fields([{ name: 'fileElem', maxCount: 1 }, { name: 'imageElem', maxCount: 1 } ]);
	app.post('/upload', manageUpload, function(req, res){
		var user = req.session.user;
		var userId;
		var title = req.body.title;
		var artist = req.body.artist;
		var start = req.body.start;
		var stop = req.body.stop;
		var genre = req.body.genre;
		var tags = req.body.tags;
		var category = req.body.categoryList;
		var audioFile = req.files['fileElem'][0].filename;
		if(typeof req.files['imageElem'] !== "undefined")
			var imageFile = req.files['imageElem'][0].filename;

		db('users')
		.where({ username: user })
		.select('uid')
		.then(function(user){
			userId = user[0].uid;	
			return db('posts')
				.insert({ user_id: userId,
									title: title,	
									artist: artist,
									start: start,
									stop: stop,
									genre: genre,
									tags: tags,
									category: category,
									audioFile: audioFile,
									imageFile: imageFile })
		})
		.then(function(post){
			req.flash('alert', 'succesfull upload');	
			res.status('204').end();
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.post('/p/:user/update/about', upload.single('image'), function(req, res, next){
		var user = req.session.user;
		var profileUser = req.params.user;
		var about = req.body.about;
		var flashBanner = req.body.flashBanner;
		var userId;
		var oldProfileImage;

		if(req.file && user == profileUser){
			db('users')
			.where({ username: user })
			.select('profileImage')
			.then(function(profileImage){
				oldProfileImage = profileImage[0].profileImage;	
				return db('users')
				.where({ username: user }).select('uid')
				.update({ profileImage: req.file.filename })
			})
			.then(function(update){
				return db('users')
					.where({ username: user })
					.select('profileImage')
			})
			.then(function(profileImage){
				req.session.accountImage = profileImage[0].profileImage;
				res.status('204').end();
				if(oldProfileImage != 'defaultProfile.png')
					fs.unlink('views/static/uploads/' + oldProfileImage);
			})
			.catch(function(error){
				console.log(error);
			});
		}

		if(flashBanner && user == profileUser){
			db('users')
			.where({ username: user }).select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('users')
					.where({ username: profileUser })
					.select('uid');
			})
			.then(function(profileUser){
				return db('profiles')
					.where({ user_id: profileUser[0].uid })	
					.update({
						flashBanner: req.body.flashBanner
					})
			})
			.then(function(profile){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}

		if(about && user == profileUser){
			db('users')
			.where({ username: user }).select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('users')
					.where({ username: profileUser })
					.select('uid');
			})
			.then(function(profileUser){
				return db('profiles')
					.where({ user_id: profileUser[0].uid })	
					.update({
						about: req.body.about,
					})
			})
			.then(function(profile){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}

	});
	
		
	app.get('/p/:user', function(req, res){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;

		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUser[0].uid })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('posts')
				.where({ user_id: profileUserId })
		})
		.then(function(posts){
			res.render('profile.html', {
				title: req.params.user + ' Profile',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: req.params.user,
				profileUserId,
				posts: posts
			});
		})
		.catch(function(error){
			console.log(error);
		});


	});

	app.get('/watchlist/:id', function(req, res){
		var user = req.session.user;
		var postId = req.params.id;
		var userId;
		db('users')
		.where({ username: user })
		.select('uid')
		.then(function(user){
			userId = user[0].uid;
			return db('watchlist')
				.where({ user_id: user[0].uid, post_id: postId })
		})
		.then(function(watchlist){
			if(watchlist != ''){
				return db('watchlist')
					.where({ 'watchlist.user_id': watchlist[0].user_id, 
								 'watchlist.post_id': watchlist[0].post_id })
					.del()
			}else{
				return db('watchlist')
					.insert({ user_id: userId, post_id: postId })
			}
		})
		.then(function(success){
			res.status('204').end();
		})
		.catch(function(error){
			console.log(error);
		});
	});

	app.get('/p/:user/watchlist', function(req, res){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;

		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUserId })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('watchlist')
				.where('watchlist.user_id', profileUserId)
				.join('posts', 'watchlist.post_id', 'posts.id')
		})
		.then(function(watchlists){
			res.render('watchlist.html', {
				title: req.params.user + ' Watchlist',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: req.params.user,
				profileUserId: profileUserId,
				posts: watchlists
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.get('/follows/:id', function(req, res, next){

		var user = req.session.user;
		var profileId = req.params.id;
		var userId;
		if(user){
			db('users')
			.where({ username: user })
			.select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('follows')
					.where({ user_id: user[0].uid, follow_id: profileId })
			})
			.then(function(follow){
				if(follow != ''){
					return db('follows')
						.where({ 'follows.user_id': follow[0].user_id, 
									 'follows.follow_id': follow[0].follow_id })
						.del()
				}else{
					return db('follows')
						.insert({ user_id: userId, follow_id: profileId })
				}
			})
			.then(function(success){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}else{
			res.status('204').end();
		}
	
	});

	app.get('/p/:user/following', function(req, res, next){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;

		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUserId })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('follows')
				.where('follows.user_id', profileUserId)
				.join('users', 'follows.follow_id', 'users.uid')
		})
		.then(function(follows){
			console.log(follows);
			res.render('following.html', {
				title: req.params.user + ' Following',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: req.params.user,
				profileUserId: profileUserId,
				followers: follows
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.get('/p/:user/followers', function(req, res, next){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;

		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUserId })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('follows')
				.where('follows.follow_id', profileUserId)
				.join('users', 'follows.user_id', 'users.uid')
		})
		.then(function(follows){
			console.log(follows);
			res.render('following.html', {
				title: req.params.user + ' Following',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: req.params.user,
				profileUserId: profileUserId,
				followers: follows
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});


	app.get('/p/:user/comments', function(req, res, next){
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;

		db('users')
		.where('username', profileUser)
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where('user_id', profileUser[0].uid)
		})
		.then(function(profile){
			profileAbout = profile[0].about;
			profileFlashBanner = profile[0].flashBanner;
			return db('comments')
				.where('profile_id', profile[0].id)
				.join('users', 'comments.user_id', 'users.uid')
				.select('comments.id',
								'comments.body',
								'comments.created_at',
								'comments.replies_id',
								'users.username',
								'users.profileImage')
		})
		.then(function(comments){
			res.render('comments.html', {
				messages: req.flash('alert'),
				isLogged: req.session.isLogged,
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				userProfile: req.params.user,
				about: profileAbout,
				profileUserId: profileUserId,
				flashBanner: profileFlashBanner,
				comments: comments
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.post('/p/:user/comment', function(req, res, next){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var comment = req.body.newComment;
		var userId;

		db('users').where({ username: loginUser })
		.then(function(user){
			userId = user[0].uid;
			return user[0].uid;
		})
		.then(function(userId){
			return db('users').where({ username: profileUser });
		})
		.then(function(profileUser){
			return profileUser[0].uid;
		})
		.then(function(profileId){
			return db('profiles').where({ user_id: profileId });
		})
		.then(function(profile){
			return profile[0].id;
		})
		.then(function(profileId){
			return db('comments').insert({ 
				body: comment, 
				user_id: userId, 
				profile_id: profileId,
				created_at: new Date() });
		})
		.then(function(comment){
			req.flash('alert', 'post successfull');
			res.status('204').end();
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.post('/p/:user/comment/reply', function(req, res, next){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var reply = req.body.newReply;
		var commentId = req.body.commentId;
		var userId;

		db('users').where({ username: loginUser })
		.then(function(user){
			userId = user[0].uid;
			return user[0].uid;
		})
		.then(function(userId){
			return db('users').where({ username: profileUser }).select('uid');
		})
		.then(function(profileUser){
			return profileUser[0].uid;
		})
		.then(function(profileId){
			return db('profiles').where({ user_id: profileId }).select('id');
		})
		.then(function(profile){
			return profile[0].id;
		})
		.then(function(profileId){
			return db('comments').insert({ 
				body: reply, 
				user_id: userId, 
				profile_id: profileId, 
				replies_id: commentId, 
				created_at: new Date() });
		})
		.then(function(reply){
			res.status('204').end();
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.get('/p/:user/support', function(req, res){

		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;

		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUser[0].uid })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			res.render('support.html', {
				title: req.params.user + ' Support',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				profileUserId: profileUserId,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});

};
