'use client'

import { useState, useEffect } from 'react'

export default function TermsPage({ params }) {
  var slug = params.slug
  var [form, setForm] = useState(null)

  useEffect(function () {
    async function loadForm() {
      try {
        var res = await fetch('/api/forms?slug=' + slug)
        if (res.ok) {
          var data = await res.json()
          setForm(data)
        }
      } catch (err) {
        // ignore
      }
    }
    loadForm()
  }, [slug])

  var hostName = form ? form.host_name : 'the referring party'
  var partnerName = form ? form.partner_name : 'their partner'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', color: '#374151', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', marginBottom: 24 }}>Terms &amp; Consent</h1>

      <p>By submitting the referral form, you acknowledge and agree to the following:</p>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginTop: 24 }}>Information Sharing</h3>
      <p>The personal information you provide (including your name, email address, phone number, and any additional details) will be shared with <strong>{hostName}</strong> and their trusted partner <strong>{partnerName}</strong> for the sole purpose of responding to your inquiry and providing the services you have requested.</p>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginTop: 24 }}>How Your Information Is Used</h3>
      <p>Both {hostName} and {partnerName} may contact you via email, phone, or text message regarding your inquiry. Your information will not be sold to third parties or used for purposes unrelated to your request.</p>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginTop: 24 }}>Data Storage</h3>
      <p>Your submission is stored securely and is only accessible to authorized personnel. You may request deletion of your data at any time by contacting either {hostName} or {partnerName} directly.</p>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginTop: 24 }}>Your Rights</h3>
      <p>You have the right to withdraw your consent at any time by contacting the parties listed above. Withdrawing consent does not affect the lawfulness of any processing carried out prior to your withdrawal.</p>

      <p style={{ marginTop: 32, color: '#9ca3af', fontSize: '0.875rem' }}>Last updated: February 2026</p>
    </div>
  )
}
