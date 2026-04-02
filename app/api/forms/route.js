import { NextResponse } from 'next/server'
import { getAdminClient } from '../../../lib/supabase'

function isAdmin(request) {
  var url = new URL(request.url)
  var pw = request.headers.get('x-admin-password') || url.searchParams.get('adminpw') || ''
  return pw === process.env.ADMIN_PASSWORD
}

export async function GET(request) {
  var supabase = getAdminClient()
  var url = new URL(request.url)
  var slug = url.searchParams.get('slug')

  if (slug) {
    var result = await supabase.from('forms').select('*').eq('slug', slug).single()
    if (result.error || !result.data) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json(result.data)
  }

  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  var all = await supabase.from('forms').select('*').order('created_at', { ascending: false })
  if (all.error) {
    return NextResponse.json({ error: all.error.message }, { status: 500 })
  }
  return NextResponse.json(all.data)
}

export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  var supabase = getAdminClient()
  var body = await request.json()

  var result = await supabase.from('forms').insert({
    form_name: body.form_name,
    slug: body.slug,
    host_name: body.host_name,
    host_email: body.host_email,
    partner_name: body.partner_name,
    partner_email: body.partner_email,
    primary_color: body.primary_color || '#3B5BDB',
    secondary_color: body.secondary_color || '#5C7CFA',
    logo_url: body.logo_url || null,
    opt_in_enabled: body.opt_in_enabled !== false,
    opt_in_text: body.opt_in_text || null,
    opt_in_url: body.opt_in_url || null,
    fields: body.fields,
  }).select().single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }
  return NextResponse.json(result.data, { status: 201 })
}
