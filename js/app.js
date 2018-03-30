(function ($) {
  $.fn.writeText = function (content) {
    var contentArray = content.split(''),
      current = 0,
      elem = this;
    setInterval(function () {
      if (current < contentArray.length) {
        elem.text(elem.text() + contentArray[current++]);
      }
    }, 150);
  };
})(jQuery);

$('#typing-text-first').writeText('(El exito es la habilidad de ir de fracaso en fracaso sin perder el entusiasmo)');

(function ($) {
  $.fn.writeText = function (content) {
    var contentArray = content.split(''),
      current = 0,
      elem = this;
    setInterval(function () {
      if (current < contentArray.length) {
        elem.text(elem.text() + contentArray[current++]);
      }
    }, 150);
  };
})(jQuery);

$('#first-text').writeText('Front-end Developer');

