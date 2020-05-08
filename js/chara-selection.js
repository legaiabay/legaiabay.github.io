let chara_img = `
    <div class="col-lg-2 col-md-3 col-4 text-center">            
        <button class="chara-img-btn">
            <img class="chara-img" src="${location.pathname}../img/ak/chara/Jessica.png" width="128" height="128" data-selected="false">
        </button>
    </div>
`;

let chara_img_all = '';
for(let i=0;i<20;i++){
    chara_img_all += chara_img;
}

$(document).ready(function(){
    $('.chara-selection').html(chara_img_all);

    $('.chara-img').mouseup(function(){
        let selected = $(this).data('selected');        
        if(selected === false){
            $(this).css('background-color','white');
            $(this).data('selected',true);            
        } else {
            $(this).css('background-color','rgba(0,0,0,0)');
            $(this).data('selected',false);            
        }        
    });
});