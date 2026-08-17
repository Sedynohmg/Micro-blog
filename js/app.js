const API_URL = "http://localhost:3000/articles";

const articleForm = document.getElementById("article-form");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const contentInput = document.getElementById("content");
const imageInput = document.getElementById("image");
const listContent = document.getElementById("list-content");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const formMessage = document.getElementById("form-message");
const showAllBtn = document.getElementById("showAllBtn");
const publishButton = document.getElementById("publish-button");

let articles = [];
let showAllArticles = false;

// Mode administrateur
let isAdmin = false;

/*-------------MODE ADMINISTRATEUR------------------*/
function createAdminButton() {
  const publier = document.querySelector(".publier");
  if (!publier) {
    return;
  }
  if (document.getElementById("adminBtn")) {
    return;
  }
  const adminButton = document.createElement("button");
  adminButton.id = "adminBtn";
  adminButton.className = "admin-button";
  adminButton.innerHTML = `
    <i class="bi bi-shield-lock"></i>
    Administrateur
  `;
  publier.parentElement.appendChild(adminButton);
  adminButton.addEventListener("click", loginAdmin);
}
/*----------------  CONNEXION ADMINISTRATEUR-------------------------*/
function loginAdmin() {
  const password = prompt("Entrez le mot de passe administrateur :");
  if (!password) {
    return;
  }
  sessionStorage.setItem("adminPassword", password);
  isAdmin = true;
  updateAdminButtons();
  alert("Mode administrateur activé.");
}
/*-------- AFFICHER / CACHER LES BOUTONS SUPPRESSION---------------*/
function updateAdminButtons() {
  const deleteButtons = document.querySelectorAll(".delete-button");
  deleteButtons.forEach((button) => {
    if (isAdmin) {
      button.style.display = "inline-flex";
    } else {
      button.style.display = "none";
    }
  });
}

function showError(message) {
  if (!error) {
    return;
  }
  error.textContent = message;
  error.style.display = "block";
}

function hideError() {
  if (!error) {
    return;
  }
  error.textContent = "";
  error.style.display = "none";
}
function showLoading() {
  if (!loading) {
    return;
  }
  loading.style.display = "flex";
}
function hideLoading() {
  if (!loading) {
    return;
  }

  loading.style.display = "none";
}

/*------------- MESSAGE FORMULAIRE-------------------*/

function showFormMessage(message, type) {
  if (!formMessage) {
    return;
  }
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function clearFormMessage() {
  if (!formMessage) {
    return;
  }

  formMessage.textContent = "";
  formMessage.className = "form-message";
}

/*----------- PROTECTION CONTRE HTML--------------*/
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*---------CRÉATION D'UNE CARD------------------------*/

function createArticleCard(article) {
  const card = document.createElement("article");
  card.classList.add("card");
  const id = article.id;
  const title = article.title || "Sans titre";
  const category = article.category || "Autre";
  const content = article.content || "Aucun contenu.";
  const image = article.image || "";
  let imageHTML;
  if (image) {
    imageHTML = `
      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(title)}"
        loading="lazy"
      >
    `;
  } else {
    imageHTML = `
      <div class="no-image">
        <i class="bi bi-image"></i>
      </div>
    `;
  }

  /*----------  BOUTON SUPPRESSION-------------------*/

  let deleteButtonHTML = "";
  if (isAdmin) {
    deleteButtonHTML = `
      <button
        class="delete-button"
        data-id="${escapeHTML(id)}"
        type="button"
      >
        <i class="bi bi-trash"></i>
        Supprimer
      </button>
    `;
  }

  /*----------CONSTRUCTION DE LA CARD------------------------*/

  card.innerHTML = `
    <div class="card-image">
      ${imageHTML}
    </div>
    <div class="title">
      <h3>
        ${escapeHTML(title)}
      </h3>
    </div>
    <div class="card-container">
      <span>
        ${escapeHTML(category)}
      </span>
      <p>
        ${escapeHTML(content)}
      </p>
      ${deleteButtonHTML}
    </div>
  `;
  /*------------- GESTION IMAGE CASSÉE---------------*/

  const imageElement = card.querySelector(".card-image img");
  if (imageElement) {
    imageElement.addEventListener("error", function () {
      this.parentElement.innerHTML = `
          <div class="no-image">
            <i class="bi bi-image"></i>
          </div>
        `;
    });
  }

  return card;
}

/*---------------  AFFICHER LES ARTICLES--------------------*/

function displayArticles(articleList) {
  if (!listContent) {
    return;
  }
  listContent.innerHTML = "";
  if (!articleList || articleList.length === 0) {
    listContent.innerHTML = `
      <p class="empty">
        Aucun article disponible.
      </p>
    `;
    return;
  }
  articleList.forEach((article) => {
    const card = createArticleCard(article);
    listContent.appendChild(card);
  });
  addDeleteEvents();
}

async function getArticles() {
  showLoading();
  hideError();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Format des données incorrect.");
    }

    return data;
  } catch (err) {
    console.error("Erreur GET /articles :", err);
    showError(
      "Impossible de charger les articles. Vérifiez que le serveur fonctionne.",
    );

    return [];
  } finally {
    hideLoading();
  }
}

