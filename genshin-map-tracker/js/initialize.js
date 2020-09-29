const MAP_URL = "img/map/map-1.jpg";
const MAP_LATITUDE = 1000;
const MAP_LONGITUDE = 1200;
const COOKIE_EXPIRED = 365;

var anemoculus_obtained = [];
var anemoculus_selected = "";

var icon_anemoculus = L.icon({
    iconUrl: `${location.pathname}img/icon/anemoculus.png`,

    iconSize:     [38, 65],
    iconAnchor:   [19, 32],
    popupAnchor:  [0, -10]
});

var icon_anemoculus_selected = L.icon({
    iconUrl: `${location.pathname}img/icon/anemoculus-checked.png`,

    iconSize:     [38, 65],
    iconAnchor:   [19, 32],
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
        case "anemoculus" : checked ? anemoculus_obtained.push(id) : anemoculus_obtained.splice(anemoculus_obtained.indexOf(id), 1); break;
    }            

    Cookies.set("anemoculus_obtained",anemoculus_obtained,{ expires: COOKIE_EXPIRED });
}

let markObtainedInit = () => {
    // fetch(`${location.pathname}data/obtained.json`)
    // .then(res => res.json())
    // .then(data => {                
    //     anemoculus_obtained = data.anemoculus;
    //     console.log(anemoculus_obtained);
    // });

    let _anemoculus_obtained = Cookies.get("anemoculus_obtained");
    if(_anemoculus_obtained != "" && _anemoculus_obtained != undefined){  
        anemoculus_obtained = _anemoculus_obtained.split(",").map(Number);
        console.log(anemoculus_obtained)   
    }
}

let markObtainedSave = (element) => {
    let id = parseInt(element.value);
    let type = element.getAttribute("data-type");  
    let checked = element.checked;

    save(id, type, checked);

    if(checked) anemoculus_selected.target.setIcon(icon_anemoculus_selected)
    else anemoculus_selected.target.setIcon(icon_anemoculus)
}

let markObtainedCheck = (marker, id) => {    
    anemoculus_selected = marker;
    
    if(anemoculus_obtained.indexOf(id) > -1){        
        document.querySelector(`#marker-${id}`).checked = true;
    }
}

let setMarker = (map) => {
    fetch(`${location.pathname}data/markers.json`)
    .then(res => res.json())
    .then(data => {                
        markObtainedInit();
        data.anemoculus.forEach(element => {                               
            let location = L.latLng([ element.lat, element.lon ]);                 
            let marker = L.marker(location, {icon: icon_anemoculus})
                .bindPopup(`<b>${element.desc}</b><br><input class="marker-obtained" data-type="anemoculus" type="checkbox" id="marker-${element.id}" name="marker-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="marker-${element.id}"> Obtained</label>`)
                .addEventListener('click', (marker) => { markObtainedCheck(marker, element.id); });    

            if(anemoculus_obtained.indexOf(element.id) > -1){                
                marker.setIcon(icon_anemoculus_selected);
            }

            marker.addTo(map);   
        });              
    });
}

window.ready(() => {
    let map = L.map('map', {crs: L.CRS.Simple});
    let bounds = [[0,0], [MAP_LATITUDE,MAP_LONGITUDE]];
    L.imageOverlay(MAP_URL, bounds).addTo(map);
    map.fitBounds(bounds);
    
    setMarker(map);
});
