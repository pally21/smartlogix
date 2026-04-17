package cl.smartlogix.service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/${serviceName}")
@CrossOrigin(origins = "*")
public class ServiceController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "${serviceName}"
        ));
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> process(@RequestBody Map<String, Object> request) {
        // Implementar lógica del servicio aquí
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Solicitud procesada",
            "data", request
        ));
    }
}
