'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Plus, Trash2, Save, Eye } from 'lucide-react'
import AIQuizGenerator from '@/components/AIQuizGenerator'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
type QuizType = 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed'

interface Answer {
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  text: string
  type: QuestionType
  answers: Answer[]
}

export default function CreateQuiz() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quizType, setQuizType] = useState<QuizType>('mixed')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/signin')
      } else {
        setUser(currentUser)
      }
    }
    checkAuth()
  }, [router])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'multiple_choice',
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (questionId: string, field: keyof Question, value: string | QuestionType) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ))
  }

  const updateAnswer = (questionId: string, answerIndex: number, field: keyof Answer, value: string | boolean) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newAnswers = [...q.answers]
        newAnswers[answerIndex] = { ...newAnswers[answerIndex], [field]: value }
        
        // For multiple choice, only one answer can be correct
        if (field === 'isCorrect' && value && q.type === 'multiple_choice') {
          newAnswers.forEach((answer, index) => {
            if (index !== answerIndex) {
              answer.isCorrect = false
            }
          })
        }
        
        return { ...q, answers: newAnswers }
      }
      return q
    }))
  }

  const addAnswer = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, answers: [...q.answers, { text: '', isCorrect: false }] }
        : q
    ))
  }

  const removeAnswer = (questionId: string, answerIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, answers: q.answers.filter((_, index) => index !== answerIndex) }
        : q
    ))
  }

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  const changeQuestionType = (questionId: string, type: QuestionType) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        let answers: Answer[] = []
        if (type === 'true_false') {
          answers = [
            { text: 'True', isCorrect: false },
            { text: 'False', isCorrect: false }
          ]
        } else if (type === 'multiple_choice') {
          answers = [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]
        } else {
          answers = [{ text: '', isCorrect: true }]
        }
        return { ...q, type, answers }
      }
      return q
    }))
  }

  const handleGeneratedQuestions = (generatedQuestions: any[]) => {
    const newQuestions: Question[] = generatedQuestions.map(gq => ({
      id: Math.random().toString(36).substr(2, 9),
      text: gq.text,
      type: gq.type,
      answers: gq.answers
    }))
    setQuestions([...questions, ...newQuestions])
  }

  const saveQuiz = async (publish = false) => {
    if (!user) return

    setLoading(true)

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        quiz_type: quizType,
        is_published: publish,
        created_by: user.id
      })
      .select()
      .single()

    if (quizError) {
      console.error('Error creating quiz:', quizError)
      setLoading(false)
      return
    }

    // Insert questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizData.id,
          question_text: question.text,
          question_type: question.type,
          order_index: i
        })
        .select()
        .single()

      if (questionError) {
        console.error('Error creating question:', questionError)
        continue
      }

      // Insert answer options
      if (question.type !== 'short_answer') {
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j]
          
          await supabase
            .from('answer_options')
            .insert({
              question_id: questionData.id,
              option_text: answer.text,
              is_correct: answer.isCorrect,
              order_index: j
            })
        }
      }
    }

    setLoading(false)
    router.push('/dashboard')
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center text-gray-900 dark:text-gray-100">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Quiz</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Build an engaging quiz with different question types
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
          <div className="p-6">
            {/* Quiz Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quiz Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    placeholder="Describe your quiz"
                  />
                </div>

                <div>
                  <label htmlFor="quiz-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quiz Type
                  </label>
                  <select
                    id="quiz-type"
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value as QuizType)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="multiple_choice">Multiple Choice Only</option>
                    <option value="true_false">True/False Only</option>
                    <option value="short_answer">Short Answer Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Quiz Generator */}
            <AIQuizGenerator onQuestionsGenerated={handleGeneratedQuestions} />

            {/* Questions */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Questions</h2>
                <button
                  onClick={addQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No questions added yet. Click &quot;Add Question&quot; to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Question {index + 1}
                        </h3>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Question Text *
                          </label>
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="Enter your question"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Question Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => changeQuestionType(question.id, e.target.value as QuestionType)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True/False</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>

                        {/* Answer Options */}
                        {question.type !== 'short_answer' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Answer Options
                              </label>
                              {question.type === 'multiple_choice' && (
                                <button
                                  onClick={() => addAnswer(question.id)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm focus:outline-none"
                                >
                                  + Add Option
                                </button>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {question.answers.map((answer, answerIndex) => (
                                <div key={answerIndex} className="flex items-center space-x-2">
                                  <input
                                    type={question.type === 'multiple_choice' ? 'radio' : 'checkbox'}
                                    name={`correct-${question.id}`}
                                    checked={answer.isCorrect}
                                    onChange={(e) => updateAnswer(question.id, answerIndex, 'isCorrect', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                  />
                                  <input
                                    type="text"
                                    value={answer.text}
                                    onChange={(e) => updateAnswer(question.id, answerIndex, 'text', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                    placeholder="Enter answer option"
                                    disabled={question.type === 'true_false'}
                                  />
                                  {question.type === 'multiple_choice' && question.answers.length > 2 && (
                                    <button
                                      onClick={() => removeAnswer(question.id, answerIndex)}
                                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === 'short_answer' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Sample Answer (for reference)
                            </label>
                            <input
                              type="text"
                              value={question.answers[0]?.text || ''}
                              onChange={(e) => updateAnswer(question.id, 0, 'text', e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                              placeholder="Enter a sample correct answer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => saveQuiz(false)}
                disabled={loading || !title || questions.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </button>
              <button
                onClick={() => saveQuiz(true)}
                disabled={loading || !title || questions.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                <Eye className="h-4 w-4 mr-2" />
                {loading ? 'Publishing...' : 'Publish Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 