(() => {
  "use strict";

  const api = window.luminaApi;
  const localProducts = window.luminaData?.products || [];
  const requestedId = new URLSearchParams(window.location.search).get("id");
  let storedProduct = null;

  try {
    storedProduct = JSON.parse(
      window.sessionStorage.getItem("luminaSelectedProduct") || "null",
    );
  } catch {
    window.sessionStorage.removeItem("luminaSelectedProduct");
  }

  const localMatch = localProducts.find((item) => item.id === requestedId);
  const storedMatch =
    storedProduct && (!requestedId || String(storedProduct.id) === requestedId)
      ? storedProduct
      : null;
  const initialProduct =
    localMatch ||
    storedMatch ||
    (!requestedId && (localProducts.find((item) => item.id === "p1") || localProducts[0]));

  let product = initialProduct ? normalizeProduct(initialProduct) : null;
  let details = product ? getDetails(product) : null;

  const state = {
    favorite: false,
    selectedColor: 0,
    imagePosition: 0,
    cartAdded: false,
  };

  const elements = {
    image: document.querySelector("#product-image"),
    backButton: document.querySelector("#back-button"),
    favoriteButton: document.querySelector("#favorite-button"),
    galleryDots: document.querySelector("#gallery-dots"),
    tags: document.querySelector("#product-tags"),
    name: document.querySelector("#product-name"),
    description: document.querySelector("#product-description"),
    ratingStars: document.querySelector("#rating-stars"),
    ratingValue: document.querySelector("#rating-value"),
    reviewCount: document.querySelector("#review-count"),
    currentPrice: document.querySelector("#current-price"),
    originalPrice: document.querySelector("#original-price"),
    discount: document.querySelector("#discount"),
    installments: document.querySelector("#installments"),
    stockLabel: document.querySelector("#stock-label"),
    colorName: document.querySelector("#color-name"),
    colorOptions: document.querySelector("#color-options"),
    features: document.querySelector("#features-list"),
    cartButton: document.querySelector("#cart-button"),
    cartButtonLabel: document.querySelector("#cart-button span"),
    buyButton: document.querySelector("#buy-button"),
    toast: document.querySelector("#toast"),
  };

  function normalizeProduct(value) {
    return {
      rating: 4.8,
      reviewCount: 0,
      badge: "DESTAQUE",
      salesCount: 0,
      stock: 0,
      originalPrice: null,
      ...value,
      id: String(value.id),
      price: Number(value.price),
      rating: Number(value.rating ?? 4.8),
      reviewCount: Number(value.reviewCount ?? 0),
      stock: Number(value.stock ?? 10),
    };
  }

  function getDetails(currentProduct) {
    const defaultDetails = {
      tags: [currentProduct.badge || "DESTAQUE", "SELEÇÃO LUMINA"],
      colors: [
        { name: "Grafite", value: "#35363e" },
        { name: "Natural", value: "#e9e5dc" },
        { name: "Azul", value: "#36536b" },
      ],
      features: [
        {
          icon: "✦",
          title: "Acabamento premium",
          description: "Materiais selecionados e acabamento pensado para acompanhar sua rotina.",
        },
        {
          icon: "✓",
          title: "Garantia de qualidade",
          description: "Produto verificado e acompanhado por garantia de 12 meses.",
        },
        {
          icon: "▣",
          title: "Entrega segura",
          description: "Embalagem reforçada para proteger o produto durante todo o transporte.",
        },
      ],
    };

    if (currentProduct.id !== "p1") return defaultDetails;

    return {
      tags: ["MAIS VENDIDO", "EDIÇÃO LIMITADA"],
      colors: [
        { name: "Grafite profundo", value: "#34363f" },
        { name: "Branco ártico", value: "#f1f2f5" },
        { name: "Azul meia-noite", value: "#29465f" },
      ],
      features: [
        {
          icon: "≋",
          title: "ANC adaptativo",
          description: "Bloqueia o ruído externo automaticamente, ajustando-se ao ambiente em tempo real.",
        },
        {
          icon: "↯",
          title: "Bateria de 40 horas",
          description: "Até 40 horas de reprodução. Uma carga rápida de 15 minutos oferece mais 5 horas de uso.",
        },
        {
          icon: "◉",
          title: "Áudio espacial",
          description: "Som imersivo que coloca você no centro da música, com rastreamento dinâmico.",
        },
      ],
    };
  }

  const formatPrice = (value) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const renderProduct = () => {
    if (!product || !details) return;

    const discount = product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;
    const filledStars = Math.max(0, Math.min(5, Math.round(product.rating)));

    document.title = `Lumina | ${product.name}`;
    elements.image.classList.remove("image-fallback");
    elements.image.src = product.image;
    elements.image.alt = product.name;
    elements.tags.innerHTML = details.tags
      .map(
        (tag, index) =>
          `<span class="tag${index === 0 ? " tag--main" : ""}">${escapeHtml(tag)}</span>`,
      )
      .join("");
    elements.name.textContent = product.name;
    elements.description.textContent = product.description;
    elements.ratingStars.textContent = `${"★".repeat(filledStars)}${"☆".repeat(5 - filledStars)}`;
    elements.ratingValue.textContent = product.rating.toFixed(1);
    elements.reviewCount.textContent = `(${product.reviewCount} avaliações)`;
    elements.currentPrice.textContent = formatPrice(product.price);
    elements.originalPrice.textContent = product.originalPrice
      ? formatPrice(Number(product.originalPrice))
      : "";
    elements.originalPrice.hidden = !product.originalPrice;
    elements.discount.textContent = discount ? `-${discount}%` : "";
    elements.discount.hidden = !discount;
    elements.installments.textContent = `ou 12x de ${formatPrice(product.price / 12)} sem juros`;
    elements.stockLabel.textContent = product.stock > 0
      ? `${product.stock} unidade${product.stock === 1 ? "" : "s"} em estoque`
      : "Produto esgotado";
    elements.colorOptions.innerHTML = details.colors
      .map(
        (color, index) => `
          <button
            class="color-option${index === state.selectedColor ? " is-active" : ""}"
            type="button"
            data-color-index="${index}"
            style="background:${escapeHtml(color.value)}"
            aria-label="Selecionar cor ${escapeHtml(color.name)}"
            aria-pressed="${index === state.selectedColor}"
          ></button>`,
      )
      .join("");
    elements.colorName.textContent = details.colors[state.selectedColor].name;
    elements.features.innerHTML = details.features
      .map(
        (feature) => `
          <article class="feature">
            <span class="feature-icon" aria-hidden="true">${escapeHtml(feature.icon)}</span>
            <div>
              <h3>${escapeHtml(feature.title)}</h3>
              <p>${escapeHtml(feature.description)}</p>
            </div>
          </article>`,
      )
      .join("");
    elements.cartButton.disabled = product.stock <= 0;
    elements.buyButton.disabled = product.stock <= 0;
  };

  const renderUnavailable = (message) => {
    document.title = "Lumina | Produto indisponível";
    elements.image.removeAttribute("src");
    elements.image.alt = "Imagem indisponível";
    elements.image.classList.add("image-fallback");
    elements.tags.innerHTML = '<span class="tag tag--main">INDISPONÍVEL</span>';
    elements.name.textContent = "Produto não encontrado";
    elements.description.textContent = message;
    elements.ratingStars.textContent = "☆☆☆☆☆";
    elements.ratingValue.textContent = "0.0";
    elements.reviewCount.textContent = "(0 avaliações)";
    elements.currentPrice.textContent = "—";
    elements.originalPrice.hidden = true;
    elements.discount.hidden = true;
    elements.installments.textContent = "Volte ao catálogo para escolher outro produto.";
    elements.stockLabel.textContent = "Produto indisponível";
    elements.colorOptions.innerHTML = "";
    elements.colorName.textContent = "";
    elements.features.innerHTML = "";
    elements.cartButton.disabled = true;
    elements.buyButton.disabled = true;
  };

  const imageFallback = () => {
    elements.image.removeAttribute("src");
    elements.image.alt = "Imagem indisponível";
    elements.image.classList.add("image-fallback");
  };

  let toastTimer;
  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 3200);
  };

  const resetCartButton = () => {
    state.cartAdded = false;
    elements.cartButton.classList.remove("is-added");
    elements.cartButtonLabel.textContent = "Carrinho";
  };

  async function loadRequestedProduct() {
    if (!requestedId || !api) {
      if (product) renderProduct();
      else renderUnavailable("O identificador do produto não foi informado.");
      return;
    }

    try {
      product = normalizeProduct(await api.products.get(requestedId));
      details = getDetails(product);
      state.selectedColor = 0;
      window.sessionStorage.setItem("luminaSelectedProduct", JSON.stringify(product));
      renderProduct();
    } catch (error) {
      if (product) {
        renderProduct();
        showToast(`${error.message} Exibindo os dados salvos localmente.`);
        return;
      }

      renderUnavailable(error.message || "Não foi possível carregar este produto.");
      showToast(error.message || "Não foi possível carregar este produto.");
    }
  }

  elements.image.addEventListener("error", imageFallback);

  elements.backButton.addEventListener("click", () => {
    if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
      window.history.back();
      return;
    }
    window.location.href = "../products/products.html";
  });

  elements.favoriteButton.addEventListener("click", () => {
    if (!product) return;
    state.favorite = !state.favorite;
    elements.favoriteButton.classList.toggle("is-favorite", state.favorite);
    elements.favoriteButton.setAttribute("aria-pressed", String(state.favorite));
    elements.favoriteButton.setAttribute(
      "aria-label",
      state.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos",
    );
    showToast(
      state.favorite
        ? `${product.name} foi adicionado aos favoritos.`
        : `${product.name} foi removido dos favoritos.`,
    );
  });

  elements.galleryDots.addEventListener("click", (event) => {
    const button = event.target.closest("[data-position]");
    if (!button) return;

    state.imagePosition = Number(button.dataset.position);
    const positions = ["38% 50%", "50% 50%", "64% 50%"];
    const scales = ["scale(1)", "scale(1.08)", "scale(1.16)"];
    elements.image.style.objectPosition = positions[state.imagePosition];
    elements.image.style.transform = scales[state.imagePosition];

    [...elements.galleryDots.children].forEach((dot, index) => {
      const isActive = index === state.imagePosition;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });
  });

  elements.colorOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color-index]");
    if (!button || !details) return;

    state.selectedColor = Number(button.dataset.colorIndex);
    elements.colorName.textContent = details.colors[state.selectedColor].name;
    [...elements.colorOptions.children].forEach((option, index) => {
      const isActive = index === state.selectedColor;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });
  });

  elements.cartButton.addEventListener("click", () => {
    if (!product || state.cartAdded) return;

    state.cartAdded = true;
    elements.cartButton.classList.add("is-added");
    elements.cartButtonLabel.textContent = "Adicionado!";
    showToast(`${product.name} foi adicionado ao carrinho.`);
    window.setTimeout(resetCartButton, 2200);
  });

  elements.buyButton.addEventListener("click", () => {
    showToast("A finalização da compra será conectada em outra etapa.");
  });

  loadRequestedProduct();
})();
