import {Router} from "express";
import {Ticket,Project} from "../models.js";
import auth from "../middleware/auth.js";
const router=Router();router.use(auth);
const statuses=["To Do","In Progress","Done"];
const access=(id,uid)=>Project.findOne({_id:id,$or:[{owner:uid},{teamMembers:uid}]});
router.get("/",async(req,res)=>{
 const {project,status,priority,assignee,search,sort="newest"}=req.query;
 if(!project||!(await access(project,req.user._id)))return res.status(404).json({message:"Project not found."});
 const q={project};
 if(status&&statuses.includes(status))q.status=status;
 if(priority)q.priority=priority;
 if(assignee)q.assignee=assignee==="unassigned"?null:assignee;
 if(search)q.$or=[{title:{$regex:search,$options:"i"}},{description:{$regex:search,$options:"i"}}];
 const order=sort==="oldest"?{createdAt:1}:sort==="title"?{title:1}:{createdAt:-1};
 res.json(await Ticket.find(q).populate("assignee","name email").populate("reporter","name").populate("comments.user","name").sort(order));
});
router.post("/",async(req,res)=>{
 const {project,title,description,priority,assignee}=req.body;const p=await access(project,req.user._id);
 if(!p)return res.status(404).json({message:"Project not found."});
 if(!title?.trim())return res.status(400).json({message:"Ticket title is required."});
 if(assignee&&!p.teamMembers.some(x=>x.toString()===assignee))return res.status(400).json({message:"Assignee must be a project member."});
 const t=await Ticket.create({project,title:title.trim(),description:description||"",priority:priority||"Medium",reporter:req.user._id,assignee:assignee||null});
 res.status(201).json(await t.populate(["assignee","reporter"]));
});
router.patch("/:id",async(req,res)=>{
 const t=await Ticket.findById(req.params.id);
 if(!t||!(await access(t.project,req.user._id)))return res.status(404).json({message:"Ticket not found."});
 for(const k of ["title","description","priority","status","assignee"])if(req.body[k]!==undefined)t[k]=req.body[k]??(k==="assignee"?null:t[k]);
 if(!statuses.includes(t.status))return res.status(400).json({message:"Invalid status."});
 const p=await Project.findById(t.project);
 if(t.assignee&&!p.teamMembers.some(x=>x.toString()===t.assignee.toString()))return res.status(400).json({message:"Assignee must be a project member."});
 await t.save();res.json(await t.populate(["assignee","reporter","comments.user"]));
});
router.delete("/:id",async(req,res)=>{
 const t=await Ticket.findById(req.params.id);
 if(!t||!(await access(t.project,req.user._id)))return res.status(404).json({message:"Ticket not found."});
 if(!t.reporter.equals(req.user._id)&&!(await Project.exists({_id:t.project,owner:req.user._id})))return res.status(403).json({message:"Only the reporter or project owner can delete this ticket."});
 await t.deleteOne();res.json({message:"Ticket deleted."});
});
router.post("/:id/comments",async(req,res)=>{
 const t=await Ticket.findById(req.params.id);
 if(!t||!(await access(t.project,req.user._id)))return res.status(404).json({message:"Ticket not found."});
 if(!req.body.text?.trim())return res.status(400).json({message:"Comment cannot be empty."});
 t.comments.push({user:req.user._id,text:req.body.text.trim()});await t.save();
 res.json(await t.populate("comments.user","name"));
});
export default router;
