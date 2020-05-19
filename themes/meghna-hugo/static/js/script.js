jQuery(function ($) {
    "use strict";


    /*
    Close navigation menu on mobile when clicked
     */

    $(function(){
        var navMain = $(".navbar-collapse"); // avoid dependency on #id
        // "a:not([data-toggle])" - to avoid issues caused
        // when you have dropdown inside navbar
        navMain.on("click", "a:not([data-toggle])", null, function () {
            navMain.collapse('hide');
        });
    });

    /* ========================================================================= */
    /*	Page Preloader
    /* ========================================================================= */

    // Preloader js
    $(function () { // this replaces document.ready
        setTimeout(function () {
            $('#preloader').fadeOut('slow', function () {
                $(this).remove();
            });
        }, 1500);
    });


    /* ========================================================================= */
    /*	Post image slider
    /* ========================================================================= */

    $("#post-thumb, #gallery-post").slick({
        infinite: true,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000

    });

    $("#features").slick({
        infinite: true,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000
    });


    /* ========================================================================= */
    /*	Menu item highlighting
    /* ========================================================================= */


    $("#navigation").sticky({
        topSpacing: 0
    });


    /* ========================================================================= */
    /*	Magnific popup
    /* =========================================================================  */
    $('.image-popup').magnificPopup({
        type: 'image',
        removalDelay: 160, //delay removal by X to allow out-animation
        callbacks: {
            beforeOpen: function () {
                // just a hack that adds mfp-anim class to markup
                this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
                this.st.mainClass = this.st.el.attr('data-effect');
            }
        },
        closeOnContentClick: true,
        midClick: true,
        fixedContentPos: false,
        fixedBgPos: true
    });
    /* ========================================================================= */
    /*	Portfolio Filtering Hook
    /* =========================================================================  */

    if ($('.portfolio-items-wrapper').length)
        mixitup('.portfolio-items-wrapper');

    /* ========================================================================= */
    /*	Testimonial Carousel
    /* =========================================================================  */

    //Init the carousel
    $("#testimonials").slick({
        infinite: true,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000
    });

    /* ========================================================================= */
    /*   Licence Form Validating
    /* ========================================================================= */

    $('#licence-submit').click(function (e) {

        //stop the form from being submitted
        e.preventDefault();

        /* declare the variables, var error is the variable that we use on the end
        to determine if there was an error or not */
        var error = false;
        var name = $('#licence-name').val();
        var email = $('#licence-email').val();
        var company = $('#licence-company').val();

        /* in the next section we do the checking by using VARIABLE.length
        where VARIABLE is the variable we are checking (like name, email),
        length is a JavaScript function to get the number of characters.
        And as you can see if the num of characters is 0 we set the error
        variable to true and show the name_error div with the fadeIn effect.
        if it's not 0 then we fadeOut the div( that's if the div is shown and
        the error is fixed it fadesOut.

        The only difference from these checks is the email checking, we have
        email.indexOf('@') which checks if there is @ in the email input field.
        This JavaScript function will return -1 if no occurrence have been found.*/
        if (name.length == 0) {
            error = true;
            $('#licence-name').css("border-color", "#D8000C");
        } else {
            $('#licence-name').css("border-color", "#666");
        }
        if (email.length == 0 || email.indexOf('@') == '-1') {
            error = true;
            $('#licence-email').css("border-color", "#D8000C");
        } else {
            $('#licence-email').css("border-color", "#666");
        }
        if (company.length == 0) {
            error = true;
            $('#licence-company').css("border-color", "#D8000C");
        } else {
            $('#licence-company').css("border-color", "#666");
        }

        //now when the validation is done we check if the error variable is false (no errors)
        if (error == false) {
            //disable the submit button to avoid spamming
            //and change the button text to Sending...
            $('#licence-submit').attr({
                'disabled': 'false',
                'value': 'Sending...'
            });

            $.ajax({
                url: 'https://us-central1-myelin-development.cloudfunctions.net/LicenceServer',
                type: 'get',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                dataType: 'json',
                data: {
                    email: email,
                    company: company
                },
                // data: $('#licence-form').serialize(),
                success: function (data, textStatus, xhr) {
                    //and after the ajax request ends we check the text returned
                    if (xhr.status === 200) {
                        //if the mail is sent remove the submit paragraph
                        $('#lc-submit').remove();
                        //and show the mail success div with fadeIn
                        $('#licence-success').html("Your licence is: " + data["licence"]).fadeIn(500);
                    } else {
                        //show the mail failed div
                        $('#licence-fail').fadeIn(500);
                        //re enable the submit button by removing attribute disabled and change the text back to Send The Message
                        $('#licence-submit').removeAttr('disabled').attr('value', 'Submit');
                    }
                },
            });
        }
    });


    /* ========================================================================= */
    /*   Contact Form Validating
    /* ========================================================================= */


    $('#contact-submit').click(function (e) {

        //stop the form from being submitted
        e.preventDefault();

        /* declare the variables, var error is the variable that we use on the end
        to determine if there was an error or not */
        var error = false;
        var name = $('#name').val();
        var email = $('#email').val();
        var subject = $('#subject').val();
        var message = $('#message').val();

        /* in the next section we do the checking by using VARIABLE.length
        where VARIABLE is the variable we are checking (like name, email),
        length is a JavaScript function to get the number of characters.
        And as you can see if the num of characters is 0 we set the error
        variable to true and show the name_error div with the fadeIn effect.
        if it's not 0 then we fadeOut the div( that's if the div is shown and
        the error is fixed it fadesOut.

        The only difference from these checks is the email checking, we have
        email.indexOf('@') which checks if there is @ in the email input field.
        This JavaScript function will return -1 if no occurrence have been found.*/
        if (name.length == 0) {
            error = true;
            $('#name').css("border-color", "#D8000C");
        } else {
            $('#name').css("border-color", "#666");
        }
        if (email.length == 0 || email.indexOf('@') == '-1') {
            error = true;
            $('#email').css("border-color", "#D8000C");
        } else {
            $('#email').css("border-color", "#666");
        }
        if (subject.length == 0) {
            error = true;
            $('#subject').css("border-color", "#D8000C");
        } else {
            $('#subject').css("border-color", "#666");
        }
        if (message.length == 0) {
            error = true;
            $('#message').css("border-color", "#D8000C");
        } else {
            $('#message').css("border-color", "#666");
        }

        //now when the validation is done we check if the error variable is false (no errors)
        if (error == false) {
            //disable the submit button to avoid spamming
            //and change the button text to Sending...
            $('#contact-submit').attr({
                'disabled': 'false',
                'value': 'Sending...'
            });

            $.ajax({
                url: 'https://hooks.zapier.com/hooks/catch/4266119/052x32/',
                type: 'post',
                dataType: 'json',
                data: $('#contact-form').serialize(),
                success: function (result) {
                    //and after the ajax request ends we check the text returned
                    if (result["status"] === "success") {
                        //if the mail is sent remove the submit paragraph
                        $('#cf-submit').remove();
                        //and show the mail success div with fadeIn
                        $('#mail-success').fadeIn(500);
                    } else {
                        //show the mail failed div
                        $('#mail-fail').fadeIn(500);
                        //re enable the submit button by removing attribute disabled and change the text back to Send The Message
                        $('#contact-submit').removeAttr('disabled').attr('value', 'Submit');
                    }
                },
            });
        }
    });

});

