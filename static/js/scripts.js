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

  function insertThemeToggle() {
    const navbarNav = document.querySelector('#navbarContent .navbar-nav');
    if (navbarNav) {
      const toggleItem = document.createElement('li');
      toggleItem.className = 'nav-item';
      toggleItem.innerHTML = `
        <button class="theme-toggle-btn nav-link" id="themeToggle" aria-label="Toggle Dark Mode">
          <i class="fas fa-moon"></i>
        </button>
      `;
      
      // Insert before GitHub link
      const githubLink = navbarNav.querySelector('a[href*="github"]');
      if (githubLink && githubLink.parentElement) {
        navbarNav.insertBefore(toggleItem, githubLink.parentElement);
      } else {
        navbarNav.appendChild(toggleItem);
      }
      
      // Add click handler for the toggle button
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
      }
    }
  }
  
  // Initialize theme based on user preference or system settings
  function initializeTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme === 'true') {
      enableDarkMode();
    } else if (savedTheme === 'false') {
      disableDarkMode();
    } else {
      // If no saved preference, check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
    }
  }
  
  // Toggle between dark and light modes
  function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  }
  
  // Enable dark mode
  function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
    
    // Update toggle button icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggle.setAttribute('aria-label', 'Switch to Light Mode');
    }
    
    // Fix SVG elements in dark mode
    fixSVGInDarkMode();
    
    // Fix chart colors for dark mode
    updateChartColors(true);
    
    // Special handling for Bloch sphere and other 3D visualizations
    handleCustomVisualizations(true);
  }
  
  // Disable dark mode
  function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
    
    // Update toggle button icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
    }
    
    // Fix SVG elements in light mode
    fixSVGInLightMode();
    
    // Reset chart colors for light mode
    updateChartColors(false);
    
    // Special handling for Bloch sphere and other 3D visualizations
    handleCustomVisualizations(false);
  }
  
  // Fix SVG elements in dark mode
  function fixSVGInDarkMode() {
    // For SVG elements that need specific color adjustments
    document.querySelectorAll('.circuit-svg svg').forEach(svg => {
      // Exclude from canvas filters
      svg.classList.add('circuit-svg-excluded');
      
      // Adjust text and line colors
      svg.querySelectorAll('text').forEach(text => {
        if (!text.getAttribute('data-original-fill')) {
          text.setAttribute('data-original-fill', text.getAttribute('fill') || 'black');
        }
        text.setAttribute('fill', '#e0e0e0');
      });
      
      svg.querySelectorAll('line, path').forEach(elem => {
        if (!elem.getAttribute('data-original-stroke')) {
          elem.setAttribute('data-original-stroke', elem.getAttribute('stroke') || 'black');
        }
        
        // Don't change colored elements like gates
        const stroke = elem.getAttribute('stroke');
        if (stroke && (stroke === 'black' || stroke === '#000' || stroke === '#000000')) {
          elem.setAttribute('stroke', '#e0e0e0');
        }
      });
      
      // Adjust background elements
      svg.querySelectorAll('rect[fill="white"], rect[fill="#fff"], rect[fill="#ffffff"]').forEach(rect => {
        if (!rect.getAttribute('data-original-bg')) {
          rect.setAttribute('data-original-bg', rect.getAttribute('fill'));
        }
        rect.setAttribute('fill', '#1e1e1e');
      });
    });
  }
  
  // Fix SVG elements in light mode
  function fixSVGInLightMode() {
    // Restore original colors for SVG elements
    document.querySelectorAll('.circuit-svg svg').forEach(svg => {
      svg.classList.remove('circuit-svg-excluded');
      
      // Restore text colors
      svg.querySelectorAll('text[data-original-fill]').forEach(text => {
        text.setAttribute('fill', text.getAttribute('data-original-fill'));
      });
      
      // Restore line and path colors
      svg.querySelectorAll('line[data-original-stroke], path[data-original-stroke]').forEach(elem => {
        elem.setAttribute('stroke', elem.getAttribute('data-original-stroke'));
      });
      
      // Restore background elements
      svg.querySelectorAll('rect[data-original-bg]').forEach(rect => {
        rect.setAttribute('fill', rect.getAttribute('data-original-bg'));
      });
    });
  }
  
  // Update Chart.js colors for dark mode
  function updateChartColors(isDarkMode) {
    if (typeof Chart !== 'undefined') {
      // Update global defaults
      Chart.defaults.color = isDarkMode ? '#e0e0e0' : '#666';
      Chart.defaults.scale.grid.color = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      
      // Update existing charts
      if (Chart.instances) {
        Object.values(Chart.instances).forEach(chart => {
          // Update options
          if (chart.options.scales && chart.options.scales.x) {
            chart.options.scales.x.grid.color = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            chart.options.scales.x.ticks.color = isDarkMode ? '#e0e0e0' : '#666';
          }
          
          if (chart.options.scales && chart.options.scales.y) {
            chart.options.scales.y.grid.color = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            chart.options.scales.y.ticks.color = isDarkMode ? '#e0e0e0' : '#666';
          }
          
          // Update the chart
          chart.update();
        });
      }
    }
  }
  
  // Handle custom visualizations like Bloch sphere
  function handleCustomVisualizations(isDarkMode) {
    // For Three.js-based visualizations
    const blochContainers = document.querySelectorAll('#quantum-state-viz, #bloch-sphere-container');
    
    blochContainers.forEach(container => {
      if (isDarkMode) {
        container.style.backgroundColor = '#0f0f1a';
      } else {
        container.style.backgroundColor = '#141424';  // Default color
      }
      
      // If there's a way to access the Three.js scene, update its background
      if (window.blochSphere && window.blochSphere.updateColors) {
        window.blochSphere.updateColors(isDarkMode);
      }
    });
  }
  
  // Mark SVG elements to exclude from global filters
  function markSVGElements() {
    document.querySelectorAll('.circuit-svg svg').forEach(svg => {
      svg.classList.add('circuit-svg-excluded');
    });
  }
  
  // Observe DOM changes to apply dark mode to new elements
  function observeDarkModeChanges() {
    const observer = new MutationObserver(mutations => {
      let needsUpdate = false;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        markSVGElements();
        
        if (document.body.classList.contains('dark-mode')) {
          fixSVGInDarkMode();
        } else {
          fixSVGInLightMode();
        }
      }
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Initialize dark mode functionality
  insertThemeToggle();
  initializeTheme();
  markSVGElements();
  observeDarkModeChanges();
  
  // Expose functions for possible external use
  window.quantumTheme = {
    enable: enableDarkMode,
    disable: disableDarkMode,
    toggle: toggleDarkMode
  };
  
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