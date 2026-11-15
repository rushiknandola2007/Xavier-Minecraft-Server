package com.panel.bridge;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.entity.Player;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.PlayerInventory;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class BridgePlugin extends JavaPlugin {

    private HttpServer httpServer;
    private String configuredSecret;
    private final Gson gson = new Gson();

    @Override
    public void onEnable() {
        // Setup configuration defaults
        getConfig().addDefault("secret", "secret123");
        getConfig().addDefault("port", 8081);
        getConfig().options().copyDefaults(true);
        saveConfig();

        configuredSecret = getConfig().getString("secret", "secret123");
        int port = getConfig().getInt("port", 8081);

        try {
            startHttpServer(port);
            getLogger().info("ServerPanelBridge HTTP server listening on 127.0.0.1:" + port);
        } catch (IOException e) {
            getLogger().severe("Failed to start embedded HTTP server: " + e.getMessage());
        }
    }

    @Override
    public void onDisable() {
        if (httpServer != null) {
            httpServer.stop(0);
            getLogger().info("ServerPanelBridge HTTP server stopped.");
        }
    }

    private void startHttpServer(int port) throws IOException {
        httpServer = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        httpServer.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        httpServer.createContext("/player/", new PlayerRequestHandler());
        httpServer.start();
    }

    private class PlayerRequestHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Apply CORS headers to all responses
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, X-Bridge-Secret");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            // Verify X-Bridge-Secret header
            String secretHeader = exchange.getRequestHeaders().getFirst("X-Bridge-Secret");
            if (secretHeader == null || !secretHeader.equals(configuredSecret)) {
                sendJsonResponse(exchange, 401, "{\"error\":\"Unauthorized: Invalid or missing X-Bridge-Secret\"}");
                return;
            }

            String path = exchange.getRequestURI().getPath();
            String[] segments = Arrays.stream(path.split("/"))
                    .filter(s -> !s.isEmpty())
                    .toArray(String[]::new);

            // Path must have at least /player/{name}
            if (segments.length < 2 || !segments[0].equalsIgnoreCase("player")) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Invalid endpoint route\"}");
                return;
            }

            String playerName = segments[1];
            String subAction = segments.length > 2 ? segments[2].toLowerCase() : "";
            String method = exchange.getRequestMethod();

            if ("GET".equalsIgnoreCase(method) && subAction.isEmpty()) {
                handleGetPlayer(exchange, playerName);
            } else if ("POST".equalsIgnoreCase(method) && "move".equals(subAction)) {
                handleMoveItem(exchange, playerName);
            } else if ("POST".equalsIgnoreCase(method) && "item".equals(subAction)) {
                handleModifyItem(exchange, playerName);
            } else {
                sendJsonResponse(exchange, 404, "{\"error\":\"Resource or method not found\"}");
            }
        }
    }

    private void handleGetPlayer(HttpExchange exchange, String playerName) throws IOException {
        CompletableFuture<ResponseResult> future = new CompletableFuture<>();

        Bukkit.getScheduler().runTask(this, () -> {
            try {
                Player player = Bukkit.getPlayerExact(playerName);
                if (player == null || !player.isOnline()) {
                    future.complete(new ResponseResult(404, "{\"error\":\"Player not found or offline\"}"));
                    return;
                }

                JsonObject root = new JsonObject();
                root.addProperty("name", player.getName());
                root.addProperty("uuid", player.getUniqueId().toString());
                root.addProperty("health", player.getHealth());

                AttributeInstance maxHealthAttr = player.getAttribute(Attribute.GENERIC_MAX_HEALTH);
                root.addProperty("maxHealth", maxHealthAttr != null ? maxHealthAttr.getValue() : 20.0);
                root.addProperty("foodLevel", player.getFoodLevel());
                root.addProperty("gamemode", player.getGameMode().name());

                JsonObject loc = new JsonObject();
                loc.addProperty("world", player.getWorld().getName());
                loc.addProperty("x", Math.round(player.getLocation().getX() * 100.0) / 100.0);
                loc.addProperty("y", Math.round(player.getLocation().getY() * 100.0) / 100.0);
                loc.addProperty("z", Math.round(player.getLocation().getZ() * 100.0) / 100.0);
                root.add("location", loc);

                // Inventory slots 0-40 (0-8 hotbar, 9-35 main, 36-39 armor, 40 offhand)
                PlayerInventory inv = player.getInventory();
                JsonArray invArray = new JsonArray();
                for (int slot = 0; slot <= 40; slot++) {
                    ItemStack item = inv.getItem(slot);
                    invArray.add(serializeSlot(slot, item));
                }
                root.add("inventory", invArray);

                // Ender chest slots 0-26
                Inventory ender = player.getEnderChest();
                JsonArray enderArray = new JsonArray();
                for (int slot = 0; slot < 27; slot++) {
                    ItemStack item = ender.getItem(slot);
                    enderArray.add(serializeSlot(slot, item));
                }
                root.add("enderchest", enderArray);

                future.complete(new ResponseResult(200, gson.toJson(root)));
            } catch (Exception e) {
                future.complete(new ResponseResult(500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}"));
            }
        });

        awaitAndRespond(exchange, future);
    }

    private void handleMoveItem(HttpExchange exchange, String playerName) throws IOException {
        String body = readRequestBody(exchange);
        CompletableFuture<ResponseResult> future = new CompletableFuture<>();

        Bukkit.getScheduler().runTask(this, () -> {
            try {
                Player player = Bukkit.getPlayerExact(playerName);
                if (player == null || !player.isOnline()) {
                    future.complete(new ResponseResult(404, "{\"error\":\"Player not found or offline\"}"));
                    return;
                }

                JsonObject json = JsonParser.parseString(body).getAsJsonObject();
                String fromType = json.has("fromType") ? json.get("fromType").getAsString() : "inv";
                int fromSlot = json.get("fromSlot").getAsInt();
                String toType = json.has("toType") ? json.get("toType").getAsString() : "inv";
                int toSlot = json.get("toSlot").getAsInt();

                Inventory fromInv = "ender".equalsIgnoreCase(fromType) ? player.getEnderChest() : player.getInventory();
                Inventory toInv = "ender".equalsIgnoreCase(toType) ? player.getEnderChest() : player.getInventory();

                int maxFrom = "ender".equalsIgnoreCase(fromType) ? 27 : 41;
                int maxTo = "ender".equalsIgnoreCase(toType) ? 27 : 41;

                if (fromSlot < 0 || fromSlot >= maxFrom || toSlot < 0 || toSlot >= maxTo) {
                    future.complete(new ResponseResult(400, "{\"error\":\"Slot index out of range\"}"));
                    return;
                }

                ItemStack fromItem = fromInv.getItem(fromSlot);
                ItemStack toItem = toInv.getItem(toSlot);

                fromInv.setItem(fromSlot, toItem != null ? toItem.clone() : null);
                toInv.setItem(toSlot, fromItem != null ? fromItem.clone() : null);

                player.updateInventory();
                future.complete(new ResponseResult(200, "{\"success\":true,\"message\":\"Item moved successfully\"}"));
            } catch (Exception e) {
                future.complete(new ResponseResult(500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}"));
            }
        });

        awaitAndRespond(exchange, future);
    }

    private void handleModifyItem(HttpExchange exchange, String playerName) throws IOException {
        String body = readRequestBody(exchange);
        CompletableFuture<ResponseResult> future = new CompletableFuture<>();

        Bukkit.getScheduler().runTask(this, () -> {
            try {
                Player player = Bukkit.getPlayerExact(playerName);
                if (player == null || !player.isOnline()) {
                    future.complete(new ResponseResult(404, "{\"error\":\"Player not found or offline\"}"));
                    return;
                }

                JsonObject json = JsonParser.parseString(body).getAsJsonObject();
                String action = json.has("action") ? json.get("action").getAsString() : null;
                String type = json.has("type") ? json.get("type").getAsString() : "inv";
                JsonElement slotElem = json.get("slot");
                Integer slot = (slotElem != null && !slotElem.isJsonNull()) ? slotElem.getAsInt() : null;
                String matName = json.has("material") ? json.get("material").getAsString() : null;
                int amount = json.has("amount") ? json.get("amount").getAsInt() : 1;
                boolean clear = json.has("clear") && json.get("clear").getAsBoolean();

                Inventory targetInv = "ender".equalsIgnoreCase(type) ? player.getEnderChest() : player.getInventory();

                // Give item action
                if ("give".equalsIgnoreCase(action) || slot == null) {
                    if (matName == null || matName.trim().isEmpty()) {
                        future.complete(new ResponseResult(400, "{\"error\":\"Material name required to give item\"}"));
                        return;
                    }
                    Material mat = resolveMaterial(matName);
                    if (mat == null || mat.isAir()) {
                        future.complete(new ResponseResult(400, "{\"error\":\"Invalid material: " + matName + "\"}"));
                        return;
                    }
                    ItemStack giveItem = new ItemStack(mat, Math.max(1, amount));
                    player.getInventory().addItem(giveItem);
                    player.updateInventory();
                    future.complete(new ResponseResult(200, "{\"success\":true,\"message\":\"Given item to player\"}"));
                    return;
                }

                int maxSlot = "ender".equalsIgnoreCase(type) ? 27 : 41;
                if (slot < 0 || slot >= maxSlot) {
                    future.complete(new ResponseResult(400, "{\"error\":\"Slot index out of range: " + slot + "\"}"));
                    return;
                }

                // Clear slot action
                if (clear || (matName != null && isAirName(matName)) || amount <= 0) {
                    targetInv.setItem(slot, null);
                    player.updateInventory();
                    future.complete(new ResponseResult(200, "{\"success\":true,\"message\":\"Slot cleared\"}"));
                    return;
                }

                // Set new item in slot
                if (matName != null) {
                    Material mat = resolveMaterial(matName);
                    if (mat == null) {
                        future.complete(new ResponseResult(400, "{\"error\":\"Invalid material: " + matName + "\"}"));
                        return;
                    }
                    ItemStack newItem = new ItemStack(mat, Math.max(1, amount));
                    targetInv.setItem(slot, newItem);
                    player.updateInventory();
                    future.complete(new ResponseResult(200, "{\"success\":true,\"message\":\"Slot set to " + mat.getKey().toString() + "\"}"));
                    return;
                }

                // Update count of existing item in slot
                ItemStack existing = targetInv.getItem(slot);
                if (existing != null && !existing.getType().isAir()) {
                    existing.setAmount(amount);
                    targetInv.setItem(slot, existing);
                    player.updateInventory();
                    future.complete(new ResponseResult(200, "{\"success\":true,\"message\":\"Slot amount updated\"}"));
                } else {
                    future.complete(new ResponseResult(400, "{\"error\":\"Cannot update amount on empty slot without material\"}"));
                }
            } catch (Exception e) {
                future.complete(new ResponseResult(500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}"));
            }
        });

        awaitAndRespond(exchange, future);
    }

    private JsonObject serializeSlot(int slotIndex, ItemStack item) {
        JsonObject obj = new JsonObject();
        obj.addProperty("slot", slotIndex);

        if (item == null || item.getType().isAir()) {
            obj.addProperty("material", "minecraft:air");
            obj.addProperty("amount", 0);
            obj.add("displayName", JsonNull.INSTANCE);
        } else {
            obj.addProperty("material", item.getType().getKey().toString());
            obj.addProperty("amount", item.getAmount());

            if (item.hasItemMeta() && item.getItemMeta().hasDisplayName()) {
                obj.addProperty("displayName", item.getItemMeta().getDisplayName());
            } else {
                obj.add("displayName", JsonNull.INSTANCE);
            }

            Map<Enchantment, Integer> enchants = item.getEnchantments();
            if (enchants != null && !enchants.isEmpty()) {
                JsonObject enchObj = new JsonObject();
                for (Map.Entry<Enchantment, Integer> entry : enchants.entrySet()) {
                    enchObj.addProperty(entry.getKey().getKey().toString(), entry.getValue());
                }
                obj.add("enchantments", enchObj);
            }
        }
        return obj;
    }

    private Material resolveMaterial(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String name = input.trim();
        if (name.toLowerCase().startsWith("minecraft:")) {
            name = name.substring("minecraft:".length());
        }

        Material mat = Material.matchMaterial(name);
        if (mat == null) {
            mat = Material.matchMaterial(name.toUpperCase());
        }
        if (mat == null) {
            try {
                mat = Material.valueOf(name.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return mat;
    }

    private boolean isAirName(String matName) {
        String lower = matName.trim().toLowerCase();
        return "air".equals(lower) || "minecraft:air".equals(lower);
    }

    private void awaitAndRespond(HttpExchange exchange, CompletableFuture<ResponseResult> future) throws IOException {
        try {
            ResponseResult res = future.get(5, TimeUnit.SECONDS);
            sendJsonResponse(exchange, res.status, res.body);
        } catch (Exception e) {
            sendJsonResponse(exchange, 500, "{\"error\":\"Request timed out or failed: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String readRequestBody(HttpExchange exchange) {
        try (InputStream is = exchange.getRequestBody();
             Scanner scanner = new Scanner(is, StandardCharsets.UTF_8)) {
            scanner.useDelimiter("\\A");
            return scanner.hasNext() ? scanner.next() : "";
        } catch (IOException e) {
            return "";
        }
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private record ResponseResult(int status, String body) {}
}
