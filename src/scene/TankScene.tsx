import { useCallback } from "react";
import { TANK_WIDTH, TANK_HEIGHT, WATER_SURFACE_Y, TANK_FLOOR_Y } from "@/domain/constants/tuning";
import { useGameStore } from "@/store/useGameStore";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { DecorationLayer } from "./layers/DecorationLayer";
import { FishLayer } from "./layers/FishLayer";
import { BubbleLayer } from "./layers/BubbleLayer";
import { LightingLayer } from "./layers/LightingLayer";
import { OverlayLayer } from "./layers/OverlayLayer";

export function TankScene() {
	const dropFood = useGameStore((s) => s.dropFood);
	const selectFish = useGameStore((s) => s.selectFish);

	const handleClick = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			const svg = e.currentTarget;
			const rect = svg.getBoundingClientRect();
			const scaleX = TANK_WIDTH / rect.width;
			const scaleY = TANK_HEIGHT / rect.height;
			const x = (e.clientX - rect.left) * scaleX;
			const y = (e.clientY - rect.top) * scaleY;

			// Only drop food if clicking in water area
			if (y > WATER_SURFACE_Y && y < TANK_FLOOR_Y) {
				dropFood(x);
			}
		},
		[dropFood],
	);

	const handleBackgroundClick = useCallback(() => {
		// Deselect fish when clicking background
		selectFish(null);
	}, [selectFish]);

	return (
		<svg
			viewBox={`0 0 ${TANK_WIDTH} ${TANK_HEIGHT}`}
			className="tank-scene"
			onClick={handleClick}
			data-testid="tank-scene"
			style={{
				width: "100%",
				maxWidth: "900px",
				borderRadius: "12px",
				boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
			}}
		>
			{/* Click catcher for deselection */}
			<rect
				x={0}
				y={0}
				width={TANK_WIDTH}
				height={TANK_HEIGHT}
				fill="transparent"
				onClick={handleBackgroundClick}
			/>

			<BackgroundLayer />
			<DecorationLayer />
			<LightingLayer />
			<BubbleLayer />
			<OverlayLayer />
			<FishLayer />
		</svg>
	);
}
