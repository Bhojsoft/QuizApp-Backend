/**
 * 
 */

  
  
  /**
   * @Email_Templates { registrationSuccess }
   */
  
  const banner = "https://ximboatest.s3.amazonaws.com/Innner+banner.jpg";
  const emailTemplates = {
    instituteRequest: {
      subject: "New Institute Approval Request",
      html: (instituteName, createdBy, instituteId, logoUrl) => `
        <h3>New Institute Approval Request</h3>
          <p>A new institute has been created and is awaiting your approval:</p>
          <ul>
            <li><strong>Institute Name:</strong> ${instituteName}</li>
            <li><strong>Created By Admin ID:</strong> ${createdBy}</li>
            <li><strong>Institute ID:</strong> ${instituteId}</li>
          </ul>
          <p>Please review and approve the institute.</p>`,
    },
    registrationSuccess: {
      subject: "Welcome to QuizApp!",
      html: (name, logoUrl) => `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center;">
            <img src="${logoUrl}" alt="Ximboa Logo" style="width: 150px; margin-bottom: 20px;">
          </div>
          <h2>Hello ${name},</h2>
          <p>Thank you for registering at <strong>Ximboa</strong>! We're excited to have you on board.</p>
          <p>If you have any questions, feel free to contact us at support@Ximboa.com.</p>
          <p>Best regards,<br>Ximboa Team</p>
        </div>`,
    },
    loginSuccess: {
      subject: "Login Successful",
      html: (name, logoUrl) => `
      <html>
    <head>
      <style>
        * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
  }
  
  body {
      font-family: Arial, sans-serif;
  }
  
  .container {
      width: 100%;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(17, 12, 46, 0.1);
      border-radius: 10px;
  }
  
  
  .header {
      display: flex;
      justify-content: space-around !important;
      align-items: center; 
      background-color: #E9EEF8;
      padding: 20px;
      border-radius: 10px 10px 0 0;
  }
  
  .header-text {
      text-align: center; 
  }
  
  .logo {
      width: 150px;
      height: auto; 
  }
  
  .subject {
      font-size: 20px;
      
  }
  
  .email a {
      color: #265BBD;
      text-decoration: none;
  }
  
  .banner {
      width: 100%;
      height: auto; 
  }
  
  
  .content {
      padding: 0px 30px;
      margin: 20px;
  }
  
  .congrats-row {
      display: flex;
     justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
  }
  
  .congrats-text {
      font-size: 35px;
      font-weight: bold;
      color: #307DFF;
      padding-top: 8%;
  }
  
  .btn-primary {
      background-color: #265BBD;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
  }
  
  .message-section {
      margin-bottom: 20px;
  }
  
  .table-container {
     
      margin-bottom: 20px;
  }
  
  .info-table {
      width: 60%; 
      border-collapse: collapse;
  }
  
  .info-table td {
      padding: 15px;
      border: 1px solid #ddd;
      text-align: left;
  }
  
  .footer {
      background-color: #265BBD;
      color: white;
      padding: 10px  26px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 0 0 10px 10px;
      gap: 10px;
  }
  
  .footer-link {
      color: white;
      text-decoration: none;
  }
  
  .social-icons {
      display: flex;
      justify-content: center; 
      font-size: 12px;
      flex-direction: row;
  }
  
  .icon-border {
      border: 1px solid white;
      border-radius: 50%;
      color: white;
      text-align: center;
      
  }
  
  .social-icons :hover {
      background-color: #E9EEF8;
      border-radius: 50%;
      color: black;
  }
  
  /* Responsive Styles */
  @media (max-width: 768px) {
      .header {
          flex-direction: column; 
          align-items: center; 
      }
      .logo{
          margin-bottom: 10px;
      }
      .congrats-row {
          flex-direction: column; 
          align-items: center; 
          margin-bottom: 10px;
      }
      .congrats-text {
          margin: 25px 0;
          padding-top: 2%;
      }
      .info-table {
          width: 100%; 
      }
      .btn-primary {
          width: 100%; 
          padding: 15px; 
      }
      .footer {
          flex-direction: column; 
          align-items: center; 
      }
      .message-section{
          width: 100%;
          text-align: justify;
      }
      .social-icons{
          font-size: 12px;
      }
      .content{
          padding: 0px 10px;
      }
      .btn-primary{
          width: 70%;
          padding: 10px 17px;
      }
  }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header Section -->
        <div class="header" style="display:flex;justify-content:space-between">
          <img src=${logoUrl} alt="Ximboa Logo" style="margin-right:30px;" class="logo">
          <div class="header-text">
            <p class="subject">Subject: Course Inquiry</p>
            <p class="email">Received from: <a href="mailto:test@test.com">test@test.com</a></p>
          </div>
        </div>
  
        <img src=${banner} alt="Banner Image" class="banner">
  
        <!-- Content Section -->
        <div class="content">
          <div class="congrats-row">
            <p class="congrats-text">Congratulations!</p>
            </div>
            <button class="btn-primary" style="padding-bottum: 8px">Sign Up for It’s Free</button>
  
          <div class="message-section">
            <p>Hi [Instructor/Institute Name]</p>
            <p>You have received a new inquiry regarding [Course Name].</p>
          </div>
  
          <!-- Table Section -->
          <div class="table-container">
            <table class="info-table">
              <tbody>
                <tr>
                  <td>Name</td>
                  <td>Amit Bhoj</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td><a href="">test@test.com</a></td>
                </tr>
                <tr>
                  <td>Subject</td>
                  <td>Course Inquiry</td>
                </tr>
                <tr>
                  <td>Message</td>
                  <td>When will the batch start?</td>
                </tr>
              </tbody>
            </table>
          </div>
  
          <!-- Dashboard Section -->
          <p>To see your inquiries from one single place, visit your dashboard.</p>
          <button class="btn-primary dashboard-btn" style="margin: 30px 0;">Go to Dashboard</button>
        </div>
  
        <!-- Footer Section -->
        <div class="footer" style="color: white;">
          <a href="#" class="footer-link" style="color: white;">www.ximboa.io</a>
          <div class="social-icons">
            <a href="#" style="color: white;" class="icon-border"><i class="fab fa-facebook-f"></i></a>
            <a href="#" style="color: white;" class="icon-border"><i class="fab fa-twitter"></i></a>
            <a href="#" style="color: white;" class="icon-border"><i class="fab fa-instagram"></i></a>
            <a href="#" style="color: white;" class="icon-border"><i class="fab fa-linkedin-in"></i></a>
            <a href="#" style="color: white;" class="icon-border"><i class="fab fa-youtube"></i></a>
          </div>
          <a href="mailto:contact@ximboa.io" class="footer-link">contact@ximboa.io</a>
        </div>
      </div>
    </body>
  </html>
  
      `,
    },
    resetPassword: {
      subject: "Password Reset Request",
      html: (name, logoUrl, resetLink ) => `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center;">
            <img src="${logoUrl}" alt="Ximboa Logo" style="width: 150px; margin-bottom: 20px;">
          </div>
          <h2>Hello ${name},</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="color: #1a73e8;">Reset Password</a>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Best regards,<br>Ximboa Team</p>
        </div>`,
    },
  
    forgotPassword: {
      subject: "Password Reset Request",
      html: (name, logoUrl ,resetLink) => `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center;">
            <img src="${logoUrl}" alt="Ximboa Logo" style="width: 150px; margin-bottom: 20px;">
          </div>
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password for your <strong>Ximboa</strong> account.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetLink}" style="color: #1a73e8;">Reset Password</a></p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have any questions.</p>
          <p>Best regards,<br>Ximboa Team</p>
        </div>`,
    },
  
  
  
    otp: {
        subject: "Your OTP Code",
        html: (name, logoUrl, otp) => `
            <div>
              <img src="${logoUrl}" alt="XIMBOA Logo" style="height: 50px;" />
              <h2>Hello ${name},</h2>
              <p>Your OTP code is: <strong>${otp}</strong></p>
              <p>This OTP is valid for the next 5 minutes.</p>
            </div>
          `,
      },
    
  };
  
  module.exports = { emailTemplates };
  