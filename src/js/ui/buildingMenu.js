export function renderBuildingMenu(container, buildings) {
  const fragment = document.createDocumentFragment();

  for (const building of buildings) {
    const button = document.createElement("button");
    button.className = "building-option";
    button.type = "button";
    button.dataset.buildingId = building.id;
    button.setAttribute(
      "aria-label",
      `Construir ${building.name} por ${building.price} moedas`,
    );

    const symbol = document.createElement("span");
    symbol.className = "building-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = building.symbol;

    const description = document.createElement("span");
    description.className = "building-description";

    const name = document.createElement("strong");
    name.textContent = building.name;

    const detail = document.createElement("span");
    detail.textContent = building.description;

    const price = document.createElement("span");
    price.className = "building-price";
    price.textContent = `${building.price} moedas`;

    description.append(name, detail);
    button.append(symbol, description, price);
    fragment.append(button);
  }

  container.replaceChildren(fragment);
}
