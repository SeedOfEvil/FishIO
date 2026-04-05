import { useState, useEffect, useCallback } from "react";
import {
	TANK_WIDTH,
	TANK_PADDING,
	WATER_SURFACE_Y,
	TANK_FLOOR_Y,
	BUBBLE_SPAWN_INTERVAL_MS,
	MAX_BUBBLES,
} from "@/domain/constants/tuning";

interface Bubble {
	id: number;
	x: number;
	y: number;
	r: number;
	speed: number;
	wobbleOffset: number;
}

let bubbleId = 0;

export function BubbleLayer() {
	const [bubbles, setBubbles] = useState<Bubble[]>([]);

	const spawnBubble = useCallback(() => {
		const newBubble: Bubble = {
			id: bubbleId++,
			x: TANK_PADDING + 40 + Math.random() * (TANK_WIDTH - TANK_PADDING * 2 - 80),
			y: TANK_FLOOR_Y - 20,
			r: 2 + Math.random() * 4,
			speed: 0.3 + Math.random() * 0.4,
			wobbleOffset: Math.random() * Math.PI * 2,
		};
		setBubbles((prev) => [...prev.slice(-(MAX_BUBBLES - 1)), newBubble]);
	}, []);

	useEffect(() => {
		const interval = setInterval(spawnBubble, BUBBLE_SPAWN_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [spawnBubble]);

	useEffect(() => {
		let raf: number;
		const animate = () => {
			setBubbles((prev) =>
				prev
					.map((b) => ({
						...b,
						y: b.y - b.speed,
						x: b.x + Math.sin(Date.now() * 0.002 + b.wobbleOffset) * 0.3,
					}))
					.filter((b) => b.y > WATER_SURFACE_Y),
			);
			raf = requestAnimationFrame(animate);
		};
		raf = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<g>
			{bubbles.map((b) => (
				<circle
					key={b.id}
					cx={b.x}
					cy={b.y}
					r={b.r}
					fill="rgba(200, 230, 255, 0.4)"
					stroke="rgba(200, 230, 255, 0.6)"
					strokeWidth={0.5}
				/>
			))}
		</g>
	);
}
