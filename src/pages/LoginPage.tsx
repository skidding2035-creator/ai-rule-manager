import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Hexagon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { signInWithPassword, signUp } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signUpDone, setSignUpDone] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const action = mode === 'signIn' ? signInWithPassword(email, password) : signUp(email, password)
    action
      .then(() => {
        if (mode === 'signUp') setSignUpDone(true)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  if (session) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple text-white">
            <Hexagon className="h-6 w-6" fill="currentColor" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-white">AI Rule Manager</p>
            <p className="text-[10px] tracking-wide text-gray-500">AI OPERATING SYSTEM</p>
          </div>
        </div>

        <Card title={mode === 'signIn' ? 'ログイン' : '初回セットアップ'}>
          {signUpDone ? (
            <p className="text-sm text-gray-300">
              確認メールを送信しました。メール内のリンクを開いてアカウントを有効化してから、ログインしてください。
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">メールアドレス</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">パスワード</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-200 outline-none focus:border-accent-blue"
                />
              </div>
              {error && <p className="text-sm text-accent-red">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode === 'signIn' ? 'ログイン' : 'アカウントを作成'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                  setError(null)
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300"
              >
                {mode === 'signIn' ? '初めての方はこちら(初回セットアップ)' : 'ログイン画面に戻る'}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
