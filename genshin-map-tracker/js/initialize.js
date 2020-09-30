const MAP_URL = "img/map/map-1-min.jpg";
const MAP_LATITUDE = 2200;
const MAP_LONGITUDE = 2400;

var anemoculus_obtained = [];
var anemoculus_selected = "";
var geoculus_obtained = [];
var geoculus_selected = "";

var icon_anemoculus = L.icon({
    iconUrl: `${location.pathname}img/icon/anemoculus.png`,

    iconSize:     [38, 65],
    iconAnchor:   [19, 64],
    popupAnchor:  [0, -10]
});

var icon_anemoculus_selected = L.icon({
    iconUrl: `${location.pathname}img/icon/anemoculus-checked.png`,

    iconSize:     [38, 65],
    iconAnchor:   [19, 64],
    popupAnchor:  [0, -10]
});

var icon_geoculus = L.icon({
    iconUrl: `${location.pathname}img/icon/geoculus.png`,

    iconSize:     [38, 65],
    iconAnchor:   [19, 64],
    popupAnchor:  [0, -10]
});

var icon_geoculus_selected = L.icon({
    iconUrl: `${location.pathname}img/icon/geoculus-checked.png`,

    iconSize:     [38, 65],
    iconAnchor:   [19, 64],
    popupAnchor:  [0, -10]
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

let markObtainedInit = () => {
    let _anemoculus_obtained = localStorage.getItem("anemoculus_obtained");
    if(_anemoculus_obtained != "" && _anemoculus_obtained != undefined){  
        anemoculus_obtained = _anemoculus_obtained.split(",").map(Number);         
    }

    let _geoculus_obtained = localStorage.getItem("geoculus_obtained");
    if(_geoculus_obtained != "" && _geoculus_obtained != undefined){  
        geoculus_obtained = _geoculus_obtained.split(",").map(Number);         
    }
}

let markObtainedSave = (element) => {
    let id = parseInt(element.value);
    let type = element.getAttribute("data-type");  
    let checked = element.checked;

    save(id, type, checked);
}

let markObtainedCheck = (marker, id, type) => {    
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

let setMarker = (map) => {
    fetch(`${location.pathname}data/markers.json`)
    .then(res => res.json())
    .then(data => {                
        markObtainedInit();
        data.anemoculus.forEach(element => {                              
            element.id = parseInt(element.id);
            let location = L.latLng([ element.lat, element.lon ]);                 
            let marker = L.marker(location, {icon: icon_anemoculus})
                .bindPopup(`<b>Anemoculus ${element.id}</b><br><input class="marker-obtained" data-type="anemoculus" type="checkbox" id="anemo-${element.id}" name="anemo-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="anemo-${element.id}"> Found</label>`)
                .addEventListener('click', (m) => { 
                    markObtainedCheck(m, element.id, "anemoculus"); 
                });    
            
            if(anemoculus_obtained.indexOf(element.id) > -1) marker.setIcon(icon_anemoculus_selected);

            marker.addTo(map);   
        });              

        data.geoculus.forEach(element => {                              
            element.id = parseInt(element.id);
            let location = L.latLng([ element.lat, element.lon ]);                 
            let marker = L.marker(location, {icon: icon_geoculus})
                .bindPopup(`<b>Geoculus ${element.id}</b><br><input class="marker-obtained" data-type="geoculus" type="checkbox" id="geo-${element.id}" name="geo-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="geo-${element.id}"> Found</label>`)
                .addEventListener('click', (m) => { 
                    markObtainedCheck(m, element.id, "geoculus"); 
                });    
            
            if(geoculus_obtained.indexOf(element.id) > -1) marker.setIcon(icon_geoculus_selected);

            marker.addTo(map);   
        });              
    });
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
    let bounds = [[0,0], [MAP_LATITUDE,MAP_LONGITUDE]];
    let map = L.map('map', {
        crs: L.CRS.Simple,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
        maxZoom: 1
    });
    L.imageOverlay(MAP_URL, bounds).addTo(map);
    map.fitBounds(bounds);
    
    setMarker(map);
    cursorPosition();
});
