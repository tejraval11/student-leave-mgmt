const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')
  
  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.notification.deleteMany()
  await prisma.leaveHistory.deleteMany()
  await prisma.leaveApplication.deleteMany()
  await prisma.student.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.faculty.deleteMany()
  await prisma.user.deleteMany()
  
  // Create users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create parent user
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@example.com',
      password: hashedPassword,
      role: 'PARENT',
      parent: {
        create: {
          name: 'John Parent',
          phone: '+1234567890',
          email: 'parent@example.com'
        }
      }
    },
    include: {
      parent: true
    }
  })

  // Create faculty users
  const faculty1User = await prisma.user.create({
    data: {
      email: 'faculty@example.com',
      password: hashedPassword,
      role: 'FACULTY',
      faculty: {
        create: {
          employeeId: 'FAC001',
          name: 'Dr. John Smith',
          department: 'Computer Science',
          designation: 'Associate Professor'
        }
      }
    },
    include: {
      faculty: true
    }
  })

  const faculty2User = await prisma.user.create({
    data: {
      email: 'faculty2@example.com',
      password: hashedPassword,
      role: 'FACULTY',
      faculty: {
        create: {
          employeeId: 'FAC002',
          name: 'Prof. Sarah Johnson',
          department: 'Mathematics',
          designation: 'Professor'
        }
      }
    },
    include: {
      faculty: true
    }
  })

  // Create student user
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password: hashedPassword,
      role: 'STUDENT',
      student: {
        create: {
          rollNumber: 'STU001',
          name: 'Alice Student',
          department: 'Computer Science',
          year: 3,
          parentId: parentUser.parent.id
        }
      }
    },
    include: {
      student: true
    }
  })

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Create some sample leave applications
  const leaveApplication1 = await prisma.leaveApplication.create({
    data: {
      studentId: studentUser.student.id,
      facultyId: faculty1User.faculty.id,
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-02-17'),
      reason: 'Family function - cousin\'s wedding',
      status: 'PENDING',
      parentApprovalStatus: 'PENDING'
    }
  })

  const leaveApplication2 = await prisma.leaveApplication.create({
    data: {
      studentId: studentUser.student.id,
      facultyId: faculty1User.faculty.id,
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-01-22'),
      reason: 'Medical appointment - dental checkup',
      status: 'APPROVED',
      parentApprovalStatus: 'APPROVED',
      facultyComments: 'Approved with medical documentation'
    }
  })

  const leaveApplication3 = await prisma.leaveApplication.create({
    data: {
      studentId: studentUser.student.id,
      facultyId: faculty2User.faculty.id,
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-12'),
      reason: 'Personal reasons',
      status: 'REJECTED',
      parentApprovalStatus: 'APPROVED',
      facultyComments: 'Rejected due to insufficient reason provided'
    }
  })

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        leaveApplicationId: leaveApplication1.id,
        recipientId: studentUser.student.id,
        recipientType: 'STUDENT',
        type: 'LEAVE_SUBMITTED',
        title: 'Leave Application Submitted',
        message: 'Your leave application for Feb 15-17 has been submitted and is pending approval.'
      },
      {
        leaveApplicationId: leaveApplication1.id,
        recipientId: faculty1User.faculty.id,
        recipientType: 'FACULTY',
        type: 'LEAVE_SUBMITTED',
        title: 'New Leave Application',
        message: 'A new leave application has been submitted by Alice Student for Feb 15-17.'
      },
      {
        leaveApplicationId: leaveApplication1.id,
        recipientId: parentUser.parent.id,
        recipientType: 'PARENT',
        type: 'PARENT_APPROVAL_REQUIRED',
        title: 'Leave Application Requires Approval',
        message: 'Your child Alice Student has submitted a leave application that requires your approval.'
      },
      {
        leaveApplicationId: leaveApplication2.id,
        recipientId: studentUser.student.id,
        recipientType: 'STUDENT',
        type: 'LEAVE_APPROVED',
        title: 'Leave Application Approved',
        message: 'Your leave application for Jan 20-22 has been approved.'
      },
      {
        leaveApplicationId: leaveApplication3.id,
        recipientId: studentUser.student.id,
        recipientType: 'STUDENT',
        type: 'LEAVE_REJECTED',
        title: 'Leave Application Rejected',
        message: 'Your leave application for Jan 10-12 has been rejected.'
      }
    ]
  })

  // Create leave history
  await prisma.leaveHistory.createMany({
    data: [
      {
        leaveApplicationId: leaveApplication2.id,
        studentId: studentUser.student.id,
        action: 'APPROVED',
        performedBy: 'FACULTY',
        comments: 'Approved with medical documentation'
      },
      {
        leaveApplicationId: leaveApplication3.id,
        studentId: studentUser.student.id,
        action: 'REJECTED',
        performedBy: 'FACULTY',
        comments: 'Rejected due to insufficient reason provided'
      }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('\nSample login credentials:')
  console.log('Student: student@example.com / password123')
  console.log('Faculty: faculty@example.com / password123')
  console.log('Parent: parent@example.com / password123')
  console.log('Admin: admin@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
