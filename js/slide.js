$(document).ready(function () {
  var $trigger1 = $('[data-slick-index="1"]');
  var $target1 = $('#paquete-target01');
  var $trigger2 = $('[data-slick-index="2"]');
  var $target2 = $('#paquete-target02');
  var $trigger3 = $('[data-slick-index="3"]');
  var $target3 = $('#paquete-target03');
  var $trigger4 = $('[data-slick-index="4"]');
  var $target4 = $('#paquete-target04');
  var $content_popup = $('.content-popup');
  var $slick_slide = $('.slick-slide, .modal-paquetes');
  var $modal_container = $('.modal-paquetes');
  var $class_selected = 'selected';

  open_popup($slick_slide, $modal_container, 'activated');

  open_popup($trigger1, $target1, $class_selected);
  open_popup($trigger2, $target2, $class_selected);
  open_popup($trigger3, $target3, $class_selected);
  open_popup($trigger4, $target4, $class_selected);
  open_popup($target1, $target1, $class_selected);
  open_popup($target2, $target2, $class_selected);
  open_popup($target3, $target3, $class_selected);
  open_popup($target4, $target4, $class_selected);

});

function open_popup($trigger, $target, $class) {
  $trigger.hover(function () {
    if ($target.hasClass($class)) {
      $target.removeClass($class);
    } else {
      $target.addClass($class);
    }
  });
}