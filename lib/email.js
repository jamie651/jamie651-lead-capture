export async function sendEmail({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: to,
      subject: subject,
      html: html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error('Email error: ' + error)
  }

  return response.json()
}

export function buildEmail({ formName, hostName, partnerName, customerData, recipientType }) {
  const dataRows = Object.entries(customerData)
    .map(([key, value]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#555;text-transform:capitalize;">${key.replace(/_/g, ' ')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">${value || 'N/A'}</td>
      </tr>
    `)
    .join('')

  let intro = ''
  if (recipientType === 'host') {
    intro = '<p>A new lead has been submitted through your <strong>' + formName + '</strong> form. The customer has been referred to your partner <strong>' + partnerName + '</strong>.</p>'
  } else if (recipientType === 'partner') {
    intro = '<p>You\'ve received a new referral from <strong>' + hostName + '</strong> through their <strong>' + formName + '</strong> form.</p>'
  } else {
    intro = '<p>Thanks for your interest! Your information has been shared with <strong>' + hostName + '</strong> and their trusted partner <strong>' + partnerName + '</strong>. Someone will be in touch shortly.</p>'
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#333;border-bottom:2px solid #2563eb;padding-bottom:10px;">New Lead Referral</h2>
      ${intro}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        ${dataRows}
      </table>
      <p style="color:#888;font-size:12px;margin-top:30px;">This email was sent automatically by the lead capture system.</p>
    </div>
  `
}
