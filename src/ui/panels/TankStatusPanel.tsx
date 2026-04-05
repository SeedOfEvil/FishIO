import { useGameStore } from "@/store/useGameStore";
import { useTankCleanliness, useFishCount } from "@/store/selectors";
import { getCleanlinessLabel } from "@/domain/tank/cleanliness";

export function TankStatusPanel() {
	const cleanliness = useTankCleanliness();
	const fishCount = useFishCount();
	const dirtySpotCount = useGameStore((s) => s.tank.dirtySpots.length);
	const eggCount = useGameStore((s) => s.eggs.length);

	return (
		<div className="panel tank-status-panel">
			<h3>Tank Status</h3>
			<div className="status-row">
				<span>Cleanliness</span>
				<span>{getCleanlinessLabel(cleanliness)} ({Math.round(cleanliness)}%)</span>
			</div>
			<div className="status-row">
				<span>Fish</span>
				<span>{fishCount}</span>
			</div>
			<div className="status-row">
				<span>Dirty spots</span>
				<span>{dirtySpotCount}</span>
			</div>
			<div className="status-row">
				<span>Eggs</span>
				<span>{eggCount}</span>
			</div>
		</div>
	);
}
