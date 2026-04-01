package com.info.shems.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "energy_usage")
public class EnergyUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double consumption; // Energy consumed in Watt-hours (Wh) for the period

    @Column(nullable = false)
    private Double cost; // Calculated cost for this consumption

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public EnergyUsage() {}

    public EnergyUsage(Device device, User user, Double consumption, Double cost, LocalDateTime timestamp) {
        this.device = device;
        this.user = user;
        this.consumption = consumption;
        this.cost = cost;
        this.timestamp = timestamp;
    }

    // ===== Getters and Setters =====

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Double getConsumption() { return consumption; }
    public void setConsumption(Double consumption) { this.consumption = consumption; }

    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
