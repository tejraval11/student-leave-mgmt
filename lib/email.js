import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_SERVER_USER,
      to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
  }
}

export function createLeaveSubmittedEmail(studentName, startDate, endDate, reason) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Leave Application Submitted</h2>
      <p>Dear ${studentName},</p>
      <p>Your leave application has been successfully submitted and is pending approval.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Leave Details:</h3>
        <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      
      <p>You will be notified once your application is reviewed by the faculty.</p>
      <p>Best regards,<br>Leave Management System</p>
    </div>
  `
}

export function createLeaveApprovedEmail(studentName, startDate, endDate, facultyComments) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">Leave Application Approved</h2>
      <p>Dear ${studentName},</p>
      <p>Your leave application has been approved!</p>
      
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Leave Details:</h3>
        <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        ${facultyComments ? `<p><strong>Comments:</strong> ${facultyComments}</p>` : ''}
      </div>
      
      <p>Please ensure you have made arrangements for your studies during this period.</p>
      <p>Best regards,<br>Leave Management System</p>
    </div>
  `
}

export function createLeaveRejectedEmail(studentName, startDate, endDate, facultyComments) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">Leave Application Rejected</h2>
      <p>Dear ${studentName},</p>
      <p>Your leave application has been rejected.</p>
      
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Leave Details:</h3>
        <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        ${facultyComments ? `<p><strong>Comments:</strong> ${facultyComments}</p>` : ''}
      </div>
      
      <p>If you have any questions, please contact your faculty advisor.</p>
      <p>Best regards,<br>Leave Management System</p>
    </div>
  `
}

export function createParentNotificationEmail(parentName, studentName, startDate, endDate, reason) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #007bff;">Leave Application Notification</h2>
      <p>Dear ${parentName},</p>
      <p>Your child ${studentName} has submitted a leave application that requires your approval.</p>
      
      <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Leave Details:</h3>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      
      <p>Please log in to the leave management system to review and approve/reject this application.</p>
      <p>Best regards,<br>Leave Management System</p>
    </div>
  `
}
