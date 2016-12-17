
var mongoose = require('mongoose'),
    bcrypt   = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	profileImage: { type: String, default: 'defaultProfile.png' },
	email:  String,
	created_at: Date,
	updated_at: Date,
	admin: Boolean,
});

var profileSchema = new mongoose.Schema({
	_user: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
	_comments: [{ type: mongoose.Schema.ObjectId, ref: 'ProfileComment' }],
	about: String,
	flashBanner: String,
	profileImage: String,
	created_at: Date,
	updated_at: Date,
});

var profileCommentSchema = new mongoose.Schema({
	_user: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
	_profile: [{ type: mongoose.Schema.ObjectId, ref: 'Profile' }],
	_replies: [{ type: mongoose.Schema.ObjectId, ref: 'ProfileComment' }],
	body: { type: String, required: true },
	created_at: Date,
});

var profileReplySchema = new mongoose.Schema({
	_user: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
	_comments: [{ type: mongoose.Schema.ObjectId, ref: 'ProfileComment' }],
	body: { type: String, required: true },
	created_at: Date,
});

var postSchema = new mongoose.Schema({
	_user: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
	audioFile: { type: String, required: true },
	imageFile: { type: String },
	title: { type: String, required: true },
	artist: { type: String, required: true },
	start: { type: String, required: true },
	stop: { type: String, required: true },
	genre: { type: String, required: true },
	tags: [{ type: String }],
	category: { type: String, default: 'Discover' }

});

userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password, callback){
    return bcrypt.compareSync(password, this.password, callback);
};

var User = mongoose.model('User', userSchema);
var Post = mongoose.model('Post', postSchema);
var Profile = mongoose.model('Profile', profileSchema);
var ProfileComment = mongoose.model('ProfileComment', profileCommentSchema); 
var ProfileReply = mongoose.model('ProfileReply', profileReplySchema); 

module.exports = {
    User: User,
    Post: Post,
		Profile: Profile,
		ProfileComment: ProfileComment,
		ProfileReply: ProfileReply
};
