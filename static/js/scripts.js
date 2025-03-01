document.addEventListener('DOMContentLoaded', function() {
    // Initialize Particles.js
    particlesJS.load('particles-js', 'static/js/particles-config.json', function() {
      console.log('Particles.js config loaded');
    });
  
    // Initialize VanillaTilt for plugin cards
    const tiltCards = document.querySelectorAll('.tilt-card');
    VanillaTilt.init(tiltCards, {
      max: 15,
      speed: 400,
      glare: true,
      'max-glare': 0.2
    });
  
    // Smooth scrolling for anchor links with .smooth-scroll
    const smoothLinks = document.querySelectorAll('.smooth-scroll');
    for (const link of smoothLinks) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetID = link.getAttribute('href');
        const target = document.querySelector(targetID);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  
    // Change navbar style on scroll
    const nav = document.getElementById('mainNav');
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  });
  