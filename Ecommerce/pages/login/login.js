(() => {
  "use strict";

  const api = window.luminaApi;
  const state = {
    mode: "login",
    loading: false,
    passwordVisible: false,
  };

  const elements = {
    form: document.querySelector("#account-form"),
    tabs: [...document.querySelectorAll(".mode-tab")],
    subtitle: document.querySelector("#page-subtitle"),
    nameGroup: document.querySelector("#name-group"),
    confirmGroup: document.querySelector("#confirm-group"),
    emailHint: document.querySelector("#email-hint"),
    forgotPassword: document.querySelector("#forgot-password"),
    submitButton: document.querySelector("#submit-button"),
    submitLabel: document.querySelector(".submit-label"),
    loadingLabel: document.querySelector(".loading-label"),
    switchText: document.querySelector("#switch-text"),
    switchMode: document.querySelector("#switch-mode"),
    togglePassword: document.querySelector("#toggle-password"),
    eyeOpen: document.querySelector(".eye-open"),
    eyeClosed: document.querySelector(".eye-closed"),
    backButton: document.querySelector("#back-button"),
    message: document.querySelector("#form-message"),
    messageText: document.querySelector("#form-message p"),
    fields: {
      name: document.querySelector("#name"),
      email: document.querySelector("#email"),
      password: document.querySelector("#password"),
      confirm: document.querySelector("#confirm-password"),
    },
    errors: {
      name: document.querySelector("#name-error"),
      email: document.querySelector("#email-error"),
      password: document.querySelector("#password-error"),
      confirm: document.querySelector("#confirm-error"),
    },
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const hideMessage = () => {
    elements.message.hidden = true;
    elements.message.classList.remove("is-success", "is-info");
    elements.messageText.textContent = "";
  };

  const showMessage = (text, type = "error") => {
    elements.messageText.textContent = text;
    elements.message.classList.toggle("is-success", type === "success");
    elements.message.classList.toggle("is-info", type === "info");
    elements.message.querySelector(".message-icon").textContent = type === "error" ? "!" : "✓";
    elements.message.hidden = false;
  };

  const clearFieldError = (fieldName) => {
    const field = elements.fields[fieldName];
    const error = elements.errors[fieldName];

    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    field.closest(".input-shell").classList.remove("has-error");
    error.textContent = "";
    error.hidden = true;
  };

  const setFieldError = (fieldName, message) => {
    const field = elements.fields[fieldName];
    const error = elements.errors[fieldName];

    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", error.id);
    field.closest(".input-shell").classList.add("has-error");
    error.textContent = message;
    error.hidden = false;
  };

  const clearErrors = () => {
    Object.keys(elements.fields).forEach(clearFieldError);
    hideMessage();
  };

  const setMode = (mode) => {
    state.mode = mode;
    clearErrors();

    const isSignup = mode === "signup";
    elements.nameGroup.hidden = !isSignup;
    elements.confirmGroup.hidden = !isSignup;
    elements.emailHint.hidden = isSignup;
    elements.forgotPassword.hidden = isSignup;
    elements.subtitle.textContent = isSignup ? "Crie sua conta" : "Bem-vindo de volta";
    elements.submitLabel.textContent = isSignup ? "Criar conta" : "Entrar";
    elements.switchText.textContent = isSignup ? "Já tem uma conta?" : "Não tem uma conta?";
    elements.switchMode.textContent = isSignup ? "Entrar" : "Cadastre-se";
    elements.fields.password.autocomplete = isSignup ? "new-password" : "current-password";

    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
  };

  const validate = () => {
    clearErrors();
    const values = {
      name: elements.fields.name.value.trim(),
      email: elements.fields.email.value.trim(),
      password: elements.fields.password.value,
      confirm: elements.fields.confirm.value,
    };
    let firstInvalidField = null;

    const invalidate = (fieldName, message) => {
      setFieldError(fieldName, message);
      firstInvalidField ||= elements.fields[fieldName];
    };

    if (state.mode === "signup" && !values.name) {
      invalidate("name", "Nome é obrigatório.");
    }

    if (!values.email) {
      invalidate("email", "E-mail é obrigatório.");
    } else if (!emailPattern.test(values.email)) {
      invalidate("email", "Digite um e-mail válido.");
    }

    if (!values.password) {
      invalidate("password", "Senha é obrigatória.");
    } else if (values.password.length < 6) {
      invalidate("password", "A senha deve ter ao menos 6 caracteres.");
    }

    if (state.mode === "signup" && values.password !== values.confirm) {
      invalidate("confirm", "As senhas não coincidem.");
    }

    firstInvalidField?.focus();
    return !firstInvalidField;
  };

  const setLoading = (isLoading) => {
    state.loading = isLoading;
    elements.submitButton.disabled = isLoading;
    elements.submitLabel.hidden = isLoading;
    elements.loadingLabel.hidden = !isLoading;
  };

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  elements.switchMode.addEventListener("click", () => {
    setMode(state.mode === "login" ? "signup" : "login");
  });

  elements.togglePassword.addEventListener("click", () => {
    state.passwordVisible = !state.passwordVisible;
    const inputType = state.passwordVisible ? "text" : "password";
    elements.fields.password.type = inputType;
    elements.fields.confirm.type = inputType;
    elements.eyeOpen.hidden = state.passwordVisible;
    elements.eyeClosed.hidden = !state.passwordVisible;
    elements.togglePassword.setAttribute("aria-pressed", String(state.passwordVisible));
    elements.togglePassword.setAttribute(
      "aria-label",
      state.passwordVisible ? "Ocultar senha" : "Mostrar senha",
    );
  });

  Object.entries(elements.fields).forEach(([fieldName, field]) => {
    field.addEventListener("input", () => {
      clearFieldError(fieldName);
      hideMessage();
    });
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.loading || !validate()) return;

    setLoading(true);
    let succeeded = false;

    try {
      if (!api) throw new Error("O cliente da API não foi carregado.");

      if (state.mode === "login") {
        await api.auth.login({
          email: elements.fields.email.value.trim(),
          password: elements.fields.password.value,
        });
      } else {
        await api.auth.register({
          name: elements.fields.name.value.trim(),
          email: elements.fields.email.value.trim(),
          password: elements.fields.password.value,
        });
      }

      succeeded = true;
      showMessage(
        state.mode === "login"
          ? "Login realizado. Abrindo seu Dashboard..."
          : "Conta criada. Abrindo seu Dashboard...",
        "success",
      );
      window.setTimeout(() => {
        window.location.href = "../dashboard/dashboard.html";
      }, 550);
    } catch (error) {
      const fields = error.fields || {};
      Object.entries(fields).forEach(([fieldName, message]) => {
        if (elements.fields[fieldName]) setFieldError(fieldName, message);
      });
      showMessage(error.message || "Não foi possível concluir a autenticação.");
    } finally {
      if (!succeeded) setLoading(false);
    }
  });

  elements.forgotPassword.addEventListener("click", () => {
    const email = elements.fields.email.value.trim();

    if (email && !emailPattern.test(email)) {
      setFieldError("email", "Digite um e-mail válido para continuar.");
      elements.fields.email.focus();
      return;
    }

    showMessage(
      email
        ? `A recuperação para ${email} é apenas ilustrativa e nenhum e-mail foi enviado.`
        : "Informe seu e-mail para simular a recuperação de senha.",
      "info",
    );
    if (!email) elements.fields.email.focus();
  });

  elements.backButton.addEventListener("click", () => {
    window.location.href = "../home/index.html";
  });

  setMode("login");
})();
