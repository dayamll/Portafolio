
$(function() {
  $('#navbar').hide();
  $(window).scroll(function() {
    // set distance user needs to scroll before we start fadeIn
    if ($(this).scrollTop() >= 600) {
      $('#navbar').fadeIn(1000);
    } else {
      $('#navbar').fadeOut(1000);
    }
  });
  $('.proyecto-img').hover(
  function() {
    $(this).children().eq(0).fadeIn(1000);
  },
  function() {
    $(this).children().eq(0).fadeOut();
  }
);
});


