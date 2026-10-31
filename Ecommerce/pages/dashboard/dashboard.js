(() => {
  "use strict";

  const api = window.luminaApi;
  const state = {
    editingProfile: false,
    editingProductId: null,
    categories: [],
    profile: {
      name: "Carregando...",
      email: "",
      phone: "",
      avatar: "",
      role: "Vendedor",
      joinYear: new Date().getFullYear(),
    },
    products: [],
  };

  const elements = {
    avatar: document.querySelector("#profile-avatar"),
    profileName: document.querySelector("#profile-name"),
    profileEmail: document.querySelector("#profile-email"),
    profileRole: document.querySelector("#profile-role"),
    profileMember: document.querySelector("#profile-member"),
    editProfile: document.querySelector("#edit-profile"),
    fullName: document.querySelector("#full-name"),
    email: document.querySelector("#email"),
    phone: document.querySelector("#phone"),
    fullNameError: document.querySelector("#full-name-error"),
    emailError: document.querySelector("#email-error"),
    phoneError: document.querySelector("#phone-error"),
    productList: document.querySelector("#dashboard-products"),
    productCount: document.querySelector("#product-count"),
    emptyState: document.querySelector("#empty-state"),
    addProduct: document.querySelector("#add-product"),
    logout: document.querySelector("#logout-button"),
    bottomNav: document.querySelector(".bottom-nav"),
    modal: document.querySelector("#product-modal"),
    modalBackdrop: document.querySelector(".modal-backdrop"),
    modalTitle: document.querySelector("#modal-title"),
    closeModal: document.querySelector("#close-modal"),
    productForm: document.querySelector("#product-form"),
    productName: document.querySelector("#product-name"),
    productDescription: document.querySelector("#product-description"),
    productPrice: document.querySelector("#product-price"),
    productCategory: document.querySelector("#product-category"),
    categoryOptions: document.querySelector("#category-options"),
    productImage: document.querySelector("#product-image"),
    productNameError: document.querySelector("#product-name-error"),
    productDescriptionError: document.querySelector("#product-description-error"),
    productPriceError: document.querySelector("#product-price-error"),
    productCategoryError: document.querySelector("#product-category-error"),
    productImageError: document.querySelector("#product-image-error"),
    saveProduct: document.querySelector("#save-product"),
    toast: document.querySelector("#toast"),
  };

  const profileFields = [elements.fullName, elements.email, elements.phone];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const imageFallback = (event) => {
    const image = event.target;
    image.removeAttribute("src");
    image.alt = "Imagem indisponível";
    image.classList.add("image-fallback");
  };

  const editIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>`;

  const deleteIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m4 4v8m6-8v8" />
    </svg>`;

  const renderProfile = () => {
    const displayName = state.profile.name.split(" ").slice(0, 2).join(" ");
    const initials = displayName
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const avatarFallback = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#252837"/><text x="100" y="118" text-anchor="middle" fill="#afbdff" font-family="Arial" font-size="64" font-weight="700">${initials}</text></svg>`,
    )}`;
    elements.avatar.src = state.profile.avatar || avatarFallback;
    elements.avatar.alt = `Foto de ${displayName}`;
    elements.profileName.textContent = displayName;
    elements.profileEmail.textContent = state.profile.email;
    elements.profileRole.textContent = state.profile.role;
    elements.profileMember.textContent = `Membro desde ${state.profile.joinYear}`;
    elements.fullName.value = state.profile.name;
    elements.email.value = state.profile.email;
    elements.phone.value = state.profile.phone;
  };

  const renderCategories = () => {
    elements.categoryOptions.innerHTML = state.categories
      .map((category) => `<option value="${escapeHtml(category.name)}"></option>`)
      .join("");
  };

  const productTemplate = (product) => {
    const inactive = product.status === "Inativo";

    return `
      <article class="product-row${inactive ? " is-inactive" : ""}" data-product-id="${escapeHtml(product.id)}">
        <div class="product-thumbnail" data-action="details" data-product-id="${escapeHtml(product.id)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          ${inactive ? '<span class="sold-out">Esgotado</span>' : ""}
        </div>
        <div class="product-summary" data-action="details" data-product-id="${escapeHtml(product.id)}">
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-price">${formatPrice(product.price)}</p>
          <p class="status">${escapeHtml(product.status)}</p>
        </div>
        <div class="product-actions">
          <button class="row-action" type="button" data-action="edit" data-product-id="${escapeHtml(product.id)}" aria-label="Editar ${escapeHtml(product.name)}">
            ${editIcon}
          </button>
          <button class="row-action row-action--delete" type="button" data-action="delete" data-product-id="${escapeHtml(product.id)}" aria-label="Excluir ${escapeHtml(product.name)}">
            ${deleteIcon}
          </button>
        </div>
      </article>`;
  };

  const bindProductImages = () => {
    document
      .querySelectorAll(".product-thumbnail img")
      .forEach((image) => image.addEventListener("error", imageFallback, { once: true }));
  };

  const renderProducts = () => {
    elements.productCount.textContent = `${state.products.length} ${state.products.length === 1 ? "item" : "itens"}`;
    elements.productList.innerHTML = state.products.map(productTemplate).join("");
    elements.productList.hidden = state.products.length === 0;
    elements.emptyState.hidden = state.products.length !== 0;
    bindProductImages();
  };

  const setButtonBusy = (button, busy, label) => {
    if (busy) {
      button.dataset.previousLabel = button.textContent;
      button.textContent = label;
      button.disabled = true;
      return;
    }

    button.textContent = button.dataset.previousLabel || button.textContent;
    button.disabled = false;
    delete button.dataset.previousLabel;
  };

  let toastTimer;
  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2800);
  };

  const clearProfileErrors = () => {
    [
      [elements.fullName, elements.fullNameError],
      [elements.email, elements.emailError],
      [elements.phone, elements.phoneError],
    ].forEach(([field, error]) => {
      field.closest(".data-field").classList.remove("has-error");
      field.removeAttribute("aria-invalid");
      error.textContent = "";
      error.hidden = true;
    });
  };

  const setProfileError = (field, error, message) => {
    field.closest(".data-field").classList.add("has-error");
    field.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  };

  const validateProfile = () => {
    clearProfileErrors();
    let valid = true;

    if (!elements.fullName.value.trim()) {
      setProfileError(elements.fullName, elements.fullNameError, "Informe o nome completo.");
      valid = false;
    }
    if (!emailPattern.test(elements.email.value.trim())) {
      setProfileError(elements.email, elements.emailError, "Informe um e-mail válido.");
      valid = false;
    }
    if (
      elements.phone.value.trim() &&
      elements.phone.value.replace(/\D/g, "").length < 10
    ) {
      setProfileError(elements.phone, elements.phoneError, "Informe um telefone válido.");
      valid = false;
    }

    return valid;
  };

  const showProfileApiErrors = (error) => {
    const fieldMap = {
      name: [elements.fullName, elements.fullNameError],
      email: [elements.email, elements.emailError],
      phone: [elements.phone, elements.phoneError],
    };

    Object.entries(error.fields || {}).forEach(([name, message]) => {
      const target = fieldMap[name];
      if (target) setProfileError(target[0], target[1], message);
    });
  };

  const setProfileEditing = (editing) => {
    state.editingProfile = editing;
    profileFields.forEach((field) => {
      field.readOnly = !editing;
    });
    elements.editProfile.textContent = editing ? "Salvar" : "Editar";
    if (editing) elements.fullName.focus();
  };

  const clearProductErrors = () => {
    [
      [elements.productName, elements.productNameError],
      [elements.productDescription, elements.productDescriptionError],
      [elements.productPrice, elements.productPriceError],
      [elements.productCategory, elements.productCategoryError],
      [elements.productImage, elements.productImageError],
    ].forEach(([field, error]) => {
      field.closest(".modal-field").classList.remove("has-error");
      field.removeAttribute("aria-invalid");
      error.textContent = "";
      error.hidden = true;
    });
  };

  const setProductError = (field, error, message) => {
    field.closest(".modal-field").classList.add("has-error");
    field.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  };

  const validateProduct = () => {
    clearProductErrors();
    let firstInvalid = null;

    const invalidate = (field, error, message) => {
      setProductError(field, error, message);
      firstInvalid ||= field;
    };

    if (!elements.productName.value.trim()) {
      invalidate(elements.productName, elements.productNameError, "Nome é obrigatório.");
    }
    if (!elements.productDescription.value.trim()) {
      invalidate(
        elements.productDescription,
        elements.productDescriptionError,
        "Descrição é obrigatória.",
      );
    }
    if (!elements.productPrice.value || Number(elements.productPrice.value) <= 0) {
      invalidate(elements.productPrice, elements.productPriceError, "Informe um preço válido.");
    }
    if (!elements.productCategory.value) {
      invalidate(
        elements.productCategory,
        elements.productCategoryError,
        "Selecione uma categoria.",
      );
    }
    if (!/^https?:\/\//i.test(elements.productImage.value.trim())) {
      invalidate(
        elements.productImage,
        elements.productImageError,
        "Informe uma URL iniciada por http:// ou https://.",
      );
    }

    firstInvalid?.focus();
    return !firstInvalid;
  };

  const showProductApiErrors = (error) => {
    const fieldMap = {
      name: [elements.productName, elements.productNameError],
      description: [elements.productDescription, elements.productDescriptionError],
      price: [elements.productPrice, elements.productPriceError],
      category: [elements.productCategory, elements.productCategoryError],
      image: [elements.productImage, elements.productImageError],
    };

    let firstInvalid = null;
    Object.entries(error.fields || {}).forEach(([name, message]) => {
      const target = fieldMap[name];
      if (!target) return;
      setProductError(target[0], target[1], message);
      firstInvalid ||= target[0];
    });
    firstInvalid?.focus();
  };

  const openModal = (product = null) => {
    state.editingProductId = product?.id || null;
    elements.modalTitle.textContent = product ? "Editar produto" : "Novo produto";
    elements.saveProduct.textContent = product ? "Salvar alterações" : "Cadastrar produto";
    elements.productName.value = product?.name || "";
    elements.productDescription.value = product?.description || "";
    elements.productPrice.value = product?.price || "";
    elements.productCategory.value = product?.category || "";
    elements.productImage.value = product?.image || "";
    clearProductErrors();
    elements.modal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => elements.productName.focus(), 0);
  };

  const closeModal = () => {
    elements.modal.hidden = true;
    document.body.classList.remove("modal-open");
    state.editingProductId = null;
    elements.productForm.reset();
    clearProductErrors();
  };

  elements.avatar.addEventListener("error", imageFallback, { once: true });

  elements.editProfile.addEventListener("click", async () => {
    if (!state.editingProfile) {
      setProfileEditing(true);
      return;
    }

    if (!validateProfile()) return;

    let updated = false;
    setButtonBusy(elements.editProfile, true, "Salvando...");
    try {
      state.profile = await api.auth.update({
        name: elements.fullName.value.trim(),
        email: elements.email.value.trim(),
        phone: elements.phone.value.trim(),
      });
      updated = true;
      renderProfile();
      showToast("Dados atualizados com sucesso.");
    } catch (error) {
      showProfileApiErrors(error);
      showToast(error.message);
      if (error.status === 401) window.location.href = "../login/login.html";
    } finally {
      setButtonBusy(elements.editProfile, false);
      if (updated) setProfileEditing(false);
    }
  });

  profileFields.forEach((field) => {
    field.addEventListener("input", clearProfileErrors);
  });

  elements.productList.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const product = state.products.find((item) => item.id === target.dataset.productId);
    if (!product) return;

    if (target.dataset.action === "edit") {
      openModal(product);
      return;
    }
    if (target.dataset.action === "delete") {
      const confirmed = window.confirm(`Excluir definitivamente “${product.name}”?`);
      if (!confirmed) return;

      target.disabled = true;
      try {
        await api.products.remove(product.id);
        state.products = state.products.filter((item) => item.id !== product.id);
        renderProducts();
        showToast(`${product.name} foi excluído com sucesso.`);
      } catch (error) {
        target.disabled = false;
        showToast(error.message);
        if (error.status === 401) window.location.href = "../login/login.html";
      }
      return;
    }

    window.sessionStorage.setItem(
      "luminaSelectedProduct",
      JSON.stringify({
        ...product,
        rating: 4.8,
        reviewCount: 0,
        badge: product.status === "Inativo" ? "ESGOTADO" : "DESTAQUE",
      }),
    );
    window.location.href = `../products-details/product-details.html?id=${encodeURIComponent(product.id)}`;
  });

  elements.addProduct.addEventListener("click", () => openModal());
  elements.closeModal.addEventListener("click", closeModal);
  elements.modalBackdrop.addEventListener("click", closeModal);

  elements.productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateProduct()) return;

    const currentProduct = state.products.find(
      (product) => product.id === state.editingProductId,
    );
    const formProduct = {
      name: elements.productName.value.trim(),
      description: elements.productDescription.value.trim(),
      price: Number(elements.productPrice.value),
      category: elements.productCategory.value.trim(),
      image: elements.productImage.value.trim(),
      status: currentProduct?.status || "Ativo",
      stock: currentProduct?.stock ?? 10,
      originalPrice: currentProduct?.originalPrice ?? null,
      badge: currentProduct?.badge ?? null,
    };

    const editingId = state.editingProductId;
    setButtonBusy(elements.saveProduct, true, "Salvando...");
    try {
      const savedProduct = editingId
        ? await api.products.update(editingId, formProduct)
        : await api.products.create(formProduct);

      if (editingId) {
        state.products = state.products.map((item) =>
          item.id === editingId ? savedProduct : item,
        );
        showToast("Produto atualizado com sucesso.");
      } else {
        state.products = [savedProduct, ...state.products];
        showToast("Produto cadastrado com sucesso.");
      }

      if (!state.categories.some((item) => item.name === savedProduct.category)) {
        state.categories.push({ id: savedProduct.categoryId, name: savedProduct.category });
        state.categories.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        renderCategories();
      }

      closeModal();
      renderProducts();
    } catch (error) {
      showProductApiErrors(error);
      showToast(error.message);
      if (error.status === 401) window.location.href = "../login/login.html";
    } finally {
      setButtonBusy(elements.saveProduct, false);
    }
  });

  [
    elements.productName,
    elements.productDescription,
    elements.productPrice,
    elements.productCategory,
    elements.productImage,
  ].forEach((field) => field.addEventListener("input", clearProductErrors));

  elements.logout.addEventListener("click", () => {
    api?.auth.logout();
    window.location.href = "../login/login.html";
  });

  elements.bottomNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nav]");
    if (!button) return;

    if (button.dataset.nav === "profile") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.nav === "home") {
      window.location.href = "../home/index.html";
      return;
    }

    if (button.dataset.nav === "explore") {
      window.location.href = "../products/products.html";
      return;
    }

    showToast("Seu carrinho está vazio.");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) closeModal();
  });

  async function initializeDashboard() {
    if (!api || !api.auth.isAuthenticated()) {
      window.location.href = "../login/login.html";
      return;
    }

    renderProfile();
    renderProducts();

    try {
      const [profile, products, categories] = await Promise.all([
        api.auth.me(),
        api.products.mine(),
        api.categories.list(),
      ]);
      state.profile = profile;
      state.products = products;
      state.categories = categories;
      renderProfile();
      renderProducts();
      renderCategories();
    } catch (error) {
      showToast(error.message);
      if (error.status === 401) {
        api.auth.logout();
        window.setTimeout(() => {
          window.location.href = "../login/login.html";
        }, 700);
      }
    }
  }

  initializeDashboard();
})();
