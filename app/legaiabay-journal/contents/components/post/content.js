function render(content) {
    return `
        <div class="p-6 max-w-4xl mx-auto bg-white items-center">
            <div class="flex space-x-6">
                <h4>${content}</h4>
            </div>
        </div>
    `;
}

function postContent() {
    let content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris luctus vehicula erat a euismod. Proin scelerisque mi at est aliquam, a placerat risus facilisis. Pellentesque in nisi purus. Aenean in turpis id felis tristique luctus a ac nulla. In nec fringilla nisi. Phasellus pellentesque dolor eget felis aliquam, tempus elementum massa semper. Quisque lorem elit, convallis ut purus et, feugiat dignissim enim. Suspendisse pretium vitae augue nec feugiat. Donec auctor quam risus, id pretium tortor feugiat nec. Nunc et ipsum vitae quam dignissim tristique. Sed sit amet augue eu dui accumsan tempus. Cras est nisl, condimentum a lacinia nec, feugiat vel tellus. Phasellus id aliquam ex. Sed maximus dolor sit amet sollicitudin pharetra. Praesent convallis sagittis orci, in tempor nisi varius ac. Proin eleifend orci sit amet felis tempor interdum.";
    
    return render(content);
}

export { postContent }


