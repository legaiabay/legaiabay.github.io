// Database
const MARKER_JSON = `${location.pathname}data/markers.json`;
const CHANGELOG_JSON = `${location.pathname}changelog.json`;

// Map Data
const MAP_URL = "img/map/map-1-min.jpg";
const MAP_ATTRIBUTION = `Legaiabay | <a href="https://github.com/legaiabay" target="_blank">Github</a> | <a href="https://forums.mihoyo.com/genshin/article/11485" target="_blank">Map Data Source</a>`;
const MAP_LATITUDE = 2200;
const MAP_LONGITUDE = 2400;

// Marker icons
const ICON_FILTER_HIDE = `<path fill-rule="evenodd" d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>`;
const ICON_FILTER_SHOW = `<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>`;
const ICON_ANEMO = `${location.pathname}img/icon/anemoculus.png`;
const ICON_ANEMO_CHECKED = `${location.pathname}img/icon/anemoculus-checked.png`;
const ICON_GEO = `${location.pathname}img/icon/geoculus.png`;
const ICON_GEO_CHECKED = `${location.pathname}img/icon/geoculus-checked.png`;
const ICON_MON_SHRINE = `${location.pathname}img/icon/mon-shrine.png`;
const ICON_MON_SHRINE_CHECKED = `${location.pathname}img/icon/mon-shrine-checked.png`;
const ICON_LI_SHRINE = `${location.pathname}img/icon/li-shrine.png`;
const ICON_LI_SHRINE_CHECKED = `${location.pathname}img/icon/li-shrine-checked.png`;
const ICON_TELE = `${location.pathname}img/icon/teleporter.png`;
const ICON_TELE_CHECKED = `${location.pathname}img/icon/teleporter-checked.png`;

var filter_show = true;
var hide_obtained = false;

var anemoculus_show = true;
var anemoculus_total = 0;
var anemoculus_obtained = [];
var anemoculus_selected = "";

var geoculus_show = true;
var geoculus_total = 0;
var geoculus_obtained = [];
var geoculus_selected = "";

var mon_shrine_show = true;
var mon_shrine_total = 0;
var mon_shrine_obtained = [];
var mon_shrine_selected = "";

var li_shrine_show = true;
var li_shrine_total = 0;
var li_shrine_obtained = [];
var li_shrine_selected = "";

var tele_show = true;
var tele_total = 0;
var tele_obtained = [];
var tele_selected = "";

let markerIcon = (icon) => {
    return {
        iconUrl: icon,
        iconSize:     [30, 45],
        iconAnchor:   [19, 45],
        popupAnchor:  [-4, -40]
    }
}

var icon_anemoculus = L.icon(markerIcon(ICON_ANEMO));
var icon_anemoculus_selected = L.icon(markerIcon(ICON_ANEMO_CHECKED));
var icon_geoculus = L.icon(markerIcon(ICON_GEO));
var icon_geoculus_selected = L.icon(markerIcon(ICON_GEO_CHECKED));
var icon_mon_shrine = L.icon(markerIcon(ICON_MON_SHRINE));
var icon_mon_shrine_selected = L.icon(markerIcon(ICON_MON_SHRINE_CHECKED));
var icon_li_shrine = L.icon(markerIcon(ICON_LI_SHRINE));
var icon_li_shrine_selected = L.icon(markerIcon(ICON_LI_SHRINE_CHECKED));
var icon_tele = L.icon(markerIcon(ICON_TELE));
var icon_tele_selected = L.icon(markerIcon(ICON_TELE_CHECKED));

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

