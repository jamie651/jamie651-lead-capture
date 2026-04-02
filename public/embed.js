(function () {
  // Find the script tag to get config
  var scripts = document.querySelectorAll('script[data-form]')
  var currentScript = scripts[scripts.length - 1]
  var formSlug = currentScript.getAttribute('data-form')
  var baseUrl = currentScript.src.replace('/embed.js', '')

  // Inject styles
  var style = document.createElement('style')
  style.textContent = [
    '.lc-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0); z-index:99999; justify-content:center; align-items:center; transition:background 0.3s ease; }',
    '.lc-overlay.lc-open { display:flex; }',
    '.lc-overlay.lc-visible { background:rgba(0,0,0,0.5); }',
    '.lc-frame-wrap { width:100%; max-width:460px; max-height:90vh; border-radius:20px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.3); transform:translateY(30px) scale(0.95); opacity:0; transition:transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease; }',
    '.lc-visible .lc-frame-wrap { transform:translateY(0) scale(1); opacity:1; }',
    '.lc-frame-wrap iframe { width:100%; height:90vh; border:none; display:block; }',
    '.lc-close { position:absolute; top:12px; right:16px; width:36px; height:36px; border-radius:50%; background:rgba(0,0,0,0.4); border:none; color:white; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s, transform 0.2s; z-index:10; backdrop-filter:blur(4px); }',
    '.lc-close:hover { background:rgba(0,0,0,0.6); transform:scale(1.1); }',
    '@media(max-width:500px) { .lc-frame-wrap { max-width:100%; max-height:100vh; border-radius:0; } .lc-frame-wrap iframe { height:100vh; } }',
  ].join('\n')
  document.head.appendChild(style)

  // Create overlay
  var overlay = document.createElement('div')
  overlay.className = 'lc-overlay'
  overlay.innerHTML = '<button class="lc-close" aria-label="Close">&times;</button><div class="lc-frame-wrap"><iframe src="about:blank" title="Partner Form"></iframe></div>'
  document.body.appendChild(overlay)

  var iframe = overlay.querySelector('iframe')
  var closeBtn = overlay.querySelector('.lc-close')

  // Open modal
  function openModal() {
    iframe.src = baseUrl + '/form/' + formSlug + '?embed=1'
    overlay.classList.add('lc-open')
    document.body.style.overflow = 'hidden'
    // Trigger animation on next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('lc-visible')
      })
    })
  }

  // Close modal
  function closeModal() {
    overlay.classList.remove('lc-visible')
    document.body.style.overflow = ''
    setTimeout(function () {
      overlay.classList.remove('lc-open')
      iframe.src = 'about:blank'
    }, 300)
  }

  // Close on X button
  closeBtn.addEventListener('click', closeModal)

  // Close on overlay click (not on the form itself)
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal()
  })

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal()
  })

  // Listen for messages from the iframe (e.g., form submitted)
  window.addEventListener('message', function (e) {
    if (e.data === 'lc-close') closeModal()
  })

  // Attach click handler to any element with data-lc-open attribute
  document.querySelectorAll('[data-lc-open]').forEach(function (el) {
    el.style.cursor = 'pointer'
    el.addEventListener('click', function (e) {
      e.preventDefault()
      openModal()
    })
  })

  // Also expose globally so it can be triggered programmatically
  window.openLeadForm = openModal
  window.closeLeadForm = closeModal
})()
