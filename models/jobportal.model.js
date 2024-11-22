const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: [true, "Company name is required"],
        },
        position: {
            type: String,
            required: [true, "Job position is required"],
            minlength: 100, // This seems unusual, might want to verify if it's needed
        },
        status: {
            type: String,
            enum: ["pending", "reject", "interview"],
            default: "pending",
        },
        workType: {
            type: String,
            enum: ["full-time", "part-time", "internship", "contract"],
            default: "full-time",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        workLocation: {
            type: String,
            default: "pune",
        },
        jobDetails: {
            type: String,
            required: [true, "Job details are required"], // Add custom validation if needed
        },
        jobDescription: {
            type: String,
            required: [true, "Job description is required"], // Add custom validation if needed
        },
        responsibilities: {
            type: [String], // Assuming this will be an array of strings
            required: [true, "Responsibilities are required"], // Add custom validation if needed
        }
    },
    {
        timestamps: true, // Optional: This will automatically add `createdAt` and `updatedAt` fields
    }
);

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;

