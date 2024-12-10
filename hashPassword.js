// Import the bcryptjs library
const bcrypt = require('bcryptjs');

// Define the number of salt rounds
const saltRounds = 10;

// The password to be hashed
const myPlaintextPassword = 'password123';

bcrypt.hash(myPlaintextPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
