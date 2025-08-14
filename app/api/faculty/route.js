import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const faculty = await prisma.faculty.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        designation: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(faculty)
  } catch (error) {
    console.error('Error fetching faculty:', error)
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 })
  }
}