// End Jquery Function


/* ========================================================================= */
/*	Animated section
/* ========================================================================= */

var wow = new WOW({
    offset: 100, // distance to the element when triggering the animation (default is 0)
    mobile: false // trigger animations on mobile devices (default is true)
});
wow.init();


/* ========================================================================= */
/*	Smooth Scroll
/* ========================================================================= */
var scroll = new SmoothScroll('a[href*="#"]');


/* ========================================================================= */

/*	Google Map Customization
/* =========================================================================  */

function initialize() {

    var latitude = $('#map-canvas').attr('data-latitude');
    var longitude = $('#map-canvas').attr('data-longitude');
    var myLatLng = new google.maps.LatLng(latitude, longitude);

    var roadAtlasStyles = [{
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#2F3238"
        }]
    }, {
        "elementType": "labels.text.fill",
        "stylers": [{
            "color": "#FFFFFF"
        }]
    }, {
        "elementType": "labels.text.stroke",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#50525f"
        }]
    }, {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{
            "visibility": "on"
        }, {
            "color": "#808080"
        }]
    }, {
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "transit",
        "elementType": "labels.icon",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{
            "color": "#808080"
        }]
    }, {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#3071a7"
        }, {
            "saturation": -65
        }]
    }, {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "landscape",
        "elementType": "geometry.stroke",
        "stylers": [{
            "color": "#bbbbbb"
        }]
    }];

    var mapOptions = {
        zoom: 14,
        center: myLatLng,
        disableDefaultUI: true,
        scrollwheel: false,
        navigationControl: false,
        mapTypeControl: false,
        scaleControl: false,
        draggable: false,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'roadatlas']
        }
    };

    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: '',
    });


    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });

    var styledMapOptions = {
        name: 'US Road Atlas'
    };

    var usRoadMapType = new google.maps.StyledMapType(
        roadAtlasStyles, styledMapOptions);

    map.mapTypes.set('roadatlas', usRoadMapType);
    map.setMapTypeId('roadatlas');
}

// Check init google maps only if "google" has been defined.
if ("google" in window)
    google.maps.event.addDomListener(window, "load", initialize);