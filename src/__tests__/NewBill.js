/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import { ROUTES_PATH } from "../constants/routes.js"
import NewBill from "../containers/NewBill.js"
import NewBillUI from "../views/NewBillUI.js"

jest.mock("../app/Store.js", () => mockStore); // Mock du store

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    beforeEach(() => {
      jest.clearAllMocks()
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      document.body.innerHTML = NewBillUI()

    })

    //Upload d'un fichier valide
    test("Then I can upload a valid file", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      const fileInput = screen.getByTestId("file")
      const file = new File(["img"], "facture.jpg", { type: "image/jpg" })

      userEvent.upload(fileInput, file)

      await waitFor(() => expect(newBill.fileUrl).toBeDefined())
      expect(newBill.fileName).toBe("facture.jpg")
    })

    test("Throw Error if file format is not valid", () => {
      window.alert = jest.fn()
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })

      const fileInput = screen.getByTestId("file")
      const badFile = new File(["test"], "document.pdf", { type: "application/pdf" })

      userEvent.upload(fileInput, badFile)

      expect(window.alert).toHaveBeenCalledWith("Seuls les formats jpg, jpeg et png sont pris en compte.")
      expect(fileInput.value).toBe("")
    })

    test("Submit form with valid data", async () => {
      // document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Fake une image uploadée
      newBill.fileUrl = "https://localhost:3456/images/test.jpg"
      newBill.fileName = "test.jpg"
      newBill.billId = "1234"

      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris" } })
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-01" } })
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "150" } })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Un commentaire" } })

      fireEvent.submit(screen.getByTestId("form-new-bill"))

      await waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
      })
    })


  })
})
