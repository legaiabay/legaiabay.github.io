const MAP_URL = "img/map/map-1.jpg";
const MAP_LATITUDE = 1000;
const MAP_LONGITUDE = 1200;

var anemoculus_obtained = [];

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

    console.log(anemoculus_obtained)
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
}

let markObtainedCheck = (id) => {    
    if(anemoculus_obtained.indexOf(id) > -1){        
        console.log(id + " obtained!");
        document.querySelector(`#marker-${id}`).checked = true;
    } else {
        console.log(id + " not obtained!");
    }
}

let setMarker = (map) => {
    fetch(`${location.pathname}/data/markers.json`)
    .then(res => res.json())
    .then(data => {                
        let icon_anemoculus = L.icon({
            iconUrl: `${location.pathname}/img/icon/anemoculus.png`,

            iconSize:     [38, 65], // size of the icon
            iconAnchor:   [19, 32], // point of the icon which will correspond to marker's location
            popupAnchor:  [0, -10] // point from which the popup should open relative to the iconAnchor
        });

        data.anemoculus.forEach(element => {                               
            let mark = L.latLng([ element.lat, element.lon ]);               
            L.marker(mark, {icon: icon_anemoculus})
                .bindPopup(`<b>${element.desc}</b><br><input class="marker-obtained" data-type="anemoculus" type="checkbox" id="marker-${element.id}" name="marker-${element.id}" value=${element.id} onclick="markObtainedSave(this)"><label for="marker-${element.id}"> Obtained</label>`)
                .addEventListener('click', () => { markObtainedCheck(element.id); })
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
