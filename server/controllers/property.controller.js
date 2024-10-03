import mongoose from "mongoose";
import Property from "../models/property.js";
import User from "../models/user.js";

import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_KEY_SECRET,
});

const getAllProperties = async (req, res) => {
    const { _start, _order, _end, _sort, title_like = "", propertyType = "" } = req.query;
    const query = {};

    // สร้าง query ตาม parameter
    if (propertyType) { 
        query.propertyType = propertyType;
    }
    if (title_like) {
        query.title = { $regex: title_like, $options: "i" };
    }

    try {
        const count = await Property.countDocuments(query); // แก้ไขเป็น query แทน { query }
        
        // การสร้าง sortObject จาก _sort และ _order
        const sortObject = {};
        if (_sort && _order) {
            sortObject[_sort] = _order === 'asc' ? 1 : -1; // 1 สำหรับ ascending, -1 สำหรับ descending
        }

        // ค้นหาข้อมูล Property
        const properties = await Property
            .find(query)
            .sort(sortObject) // ใช้ sortObject
            .limit(parseInt(_end) - parseInt(_start)) // แก้ไข limit
            .skip(parseInt(_start)); // แก้ไข skip

        // ส่งผลลัพธ์กลับ
        res.header('X-Total-Count', count);
        res.header('Access-Control-Expose-Headers', 'X-Total-Count');
        
        res.status(200).json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllPropertyDetails = async (req, res) => {
    const { id } = req.params;

    const propertyExists = await Property.findOne({ _id: id }).populate('creator');
    if(propertyExists) {
        res.status(200).json(propertyExists)
    } else { 
        res.status(404).json({ message: 'Property not found' });
    }

}

const createProperty = async (req, res) => {
    try {
        const { title, description, propertyType, location, price, photo, email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const newProperty = new Property({
            title,
            description,
            propertyType,
            location,
            price,
            photo,
            creator: user._id,
        });

        await newProperty.save();
        user.allProperties.push(newProperty._id); // เพิ่ม Property ใน allProperties
        await user.save();

        res.status(201).json(newProperty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, price, description, location, propertyType, photo } = req.body;

        const photoUrl = await cloudinary.uploader.upload(photo);

        await Property.findByIdAndUpdate({ _id: id },            
        { title, price, description, location, propertyType, photo: photoUrl.url || photo });

        res.status(200).json({ message: 'Property updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const propertyToDeleted = await Property.findById({ _id: id }).populate('creator');

            if(!propertyToDeleted) throw new Error("Property not found");

        const sessions = await mongoose.startSession();
            sessions.startTransaction();

        propertyToDeleted.remove({ session: sessions });
        propertyToDeleted.creator.allProperties.pull(propertyToDeleted);

        await propertyToDeleted.creator.save({ session: sessions });
        await sessions.commitTransaction();

            res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export {
    getAllProperties, getAllPropertyDetails, 
    createProperty, updateProperty, 
    deleteProperty
};