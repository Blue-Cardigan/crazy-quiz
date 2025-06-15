'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'

type Quiz = Database['public']['Tables']['quizzes']['Row']
type Question = Database['public']['Tables']['questions']['Row']
type AnswerOption = Database['public']['Tables']['answer_options']['Row']

interface QuestionWithOptions extends Question {
  answer_options: AnswerOption[]
}

interface QuizWithQuestions extends Quiz {
  questions: QuestionWithOptions[]
}

interface UserAnswer {
  questionId: string
  selectedAnswer: string | null
  isCorrect: boolean
}

export default function TakeQuiz() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [user, setUser] = useState<User | null>(null)

  const fetchQuiz = useCallback(async () => {
    const { data: quizData, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (
          *,
          answer_options (*)
        )
      `)
      .eq('id', quizId)
      .eq('is_published', true)
      .single()

    if (error) {
      console.error('Error fetching quiz:', error)
      router.push('/quizzes')
      return
    }

    if (quizData) {
      // Sort questions by order_index
      const sortedQuestions = quizData.questions?.sort((a: QuestionWithOptions, b: QuestionWithOptions) => a.order_index - b.order_index) || []
      
      // Sort answer options for each question
      sortedQuestions.forEach((question: QuestionWithOptions) => {
        if (question.answer_options) {
          question.answer_options.sort((a: AnswerOption, b: AnswerOption) => a.order_index - b.order_index)
        }
      })

      setQuiz({ ...quizData, questions: sortedQuestions })
      
      // Initialize empty answers
      const initialAnswers = sortedQuestions.map((question: QuestionWithOptions) => ({
        questionId: question.id,
        selectedAnswer: null,
        isCorrect: false
      }))
      setUserAnswers(initialAnswers)
    }
    
    setLoading(false)
  }, [quizId, router])

  useEffect(() => {
    const initializeQuiz = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      await fetchQuiz()
    }
    initializeQuiz()
  }, [fetchQuiz])

  const handleAnswerSelect = (questionId: string, selectedAnswer: string) => {
    setUserAnswers(prev => 
      prev.map(answer => 
        answer.questionId === questionId 
          ? { ...answer, selectedAnswer }
          : answer
      )
    )
  }

  const getCurrentQuestion = () => {
    return quiz?.questions[currentQuestionIndex] || null
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const calculateScore = () => {
    let correctAnswers = 0
    
    userAnswers.forEach((userAnswer, index) => {
      const question = quiz?.questions[index]
      if (!question) return

      let isCorrect = false

      if (question.question_type === 'short_answer') {
        // For short answer, we'll mark it as correct for now
        // In a real app, you might want manual grading or better text matching
        isCorrect = userAnswer.selectedAnswer !== null && userAnswer.selectedAnswer.trim() !== ''
      } else {
        // For multiple choice and true/false
        const correctOption = question.answer_options?.find(option => option.is_correct)
        isCorrect = correctOption?.option_text === userAnswer.selectedAnswer
      }

      if (isCorrect) {
        correctAnswers++
        userAnswer.isCorrect = true
      }
    })

    return correctAnswers
  }

  const submitQuiz = async () => {
    if (!quiz) return

    setSubmitting(true)
    const calculatedScore = calculateScore()
    setScore(calculatedScore)

    // Save quiz response
    const { data: responseData, error: responseError } = await supabase
      .from('quiz_responses')
      .insert({
        quiz_id: quiz.id,
        user_id: user?.id || null,
        score: calculatedScore,
        total_questions: quiz.questions.length
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error saving quiz response:', responseError)
      setSubmitting(false)
      return
    }

    // Save individual question responses
    for (let i = 0; i < userAnswers.length; i++) {
      const userAnswer = userAnswers[i]
      
      await supabase
        .from('question_responses')
        .insert({
          response_id: responseData.id,
          question_id: userAnswer.questionId,
          selected_answer: userAnswer.selectedAnswer,
          is_correct: userAnswer.isCorrect
        })
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  const isQuizComplete = () => {
    return userAnswers.every(answer => answer.selectedAnswer !== null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Quiz not found</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-8 text-center">
            <div className="mb-6">
              {percentage >= 70 ? (
                <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Quiz Completed!
            </h1>
            
            <div className="mb-6">
              <p className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">{percentage}%</p>
              <p className="text-gray-600 dark:text-gray-400">
                You scored {score} out of {quiz.questions.length} questions correctly
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push(`/quiz/${quiz.id}/results`)}
                className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                View Detailed Results
              </button>
              
              <button
                onClick={() => router.push('/quizzes')}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Take Another Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentAnswer = userAnswers[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quiz.title}</h1>
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Clock className="h-5 w-5 mr-2" />
                <span>
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {currentQuestion.question_text}
              </h2>

              <div className="space-y-4">
                {currentQuestion.question_type === 'short_answer' ? (
                  <textarea
                    value={currentAnswer?.selectedAnswer || ''}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    rows={4}
                    placeholder="Enter your answer here..."
                  />
                ) : (
                  currentQuestion.answer_options?.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.option_text}
                        checked={currentAnswer?.selectedAnswer === option.option_text}
                        onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                        className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                      <span className="ml-3 text-gray-900 dark:text-gray-100">{option.option_text}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex space-x-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : userAnswers[index]?.selectedAnswer
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  disabled={!isQuizComplete() || submitting}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 