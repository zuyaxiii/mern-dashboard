import mongoose from "mongoose";

const Userschema = new mongoose.Schema({
    name: { type: String, required: true }, 
    email: { type: String, required: true },
    avatar: { type: String, required: true },
    allProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }] // เปลี่ยนให้เป็น Array
});

const userModel = mongoose.model("User", Userschema);

export default userModel;
