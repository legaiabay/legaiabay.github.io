const VERSION = "v.1.3.8";

var selected_server = "cn";
var current_total_operator = 0;
var current_total_operator_en = 0;
var selected_count = 0;
var selected_chara = [];
var selected_chara_all = [];
var selected_chara_all_en = [];
var total_chara_rarity = [0,0,0,0,0,0];
var total_chara_rarity_en = [0,0,0,0,0,0];
var chara_rarity_count = [0,0,0,0,0,0];

let loadCookies = () => {   
    let saved_selected = Cookies.get("selected");
    let saved_server = Cookies.get("server");
    let saved_server_en = Cookies.get("server_en");
    let saved_ign = Cookies.get("ign");        
    
    if(saved_selected == undefined || saved_selected[0] == "" || saved_selected.length === 0) saved_selected = [];
    else saved_selected = saved_selected.split(",");    

    for(let i=0;i<saved_selected.length;i++){
        saved_selected[i] = parseInt(saved_selected[i]);
        let _selected = document.querySelector(`.chara-img-btn[data-id='${saved_selected[i]}']`);
        let rarity = _selected.getAttribute('data-rarity');    

        _selected.style.background = 'white';
        _selected.setAttribute('data-selected', true); 

        selected_count++;
        chara_rarity_count[rarity-1]++;
        
        document.querySelector("#rarity-"+rarity).innerHTML = chara_rarity_count[rarity-1];   
        document.querySelectorAll(".selected").forEach((_element) => {
            _element.innerHTML = selected_count; 
        })      
    }

    selected_chara = saved_selected;
    
    if(saved_server != "" && saved_server != undefined) {
        setServer(saved_server); 
        if(saved_server == "en") document.querySelector("#server").setAttribute("checked",true);
    }   

    if(saved_server_en != "" && saved_server_en != undefined) {        
        document.querySelector(".selected-server-2").innerHTML = saved_server_en; 
        if(saved_server_en == "EN"){
            document.querySelector("#server-en").setAttribute("checked",true);
        } else if(saved_server_en == "JP"){
            document.querySelector("#server-jp").setAttribute("checked",true);
        } else if(saved_server_en == "KR"){
            document.querySelector("#server-kr").setAttribute("checked",true);
        }
    }

    if(saved_ign != "" && saved_ign != undefined){        
        document.querySelector('#ign-input').value = saved_ign;
        document.querySelector('#ign').innerHTML = "IGN : " + saved_ign;
    }    
}

let setServer = (s) => {
    if(s == "en"){
        selected_server = "en";
        
        document.querySelectorAll(".chara-img-btn[data-server='1']").forEach((element) => {
            element.parentNode.style.display = "none";
        });

        document.querySelectorAll(".chara-img-btn[data-server='1'][data-selected=false]").forEach((element) => {
            element.style.backgroundColor = "rgba(0,0,0,0)";
        });

        document.querySelectorAll(".server-non-cn").forEach((element) => {
            element.style.display = "flex";
        });

        document.querySelector("#server-en").checked = true;

        document.querySelectorAll(".selected-server").forEach((element) => {
            element.innerHTML = "EN/JP/KR"
        });
        
        document.querySelectorAll(".selected-server-2").forEach((element) => {
            element.innerHTML = "EN"
        });

        document.querySelectorAll(".total-operator").forEach((element) => {
            element.innerHTML = current_total_operator_en;
        });

        total_chara_rarity_en.forEach((element, index) => {
            document.querySelector("#rarity-"+(index+1)+"-total").innerHTML = "/"+element;
        });        
    } else if (s == "cn"){
        selected_server = "cn";         

        document.querySelectorAll(".chara-img-btn[data-server='1']").forEach((element) => {
            element.parentNode.style.display = "flex";
        });         

        document.querySelectorAll(".server-non-cn").forEach((element) => {
            element.style.display = "none";
        });

        document.querySelectorAll(".selected-server, .selected-server-2").forEach((element) => {
            element.innerHTML = "CN"
        });

        document.querySelectorAll(".total-operator").forEach((element) => {
            element.innerHTML = current_total_operator;
        });
                             
        total_chara_rarity.forEach((element, index) => {            
            document.querySelector("#rarity-"+(index+1)+"-total").innerHTML = "/"+element;
        });    

        Cookies.set("server_en","");
    }

    Cookies.set("server",s);
}

