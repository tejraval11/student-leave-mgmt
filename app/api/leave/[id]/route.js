import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { sendEmail, createLeaveApprovedEmail, createLeaveRejectedEmail } from '@/lib/email'

// GET - Fetch specific leave application
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const leaveApplication = await prisma.leaveApplication.findUnique({
      where: { id },
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
        notifications: true,
        leaveHistory: true
      }
    })

    if (!leaveApplication) {
      return NextResponse.json({ error: 'Leave application not found' }, { status: 404 })
    }

    // Check if user has access to this leave application
    const role = session.user.role
    let hasAccess = false

    switch (role) {
      case 'STUDENT':
        hasAccess = leaveApplication.studentId === session.user.student.id
        break
      case 'FACULTY':
        hasAccess = leaveApplication.facultyId === session.user.faculty.id
        break
      case 'PARENT':
        hasAccess = leaveApplication.student.parentId === session.user.parent.id
        break
      case 'ADMIN':
        hasAccess = true
        break
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(leaveApplication)
  } catch (error) {
    console.error('Error fetching leave application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update leave application (approve/reject/cancel)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, comments } = body
    const role = session.user.role

    // Validate action
    if (!['APPROVE', 'REJECT', 'CANCEL', 'PARENT_APPROVE', 'PARENT_REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get leave application
    const leaveApplication = await prisma.leaveApplication.findUnique({
      where: { id },
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

    if (!leaveApplication) {
      return NextResponse.json({ error: 'Leave application not found' }, { status: 404 })
    }

    // Check permissions and update accordingly
    let updateData = {}
    let historyAction = ''
    let performedBy = ''

    switch (action) {
      case 'APPROVE':
        if (role !== 'FACULTY' && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Only faculty can approve leave' }, { status: 403 })
        }
        if (leaveApplication.facultyId !== session.user.faculty?.id && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        updateData = { 
          status: 'APPROVED',
          facultyComments: comments 
        }
        historyAction = 'APPROVED'
        performedBy = 'FACULTY'
        break

      case 'REJECT':
        if (role !== 'FACULTY' && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Only faculty can reject leave' }, { status: 403 })
        }
        if (leaveApplication.facultyId !== session.user.faculty?.id && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        updateData = { 
          status: 'REJECTED',
          facultyComments: comments 
        }
        historyAction = 'REJECTED'
        performedBy = 'FACULTY'
        break

      case 'CANCEL':
        if (role !== 'STUDENT') {
          return NextResponse.json({ error: 'Only students can cancel their leave' }, { status: 403 })
        }
        if (leaveApplication.studentId !== session.user.student.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        if (leaveApplication.status !== 'PENDING') {
          return NextResponse.json({ error: 'Can only cancel pending applications' }, { status: 400 })
        }
        updateData = { status: 'CANCELED' }
        historyAction = 'CANCELED'
        performedBy = 'STUDENT'
        break

      case 'PARENT_APPROVE':
        if (role !== 'PARENT') {
          return NextResponse.json({ error: 'Only parents can approve leave' }, { status: 403 })
        }
        if (leaveApplication.student.parentId !== session.user.parent.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        updateData = { 
          parentApprovalStatus: 'APPROVED',
          parentComments: comments 
        }
        historyAction = 'PARENT_APPROVED'
        performedBy = 'PARENT'
        break

      case 'PARENT_REJECT':
        if (role !== 'PARENT') {
          return NextResponse.json({ error: 'Only parents can reject leave' }, { status: 403 })
        }
        if (leaveApplication.student.parentId !== session.user.parent.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        updateData = { 
          parentApprovalStatus: 'REJECTED',
          parentComments: comments 
        }
        historyAction = 'PARENT_REJECTED'
        performedBy = 'PARENT'
        break
    }

    // Update leave application
    const updatedApplication = await prisma.leaveApplication.update({
      where: { id },
      data: updateData,
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

    // Create leave history record (upsert to avoid unique constraint error)
    await prisma.leaveHistory.upsert({
      where: { leaveApplicationId: id },
      update: {
        action: historyAction,
        performedBy,
        comments,
        createdAt: new Date()
      },
      create: {
        leaveApplicationId: id,
        studentId: leaveApplication.studentId,
        action: historyAction,
        performedBy,
        comments
      }
    })

    // Create notifications
    let notificationTitle = ''
    let notificationMessage = ''
    let notificationType = ''

    switch (action) {
      case 'APPROVE':
        notificationTitle = 'Leave Application Approved'
        notificationMessage = `Your leave application for ${new Date(leaveApplication.startDate).toLocaleDateString()} to ${new Date(leaveApplication.endDate).toLocaleDateString()} has been approved.`
        notificationType = 'LEAVE_APPROVED'
        break
      case 'REJECT':
        notificationTitle = 'Leave Application Rejected'
        notificationMessage = `Your leave application for ${new Date(leaveApplication.startDate).toLocaleDateString()} to ${new Date(leaveApplication.endDate).toLocaleDateString()} has been rejected.`
        notificationType = 'LEAVE_REJECTED'
        break
      case 'CANCEL':
        notificationTitle = 'Leave Application Canceled'
        notificationMessage = `Your leave application for ${new Date(leaveApplication.startDate).toLocaleDateString()} to ${new Date(leaveApplication.endDate).toLocaleDateString()} has been canceled.`
        notificationType = 'LEAVE_CANCELED'
        break
      case 'PARENT_APPROVE':
        notificationTitle = 'Parent Approved Leave'
        notificationMessage = `Parent has approved the leave application for ${new Date(leaveApplication.startDate).toLocaleDateString()} to ${new Date(leaveApplication.endDate).toLocaleDateString()}.`
        notificationType = 'PARENT_APPROVED'
        break
      case 'PARENT_REJECT':
        notificationTitle = 'Parent Rejected Leave'
        notificationMessage = `Parent has rejected the leave application for ${new Date(leaveApplication.startDate).toLocaleDateString()} to ${new Date(leaveApplication.endDate).toLocaleDateString()}.`
        notificationType = 'PARENT_REJECTED'
        break
    }

    // Create notification for student
    await prisma.notification.create({
      data: {
        leaveApplicationId: id,
        recipientId: leaveApplication.studentId,
        recipientType: 'STUDENT',
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage
      }
    })

    // Send email notifications
    try {
      if (action === 'APPROVE') {
        const email = createLeaveApprovedEmail(
          leaveApplication.student.name,
          leaveApplication.startDate,
          leaveApplication.endDate,
          comments
        )
        await sendEmail(
          leaveApplication.student.user.email,
          'Leave Application Approved',
          email
        )
      } else if (action === 'REJECT') {
        const email = createLeaveRejectedEmail(
          leaveApplication.student.name,
          leaveApplication.startDate,
          leaveApplication.endDate,
          comments
        )
        await sendEmail(
          leaveApplication.student.user.email,
          'Leave Application Rejected',
          email
        )
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
    }

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error('Error updating leave application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Cancel leave application (only for students)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const leaveApplication = await prisma.leaveApplication.findUnique({
      where: { id }
    })

    if (!leaveApplication) {
      return NextResponse.json({ error: 'Leave application not found' }, { status: 404 })
    }

    if (leaveApplication.studentId !== session.user.student.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (leaveApplication.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only cancel pending applications' }, { status: 400 })
    }

    // Delete the leave application
    await prisma.leaveApplication.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Leave application canceled successfully' })
  } catch (error) {
    console.error('Error canceling leave application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