let save = (id, type, checked) => {
    switch(type) {
        case "anemoculus" : 
            if(checked){ if(anemoculus_obtained.indexOf(id) <= -1) anemoculus_obtained.push(id) } 
            else { anemoculus_obtained.splice(anemoculus_obtained.indexOf(id), 1); };            
            
            localStorage.setItem("anemoculus_obtained", anemoculus_obtained);
            
            if(checked) anemoculus_selected.target.setIcon(icon_anemoculus_selected)
            else anemoculus_selected.target.setIcon(icon_anemoculus)
            break;
        case "geoculus" : 
            if(checked){ if(geoculus_obtained.indexOf(id) <= -1) geoculus_obtained.push(id) } 
            else { geoculus_obtained.splice(geoculus_obtained.indexOf(id), 1); };
            
            localStorage.setItem("geoculus_obtained", geoculus_obtained);
            
            if(checked) geoculus_selected.target.setIcon(icon_geoculus_selected)
            else geoculus_selected.target.setIcon(icon_geoculus)
            break;
        case "mon_shrine" : 
            if(checked){ if(mon_shrine_obtained.indexOf(id) <= -1) mon_shrine_obtained.push(id) } 
            else { mon_shrine_obtained.splice(mon_shrine_obtained.indexOf(id), 1); };
            
            localStorage.setItem("mon_shrine_obtained", mon_shrine_obtained);
            
            if(checked) mon_shrine_selected.target.setIcon(icon_mon_shrine_selected)
            else mon_shrine_selected.target.setIcon(icon_mon_shrine)
            break;
        case "li_shrine" : 
            if(checked){ if(li_shrine_obtained.indexOf(id) <= -1) li_shrine_obtained.push(id) } 
            else { li_shrine_obtained.splice(li_shrine_obtained.indexOf(id), 1); };
            
            localStorage.setItem("li_shrine_obtained", li_shrine_obtained);
            
            if(checked) li_shrine_selected.target.setIcon(icon_li_shrine_selected)
            else li_shrine_selected.target.setIcon(icon_li_shrine)
            break;
        case "tele" : 
            if(checked){ if(tele_obtained.indexOf(id) <= -1) tele_obtained.push(id) } 
            else { tele_obtained.splice(tele_obtained.indexOf(id), 1); };
            
            localStorage.setItem("tele_obtained", tele_obtained);
            
            if(checked) tele_selected.target.setIcon(icon_tele_selected)
            else tele_selected.target.setIcon(icon_tele)
            break;
    }                
}

let reset = () => {
    anemoculus_obtained = [];
    anemoculus_selected = "";
    geoculus_obtained = [];
    geoculus_selected = "";
    mon_shrine_obtained = [];
    mon_shrine_selected = "";
    li_shrine_obtained = [];
    li_shrine_selected = "";
    tele_obtained = [];
    tele_selected = "";

    localStorage.setItem("anemoculus_obtained", anemoculus_obtained);
    localStorage.setItem("geoculus_obtained", geoculus_obtained);
    localStorage.setItem("mon_shrine_obtained", mon_shrine_obtained);
    localStorage.setItem("li_shrine_obtained", li_shrine_obtained);
    localStorage.setItem("tele_obtained", tele_obtained);

    for(let i=1;i<=anemoculus_total;i++){
        if(anemoculus_show) document.querySelector(`[alt="anemo-${i}"]`).style.display = "block";
        document.querySelector(`[alt="anemo-${i}"]`).src = ICON_ANEMO;
    }

    for(let i=1;i<=geoculus_total;i++){
        if(geoculus_show) document.querySelector(`[alt="geo-${i}"]`).style.display = "block";
        document.querySelector(`[alt="geo-${i}"]`).src = ICON_GEO;
    }

    for(let i=1;i<=mon_shrine_total;i++){
        if(mon_shrine_show) document.querySelector(`[alt="mon-shrine-${i}"]`).style.display = "block";
        document.querySelector(`[alt="mon-shrine-${i}"]`).src = ICON_MON_SHRINE;
    }

    for(let i=1;i<=li_shrine_total;i++){
        if(li_shrine_show) document.querySelector(`[alt="li-shrine-${i}"]`).style.display = "block";
        document.querySelector(`[alt="li-shrine-${i}"]`).src = ICON_LI_SHRINE;
    }

    for(let i=1;i<=tele_total;i++){
        if(tele_show) document.querySelector(`[alt="tele-${i}"]`).style.display = "block";
        document.querySelector(`[alt="tele-${i}"]`).src = ICON_TELE;
    }

    markerFoundRefresh();
}

