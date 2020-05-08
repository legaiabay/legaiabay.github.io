let chara_img = `
    <div class="col-lg-2 col-md-3 col-4 text-center">            
    <img class="chara-img" src="img/chara/Jessica.png" width="128" height="128">
    </div>
`;

let chara_img_all = '';
for(let i=0;i<20;i++){
    chara_img_all += chara_img;
}

$(document).ready(function(){
    $('.chara-selection').html(chara_img_all);
});