const MAP_URL = "img/map/map-1-min.jpg";
const MAP_LATITUDE = 2200;
const MAP_LONGITUDE = 2400;

var hide_obtained = false;

var anemoculus_show = true;
var anemoculus_total = 0;
var anemoculus_obtained = [];
var anemoculus_selected = "";

var geoculus_show = true;
var geoculus_total = 0;
var geoculus_obtained = [];
var geoculus_selected = "";

var icon_anemoculus = L.icon({
    iconUrl: `${location.pathname}img/icon/anemoculus.png`,

    iconSize:     [30, 45],
    iconAnchor:   [19, 45],
    popupAnchor:  [-4, -40]
});

var icon_anemoculus_selected = L.icon({
    iconUrl: `${location.pathname}img/icon/anemoculus-checked.png`,

    iconSize:     [30, 45],
    iconAnchor:   [19, 45],
    popupAnchor:  [-4, -40]
});

var icon_geoculus = L.icon({
    iconUrl: `${location.pathname}img/icon/geoculus.png`,

    iconSize:     [30, 45],
    iconAnchor:   [19, 45],
    popupAnchor:  [-4, -40]
});

var icon_geoculus_selected = L.icon({
    iconUrl: `${location.pathname}img/icon/geoculus-checked.png`,

    iconSize:     [30, 45],
    iconAnchor:   [19, 45],
    popupAnchor:  [-4, -40]
});

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
    }                
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

    document.querySelector("#filter-hide-obtained").addEventListener('click', () => {        
        let checked = document.querySelector("#filter-hide-obtained").checked;
        checked = checked ? true : false;
        document.querySelector("#filter-hide-obtained").checked = checked;
        hide_obtained = checked;
        markerHideObtained();
        localStorage.setItem("hide_obtained", hide_obtained);
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
    }
}

let markerFoundRefresh = () => {
    let anemo_found = anemoculus_obtained.length;
    let geo_found = geoculus_obtained.length;

    document.querySelector("#anemo-found").innerHTML = anemo_found + " / " + anemoculus_total;
    document.querySelector("#geo-found").innerHTML = geo_found + " / " + geoculus_total;
}

let setMarker = (map) => {
    fetch(`${location.pathname}data/markers.json`)
    .then(res => res.json())
    .then(data => {                
        markerInit();
        markerFilterInit();

        data.anemoculus.forEach(element => {                              
            element.id = parseInt(element.id);
            let location = L.latLng([ element.lat, element.lon ]);                 
            let marker = L.marker(location, {icon: icon_anemoculus, alt: "anemo-"+element.id})
                .bindPopup(`<b>Anemoculus ${element.id}</b><br><input class="marker-obtained" data-type="anemoculus" type="checkbox" id="anemo-${element.id}" name="anemo-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="anemo-${element.id}"> Found</label>`)
                .addEventListener('click', (m) => { 
                    markerObtainedCheck(m, element.id, "anemoculus"); 
                });    
            
            if(anemoculus_obtained.indexOf(element.id) > -1) marker.setIcon(icon_anemoculus_selected);

            marker.addTo(map);   
            anemoculus_total++;
        });              

        data.geoculus.forEach(element => {                              
            element.id = parseInt(element.id);
            let location = L.latLng([ element.lat, element.lon ]);                 
            let marker = L.marker(location, {icon: icon_geoculus, alt: "geo-"+element.id})
                .bindPopup(`<b>Geoculus ${element.id}</b><br><input class="marker-obtained" data-type="geoculus" type="checkbox" id="geo-${element.id}" name="geo-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="geo-${element.id}"> Found</label>`)
                .addEventListener('click', (m) => { 
                    markerObtainedCheck(m, element.id, "geoculus"); 
                });    
            
            if(geoculus_obtained.indexOf(element.id) > -1) marker.setIcon(icon_geoculus_selected);

            marker.addTo(map);   
            geoculus_total++;
        });              

        markerFilter("anemoculus");
        markerFilter("geoculus");
        markerHideObtained();
        markerFoundRefresh();
    });
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

    document.querySelector("#changelog").addEventListener("click", () => {        
        document.querySelector("#changelog-modal").style.display = "block";        
    })

    document.querySelector("#changelog-close").addEventListener("click", () => {        
        document.querySelector("#changelog-modal").style.display = "none";        
    })
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

let changeMapAttribution = () => {
    let attr = `Legaiabay | <a href="https://github.com/legaiabay" target="_blank">Github</a> | <a href="https://forums.mihoyo.com/genshin/article/11485" target="_blank">Map Data Source</a>`;

    let attribution = document.querySelectorAll(".leaflet-control-attribution")[0];
    attribution.innerHTML = attr;
}

window.ready(() => {
    let bounds = [[0,0], [MAP_LATITUDE,MAP_LONGITUDE]];
    let map = L.map('map', {
        attributionControl: true,
        crs: L.CRS.Simple,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
        maxZoom: 1,
        zoomControl: false
    });
    L.imageOverlay(MAP_URL, bounds).addTo(map);
    map.fitBounds(bounds);

    changeMapAttribution();
    
    setMarker(map);

    setChangelog();

    //cursorPosition();
});
