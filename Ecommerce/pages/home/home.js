(() => {
  "use strict";

  const data = window.luminaData;
  const api = window.luminaApi;

  if (!data) {
    throw new Error("Os dados da Home não foram carregados.");
  }

  const state = {
    activeCategory: "Todos",
    query: "",
    favorites: new Set(),
    cartCount: 0,
  };

  const elements = {
    avatar: document.querySelector("#user-avatar"),
    searchForm: document.querySelector(".search-form"),
    searchInput: document.querySelector("#product-search"),
    categoryButtons: [...document.querySelectorAll(".category-button")],
    filterStatus: document.querySelector("#filter-status"),
    hero: document.querySelector("#hero"),
    heroImage: document.querySelector("#hero-image"),
    heroTitle: document.querySelector("#hero-title"),
    heroDescription: document.querySelector("#hero-description"),
    heroBuy: document.querySelector("#hero-buy"),
    catalogContent: document.querySelector("#catalog-content"),
    bestSellers: document.querySelector("#best-sellers"),
    offers: document.querySelector("#offers"),
    newArrivals: document.querySelector("#new-arrivals"),
    showAll: document.querySelector("#show-all"),
    emptyState: document.querySelector("#empty-state"),
    clearFilters: document.querySelector("#clear-filters"),
    cartCount: document.querySelector("#cart-count"),
    profileButton: document.querySelector(".profile-button"),
    bottomNav: document.querySelector(".bottom-nav"),
    toast: document.querySelector("#toast"),
  };

  const formatPrice = (value) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    });

  const normalized = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");

  const imageFallback = (event) => {
    const image = event.target;
    image.removeAttribute("src");
    image.alt = "Imagem indisponível";
    image.classList.add("image-fallback");
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const heartIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8 1.1-1.1a5.5 5.5 0 0 0-.1-7.7Z" />
    </svg>`;

  const arrowIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>`;

  const getFilteredProducts = () => {
    const query = normalized(state.query.trim());

    return data.products.filter((product) => {
      const matchesCategory =
        state.activeCategory === "Todos" || product.category === state.activeCategory;
      const searchableText = normalized(
        `${product.name} ${product.description} ${product.category}`,
      );
      const matchesSearch = !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  };

  const productCardTemplate = (product) => {
    const isFavorite = state.favorites.has(product.id);

    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <div class="product-image-wrap">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <button
            class="favorite-button${isFavorite ? " is-favorite" : ""}"
            type="button"
            data-action="favorite"
            data-product-id="${escapeHtml(product.id)}"
            aria-label="${isFavorite ? "Remover" : "Adicionar"} ${escapeHtml(product.name)} ${isFavorite ? "dos" : "aos"} favoritos"
            aria-pressed="${isFavorite}"
          >
            ${heartIcon}
          </button>
        </div>
        <div class="product-copy">
          <p class="rating"><span class="rating-star" aria-hidden="true">☆</span> ${product.rating} (${product.reviewCount})</p>
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <div class="product-footer">
            <span class="price">${formatPrice(product.price)}</span>
            <button
              class="add-button"
              type="button"
              data-action="add"
              data-product-id="${escapeHtml(product.id)}"
              aria-label="Adicionar ${escapeHtml(product.name)} ao carrinho"
            >+</button>
          </div>
        </div>
      </article>`;
  };

  const offerCardTemplate = (product) => {
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);

    return `
      <article class="offer-card" data-product-id="${escapeHtml(product.id)}">
        <div class="offer-image-wrap">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <span class="discount-badge">-${discount}%</span>
        </div>
        <div class="offer-copy">
          <p class="product-category">${escapeHtml(product.category)}</p>
          <h3 class="offer-name">${escapeHtml(product.name)}</h3>
          <p class="offer-prices">
            <span class="price">${formatPrice(product.price)}</span>
            <span class="original-price">${formatPrice(product.originalPrice)}</span>
          </p>
        </div>
        <button
          class="offer-arrow"
          type="button"
          data-action="details"
          data-product-id="${escapeHtml(product.id)}"
          aria-label="Ver ${escapeHtml(product.name)}"
        >${arrowIcon}</button>
      </article>`;
  };

  const miniCardTemplate = (product) => `
    <article class="mini-card" data-product-id="${escapeHtml(product.id)}">
      <div class="mini-image-wrap">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
      </div>
      <div class="mini-copy">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <span class="price">${formatPrice(product.price)}</span>
      </div>
    </article>`;

  const bindImageFallbacks = () => {
    document
      .querySelectorAll(".product-card img, .offer-card img, .mini-card img")
      .forEach((image) => image.addEventListener("error", imageFallback, { once: true }));
  };

  const updateStatus = (count) => {
    const hasFilters = state.activeCategory !== "Todos" || state.query.trim();
    elements.filterStatus.textContent = hasFilters
      ? `${count} ${count === 1 ? "produto encontrado" : "produtos encontrados"}`
      : "";
  };

  const renderProducts = () => {
    const filteredProducts = getFilteredProducts();
    const bestSellers = [...filteredProducts]
      .sort((first, second) => second.salesCount - first.salesCount)
      .slice(0, 4);
    const offers = filteredProducts
      .filter((product) => product.originalPrice)
      .sort((first, second) => {
        const firstDiscount = 1 - first.price / first.originalPrice;
        const secondDiscount = 1 - second.price / second.originalPrice;
        return secondDiscount - firstDiscount;
      })
      .slice(0, 6);
    const newArrivals = filteredProducts
      .filter((product) => product.badge === "NOVO" || product.badge === "LANÇAMENTO")
      .slice(0, 4);

    elements.bestSellers.innerHTML = bestSellers.map(productCardTemplate).join("");
    elements.offers.innerHTML = offers.map(offerCardTemplate).join("");
    elements.newArrivals.innerHTML = newArrivals.map(miniCardTemplate).join("");

    elements.offers.closest("section").hidden = offers.length === 0;
    elements.newArrivals.closest("section").hidden = newArrivals.length === 0;
    elements.catalogContent.hidden = filteredProducts.length === 0;
    elements.emptyState.hidden = filteredProducts.length !== 0;

    updateStatus(filteredProducts.length);
    bindImageFallbacks();
  };

  let toastTimer;
  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2600);
  };

  const getProduct = (productId) =>
    data.products.find((product) => product.id === productId);

  const addToCart = (product) => {
    if (!product) return;

    state.cartCount += 1;
    elements.cartCount.textContent = state.cartCount > 99 ? "99+" : state.cartCount;
    elements.cartCount.hidden = false;
    showToast(`${product.name} foi adicionado ao carrinho.`);
  };

  const openProductDetails = (product) => {
    if (!product) return;
    window.sessionStorage.setItem("luminaSelectedProduct", JSON.stringify(product));
    window.location.href = `../products-details/product-details.html?id=${encodeURIComponent(product.id)}`;
  };

  const clearFilters = () => {
    state.activeCategory = "Todos";
    state.query = "";
    elements.searchInput.value = "";
    elements.categoryButtons.forEach((button) => {
      const isAll = button.dataset.category === "Todos";
      button.classList.toggle("is-active", isAll);
      button.setAttribute("aria-pressed", String(isAll));
    });
    renderProducts();
  };

  const handleCatalogClick = (event) => {
    const actionButton = event.target.closest("[data-action]");
    const card = event.target.closest("[data-product-id]");
    const productId = actionButton?.dataset.productId || card?.dataset.productId;
    const product = getProduct(productId);

    if (actionButton?.dataset.action === "favorite") {
      const isFavorite = state.favorites.has(productId);
      isFavorite ? state.favorites.delete(productId) : state.favorites.add(productId);
      renderProducts();
      showToast(
        isFavorite
          ? `${product.name} foi removido dos favoritos.`
          : `${product.name} foi adicionado aos favoritos.`,
      );
      return;
    }

    if (actionButton?.dataset.action === "add") {
      addToCart(product);
      return;
    }

    openProductDetails(product);
  };

  elements.avatar.src = data.user.avatar;
  elements.avatar.addEventListener("error", imageFallback, { once: true });

  let heroProduct = null;

  const renderHero = () => {
    heroProduct =
      data.products.find((product) => product.badge === "LANÇAMENTO") || data.products[0];
    elements.hero.hidden = !heroProduct;
    if (!heroProduct) return;

    elements.heroImage.src = heroProduct.image;
    elements.heroImage.alt = heroProduct.name;
    elements.heroTitle.textContent = heroProduct.name;
    elements.heroDescription.textContent = heroProduct.description;
  };

  elements.heroImage.addEventListener("error", imageFallback, { once: true });
  elements.heroBuy.addEventListener("click", () => openProductDetails(heroProduct));

  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = elements.searchInput.value.trim();
    window.location.href = query
      ? `../products/products.html?q=${encodeURIComponent(query)}`
      : "../products/products.html";
  });

  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    renderProducts();
  });

  elements.categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      elements.categoryButtons.forEach((categoryButton) => {
        const isActive = categoryButton === button;
        categoryButton.classList.toggle("is-active", isActive);
        categoryButton.setAttribute("aria-pressed", String(isActive));
      });
      renderProducts();
    });
  });

  elements.catalogContent.addEventListener("click", handleCatalogClick);
  elements.showAll.addEventListener("click", () => {
    window.location.href = "../products/products.html";
  });
  elements.clearFilters.addEventListener("click", clearFilters);

  elements.profileButton.addEventListener("click", () => {
    window.location.href = api?.auth.isAuthenticated()
      ? "../dashboard/dashboard.html"
      : "../login/login.html";
  });

  elements.bottomNav.addEventListener("click", (event) => {
    const button = event.target.closest(".nav-button");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (action === "explore") {
      window.location.href = "../products/products.html";
      return;
    }
    if (action === "cart") {
      showToast(
        state.cartCount
          ? `${state.cartCount} ${state.cartCount === 1 ? "item" : "itens"} no carrinho.`
          : "Seu carrinho está vazio.",
      );
      return;
    }
    window.location.href = api?.auth.isAuthenticated()
      ? "../dashboard/dashboard.html"
      : "../login/login.html";
  });

  const loadProductsFromApi = async () => {
    if (!api) return;

    try {
      const response = await api.products.list({ limit: 100, sort: "relevance" });
      data.products = response.data;
      renderHero();
      renderProducts();
    } catch (error) {
      showToast(`${error.message} Exibindo os dados locais de demonstração.`);
    }
  };

  renderHero();
  renderProducts();
  loadProductsFromApi();
})();
