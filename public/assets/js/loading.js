// JS loading INDEX

const body = document.body
const divLoading = document.querySelector('div.loading')

window.addEventListener('load', () => {
  setTimeout(() => {
    body.classList.remove('loadingAparecendo')
    divLoading.classList.add('ocultar')
  }, 1500)
})