let markerInit = () => {
    let _anemoculus_obtained = localStorage.getItem("anemoculus_obtained");
    if(_anemoculus_obtained != "" && _anemoculus_obtained != undefined){  
        anemoculus_obtained = _anemoculus_obtained.split(",").map(Number);         
    }

    let _geoculus_obtained = localStorage.getItem("geoculus_obtained");
    if(_geoculus_obtained != "" && _geoculus_obtained != undefined){  
        geoculus_obtained = _geoculus_obtained.split(",").map(Number);         
    }

    let _mon_shrine_obtained = localStorage.getItem("mon_shrine_obtained");
    if(_mon_shrine_obtained != "" && _mon_shrine_obtained != undefined){  
        mon_shrine_obtained = _mon_shrine_obtained.split(",").map(Number);         
    }

    let _li_shrine_obtained = localStorage.getItem("li_shrine_obtained");
    if(_li_shrine_obtained != "" && _li_shrine_obtained != undefined){  
        li_shrine_obtained = _li_shrine_obtained.split(",").map(Number);         
    }

    let _tele_obtained = localStorage.getItem("tele_obtained");
    if(_tele_obtained != "" && _tele_obtained != undefined){  
        tele_obtained = _tele_obtained.split(",").map(Number);         
    }

    let _anemoculus_show = localStorage.getItem("anemoculus_show");    
    if(_anemoculus_show != "" && _anemoculus_show != undefined){  
        anemoculus_show = ( _anemoculus_show == "true" );          
        document.querySelector("#filter-anemo").checked = anemoculus_show;
    }
    else document.querySelector("#filter-anemo").checked = true;

    let _geoculus_show = localStorage.getItem("geoculus_show");
    if(_geoculus_show != "" && _geoculus_show != undefined){  
        geoculus_show = ( _geoculus_show == "true" );
        document.querySelector("#filter-geo").checked = geoculus_show;
    }
    else  document.querySelector("#filter-geo").checked = true;

    let _mon_shrine_show = localStorage.getItem("mon_shrine_show");
    if(_mon_shrine_show != "" && _mon_shrine_show != undefined){  
        mon_shrine_show = ( _mon_shrine_show == "true" );
        document.querySelector("#filter-mon-shrine").checked = mon_shrine_show;
    }
    else  document.querySelector("#filter-mon-shrine").checked = true;

    let _li_shrine_show = localStorage.getItem("li_shrine_show");
    if(_li_shrine_show != "" && _li_shrine_show != undefined){  
        li_shrine_show = ( _li_shrine_show == "true" );
        document.querySelector("#filter-li-shrine").checked = li_shrine_show;
    }
    else  document.querySelector("#filter-li-shrine").checked = true;

    let _tele_show = localStorage.getItem("tele_show");
    if(_tele_show != "" && _tele_show != undefined){  
        tele_show = ( _tele_show == "true" );
        document.querySelector("#filter-tele").checked = tele_show;
    }
    else  document.querySelector("#filter-tele").checked = true;

    let _hide_obtained = localStorage.getItem("hide_obtained");
    if(_hide_obtained != "" && _hide_obtained != undefined){  
        hide_obtained = ( _hide_obtained == "true" );
        document.querySelector("#filter-hide-obtained").checked = hide_obtained;
    }
    else  document.querySelector("#filter-hide-obtained").checked = false;
}

