'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ApplyLeave() {
  const { data: session } = useSession()
  const router = useRouter()
  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    facultyId: '',
    attachmentUrl: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchFacultyList()
  }, [])

  const fetchFacultyList = async () => {
    try {
      // Fetch faculty from the database
      const response = await fetch('/api/faculty')
      if (response.ok) {
        const faculty = await response.json()
        setFacultyList(faculty)
      } else {
        // Fallback to mock data if API fails
        const mockFaculty = [
          { id: '1', name: 'Dr. John Smith', department: 'Computer Science' },
          { id: '2', name: 'Prof. Sarah Johnson', department: 'Mathematics' }
        ]
        setFacultyList(mockFaculty)
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error)
      // Fallback to mock data
      const mockFaculty = [
        { id: '1', name: 'Dr. John Smith', department: 'Computer Science' },
        { id: '2', name: 'Prof. Sarah Johnson', department: 'Mathematics' }
      ]
      setFacultyList(mockFaculty)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    } else if (new Date(formData.startDate) < new Date()) {
      newErrors.startDate = 'Start date cannot be in the past'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }

    if (!formData.facultyId) {
      newErrors.facultyId = 'Please select a faculty member'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/student/dashboard?success=true')
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to submit leave application' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
              <p className="text-gray-600">Submit a new leave application</p>
            </div>
            <Link
              href="/student/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Leave Application Form</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Faculty Selection */}
            <div>
              <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700 mb-2">
                Faculty Member *
              </label>
              <select
                id="facultyId"
                name="facultyId"
                value={formData.facultyId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  errors.facultyId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a faculty member</option>
                {facultyList.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name} - {faculty.department}
                  </option>
                ))}
              </select>
              {errors.facultyId && (
                <p className="mt-1 text-sm text-red-600">{errors.facultyId}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leave *
              </label>
                              <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Please provide a detailed reason for your leave request..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Attachment (Optional) */}
            <div>
              <label htmlFor="attachmentUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Document (Optional)
              </label>
              <input
                type="file"
                id="attachmentUrl"
                name="attachmentUrl"
                onChange={(e) => {
                  // In a real app, you'd upload the file to a service like AWS S3
                  // For now, we'll just store the filename
                  setFormData(prev => ({
                    ...prev,
                    attachmentUrl: e.target.files[0]?.name || ''
                  }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5MB)
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.submit}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/student/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Important Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your leave application will be reviewed by the selected faculty member</li>
                  <li>Your parent will also be notified and may need to approve the request</li>
                  <li>You will receive email notifications about the status of your application</li>
                  <li>You can cancel pending applications from your dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
