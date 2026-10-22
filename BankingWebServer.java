import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BankingWebServer {
    private static final int DEFAULT_PORT = 8080;
    private static final Path WEB_DIR = Paths.get("web");

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        BankingManagementSystem.seedDemoDataIfEmpty();

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // API routes
        server.createContext("/api/status", new StatusHandler());
        server.createContext("/api/accounts", new AccountsHandler());
        server.createContext("/api/account", new SingleAccountHandler());
        server.createContext("/api/deposit", new DepositHandler());
        server.createContext("/api/withdraw", new WithdrawHandler());
        server.createContext("/api/transactions", new TransactionsHandler());

        // Static files route
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // creates a default executor
        server.start();

        System.out.println("==================================================");
        System.out.println("  NeoBank Management System - Web Server Started  ");
        System.out.println("==================================================");
        System.out.println("  URL: http://localhost:" + port + "/");
        System.out.println("  API: http://localhost:" + port + "/api/accounts");
        System.out.println("  Press Ctrl+C to stop the server.");
        System.out.println("==================================================");
    }

    // --- Static File Handler ---
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            // Clean path and prevent directory traversal
            path = path.replace("\\", "/");
            if (path.contains("..")) {
                sendResponse(exchange, 403, "Access denied", "text/plain");
                return;
            }

            if (path.startsWith("/")) path = path.substring(1);
            Path filePath = WEB_DIR.resolve(path);

            if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
                // Try relative to root directory as fallback
                filePath = Paths.get(path);
            }

            if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
                sendResponse(exchange, 404, "404 Not Found: " + path, "text/plain");
                return;
            }

            String mime = getMimeType(filePath.toString());
            byte[] bytes = Files.readAllBytes(filePath);

            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Content-Type", mime);
            exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // --- API Handlers ---
    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            Map<String, BankAccount> accounts = BankingManagementSystem.getAccounts();
            String json = "{\"status\":\"online\",\"system\":\"Banking Management System\",\"accountsCount\":"
                    + accounts.size() + ",\"dailyLimit\":" + BankingManagementSystem.getDailyLimit() + "}";
            sendResponse(exchange, 200, json, "application/json");
        }
    }

    static class AccountsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            String method = exchange.getRequestMethod().toUpperCase();
            if ("GET".equals(method)) {
                Map<String, BankAccount> accounts = BankingManagementSystem.getAccounts();
                StringBuilder sb = new StringBuilder();
                sb.append("[");
                int i = 0;
                for (BankAccount a : accounts.values()) {
                    if (i > 0) sb.append(",");
                    sb.append(accountToJson(a));
                    i++;
                }
                sb.append("]");
                sendResponse(exchange, 200, sb.toString(), "application/json");
            } else if ("POST".equals(method)) {
                String body = readBody(exchange);
                String number = parseJsonString(body, "accountNumber");
                String name = parseJsonString(body, "accountHolder");
                Double opening = parseJsonDouble(body, "openingBalance");

                if (number == null || number.trim().isEmpty() || name == null || name.trim().isEmpty()) {
                    sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Account number and holder name are required.\"}", "application/json");
                    return;
                }
                if (opening == null || opening < 0) {
                    sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Opening balance must be 0 or greater.\"}", "application/json");
                    return;
                }

                number = number.trim();
                name = name.trim();

                try {
                    BankAccount a = BankingManagementSystem.createAccountDirect(number, name, opening);
                    String resp = "{\"success\":true,\"message\":\"Account created successfully.\",\"account\":" + accountToJson(a) + "}";
                    sendResponse(exchange, 201, resp, "application/json");
                } catch (IllegalArgumentException e) {
                    sendResponse(exchange, 400, "{\"success\":false,\"message\":\"" + escapeJson(e.getMessage()) + "\"}", "application/json");
                }
            } else {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}", "application/json");
            }
        }
    }

    static class SingleAccountHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());
            String number = query.get("number");
            if (number == null || number.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Account number query parameter is required.\"}", "application/json");
                return;
            }

            BankAccount a = BankingManagementSystem.getAccounts().get(number.trim());
            if (a == null) {
                sendResponse(exchange, 404, "{\"success\":false,\"message\":\"Account not found.\"}", "application/json");
                return;
            }

            String resp = "{\"success\":true,\"account\":" + accountToJson(a) + "}";
            sendResponse(exchange, 200, resp, "application/json");
        }
    }

    static class DepositHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}", "application/json");
                return;
            }

            String body = readBody(exchange);
            String number = parseJsonString(body, "accountNumber");
            Double amount = parseJsonDouble(body, "amount");

            if (number == null || number.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Account number is required.\"}", "application/json");
                return;
            }
            if (amount == null || amount <= 0) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Amount must be greater than zero.\"}", "application/json");
                return;
            }

            BankAccount a = BankingManagementSystem.getAccounts().get(number.trim());
            if (a == null) {
                sendResponse(exchange, 404, "{\"success\":false,\"message\":\"Account not found.\"}", "application/json");
                return;
            }

            boolean ok = a.deposit(amount);
            if (ok) {
                String resp = "{\"success\":true,\"message\":\"Deposit of Rs. " + String.format("%.2f", amount)
                        + " successful.\",\"balance\":" + a.getBalance() + ",\"account\":" + accountToJson(a) + "}";
                sendResponse(exchange, 200, resp, "application/json");
            } else {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Deposit failed. Amount must be greater than zero.\"}", "application/json");
            }
        }
    }

    static class WithdrawHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}", "application/json");
                return;
            }

            String body = readBody(exchange);
            String number = parseJsonString(body, "accountNumber");
            Double amount = parseJsonDouble(body, "amount");

            if (number == null || number.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Account number is required.\"}", "application/json");
                return;
            }
            if (amount == null || amount <= 0) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Amount must be greater than zero.\"}", "application/json");
                return;
            }

            BankAccount a = BankingManagementSystem.getAccounts().get(number.trim());
            if (a == null) {
                sendResponse(exchange, 404, "{\"success\":false,\"message\":\"Account not found.\"}", "application/json");
                return;
            }

            if (amount > a.getBalance()) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Insufficient balance. Current balance is Rs. " + String.format("%.2f", a.getBalance()) + "\"}", "application/json");
                return;
            }

            if (a.getWithdrawnToday() + amount > a.getDailyWithdrawalLimit()) {
                double remaining = a.getRemainingLimit();
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Daily withdrawal limit exceeded (Limit: Rs. " + String.format("%.2f", a.getDailyWithdrawalLimit()) + "). Remaining limit today: Rs. " + String.format("%.2f", remaining) + "\"}", "application/json");
                return;
            }

            boolean ok = a.withdraw(amount);
            if (ok) {
                String resp = "{\"success\":true,\"message\":\"Withdrawal of Rs. " + String.format("%.2f", amount)
                        + " successful.\",\"balance\":" + a.getBalance() + ",\"account\":" + accountToJson(a) + "}";
                sendResponse(exchange, 200, resp, "application/json");
            } else {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Withdrawal failed.\"}", "application/json");
            }
        }
    }

    static class TransactionsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());
            String number = query.get("number");
            if (number == null || number.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"success\":false,\"message\":\"Account number query parameter is required.\"}", "application/json");
                return;
            }

            BankAccount a = BankingManagementSystem.getAccounts().get(number.trim());
            if (a == null) {
                sendResponse(exchange, 404, "{\"success\":false,\"message\":\"Account not found.\"}", "application/json");
                return;
            }

            StringBuilder sb = new StringBuilder();
            sb.append("{\"success\":true,\"accountNumber\":\"").append(escapeJson(a.getAccountNumber())).append("\",\"transactions\":[");
            List<String> list = a.getTransactions();
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(escapeJson(list.get(i))).append("\"");
            }
            sb.append("]}");
            sendResponse(exchange, 200, sb.toString(), "application/json");
        }
    }

    // --- Helpers ---
    private static void sendCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Accept");
        exchange.sendResponseHeaders(204, -1);
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String content, String mime) throws IOException {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Content-Type", mime + "; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int n;
            while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
            return bos.toString(StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                try {
                    map.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                            URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
                } catch (Exception ignored) {}
            }
        }
        return map;
    }

    private static String parseJsonString(String json, String key) {
        if (json == null) return null;
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);
        return null;
    }

    private static Double parseJsonDouble(String json, String key) {
        if (json == null) return null;
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)");
        Matcher m = p.matcher(json);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (Exception ignored) {}
        }
        String s = parseJsonString(json, key);
        if (s != null) {
            try { return Double.parseDouble(s); } catch (Exception ignored) {}
        }
        return null;
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String accountToJson(BankAccount a) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"accountNumber\":\"").append(escapeJson(a.getAccountNumber())).append("\",");
        sb.append("\"accountHolder\":\"").append(escapeJson(a.getAccountHolder())).append("\",");
        sb.append("\"balance\":").append(a.getBalance()).append(",");
        sb.append("\"dailyWithdrawalLimit\":").append(a.getDailyWithdrawalLimit()).append(",");
        sb.append("\"withdrawnToday\":").append(a.getWithdrawnToday()).append(",");
        sb.append("\"remainingLimit\":").append(a.getRemainingLimit()).append(",");
        sb.append("\"transactionCount\":").append(a.getTransactions().size()).append(",");
        sb.append("\"transactions\":[");
        List<String> txs = a.getTransactions();
        for (int i = 0; i < txs.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(txs.get(i))).append("\"");
        }
        sb.append("]}");
        return sb.toString();
    }

    private static String getMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }
}
