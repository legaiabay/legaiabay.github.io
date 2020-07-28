/* 
	Artcore Template
	http://www.templatemo.com/preview/templatemo_423_artcore
*/

var firebaseConfig = {
    apiKey: "AIzaSyA2ksCDuXSyB-ow4PV96Cep_M8F3GIJ7dA",
    authDomain: "threed-dump.firebaseapp.com",
    projectId: "threed-dump",
};

firebase.initializeApp(firebaseConfig); 
var db = firebase.firestore();

let waypoints = 0;
let lastPost = null;

function createPost(data){    

    if(data.type == "video"){
        return `
            <div class="col-md-6 col-sm-12 project-item mix">
                <div class="project-thumb">
                    <iframe src="https://www.youtube.com/embed/${data.href}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>                    
                </div>
                <div class="box-content project-detail">
                    <h2>${data.title}</h2>
                    <p><span>[${data.date}]</span> ${data.desc}</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="col-md-6 col-sm-12 project-item mix">
            <div class="project-thumb">
                <img src="images/posts/${data.href}.jpg" alt="">
                <div class="overlay-b">
                    <div class="overlay-inner">
                        <a href="images/posts/${data.href}.jpg" class="fancybox fa fa-expand" title="[${data.date}] ${data.title}"></a>
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

function loadMore(){
    setPosts();
    $(`.waypoints`).hide();
}

function setPosts(){              
    if(lastPost != null && lastPost <= 1) return true;
    
    let posts = "";
    var ref = db.collection("posts").orderBy("id", "desc").limit(6);

    if(lastPost != null){       
        ref = db.collection("posts").orderBy("id", "desc").limit(6).where("id", "<", parseInt(lastPost));        
    }

    ref.get().then((snapshot) => {

        let count = 0;
        posts += `<div class="row">`

        snapshot.forEach((element) => {      
            posts += createPost(element.data());    
            count++;
            if(count >= 2){
                posts += `</div>`
                posts += `<div class="row">`
                count = 0;
            }

            lastPost = element.id;
        });

        posts += `</div>`
        $('#posts').append(posts);

        if(lastPost > 1){
            $('#posts').append(`            
                <div id="waypoint">    
                    <div class="waypoints loader-waypoint fa fa-spin colored-border"></div>            
                </div>
            `);
        } else {
            $('#posts').append(` 
            <div class="end col-md-12 col-sm-12">
                <h2 style="padding-left: 50px; text-align: center;">That's all folks!</h2>
            </div>
            `);
        }     

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
        
        $(`.waypoint`).waypoint(function() {
            if(lastPost > 0){
                waypoints++;                       
                setTimeout(loadMore, 500);                                
                this.destroy()                
            }
        }, {
            offset: '110%',
            triggerOnce: true 
        });
    
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












