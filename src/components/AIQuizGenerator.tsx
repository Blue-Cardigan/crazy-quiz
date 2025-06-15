'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface GeneratedQuestion {
  text: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  answers: {
    text: string
    isCorrect: boolean
  }[]
}

interface AIQuizGeneratorProps {
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void
}

export default function AIQuizGenerator({ onQuestionsGenerated }: AIQuizGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [questionTypes, setQuestionTypes] = useState<('multiple_choice' | 'true_false' | 'short_answer')[]>(['multiple_choice'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTypeChange = (type: 'multiple_choice' | 'true_false' | 'short_answer', checked: boolean) => {
    if (checked) {
      setQuestionTypes([...questionTypes, type])
    } else {
      setQuestionTypes(questionTypes.filter(t => t !== type))
    }
  }

  const generateQuestions = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }
    
    if (questionTypes.length === 0) {
      setError('Please select at least one question type')
      return
    }

    setLoading(true)
    setError('')

    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        difficulty,
        questionCount,
        questionTypes
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      setError(data.error || 'Failed to generate questions')
      setLoading(false)
      return
    }

    onQuestionsGenerated(data.questions)
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-8">
      <div className="flex items-center mb-4">
        <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          AI Quiz Generator
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. World History, JavaScript, Biology"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Questions
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Question Types
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={questionTypes.includes('multiple_choice')}
                onChange={(e) => handleTypeChange('multiple_choice', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Multiple Choice</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={questionTypes.includes('true_false')}
                onChange={(e) => handleTypeChange('true_false', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">True/False</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={questionTypes.includes('short_answer')}
                onChange={(e) => handleTypeChange('short_answer', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Short Answer</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={generateQuestions}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Generating Questions...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Questions with AI
          </>
        )}
      </button>
    </div>
  )
} 