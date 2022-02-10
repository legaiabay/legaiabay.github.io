function render(title) {
    return `
        <div class="p-6 max-w-md mx-auto bg-white flex flex-col items-center">
            <h1 class="font-bold">${title}</h1>
        </div>
    `;
}

function homeTitle() {
    let title = 'Legaiabay Coding Journey';
    
    return render(title);
}

export { homeTitle }