let markerFilterInit = () => {
    document.querySelector("#filter-anemo").addEventListener('click', () => {
        let checked = document.querySelector("#filter-anemo").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-anemo").checked = checked;
        anemoculus_show = checked;        
        markerFilter("anemoculus");
        localStorage.setItem("anemoculus_show", anemoculus_show);
    })

    document.querySelector("#filter-geo").addEventListener('click', () => {
        let checked = document.querySelector("#filter-geo").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-geo").checked = checked;
        geoculus_show = checked;
        markerFilter("geoculus");
        localStorage.setItem("geoculus_show", geoculus_show);
    })    

    document.querySelector("#filter-mon-shrine").addEventListener('click', () => {
        let checked = document.querySelector("#filter-mon-shrine").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-mon-shrine").checked = checked;
        mon_shrine_show = checked;
        markerFilter("mon_shrine");
        localStorage.setItem("mon_shrine_show", mon_shrine_show);
    })   
    
    document.querySelector("#filter-li-shrine").addEventListener('click', () => {
        let checked = document.querySelector("#filter-li-shrine").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-li-shrine").checked = checked;
        li_shrine_show = checked;
        markerFilter("li_shrine");
        localStorage.setItem("li_shrine_show", li_shrine_show);
    })

    document.querySelector("#filter-tele").addEventListener('click', () => {
        let checked = document.querySelector("#filter-tele").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-tele").checked = checked;
        tele_show = checked;
        markerFilter("tele");
        localStorage.setItem("tele_show", tele_show);
    })

    document.querySelector("#filter-hide-obtained").addEventListener('click', () => {        
        let checked = document.querySelector("#filter-hide-obtained").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-hide-obtained").checked = checked;
        hide_obtained = checked;
        markerHideObtained();
        localStorage.setItem("hide_obtained", hide_obtained);
    });

    document.querySelector("#filter-btn").addEventListener('click', () => {
        filter_show = (filter_show == true) ? false : true;
        if(filter_show) {
            document.querySelectorAll(".map-filter")[0].style.top = "0%";
            document.querySelector("#filter-btn").style.top = "28%";
            document.querySelector("#filter-btn-svg").innerHTML = ICON_FILTER_SHOW;
        }
        else {
            document.querySelectorAll(".map-filter")[0].style.top = "-50%";
            document.querySelector("#filter-btn").style.top = "2%";            
            document.querySelector("#filter-btn-svg").innerHTML = ICON_FILTER_HIDE;
        }
    });
}

let markerFilter = (type) => {
    let display = "block";
    if(type == "anemoculus"){
        if(!anemoculus_show) display = "none";
        for(let i=1;i<=anemoculus_total;i++){ 
            if(hide_obtained && display == "block" && anemoculus_obtained.indexOf(i) > -1) continue                           
            document.querySelector(`[alt="anemo-${i}"]`).style.display = display;
        }
    } else if(type == "geoculus"){
        if(!geoculus_show) display = "none";
        for(let i=1;i<=geoculus_total;i++){           
            if(hide_obtained && display == "block" && geoculus_obtained.indexOf(i) > -1) continue                           
            document.querySelector(`[alt="geo-${i}"]`).style.display = display;
        }
    } else if(type == "mon_shrine"){
        if(!mon_shrine_show) display = "none";
        for(let i=1;i<=mon_shrine_total;i++){           
            if(hide_obtained && display == "block" && mon_shrine_obtained.indexOf(i) > -1) continue                           
            document.querySelector(`[alt="mon-shrine-${i}"]`).style.display = display;
        }
    } else if(type == "li_shrine"){
        if(!li_shrine_show) display = "none";
        for(let i=1;i<=li_shrine_total;i++){           
            if(hide_obtained && display == "block" && li_shrine_obtained.indexOf(i) > -1) continue                           
            document.querySelector(`[alt="li-shrine-${i}"]`).style.display = display;
        }
    } else if(type == "tele"){
        if(!tele_show) display = "none";
        for(let i=1;i<=tele_total;i++){           
            if(hide_obtained && display == "block" && tele_obtained.indexOf(i) > -1) continue                           
            document.querySelector(`[alt="tele-${i}"]`).style.display = display;
        }
    }
}

