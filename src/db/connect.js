import { connect } from "mongoose";

const connectDB = async (uri) => {
    try {
        return await connect(uri);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export default connectDB;