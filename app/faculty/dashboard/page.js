'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function FacultyDashboard() {
  const { data: session } = useSession()
  const [leaveApplications, setLeaveApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })

  useEffect(() => {
    fetchLeaveApplications()
    fetchNotifications()
  }, [])

  const fetchLeaveApplications = async () => {
    try {
      const response = await fetch('/api/leave')
      const data = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', data.error)
        setLeaveApplications([])
        setStats({ pending: 0, approved: 0, rejected: 0, total: 0 })
        return
      }
      
      if (Array.isArray(data)) {
        setLeaveApplications(data)
        
        // Calculate stats
        const stats = {
          pending: data.filter(app => app.status === 'PENDING').length,
          approved: data.filter(app => app.status === 'APPROVED').length,
          rejected: data.filter(app => app.status === 'REJECTED').length,
          total: data.length
        }
        setStats(stats)
      } else {
        setLeaveApplications([])
        setStats({ pending: 0, approved: 0, rejected: 0, total: 0 })
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error)
      setLeaveApplications([])
      setStats({ pending: 0, approved: 0, rejected: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?isRead=false')
      const data = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', data.error)
        setNotifications([])
        return
      }
      
      if (Array.isArray(data)) {
        setNotifications(data)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    }
  }

  const handleAction = async (applicationId, action, comments = '') => {
    try {
      const response = await fetch(`/api/leave/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, comments })
      })

      if (response.ok) {
        // Refresh the data
        fetchLeaveApplications()
        fetchNotifications()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Error updating application:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session?.user?.faculty?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Leave Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Pending Leave Applications</h2>
              </div>
              <div className="p-6">
                {leaveApplications.filter(app => app.status === 'PENDING').length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending applications</h3>
                    <p className="mt-1 text-sm text-gray-500">All leave applications have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveApplications
                      .filter(app => app.status === 'PENDING')
                      .map((application) => (
                        <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {application.student.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {application.student.rollNumber} • {application.student.department}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(application.startDate)} - {formatDate(application.endDate)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status}
                            </span>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-900">
                              <strong>Reason:</strong> {application.reason}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const comments = prompt('Add comments (optional):')
                                if (comments !== null) {
                                  handleAction(application.id, 'APPROVE', comments)
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const comments = prompt('Add rejection reason:')
                                if (comments) {
                                  handleAction(application.id, 'REJECT', comments)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                            <Link
                              href={`/faculty/application/${application.id}`}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              </div>
              <div className="p-6">
                {notifications.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No new notifications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="border-l-4 border-blue-500 pl-4">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {notifications.length > 5 && (
                      <div className="text-center">
                        <Link
                          href="/faculty/notifications"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