let markerHideObtained = () => {
    let display = "block";
    if(hide_obtained)display = "none";

    if(anemoculus_show){
        anemoculus_obtained.forEach(i => {
            document.querySelector(`[alt="anemo-${i}"]`).style.display = display;
        })
    }

    if(geoculus_show){
        geoculus_obtained.forEach(i => {
            document.querySelector(`[alt="geo-${i}"]`).style.display = display;
        })
    }

    if(mon_shrine_show){
        mon_shrine_obtained.forEach(i => {
            document.querySelector(`[alt="mon-shrine-${i}"]`).style.display = display;
        })
    }

    if(li_shrine_show){
        li_shrine_obtained.forEach(i => {
            document.querySelector(`[alt="li-shrine-${i}"]`).style.display = display;
        })
    }

    if(tele_show){
        tele_obtained.forEach(i => {
            document.querySelector(`[alt="tele-${i}"]`).style.display = display;
        })
    }
}

let markObtainedSave = (element) => {
    let id = parseInt(element.value);
    let type = element.getAttribute("data-type");  
    let checked = element.checked;

    save(id, type, checked);

    markerFoundRefresh();
}

let markerObtainedCheck = (marker, id, type) => {    
    switch(type) {
        case "anemoculus" :
            anemoculus_selected = marker;    
            if(anemoculus_obtained.indexOf(id) > -1) document.querySelector(`#anemo-${id}`).checked = true;
            break;
        case "geoculus" :
            geoculus_selected = marker;    
            if(geoculus_obtained.indexOf(id) > -1) document.querySelector(`#geo-${id}`).checked = true;
            break;
        case "mon_shrine" :
            mon_shrine_selected = marker;    
            if(mon_shrine_obtained.indexOf(id) > -1) document.querySelector(`#mon-shrine-${id}`).checked = true;
            break;
        case "li_shrine" :
            li_shrine_selected = marker;    
            if(li_shrine_obtained.indexOf(id) > -1) document.querySelector(`#li-shrine-${id}`).checked = true;
            break;
        case "tele" :
            tele_selected = marker;    
            if(tele_obtained.indexOf(id) > -1) document.querySelector(`#tele-${id}`).checked = true;
            break;
    }
}

let markerFoundRefresh = () => {
    let anemo_found = anemoculus_obtained.length;
    let geo_found = geoculus_obtained.length;
    let mon_shrine_found = mon_shrine_obtained.length;
    let li_shrine_found = li_shrine_obtained.length;
    let tele_found = tele_obtained.length;

    document.querySelector("#anemo-found").innerHTML = anemo_found + " / " + anemoculus_total;
    document.querySelector("#geo-found").innerHTML = geo_found + " / " + geoculus_total;
    document.querySelector("#mon-shrine-found").innerHTML = mon_shrine_found + " / " + mon_shrine_total;
    document.querySelector("#li-shrine-found").innerHTML = li_shrine_found + " / " + li_shrine_total;
    document.querySelector("#tele-found").innerHTML = tele_found + " / " + tele_total;
}

let createMarker = (_map, _data, _type, _title, _name, _obtained, _icon, _icon_selected) => {
    _data.forEach(element => {                              
        element.id = parseInt(element.id);
        let location = L.latLng([ element.lat, element.lon ]);                 
        let marker = L.marker(location, {icon: _icon, alt: _name+"-"+element.id})
            .bindPopup(`<b>${_title}</b><br><input class="marker-obtained" data-type="${_type}" type="checkbox" id="${_name}-${element.id}" name="${_name}-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="${_name}-${element.id}"> Found</label>`)
            .addEventListener('click', (m) => { 
                markerObtainedCheck(m, element.id, _type); 
            });    
        
        if(_obtained.indexOf(element.id) > -1) marker.setIcon(_icon_selected);

        marker.addTo(_map);   

        switch(_type){
            case "anemoculus" : anemoculus_total++; break;
            case "geoculus" : geoculus_total++; break;
            case "mon_shrine" : mon_shrine_total++; break;
            case "li_shrine" : li_shrine_total++; break;
            case "tele" : tele_total++; break;
        }        
    });              
}

