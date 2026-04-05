import { TANK_WIDTH, TANK_HEIGHT, WATER_SURFACE_Y, TANK_FLOOR_Y } from "@/domain/constants/tuning";
import { useGameStore } from "@/store/useGameStore";
import { getWaterTint, getAmbientLight } from "@/domain/tank/lighting";

export function BackgroundLayer() {
	const currentHour = useGameStore((s) => s.currentHour);
	const ambientLight = getAmbientLight(currentHour);
	const waterTint = getWaterTint(currentHour);

	return (
		<g>
			{/* Tank glass background */}
			<rect
				x={0}
				y={0}
				width={TANK_WIDTH}
				height={TANK_HEIGHT}
				rx={12}
				fill={`rgba(200, 220, 240, ${0.3 * ambientLight})`}
				stroke="#8ba4b8"
				strokeWidth={4}
			/>

			{/* Water fill */}
			<rect
				x={4}
				y={WATER_SURFACE_Y}
				width={TANK_WIDTH - 8}
				height={TANK_FLOOR_Y - WATER_SURFACE_Y}
				fill="url(#waterGradient)"
			/>

			{/* Water tint overlay */}
			<rect
				x={4}
				y={WATER_SURFACE_Y}
				width={TANK_WIDTH - 8}
				height={TANK_FLOOR_Y - WATER_SURFACE_Y}
				fill={waterTint}
			/>

			{/* Sand/gravel floor */}
			<rect
				x={4}
				y={TANK_FLOOR_Y}
				width={TANK_WIDTH - 8}
				height={TANK_HEIGHT - TANK_FLOOR_Y - 4}
				rx={0}
				fill="url(#sandGradient)"
			/>

			{/* Water surface line */}
			<line
				x1={4}
				y1={WATER_SURFACE_Y}
				x2={TANK_WIDTH - 4}
				y2={WATER_SURFACE_Y}
				stroke="rgba(255,255,255,0.4)"
				strokeWidth={2}
			/>

			{/* Gradient definitions */}
			<defs>
				<linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={`rgba(100, 180, 235, ${0.4 * ambientLight})`} />
					<stop offset="100%" stopColor={`rgba(50, 120, 180, ${0.6 * ambientLight})`} />
				</linearGradient>
				<linearGradient id="sandGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#d4a76a" />
					<stop offset="100%" stopColor="#b8914f" />
				</linearGradient>
			</defs>
		</g>
	);
}
