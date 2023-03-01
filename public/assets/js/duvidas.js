(function () {
  /* Elements */

  const sectionInformacoes = document.querySelector('section.informacoes')

  /* Methods */

  function habilitarEventos () {
    clickDuvida()
  }

  /* Events */

  function clickDuvida () {
    sectionInformacoes.addEventListener('click', callbackClickDuvida)
  }

  /* Callbacks */

  function callbackClickDuvida (evento) {
    const elemento = 'div.duvida'
    if (!evento.target.matches(elemento)) return
    
    ativarDuvida(evento.target)
  }

  /* View */

  function ativarDuvida (divDuvida) {
    desativarDuvidas()
    divDuvida.classList.add('mostrar')
  }

  function desativarDuvidas () {
    const divs = sectionInformacoes.querySelectorAll('div.duvida')
    for (const div of divs) {
      div.classList.remove('mostrar')
    }
  }

  /* Start */
  
  habilitarEventos()

}())