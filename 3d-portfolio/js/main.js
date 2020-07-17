/* 
	Artcore Template
	http://www.templatemo.com/preview/templatemo_423_artcore
*/

function createPost(data){    
    return `
        <div class="col-md-6 col-sm-12 project-item mix">
            <div class="project-thumb">
                <img src="images/posts/${data.img}.jpg" alt="">
                <div class="overlay-b">
                    <div class="overlay-inner">
                        <a href="images/posts/${data.img}.jpg" class="fancybox fa fa-expand" title="[${data.date}] ${data.title}"></a>
                    </div>
                </div>
            </div>
            <div class="box-content project-detail">
                <h2>${data.title}</h2>
                <p><span>[${data.date}]</span> ${data.desc}</p>
            </div>
        </div>
    `;
}

function setPosts(){       
    let posts = "";
    $.getJSON(`${location.href}/data/posts.json`, function(data) {      
        let count = 0;
        posts += `<div class="row">`
        data.posts.reverse();         
        data.posts.forEach(element => {            
            posts += createPost(element);    
            count++;
            if(count >= 2){
                posts += `</div>`
                posts += `<div class="row">`
                count = 0;
            }
        });        
        posts += `</div>`
        $('#posts').append(posts);
    }).then(function(){        
        
        
        $('.loader-item').fadeOut(); 
        $('#pageloader').delay(350).fadeOut('slow');
        $('body').delay(350).css({'overflow-y':'visible'});

        /************** Toggle *********************/
    	$('.toggle-id').on('click', function() {
            var id = $(this).attr('href');
            $(id).slideToggle(250);
            return false;
        });



    /************** Responsive navigation *********************/
        $('a.toggle-menu').click(function(){
            $('#responsive-menu').stop(true,true).slideToggle();
            return false;
        });




    /************** Superfish (DropDown Menu) *********************/
        function initSuperFish(){
            
            $(".sf-menu").superfish({
                 delay:  50,
                 autoArrows: true,
                 animation:   {opacity:'show'}
                 //cssArrows: true
            });
            
        }
        
        initSuperFish();

        $('.sub-menu').addClass('animated fadeInRight');



    /************** Search Overlay *********************/
        $('#search-icon').on('click', function() {
            $('#search-overlay').removeClass('animated bounceOutUp');
            $('#search-overlay').fadeIn(0).addClass('animated bounceInDown');
            $('.search-form-holder input[type="search"]').focus();
            return false;
        });

        $('.close-search').on('click', function() {
            $('#search-overlay').removeClass('animated bounceInDown');
            $('#search-overlay').addClass('animated bounceOutUp');
            return false;
        });

        jQuery(document).keyup(function(e) {
    	    if (e.keyCode === 27) {
    	        $('#search-overlay').removeClass('animated bounceInDown');
    	        $('#search-overlay').addClass('animated bounceOutUp');
    	        return false;
    	    } // esc
    	});

    


	/************** Full Screen Slider *********************/
    	$(window).resize(function(){
    	    var height = $(window).height();
    	    var width  = $(window).width();
    	    $('.swiper-container, .swiper-slide').height(height);
    	    $('.swiper-container, .swiper-slide').width(width);

    	})
    	$(window).resize(); 


    	$('.arrow-left, .arrow-right').on('click', function() {
            $('.slider-caption h2').removeClass('animated fadeInDown');
            $('.slider-caption h2').fadeIn(0).addClass('animated fadeInDown');
            $('.slider-caption p').removeClass('animated fadeInUp');
            $('.slider-caption p').fadeIn(0).addClass('animated fadeInUp');
        });

    	var mySwiper = new Swiper('.swiper-container',{
    	    mode:'horizontal',
    	    loop: true,
    	    keyboardControl: true
    	  })
    	  $('.arrow-left').on('click', function(e){
    	    e.preventDefault()
    	    mySwiper.swipePrev()
    	  })
    	  $('.arrow-right').on('click', function(e){
    	    e.preventDefault()
    	    mySwiper.swipeNext()

    	})



	/************** SlideJS *********************/
    	$('.project-slider').slidesjs({
    		pagination: false,
    		navigation: {
    	      active: false,
    	      effect: "fade"
    	    }
        });



    /************** Animated Hover Effects *********************/
        $('.staff-member').hover(function(){
    	    $('.overlay .social-network').addClass('animated fadeIn');
    	}, function(){
    	    $('.overlay .social-network').removeClass('animated fadeIn');
    	});

    	$('.blog-thumb, .project-item').hover(function(){
    	    $('.overlay-b a').addClass('animated fadeIn');
    	}, function(){
    	    $('.overlay-b a').removeClass('animated fadeIn');
    	});



	/************** Mixitup (Filter Projects) *********************/
    	$('.projects-holder').mixitup({
            effects: ['fade','grayscale'],
            easing: 'snap',
            transitionSpeed: 400
        });




    /************** FancyBox Lightbox *********************/
        $(".fancybox").fancybox();




    /************** Contact Form *********************/
        $('#contactform').submit(function(){

            var action = $(this).attr('action');

            $("#message").slideUp(750,function() {
            $('#message').hide();

            $('#submit')
                
                .attr('disabled','disabled');

            $.post(action, {
                name: $('#name').val(),
                email: $('#email').val(),
                phone: $('#phone').val(),
                comments: $('#comments').val()
            },
                function(data){
                    document.getElementById('message').innerHTML = data;
                    $('#message').slideDown('slow');
                    $('#submit').removeAttr('disabled');
                    if(data.match('success') != null) $('#contactform').slideUp('slow');

                }
            );

            });

            return false;

        });
    });
}

$(document).ready(function() {

    setPosts();

});












