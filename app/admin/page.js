'use client'

import { useState } from 'react'

var DEFAULT_OPT_IN_TEXT = 'I consent to sharing my information with the parties listed above, who may contact me regarding my inquiry.'

var EMPTY_FORM = {
  form_name: '',
  slug: '',
  host_name: '',
  host_email: '',
  partner_name: '',
  partner_email: '',
  primary_color: '#3B5BDB',
  secondary_color: '#5C7CFA',
  logo_url: '',
  opt_in_enabled: true,
  opt_in_text: DEFAULT_OPT_IN_TEXT,
  opt_in_url: '',
  fields: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: false },
  ],
}

var S = {
  container: { maxWidth: 900, margin: '0 auto', padding: '20px' },
  card: { background: 'white', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 24, marginBottom: 16 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  label: { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' },
  btn: { padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
}

export default function AdminPage() {
  var [password, setPassword] = useState('')
  var [authenticated, setAuthenticated] = useState(false)
  var [authError, setAuthError] = useState('')
  var [forms, setForms] = useState([])
  var [showCreateForm, setShowCreateForm] = useState(false)
  var [editingForm, setEditingForm] = useState(null)
  var [formConfig, setFormConfig] = useState(JSON.parse(JSON.stringify(EMPTY_FORM)))
  var [saving, setSaving] = useState(false)

  // ---- Auth ----
  async function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    try {
      var res = await fetch('/api/forms?adminpw=' + encodeURIComponent(password))
      if (res.ok) {
        setAuthenticated(true)
        var data = await res.json()
        setForms(data)
      } else {
        var err = await res.json()
        setAuthError('Login failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      setAuthError('Connection error: ' + err.message)
    }
  }

  // ---- Load forms ----
  async function loadForms() {
    var res = await fetch('/api/forms?adminpw=' + encodeURIComponent(password))
    if (res.ok) {
      var data = await res.json()
      setForms(data)
    }
  }

  // ---- Save form ----
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    var url = editingForm
      ? '/api/forms/' + editingForm.id + '?adminpw=' + encodeURIComponent(password)
      : '/api/forms?adminpw=' + encodeURIComponent(password)
    var method = editingForm ? 'PUT' : 'POST'

    var res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formConfig),
    })

    if (res.ok) {
      setShowCreateForm(false)
      setEditingForm(null)
      setFormConfig(JSON.parse(JSON.stringify(EMPTY_FORM)))
      loadForms()
    } else {
      var err = await res.json()
      alert(err.error || 'Failed to save')
    }
    setSaving(false)
  }

  // ---- Delete form ----
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this form?')) return
    await fetch('/api/forms/' + id + '?adminpw=' + encodeURIComponent(password), { method: 'DELETE' })
    loadForms()
  }

  // ---- Edit form ----
  function handleEdit(form) {
    setFormConfig({
      form_name: form.form_name,
      slug: form.slug,
      host_name: form.host_name,
      host_email: form.host_email,
      partner_name: form.partner_name,
      partner_email: form.partner_email,
      primary_color: form.primary_color || '#3B5BDB',
      secondary_color: form.secondary_color || '#5C7CFA',
      logo_url: form.logo_url || '',
      opt_in_enabled: form.opt_in_enabled !== false,
      opt_in_text: form.opt_in_text || DEFAULT_OPT_IN_TEXT,
      opt_in_url: form.opt_in_url || '',
      fields: form.fields,
    })
    setEditingForm(form)
    setShowCreateForm(true)
  }

  // ---- Field helpers ----
  function addField() {
    var updated = JSON.parse(JSON.stringify(formConfig))
    updated.fields.push({ name: '', label: '', type: 'text', required: false })
    setFormConfig(updated)
  }

  function removeField(index) {
    var updated = JSON.parse(JSON.stringify(formConfig))
    updated.fields.splice(index, 1)
    setFormConfig(updated)
  }

  function updateField(index, key, value) {
    var updated = JSON.parse(JSON.stringify(formConfig))
    updated.fields[index][key] = value
    if (key === 'label') {
      updated.fields[index].name = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    }
    setFormConfig(updated)
  }

  function autoSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function cancelCreate() {
    setShowCreateForm(false)
    setEditingForm(null)
    setFormConfig(JSON.parse(JSON.stringify(EMPTY_FORM)))
  }

  // ============================
  // LOGIN SCREEN
  // ============================
  if (!authenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 24, width: 360, textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, color: '#1f2937' }}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={function (e) { setPassword(e.target.value) }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
            />
            {authError ? <p style={{ color: '#ef4444', fontSize: 13 }}>{authError}</p> : null}
            <button type="submit" style={{ padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#2563eb', color: 'white', width: '100%' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ============================
  // CREATE / EDIT FORM SCREEN
  // ============================
  if (showCreateForm) {
    return (
      <div style={S.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>{editingForm ? 'Edit Form' : 'Create New Form'}</h2>
          <button onClick={cancelCreate} style={{ padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#f3f4f6', color: '#374151' }}>Cancel</button>
        </div>

        <form onSubmit={handleSave}>
          {/* Basic Info */}
          <div style={S.card}>
            <h3 style={{ marginTop: 0, color: '#374151', fontSize: 16 }}>Basic Info</h3>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Form Name</label>
                <input style={S.input} value={formConfig.form_name} placeholder="e.g. Mortgage Referral" required
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { form_name: e.target.value, slug: formConfig.slug || autoSlug(e.target.value) })) }} />
              </div>
              <div>
                <label style={S.label}>URL Slug</label>
                <input style={S.input} value={formConfig.slug} placeholder="e.g. mortgage-referral" required
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { slug: autoSlug(e.target.value) })) }} />
                <small style={{ color: '#9ca3af' }}>Form URL: /form/{formConfig.slug || '...'}</small>
              </div>
            </div>
          </div>

          {/* Host & Partner */}
          <div style={S.card}>
            <h3 style={{ marginTop: 0, color: '#374151', fontSize: 16 }}>Host (Realtor)</h3>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Host Name</label>
                <input style={S.input} value={formConfig.host_name} placeholder="e.g. Jane Smith Realty" required
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { host_name: e.target.value })) }} />
              </div>
              <div>
                <label style={S.label}>Host Email</label>
                <input style={S.input} type="email" value={formConfig.host_email} placeholder="e.g. jane@realty.com" required
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { host_email: e.target.value })) }} />
              </div>
            </div>
            <h3 style={{ color: '#374151', fontSize: 16, marginTop: 16 }}>Partner (e.g. Mortgage Broker)</h3>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Partner Name</label>
                <input style={S.input} value={formConfig.partner_name} placeholder="e.g. ABC Mortgages" required
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { partner_name: e.target.value })) }} />
              </div>
              <div>
                <label style={S.label}>Partner Email</label>
                <input style={S.input} type="email" value={formConfig.partner_email} placeholder="e.g. info@abcmortgages.com" required
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { partner_email: e.target.value })) }} />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div style={S.card}>
            <h3 style={{ marginTop: 0, color: '#374151', fontSize: 16 }}>Branding</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16 }}>
              <div>
                <label style={S.label}>Primary Color</label>
                <input type="color" value={formConfig.primary_color} style={{ width: '100%', height: 42, border: 'none', cursor: 'pointer' }}
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { primary_color: e.target.value })) }} />
              </div>
              <div>
                <label style={S.label}>Secondary Color</label>
                <input type="color" value={formConfig.secondary_color} style={{ width: '100%', height: 42, border: 'none', cursor: 'pointer' }}
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { secondary_color: e.target.value })) }} />
              </div>
              <div>
                <label style={S.label}>Logo URL (optional)</label>
                <input style={S.input} value={formConfig.logo_url} placeholder="https://example.com/logo.png"
                  onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { logo_url: e.target.value })) }} />
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, ' + formConfig.primary_color + ', ' + formConfig.secondary_color + ')', color: 'white', textAlign: 'center', fontSize: 14 }}>
              Header Preview
            </div>
          </div>

          {/* Opt-In Settings */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#374151', fontSize: 16 }}>Opt-In / Terms</h3>
              <button type="button"
                onClick={function () { setFormConfig(Object.assign({}, formConfig, { opt_in_enabled: !formConfig.opt_in_enabled })) }}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none',
                  background: formConfig.opt_in_enabled ? '#2563eb' : '#d1d5db',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: formConfig.opt_in_enabled ? 23 : 3,
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}></div>
              </button>
            </div>
            {formConfig.opt_in_enabled ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Consent Text</label>
                  <textarea style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 60, resize: 'vertical' }}
                    value={formConfig.opt_in_text}
                    onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { opt_in_text: e.target.value })) }}
                    placeholder="I consent to sharing my information..." />
                </div>
                <div>
                  <label style={S.label}>Terms Page URL (leave blank for default)</label>
                  <input style={S.input} value={formConfig.opt_in_url}
                    onChange={function (e) { setFormConfig(Object.assign({}, formConfig, { opt_in_url: e.target.value })) }}
                    placeholder="https://example.com/terms — or leave blank for built-in page" />
                </div>
              </div>
            ) : null}
          </div>

          {/* Form Fields */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#374151', fontSize: 16 }}>Form Fields</h3>
              <button type="button" onClick={addField} style={{ padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#f0fdf4', color: '#16a34a' }}>+ Add Field</button>
            </div>
            {formConfig.fields.map(function (field, i) {
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input style={S.input} placeholder="Label (e.g. Full Name)" value={field.label} required
                    onChange={function (e) { updateField(i, 'label', e.target.value) }} />
                  <select style={S.input} value={field.type}
                    onChange={function (e) { updateField(i, 'type', e.target.value) }}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="textarea">Text Area</option>
                    <option value="select">Dropdown</option>
                  </select>
                  <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="checkbox" checked={field.required}
                      onChange={function (e) { updateField(i, 'required', e.target.checked) }} />
                    Req&apos;d
                  </label>
                  <button type="button" onClick={function () { removeField(i) }}
                    style={{ padding: '6px 10px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fef2f2', color: '#ef4444' }}>X</button>
                </div>
              )
            })}
          </div>

          <button type="submit" disabled={saving}
            style={{ padding: '14px 20px', border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: 'pointer', background: '#2563eb', color: 'white', width: '100%' }}>
            {saving ? 'Saving...' : editingForm ? 'Update Form' : 'Create Form'}
          </button>
        </form>
      </div>
    )
  }

  // ============================
  // DASHBOARD SCREEN
  // ============================
  return (
    <div style={S.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#1f2937' }}>Lead Capture Admin</h1>
        <button onClick={function () { setShowCreateForm(true) }}
          style={{ padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#2563eb', color: 'white' }}>
          + New Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 60, textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: 16 }}>No forms yet. Click &quot;+ New Form&quot; to get started!</p>
        </div>
      ) : (
        forms.map(function (form) {
          var convRate = form.views > 0 ? Math.round((form.submissions / form.views) * 100) : 0
          var siteOrigin = typeof window !== 'undefined' ? window.location.origin : ''
          var embedCode = '<iframe src="' + siteOrigin + '/form/' + form.slug + '" width="100%" height="700" style="border:none;"></iframe>'
          var modalCode = '<script src="' + siteOrigin + '/embed.js" data-form="' + form.slug + '"><\/script>'
          var modalTrigger = '<button data-lc-open>Get Started</button>'

          return (
            <div key={form.id} style={S.card}>
              {/* Title row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', color: '#1f2937' }}>{form.form_name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{form.host_name} &rarr; {form.partner_name}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={function () { handleEdit(form) }} style={{ padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#f3f4f6', color: '#374151' }}>Edit</button>
                  <button onClick={function () { handleDelete(form.id) }} style={{ padding: '10px 20px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fef2f2', color: '#ef4444' }}>Delete</button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{form.views || 0}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 6 }}>views</span>
                </div>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{form.submissions || 0}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 6 }}>submissions</span>
                </div>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{convRate}%</span>
                  <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 6 }}>conversion</span>
                </div>
              </div>

              {/* Form URL */}
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 6, fontSize: 13 }}>
                <span style={{ color: '#9ca3af' }}>Form URL: </span>
                <a href={'/form/' + form.slug} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>/form/{form.slug}</a>
              </div>

              {/* Modal popup embed (recommended) */}
              <div style={{ marginTop: 8, padding: '10px 12px', background: '#f0fdf4', borderRadius: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>RECOMMENDED</span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>Modal Popup</span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>Add this script to the host&apos;s page. Then add data-lc-open to any button to trigger the popup.</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={function () { navigator.clipboard.writeText(modalCode + '\n' + modalTrigger); alert('Modal code copied!') }}
                    style={{ padding: '4px 10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                    Copy Script + Button
                  </button>
                  <button onClick={function () { navigator.clipboard.writeText(modalCode); alert('Script tag copied!') }}
                    style={{ padding: '4px 10px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                    Script Only
                  </button>
                </div>
              </div>

              {/* Iframe embed (fallback) */}
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0f9ff', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}>iFrame: </span>
                <code style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{embedCode}</code>
                <button
                  onClick={function () { navigator.clipboard.writeText(embedCode); alert('Embed code copied!') }}
                  style={{ flexShrink: 0, padding: '4px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
