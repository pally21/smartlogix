package cl.smartlogix.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BffController {

    private final WebClient webClient;

    @Value("${services.inventory.url:http://localhost:4001}")
    private String inventoryUrl;

    public BffController(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    @GetMapping("/products")
    public ResponseEntity<?> getProducts() {
        Object result = webClient.get()
            .uri(inventoryUrl + "/inventory/products")
            .retrieve()
            .bodyToMono(Object.class)
            .block();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "${serviceName}"
        ));
    }
}
