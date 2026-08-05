import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../api/client'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [staffProfile, setStaffProfile] = useState(null)
  const [hasFine, setHasFine] = useState(false)
  const [loading, setLoading] = useState(true)

  // On mount, load user from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('library_user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
      } catch (err) {
        console.error('Failed to parse stored user session:', err)
        localStorage.removeItem('library_user')
      }
    }
    setLoading(false)
  }, [])

  // Auto-fetch profile if logged in
  useEffect(() => {
    if (user) {
      fetchProfile().catch((err) => {
        console.warn('Failed to fetch profile:', err.message)
      })
    } else {
      setProfile(null)
      setStaffProfile(null)
    }
  }, [user])

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password })
      const loggedUser = response.data
      setUser(loggedUser)
      localStorage.setItem('library_user', JSON.stringify(loggedUser))
      return loggedUser
    } catch (err) {
      throw new Error(err.message || 'Login failed')
    }
  }

  const register = async (name, email, password) => {
    try {
      // Always register as STUDENT - no admin self-registration
      await apiClient.post('/api/auth/register', { name, email, password, role: 'STUDENT' })
    } catch (err) {
      throw new Error(err.message || 'Registration failed')
    }
  }

  const verifyRegistrationOtp = async (email, otp) => {
    try {
      await apiClient.post('/api/auth/verify-registration-otp', { email, otp })
    } catch (err) {
      throw new Error(err.message || 'OTP Verification failed')
    }
  }

  const resendRegistrationOtp = async (email) => {
    try {
      await apiClient.post('/api/auth/resend-registration-otp', { email })
    } catch (err) {
      throw new Error(err.message || 'Failed to resend OTP')
    }
  }

  const fetchProfile = async () => {
    if (!user) return null
    try {
      if (user.role === 'STUDENT') {
        const profileRes = await apiClient.get(`/api/profile/${user.id}`)
        setProfile(profileRes.data)
        
        try {
          const finesRes = await apiClient.get(`/api/fines/user/${user.id}`)
          const pendingFines = (finesRes.data || []).filter(f => f.status === 'PENDING')
          setHasFine(pendingFines.length > 0)
        } catch (err) {
          console.warn('Failed to fetch fines:', err.message)
        }
        return profileRes.data
      } else if (user.role === 'STAFF') {
        const staffRes = await apiClient.get(`/api/staff/profile/${user.id}`)
        setStaffProfile(staffRes.data)
        return staffRes.data
      }
    } catch (err) {
      setProfile(null)
      setStaffProfile(null)
      if (err.message && err.message.includes('User not found')) {
        logout()
      }
      return null
    }
  }

  const completeProfile = async (branch, year, contactNumber, address) => {
    if (!user) throw new Error('Must be logged in to complete profile')
    try {
      const response = await apiClient.post('/api/profile/complete', {
        userId: user.id,
        branch,
        year,
        contactNumber,
        address,
      })
      const newProfile = response.data
      setProfile(newProfile)
      return newProfile
    } catch (err) {
      if (err.message && err.message.includes('User not found')) {
        logout()
        throw new Error('Session invalid: User not found. Please log in again.')
      }
      throw new Error(err.message || 'Failed to complete profile')
    }
  }

  const logout = () => {
    setUser(null)
    setProfile(null)
    setStaffProfile(null)
    localStorage.removeItem('library_user')
  }

  return (
    <AuthContext.Provider value={{ user, profile, staffProfile, loading, login, register, verifyRegistrationOtp, resendRegistrationOtp, logout, hasFine, completeProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
