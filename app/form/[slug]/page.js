'use client'

import { useState, useEffect } from 'react'

export default function FormPage({ params, searchParams }) {
  var slug = params.slug
  var isEmbed = searchParams.embed === '1'
  var [form, setForm] = useState(null)
  var [formData, setFormData] = useState({})
  var [optedIn, setOptedIn] = useState(true)
  var [loading, setLoading] = useState(true)
  var [submitting, setSubmitting] = useState(false)
  var [submitted, setSubmitted] = useState(false)
  var [error, setError] = useState(null)
  var [step, setStep] = useState(0)
  var [direction, setDirection] = useState('forward')
  var [animating, setAnimating] = useState(false)
  var [mounted, setMounted] = useState(false)

  useEffect(function () {
    setTimeout(function () { setMounted(true) }, 50)
  }, [])

  useEffect(function () {
    async function loadForm() {
      try {
        var res = await fetch('/api/forms?slug=' + slug)
        if (!res.ok) throw new Error('Form not found')
        var data = await res.json()
        setForm(data)

        var prefilled = {}
        data.fields.forEach(function (field) {
          var urlValue = searchParams[field.name]
          prefilled[field.name] = urlValue || ''
        })
        setFormData(prefilled)

        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form_id: data.id }),
        })
      } catch (err) {
        setError('This form could not be found.')
      } finally {
        setLoading(false)
      }
    }
    loadForm()
  }, [slug, searchParams])

  function handleChange(fieldName, value) {
    setFormData(function (prev) { return Object.assign({}, prev, { [fieldName]: value }) })
  }

  // Split fields into steps (2-3 fields per step)
  function getSteps() {
    if (!form) return []
    var fields = form.fields
    var steps = []
    var perStep = Math.ceil(fields.length / Math.ceil(fields.length / 2))
    for (var i = 0; i < fields.length; i += perStep) {
      steps.push(fields.slice(i, i + perStep))
    }
    // Add consent as final step if enabled
    if (form.opt_in_enabled) {
      steps.push([{ name: '__consent__', type: 'consent' }])
    }
    return steps
  }

  var steps = getSteps()
  var totalSteps = steps.length
  var isLastStep = step === totalSteps - 1
  var isConsentStep = steps[step] && steps[step][0] && steps[step][0].type === 'consent'

  function goNext() {
    // Validate required fields on current step
    if (!isConsentStep) {
      var currentFields = steps[step]
      for (var i = 0; i < currentFields.length; i++) {
        var f = currentFields[i]
        if (f.required && !formData[f.name]) {
          setError(f.label + ' is required')
          return
        }
      }
    }
    if (isConsentStep && form.opt_in_enabled && !optedIn) {
      setError('Please accept the terms to continue.')
      return
    }
    setError(null)
    if (isLastStep) {
      handleSubmit()
      return
    }
    setDirection('forward')
    setAnimating(true)
    setTimeout(function () {
      setStep(step + 1)
      setTimeout(function () { setAnimating(false) }, 50)
    }, 200)
  }

  function goBack() {
    if (step === 0) return
    setError(null)
    setDirection('backward')
    setAnimating(true)
    setTimeout(function () {
      setStep(step - 1)
      setTimeout(function () { setAnimating(false) }, 50)
    }, 200)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      var res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: form.id, data: formData }),
      })
      if (!res.ok) {
        var errData = await res.json()
        throw new Error(errData.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  var primaryColor = form ? form.primary_color : '#3B5BDB'
  var secondaryColor = form ? form.secondary_color : '#5C7CFA'

  // CSS keyframes injected via style tag
  var globalStyles = '<style>' +
    '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");' +
    '@keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }' +
    '@keyframes fadeOutUp { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-16px); } }' +
    '@keyframes fadeInDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }' +
    '@keyframes fadeOutDown { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(16px); } }' +
    '@keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }' +
    '@keyframes checkPop { 0% { transform:scale(0); } 50% { transform:scale(1.2); } 100% { transform:scale(1); } }' +
    '@keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }' +
    '@keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }' +
    '</style>'

  // Loading
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: isEmbed ? '100%' : '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: isEmbed ? 'transparent' : '#f8f9fa' }}>
        <div dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: primaryColor, animation: 'float 1s ease infinite' }}></div>
      </div>
    )
  }

  // Not found
  if (!form) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: isEmbed ? '100%' : '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h1 style={{ color: '#333' }}>Form Not Found</h1>
          <p style={{ color: '#888' }}>{error}</p>
        </div>
      </div>
    )
  }

  // Success
  if (submitted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: isEmbed ? '100%' : '100vh', background: isEmbed ? 'transparent' : '#f8f9fa', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <div style={{ textAlign: 'center', padding: 48, maxWidth: 420, animation: 'scaleIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          {form.logo_url ? <img src={form.logo_url} alt="Logo" style={{ maxHeight: 50, marginBottom: 24 }} /> : null}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 32, color: 'white',
            boxShadow: '0 12px 32px -4px ' + primaryColor + '44',
            animation: 'checkPop 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both',
          }}>&#10003;</div>
          <h1 style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>You&apos;re All Set!</h1>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7 }}>
            {form.host_name} and {form.partner_name} have received your information and will be in touch shortly.
          </p>
          {isEmbed ? (
            <button onClick={function () { window.parent.postMessage('lc-close', '*') }}
              style={{
                marginTop: 24, padding: '12px 32px', borderRadius: 12, border: 'none',
                background: '#f3f4f6', color: '#374151', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Close</button>
          ) : null}
        </div>
      </div>
    )
  }

  var termsUrl = form.opt_in_url || ('/terms/' + form.slug)

  // Step animation style
  var stepStyle = {
    animation: animating
      ? (direction === 'forward' ? 'fadeOutUp 0.2s ease forwards' : 'fadeOutDown 0.2s ease forwards')
      : (direction === 'forward' ? 'fadeInUp 0.3s ease forwards' : 'fadeInDown 0.3s ease forwards'),
  }

  // Progress percentage
  var progress = totalSteps > 1 ? ((step + 1) / totalSteps) * 100 : 100

  var inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '2px solid #eef0f2', background: '#fafbfc',
    fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, color: '#1f2937',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: isEmbed ? '100%' : '100vh', padding: isEmbed ? '1rem' : '1.5rem',
      background: isEmbed ? 'transparent' : '#f8f9fa',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{
        width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden', background: '#fff',
        boxShadow: isEmbed ? 'none' : '0 25px 60px -12px rgba(59,91,219,0.15), 0 0 0 1px rgba(0,0,0,0.03)',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          position: 'relative', padding: '2rem 2rem 1.75rem',
          background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-3rem', right: '-3rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
          <div style={{ position: 'absolute', bottom: '-2rem', left: '-2rem', width: '7rem', height: '7rem', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
          <div style={{ position: 'absolute', top: '2rem', right: '5rem', width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
          {form.logo_url ? <img src={form.logo_url} alt="Logo" style={{ maxHeight: 36, marginBottom: 12, position: 'relative', zIndex: 1, filter: 'brightness(0) invert(1)', opacity: 0.9 }} /> : null}
          <h2 style={{ position: 'relative', zIndex: 1, color: '#fff', fontSize: '1.2rem', fontWeight: 600, marginBottom: 4 }}>{form.form_name}</h2>
          <p style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', margin: 0 }}>
            {form.host_name} &amp; {form.partner_name}
          </p>

          {/* Progress bar */}
          {totalSteps > 1 ? (
            <div style={{ position: 'relative', zIndex: 1, marginTop: 16, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, background: 'rgba(255,255,255,0.8)',
                width: progress + '%', transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}></div>
            </div>
          ) : null}
          {totalSteps > 1 ? (
            <p style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 6, marginBottom: 0 }}>
              Step {step + 1} of {totalSteps}
            </p>
          ) : null}
        </div>

        {/* Form body */}
        <div style={{ padding: '1.75rem 2rem 2rem' }}>
          <div key={step} style={stepStyle}>
            {isConsentStep ? (
              /* Consent step */
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Almost there!</h3>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Just confirm below and you&apos;re all set.</p>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #f0f0f0',
                }}>
                  <button type="button" onClick={function () { setOptedIn(!optedIn) }}
                    style={{
                      flexShrink: 0, width: 48, height: 26, borderRadius: 13, border: 'none',
                      background: optedIn ? primaryColor : '#d1d5db',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s', marginTop: 1,
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3, left: optedIn ? 25 : 3,
                      transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }}></div>
                  </button>
                  <span style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                    {form.opt_in_text || 'I consent to sharing my information with the parties listed above.'}{' '}
                    <a href={termsUrl} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'none', fontWeight: 500 }}>
                      View terms &rarr;
                    </a>
                  </span>
                </div>
              </div>
            ) : (
              /* Field steps */
              <div>
                {step === 0 ? (
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Let&apos;s get started</h3>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Fill in your details below.</p>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>A few more details</h3>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>You&apos;re almost done!</p>
                  </div>
                )}
                {steps[step].map(function (field, idx) {
                  return (
                    <div key={field.name} style={{
                      marginBottom: 18,
                      animation: 'fadeInUp 0.4s ease ' + (idx * 0.08) + 's both',
                    }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>
                        {field.label} {field.required ? <span style={{ color: primaryColor }}>*</span> : null}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={function (e) { handleChange(field.name, e.target.value) }}
                          required={field.required}
                          rows={3}
                          placeholder={field.placeholder || ''}
                          style={Object.assign({}, inputStyle, { resize: 'none', fontFamily: "'Inter', system-ui, sans-serif" })}
                          onFocus={function (e) { e.target.style.borderColor = primaryColor; e.target.style.boxShadow = '0 0 0 4px ' + primaryColor + '12'; e.target.style.background = '#fff' }}
                          onBlur={function (e) { e.target.style.borderColor = '#eef0f2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={function (e) { handleChange(field.name, e.target.value) }}
                          required={field.required}
                          style={Object.assign({}, inputStyle)}
                        >
                          <option value="">Select...</option>
                          {(field.options || []).map(function (opt) {
                            return <option key={opt} value={opt}>{opt}</option>
                          })}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData[field.name] || ''}
                          onChange={function (e) { handleChange(field.name, e.target.value) }}
                          required={field.required}
                          placeholder={field.placeholder || ''}
                          style={inputStyle}
                          onFocus={function (e) { e.target.style.borderColor = primaryColor; e.target.style.boxShadow = '0 0 0 4px ' + primaryColor + '12'; e.target.style.background = '#fff' }}
                          onBlur={function (e) { e.target.style.borderColor = '#eef0f2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error ? (
            <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px', animation: 'fadeInUp 0.3s ease' }}>{error}</p>
          ) : null}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {step > 0 ? (
              <button type="button" onClick={goBack}
                style={{
                  padding: '14px 20px', borderRadius: 12, border: '2px solid #eef0f2',
                  background: '#fff', color: '#6b7280', fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={function (e) { e.target.style.borderColor = '#d1d5db' }}
                onMouseOut={function (e) { e.target.style.borderColor = '#eef0f2' }}
              >Back</button>
            ) : null}
            <button type="button" onClick={goNext} disabled={submitting}
              style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
                color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px -4px ' + primaryColor + '44',
                transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
                opacity: submitting ? 0.7 : 1,
              }}
              onMouseOver={function (e) { if (!submitting) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 12px 28px -4px ' + primaryColor + '55' } }}
              onMouseOut={function (e) { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 8px 24px -4px ' + primaryColor + '44' }}
            >
              {submitting ? 'Submitting...' : isLastStep ? 'Submit' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
