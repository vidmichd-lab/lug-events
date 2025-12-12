'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Header from '@/components/Header'
import EventCard from '@/components/EventCard'
import CityFilter from '@/components/CityFilter'
import CategoryFilter from '@/components/CategoryFilter'

interface Event {
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

export default function Home() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedCity, selectedCategory])

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsRes, citiesRes, categoriesRes] = await Promise.all([
        api.get('/events', {
          params: {
            cityId: selectedCity || undefined,
            categoryId: selectedCategory || undefined,
          }
        }),
        api.get('/cities'),
        api.get('/categories')
      ])

      setEvents(eventsRes.data.events || eventsRes.data)
      setCities(citiesRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
            Афиша событий
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Откройте для себя лучшие события в вашем городе. Музеи, театры, концерты и многое другое.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Город
              </label>
              <CityFilter
                cities={cities}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категория
              </label>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Загрузка событий...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-soft">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">События не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить фильтры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {events.map((event, index) => (
              <div key={event.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

