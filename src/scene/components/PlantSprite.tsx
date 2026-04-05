import { useState, useEffect } from "react";

interface PlantSpriteProps {
	x: number;
	baseY: number;
	height: number;
	color: string;
}

export function PlantSprite({ x, baseY, height, color }: PlantSpriteProps) {
	const [sway, setSway] = useState(0);

	useEffect(() => {
		let raf: number;
		const animate = () => {
			setSway(Math.sin(Date.now() * 0.001 + x * 0.05) * 3);
			raf = requestAnimationFrame(animate);
		};
		raf = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(raf);
	}, [x]);

	const topX = x + sway;
	const topY = baseY - height;

	return (
		<g>
			{/* Main stem */}
			<path
				d={`M${x},${baseY} Q${x + sway * 0.5},${baseY - height * 0.5} ${topX},${topY}`}
				stroke={color}
				strokeWidth={3}
				fill="none"
				strokeLinecap="round"
			/>
			{/* Leaves */}
			<ellipse
				cx={topX - 4}
				cy={topY + 8}
				rx={6}
				ry={12}
				fill={color}
				opacity={0.7}
				transform={`rotate(${-20 + sway}, ${topX - 4}, ${topY + 8})`}
			/>
			<ellipse
				cx={topX + 4}
				cy={topY + 12}
				rx={5}
				ry={10}
				fill={color}
				opacity={0.6}
				transform={`rotate(${15 + sway}, ${topX + 4}, ${topY + 12})`}
			/>
		</g>
	);
}
