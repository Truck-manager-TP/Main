package com.tptruck.fleet.marketing;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/marketing")
public class MarketingController {

    private final LeadRepository leadRepository;

    public MarketingController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @GetMapping("/leads")
    public List<Lead> list(@RequestParam(required = false) LeadStage stage) {
        return stage == null ? leadRepository.findAll() : leadRepository.findByStage(stage);
    }

    @PostMapping("/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public Lead capture(@Valid @RequestBody Lead lead) {
        return leadRepository.save(lead);
    }

    @PatchMapping("/leads/{id}/stage")
    public Lead advance(@PathVariable Long id, @RequestParam LeadStage stage) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Lead not found: " + id));
        lead.setStage(stage);
        return leadRepository.save(lead);
    }

    /** Simple funnel snapshot used by the Marketing Grafana dashboard. */
    @GetMapping("/funnel")
    public Map<LeadStage, Long> funnel() {
        Map<LeadStage, Long> funnel = new EnumMap<>(LeadStage.class);
        for (LeadStage stage : LeadStage.values()) {
            funnel.put(stage, leadRepository.countByStage(stage));
        }
        return funnel;
    }
}
