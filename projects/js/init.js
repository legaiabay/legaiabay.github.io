const POST_JSON = `${location.pathname}post.json`

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

let createPost = (data) => {    
    let posts = ``;
    
    data.post.forEach((d,i) => {
        if(i % 2 == 0 ) posts += `<div class="row card-row">`;

        posts += `
            <div class="col-sm-12 col-xl-6">                
                <div class="card card-center" style="width: 100%;">
                    <a href="${d.href}" target="_blank">
                        <img class="card-img-top" src="projects/img/thumb/${d.thumb}" alt="Card image cap">
                    </a>
                    <div class="card-body">
                        <h5 class="card-title text-center">${d.title}</h5>
                        <p class="card-text">${d.desc}</p>
                    </div>
                </div>                    
            </div>            
        `;

        if(i % 2 != 0 ) posts += `</div>`;
    });    

    document.querySelector('#posts').innerHTML = posts;
}

let animate = () => {
    let _title = document.querySelectorAll('.title-animate');
    let _cards = document.querySelectorAll('.card');

    let tl = anime.timeline({
        duration: 500
    });

    tl
    .add({
        targets: _title,
        easing: 'easeOutQuad',
        scale: [0, 1]
    })
    .add({
        targets: _cards,
        easing: 'easeOutQuad',
        scale: [0, 1]
    })
}

let setPosts = () => {    
    fetch(POST_JSON)
    .then(res => res.json())
    .then(data => {        
        createPost(data);        
        animate();
    });
}

window.ready(() => {    
   setPosts();
});