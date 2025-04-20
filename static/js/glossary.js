document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for glossary navigation
    document.querySelectorAll('.glossary-nav a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          const headerOffset = 120; // Adjust for fixed header and nav
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Check if URL has a hash
    if (window.location.hash) {
        const targetId = window.location.hash;
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
        setTimeout(function() {
            const headerOffset = 120;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
            });
            
            // Highlight the term briefly
            targetElement.classList.add('highlight-term');
            setTimeout(function() {
            targetElement.classList.remove('highlight-term');
            }, 2000);
        }, 300); // Small delay to ensure page is loaded
        }
    }

    const searchInput = document.getElementById('glossary-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      const allTerms = document.querySelectorAll('dt[id^="term-"]');
      
      allTerms.forEach(term => {
        const termText = term.textContent.toLowerCase();
        const definition = term.nextElementSibling;
        const definitionText = definition.textContent.toLowerCase();
        
        if (termText.includes(searchTerm) || definitionText.includes(searchTerm)) {
          term.style.display = '';
          definition.style.display = '';
          // Show parent section
          const section = term.closest('section');
          if (section) {
            section.style.display = '';
          }
        } else {
          term.style.display = 'none';
          definition.style.display = 'none';
          
          // Hide section if all terms are hidden
          const section = term.closest('section');
          if (section) {
            const visibleTermsInSection = section.querySelectorAll('dt[style=""]').length;
            if (visibleTermsInSection === 0) {
              section.style.display = 'none';
            }
          }
        }
      });
      
      // Show "no results" message if needed
      const visibleTerms = document.querySelectorAll('dt[id^="term-"]:not([style="display: none;"])');
      const noResultsMsg = document.getElementById('no-results-message');
      
      if (visibleTerms.length === 0 && searchTerm !== '') {
        if (!noResultsMsg) {
          const msg = document.createElement('div');
          msg.id = 'no-results-message';
          msg.className = 'alert alert-info mt-4';
          msg.innerHTML = `No terms found matching "<strong>${searchTerm}</strong>". Try a different search term.`;
          document.querySelector('.col-lg-8').appendChild(msg);
        } else {
          noResultsMsg.innerHTML = `No terms found matching "<strong>${searchTerm}</strong>". Try a different search term.`;
          noResultsMsg.style.display = '';
        }
      } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
      }
    });
    
    // Copy citation functionality
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', function() {
        const citationText = this.previousElementSibling.textContent.trim();
        
        navigator.clipboard.writeText(citationText).then(() => {
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
  });