async function loadArticles() {
  articles = await getArticles();
  if (!showAllArticles) {
    const latestArticles = articles.slice(0, 2);

    displayArticles(latestArticles);
  } else {
    displayArticles(articles);
  }
}
/*----------- PUBLICATION D'UN ARTICLE-----------------*/
if (articleForm) {
  articleForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearFormMessage();
    hideError();
    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const content = contentInput.value.trim();
    const image = imageInput.value.trim();
    if (!title) {
      showFormMessage("Veuillez saisir un titre.", "error");
      titleInput.focus();
      return;
    }
    if (!category) {
      showFormMessage("Veuillez choisir une catégorie.", "error");
      categoryInput.focus();
      return;
    }
    if (!content) {
      showFormMessage("Veuillez écrire le contenu.", "error");
      contentInput.focus();
      return;
    }
    const article = {
      title: title,
      category: category,
      content: content,
      image: image || null,
    };
    /*---------------- ÉTAT CHARGEMENT DU BOUTON------------------*/
    publishButton.disabled = true;
    publishButton.innerHTML = `
        <i class="bi bi-arrow-repeat"></i>
        PUBLICATION...`;
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(article),
      });
      const text = await response.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }
      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP : ${response.status}`);
      }
      console.log("Article créé :", data);
      showFormMessage("Article publié avec succès !", "success");
      articleForm.reset();
    } catch (err) {
      console.error("Erreur POST /articles :", err);
      showFormMessage(
        err.message || "Impossible de publier l'article.",

        "error",
      );
    } finally {
      publishButton.disabled = false;
      publishButton.innerHTML = `
          <i class="bi bi-send"></i>
          PUBLIER L'ARTICLE`;
    }
  });
}
/*-------------BOUTON "VOIR TOUS / VOIR MOINS"------------*/

if (showAllBtn) {
  showAllBtn.addEventListener("click", async function () {
    showAllArticles = !showAllArticles;
    if (showAllArticles) {
      showAllBtn.textContent = "Voir moins";
      await loadArticles();
    } else {
      showAllBtn.textContent = "Voir tous";
      displayArticles(articles.slice(0, 2));
    }
  });
}

/*------------- SUPPRESSION D'ARTICLE-----------*/

async function deleteArticle(id) {
  if (!isAdmin) {
    alert("Vous devez être administrateur.");
    return;
  }
  const password = sessionStorage.getItem("adminPassword");
  if (!password) {
    isAdmin = false;
    updateAdminButtons();
    alert("Session administrateur expirée.");
    return;
  }
  const confirmation = confirm("Voulez-vous vraiment supprimer cet article ?");
  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-password": password,
      },
    });

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }
    if (!response.ok) {
      if (response.status === 403) {
        sessionStorage.removeItem("adminPassword");
        isAdmin = false;
        updateAdminButtons();
      }

      throw new Error(data.message || `Erreur HTTP : ${response.status}`);
    }
    console.log("Article supprimé :", data);
    await loadArticles();
  } catch (err) {
    console.error("Erreur suppression :", err);

    showError(err.message || "Impossible de supprimer l'article.");
  }
}

/*--------------- ÉVÉNEMENTS DES BOUTONS SUPPRIMER------------------*/

function addDeleteEvents() {
  const deleteButtons = document.querySelectorAll(".delete-button");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.dataset.id;
      if (!id) {
        console.error("ID article manquant.");

        return;
      }
      deleteArticle(id);
    });
  });
}
createAdminButton();
loadArticles();
