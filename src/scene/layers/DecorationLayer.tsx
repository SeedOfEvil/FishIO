import { useRef } from "react";
import { TANK_FLOOR_Y } from "@/domain/constants/tuning";
import { PlantSprite } from "../components/PlantSprite";

const PLANTS = [
	{ x: 80, height: 70, color: "#3a8c4a" },
	{ x: 160, height: 50, color: "#4a9c5a" },
	{ x: 600, height: 80, color: "#2a7c3a" },
	{ x: 700, height: 55, color: "#4a9c5a" },
	{ x: 400, height: 45, color: "#3a8c4a" },
];

const ROCKS = [
	{ x: 300, width: 40, height: 20, color: "#8a8a7a" },
	{ x: 520, width: 30, height: 15, color: "#9a9a8a" },
];

export function DecorationLayer() {
	const animRef = useRef(0);
	// Simple time-based offset for plant sway
	animRef.current += 0.01;

	return (
		<g>
			{/* Rocks */}
			{ROCKS.map((rock, i) => (
				<ellipse
					key={`rock-${i}`}
					cx={rock.x}
					cy={TANK_FLOOR_Y - rock.height / 2 + 2}
					rx={rock.width / 2}
					ry={rock.height / 2}
					fill={rock.color}
					opacity={0.8}
				/>
			))}

			{/* Plants */}
			{PLANTS.map((plant, i) => (
				<PlantSprite
					key={`plant-${i}`}
					x={plant.x}
					baseY={TANK_FLOOR_Y}
					height={plant.height}
					color={plant.color}
				/>
			))}
		</g>
	);
}
