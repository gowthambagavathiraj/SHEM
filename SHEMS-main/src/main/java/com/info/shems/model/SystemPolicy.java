package com.info.shems.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_policies")
public class SystemPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String policyKey; // e.g., MAX_USER_WATTAGE, PEAK_HOUR_LIMIT

    @Column(nullable = false)
    private Double value;

    @Column(nullable = false)
    private String description;

    public SystemPolicy() {}

    public SystemPolicy(String policyKey, Double value, String description) {
        this.policyKey = policyKey;
        this.value = value;
        this.description = description;
    }

    // ===== Getters and Setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPolicyKey() { return policyKey; }
    public void setPolicyKey(String policyKey) { this.policyKey = policyKey; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
