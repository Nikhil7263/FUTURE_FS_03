// ─── Navbar scroll ───
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', scrollY > 60);
});

// ─── Particles ───
const pc = document.getElementById('particles');
for (let i = 0; i < 22; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `
    left:${Math.random()*100}%;
    width:${2+Math.random()*3}px; height:${2+Math.random()*3}px;
    animation-duration:${5+Math.random()*8}s;
    animation-delay:${Math.random()*8}s;
    background:${Math.random()>0.5?'#C8572A':'#C9A84C'};
    opacity:0;
  `;
  pc.appendChild(p);
}

// ─── Menu tabs ───
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-panel="${target}"]`).classList.add('active');
  });
});

// ─── Scroll reveal ───
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ─── Form — Save to localStorage ───
function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const inputs = form.querySelectorAll('input, select, textarea');

  const booking = {
    id: 'BK' + Date.now(),
    timestamp: new Date().toISOString(),
    firstName: inputs[0].value.trim(),
    lastName:  inputs[1].value.trim(),
    email:     inputs[2].value.trim(),
    phone:     inputs[3].value.trim(),
    date:      inputs[4].value,
    time:      inputs[5].value,
    guests:    inputs[6].value,
    occasion:  inputs[7].value,
    notes:     inputs[8].value.trim(),
    status:    'Pending'
  };

  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem('ember_oak_bookings') || '[]');
  existing.push(booking);
  localStorage.setItem('ember_oak_bookings', JSON.stringify(existing));

  // Show toast
  const toast = document.getElementById('toast');
  toast.innerHTML = `✓ Reservation #${booking.id} Confirmed`;
  toast.style.transform = 'translateY(0)'; toast.style.opacity = '1';
  setTimeout(() => { toast.style.transform = 'translateY(100px)'; toast.style.opacity = '0'; }, 4000);

  form.reset();
}

// ─── Smooth scroll ───
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});