import mongoose from "mongoose";
const jobSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: [true, "Company name is required"],
        },
        position: {
            type: String,
            required: [true, "job position is required"],
            minlength: 100,
        },
        status: {
            type: String,
                enum: ["pending", "reject","interview"],
                default:"pending",
        },
        wotkType:{
            type: String,
            enum:["full-time","part-time","internship","contaract"],
            default:"full-time",
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
        worklocation:{
            type:String,
            default:"pune",
        }
    }
)