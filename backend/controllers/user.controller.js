import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import bcrypt from "bcrypt";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
	publicKey: "public_3drUYVPhfAdqQjgWKZQ/Zi54qR0=",
	privateKey: "private_nCy9YDmZcf2ItA1ILVa3lfSdKGk=",
	urlEndpoint: "https://ik.imagekit.io/sbat11",
});

export const getUserProfile = async (req, res) => {
    const {username} = req.params;

    try{
        const user = await User.findOne({username}).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json(user);
    } catch(error){
        console.log("Error in getUserProfile: ", error.message);
        res.status(500).json({error: error.message});
    }
}
export const followUnfollowUser = async(req, res) => {
    try{
        const {id} = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if(id === req.user._id.toString()){
            return res.status(400).json({error: "You cannot follow yourself"});
        }
        if(!userToModify || !currentUser){
            return res.status(400).kson({ error: "User not found"});
        }
        const isFollowing = currentUser.following.includes(id);

        if(isFollowing){
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id} });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id} })
            res.status(200).json({ message: "User unfollowed"})
        } else{
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id} });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id} })

            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });

            await newNotification.save();

            res.status(200).json({ message: "User followed"})
        }
    } catch(error){
        console.log("Error in followUnfollowUser: ", error.message);
        res.status(500).json({error: error.message});
    }
}
export const getSuggestedUsers = async(req, res) =>{
    try{
        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match:{
                    _id: {$ne:userId}
                }
            },
            {$sample: {size: 10}}
        ])

        const filteredUsers = users.filter(user=>!usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0,4);

        suggestedUsers.forEach(user=>user.password=null)

        res.status(200).json(suggestedUsers);
    } catch (error){
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).json({error: error.message});
    }
}
export const updateUser = async(req, res) =>{
    const {fullName, email, username, currentPassword, newPassword, bio, link} = req.body;
    let {profileImg, coverImg} = req.body;

    const userId = req.user._id;

    try{
        let user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error: "You must provide both current and new password"});
        }
        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch){
                return res.status(400).json({error: "Current password is incorrect"});
            }
            if(newPassword.length < 6){
                return res.status(400).json({ error: "Password must be at least 6 characters long" })
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }
        if(profileImg){
            if(user.profileImg){
                const pImg = user.profileImg.split("/").pop().split(".")[0];
                imagekit.deleteFile(pImg, function(error, result){
                    if(error)
                        console.log(error);
                    else
                        console.log(result);
                })
                imagekit.upload({
                    file : profileImg, //required
                    fileName : "profileImg",   //required
                }, function(error, result) {
                    if(error) 
                        console.log(error);
                    else 
                        console.log(result);
                });
            }
        }
        if(coverImg){
            if(user.coverImg){
                const cImg = user.coverImg.split("/").pop().split(".")[0];
                imagekit.deleteFile(cImg, function(error, result){
                    if(error)
                        console.log(error);
                    else
                        console.log(result);
                })
                imagekit.upload({
                    file : coverImg, //required
                    fileName : "coverImg",   //required
                }, function(error, result) {
                    if(error) 
                        console.log(error);
                    else 
                        console.log(result);
                });
            }
        }
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save()

        //Password is null in status as it was saved before
        user.password = null;
        
        return res.status(200).json(user);

    } catch(error){
        console.log(error);
        res.status(500).json({error: error.message});
    }
}