import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../api/client'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

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

  // Auto-fetch profile if logged in as Student
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      setProfileLoading(true)
      fetchProfile()
        .catch((err) => {
          console.warn('Failed to fetch student profile, might be incomplete:', err.message)
        })
        .finally(() => {
          setProfileLoading(false)
        })
    } else {
      setProfile(null)
      setProfileLoading(false)
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

  const fetchProfile = async () => {
    if (!user) return null
    try {
      const response = await apiClient.get(`/api/profile/${user.id}`)
      setProfile(response.data)
      return response.data
    } catch (err) {
      setProfile(null)
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
      throw new Error(err.message || 'Failed to complete profile')
    }
  }

  const logout = () => {
    setUser(null)
    setProfile(null)
    localStorage.removeItem('library_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        login,
        register,
        completeProfile,
        fetchProfile,
        logout,
      }}
    >
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
