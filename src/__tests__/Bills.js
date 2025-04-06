/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {


    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router(); // Initialise le routeur
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy();
    });

    // FACTURES TRIEES
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });

    // HANDLECLICKICONEYE
    describe('When I click on IconEye ', () => {
      test('should open the modal with the bill image', () => {
        const icon = document.createElement('div');
        icon.setAttribute('data-bill-url', 'https://fakeurl.com/bill.jpg');

        $.fn.modal = jest.fn();
        const modal = document.createElement('div');
        modal.setAttribute('id', 'modaleFile');
        modal.innerHTML = '<div class="modal-body"></div>';
        document.body.append(modal);

        const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        billsInstance.handleClickIconEye(icon);

        const modalBody = document.querySelector('.modal-body');
        expect(modalBody.innerHTML).toContain('https://fakeurl.com/bill.jpg');
        expect($.fn.modal).toHaveBeenCalledWith('show');
      });
    });

    // HANDLECLICKNEWBILL
    describe('When I click on new bill button', () => {
      test(('Then, I should be sent to newBill page'), () => {
        const daBills = [{
          id: "47qAXb6fIm2zOKkLzMro",
          date: "2004-04-04",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          amount: 400,
          vat: "80",
          pct: 20,
          status: "pending",
          email: "a@a"
        }];

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

        const bills = new Bills({ document, onNavigate, localStorage });
        const handleClick = jest.fn(bills.handleClickNewBill.bind(bills));

        document.body.innerHTML = BillsUI({ data: daBills });

        const btnNewBill = screen.getByTestId('btn-new-bill');
        btnNewBill.addEventListener("click", handleClick);

        fireEvent.click(btnNewBill);
        expect(handleClick).toHaveBeenCalled();
      });
    });

    // GETBILLS
    describe("When API data is corrupted", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        document.body.innerHTML = `<div id="root"></div>`;
        router();
      });

      test("date format is not valid, log the error and return unformatted date", async () => {
        const consoleErrorSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        // Mocke une réponse contenant une date invalide
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.resolve([{
              vat: 0,
              status: "",
              type: "",
              commentary: "",
              name: "",
              fileName: "",
              filePath: "",
              date: "fakeDate",
              amount: 0,
              commentAdmin: "",
              pct: 0,
              email: "",
              key: "bklbhfdr",
            }]),
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);

        const message = await screen.getByText(/fakeDate/);
        expect(message).toBeTruthy();

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy.mock.calls[0][1]).toBe("for", expect.objectContaining({ date: "fakeDate" }));
      });

      test("should log 400 error and return empty list", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 400")),
        }));

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);

        expect(consoleSpy).toHaveBeenCalledWith(new Error("Erreur 400"));
      });

      test("should log 500 error and return empty list", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);

        expect(consoleSpy).toHaveBeenCalledWith(new Error("Erreur 500"));
      });
    });
  });
});