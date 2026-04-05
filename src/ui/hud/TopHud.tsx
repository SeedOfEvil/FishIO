import { useGameStore } from "@/store/useGameStore";
import { useTankCleanliness, useFishCount, useAverageHappiness } from "@/store/selectors";
import { formatTime } from "@/domain/time/realtimeClock";
import { getCleanlinessLabel, getCleanlinessColor } from "@/domain/tank/cleanliness";
import { useIsNight } from "@/store/selectors";

export function TopHud() {
	const currentHour = useGameStore((s) => s.currentHour);
	const currentMinute = useGameStore((s) => s.currentMinute);
	const gold = useGameStore((s) => s.gold);
	const cleanliness = useTankCleanliness();
	const fishCount = useFishCount();
	const avgHappiness = useAverageHappiness();
	const isNight = useIsNight();
	const foodCount = useGameStore((s) => s.foodPellets.length);

	return (
		<div className="top-hud">
			<div className="hud-item">
				<span className="hud-label">{isNight ? "Night" : "Day"}</span>
				<span className="hud-value">{formatTime(currentHour, currentMinute)}</span>
			</div>
			<div className="hud-item">
				<span className="hud-label">Tank</span>
				<span className="hud-value" style={{ color: getCleanlinessColor(cleanliness) }}>
					{getCleanlinessLabel(cleanliness)}
				</span>
			</div>
			<div className="hud-item">
				<span className="hud-label">Fish</span>
				<span className="hud-value">{fishCount}</span>
			</div>
			<div className="hud-item">
				<span className="hud-label">Food</span>
				<span className="hud-value">{foodCount > 0 ? `${foodCount} in water` : "None"}</span>
			</div>
			<div className="hud-item">
				<span className="hud-label">Mood</span>
				<span className="hud-value">{Math.round(avgHappiness)}%</span>
			</div>
			<div className="hud-item">
				<span className="hud-label">Gold</span>
				<span className="hud-value gold">{gold}</span>
			</div>
		</div>
	);
}
