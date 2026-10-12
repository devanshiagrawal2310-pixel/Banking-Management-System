import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Scanner;

public class BankingManagementSystem {
    private static final Scanner IN = new Scanner(System.in);
    private static final Map<String, BankAccount> ACCOUNTS = new LinkedHashMap<>();
    private static final double DAILY_LIMIT = 10000.0;

    public static void main(String[] args) {
        boolean running = true;
        System.out.println("=== BANKING MANAGEMENT SYSTEM ===");
        while (running) {
            System.out.println("\n1. Create Account\n2. Deposit Money\n3. Withdraw Money"
                    + "\n4. Check Balance\n5. Account Details\n6. Transaction History\n7. Exit");
            int choice = readInt("Choose: ");
            switch (choice) {
                case 1 -> createAccount();
                case 2 -> transact(true);
                case 3 -> transact(false);
                case 4 -> {
                    BankAccount a = findAccount();
                    if (a != null) System.out.printf("Balance: Rs. %.2f%n", a.getBalance());
                }
                case 5 -> { BankAccount a = findAccount(); if (a != null) a.displayDetails(); }
                case 6 -> { BankAccount a = findAccount(); if (a != null) a.displayTransactions(); }
                case 7 -> { running = false; System.out.println("Thank you!"); }
                default -> System.out.println("Invalid choice. Enter 1-7.");
            }
        }
        IN.close();
    }

    private static void createAccount() {
        String number = readText("Account number: ");
        if (ACCOUNTS.containsKey(number)) { System.out.println("Account already exists."); return; }
        String name = readText("Account holder name: ");
        double opening = readDouble("Opening balance (Rs.): ");
        try {
            BankAccount a = new BankAccount(number, name, opening, DAILY_LIMIT);
            ACCOUNTS.put(number, a);
            System.out.println("Account created successfully.");
            a.displayDetails();
        } catch (IllegalArgumentException e) { System.out.println(e.getMessage()); }
    }

    private static BankAccount findAccount() {
        String number = readText("Account number: ");
        BankAccount a = ACCOUNTS.get(number);
        if (a == null) System.out.println("Account not found.");
        return a;
    }

    private static void transact(boolean isDeposit) {
        BankAccount a = findAccount();
        if (a == null) return;
        double amount = readDouble(isDeposit ? "Deposit amount (Rs.): " : "Withdrawal amount (Rs.): ");
        if (isDeposit) a.deposit(amount); else a.withdraw(amount);
    }

    private static String readText(String prompt) {
        while (true) {
            System.out.print(prompt);
            String s = IN.nextLine().trim();
            if (!s.isEmpty()) return s;
            System.out.println("Cannot be empty.");
        }
    }
    private static int readInt(String prompt) {
        while (true) {
            System.out.print(prompt);
            try { return Integer.parseInt(IN.nextLine().trim()); }
            catch (NumberFormatException e) { System.out.println("Enter a whole number."); }
        }
    }
    private static double readDouble(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                double d = Double.parseDouble(IN.nextLine().trim());
                if (Double.isFinite(d)) return d;
            } catch (NumberFormatException ignored) {}
            System.out.println("Enter a valid amount.");
        }
    }
}