let setMarker = (map) => {
    fetch(MARKER_JSON)
    .then(res => res.json())
    .then(data => {                
        markerInit();
        markerFilterInit();

        createMarker(map, data.anemoculus, "anemoculus", "Anemoculus", "anemo", anemoculus_obtained, icon_anemoculus, icon_anemoculus_selected);
        createMarker(map, data.geoculus, "geoculus", "Geoculus", "geo", geoculus_obtained, icon_geoculus, icon_geoculus_selected);
        createMarker(map, data.mon_shrine, "mon_shrine", "Mondstadt Shrine", "mon-shrine", mon_shrine_obtained, icon_mon_shrine, icon_mon_shrine_selected);
        createMarker(map, data.li_shrine, "li_shrine", "Liyue Shrine", "li-shrine", li_shrine_obtained, icon_li_shrine, icon_li_shrine_selected);
        createMarker(map, data.tele, "tele", "Teleporter", "tele", tele_obtained, icon_tele, icon_tele_selected);

        markerFilter("anemoculus");
        markerFilter("geoculus");
        markerFilter("mon_shrine");
        markerFilter("li_shrine");
        markerFilter("tele");

        markerHideObtained();
        markerFoundRefresh();
    });
}

let setChangelog = () => {    
    fetch(CHANGELOG_JSON)
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

        document.querySelectorAll(".version")[0].innerHTML = "v." + data.changelog[0].version;
    });

    document.querySelector("#changelog").addEventListener("click", () => {        
        document.querySelector("#changelog-modal").style.display = "block";        
    })

    document.querySelector("#changelog-close").addEventListener("click", () => {        
        document.querySelector("#changelog-modal").style.display = "none";        
    })
}

let setResetButton = () => {
    document.querySelector("#reset").addEventListener("click", () => {        
        document.querySelector("#reset-modal").style.display = "block";        
    })

    document.querySelector("#reset-yes").addEventListener("click", () => {        
        console.log("test");
        reset();
        document.querySelector("#reset-modal").style.display = "none"; 
    })

    document.querySelector("#reset-no").addEventListener("click", () => {        
        document.querySelector("#reset-modal").style.display = "none";        
    })
}

let changeMapAttribution = () => {
    let attr = MAP_ATTRIBUTION;
    let attribution = document.querySelectorAll(".leaflet-control-attribution")[0];
    attribution.innerHTML = attr;
}

//for marker positioning only
let cursorPosition = () => {
    img = document.querySelectorAll(`.leaflet-image-layer`)[0];    

    document.addEventListener('click', (e) => {
        let _offsetX = img.getBoundingClientRect().left;
        let _offsetY = img.getBoundingClientRect().bottom;
        let x = e.pageX - _offsetX;
        let y = -e.pageY + _offsetY;
        console.log(x + ", " + y);
        navigator.clipboard.writeText(x + "	" + y)
    });
}

window.ready(() => {
    let maxBounds = [[-100,-800], [2300,2700]];
    let bounds = [[0,0], [MAP_LATITUDE,MAP_LONGITUDE]];
    let map = L.map('map', {
        crs: L.CRS.Simple,
        maxBounds: maxBounds,
        maxBoundsViscosity: 10,
        minZoom: -1,
        maxZoom: 1,
        zoomControl: false
    });
    
    L.control.zoom({position: 'bottomright'}).addTo(map);
    L.imageOverlay(MAP_URL, bounds).addTo(map);
    map.fitBounds(bounds);

    changeMapAttribution();
    
    setMarker(map);

    setChangelog();

    setResetButton();
});
