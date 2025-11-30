const main_content = document.querySelector('main');
const theme_mod_switch = document.getElementById('theme-toggle');

theme_mod_switch.addEventListener('change', () => {
    if (theme_mod_switch.checked){
        main_content.classList.remove('lightmod');
        main_content.classList.add('darkmod');
    }
    else{
        main_content.classList.remove('darkmod');
        main_content.classList.add('lightmod');
    }
});