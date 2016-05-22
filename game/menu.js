(function(window) {

  var menuContainer,
      nickContainer;

  function init() {
    menuContainer = document.getElementById("overlay");
    nickContainer = document.getElementById("nick-container");

    resize();
    initGame();
  }

  function resize() {
    menuContainer.style.width = window.innerWidth + "px";
    menuContainer.style.height = window.innerHeight + "px";

    nickContainer.style.top = ((window.innerHeight / 2) - 35) + "px";
    nickContainer.style.left = ((window.innerWidth / 2) - 195) + "px";
  }

  window.onload = init;
  window.onresize = resize;

})(window);
