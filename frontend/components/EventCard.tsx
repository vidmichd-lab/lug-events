'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string
    start_date: string
    end_date: string
    average_price: number
    link: string
    organizer: string
    category_name: string
    place_name: string
    city_name: string
  }
}

export default function EventCard({ event }: EventCardProps) {
  const { user } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      checkFavorite()
    }
  }, [user, event.id])

  const checkFavorite = async () => {
    try {
      const response = await api.get(`/favorites/check/${event.id}`)
      setIsFavorite(response.data.isFavorite)
    } catch (error) {
      // Not logged in or error
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return

    setLoading(true)
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${event.id}`)
        setIsFavorite(false)
      } else {
        await api.post('/favorites', { eventId: event.id })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareEvent = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = `${window.location.origin}/events/${event.id}`
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: url
      })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden card-hover group cursor-pointer h-full flex flex-col">
        {/* Header with gradient */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="p-6 flex flex-col flex-grow">
          {/* Title and Favorite */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-grow">
              {event.title}
            </h3>
            {user && (
              <button
                onClick={toggleFavorite}
                disabled={loading}
                className={`ml-3 flex-shrink-0 transition-all duration-200 ${
                  isFavorite 
                    ? 'text-red-500 scale-110' 
                    : 'text-gray-300 hover:text-red-400'
                }`}
              >
                <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-gray-600 mb-4 line-clamp-3 text-sm flex-grow">{event.description}</p>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {event.start_date && (
              <span className="badge-primary">
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {event.end_date && event.start_date !== event.end_date
                  ? `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`
                  : formatDate(event.start_date)}
              </span>
            )}
            {event.city_name && (
              <span className="badge bg-purple-100 text-purple-800">
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.city_name}
              </span>
            )}
            {event.category_name && (
              <span className="badge bg-indigo-100 text-indigo-800">
                {event.category_name}
              </span>
            )}
          </div>

          {/* Additional info */}
          <div className="space-y-1.5 text-sm text-gray-500 mb-4">
            {event.place_name && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{event.place_name}</span>
              </div>
            )}
            {event.organizer && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">{event.organizer}</span>
              </div>
            )}
            {event.average_price && (
              <div className="flex items-center gap-2 font-semibold text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>от {event.average_price} ₽</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 btn-primary text-center text-sm py-2"
              >
                Подробнее
              </a>
            )}
            <button
              onClick={shareEvent}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center"
              title={copied ? 'Скопировано!' : 'Поделиться'}
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
            {user && (
              <Link
                href={`/events/${event.id}/complaint`}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 flex items-center justify-center"
                title="Пожаловаться"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

