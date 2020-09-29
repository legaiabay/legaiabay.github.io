const MAP_URL = "img/map/map-1.jpg";
const MAP_LATITUDE = 1000;
const MAP_LONGITUDE = 1200;

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
}

let markObtainedInit = () => {
    fetch(`${location.pathname}/data/obtained.json`)
    .then(res => res.json())
    .then(data => {                
        anemoculus_obtained = data.anemoculus;
        console.log(anemoculus_obtained);
    });
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
    fetch(`${location.pathname}/data/markers.json`)
    .then(res => res.json())
    .then(data => {                
        data.anemoculus.forEach(element => {                               
            let mark = L.latLng([ element.lat, element.lon ]);                 
            L.marker(mark, {icon: icon_anemoculus})
                .bindPopup(`<b>${element.desc}</b><br><input class="marker-obtained" data-type="anemoculus" type="checkbox" id="marker-${element.id}" name="marker-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="marker-${element.id}"> Obtained</label>`)
                .addEventListener('click', (marker) => { markObtainedCheck(marker, element.id); })
                .addTo(map);       
        });              

        markObtainedInit();
    });
}

window.ready(() => {
    let map = L.map('map', {crs: L.CRS.Simple});
    let bounds = [[0,0], [MAP_LATITUDE,MAP_LONGITUDE]];
    L.imageOverlay(MAP_URL, bounds).addTo(map);
    map.fitBounds(bounds);
    
    setMarker(map);
});
