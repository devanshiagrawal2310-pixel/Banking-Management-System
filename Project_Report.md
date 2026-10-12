# MINI PROJECT REPORT
## Banking Management System Using Java

**Student Name:** ____________________  
**Roll Number:** ____________________  
**Class/Division:** ____________________  
**College:** ____________________

## 1. Abstract
The Banking Management System is a menu-driven Java program for performing basic banking operations. It supports account creation, deposits, withdrawals, balance inquiry, account details and transaction history. It validates amounts, checks available balance and enforces a daily withdrawal limit.

## 2. Problem Statement
A simple computer program is useful for demonstrating how common banking operations can be handled systematically while validating transactions and avoiding invalid withdrawals.

## 3. Objectives
- Implement basic banking operations in Java.
- Apply classes, objects, constructors, encapsulation and methods.
- Validate transaction amounts and account details.
- Prevent withdrawals exceeding the balance or daily limit.

## 4. Software Requirements
Java JDK 17 or later; Windows/Linux/macOS; terminal or Java IDE.

## 5. System Design
`BankAccount` stores account information and implements deposit, withdrawal, details and transaction-history operations. `BankingManagementSystem` displays the menu, accepts input and manages accounts.

## 6. Algorithm
1. Start and display the menu.
2. Read the user's choice.
3. Create an account or find an existing account.
4. For deposits, validate the amount and update balance.
5. For withdrawals, validate the amount, balance and daily limit.
6. Display balance, details or transaction history when selected.
7. Repeat until Exit is selected.

## 7. OOP Concepts
- **Class and object:** Model bank accounts and the application.
- **Constructor:** Initializes an account.
- **Encapsulation:** Account fields are private.
- **Methods:** Implement banking operations.
- **Loops and conditions:** Handle menu navigation and validation.
- **Exception handling:** Handle invalid input and constructor data.

## 8. Test Cases
| Test | Expected result |
|---|---|
| Create a unique account | Account created |
| Reuse account number | Duplicate rejected |
| Deposit positive amount | Balance increases |
| Deposit zero/negative amount | Rejected |
| Withdraw within balance and limit | Balance decreases |
| Withdraw more than balance | Rejected |
| Exceed ₹10,000 daily limit | Rejected |
| Search unknown account | Account-not-found message |

## 9. Advantages
Simple to use, demonstrates Java OOP concepts, validates transactions and can be extended.

## 10. Limitations
Data is not saved after exit. There is no authentication, real bank integration or real payment processing. This is an educational prototype.

## 11. Future Enhancements
Add file/database storage, login, account statements and a GUI using Swing or JavaFX.

## 12. Conclusion
The project demonstrates basic banking operations and core Java OOP concepts. It checks balances, validates transactions and enforces a daily withdrawal limit.
