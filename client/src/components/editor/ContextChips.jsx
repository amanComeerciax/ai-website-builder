/**
 * ContextChips.jsx — V3.0 Context Collection UI
 * 
 * Shown between user's first message and AI generation.
 * Lets the user answer AI-generated clarifying questions via:
 * - Text inputs (business name, etc.)
 * - Quick-select chips (vibe presets, etc.)
 * 
 * Props:
 *   questions: Array<{ text: string, type: 'text_input'|'chip_select', chips: string[] }>
 *   onSubmit(answers): Called when user submits answers (or skips)
 *   onSkip():          Called when user wants to skip and generate immediately
 */

import { useState } from 'react'
import { ArrowRight, Zap } from 'lucide-react'
import './ContextChips.css'

export default function ContextChips({ questions = [], onSubmit, onSkip }) {
  const [answers, setAnswers] = useState(
    questions.map(q => ({ question: q.text, answer: '' }))
  )

  const setAnswer = (idx, value) => {
    setAnswers(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], answer: value }
      return next
    })
  }

  const handleSubmit = () => {
    const filled = answers.filter(a => a.answer.trim())
    onSubmit(filled)
  }

  if (!questions || questions.length === 0) return null

  return (
    <div className="ctx-container">
      <div className="ctx-header">
        <Zap size={14} className="ctx-header-icon" />
        <span>A few quick questions to make it perfect</span>
      </div>

      <div className="ctx-questions">
        {questions.map((q, idx) => (
          <div key={idx} className="ctx-question">
            <label className="ctx-label">{q.text}</label>

            {q.type === 'chip_select' && q.chips.length > 0 ? (
              <div className="ctx-chips">
                {q.chips.map((chip, ci) => (
                  <button
                    key={ci}
                    className={`ctx-chip ${answers[idx]?.answer === chip ? 'ctx-chip-active' : ''}`}
                    onClick={() => setAnswer(idx, answers[idx]?.answer === chip ? '' : chip)}
                  >
                    {chip}
                  </button>
                ))}
                {/* Also allow typing a custom answer */}
                <input
                  type="text"
                  className="ctx-custom-input"
                  placeholder="or type your own..."
                  value={q.chips.includes(answers[idx]?.answer) ? '' : answers[idx]?.answer}
                  onChange={e => setAnswer(idx, e.target.value)}
                />
              </div>
            ) : (
              <input
                type="text"
                className="ctx-text-input"
                placeholder="Type your answer..."
                value={answers[idx]?.answer || ''}
                onChange={e => setAnswer(idx, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="ctx-actions">
        <button className="ctx-skip-btn" onClick={onSkip}>
          Skip — generate now
        </button>
        <button className="ctx-submit-btn" onClick={handleSubmit}>
          Build it <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
