(function(window) {

  var menuContainer,
      headerContainer,
      nickContainer,
      nickField,
      menuBg
      menuShown = true;

  function init() {
    menuContainer = document.getElementById("overlay");
    headerContainer = document.getElementById("header-container");
    nickContainer = document.getElementById("nick-container");
    nickField = document.getElementById("nick");

    initGame();
    resize();

    menuBg = new Image();
    menuBg.onload = function() {
      setGameMenuBg(menuBg);
    };
    menuBg.src = 'assets/images/background.png';
  }

  function resize() {
    menuContainer.style.width = window.innerWidth + "px";
    menuContainer.style.height = window.innerHeight + "px";

    headerContainer.style.top = ((window.innerHeight / 2) - 300) + "px";
    headerContainer.style.left = ((window.innerWidth / 2) - 50) + "px";

    nickContainer.style.top = ((window.innerHeight / 2) - 35) + "px";
    nickContainer.style.left = ((window.innerWidth / 2) - 195) + "px";
    resizeGame();
  }

  function onKeyDown(event) {
    switch(event.keyCode) {
      case 13: // enter key
        play(nickField.value);
        break;
      default:
        onMoveKeys(false, event);
        break;
    }
  }

  window.hideMenu = function() {
    $(menuContainer).fadeOut('slow', function() {
      menuShown = false;
    });
  };
  window.showMenu = function() {
    menuShown = true;
    $(menuContainer).fadeIn('slow');
  };
  window.onload = init;
  window.onresize = resize;
  window.onkeydown = onKeyDown;
  window.onkeyup = function(event) {
    onMoveKeys(true, event);
  };

})(window);
