import User from '../models/user.model.js'
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
	publicKey: "public_3drUYVPhfAdqQjgWKZQ/Zi54qR0=",
	privateKey: "private_nCy9YDmZcf2ItA1ILVa3lfSdKGk=",
	urlEndpoint: "https://ik.imagekit.io/sbat11",
});

export const createPost = async (req, res) => {
	try {
		

		const { text } = req.body;
		let { img } = req.body;
		const userId = req.user._id.toString();

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!text && !img) {
			return res.status(400).json({ error: "Post must have text or image" });
		}
		imagekit.upload({
			file : img, //required
			fileName : "m",   //required
		}, function(error, result) {
			if(error) 
				console.log(error);
			else 
				console.log(result);
		});

		const newPost = new Post({
			user: userId,
			text,
			img,
		});

		await newPost.save();
		res.status(201).json(newPost);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
	}
};

export const deletePost = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({error: "Post not found"});
        }

        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({error: "You are not allowed to delete this post"})
        }

        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0];
            imagekit.deleteFile(imgId, function(error, result){
				if(error)
					console.log(error);
				else
					console.log(result);
			})
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully"})
    } catch(error){
        console.log("Error in deletePost controller: ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const commentOnPost = async (req, res) => {
    try{
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if(!text){
            return res.status(400).json({error: "You must provide a comment"});
        }
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }
        const comment = {user: userId, text};

        post.comments.push(comment);
        await post.save();

        res.status(200).json(post);
    }
    catch(error){
        console.log("Error in commentOnPost controller: ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
			await notification.save();

			const updatedLikes = post.likes;
			
			res.status(200).json(post.likes);
		}
    } catch(error){
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const getAllPosts = async (req, res) => {
    try{
        const posts = await Post.find().sort({ createAt: -1}).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        });

        if(posts.length === 0){
            return res.status(200).json([]);
        }
        res.status(200).json(posts);
    } catch(error){
        console.log("Error in getAllPosts controller: ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.user._id;
    try{
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"});
        }

        const likedPosts = await Post.find({_id: {$in: user.likedPosts} })
        .populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(likedPosts);
    } catch(error){
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const getFollowingPosts = async (req, res) =>{
    try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};