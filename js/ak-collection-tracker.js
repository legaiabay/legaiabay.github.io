const VERSION = "v.1.3.4";

let selected_server = "cn";
let current_total_operator = 0;
let current_total_operator_en = 0;
let selected_count = 0;
let selected_chara = [];
let selected_chara_all = [];
let selected_chara_all_en = [];
let total_chara_rarity = [0,0,0,0,0,0];
let total_chara_rarity_en = [0,0,0,0,0,0];
let chara_rarity_count = [0,0,0,0,0,0];

function LoadCookies(){
    let saved_selected = Cookies.get("selected");
    let saved_server = Cookies.get("server");
    let saved_server_en = Cookies.get("server_en");
    let saved_ign = Cookies.get("ign");        
    
    if(saved_selected == undefined || saved_selected[0] == "" || saved_selected.length === 0) saved_selected = [];
    else saved_selected = saved_selected.split(",");    

    for(let i=0;i<saved_selected.length;i++){
        saved_selected[i] = parseInt(saved_selected[i]);
        let _selected = $(`.chara-img-btn[data-id=${saved_selected[i]}]`);
        let rarity = _selected.data('rarity');    

        _selected.css('background','white');
        _selected.data('selected',true);        
        selected_count++;
        chara_rarity_count[rarity-1]++;
        $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);   
        $(".selected").html(selected_count);      
    }

    selected_chara = saved_selected;
    
    if(saved_server != "" && saved_server != undefined) {
        SetServer(saved_server); 
        if(saved_server == "en") $("#server").prop("checked",true);
    }   

    if(saved_server_en != "" && saved_server_en != undefined) {        
        $(".selected-server-2").html(saved_server_en); 
        if(saved_server_en == "EN"){
            $("#server-en").prop("checked",true);
        } else if(saved_server_en == "JP"){
            $("#server-jp").prop("checked",true);
        } else if(saved_server_en == "KR"){
            $("#server-kr").prop("checked",true);
        }
    }

    if(saved_ign != "" && saved_ign != undefined){        
        $('#ign-input').val(saved_ign);
        $('#ign').text("IGN : " + saved_ign);
    }    
}

function SetServer(s){
    if(s == "en"){
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
    } else if (s == "cn"){
        selected_server = "cn";
        $(".chara-img-btn[data-server=1]").parent().css("display","flex");             
        $(".server-non-cn").css("display","none");  
        $(".selected-server, .selected-server-2").html("CN");                   
        $(".total-operator").html(current_total_operator);
        total_chara_rarity.forEach((element, index) => {
            $("#rarity-"+(index+1)+"-total").html("/"+element);
        });    

        Cookies.set("server_en","");
    }

    Cookies.set("server",s);
}

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
            selected_chara_all.push(parseInt(element.id));
            if(element.server == 2){
                selected_chara_all_en.push(parseInt(element.id));
                current_total_operator_en++;
                total_chara_rarity_en[element.rarity-1]++;        
            }
            $('.chara-selection-'+element.rarity).append(CreateCharaDiv(element));
        });           
    }).then(function(){          
        $(".selected-server, .selected-server-2").html("CN");                              
        $(".total-operator").html(current_total_operator);
        total_chara_rarity.forEach((element, index) => {
            $("#rarity-"+(index+1)+"-total").html("/"+element);
        });

        LoadCookies();

        $('.chara-img-btn').click(function(){
            let selected = $(this).data('selected');
            let rarity = $(this).data('rarity');                    
            let id = parseInt($(this).data('id'));

            if(selected === false){                
                $(this).css('background','white');
                $(this).data('selected',true);
                selected_chara.push(id);
                selected_count++;
                chara_rarity_count[rarity-1]++;
                $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);   
                $(".selected").html(selected_count);         
            } else {
                $(this).css('background','rgba(0,0,0,0)');
                $(this).data('selected',false);     
                selected_chara.splice(selected_chara.indexOf(id),1);                
                selected_count--;       
                chara_rarity_count[rarity-1]--;
                $("#rarity-"+rarity).html(chara_rarity_count[rarity-1]);          
                $(".selected").html(selected_count);
            }        
            
            Cookies.set("selected", selected_chara);                  
        });        
    });
}

function Reset(){
    selected_chara = [];
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

    Cookies.set("selected", selected_chara);  
}

function Generate(){
    $("#generate").css("display","none");  
    $(".loading-overlay").css("display","block");
    
    if($("#ign-input").val() === ""){            
        $("#ign").css("display","none");
    }    

    console.log($("#keep-unselected").is(":checked"));

    let rarity_to_hide = [];
    if(!$("#keep-unselected").is(":checked")){
        $(".chara-img-btn").each(function(){
            let selected = $(this).data("selected");
            if(selected === false){                
                $(this).parent().css("display","none");
            } else {
                $(this).css('background','rgba(0,0,0,0)');
            }
        });
        
        chara_rarity_count.forEach((element, index) => {
            if(element <= 0) $(".chara-selection-"+(index+1)).css("display","none");
            rarity_to_hide.push(index);
        })   
    }         

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

        if(!$("#keep-unselected").is(":checked")){
            rarity_to_hide.forEach((element) => {
                $(".chara-selection-"+element).css("display","flex");
            })
        }

        if($("#server").prop("checked")){
            $(".chara-img-btn[data-server=1]").parent().css("display","none")
        } else {
            $(".chara-img-btn[data-server=1]").parent().css("display","flex")
        }

        $(".loading-overlay").css("display","none");

        $('html, body').animate({
            scrollTop: $("div.capture-result").offset().top
        }, 1000);
    });
}

$(document).ready(function(){
    $(".version").append(VERSION);
    $(".selected").html(selected_count);

    SetChangelog();
    SetCharaDiv();    

    $('img').on('dragstart', function(event) { event.preventDefault(); });

    $('#ign-input').keyup(function(){
        $('#ign').text("IGN : " + $(this).val());
        Cookies.set("ign",$(this).val());
    })

    $('#server').click(function(){              
        if($(this).prop("checked")) SetServer("en");
        else SetServer("cn");    
        Reset();
    })

    $('.server-radio').click(function(){
        let server = $(this).prop("id");        
        if(server == "server-en"){
            $(".selected-server-2").html("EN");  
            Cookies.set("server_en","EN");
        } else if(server == "server-jp"){
            $(".selected-server-2").html("JP");  
            Cookies.set("server_en","JP");
        } else if(server == "server-kr"){
            $(".selected-server-2").html("KR");  
            Cookies.set("server_en","KR");
        }
    })

    $('#reset').click(function(){Reset();});

    $('#select-all').click(function(){        
        $('.chara-img-btn').data("selected",true).css("background","white");        
        if(selected_server == "en"){                      
            selected_chara = selected_chara_all_en;
            selected_count = current_total_operator_en;
            $(".selected").html(current_total_operator_en);   
            for(let i=1;i<=chara_rarity_count.length;i++){
                chara_rarity_count[i-1] = total_chara_rarity_en[i-1];
                $("#rarity-"+i).html(chara_rarity_count[i-1]);   
            }                        
        } else if(selected_server == "cn"){        
            selected_chara = selected_chara_all;             
            selected_count = current_total_operator;   
            $(".selected").html(current_total_operator);   
            for(let i=1;i<=chara_rarity_count.length;i++){
                chara_rarity_count[i-1] = total_chara_rarity[i-1];
                $("#rarity-"+i).html(chara_rarity_count[i-1]);   
            }  
        }

        Cookies.set("selected", selected_chara);            
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

    $('#generate').click(function(){Generate();});
});
