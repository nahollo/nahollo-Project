package com.nahollo.homelab.status;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.FileSystem;
import oshi.software.os.OSFileStore;
import oshi.software.os.OperatingSystem;

import org.springframework.stereotype.Service;

@Service
public class SystemMetricsService {

	private final HardwareAbstractionLayer hardware = new SystemInfo().getHardware();
	private final OperatingSystem operatingSystem = new SystemInfo().getOperatingSystem();
	private long[] previousCpuTicks = hardware.getProcessor().getSystemCpuLoadTicks();

	public synchronized SystemStatusResponse readSystemStatus() {
		CentralProcessor processor = hardware.getProcessor();
		GlobalMemory memory = hardware.getMemory();
		FileSystem fileSystem = operatingSystem.getFileSystem();

		double cpu = clamp(processor.getSystemCpuLoadBetweenTicks(previousCpuTicks) * 100.0d);
		previousCpuTicks = processor.getSystemCpuLoadTicks();

		double ram = memory.getTotal() == 0
			? 0.0d
			: clamp(((double) (memory.getTotal() - memory.getAvailable()) / memory.getTotal()) * 100.0d);

		long totalDiskSpace = 0L;
		long usedDiskSpace = 0L;
		for (OSFileStore store : fileSystem.getFileStores()) {
			totalDiskSpace += Math.max(store.getTotalSpace(), 0L);
			usedDiskSpace += Math.max(store.getTotalSpace() - store.getUsableSpace(), 0L);
		}

		double disk = totalDiskSpace == 0
			? 0.0d
			: clamp(((double) usedDiskSpace / totalDiskSpace) * 100.0d);

		double temperature = hardware.getSensors().getCpuTemperature();
		Double safeTemperature = temperature > 0.0d ? Math.round(temperature * 10.0d) / 10.0d : null;

		return new SystemStatusResponse(
			round(cpu),
			round(ram),
			round(disk),
			safeTemperature
		);
	}

	public long readUptimeSeconds() {
		return Math.max(operatingSystem.getSystemUptime(), 0L);
	}

	private double round(double value) {
		return Math.round(value * 10.0d) / 10.0d;
	}

	private double clamp(double value) {
		if (Double.isNaN(value) || Double.isInfinite(value)) {
			return 0.0d;
		}

		return Math.min(100.0d, Math.max(0.0d, value));
	}
}
