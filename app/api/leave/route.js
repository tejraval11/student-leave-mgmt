import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { sendEmail, createLeaveSubmittedEmail, createParentNotificationEmail } from '@/lib/email'

// GET - Fetch leave applications based on user role
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = session.user.role

    let whereClause = {}
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status
    }

    // Role-based filtering
    switch (role) {
      case 'STUDENT':
        whereClause.studentId = session.user.student.id
        break
      case 'FACULTY':
        whereClause.facultyId = session.user.faculty.id
        break
      case 'PARENT':
        // Get all leave applications for parent's children
        const parentStudents = await prisma.student.findMany({
          where: { parentId: session.user.parent.id },
          select: { id: true }
        })
        whereClause.studentId = { in: parentStudents.map(s => s.id) }
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
    }

    const leaveApplications = await prisma.leaveApplication.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true,
            parent: {
              include: {
                user: true
              }
            }
          }
        },
        faculty: {
          include: {
            user: true
          }
        },
        notifications: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(leaveApplications)
  } catch (error) {
    console.error('Error fetching leave applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new leave application
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, reason, facultyId, attachmentUrl } = body

    // Validation
    if (!startDate || !endDate || !reason || !facultyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if dates are valid
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    if (start < new Date()) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 })
    }

    // Create leave application
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        studentId: session.user.student.id,
        facultyId,
        startDate: start,
        endDate: end,
        reason,
        attachmentUrl,
        status: 'PENDING',
        parentApprovalStatus: 'PENDING'
      },
      include: {
        student: {
          include: {
            user: true,
            parent: {
              include: {
                user: true
              }
            }
          }
        },
        faculty: {
          include: {
            user: true
          }
        }
      }
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        leaveApplicationId: leaveApplication.id,
        recipientId: session.user.student.id,
        recipientType: 'STUDENT',
        type: 'LEAVE_SUBMITTED',
        title: 'Leave Application Submitted',
        message: `Your leave application for ${start.toLocaleDateString()} to ${end.toLocaleDateString()} has been submitted and is pending approval.`
      }
    })

    // Create notification for faculty
    await prisma.notification.create({
      data: {
        leaveApplicationId: leaveApplication.id,
        recipientId: facultyId,
        recipientType: 'FACULTY',
        type: 'LEAVE_SUBMITTED',
        title: 'New Leave Application',
        message: `A new leave application has been submitted by ${session.user.student.name} for ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`
      }
    })

    // Create notification for parent
    await prisma.notification.create({
      data: {
        leaveApplicationId: leaveApplication.id,
        recipientId: session.user.student.parentId,
        recipientType: 'PARENT',
        type: 'PARENT_APPROVAL_REQUIRED',
        title: 'Leave Application Requires Approval',
        message: `Your child ${session.user.student.name} has submitted a leave application that requires your approval.`
      }
    })

    // Send email notifications
    try {
      // Email to student
      const studentEmail = createLeaveSubmittedEmail(
        session.user.student.name,
        start,
        end,
        reason
      )
      await sendEmail(
        session.user.email,
        'Leave Application Submitted',
        studentEmail
      )

      // Email to parent
      const parentEmail = createParentNotificationEmail(
        session.user.student.parent.name,
        session.user.student.name,
        start,
        end,
        reason
      )
      await sendEmail(
        session.user.student.parent.user.email,
        'Leave Application Requires Your Approval',
        parentEmail
      )

      // Email to faculty
      await sendEmail(
        leaveApplication.faculty.user.email,
        'New Leave Application',
        `A new leave application has been submitted by ${session.user.student.name}. Please review it in the system.`
      )
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(leaveApplication, { status: 201 })
  } catch (error) {
    console.error('Error creating leave application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
