import {Router} from "express";
import {Project,User,Ticket} from "../models.js";
import auth from "../middleware/auth.js";
const router=Router(); router.use(auth);
const access=(id,uid)=>Project.findOne({_id:id,$or:[{owner:uid},{teamMembers:uid}]});
router.get("/",async(req,res)=>{
 const rows=await Project.find({$or:[{owner:req.user._id},{teamMembers:req.user._id}]}).populate("owner","name email").populate("teamMembers","name email").sort({createdAt:-1});
 res.json(rows);
});
router.post("/",async(req,res)=>{
 if(!req.body.title?.trim()) return res.status(400).json({message:"Project title is required."});
 const p=await Project.create({title:req.body.title.trim(),description:req.body.description||"",owner:req.user._id,teamMembers:[req.user._id]});
 res.status(201).json(await p.populate(["owner","teamMembers"]));
});
router.get("/:id/members",async(req,res)=>{
 const p=await access(req.params.id,req.user._id);
 if(!p)return res.status(404).json({message:"Project not found."});
 res.json(await p.populate("teamMembers","name email").then(x=>x.teamMembers));
});
router.post("/:id/members",async(req,res)=>{
 const p=await Project.findOne({_id:req.params.id,owner:req.user._id});
 if(!p)return res.status(404).json({message:"Project not found or you are not the owner."});
 const member=await User.findOne({email:req.body.email?.toLowerCase().trim()});
 if(!member)return res.status(404).json({message:"No registered user found with that email."});
 if(!p.teamMembers.some(x=>x.equals(member._id)))p.teamMembers.push(member._id);
 await p.save(); res.json(await p.populate("teamMembers","name email"));
});
router.delete("/:id",async(req,res)=>{
 const p=await Project.findOneAndDelete({_id:req.params.id,owner:req.user._id});
 if(!p)return res.status(404).json({message:"Project not found or you are not the owner."});
 await Ticket.deleteMany({project:p._id}); res.json({message:"Project and its tickets deleted."});
});
export default router;
