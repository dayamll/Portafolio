/* 
  Global value
*/

var navBarHeight = 250;
var navBarSpeed = 500;

var navBar_currect_item = 0;
var tmp_new_navBar_currect_item = navBar_currect_item;


//------------------------------------------------------------------------------------------------------------------------

/* 
  navBar List
  If click the navBar item, get item ID and return corresponding content title ID
*/

var ary_nav_item = {
  nav_item_link_about: "#content_title_about",
  nav_item_link_gallery: "#content_title_gallery",
  nav_item_link_press: "#content_title_press",
  nav_item_link_contact: "#content_title_contact"
}

/* 
  navBar li (nav item bulletpoint)
*/

var ary_nav_item_bulletPoint = [
  "#nav_item_bulletPoint_about",
  "#nav_item_bulletPoint_gallery",
  "#nav_item_bulletPoint_press",
  "#nav_item_bulletPoint_contact"
]

/* 
  navBar li a (nav item bulletpoint link)
*/

var ary_nav_item_link = [
  "#nav_item_link_about",
  "#nav_item_link_gallery",
  "#nav_item_link_press",
  "#nav_item_link_contact",
]

/*
  container : span (content title)
*/

var ary_content_title = [
  "#content_title_about",
  "#content_title_gallery",
  "#content_title_press",
  "#content_title_contact"
]


//------------------------------------------------------------------------------------------------------------------------

/* 
  Nav bar button
*/

//run if click navBar item link +
$(".nav-link").click(function (event) {

  //animate scrolling page
  $('html,body').animate(
    //animation function
    //setting page to target content title ID position
    {
      scrollTop: $(ary_nav_item[event.target.id]).offset().top - navBarHeight + 100
    },
    //animation speed
    navBarSpeed
  );

  //console.log(".nav-link : Click");

});

//------------------------------------------------------------------------------------------------------------------------

/* 
  if scroll to div, navBar animation add on item
*/

//run function if load page
$(window).scroll(function (event) {

  /* 
      Global Value
      var tmp_new_navBar_currect_item
 
 
      ///Check if scrolling up, window position less than currect content div title position
      IF
      currect position != first content div title
      THEN IF
      currect position + navBar height < currect content div title
      THEN
      updateing tmp_new_navBar_currect_item - 1
      
      
      ///Check if scrolling down, window position higner than currect content div title position
      IF
      currect position != final content div title
      THEN IF
      currect position + navBar height > next content div title
      THEN
      updateing tmp_new_navBar_currect_item + 1


      //If tmp value (currect content div title) is changed, run function
      IF
      tmp_new_navBar_currect_item != navBar_currect_item
      THEN
      removing currect active class on 'ul' & 'a'
      updating navBar_currect_item = tmp_new_navBar_currect_item
      adding active class on 'ul' & 'a' to narBar (navBar_currect_item)
      
    */


  //Check if scrolling up, window position less than currect content div title position
  if (navBar_currect_item != 0) {
    if ($(document).scrollTop() + (navBarHeight * 2) < $(ary_content_title[navBar_currect_item]).offset().top) {

      if ($(document).scrollTop() <= navBarHeight) return;

      tmp_new_navBar_currect_item = navBar_currect_item - 1;
      //console.log("--");
    }
  }

  //Check if scrolling down, window position higner than currect content div title position
  if (navBar_currect_item < ary_content_title.length - 1) {
    if ($(document).scrollTop() + (navBarHeight * 2) > $(ary_content_title[navBar_currect_item + 1]).offset().top) {

      if ($(document).scrollTop() <= navBarHeight) return;

      tmp_new_navBar_currect_item = navBar_currect_item + 1;
      //console.log("++");
    }
  }

  //If tmp value (currect content div title) is changed, run function
  if (tmp_new_navBar_currect_item != navBar_currect_item) {

    //console.log("tmp_new_navBar_currect_item is changed : " + tmp_new_navBar_currect_item);

    $(ary_nav_item_bulletPoint[navBar_currect_item]).removeClass("active_item");
    $(ary_nav_item_link[navBar_currect_item]).removeClass("active");

    navBar_currect_item = tmp_new_navBar_currect_item;
    //console.log("navBar_currect_item is changed : " + navBar_currect_item);

    $(ary_nav_item_bulletPoint[navBar_currect_item]).addClass("active_item");
    $(ary_nav_item_link[navBar_currect_item]).addClass("active");
  }



});