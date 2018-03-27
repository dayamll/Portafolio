(function ($) {
  $.fn.writeText = function (content) {
    var contentArray = content.split(""),
      current = 0,
      elem = this;
    setInterval(function () {
      if (current < contentArray.length) {
        elem.text(elem.text() + contentArray[current++]);
      }
    }, 150);
  };
})(jQuery);

$("#typing-text-first").writeText("(El exito es la habilidad de ir de fracaso en fracaso sin perder el entusiasmo)");

(function ($) {
  $.fn.writeText = function (content) {
    var contentArray = content.split(""),
      current = 0,
      elem = this;
    setInterval(function () {
      if (current < contentArray.length) {
        elem.text(elem.text() + contentArray[current++]);
      }
    }, 150);
  };
})(jQuery);

$("#first-text").writeText("Frontend Developer");

$(function () {
  $('#navbar').hide();
  $(window).scroll(function () {
    // set distance user needs to scroll before we start fadeIn
    if ($(this).scrollTop() >= 600) {
      $('#navbar').fadeIn(1000);
    } else {
      $('#navbar').fadeOut(1000);
    }
  });
  $('.proyecto-img').hover(
    function () {
      $(this).children().eq(0).fadeIn(1000);
    },
    function () {
      $(this).children().eq(0).fadeOut();
    }
  );
});