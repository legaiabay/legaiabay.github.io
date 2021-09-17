var ready = false;
var formats = [];
var formatSelected = 0;

function preload(){
    return fetch(`${location.pathname}data/format.json`)
    .then(res => res.json())
    .then(data => {
        setup(data);
        ready = true;
    })
}

function setup(data){
    formats = data.format;

    let options = ``;
    formats.forEach((val,i) => {
        options += `<option value="${i}">${val['title']}</option>`;
    });

    $('#format-option').html(options);

    changeFormat(0);
}

function changeFormat(id){
    formatSelected = id;

    additional = formats[id]['additional_word'];
    additionalInput = ``;
    for(let i=1;i<=additional.length;i++){
        additionalInput += `<div class="input-label space">Additional ${i}</div><div><input class="g-width space additional-word" type="text" id="add${i}" value="${formats[id]['additional_word'][i-1]}"></div>`;
    }

    $('#output').val(formats[id]['sample']);
    $('#name').val(formats[id]['default_name']);
    $('#additional-input').html(additionalInput);
}

function copy(){
    let text = $('#output');

    navigator.clipboard.writeText(text.val());
}

/*
    to replace :
    - name
    - name_cap
    - add{index}
    - add_cap{index}
*/
function generate(){
    if(!ready){
        console.log('not ready');
        return;
    } 

    console.log('ready!');

    let word = formats[formatSelected]['format'];
    let inputName = $('#name').val();

    //name
    word = word.replaceAll('$$name$$', inputName);
    
    //name uppercase
    word = word.replaceAll("$$name_cap$$", inputName.toUpperCase());

    //repeat
    let repeat = formats[formatSelected]['repeat'];
    if(repeat){
        repeat.forEach((val,i) => {
            let chara = "";
            chara = inputName[inputName.length-1];

            wordRepeat = "";
            for(let i=0;i<val;i++){
                wordRepeat += chara;
            }

            word = word.replaceAll(`$$repeat_last_name_chara${i+1}$$`, wordRepeat);
            word = word.replaceAll(`$$repeat_last_name_chara_cap${i+1}$$`, wordRepeat.toUpperCase());
        });
    }

    //additional
    let additional = formats[formatSelected]['additional_word'];
    if(additional){
        additional.forEach((val,i) => {
            add = $(`#add${i+1}`).val();
            word = word.replaceAll(`$$add${i+1}$$`, add);
            word = word.replaceAll(`$$add_cap${i+1}$$`, add.toUpperCase());
        });
    }

    $('#output').val(word);
}

$(document).ready(function(){
    preload();

    $('#generate').on('click', function(){
        generate();
    });

    $('#copy').on('click', function(){
        copy();
    });

    $('#format-option').on('change', function(){
        changeFormat(this.value);
    });
})