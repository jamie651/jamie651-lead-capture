import { NextResponse } from 'next/server'
import { getAdminClient } from '../../../../lib/supabase'

function isAdmin(request) {
  var url = new URL(request.url)
  var pw = request.headers.get('x-admin-password') || url.searchParams.get('adminpw') || ''
  return pw === process.env.ADMIN_PASSWORD
}

export async function PUT(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  var supabase = getAdminClient()
  var body = await request.json()

  var result = await supabase.from('forms').update({
    form_name: body.form_name,
    slug: body.slug,
    host_name: body.host_name,
    host_email: body.host_email,
    partner_name: body.partner_name,
    partner_email: body.partner_email,
    primary_color: body.primary_color,
    secondary_color: body.secondary_color,
    logo_url: body.logo_url || null,
    opt_in_enabled: body.opt_in_enabled !== false,
    opt_in_text: body.opt_in_text || null,
    opt_in_url: body.opt_in_url || null,
    fields: body.fields,
  }).eq('id', params.id).select().single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }
  return NextResponse.json(result.data)
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  var supabase = getAdminClient()
  await supabase.from('submissions').delete().eq('form_id', params.id)
  var result = await supabase.from('forms').delete().eq('id', params.id)

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
