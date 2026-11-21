import mongoose from "mongoose";
const userSchema = new mongoose.Schema({ name:{type:String,required:true,trim:true}, email:{type:String,required:true,unique:true,lowercase:true,trim:true}, password:{type:String,required:true} },{timestamps:true});
const projectSchema = new mongoose.Schema({ title:{type:String,required:true,trim:true}, description:{type:String,default:""}, owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}, teamMembers:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}] },{timestamps:true});
const commentSchema = new mongoose.Schema({ user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}, text:{type:String,required:true,trim:true} },{timestamps:true});
const ticketSchema = new mongoose.Schema({ title:{type:String,required:true,trim:true}, description:{type:String,default:""}, priority:{type:String,enum:["Low","Medium","High","Critical"],default:"Medium"}, status:{type:String,enum:["To Do","In Progress","Done"],default:"To Do"}, project:{type:mongoose.Schema.Types.ObjectId,ref:"Project",required:true}, reporter:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}, assignee:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}, comments:[commentSchema] },{timestamps:true});
export const User=mongoose.model("User",userSchema);
export const Project=mongoose.model("Project",projectSchema);
export const Ticket=mongoose.model("Ticket",ticketSchema);
