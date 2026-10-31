(() => {
  "use strict";

  const data = window.luminaData;
  const api = window.luminaApi;

  if (!data) {
    throw new Error("Os dados dos produtos não foram carregados.");
  }

  const state = {
    query: new URLSearchParams(window.location.search).get("q")?.trim() || "",
    category: "Todos",
    sort: "relevance",
    favorites: new Set(),
    cartCount: 0,
  };

  const elements = {
    avatar: document.querySelector("#user-avatar"),
    profileButton: document.querySelector("#profile-button"),
    searchForm: document.querySelector("#search-form"),
    searchInput: document.querySelector("#product-search"),
    clearSearch: document.querySelector("#clear-search"),
    queryLabel: document.querySelector("#query-label"),
    resultsCount: document.querySelector("#results-count"),
    resultsCountLabel: document.querySelector("#results-count-label"),
    filterToggle: document.querySelector("#filter-toggle"),
    filterCount: document.querySelector("#filter-count"),
    categoryFilters: document.querySelector("#category-filters"),
    priceSort: document.querySelector("#price-sort"),
    ratingSort: document.querySelector("#rating-sort"),
    resetSort: document.querySelector("#reset-sort"),
    sortLabel: document.querySelector("#sort-label"),
    productList: document.querySelector("#product-list"),
    emptyState: document.querySelector("#empty-state"),
    clearFilters: document.querySelector("#clear-filters"),
    bottomNav: document.querySelector(".bottom-nav"),
    cartCount: document.querySelector("#cart-count"),
    toast: document.querySelector("#toast"),
  };

  const sortLabels = {
    relevance: "Relevância",
    priceAsc: "Menor preço",
    priceDesc: "Maior preço",
    rating: "Avaliação",
  };

  const formatPrice = (value) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    });

  const normalized = (value) =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const imageFallback = (event) => {
    const image = event.target;
    image.removeAttribute("src");
    image.alt = "Imagem indisponível";
    image.classList.add("image-fallback");
  };

  const matchesQuery = (product, query) => {
    if (!query) return true;

    const normalizedQuery = normalized(query);
    const searchable = normalized(
      `${product.name} ${product.description} ${product.category} ${product.badge || ""}`,
    );

    if (searchable.includes(normalizedQuery)) return true;

    const aliases = {
      smartphone: ["lumina pro", "aura flow", "eletronicos"],
      celular: ["lumina pro", "aura flow", "eletronicos"],
      cafe: ["kit cafe"],
      fone: ["headphone"],
    };

    return (aliases[normalizedQuery] || []).some((alias) => searchable.includes(alias));
  };

  const getProducts = () => {
    const filtered = data.products.filter(
      (product) =>
        matchesQuery(product, state.query) &&
        (state.category === "Todos" || product.category === state.category),
    );

    if (state.sort === "priceAsc") {
      return [...filtered].sort((first, second) => first.price - second.price);
    }
    if (state.sort === "priceDesc") {
      return [...filtered].sort((first, second) => second.price - first.price);
    }
    if (state.sort === "rating") {
      return [...filtered].sort(
        (first, second) => second.rating - first.rating || second.reviewCount - first.reviewCount,
      );
    }

    return [...filtered].sort((first, second) => second.salesCount - first.salesCount);
  };

  const getBadgeClass = (badge) => {
    if (badge === "RECOMENDADO") return "badge badge--green";
    if (badge === "MAIS VENDIDO" || badge === "LANÇAMENTO") {
      return "badge badge--yellow";
    }
    return "badge";
  };

  const heartIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8 1.1-1.1a5.5 5.5 0 0 0-.1-7.7Z" />
    </svg>`;

  const cartIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>`;

  const productTemplate = (product) => {
    const favorite = state.favorites.has(product.id);
    const originalPrice = product.originalPrice
      ? `<p class="original-price">${formatPrice(product.originalPrice)}</p>`
      : "";
    const installments = product.originalPrice
      ? '<p class="installments">Em até 10x sem juros</p>'
      : "";

    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <div class="product-image-wrap">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <button
            class="favorite-button${favorite ? " is-favorite" : ""}"
            type="button"
            data-action="favorite"
            data-product-id="${escapeHtml(product.id)}"
            aria-label="${favorite ? "Remover" : "Adicionar"} ${escapeHtml(product.name)} ${favorite ? "dos" : "aos"} favoritos"
            aria-pressed="${favorite}"
          >${heartIcon}</button>
        </div>
        <div class="product-copy">
          ${product.badge ? `<span class="${getBadgeClass(product.badge)}">${escapeHtml(product.badge)}</span>` : ""}
          <h2 class="product-name">${escapeHtml(product.name)}</h2>
          <p class="rating"><span class="rating-star" aria-hidden="true">☆</span> ${product.rating} (${product.reviewCount})</p>
          <div class="product-footer">
            <div>
              ${originalPrice}
              <p class="price">${formatPrice(product.price)}</p>
              ${installments}
            </div>
            <button
              class="cart-button"
              type="button"
              data-action="cart"
              data-product-id="${escapeHtml(product.id)}"
              aria-label="Adicionar ${escapeHtml(product.name)} ao carrinho"
            >${cartIcon}</button>
          </div>
        </div>
      </article>`;
  };

  const renderCategories = () => {
    elements.categoryFilters.innerHTML = data.categories
      .map(
        (category) => `
          <button
            class="category-chip${category === state.category ? " is-active" : ""}"
            type="button"
            data-category="${escapeHtml(category)}"
            aria-pressed="${category === state.category}"
          >${escapeHtml(category === "Todos" ? "Todas" : category)}</button>`,
      )
      .join("");
  };

  const updateControls = () => {
    const hasCategoryFilter = state.category !== "Todos";
    elements.searchInput.value = state.query;
    elements.clearSearch.hidden = !state.query;
    elements.queryLabel.textContent = state.query || "Todos";
    elements.filterCount.hidden = !hasCategoryFilter;
    elements.filterCount.textContent = hasCategoryFilter ? "1" : "";
    elements.priceSort.classList.toggle(
      "is-active",
      state.sort === "priceAsc" || state.sort === "priceDesc",
    );
    elements.priceSort.textContent =
      state.sort === "priceAsc"
        ? "Preço ↑"
        : state.sort === "priceDesc"
          ? "Preço ↓"
          : "Preço";
    elements.ratingSort.classList.toggle("is-active", state.sort === "rating");
    elements.ratingSort.setAttribute("aria-pressed", String(state.sort === "rating"));
    elements.sortLabel.textContent = sortLabels[state.sort];
    renderCategories();
  };

  const bindImageFallbacks = () => {
    document
      .querySelectorAll(".product-card img")
      .forEach((image) => image.addEventListener("error", imageFallback, { once: true }));
  };

  const render = () => {
    const products = getProducts();

    updateControls();
    elements.resultsCount.textContent = products.length;
    elements.resultsCountLabel.textContent = products.length === 1 ? "item" : "itens";
    elements.productList.innerHTML = products.map(productTemplate).join("");
    elements.productList.hidden = products.length === 0;
    elements.emptyState.hidden = products.length !== 0;
    bindImageFallbacks();
  };

  let refreshTimer;
  let requestSequence = 0;

  const refreshProductsFromApi = async () => {
    if (!api) return;

    const currentRequest = ++requestSequence;
    const sort = {
      relevance: "relevance",
      priceAsc: "price_asc",
      priceDesc: "price_desc",
      rating: "rating",
    }[state.sort];

    try {
      const response = await api.products.list({
        search: state.query.trim(),
        category: state.category === "Todos" ? "" : state.category,
        sort,
        limit: 100,
      });
      if (currentRequest !== requestSequence) return;

      data.products = response.data;
      render();
    } catch (error) {
      if (currentRequest !== requestSequence) return;
      showToast(`${error.message} Exibindo os dados locais disponíveis.`);
    }
  };

  const scheduleProductRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshProductsFromApi, 250);
  };

  const loadCategoriesFromApi = async () => {
    if (!api) return;

    try {
      const categories = await api.categories.list();
      data.categories = ["Todos", ...categories.map((category) => category.name)];
      renderCategories();
    } catch (error) {
      showToast(`${error.message} Mantendo as categorias locais.`);
    }
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

  const resetFilters = () => {
    state.query = "";
    state.category = "Todos";
    state.sort = "relevance";
    render();
    refreshProductsFromApi();
  };

  elements.avatar.src = data.user.avatar;
  elements.avatar.addEventListener("error", imageFallback, { once: true });

  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = elements.searchInput.value.trim();
    render();
    refreshProductsFromApi();
  });

  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    render();
    scheduleProductRefresh();
  });

  elements.clearSearch.addEventListener("click", () => {
    state.query = "";
    elements.searchInput.focus();
    render();
    refreshProductsFromApi();
  });

  elements.filterToggle.addEventListener("click", () => {
    const willOpen = elements.categoryFilters.hidden;
    elements.categoryFilters.hidden = !willOpen;
    elements.filterToggle.setAttribute("aria-expanded", String(willOpen));
  });

  elements.categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    render();
    refreshProductsFromApi();
  });

  elements.priceSort.addEventListener("click", () => {
    state.sort =
      state.sort === "priceAsc"
        ? "priceDesc"
        : state.sort === "priceDesc"
          ? "relevance"
          : "priceAsc";
    render();
    refreshProductsFromApi();
  });

  elements.ratingSort.addEventListener("click", () => {
    state.sort = state.sort === "rating" ? "relevance" : "rating";
    render();
    refreshProductsFromApi();
  });

  elements.resetSort.addEventListener("click", () => {
    state.sort = "relevance";
    render();
    refreshProductsFromApi();
  });

  elements.productList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    const card = event.target.closest("[data-product-id]");
    const productId = actionButton?.dataset.productId || card?.dataset.productId;
    const product = getProduct(productId);

    if (!product) return;

    if (actionButton?.dataset.action === "favorite") {
      const isFavorite = state.favorites.has(product.id);
      isFavorite ? state.favorites.delete(product.id) : state.favorites.add(product.id);
      render();
      showToast(
        isFavorite
          ? `${product.name} foi removido dos favoritos.`
          : `${product.name} foi adicionado aos favoritos.`,
      );
      return;
    }

    if (actionButton?.dataset.action === "cart") {
      state.cartCount += 1;
      elements.cartCount.textContent = state.cartCount > 99 ? "99+" : state.cartCount;
      elements.cartCount.hidden = false;
      showToast(`${product.name} foi adicionado ao carrinho.`);
      return;
    }

    window.sessionStorage.setItem("luminaSelectedProduct", JSON.stringify(product));
    window.location.href = `../products-details/product-details.html?id=${encodeURIComponent(product.id)}`;
  });

  elements.clearFilters.addEventListener("click", resetFilters);

  elements.profileButton.addEventListener("click", () => {
    window.location.href = api?.auth.isAuthenticated()
      ? "../dashboard/dashboard.html"
      : "../login/login.html";
  });

  elements.bottomNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nav]");
    if (!button) return;

    if (button.dataset.nav === "explore") {
      elements.searchInput.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.nav === "home") {
      window.location.href = "../home/index.html";
      return;
    }

    if (button.dataset.nav === "cart") {
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

  render();
  loadCategoriesFromApi();
  refreshProductsFromApi();
})();
