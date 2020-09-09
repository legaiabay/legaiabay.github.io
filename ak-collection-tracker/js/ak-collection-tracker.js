const VERSION = "v.1.4.3";
const COOKIE_EXPIRED = 365;

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

ready = (fn) => {
    if (document.readyState != 'loading') {
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', () => {
        if (document.readyState != 'loading')
            fn();
        });
    }
}

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
        
        document.querySelectorAll(".chara-img-btn[data-server='1']").forEach((_element) => {
            _element.parentNode.style.display = "none";
        });

        document.querySelectorAll(".chara-img-btn[data-server='1'][data-selected=false]").forEach((_element) => {
            _element.style.backgroundColor = "rgba(0,0,0,0)";
        });

        document.querySelectorAll(".server-non-cn").forEach((_element) => {
            _element.style.display = "flex";
        });

        document.querySelector("#server-en").checked = true;

        document.querySelectorAll(".selected-server").forEach((_element) => {
            _element.innerHTML = "EN/JP/KR"
        });
        
        document.querySelectorAll(".selected-server-2").forEach((_element) => {
            _element.innerHTML = "EN"
        });

        document.querySelectorAll(".total-operator").forEach((_element) => {
            _element.innerHTML = current_total_operator_en;
        });

        total_chara_rarity_en.forEach((_element, index) => {
            document.querySelector("#rarity-"+(index+1)+"-total").innerHTML = "/"+_element;
        });        
    } else if (s == "cn"){
        selected_server = "cn";         

        document.querySelectorAll(".chara-img-btn[data-server='1']").forEach((_element) => {
            _element.parentNode.style.display = "flex";
        });         

        document.querySelectorAll(".server-non-cn").forEach((_element) => {
            _element.style.display = "none";
        });

        document.querySelectorAll(".selected-server, .selected-server-2").forEach((_element) => {
            _element.innerHTML = "CN"
        });

        document.querySelectorAll(".total-operator").forEach((_element) => {
            _element.innerHTML = current_total_operator;
        });
                             
        total_chara_rarity.forEach((_element, index) => {            
            document.querySelector("#rarity-"+(index+1)+"-total").innerHTML = "/"+_element;
        });    

        Cookies.set("server_en","", { expires: COOKIE_EXPIRED });
    }

    Cookies.set("server",s,{ expires: COOKIE_EXPIRED });
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
                    <img class="chara-img disable-drag" src="${location.pathname}/img/ak/avatars/${data.image}.png" loading="lazy" width="128" height="128" alt="${data.name}">
                    <img class="chara-img-class disable-drag" src="${location.pathname}/img/ak/classes/${class_img}">                
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
        data.changelog.forEach(_element => {                               
            document.querySelectorAll('.changelog-body').forEach((__element) => {
                __element.insertAdjacentHTML('beforeend', `<b>Version ${_element.version}</b>`);
            });
            _element.list.forEach(change => {                
                document.querySelector('.changelog-body').insertAdjacentHTML('beforeend', "<br>- "+change);
            })            
            document.querySelector('.changelog-body').insertAdjacentHTML('beforeend', "<br><br>");
        });        
    });
}

