'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function FacultyApplicationDetail() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchApplication()
    }
  }, [params.id])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/leave/${params.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', data.error)
        alert('Failed to fetch application details')
        router.push('/faculty/dashboard')
        return
      }
      
      setApplication(data)
    } catch (error) {
      console.error('Error fetching application:', error)
      alert('An error occurred while fetching application details')
      router.push('/faculty/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    if (action === 'REJECT' && !comments.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      const response = await fetch(`/api/leave/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action, 
          comments: comments.trim() || undefined 
        })
      })

      if (response.ok) {
        alert(`Application ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`)
        router.push('/faculty/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Error updating application:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Application not found</h2>
          <Link href="/faculty/dashboard" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Leave Application Details</h1>
              <p className="text-gray-600">Review and manage leave application</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/faculty/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Application Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Leave Application - {application.student.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {application.student.rollNumber} • {application.student.department}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>
          </div>

          {/* Application Details */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(application.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(application.endDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="text-sm text-gray-900">
                      {Math.ceil((new Date(application.endDate) - new Date(application.startDate)) / (1000 * 60 * 60 * 24) + 1)} days
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reason</dt>
                    <dd className="text-sm text-gray-900">{application.reason}</dd>
                  </div>
                  {application.attachmentUrl && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Attachment</dt>
                      <dd className="text-sm text-gray-900">
                        <a href={application.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                          View Attachment
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{application.student.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Roll Number</dt>
                    <dd className="text-sm text-gray-900">{application.student.rollNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="text-sm text-gray-900">{application.student.department}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Year</dt>
                    <dd className="text-sm text-gray-900">{application.student.year}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Parent</dt>
                    <dd className="text-sm text-gray-900">{application.student.parent.name}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Comments Section */}
            {application.status === 'PENDING' && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comments</h3>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add your comments or reason for approval/rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={4}
                />
              </div>
            )}

            {/* Existing Comments */}
            {application.facultyComments && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Faculty Comments</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {application.facultyComments}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {application.status === 'PENDING' && (
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => handleAction('APPROVE')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => handleAction('REJECT')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
