# Banking Management System — Java Mini Project

## Features
- Create bank accounts with validation
- Deposit and withdraw money with real-time balance calculations
- Daily withdrawal limit of ₹10,000 strictly enforced
- Balance inquiry and comprehensive account details
- Complete transaction history
- **Modern Dashboard Frontend**: Replicated from modern dark/light UI design with activity wave charts, spending bars, circular daily limit gauge, and ledger timeline.
- **Pure Java REST Backend**: Zero external dependencies using standard JDK `HttpServer`.

## Run Dashboard & Web UI (Recommended)
1. Double click [`run.bat`](file:///c:/Banking%20managemnt%20system/Banking-Management-System/run.bat) or run in terminal:
```bat
javac BankAccount.java BankingManagementSystem.java BankingWebServer.java
java BankingWebServer 8080
```
2. Open your browser to [http://localhost:8080](http://localhost:8080).

## Run Console CLI Mode
```bat
javac BankAccount.java BankingManagementSystem.java
java BankingManagementSystem
```
(You can also start the Web Server directly from Menu Option 7 in the CLI).

## Demo
Create account 1001 for Mariya / Asha with ₹5,000. Deposit ₹1,000, withdraw ₹500, and check the balance: ₹5,500. Daily withdrawal limit remaining: ₹9,500.