let createCharaDiv = (data) => {
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

let setChangelog = () => {
    fetch(`${location.pathname}changelog.json`)
    .then(res => res.json())
    .then(data => {
        data.changelog.reverse();             
        data.changelog.forEach(element => {                   
            $(".changelog-body").append(`<b>Version ${element.version}</b>`);
            element.list.forEach(change => {
                $(".changelog-body").append("<br>- "+change);
            })
            $(".changelog-body").append("<br><br>");
        });        
    });
}

let setCharaDiv = () => {        
    fetch(`${location.pathname}chara-db.json`)
    .then(res => res.json())
    .then(data => {
        data.chara.forEach(element => {                   
            current_total_operator++;                      
            total_chara_rarity[element.rarity-1]++;   
            selected_chara_all.push(parseInt(element.id));
            
            if(element.server == 2){
                selected_chara_all_en.push(parseInt(element.id));
                current_total_operator_en++;
                total_chara_rarity_en[element.rarity-1]++;        
            }
            
            document.querySelectorAll('.chara-selection-'+element.rarity).forEach((_element) => {
                _element.insertAdjacentHTML('beforeend', createCharaDiv(element));
            });
        });          
    }).then(function(){                  
        document.querySelectorAll('.selected-server, .selected-server-2').forEach((_element) => {
            _element.innerHTML = 'CN';
        });

        document.querySelectorAll('.total-operator').forEach((_element) => {
            _element.innerHTML = current_total_operator;
        });
                                   
        total_chara_rarity.forEach((element, index) => {
            document.querySelector("#rarity-"+(index+1)+"-total").innerHTML = "/" + element;
        });

        loadCookies();
        
        document.querySelectorAll('.chara-img-btn').forEach((_element) => {
            _element.addEventListener('click', function() {                 
                let selected = _element.getAttribute('data-selected');
                let rarity = _element.getAttribute('data-rarity');                    
                let id = parseInt(_element.getAttribute('data-id'));

                console.log(typeof selected);

                if(selected == 'false'){                
                    _element.style.background = 'white';
                    _element.setAttribute('data-selected',true);
                    selected_chara.push(id);
                    selected_count++;
                    chara_rarity_count[rarity-1]++;
                } else {
                    _element.style.background = 'rgba(0,0,0,0)';
                    _element.setAttribute('data-selected',false);
                    selected_chara.splice(selected_chara.indexOf(id),1);                
                    selected_count--;       
                    chara_rarity_count[rarity-1]--;
                }  
                
                document.querySelector("#rarity-"+rarity).innerHTML = chara_rarity_count[rarity-1];                          
                document.querySelectorAll('.selected').forEach((_element) => {
                    _element.innerHTML = selected_count;
                });  
                
                Cookies.set("selected", selected_chara);  
            }, false);
        });
    });
}

let reset = () => {
    selected_chara = [];
    selected_count = 0;
    document.querySelectorAll('.selected').forEach((_element) => {
        _element.innerHTML = selected_count;
    });  

    chara_rarity_count = [0,0,0,0,0,0];
    for(let i=1;i<=chara_rarity_count.length;i++){
        document.querySelector("#rarity-"+i).innerHTML = "0";
    }        

    document.querySelectorAll('.chara-img-btn').forEach((_element) => {
        _element.style.background = 'rgba(0,0,0,0)';
        _element.setAttribute("data-selected", false);
    });

    Cookies.set("selected", selected_chara);  
}

let generate = () => {
    $("#generate").css("display","none");  
    $(".loading-overlay").css("display","block");
    
    if($("#ign-input").val() === ""){            
        $("#ign").css("display","none");
    }        

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

    setChangelog();
    setCharaDiv();    

    $('img').on('dragstart', function(event) { event.preventDefault(); });

    $('#ign-input').keyup(function(){
        $('#ign').text("IGN : " + $(this).val());
        Cookies.set("ign",$(this).val());
    })

    $('#server').click(function(){              
        if($(this).prop("checked")) setServer("en");
        else setServer("cn");    
        reset();
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

    $('#reset').click(function(){reset();});

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

    $('#generate').click(function(){generate();});
});
