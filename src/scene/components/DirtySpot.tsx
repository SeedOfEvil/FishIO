import type { DirtySpot as DirtySpotType } from "@/domain/tank/tankTypes";

interface DirtySpotProps {
	spot: DirtySpotType;
	onClick: () => void;
}

export function DirtySpot({ spot, onClick }: DirtySpotProps) {
	return (
		<g
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			style={{ cursor: "pointer" }}
		>
			<ellipse
				cx={spot.x}
				cy={spot.y}
				rx={10}
				ry={6}
				fill="rgba(100, 80, 40, 0.5)"
				stroke="rgba(80, 60, 30, 0.4)"
				strokeWidth={1}
			/>
			{/* Little grime dots */}
			<circle cx={spot.x - 3} cy={spot.y - 1} r={1.5} fill="rgba(80, 60, 30, 0.6)" />
			<circle cx={spot.x + 4} cy={spot.y + 1} r={1} fill="rgba(80, 60, 30, 0.5)" />
		</g>
	);
}
