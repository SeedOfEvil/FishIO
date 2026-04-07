import { useRef, useEffect, useState, useCallback } from "react";
import type { FoodPellet as FoodPelletType } from "@/domain/fish/fishTypes";
import { TICK_INTERVAL_MS } from "@/domain/constants/balance";

interface FoodPelletProps {
	pellet: FoodPelletType;
}

function useSmoothY(y: number) {
	const prevRef = useRef(y);
	const targetRef = useRef(y);
	const tickTimeRef = useRef(Date.now());
	const rafRef = useRef<number>(0);
	const [smoothY, setSmoothY] = useState(y);

	useEffect(() => {
		prevRef.current = targetRef.current;
		targetRef.current = y;
		tickTimeRef.current = Date.now();
	}, [y]);

	const animate = useCallback(() => {
		const elapsed = Date.now() - tickTimeRef.current;
		const t = Math.min(elapsed / TICK_INTERVAL_MS, 1);
		const val = prevRef.current + (targetRef.current - prevRef.current) * t;
		setSmoothY(val);
		rafRef.current = requestAnimationFrame(animate);
	}, []);

	useEffect(() => {
		rafRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(rafRef.current);
	}, [animate]);

	return smoothY;
}

export function FoodPellet({ pellet }: FoodPelletProps) {
	// Only fade in the last 10 seconds before dissolving
	const opacity = pellet.lifetime > 10 ? 1 : pellet.lifetime / 10;
	const smoothY = useSmoothY(pellet.y);

	return (
		<circle
			cx={pellet.x}
			cy={smoothY}
			r={3}
			fill="#c88030"
			opacity={opacity}
			stroke="#a06020"
			strokeWidth={0.5}
		/>
	);
}
