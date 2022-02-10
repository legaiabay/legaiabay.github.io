function renderHTML(content){
    document.getElementById('content').insertAdjacentHTML('beforeEnd', content);
}

function getURLParams(){
    let queryString = window.location.search;
    
    let urlParams = new URLSearchParams(queryString);

    return urlParams;
}