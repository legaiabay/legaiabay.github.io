let version = "v.1.0.0";
let selected_count = 0;
let chara_rarity_count = [0,0,0,0,0,0];

function CreateCharaDiv(name, image, chara_class, rarity){
    let class_img = "";
    switch(chara_class){
        case "Caster": class_img = "caster.png";break;
        case "Defender": class_img = "defender.png";break;
        case "Guard": class_img = "guard.png";break;
        case "Medic": class_img = "medic.png";break;
        case "Sniper": class_img = "sniper.png";break;
        case "Specialist": class_img = "specialist.png";break;
        case "Supporter": class_img = "supporter.png";break;
        case "Vanguard": class_img = "vanguard.png";break;
    }

    return `
        <div class="col-lg-2 col-md-3 col-4 text-center">            
            <button class="chara-img-btn" data-selected="false" data-rarity=${rarity}>
                <div class="chara-img-box">
                    <img class="chara-img disable-drag" src="${location.pathname}../img/ak/avatars/${image}.png" loading="lazy" width="128" height="128" alt="${name}">
                    <img class="chara-img-class disable-drag" src="${location.pathname}../img/ak/classes/${class_img}">                
                </div>
            </button>
        </div>
    `;
}

function SetCharaDiv(){        
    $.getJSON(`${location.pathname}chara-db.json`, function(data) {                 
        data.chara.forEach(element => {                                      
            $('.chara-selection-'+element.rarity).append(CreateCharaDiv(element.name, element.image, element.class, element.rarity));
        });           
    }).then(function(){                        
        $('.chara-img-btn').click(function(){
            let selected = $(this).data('selected');
            let rarity = $(this).data('rarity');                    
            if(selected === false){                
                $(this).css('background','white');
                $(this).data('selected',true);
                selected_count++;
                chara_rarity_count[rarity-1]++;
                $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);   
                $("#selected").html(selected_count);         
            } else {
                $(this).css('background','rgba(0,0,0,0)');
                $(this).data('selected',false);     
                selected_count--;       
                chara_rarity_count[rarity-1]--;
                $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);          
                $("#selected").html(selected_count);
            }        
        });        
    });
}

$(document).ready(function(){
    $(".version").append(version);
    $("#selected").html(selected_count);

    SetCharaDiv();

    $('img').on('dragstart', function(event) { event.preventDefault(); });

    $('#ign-input').keyup(function(){
        $('#ign').text("IGN : " + $(this).val());
    })

    $('#reset').click(function(){         
        selected_count = 0;
        $("#selected").html(selected_count);

        chara_rarity_count = [0,0,0,0,0,0];
        for(let i=1;i<=chara_rarity_count.length;i++){
            $("#rarity-"+i).html(0)
        }
        
        $("#rarity-"+$(this).data('rarity')).html(0)
        $(".chara-img-btn").each(function(){            
            $(this).css('background','rgba(0,0,0,0)');
            $(this).data("selected",false);                                    
        });
    });

    $('#download').click(function(){         
         var a = document.createElement('a');            
         a.href = $('canvas')[0].toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
         a.download = 'ak-collection-generator.jpg';
         a.click();
    })

    $('#generate').click(function(){                
        $("#generate").css("display","none");        

        $(".chara-img-btn").each(function(){
            let selected = $(this).data("selected");
            if(selected === false){                
                $(this).parent().css("display","none");
            } else {
                $(this).css('background','rgba(0,0,0,0)');
            }
        });

        let rarity_to_hide = [];
        chara_rarity_count.forEach((element, index) => {
            if(element <= 0) $(".chara-selection-"+(index+1)).css("display","none");
            rarity_to_hide.push(index);
        })

        $('html, body').animate({
            scrollTop: $("body").offset().top
        }, 0);

        html2canvas(document.querySelector("#capture-area"), {
            backgroundColor	: '#1b262c',
            width: window.innerWidth                      
        }).then(canvas => {                                            
            let url = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
            $("#result-img").attr("src",url);
            $("#result-a").attr("href",url);                        
            if($("#ign-input").val() !== ""){
                $("#result-a").attr("download",`ak-collection-tracker-${$("#ign-input").val()}.jpg`);
            } else {
                $("#result-a").attr("download",`ak-collection-tracker.jpg`);
            }                

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

            rarity_to_hide.forEach((element) => {
                $(".chara-selection-"+element).css("display","flex");
            })

            $('html, body').animate({
                scrollTop: $("div.capture-result").offset().top
            }, 1000);
        });
    })
});