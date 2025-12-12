'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Header from '@/components/Header'

export default function SubscriptionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadSubscriptions()
  }, [user])

  const loadSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions')
      setSubscriptions(response.data)
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async (placeId: string) => {
    try {
      await api.delete(`/subscriptions/${placeId}`)
      setSubscriptions(subscriptions.filter((s) => s.place_id !== placeId))
    } catch (error) {
      console.error('Error unsubscribing:', error)
    }
  }

  if (!user) {
    return null
  }

  const placeTypeLabels: Record<string, string> = {
    museum: 'Музей',
    theater: 'Театр',
    cafe: 'Кафе',
    restaurant: 'Ресторан',
    cinema: 'Кинотеатр',
    space: 'Пространство',
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">Подписки на места</h1>
          <p className="text-gray-600">Места, на которые вы подписаны</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Загрузка...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-soft">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Нет подписок</h3>
            <p className="text-gray-600 mb-6">Подпишитесь на интересные места, чтобы получать уведомления о новых событиях</p>
            <Link href="/" className="btn-primary inline-block">
              Найти места
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {subscriptions.map((subscription, index) => (
              <div
                key={subscription.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{subscription.place_name}</h3>
                    <span className="badge-primary">
                      {placeTypeLabels[subscription.place_type] || subscription.place_type}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {subscription.city_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{subscription.city_name}</span>
                    </div>
                  )}
                  {subscription.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{subscription.address}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => unsubscribe(subscription.place_id)}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium transition-all duration-200 border border-red-200"
                >
                  Отписаться
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

