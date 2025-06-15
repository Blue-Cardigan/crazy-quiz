'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { ChevronLeft, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react'

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

interface QuestionResponseWithDetails extends QuestionResponse {
  question: QuestionWithOptions
}

interface QuizResponseWithDetails extends QuizResponse {
  question_responses: QuestionResponseWithDetails[]
}

export default function QuizResults() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [responses, setResponses] = useState<QuizResponseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [selectedResponse, setSelectedResponse] = useState<QuizResponseWithDetails | null>(null)

  const fetchQuizAndResponses = useCallback(async () => {
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
      router.push('/quizzes')
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
    }

    // Fetch user's responses for this quiz
    const { data: responsesData, error: responsesError } = await supabase
      .from('quiz_responses')
      .select(`
        *,
        question_responses (
          *,
          questions (
            *,
            answer_options (*)
          )
        )
      `)
      .eq('quiz_id', quizId)
      .eq('user_id', user?.id || '')
      .order('completed_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
    } else if (responsesData) {
      setResponses(responsesData as QuizResponseWithDetails[])
      if (responsesData.length > 0) {
        setSelectedResponse(responsesData[0] as QuizResponseWithDetails)
      }
    }

    setLoading(false)
  }, [quizId, router, user?.id])

  useEffect(() => {
    const initializeResults = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      await fetchQuizAndResponses()
    }
    initializeResults()
  }, [fetchQuizAndResponses])

  const getQuestionResult = (questionId: string) => {
    if (!selectedResponse) return null
    return selectedResponse.question_responses?.find(qr => qr.question_id === questionId)
  }

  const getCorrectAnswer = (question: QuestionWithOptions) => {
    if (question.question_type === 'short_answer') {
      return 'Short answer question'
    }
    const correctOption = question.answer_options?.find(option => option.is_correct)
    return correctOption?.option_text || 'No correct answer found'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!quiz || responses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">No Results Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven&apos;t completed this quiz yet.
          </p>
          <Link
            href={`/quiz/${quizId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            Take Quiz
          </Link>
        </div>
      </div>
    )
  }

  const percentage = selectedResponse ? Math.round((selectedResponse.score / selectedResponse.total_questions) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quiz.title} - Results</h1>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span>Detailed Analysis</span>
              </div>
            </div>

            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6 mb-6">
              <div className="text-center">
                <div className="mb-4">
                  {percentage >= 70 ? (
                    <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto" />
                  ) : (
                    <XCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto" />
                  )}
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {percentage}%
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedResponse?.score} out of {selectedResponse?.total_questions} correct
                </p>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      percentage >= 70 ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                {selectedResponse && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Completed: {formatDate(selectedResponse.completed_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attempt History */}
            {responses.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Previous Attempts
                </h3>
                <div className="space-y-2">
                  {responses.map((response, index) => (
                    <button
                      key={response.id}
                      onClick={() => setSelectedResponse(response)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedResponse?.id === response.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          Attempt {responses.length - index}
                        </span>
                        <span className="text-sm">
                          {Math.round((response.score / response.total_questions) * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(response.completed_at)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Question by Question Analysis
                </h3>

                <div className="space-y-6">
                  {quiz.questions.map((question, index) => {
                    const result = getQuestionResult(question.id)
                    const isCorrect = result?.is_correct || false

                    return (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          isCorrect
                            ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                            : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            Question {index + 1}
                          </h4>
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                          )}
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {question.question_text}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Your answer: </span>
                            <span className={isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                              {result?.selected_answer || 'No answer provided'}
                            </span>
                          </div>
                          
                          {!isCorrect && question.question_type !== 'short_answer' && (
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">Correct answer: </span>
                              <span className="text-green-700 dark:text-green-300">
                                {getCorrectAnswer(question)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/quiz/${quizId}`}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Retake Quiz
              </Link>
              <Link
                href="/quizzes"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                Browse More Quizzes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 