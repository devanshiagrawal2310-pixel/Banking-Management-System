import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BankAccount {
    private final String accountNumber, accountHolder;
    private double balance, withdrawnToday;
    private LocalDate withdrawalDate = LocalDate.now();
    private final double dailyWithdrawalLimit;
    private final List<String> transactions = new ArrayList<>();

    public BankAccount(String number, String holder, double openingBalance, double dailyLimit) {
        if (number == null || number.trim().isEmpty() || holder == null || holder.trim().isEmpty())
            throw new IllegalArgumentException("Account number and holder name are required.");
        if (openingBalance < 0 || dailyLimit <= 0)
            throw new IllegalArgumentException("Invalid opening balance or daily limit.");
        accountNumber = number.trim();
        accountHolder = holder.trim();
        balance = openingBalance;
        dailyWithdrawalLimit = dailyLimit;
        transactions.add("Account opened: " + money(openingBalance));
    }

    public String getAccountNumber() { return accountNumber; }
    public String getAccountHolder() { return accountHolder; }
    public double getBalance() { return balance; }
    public double getDailyWithdrawalLimit() { return dailyWithdrawalLimit; }
    public double getWithdrawnToday() { resetDailyLimit(); return withdrawnToday; }
    public double getRemainingLimit() { resetDailyLimit(); return Math.max(0, dailyWithdrawalLimit - withdrawnToday); }
    public List<String> getTransactions() { return new ArrayList<>(transactions); }
    public LocalDate getWithdrawalDate() { return withdrawalDate; }

    public boolean deposit(double amount) {
        if (amount <= 0) { System.out.println("Amount must be greater than zero."); return false; }
        balance += amount;
        transactions.add("Deposit +" + money(amount) + " | Balance " + money(balance));
        System.out.println("Deposit successful. Balance: " + money(balance));
        return true;
    }

    public boolean withdraw(double amount) {
        resetDailyLimit();
        if (amount <= 0) { System.out.println("Amount must be greater than zero."); return false; }
        if (amount > balance) { System.out.println("Insufficient balance."); return false; }
        if (withdrawnToday + amount > dailyWithdrawalLimit) {
            System.out.println("Daily withdrawal limit exceeded. Remaining: " + money(dailyWithdrawalLimit - withdrawnToday));
            return false;
        }
        balance -= amount;
        withdrawnToday += amount;
        transactions.add("Withdrawal -" + money(amount) + " | Balance " + money(balance));
        System.out.println("Withdrawal successful. Balance: " + money(balance));
        return true;
    }

    public void displayDetails() {
        resetDailyLimit();
        System.out.println("\nAccount number: " + accountNumber);
        System.out.println("Account holder: " + accountHolder);
        System.out.println("Balance: " + money(balance));
        System.out.println("Daily withdrawal limit: " + money(dailyWithdrawalLimit));
        System.out.println("Withdrawn today: " + money(withdrawnToday));
    }

    public void displayTransactions() {
        System.out.println("\nTransaction History");
        for (String t : transactions) System.out.println(t);
    }

    private void resetDailyLimit() {
        if (!LocalDate.now().equals(withdrawalDate)) {
            withdrawalDate = LocalDate.now();
            withdrawnToday = 0;
        }
    }
    private String money(double amount) { return String.format("Rs. %.2f", amount); }
}
