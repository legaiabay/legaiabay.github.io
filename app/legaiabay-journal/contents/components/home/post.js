function render(title, link, post) {
    return `
        <div class="p-6 max-w-4xl mx-auto bg-blue space-y-4">
            <div class="flex flex-col">
                <h1 class="font-bold">${title}</h1>
            </div>
            <div class="flex flex-col">
                <h4>${post}</h4>
            </div>
            <div class="flex flex-col">
                <h4>${post}</h4>
            </div>
            <div class="flex justify-end space-y-4">
                <a href="${link}">
                    <h4 class="font-bold">Read more ...</h4>
                </a>
            </div>
        </div>
        <br>
    `;
}

function homePost() {
    let title = "Hello World!";
    let link = "post?title=" + "hello_world"; 
    let post = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris luctus vehicula erat a euismod. Proin scelerisque mi at est aliquam, a placerat risus facilisis. Pellentesque in nisi purus.";

    let total_post = 4;
    let content = ``;
    for(let i=0;i<=total_post;i++){
        content += render(title, link, post);
    }
    
    return content;
}

export { homePost }


