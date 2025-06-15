'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { 
  ChevronLeft, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar
} from 'lucide-react'

type Quiz = Database['public']['Tables']['quizzes']['Row']
type Question = Database['public']['Tables']['questions']['Row']
type AnswerOption = Database['public']['Tables']['answer_options']['Row']
type QuizResponse = Database['public']['Tables']['quiz_responses']['Row']
type QuestionResponse = Database['public']['Tables']['question_responses']['Row']

interface QuestionWithOptions extends Question {
  answer_options: AnswerOption[]
}

interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[]
}

interface QuestionAnalytics {
  question: QuestionWithOptions
  totalResponses: number
  correctResponses: number
  incorrectResponses: number
  accuracyRate: number
  responses: { [key: string]: number }
}

interface QuizAnalytics {
  totalResponses: number
  averageScore: number
  highestScore: number
  lowestScore: number
  completionRate: number
  questionAnalytics: QuestionAnalytics[]
  recentResponses: QuizResponse[]
}

export default function QuizAnalytics() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchQuizAnalytics = useCallback(async () => {
    // Fetch quiz details
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (
          *,
          answer_options (*)
        )
      `)
      .eq('id', quizId)
      .single()

    if (quizError) {
      console.error('Error fetching quiz:', quizError)
      router.push('/dashboard')
      return
    }

    // Check if user owns this quiz
    const currentUser = await getCurrentUser()
    if (!currentUser || quizData.created_by !== currentUser.id) {
      router.push('/dashboard')
      return
    }

    if (quizData) {
      // Sort questions and answers
      const sortedQuestions = quizData.questions?.sort((a: QuestionWithOptions, b: QuestionWithOptions) => a.order_index - b.order_index) || []
      sortedQuestions.forEach((question: QuestionWithOptions) => {
        if (question.answer_options) {
          question.answer_options.sort((a: AnswerOption, b: AnswerOption) => a.order_index - b.order_index)
        }
      })
      setQuiz({ ...quizData, questions: sortedQuestions })

      // Fetch quiz responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('quiz_responses')
        .select(`
          *,
          question_responses (*)
        `)
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false })

      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
        setLoading(false)
        return
      }

      // Calculate analytics
      const totalResponses = responsesData?.length || 0
      const scores = responsesData?.map(r => r.score) || []
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

      // Calculate question-level analytics
      const questionAnalytics: QuestionAnalytics[] = sortedQuestions.map((question: QuestionWithOptions) => {
        const questionResponses = responsesData?.flatMap(r => 
          r.question_responses?.filter((qr: QuestionResponse) => qr.question_id === question.id) || []
        ) || []

        const totalResponses = questionResponses.length
        const correctResponses = questionResponses.filter((qr: QuestionResponse) => qr.is_correct).length
        const incorrectResponses = totalResponses - correctResponses
        const accuracyRate = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0

        // Count responses by answer
        const responses: { [key: string]: number } = {}
        questionResponses.forEach((qr: QuestionResponse) => {
          const answer = qr.selected_answer || 'No answer'
          responses[answer] = (responses[answer] || 0) + 1
        })

        return {
          question,
          totalResponses,
          correctResponses,
          incorrectResponses,
          accuracyRate,
          responses
        }
      })

      const analyticsData: QuizAnalytics = {
        totalResponses,
        averageScore,
        highestScore,
        lowestScore,
        completionRate: 100, // For now, assuming all responses are completed
        questionAnalytics,
        recentResponses: responsesData?.slice(0, 10) || []
      }

      setAnalytics(analyticsData)
    }

    setLoading(false)
  }, [quizId, router])

  useEffect(() => {
    fetchQuizAnalytics()
  }, [fetchQuizAnalytics])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!quiz || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Analytics Not Available</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unable to load analytics for this quiz.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Link
                  href="/dashboard"
                  className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label="Back to dashboard"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quiz.title} - Analytics</h1>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span>Performance Overview</span>
              </div>
            </div>

            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-4">
              <Link
                href={`/quiz/${quizId}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Quiz
              </Link>
              <Link
                href={`/create/${quizId}`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Edit Quiz
              </Link>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics.averageScore.toFixed(1)} / {quiz.questions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics.highestScore} / {quiz.questions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Analytics */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Question Performance
                </h3>

                <div className="space-y-6">
                  {analytics.questionAnalytics.map((qa, index) => (
                    <div key={qa.question.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Question {index + 1}
                        </h4>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${qa.accuracyRate >= 70 ? 'text-green-600 dark:text-green-400' : qa.accuracyRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                            {qa.accuracyRate.toFixed(1)}%
                          </span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">accuracy</p>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">{qa.question.question_text}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Total Responses:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">{qa.totalResponses}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Correct:</span>
                          <span className="ml-2 text-green-600 dark:text-green-400">{qa.correctResponses}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Incorrect:</span>
                          <span className="ml-2 text-red-600 dark:text-red-400">{qa.incorrectResponses}</span>
                        </div>
                      </div>

                      {/* Response Distribution */}
                      {Object.keys(qa.responses).length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Answer Distribution:</h5>
                          <div className="space-y-1">
                            {Object.entries(qa.responses).map(([answer, count]) => (
                              <div key={answer} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{answer}</span>
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full"
                                      style={{ width: `${(count / qa.totalResponses) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-600 dark:text-gray-400 w-8">{count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Responses */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Recent Responses
                </h3>

                {analytics.recentResponses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No responses yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentResponses.map((response) => (
                      <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                          <div className={`font-medium ${getScoreColor(response.score, response.total_questions)}`}>
                            {response.score}/{response.total_questions}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(response.completed_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {Math.round((response.score / response.total_questions) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {analytics.totalResponses > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Score Distribution
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {((analytics.averageScore / quiz.questions.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Highest Score:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {((analytics.highestScore / quiz.questions.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Lowest Score:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {((analytics.lowestScore / quiz.questions.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 