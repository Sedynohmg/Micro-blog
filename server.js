const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.static(path.join(__dirname, "public")));

const dataBase = mysql.createPool({
  host: process.env.DB_HOST,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

  port: Number(process.env.DB_PORT) || 3306,

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,
});

async function testDatabase() {
  try {
    const connection = await dataBase.getConnection();

    console.log("Base de données bien connectée.");

    connection.release();
  } catch (error) {
    console.error("Erreur de connexion à MySQL :", error.message);
  }
}

testDatabase();

app.get("/articles", async (req, res) => {
  try {
    const [articles] = await dataBase.query(
      `SELECT  id,  title,  category,  content, image,  created_at  FROM articles ORDER BY created_at DESC `,
    );
    res.status(200).json(articles);
  } catch (error) {
    console.error("Erreur GET /articles :", error);
    res.status(500).json({
      message: "Impossible de récupérer les articles.",
    });
  }
});

app.post("/articles", async (req, res) => {
  try {
    const { title, category, content, image } = req.body;

    /* VALIDATION */

    if (!title || !category || !content) {
      return res.status(400).json({
        message: "Le titre, la catégorie et le contenu sont obligatoires.",
      });
    }

    /* NETTOYAGE */

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanContent = content.trim();
    const cleanImage = image && image.trim() ? image.trim() : null;

    /* VALIDATION APRÈS TRIM */

    if (!cleanTitle || !cleanCategory || !cleanContent) {
      return res.status(400).json({
        message: "Veuillez remplir tous les champs obligatoires.",
      });
    }

    /* INSERTION */

    const [result] = await dataBase.query(
      ` INSERT INTO articles ( title, category,  content, image ) VALUES (?, ?, ?, ?) `,
      [cleanTitle, cleanCategory, cleanContent, cleanImage],
    );

    /* RÉCUPÉRATION ARTICLE */

    const [rows] = await dataBase.query(
      ` SELECT id,title,  category,  content,   image,     created_at FROM articles WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      message: "Article publié avec succès.",

      article: rows[0],
    });
  } catch (error) {
    console.error("Erreur POST /articles :", error);

    res.status(500).json({
      message: "Erreur lors de la publication.",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.delete("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminPassword = req.headers["x-admin-password"];
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(402).json({
        message: "Accès réfusé. Vous n'êtes pas administrateur.",
      });
    }

    if (!Number.isInteger(Number(id))) {
      return res.status(404).json({ message: "Id d'article invalide." });
    }
    const [article] = await dataBase.query(
      "SELECT id FROM articles WHERE id = ?",
      [id],
    );
    if (article.length === 0) {
      return res.status(404).json({
        message: "Article introuvable",
      });
    }

    await dataBase.query("DELETE FROM articles WHERE id = ?", [id]);
    res.status(200).json({ message: "Article supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /articles/:id :", error);

    res.status(500).json({
      message: "Erreur lors de la suppression.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
