'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Clock, User, ArrowRight } from 'lucide-react'

type Quiz = Database['public']['Tables']['quizzes']['Row']

interface QuizWithStats extends Quiz {
  question_count: number
  response_count: number
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (count),
        quiz_responses (count)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (quizData) {
      const quizzesWithStats = quizData.map(quiz => ({
        ...quiz,
        question_count: quiz.questions?.length || 0,
        response_count: quiz.quiz_responses?.length || 0
      }))
      setQuizzes(quizzesWithStats)
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getQuizTypeDisplay = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice'
      case 'true_false':
        return 'True/False'
      case 'short_answer':
        return 'Short Answer'
      case 'mixed':
        return 'Mixed'
      default:
        return 'Quiz'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Quizzes</h1>
          <p className="mt-2 text-gray-600">
            Discover and take quizzes created by the community
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No quizzes available yet.</div>
            <p className="mt-2 text-gray-400">
              Be the first to{' '}
              <Link href="/create" className="text-blue-600 hover:text-blue-500">
                create a quiz
              </Link>
              !
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getQuizTypeDisplay(quiz.quiz_type)}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {quiz.response_count}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {quiz.question_count} questions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Created {formatDate(quiz.created_at)}
                    </span>
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Take Quiz
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 