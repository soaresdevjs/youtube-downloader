(function () {
  /* Elements */

  const sectionPrincipal = document.querySelector('section.principal')

   /* Methods */

   function habilitarEventos () {
    clickDuvida()
    clickConfirmar()
  }

  /* Events */

  function clickDuvida () {
    sectionPrincipal.addEventListener('click', callbackClickDuvida)
  }

  function clickConfirmar () {
    sectionPrincipal.addEventListener('click', callbackClickConfirmar)
  }

  /* Callbacks */

  function callbackClickDuvida (evento) {
    const elemento = 'button.formato'
    if (!evento.target.matches(elemento)) return
    ativarDuvida(evento.target)
  }
  
  function callbackClickConfirmar (evento) {
    const elemento = 'button.confirmar'
    if (!evento.target.matches(elemento)) return

  }

  /* View */

  function ativarDuvida (buttonFormato) {
    desativarBotao()
    buttonFormato.classList.add('ativo')
    sectionPrincipal.classList.add('confirmacao')
  }

  function desativarBotao () {
    const divs = sectionPrincipal.querySelectorAll('button.formato')
    for (const div of divs) {
      div.classList.remove('ativo')
    }
  }

  /* Start */
  
  habilitarEventos()

}())