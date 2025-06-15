'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  BarChart3,
  Clock,
  Users
} from 'lucide-react'

type Quiz = Database['public']['Tables']['quizzes']['Row']

interface QuizWithStats extends Quiz {
  question_count: number
  response_count: number
}

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeDashboard = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/signin')
      } else {
        setUser(currentUser)
        await fetchUserQuizzes(currentUser.id)
      }
    }
    initializeDashboard()
  }, [router])

  const fetchUserQuizzes = async (userId: string) => {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (count),
        quiz_responses (count)
      `)
      .eq('created_by', userId)
      .order('updated_at', { ascending: false })

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

  const togglePublishStatus = async (quizId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('quizzes')
      .update({ 
        is_published: !currentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', quizId)

    if (!error && user) {
      await fetchUserQuizzes(user.id)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (!error && user) {
      await fetchUserQuizzes(user.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Quizzes</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your quizzes and track their performance
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Quiz
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg">You haven&apos;t created any quizzes yet.</div>
            <p className="mt-2 text-gray-400 dark:text-gray-500">
              <Link href="/create" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Create your first quiz
              </Link>{' '}
              to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border dark:border-gray-700"
              >
                                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                            {quiz.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        {quiz.is_published ? (
                          <Eye className="h-5 w-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {getQuizTypeDisplay(quiz.quiz_type)}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {quiz.response_count}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {quiz.question_count} questions
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                        Last updated: {formatDate(quiz.updated_at)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Created: {formatDate(quiz.created_at)}
                      </div>
                    </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/create/${quiz.id}`)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        aria-label="Edit quiz"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => togglePublishStatus(quiz.id, quiz.is_published)}
                        className={`p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                          quiz.is_published
                            ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500'
                            : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500'
                        }`}
                        aria-label={quiz.is_published ? 'Unpublish quiz' : 'Publish quiz'}
                      >
                        {quiz.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => router.push(`/quiz/${quiz.id}/analytics`)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        aria-label="View analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        aria-label="Delete quiz"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {quiz.is_published && (
                      <Link
                        href={`/quiz/${quiz.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      >
                        Take Quiz
                      </Link>
                    )}
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