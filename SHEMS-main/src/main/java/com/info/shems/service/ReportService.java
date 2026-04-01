package com.info.shems.service;

import com.info.shems.model.Device;
import com.info.shems.model.EnergyUsage;
import com.info.shems.model.User;
import com.info.shems.repository.DeviceRepository;
import com.info.shems.repository.EnergyUsageRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private EnergyUsageRepository energyUsageRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    public byte[] generateEnergyReport(User user) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

            // ── Title ──────────────────────────────────────────────────────────
            document.add(new Paragraph("Smart Home Energy Management System")
                    .setFontSize(18).setBold());
            document.add(new Paragraph("Energy Consumption Report")
                    .setFontSize(13).setItalic().setFontColor(ColorConstants.DARK_GRAY));
            document.add(new Paragraph("Homeowner: " + user.getFullName()));
            document.add(new Paragraph("Generated: " + LocalDateTime.now().format(fmt)));
            document.add(new Paragraph(" "));

            // ── Section 1: Live Device Status ──────────────────────────────────
            document.add(new Paragraph("Current Device Status (Live)")
                    .setBold().setFontSize(13).setMarginTop(10));

            List<Device> devices = deviceRepository.findByUser(user);

            if (devices.isEmpty()) {
                document.add(new Paragraph("No devices registered yet.").setItalic());
            } else {
                Table deviceTable = new Table(UnitValue.createPercentArray(new float[]{4, 2, 3, 3}))
                        .useAllAvailableWidth();

                // Header row
                for (String h : new String[]{"Device Name", "Type", "Status", "Current Power (W)"}) {
                    deviceTable.addHeaderCell(new Cell().add(new Paragraph(h).setBold())
                            .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                }

                double totalPowerW = 0;
                for (Device d : devices) {
                    boolean isOn = "ON".equalsIgnoreCase(d.getStatus());
                    double pwr = isOn ? (d.getCurrentPower() != null ? d.getCurrentPower() : d.getPowerRating() * 0.8) : 0.0;
                    totalPowerW += pwr;

                    deviceTable.addCell(d.getName());
                    deviceTable.addCell(d.getType().name().replace("_", " "));
                    Cell statusCell = new Cell().add(new Paragraph(d.getStatus()));
                    if (isOn) statusCell.setFontColor(ColorConstants.GREEN);
                    else statusCell.setFontColor(ColorConstants.RED);
                    deviceTable.addCell(statusCell);
                    deviceTable.addCell(String.format("%.1f W", pwr));
                }
                document.add(deviceTable);

                long onCount = devices.stream().filter(d -> "ON".equalsIgnoreCase(d.getStatus())).count();
                document.add(new Paragraph(String.format(
                        "Total Live Consumption: %.2f kW  |  Active Devices: %d of %d",
                        totalPowerW / 1000.0, onCount, devices.size()))
                        .setBold().setMarginTop(6).setMarginBottom(15));
            }

            // ── Section 2: Energy History (last 30 days) ───────────────────────
            document.add(new Paragraph("Historical Energy Consumption (Last 30 Days)")
                    .setBold().setFontSize(13).setMarginTop(10));

            List<EnergyUsage> logs = energyUsageRepository.findByUserAndTimestampBetween(
                    user, LocalDateTime.now().minusMonths(1), LocalDateTime.now());

            if (logs.isEmpty()) {
                document.add(new Paragraph(
                        "No historical logs found. Logs are written when telemetry data arrives from devices.")
                        .setItalic().setFontColor(ColorConstants.DARK_GRAY));
            } else {
                // Group by device
                Map<String, Double> byDevice = new LinkedHashMap<>();
                Map<String, Double> costByDevice = new LinkedHashMap<>();
                for (EnergyUsage u : logs) {
                    String name = u.getDevice().getName();
                    byDevice.merge(name, u.getConsumption() / 1000.0, Double::sum);
                    costByDevice.merge(name, u.getCost() != null ? u.getCost() : 0.0, Double::sum);
                }

                Table histTable = new Table(UnitValue.createPercentArray(new float[]{4, 3, 3}))
                        .useAllAvailableWidth();
                for (String h : new String[]{"Device", "Total Consumption (kWh)", "Est. Cost (₹)"}) {
                    histTable.addHeaderCell(new Cell().add(new Paragraph(h).setBold())
                            .setBackgroundColor(ColorConstants.LIGHT_GRAY));
                }
                double grandKwh = 0, grandCost = 0;
                for (String name : byDevice.keySet()) {
                    double kwh = byDevice.get(name);
                    double cost = costByDevice.getOrDefault(name, 0.0);
                    histTable.addCell(name);
                    histTable.addCell(String.format("%.3f", kwh));
                    histTable.addCell(String.format("₹%.2f", cost));
                    grandKwh += kwh;
                    grandCost += cost;
                }
                document.add(histTable);
                document.add(new Paragraph(String.format(
                        "Grand Total: %.3f kWh  |  Total Estimated Cost: ₹%.2f", grandKwh, grandCost))
                        .setBold().setMarginTop(6));
            }

            // ── Section 3: Energy Saving Tips ─────────────────────────────────
            document.add(new Paragraph("\nEnergy Saving Recommendations")
                    .setBold().setFontSize(13).setMarginTop(15));
            String[] tips = {
                "Run laundry after 10 PM to take advantage of off-peak electricity rates.",
                "Lower your AC thermostat by 1°C to reduce energy usage by up to 6%.",
                "Replace old incandescent bulbs with LEDs to cut lighting costs by 80%.",
                "Unplug device chargers when not in use to avoid phantom power drain.",
                "Consider scheduling high-power appliances (EV charger, water heater) to off-peak hours."
            };
            for (String tip : tips) {
                document.add(new Paragraph("• " + tip).setFontSize(10).setMarginBottom(4));
            }

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}
