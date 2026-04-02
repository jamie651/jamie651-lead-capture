import { NextResponse } from 'next/server'
import { getAdminClient } from '../../../lib/supabase'
import { sendEmail, buildEmail } from '../../../lib/email'

export async function POST(request) {
  var supabase = getAdminClient()
  var body = await request.json()
  var form_id = body.form_id
  var customerData = body.data

  // 1. Get the form config
  var formResult = await supabase.from('forms').select('*').eq('id', form_id).single()
  if (formResult.error || !formResult.data) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }
  var form = formResult.data

  // 2. Save the submission
  var subResult = await supabase.from('submissions').insert({ form_id: form_id, data: customerData })
  if (subResult.error) {
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  // 3. Increment submission counter
  await supabase.from('forms').update({ submissions: (form.submissions || 0) + 1 }).eq('id', form_id)

  // 4. Send emails to all three parties
  var emailSubject = 'New Referral: ' + form.form_name

  try {
    // Email to the host (realtor)
    await sendEmail({
      to: form.host_email,
      subject: emailSubject,
      html: buildEmail({
        formName: form.form_name,
        hostName: form.host_name,
        partnerName: form.partner_name,
        customerData: customerData,
        recipientType: 'host',
      }),
    })

    // Email to the partner
    await sendEmail({
      to: form.partner_email,
      subject: emailSubject,
      html: buildEmail({
        formName: form.form_name,
        hostName: form.host_name,
        partnerName: form.partner_name,
        customerData: customerData,
        recipientType: 'partner',
      }),
    })

    // Email to the customer (if they provided an email)
    var customerEmail = customerData.email || customerData.Email || customerData.email_address
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: 'Your referral with ' + form.host_name + ' & ' + form.partner_name,
        html: buildEmail({
          formName: form.form_name,
          hostName: form.host_name,
          partnerName: form.partner_name,
          customerData: customerData,
          recipientType: 'customer',
        }),
      })
    }
  } catch (emailError) {
    console.error('Email sending failed:', emailError)
  }

  return NextResponse.json({ success: true })
}
