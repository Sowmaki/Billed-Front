import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }

  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0] // Selectionne l'input avec le data-testid "file"
    const fileName = file.name// On recupère le nom du fichier dans le chemin selectionnée
    this.fileName = fileName
    const formData = new FormData() // On crée un objet FormData
    const email = JSON.parse(localStorage.getItem("user")).email //On récupère l'email de l'utilisateur connecté

    try {
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop().toLowerCase(); // On récupère l'extension du fichier

      if (!allowedExtensions.includes(fileExtension)) {
        this.document.querySelector(`input[data-testid="file"]`).value = ''; // Vide l'input si mauvais format

        alert('Seuls les formats jpg, jpeg et png sont pris en compte.') // Lance une alerte
        throw new Error('Format de fichier non autorisé. Seuls les formats jpg, jpeg et png sont autorisés.'); // et jette l'erreur
      }

      formData.append('file', file)    // Ajoute les données email et utilisateur à l'objet formdata
      formData.append('email', email)

      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })                                        //On envoie les données de formdata au backend
        .then(({ fileUrl, key }) => {
          console.log(fileUrl)
          this.billId = key
          this.fileUrl = fileUrl
          this.fileName = fileName
        }).catch(error => console.error(error))
      // La reponse de l'API nous renverra l'URL du fichier stocké, l'identifiant de la facture
      // Cette reponse sera stockée dans this.billId, this.fileUrl et this.filename
      // Si erreur, on affiche dans la console

    } catch (error) {
      console.error(error.message); // attrape toutes les erreurs possibles et les log dans la cpnsole
    }
  }

  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}