let version = "v.1.1.0";
let selected_server = "cn";
let current_total_operator = 0;
let current_total_operator_en = 0;
let selected_count = 0;
let total_chara_rarity = [0,0,0,0,0,0];
let total_chara_rarity_en = [0,0,0,0,0,0];
let chara_rarity_count = [0,0,0,0,0,0];

function CreateCharaDiv(data){
    let class_img = "";
    switch(data.class){
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
            <button class="chara-img-btn" data-selected="false" data-id=${data.id} data-rarity=${data.rarity} data-server=${data.server}>
                <div class="chara-img-box">
                    <img class="chara-img disable-drag" src="${location.pathname}../img/ak/avatars/${data.image}.png" loading="lazy" width="128" height="128" alt="${data.name}">
                    <img class="chara-img-class disable-drag" src="${location.pathname}../img/ak/classes/${class_img}">                
                </div>
            </button>
        </div>
    `;
}

function SetChangelog(){
    $.getJSON(`${location.pathname}changelog.json`, function(data) {    
        data.changelog.reverse();             
        data.changelog.forEach(element => {                   
            $(".changelog-body").append(`<b>Version ${element.version}</b>`);
            element.list.forEach(change => {
                $(".changelog-body").append("<br>- "+change);
            })
            $(".changelog-body").append("<br><br>");
        });           
    })
}

function SetCharaDiv(){        
    $.getJSON(`${location.pathname}chara-db.json`, function(data) {                 
        data.chara.forEach(element => {                   
            current_total_operator++;                      
            total_chara_rarity[element.rarity-1]++;   
            if(element.server == 2){
                current_total_operator_en++;
                total_chara_rarity_en[element.rarity-1]++;        
            }
            $('.chara-selection-'+element.rarity).append(CreateCharaDiv(element));
        });           
    }).then(function(){  
        $(".selected-server, .selected-server-2").append("CN");                              
        $(".total-operator").append(current_total_operator);
        total_chara_rarity.forEach((element, index) => {
            $("#rarity-"+(index+1)+"-total").html("/"+element);
        });

        $('.chara-img-btn').click(function(){
            let selected = $(this).data('selected');
            let rarity = $(this).data('rarity');                    
            if(selected === false){                
                $(this).css('background','white');
                $(this).data('selected',true);
                selected_count++;
                chara_rarity_count[rarity-1]++;
                $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);   
                $(".selected").html(selected_count);         
            } else {
                $(this).css('background','rgba(0,0,0,0)');
                $(this).data('selected',false);     
                selected_count--;       
                chara_rarity_count[rarity-1]--;
                $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);          
                $(".selected").html(selected_count);
            }        
        });        
    });
}

function Reset(){
    selected_count = 0;
    $(".selected").html(selected_count);

    chara_rarity_count = [0,0,0,0,0,0];
    for(let i=1;i<=chara_rarity_count.length;i++){
        $("#rarity-"+i).html(0)
    }
    
    $("#rarity-"+$(this).data('rarity')).html(0)
    $(".chara-img-btn").each(function(){            
        $(this).css('background','rgba(0,0,0,0)');
        $(this).data("selected",false);                                    
    });
}

$(document).ready(function(){
    $(".version").append(version);
    $(".selected").html(selected_count);

    SetChangelog();
    SetCharaDiv();

    $('img').on('dragstart', function(event) { event.preventDefault(); });

    $('#ign-input').keyup(function(){
        $('#ign').text("IGN : " + $(this).val());
    })

    $('#server').click(function(){      
        //false : CN 
        //true  : EN/JP/KR                 
        if($(this).prop("checked")){
            selected_server = "en";
            $(".chara-img-btn[data-server=1]").parent().css("display","none");
            $(".chara-img-btn[data-server=1]").data("selected",false).css('background','rgba(0,0,0,0)');
            $(".server-non-cn").css("display","flex");       
            $("#server-en").prop("checked",true);                  
            $(".selected-server").html("EN/JP/KR"); 
            $(".selected-server-2").html("EN"); 
            $(".total-operator").html(current_total_operator_en);
            total_chara_rarity_en.forEach((element, index) => {
                $("#rarity-"+(index+1)+"-total").html("/"+element);
            });
        } else {
            selected_server = "cn";
            $(".chara-img-btn[data-server=1]").parent().css("display","flex");             
            $(".server-non-cn").css("display","none");  
            $(".selected-server, .selected-server-2").html("CN");                   
            $(".total-operator").html(current_total_operator);
            total_chara_rarity.forEach((element, index) => {
                $("#rarity-"+(index+1)+"-total").html("/"+element);
            });    
        }

        Reset();
    })

    $('.server-radio').click(function(){
        let server = $(this).prop("id");        
        if(server == "server-en"){
            $(".selected-server-2").html("EN");  
        } else if(server == "server-jp"){
            $(".selected-server-2").html("JP");  
        } else if(server == "server-kr"){
            $(".selected-server-2").html("KR");  
        }
    })

    $('#reset').click(function(){Reset();});

    $('#select-all').click(function(){
        $('.chara-img-btn').data("selected",true).css("background","white");        
        if(selected_server == "en"){                      
            $(".selected").html(current_total_operator_en);   
            for(let i=1;i<=chara_rarity_count.length;i++){
                chara_rarity_count[i-1] = total_chara_rarity_en[i-1];
                $("#rarity-"+i).html(chara_rarity_count[i-1]);   
            }                        
        } else if(selected_server == "cn"){                        
            $(".selected").html(current_total_operator);   
            for(let i=1;i<=chara_rarity_count.length;i++){
                chara_rarity_count[i-1] = total_chara_rarity[i-1];
                $("#rarity-"+i).html(chara_rarity_count[i-1]);   
            }  
        }
    })

    $('#to-top').click(function(){
        $('html, body').animate({
            scrollTop: $("body").offset().top
        }, 1000);
    })

    $('#download').click(function(){         
         var a = document.createElement('a');            
         a.href = $('canvas')[0].toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
         a.download = 'ak-collection-generator.jpg';
         a.click();
    })

    $('#generate').click(function(){                
        $("#generate").css("display","none");  
        
        if($("#ign-input").val() === ""){            
            $("#ign").css("display","none");
        }    

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
            let current_date = new Date().format('Ymd-his');             
            let url = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
            $("#result-img").attr("src",url);
            $("#result-a").attr("href",url);                        
            if($("#ign-input").val() !== ""){
                $("#result-a").attr("download",`ak-collection-tracker-${$("#ign-input").val()}-${current_date}.jpg`);
            } else {
                $("#result-a").attr("download",`ak-collection-tracker-${current_date}.jpg`);
            }                

            $("#generate").css("display","initial");
            $(".capture-result").css("display","initial");
            $("#ign").css("display","flex");

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

            if($("#server").prop("checked")){
                $(".chara-img-btn[data-server=1]").parent().css("display","none")
            } else {
                $(".chara-img-btn[data-server=1]").parent().css("display","flex")
            }

            $('html, body').animate({
                scrollTop: $("div.capture-result").offset().top
            }, 1000);
        });
    })
});