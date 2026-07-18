package com.tptruck.fleet.marketing;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * A prospective client/partner captured by the Marketing &amp; Growth module
 * for onboarding into the logistics platform.
 */
@Entity
@Table(name = "lead")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "company_name", nullable = false)
    private String companyName;

    @NotBlank
    @Column(name = "contact_name", nullable = false)
    private String contactName;

    @Email
    @NotBlank
    @Column(nullable = false)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String channel;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadStage stage = LeadStage.NEW;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Lead() {
    }

    public Lead(String companyName, String contactName, String email, String channel) {
        this.companyName = companyName;
        this.contactName = contactName;
        this.email = email;
        this.channel = channel;
        this.stage = LeadStage.NEW;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public LeadStage getStage() {
        return stage;
    }

    public void setStage(LeadStage stage) {
        this.stage = stage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
