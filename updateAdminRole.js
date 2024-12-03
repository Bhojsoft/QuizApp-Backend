require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const Admin = require('./models/admin'); // Adjust the path as needed

const dbUri = process.env.MONGO_URI || 'mongodb+srv://pagarsagar1508:vHVtLQrqkcl6ld8p@demoapi.hj9fo.mongodb.net';

async function setMainAdmin() {
  try {
    if (!dbUri) {
      throw new Error('MONGO_URI is not defined in the environment variables.');
    }

    console.log('Connecting to database...');
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(dbUri);
      console.log('Database connected successfully');
    } else {
      console.log('Database is already connected');
    }

    console.log('Database connection state:', mongoose.connection.readyState);

    // Log the URI for debugging
    console.log('Database URI:', dbUri);

    // Verify all admins in the database
    const allAdmins = await Admin.find({});
    console.log('Number of admins found:', allAdmins.length);
    console.log('Admin data:', allAdmins);

    if (allAdmins.length === 0) {
      console.log('No admins found in the database.');
      return;
    }

    // Log the specific admin search
    const adminId = new mongoose.Types.ObjectId('6711fd4406e90634cb699f4f');
    const specificAdmin = await Admin.findById(adminId);
    if (specificAdmin) {
      console.log('Specific Admin:', specificAdmin);
    } else {
      console.log('Specific admin not found.');
    }

    // Update the admin role if it exists
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { role: 'main-admin' },
      { new: true }
    );

    if (updatedAdmin) {
      console.log('Updated Admin:', updatedAdmin);
    } else {
      console.log('Admin not found.');
    }
  } catch (err) {
    console.error('Error updating admin role:', err.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
      console.log('Database connection closed.');
    }
  }
}

setMainAdmin();
