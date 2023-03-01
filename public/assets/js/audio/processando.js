(function () {

  /* Methods */

  function habilitarEventos () {
    irParaConvertido()
  }

  /* Events */

  function irParaConvertido () {
    setTimeout(function() {
      window.location.href = "https://time-espartanos.github.io/youtube-download/audio/sucesso.html";
    }, 5000);
  }

  /* Start */
  
  habilitarEventos()

}())