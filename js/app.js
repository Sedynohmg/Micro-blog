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
    /*
      Affichage de tous les articles.
  */
    displayArticles(articles);
  }
}

/* =========================================================
   PUBLICATION D'UN ARTICLE
========================================================= */

if (articleForm) {
  articleForm.addEventListener("submit", async function (event) {
    /*
          Empêcher le rechargement de la page.
      */

    event.preventDefault();

    clearFormMessage();

    hideError();

    /* ---------------------------------------------------
         RÉCUPÉRER LES VALEURS
      --------------------------------------------------- */

    const title = titleInput.value.trim();

    const category = categoryInput.value;

    const content = contentInput.value.trim();

    const image = imageInput.value.trim();

    /* ---------------------------------------------------
         VALIDATION TITRE
      --------------------------------------------------- */

    if (!title) {
      showFormMessage("Veuillez saisir un titre.", "error");

      titleInput.focus();

      return;
    }

    /* ---------------------------------------------------
         VALIDATION CATÉGORIE
      --------------------------------------------------- */

    if (!category) {
      showFormMessage("Veuillez choisir une catégorie.", "error");

      categoryInput.focus();

      return;
    }

    /* ---------------------------------------------------
         VALIDATION CONTENU
      --------------------------------------------------- */

    if (!content) {
      showFormMessage("Veuillez écrire le contenu.", "error");

      contentInput.focus();

      return;
    }

    /* ---------------------------------------------------
         OBJET ARTICLE
      --------------------------------------------------- */

    const article = {
      title: title,

      category: category,

      content: content,

      image: image || null,
    };

    /* ---------------------------------------------------
         ÉTAT CHARGEMENT DU BOUTON
      --------------------------------------------------- */

    publishButton.disabled = true;

    publishButton.innerHTML = `

        <i class="bi bi-arrow-repeat"></i>

        PUBLICATION...

      `;

    try {
      /* -------------------------------------------------
           POST /articles
        ------------------------------------------------- */

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(article),
      });

      /*
            Lire la réponse.

            On utilise text() d'abord pour éviter
            "Unexpected end of JSON input" si le serveur
            renvoie une réponse vide.
        */

      const text = await response.text();

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      /*
            Vérifier le statut HTTP.
        */

      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP : ${response.status}`);
      }

      console.log("Article créé :", data);

      /* -------------------------------------------------
           SUCCÈS
        ------------------------------------------------- */

      showFormMessage("Article publié avec succès !", "success");

      /*
            Vider le formulaire.
        */

      articleForm.reset();
    } catch (err) {
      console.error("Erreur POST /articles :", err);

      showFormMessage(
        err.message || "Impossible de publier l'article.",

        "error",
      );
    } finally {
      /*
            Restaurer le bouton.
        */

      publishButton.disabled = false;

      publishButton.innerHTML = `

          <i class="bi bi-send"></i>

          PUBLIER L'ARTICLE

        `;
    }
  });
}

/* =========================================================
   BOUTON "VOIR TOUS / VOIR MOINS"
========================================================= */

if (showAllBtn) {
  showAllBtn.addEventListener("click", async function () {
    /*
          Inverser l'état.
      */

    showAllArticles = !showAllArticles;

    /*
          Si on veut afficher tous les articles.
      */

    if (showAllArticles) {
      showAllBtn.textContent = "Voir moins";

      /*
            On récupère les articles
            depuis la base de données.

            Cela permet notamment de récupérer
            les nouveaux articles publiés.
        */

      await loadArticles();
    } else {
      /*
          Si on veut revenir aux deux articles.
      */
      showAllBtn.textContent = "Voir tous";

      /*
            Pas besoin de refaire une requête.

            On utilise les articles déjà récupérés.
        */

      displayArticles(articles.slice(0, 2));
    }
  });
}

/* =========================================================
   SUPPRESSION D'ARTICLE
========================================================= */

async function deleteArticle(id) {
  /*
      Vérification administrateur.
  */

  if (!isAdmin) {
    alert("Vous devez être administrateur.");

    return;
  }

  /*
      Récupérer le mot de passe
      enregistré dans la session.
  */

  const password = sessionStorage.getItem("adminPassword");

  if (!password) {
    isAdmin = false;

    updateAdminButtons();

    alert("Session administrateur expirée.");

    return;
  }

  /*
      Demander confirmation.
  */

  const confirmation = confirm("Voulez-vous vraiment supprimer cet article ?");

  if (!confirmation) {
    return;
  }

  try {
    /*
        DELETE /articles/:id
    */

    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",

      headers: {
        "x-admin-password": password,
      },
    });

    /*
        Lire la réponse de manière sécurisée.
    */

    const text = await response.text();

    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }

    /*
        Vérifier la réponse.
    */

    if (!response.ok) {
      /*
          Si le serveur refuse l'accès,
          le mot de passe est probablement incorrect.
      */

      if (response.status === 403) {
        sessionStorage.removeItem("adminPassword");

        isAdmin = false;

        updateAdminButtons();
      }

      throw new Error(data.message || `Erreur HTTP : ${response.status}`);
    }

    /*
        Succès.
    */

    console.log("Article supprimé :", data);

    /*
        Recharger les articles.
    */

    await loadArticles();
  } catch (err) {
    console.error("Erreur suppression :", err);

    showError(err.message || "Impossible de supprimer l'article.");
  }
}

/* =========================================================
   ÉVÉNEMENTS DES BOUTONS SUPPRIMER
========================================================= */

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

/* =========================================================
   INITIALISATION
========================================================= */

createAdminButton();

loadArticles();
