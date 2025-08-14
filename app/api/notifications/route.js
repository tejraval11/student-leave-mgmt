import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// GET - Fetch notifications for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const role = session.user?.role

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 403 })
    }

    let whereClause = {
      recipientType: role.toUpperCase()
    }

    // Add filters
    if (isRead !== null) {
      whereClause.isRead = isRead === 'true'
    }

    if (type) {
      whereClause.type = type
    }

    // Set recipient ID based on role
    switch (role) {
      case 'STUDENT':
        whereClause.recipientId = session.user.student.id
        break
      case 'FACULTY':
        whereClause.recipientId = session.user.faculty.id
        break
      case 'PARENT':
        whereClause.recipientId = session.user.parent.id
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        leaveApplication: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            faculty: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body
    const role = session.user?.role

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 403 })
    }

    let whereClause = {
      recipientType: role.toUpperCase()
    }

    // Set recipient ID based on role
    switch (role) {
      case 'STUDENT':
        whereClause.recipientId = session.user.student.id
        break
      case 'FACULTY':
        whereClause.recipientId = session.user.faculty.id
        break
      case 'PARENT':
        whereClause.recipientId = session.user.parent.id
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
    }

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true }
      })
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      whereClause.id = { in: notificationIds }
      await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true }
      })
    } else {
      return NextResponse.json({ error: 'No notifications specified' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Notifications updated successfully' })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
