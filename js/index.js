
/* Demo purposes only */
$(".hover").mouseleave(
  function () {
    $(this).removeClass("hover");
  }
);

$followingNavItems = $('#following-nav').children('.item');
$stripeSegments = $('.stripe.segment');

$stripeSegments
  .visibility({
    once: false,
    observeChanges: false,
    offset: 50,
    onTopPassed: function () {
      $segment = $(this);
      var index = $stripeSegments.index($segment);
      console.log(this.id + ' ' + index);
      $followingNavItems.filter('.active').removeClass('active');
      $followingNavItems.eq(index + 1).addClass('active');
    },
    onTopPassedReverse: function () {
      $segment = $(this);
      var index = $stripeSegments.index($segment);
      console.log('reverse ' + this.id + ' ' + index);
      $followingNavItems.filter('.active').removeClass('active');
      if (index > 0) {
        $followingNavItems.eq(index).addClass('active');
      }
    }
  });

$scrollToLinks = $('#following-nav').find('.scroll-to');
$scrollToLinks.on('click', function (event) {
  var
    id = $(this).attr('href').replace('#', ''),
    $element = $('#' + id),
    position = $element.offset().top + 10;
  $('html, body')
    .animate({
      scrollTop: position
    }, 500);
  event.preventDefault();
});
