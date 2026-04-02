import { NextResponse } from 'next/server'
import { getAdminClient } from '../../../lib/supabase'

export async function POST(request) {
  var supabase = getAdminClient()
  var body = await request.json()
  var form_id = body.form_id

  var result = await supabase.from('forms').select('views').eq('id', form_id).single()
  if (!result.data) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  await supabase.from('forms').update({ views: (result.data.views || 0) + 1 }).eq('id', form_id)

  return NextResponse.json({ success: true })
}
