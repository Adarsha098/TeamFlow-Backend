import jwt from "jsonwebtoken";
import { User } from "../models.js";
export default async function auth(req,res,next){
 try{
  const token=req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({message:"Please log in."});
  const payload=jwt.verify(token,process.env.JWT_SECRET);
  const user=await User.findById(payload.id).select("-password");
  if(!user) return res.status(401).json({message:"Account not found."});
  req.user=user; next();
 }catch{return res.status(401).json({message:"Session expired. Please log in again."});}
}
