// add class to body for scroll spy to work
$('body').attr('data-spy', 'scroll').attr('data-target', '#primary-nav');
// Activate srollspy
$('main').scrollspy({ target: '#primary-nav' });

// Smooth Scrolling for internal links
$('a[href^="#"]').on('click', function (e) {
  e.preventDefault();

  var target = this.hash;
  var $target = $(target);

  $('html, body').stop().animate({
    'scrollTop': $target.offset().top
  }, 900, 'swing', function () {
    window.location.hash = target;
  });
});

// Animate buttons with .hidden class
var animateHTML = function animateHTML() {
  var elems, windowHeight;

  var init = function init() {
    elems = $('.hidden');
    windowHeight = window.innerHeight;
    _addEventHandlers();
  };

  var _addEventHandlers = function _addEventHandlers() {
    window.addEventListener('scroll', _checkPosition);
    window.addEventListener('resize', init);
  };
  var _checkPosition = function _checkPosition() {
    for (var i = 0; i < elems.length; i++) {
      var posFromTop = elems[i].getBoundingClientRect().top;
      if (posFromTop - windowHeight <= 0) {
        elems[i].className = elems[i].className.replace('hidden', 'fade-in');
      }
    }
  };

  return {
    init: init
  };
};

animateHTML().init();