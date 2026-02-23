'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onSuccess?: () => void
}

const quickEmojis = ['😊','😢','😡','😴','😰','😌','😭','😤','🤒','💖']

export default function SymptomForm({ onSuccess }: Props) {
  const [symptomType, setSymptomType] = useState('')
  const [severity, setSeverity] = useState(5)
  const [mood, setMood] = useState('')
  const [sleep, setSleep] = useState(5)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const resetForm = () => {
    setSymptomType('')
    setSeverity(5)
    setMood('')
    setSleep(5)
    setNotes('')
  }

  const addEmoji = (emoji: string) => {
    setMood(prev => prev + emoji)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitting) return

    if (!symptomType.trim()) {
      setErrorMsg('Symptom type is required.')
      return
    }

    if (!mood.trim()) {
      setErrorMsg('Mood is required.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    setSuccess(false)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      if (!userId) {
        throw new Error('User not authenticated.')
      }

      const { error } = await supabase.from('symptom_logs').insert([
        {
          user_id: userId,
          symptom_type: symptomType.trim(),
          severity,
          mood: mood.trim(),
          sleep,
          notes: notes.trim()
        }
      ])

      if (error) {
        // Duplicate daily log handling
        if (error.message.includes('idx_unique_daily_log')) {
          throw new Error('You have already logged today’s symptom.')
        }
        throw error
      }

      setSuccess(true)
      resetForm()

      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 1200)

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">
        Log Today's Symptom
      </h2>

      {/* Symptom Type */}
      <div>
        <input
          ref={inputRef}
          value={symptomType}
          onChange={(e) => setSymptomType(e.target.value)}
          placeholder="Hot flashes, mood swings..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
      </div>

      {/* Severity */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Severity: <span className="text-purple-600 font-semibold">{severity}/10</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="w-full accent-purple-600"
        />
      </div>

      {/* Mood */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Mood (Describe freely, add emoji)
        </label>

        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="Happy 😊, exhausted 😴, anxious 😰..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {quickEmojis.map((emoji) => (
            <button
              type="button"
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-xl hover:scale-110 active:scale-95 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Sleep Quality: <span className="text-purple-600 font-semibold">{sleep}/10</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={sleep}
          onChange={(e) => setSleep(Number(e.target.value))}
          className="w-full accent-purple-600"
        />
      </div>

      {/* Notes */}
      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else?"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none outline-none transition"
        />
      </div>

      {/* Feedback */}
      {errorMsg && (
        <div className="text-red-500 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm font-medium">
          ✓ Logged successfully
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition disabled:opacity-50"
      >
        {submitting ? 'Logging...' : "Log Today's Symptom"}
      </button>
    </form>
  )
}