import { useGameStore } from "@/store/useGameStore";
import { PRICES } from "@/domain/economy/prices";

export function ShopPanel() {
	const gold = useGameStore((s) => s.gold);

	return (
		<div className="panel shop-panel">
			<h3>Shop</h3>
			<p className="shop-gold">Gold: {gold}</p>
			<div className="shop-items">
				{Object.entries(PRICES).map(([item, price]) => (
					<div key={item} className="shop-item">
						<span className="item-name">{formatItemName(item)}</span>
						<span className="item-price">{price}g</span>
						<button
							type="button"
							className="buy-btn"
							disabled={gold < price}
						>
							Buy
						</button>
					</div>
				))}
			</div>
			<p className="shop-note">Shop functionality coming soon!</p>
		</div>
	);
}

function formatItemName(key: string): string {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
