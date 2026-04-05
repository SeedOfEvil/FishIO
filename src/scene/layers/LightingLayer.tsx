import { TANK_WIDTH, WATER_SURFACE_Y, TANK_FLOOR_Y } from "@/domain/constants/tuning";
import { useGameStore } from "@/store/useGameStore";
import { getAmbientLight } from "@/domain/tank/lighting";

export function LightingLayer() {
	const currentHour = useGameStore((s) => s.currentHour);
	const ambientLight = getAmbientLight(currentHour);

	// Light rays are only visible during daytime
	if (ambientLight < 0.5) return null;

	const rayOpacity = (ambientLight - 0.5) * 0.3;

	return (
		<g style={{ pointerEvents: "none" }}>
			{/* Light rays from above */}
			{[120, 320, 550].map((x, i) => (
				<polygon
					key={`ray-${i}`}
					points={`${x},${WATER_SURFACE_Y} ${x - 30},${TANK_FLOOR_Y} ${x + 50},${TANK_FLOOR_Y} ${x + 20},${WATER_SURFACE_Y}`}
					fill={`rgba(255, 255, 200, ${rayOpacity * (0.6 + i * 0.1)})`}
				/>
			))}

			{/* Subtle surface shimmer */}
			<rect
				x={4}
				y={WATER_SURFACE_Y}
				width={TANK_WIDTH - 8}
				height={8}
				fill={`rgba(255, 255, 255, ${rayOpacity * 0.5})`}
			/>
		</g>
	);
}
