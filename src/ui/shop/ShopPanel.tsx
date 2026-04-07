import { useGameStore } from "@/store/useGameStore";
import { PRICES } from "@/domain/economy/prices";
import { SPECIES, SPECIES_BY_PRICE } from "@/domain/fish/fishSpecies";
import type { FishSpecies } from "@/domain/fish/fishSpecies";

export function ShopPanel() {
	const gold = useGameStore((s) => s.gold);
	const buyFish = useGameStore((s) => s.buyFish);

	return (
		<div className="panel shop-panel">
			<h3>Shop</h3>
			<p className="shop-gold">Gold: {gold}</p>

			<h4 className="shop-section-title">Fish</h4>
			<div className="shop-items">
				{SPECIES_BY_PRICE.map((speciesKey: FishSpecies) => {
					const species = SPECIES[speciesKey];
					return (
						<div key={speciesKey} className="shop-item">
							<div className="item-info">
								<span className="item-name">{species.name}</span>
								<span className="item-desc">{species.description}</span>
							</div>
							<span className="item-price">{species.price}g</span>
							<button
								type="button"
								className="buy-btn"
								disabled={gold < species.price}
								onClick={() => buyFish(speciesKey)}
							>
								Buy
							</button>
						</div>
					);
				})}
			</div>

			<h4 className="shop-section-title">Supplies</h4>
			<div className="shop-items">
				{Object.entries(PRICES).map(([item, price]) => (
					<div key={item} className="shop-item">
						<div className="item-info">
							<span className="item-name">{formatItemName(item)}</span>
						</div>
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
		</div>
	);
}

function formatItemName(key: string): string {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
