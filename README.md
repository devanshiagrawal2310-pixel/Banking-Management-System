# Banking Management System — Java Mini Project

## Features
- Create bank accounts
- Deposit and withdraw money
- Daily withdrawal limit of ₹10,000
- Balance inquiry and account details
- Transaction history for the current session
- Input validation and duplicate-account checks

## Run on Windows
Install JDK 17 or later. Open Command Prompt inside this folder and run:

```bat
javac -d out src\BankAccount.java src\BankingManagementSystem.java
java -cp out BankingManagementSystem
```

If `javac` is not recognized, install a JDK and configure PATH.

## Demo
Create account 1001 for Asha with ₹5,000. Deposit ₹1,000, withdraw ₹500, and check the balance: ₹5,500.

## Limitation
This is an academic console prototype, not a real banking system. Data is held in memory and is cleared when the program exits. No real bank or payment service is connected.
