export const metadata = {
  title: 'Partner Referral',
  description: 'Connect with our trusted partners',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
