function render(title) {
    return `
        <div class="p-6 max-w-4xl mx-auto bg-white">
            <h1>${title}</h1>
        </div>
    `;
}

function postTitle() {
    let title = "Hello World!"
    
    return render(title);
}

export { postTitle }
