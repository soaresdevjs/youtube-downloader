(function () {
  /* ---- Elements ---- */

  const sectionPrincipal = document.querySelector('section.principal')

  /* ---- Methods ---- */

  function habilitarEventos () {
    clickConverter()
  }

  /* ---- Events ---- */

  function clickConverter () {
    sectionPrincipal.addEventListener('click', callbackClickConverter)
  }

  // /* ---- Callbacks ---- */

  // function callbackClickConverter (evento) {
  //   const elemento = 'button.converter'
  //   if (!evento.target.matches(elemento)) return
    
  //   sectionPrincipal.classList.add('carregando')

  //   setTimeout(function() {
  //     window.location.href = "https://time-espartanos.github.io/youtube-download/video/formato.html";
  //   }, 5000);
  // }

  /* ---- Start ---- */
  
  habilitarEventos()

}())