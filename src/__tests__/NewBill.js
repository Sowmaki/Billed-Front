/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import NewBill from "../containers/NewBill.js"
import NewBillUI from "../views/NewBillUI.js"

jest.mock("../app/Store.js", () => mockStore); // Mock du store

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      document.body.innerHTML = NewBillUI();
    });

    // Test de l'upload d’un fichier image valide
    test("Then I can upload a valid file", async () => {
      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });

      const fileInput = screen.getByTestId("file");
      const file = new File(["img"], "facture.jpg", { type: "image/jpg" });

      userEvent.upload(fileInput, file);

      await waitFor(() => expect(newBill.fileUrl).toBeDefined());
      expect(newBill.fileName).toBe("facture.jpg");
    });

    // Test de l'upload d’un fichier avec un format invalide (ex: PDF)
    test("If file format is not valid, then I am invited to put a valid file", () => {
      window.alert = jest.fn();
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: localStorageMock });

      const fileInput = screen.getByTestId("file");
      const badFile = new File(["test"], "document.pdf", { type: "application/pdf" });

      userEvent.upload(fileInput, badFile);

      // Vérifie que l'alerte a été déclenchée
      expect(window.alert).toHaveBeenCalledWith("Seuls les formats jpg, jpeg et png sont pris en compte.");
      expect(fileInput.value).toBe("");
    });

    // Test de la soumission du formulaire avec des données valides
    describe('When file format is valid and I click on submit button', () => {

      test('it should post a new bill via API', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { })
        jest.spyOn(mockStore.bills(), "update")

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        Object.defineProperty(window, 'location', {
          value: { hash: ROUTES_PATH['NewBill'] },
        })

        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        document.body.innerHTML = `<div id="root"></div>`
        router()

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore, // <- utilise bien update ici
          localStorage: localStorageMock,
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.jpg", { type: "image/jpg" })
        fireEvent.change(fileInput, {
          target: { files: [file] }
        })

        screen.getByTestId("expense-type").value = "Hôtel et logement"
        screen.getByTestId("expense-name").value = "Séminaire"
        screen.getByTestId("amount").value = "500"
        screen.getByTestId("datepicker").value = "2024-04-05"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("pct").value = "20"
        screen.getByTestId("commentary").value = "Séminaire annuel"

        const form = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        form.addEventListener('submit', handleSubmit)

        fireEvent.submit(form)

        await new Promise(process.nextTick)

        expect(handleSubmit).toHaveBeenCalled()
        expect(mockStore.bills().update).toHaveBeenCalled()
      })

      test('it should log error if update API fails with 500 error', async () => {
        const error = new Error("Erreur 500")

        const mockedStore500 = {
          ...mockStore,
          bills: () => ({
            update: jest.fn().mockRejectedValue(error)
          })
        }

        jest.spyOn(console, 'error').mockImplementation(() => { })
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        Object.defineProperty(window, 'location', {
          value: { hash: ROUTES_PATH['NewBill'] },
        })

        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        document.body.innerHTML = `<div id="root"></div>`
        router()

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockedStore500,
          localStorage: localStorageMock,
        })

        const file = new File(["test"], "test.jpg", { type: "image/jpg" })
        fireEvent.change(screen.getByTestId("file"), {
          target: { files: [file] }
        })

        screen.getByTestId("expense-type").value = "Restaurant"
        screen.getByTestId("expense-name").value = "Déjeuner client"
        screen.getByTestId("amount").value = "75"
        screen.getByTestId("datepicker").value = "2024-04-05"
        screen.getByTestId("pct").value = "10"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("commentary").value = "Repas d'affaires"

        const form = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        form.addEventListener('submit', handleSubmit)

        fireEvent.submit(form)
        await new Promise(process.nextTick)

        expect(handleSubmit).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalledWith(error)
      })

      test('should log error if update API fails with 404 error', async () => {
        const error = new Error("Erreur 404")

        const mockedStore404 = {
          ...mockStore,
          bills: () => ({
            update: jest.fn().mockRejectedValue(error)
          })
        }

        jest.spyOn(console, 'error').mockImplementation(() => { })
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        Object.defineProperty(window, 'location', {
          value: { hash: ROUTES_PATH['NewBill'] },
        })

        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        document.body.innerHTML = `<div id="root"></div>`
        router()

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockedStore404,
          localStorage: localStorageMock,
        })

        const file = new File(["test"], "test.jpg", { type: "image/jpg" })
        fireEvent.change(screen.getByTestId("file"), {
          target: { files: [file] }
        })

        screen.getByTestId("expense-type").value = "Transport"
        screen.getByTestId("expense-name").value = "Taxi"
        screen.getByTestId("amount").value = "45"
        screen.getByTestId("datepicker").value = "2024-04-05"
        screen.getByTestId("pct").value = "10"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("commentary").value = "Déplacement pro"

        const form = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        form.addEventListener('submit', handleSubmit)

        fireEvent.submit(form)
        await new Promise(process.nextTick)

        expect(handleSubmit).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalledWith(error)
      })

    })
  })
})