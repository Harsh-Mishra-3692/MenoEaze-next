'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'

type Symptom = {
  severity: number
  mood: number | null
  created_at: string
}

export default function AnalysisCard({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<Symptom[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const [mlForecast, setMlForecast] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- FETCH LOGS ---------------- */
  useEffect(() => {
    let isMounted = true

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('severity, mood, created_at')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (!isMounted) return

      if (error) {
        setError('Failed to load analytics.')
      } else {
        setLogs(data || [])
      }

      setLoading(false)
    }

    fetchLogs()
    return () => {
      isMounted = false
    }
  }, [userId])

  /* ---------------- ML MICRO SERVICE ---------------- */
  useEffect(() => {
    if (logs.length <= 5) return

    const controller = new AbortController()

    const callML = async () => {
      try {
        const response = await fetch('/api/ml-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs }),
          signal: controller.signal
        })

        if (!response.ok) return

        const data = await response.json()
        if (typeof data.forecast === 'number') {
          setMlForecast(Number(data.forecast.toFixed(2)))
        }
      } catch {
        // silent fail
      }
    }

    callML()
    return () => controller.abort()
  }, [logs])

  /* ---------------- ANALYTICS ENGINE ---------------- */
  const analytics = useMemo(() => {
    if (logs.length === 0) return null

    const now = Date.now()
    const range =
      view === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000

    const filtered = logs.filter(
      l => new Date(l.created_at).getTime() >= now - range
    )

    if (filtered.length === 0) return null

    /* Moving Average */
    const movingAverage = filtered.map((_, index) => {
      const start = Math.max(0, index - 6)
      const subset = filtered.slice(start, index + 1)

      const avg =
        subset.reduce((sum, l) => sum + l.severity, 0) /
        subset.length

      return {
        date: new Date(filtered[index].created_at).toLocaleDateString(),
        severity: filtered[index].severity,
        mood: filtered[index].mood ?? 5,
        smoothed: Number(avg.toFixed(2))
      }
    })

    /* Linear Regression */
    const n = filtered.length
    if (n < 2) {
      return {
        movingAverage,
        forecastNext: filtered[n - 1].severity,
        trend: 'Stable'
      }
    }

    const x = Array.from({ length: n }, (_, i) => i)
    const y = filtered.map(l => l.severity)

    const xMean = x.reduce((a, b) => a + b, 0) / n
    const yMean = y.reduce((a, b) => a + b, 0) / n

    const numerator = x.reduce(
      (sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean),
      0
    )

    const denominator = x.reduce(
      (sum, xi) => sum + (xi - xMean) ** 2,
      0
    )

    const slope = denominator === 0 ? 0 : numerator / denominator
    const intercept = yMean - slope * xMean

    let forecastNext = intercept + slope * (n + 1)
    forecastNext = Math.max(0, Math.min(10, forecastNext))

    const trend =
      slope > 0.1
        ? 'Increasing'
        : slope < -0.1
        ? 'Decreasing'
        : 'Stable'

    return {
      movingAverage,
      forecastNext: Number(forecastNext.toFixed(2)),
      trend
    }
  }, [logs, view])

  /* ---------------- UI STATES ---------------- */

  if (loading)
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg h-72 animate-pulse" />
    )

  if (error)
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg text-red-600">
        {error}
      </div>
    )

  if (!analytics)
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg text-gray-500 text-center">
        No analytics available yet. Start logging symptoms.
      </div>
    )

  /* ---------------- RENDER ---------------- */

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">
          📊 Advanced Analytics
        </h3>

        <div className="flex gap-2">
          {['weekly', 'monthly'].map(mode => (
            <button
              key={mode}
              onClick={() => setView(mode as 'weekly' | 'monthly')}
              className={`px-4 py-1 rounded-lg text-sm ${
                view === mode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.movingAverage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis yAxisId="left" domain={[0, 10]} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="severity"
              stroke="#9333ea"
              strokeWidth={2}
              name="Severity"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="mood"
              stroke="#10b981"
              strokeWidth={2}
              name="Mood"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="smoothed"
              stroke="#ec4899"
              strokeWidth={2}
              dot={false}
              name="7-Day Avg"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistical Forecast */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-1">
          📈 Statistical Forecast
        </h4>
        <p className="text-sm text-purple-700">
          Next projected severity:
          <strong> {analytics.forecastNext} / 10</strong>
        </p>
        <p className="text-xs mt-1">
          Trend: <strong>{analytics.trend}</strong>
        </p>
      </div>

      {/* ML Forecast */}
      {mlForecast !== null && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-800">
            🤖 ML Forecast
          </h4>
          <p className="text-sm text-blue-700">
            ML predicted next severity:
            <strong> {mlForecast} / 10</strong>
          </p>
        </div>
      )}

      {/* Insight Summary */}
      <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
        <h4 className="font-semibold text-pink-800 mb-2">
          🧠 Insight Summary
        </h4>
        <p className="text-sm text-pink-700">
          Your symptom trajectory appears{' '}
          <strong>{analytics.trend.toLowerCase()}</strong>. Continue
          consistent tracking to improve prediction reliability.
        </p>
      </div>

    </div>
  )
}