let setCharaDiv = () => {        
    fetch(`${location.pathname}chara-db.json`)
    .then(res => res.json())
    .then(data => {
        data.chara.forEach(_element => {                   
            current_total_operator++;                      
            total_chara_rarity[_element.rarity-1]++;   
            selected_chara_all.push(parseInt(_element.id));            
            
            if(_element.server == 2){
                selected_chara_all_en.push(parseInt(_element.id));
                current_total_operator_en++;
                total_chara_rarity_en[_element.rarity-1]++;        
            }
            
            document.querySelectorAll('.chara-selection-'+_element.rarity).forEach((__element) => {
                __element.insertAdjacentHTML('beforeend', createCharaDiv(_element));
            });
        });          
    }).then(() => {                  
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
            _element.addEventListener('click', () => {                 
                let selected = _element.getAttribute('data-selected');
                let rarity = _element.getAttribute('data-rarity');                    
                let id = parseInt(_element.getAttribute('data-id'));                

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
                
                Cookies.set("selected", selected_chara, { expires: COOKIE_EXPIRED });  
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

    Cookies.set("selected", selected_chara, { expires: COOKIE_EXPIRED });  
}

let generate = () => {
    document.querySelector("#generate").style.display = "none";  
    document.querySelector(".loading-overlay").style.display = "block";
    
    if(document.querySelector("#ign-input").value === ""){            
        document.querySelector("#ign").style.display = "none";
    }        

    let rarity_to_hide = [];        
    if(!document.querySelector("#keep-unselected").checked){
        document.querySelectorAll('.chara-img-btn').forEach((_element) => {
            let selected = _element.getAttribute("data-selected");            
            if(selected == 'false'){                
                _element.parentNode.style.display = "none";
            } else {
                _element.style.background = 'rgba(0,0,0,0)';                    
            }
        });

        chara_rarity_count.forEach((_element, index) => {
            if(_element <= 0){
                document.querySelectorAll('.chara-selection-'+(index+1)).forEach((__element) => {
                    __element.style.display = "none";
                });
            }
            rarity_to_hide.push(index);
        })   
    }    

    window.scrollTo({        
        left: 0,
        top: document.querySelector("body").offsetTop   
    });

    html2canvas(document.querySelector("#capture-area"), {
        backgroundColor	: '#1b262c',
        width: window.innerWidth                      
    }).then(canvas => {                                           
        let current_date = new Date().format('Ymd-his');             
        let url = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");

        document.querySelector("#result-img").setAttribute("src",url);
        document.querySelector("#result-a").setAttribute("href",url);                        
        if(document.querySelector("#ign-input").value !== ""){
            document.querySelector("#result-a").setAttribute("download",`ak-collection-tracker-${document.querySelector("#ign-input").value}-${current_date}.jpg`);
        } else {
            document.querySelector("#result-a").setAttribute("download",`ak-collection-tracker-${current_date}.jpg`);
        }                

        document.querySelector("#generate").style.display = "initial";
        document.querySelector(".capture-result").style.display = "initial";
        document.querySelector("#ign").style.display = "flex"; 
        
        document.querySelectorAll('.chara-img-btn').forEach((_element) => {
            let selected = _element.getAttribute("data-selected");
            if(selected == 'false'){
                _element.parentNode.style.display = "initial";
            } else {
                _element.style.background = "white";
            }           
        });                

        if(!document.querySelector("#keep-unselected").checked){
            rarity_to_hide.forEach((_element, index) => {
                document.querySelectorAll('.chara-selection-'+(index+1)).forEach((__element) => {
                    __element.style.display = "flex";
                });
            })
        }
                
        if(document.querySelector("#server").checked){
            document.querySelectorAll(".chara-img-btn[data-server='1']").forEach((_element) => {
                _element.parentNode.style.display = "none";
            });
        } else {
            document.querySelectorAll(".chara-img-btn[data-server='1']").forEach((_element) => {
                _element.parentNode.style.display = "flex";
            });
        }

        document.querySelector(".loading-overlay").style.display = "none";

        window.scrollTo({     
            behavior: "smooth",   
            left: 0,
            top: document.querySelector("div.capture-result").offsetTop   
        });
    });
}

window.ready(() => {
    document.querySelectorAll(".version").forEach((_element) => {
        _element.insertAdjacentHTML('beforeend', VERSION);
    });
    
    document.querySelectorAll(".selected").forEach((_element) => {
        _element.innerHTML = selected_count;
    });

    setChangelog();
    setCharaDiv();        

    document.querySelector('#ign-input').addEventListener('keyup', () => {   
        document.querySelector('#ign').innerHTML = "IGN : " + document.querySelector('#ign-input').value;
        Cookies.set("ign",document.querySelector('#ign-input').value,{ expires: COOKIE_EXPIRED });
    });

    document.querySelector('#server').addEventListener('click', () => {        
        if(document.querySelector('#server').checked) setServer("en");
        else setServer("cn");    
        reset();
    });             

    document.querySelectorAll(".server-radio").forEach((_element) => {
        _element.addEventListener('click', () => {
            let server = _element.getAttribute("id");        
            if(server == "server-en"){
                document.querySelector(".selected-server-2").innerHTML = "EN";  
                Cookies.set("server_en","EN",{ expires: COOKIE_EXPIRED });
            } else if(server == "server-jp"){
                document.querySelector(".selected-server-2").innerHTML = "JP";  
                Cookies.set("server_en","JP",{ expires: COOKIE_EXPIRED });
            } else if(server == "server-kr"){
                document.querySelector(".selected-server-2").innerHTML = "KR";  
                Cookies.set("server_en","KR",{ expires: COOKIE_EXPIRED });
            }
        });
    });

    document.querySelector('#reset').addEventListener('click', () => {reset();});

    document.querySelector('#select-all').addEventListener('click', () => {    
        document.querySelectorAll(".chara-img-btn").forEach((_element) => {
            _element.setAttribute("data-selected", true);
            _element.style.background = "white"
        });
        
        if(selected_server == "en"){                      
            selected_chara = selected_chara_all_en;
            selected_count = current_total_operator_en;            
            document.querySelectorAll(".selected").forEach((_element) => {
                _element.innerHTML = current_total_operator_en;
            });
            for(let i=1;i<=chara_rarity_count.length;i++){
                chara_rarity_count[i-1] = total_chara_rarity_en[i-1];
                document.querySelector("#rarity-"+i).innerHTML = chara_rarity_count[i-1];   
            }                        
        } else if(selected_server == "cn"){        
            selected_chara = selected_chara_all;             
            selected_count = current_total_operator;               
            document.querySelectorAll(".selected").forEach((_element) => {
                _element.innerHTML = current_total_operator;
            });  
            for(let i=1;i<=chara_rarity_count.length;i++){
                chara_rarity_count[i-1] = total_chara_rarity[i-1];
                document.querySelector("#rarity-"+i).innerHTML = chara_rarity_count[i-1];  
            }  
        }

        Cookies.set("selected", selected_chara,{ expires: COOKIE_EXPIRED });            
    })

    document.querySelector('#to-top').addEventListener('click', () => {
        window.scrollTo({  
            behavior: "smooth",      
            left: 0,
            top: document.querySelector("body").offsetTop
        });
    })

    document.querySelector('#generate').addEventListener('click', () => {generate();});
});
