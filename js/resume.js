(function($) {
  "use strict"; // Start of use strict

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#sideNav'
  });

})(jQuery); // End of use strict

document.addEventListener('DOMContentLoaded', function() {
  var viewsElement = document.querySelector('.post-views');
  if (viewsElement) {
      viewsElement.remove();
  }
});
// Fill the language bars when the Languages section scrolls into view
// (previously a 10-second animation ran on page load, so visitors usually
// saw half-empty bars).
(function() {
  var section = document.getElementById('languages');
  if (!section || !('IntersectionObserver' in window)) return;
  section.classList.add('bars-pending');
  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      requestAnimationFrame(function() {
        section.classList.remove('bars-pending');
      });
      observer.disconnect();
    }
  }, { threshold: 0.2 });
  observer.observe(section);
})();
