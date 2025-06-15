'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { PlusCircle, BookOpen, LogOut, User as UserIcon, Terminal, Database } from 'lucide-react'

export function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="bg-gradient-to-r from-neutral-dark to-neutral-mid border-b-2 border-accent-primary shadow-lg relative">
      <div className="scan-line"></div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Database className="h-10 w-10 text-accent-primary text-glow transition-all duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-accent-primary opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <span className="archive-header text-2xl text-accent-primary text-glow">QUIZ.SYS</span>
                <span className="text-xs text-text-dim font-mono tracking-wider">ARCHIVE TERMINAL v2.1</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Link 
              href="/quizzes" 
              className="flex items-center space-x-2 px-4 py-2 rounded border border-neutral-light text-text-dim hover:text-accent-tertiary hover:border-accent-tertiary transition-all duration-300 font-mono text-sm uppercase tracking-wide"
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse Archive</span>
            </Link>

            {user ? (
              <>
                <Link 
                  href="/create" 
                  className="btn-terminal flex items-center space-x-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Entry</span>
                </Link>
                
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-2 px-4 py-2 rounded border border-neutral-light text-text-dim hover:text-warning hover:border-warning transition-all duration-300 font-mono text-sm uppercase tracking-wide"
                >
                  <Terminal className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 rounded border border-neutral-light text-text-dim hover:text-danger hover:border-danger transition-all duration-300 font-mono text-sm uppercase tracking-wide focus:outline-none"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className="flex items-center space-x-2 px-4 py-2 rounded border border-neutral-light text-text-dim hover:text-accent-tertiary hover:border-accent-tertiary transition-all duration-300 font-mono text-sm uppercase tracking-wide"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Access</span>
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Terminal className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="bg-neutral-dark border-t border-neutral-light px-6 py-1">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs font-mono">
          <div className="flex items-center space-x-4 text-text-dim">
            <span className="data-point">STATUS: ONLINE</span>
            <span className="data-point">CONN: SECURE</span>
            <span className="data-point">USER: {user ? 'AUTHENTICATED' : 'GUEST'}</span>
          </div>
          <div className="text-accent-primary">
            <span className="loading-dots">ARCHIVING</span>
          </div>
        </div>
      </div>
    </nav>
  )
} 