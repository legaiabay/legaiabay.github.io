let chara_img = `
    <div class="col-lg-2 col-md-3 col-4 text-center">            
        <button class="chara-img-btn" data-selected="false">
            <img class="chara-img" src="${location.pathname}../img/ak/chara/Jessica.png" width="128" height="128" loading="lazy">
        </button>
    </div>
`;

let chara_img_all = '';
for(let i=0;i<20;i++){
    chara_img_all += chara_img;
}

$(document).ready(function(){
    $('.chara-selection').html(chara_img_all);

    $('.chara-img-btn').click(function(){
        let selected = $(this).data('selected');        
        if(selected === false){
            $(this).css('background','white');
            $(this).data('selected',true);            
        } else {
            $(this).css('background','rgba(0,0,0,0)');
            $(this).data('selected',false);            
        }        
    });

    $('#download').click(function(){         
         var a = document.createElement('a');            
         a.href = $('canvas')[0].toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
         a.download = 'ak-collection-generator.jpg';
         a.click();
    })

    $('#generate').click(function(){
        console.log("generate image...");     
        
        $("#generate").css("display","none");        

        $(".chara-img-btn").each(function(){
            let selected = $(this).data("selected");
            if(selected === false){                
                $(this).parent().css("display","none");
            } else {
                $(this).css('background','rgba(0,0,0,0)');
            }
        });

        html2canvas(document.querySelector(".capture-area"), {
            backgroundColor	: '#1b262c'
        }).then(canvas => {                                
            //$("#result").html(canvas);     
            let url = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
            $("#result-img").attr("src",url);
            $("#result-a").attr("href",url);

            $("#generate").css("display","initial");
            $(".capture-result").css("display","initial");

            $(".chara-img-btn").each(function(){
                let selected = $(this).data("selected");
                if(selected === false){
                    $(this).parent().css("display","initial");
                } else {
                    $(this).css('background','white');
                }
            });           

            $('html, body').animate({
                scrollTop: $("div#result").offset().top
            }, 1000);
        });
    })
});