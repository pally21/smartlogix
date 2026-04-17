package cl.smartlogix.service.controller;

import cl.smartlogix.service.model.${entityName};
import cl.smartlogix.service.repository.${entityName}Repository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/${serviceName}/${entityName?lower_case}s")
@CrossOrigin(origins = "*")
public class ${entityName}Controller {

    private final ${entityName}Repository repository;

    public ${entityName}Controller(${entityName}Repository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> findAll() {
        List<${entityName}> items = repository.findAll();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", items,
            "count", items.size()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> findById(@PathVariable UUID id) {
        return repository.findById(id)
            .map(item -> ResponseEntity.ok(Map.of("success", true, "data", item)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody ${entityName} item) {
        ${entityName} saved = repository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("success", true, "data", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable UUID id,
                                                       @Valid @RequestBody ${entityName} item) {
        return repository.findById(id).map(existing -> {
            existing.setName(item.getName());
            existing.setDescription(item.getDescription());
            return ResponseEntity.ok(Map.of("success", true, "data", repository.save(existing)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "${serviceName}"));
    }
}
