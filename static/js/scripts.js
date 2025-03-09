/**
 * Quantum Field Kit - Main JavaScript
 * Handles UI interactions, animation effects, and Socket.IO communication
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Socket.IO connection if enabled
  let socket;
  try {
    console.log("Attempting to initialize Socket.IO");
    socket = io();
    console.log("Socket.IO initialized successfully:", socket);
  } catch (e) {
    console.warn('Socket.IO not available:', e);
  }
  
  // Change navbar style on scroll
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }
  
  // Smooth scrolling for all anchor links with .smooth-scroll class
  document.querySelectorAll('.smooth-scroll').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70, // Account for fixed header
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Initialize VanillaTilt for cards with tilt-card class if library exists
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
      max: 5,
      speed: 400,
      glare: true,
      'max-glare': 0.1,
      scale: 1.03
    });
  }
  
  // Form validation for all forms with .needs-validation class
  const forms = document.querySelectorAll('.needs-validation');
  Array.prototype.slice.call(forms).forEach(function(form) {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
  
  // Socket.IO event handlers
  if (socket) {
    // Connect event
    socket.on('connect', function() {
      console.log('Connected to server');
    });
    
    // Disconnect event
    socket.on('disconnect', function() {
      console.log('Disconnected from server');
    });
    
    // Plugin start event
    socket.on('plugin_start', function(data) {
      console.log('Plugin started:', data.plugin_key);
      const statusBadge = document.getElementById('status-badge');
      if (statusBadge) {
        statusBadge.textContent = 'Running...';
        statusBadge.className = 'badge bg-warning';
      }
    });
    
    // Plugin result event
    socket.on('plugin_result', function(data) {
      console.log('Plugin result received:', data);
      const statusBadge = document.getElementById('status-badge');
      if (statusBadge) {
        statusBadge.textContent = 'Completed';
        statusBadge.className = 'badge bg-success';
      }
      
      // Display results without reloading
      if (typeof displayResults === 'function') {
        displayResults(data.result);
      } else {
        console.warn('displayResults function not found, reloading page');
        window.location.reload();
      }
    });
    
    // Plugin error event
    socket.on('plugin_error', function(data) {
      console.error('Plugin error:', data.error);
      const statusBadge = document.getElementById('status-badge');
      if (statusBadge) {
        statusBadge.textContent = 'Error';
        statusBadge.className = 'badge bg-danger';
      }
      
      // Show error message
      alert(`Error running simulation: ${data.error}`);
    });
  }
  
  // Clipboard functionality for code snippets
  document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', function() {
      const codeBlock = this.closest('.code-container').querySelector('code, pre');
      if (!codeBlock) return;
      
      const textToCopy = codeBlock.textContent;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Change button text temporarily
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Copied!';
        
        setTimeout(() => {
          this.innerHTML = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
    });
  });
  
  // Dynamic "Back to Top" button
  const createBackToTopButton = () => {
    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.className = 'back-to-top-btn';
    button.setAttribute('aria-label', 'Back to top');
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        button.style.display = 'block';
        setTimeout(() => {
          button.style.opacity = '1';
          button.style.transform = 'translateY(0)';
        }, 10);
      } else {
        button.style.opacity = '0';
        button.style.transform = 'translateY(20px)';
        setTimeout(() => {
          button.style.display = 'none';
        }, 300);
      }
    });
    
    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  };
  
  createBackToTopButton();
  
  // Track active navigation item based on current page
  const highlightCurrentNav = () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('#mainNav .nav-link');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || (currentPath.includes('plugin/') && href.includes('plugin/')))) {
        link.classList.add('active');
      }
    });
  };
  
  highlightCurrentNav();
  
  // Activate tooltips if Bootstrap is loaded
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
  
  // Handle parallax effect for hero section if it exists
  const hero = document.querySelector('.hero-container');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      if (scrollPos < 1000) { // Limit to avoid excessive calculations
        hero.style.backgroundPositionY = `${scrollPos * 0.3}px`;
      }
    });
  }
  
  // Fade in animations for elements with .fade-in class
  const fadeInElements = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && fadeInElements.length > 0) {
    const fadeInObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    
    fadeInElements.forEach(element => {
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      element.style.transform = 'translateY(20px)';
      fadeInObserver.observe(element);
    });
    
    document.addEventListener('animationend', function(e) {
      if (e.target.classList.contains('visible')) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    fadeInElements.forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }
  
  // Form input interactivity for range and number input synchronization
  const syncRangeInputs = () => {
    document.querySelectorAll('input[type="range"]').forEach(range => {
      const numberInputId = range.id.replace('_range', '');
      const numberInput = document.getElementById(numberInputId);
      
      if (numberInput) {
        // Ensure initial values are synchronized
        if (range.value !== numberInput.value) {
          numberInput.value = range.value;
        }
        
        // Listen for input events on range
        range.addEventListener('input', () => {
          numberInput.value = range.value;
        });
        
        // Listen for input events on number input
        numberInput.addEventListener('input', () => {
          range.value = numberInput.value;
        });
      }
    });
  };
  
  syncRangeInputs();
  
  // Handle form reset to properly update range inputs
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('reset', () => {
      // Give time for the form to reset before syncing range inputs
      setTimeout(syncRangeInputs, 10);
    });
  });
  
  // Error handling for external resources
  window.addEventListener('error', function(e) {
    // Only handle resource errors (script, CSS, etc.)
    if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
      console.warn('Resource failed to load:', e.target.src || e.target.href);
    }
  }, true); // Capture phase to catch resource errors
});