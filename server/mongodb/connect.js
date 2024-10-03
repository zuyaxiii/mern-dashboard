import mongoose from "mongoose";

const connectDB = (mongoURI) => {
    mongoose.set('strictQuery', true);

    mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.log(error));
}

export default connectDB;