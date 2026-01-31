# 🚗 AutoSense (propulsé par Axle)
### Le Moteur de Storytelling IA Agentique pour l'Industrie Automobile.

![Bannière Projet](https://i.ibb.co/N2RYSmXR/Screenshot-2026-01-31-at-19-05-51-AXLE-Dealership-OS.png)

---

## 💡 La Problématique
Les fiches techniques automobiles sont arides. Une liste de spécifications brutes (220ch, coffre de 480L, 5 étoiles sécu) échoue à créer un lien émotionnel avec l'acheteur. Les concessionnaires modernes peinent à transformer des données techniques complexes en récits engageants à grande échelle.

## 🚀 La Solution
**AutoSense** est une pipeline d'IA autonome qui transforme les spécifications techniques du véhicule en une expérience web immersive et cinématique.
Plus qu'une liste de caractéristiques, AutoSense raconte une histoire. L'IA adapte la narration en fonction du "Persona" du véhicule, génère des visuels photoréalistes et construit un **Jumeau Numérique 3D** interactif que les acheteurs peuvent explorer directement dans leur navigateur.

---

## 🤖 L'Architecture à 7 Agents
Il ne s'agit pas d'une simple interface pour ChatGPT. Nous avons conçu une **orchestration multi-agents** complexe où des agents spécialisés collaborent :

1.  **🕵️ Agent d'Ingestion (Le Chercheur) :** Récupère les données techniques brutes et vérifie la crédibilité du véhicule en croisant 50+ récompenses (NHTSA, KBB, MotorTrend).
2.  **🧠 Agent Analyste (Le Stratège) :** Analyse les specs pour déterminer le "Persona Acheteur" (ex: "La Famille Éco-consciente" vs "Le Chercheur d'Adrénaline").
3.  **🎬 Agent Réalisateur (Le Planificateur) :** Construit le storyboard et décide intelligemment quand utiliser des diapositives cinématiques 2D et quand déclencher les modes interactifs 3D (Sécurité, Performance, Utilité).
4.  **✍️ Agent Scénariste (Le Créatif) :** Rédige des scripts de voix-off émotionnels, synchronisés au tempo.
5.  **🎨 Agent Visualiseur (L'Artiste) :** Génère des arrière-plans contextuels via **Pollinations.ai** et utilise la Vision par Ordinateur pour placer les hotspots interactifs.
6.  **🎧 Agent Audio (La Voix) :** Synthétise une voix neurale (TTS) ultra-réaliste et génère les sous-titres.
7.  **📦 Agent QA (L'Assembleur) :** Valide tous les assets et compile le JSON final optimisé pour le frontend.

---

## ✨ Fonctionnalités Clés

### 1. Le Dashboard Axle (SaaS B2B)
Un centre de commande professionnel pour les concessionnaires.
*   **Gestion d'Inventaire :** CRUD complet avec synchronisation temps réel.
*   **Studio Wizard :** Un flux de création en 3 étapes pour générer les histoires IA.
*   **Visualisation du Cerveau IA :** Suivi en temps réel du travail des agents via Supabase Realtime (WebSockets).

### 2. Le Player AutoSense (Expérience Client)
*   **Jumeau Numérique 3D :** Un modèle WebGL qui réagit aux données réelles.
    *   *Mode Performance :* Vue Rayons-X montrant la chaleur moteur et les flux d'énergie.
    *   *Mode Sécurité :* Vue Holographique visualisant les capteurs Lidar et les angles morts.
    *   *Mode Utilité :* Vue "Blueprint" (Plan) avec mesures dimensionnelles en temps réel.
*   **Chatbot Contextuel (RAG) :** L'acheteur peut demander "Quelle est l'autonomie réelle ?" et l'IA répond en utilisant les données spécifiques de CE véhicule.

---

## 🛠️ Stack Technique

### Frontend
*   **Framework :** React 18 (Vite)
*   **Styling :** Tailwind CSS v4 + HeroUI (NextUI)
*   **Moteur 3D :** Three.js + React Three Fiber (R3F) + Drei
*   **State Management :** Redux Toolkit (SaaS) + Zustand (Player 3D)
*   **Animations :** Framer Motion

### Backend & IA
*   **Runtime :** Node.js (Express)
*   **Base de Données :** Supabase (PostgreSQL + Realtime + Storage)
*   **Orchestration :** Pipeline d'agents asynchrones customisée
*   **Modèles IA :**
    *   **LLM :** Groq (GPT OSS 120B - pour la vitesse et le raisonnement)
    *   **Image :** Pollinations / nanobanana
    *   **Recherche :** Tavily API (Vérification factuelle)
    *   **Data :** RapidAPI (Spécifications Automobiles)

---

## ⚡ Installation et Démarrage

### Prérequis
*   Node.js (v18+)
*   Un projet Supabase configuré

### 1. Cloner le Repository
```bash
git clone https://github.com/xiba01/AutoSense-Hackathon-Capgemini.git

cd autosense
```

### 2. Installer les Dépendances
Nous utilisons un script racine pour installer à la fois le Client et le Serveur.
```bash
npm run install-all
```

### 3. Variables d'Environnement
Créez un fichier `.env` dans `./server` et `./client`.

**Serveur (`./server/.env`)**
```env
PORT=3000
SUPABASE_URL=votre_url_supabase
SUPABASE_KEY=votre_cle_service_role
POLLINATIONS_API_KEY=vote_cle_pollinations
GROQ_API_KEY=votre_cle_groq
TAVILY_API_KEY=votre_cle_tavily
RAPIDAPI_HOST=car-specs.p.rapidapi.com
RAPIDAPI_KEY=votre_cle_rapidapi
DEEPGRAM_API_KEY=votre_cle_deepgram
```

**Client (`./client/.env`)**
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_RAPIDAPI_HOST=car-specs.p.rapidapi.com
VITE_RAPIDAPI_KEY=votre_cle_rapidapi

```

### 4. Lancer l'Application
Utilisez `concurrently` pour lancer le Backend (Port 3000) et le Frontend (Port 5173) avec une seule commande.
```bash
npm run dev
```

---

## 📺 Démonstration

*   **Lien Vidéo :** [Insérer le lien vers la Release GitHub ou YouTube ici]
*   **Slide de Présentation :** Voir le fichier `OnePager.pdf` à la racine de ce repo.

---

## 👥 L'Équipe
*   **Membre 1 :** Architecture Full Stack / SaaS
*   **Membre 2 :** Frontend / Expérience 3D
*   **Membre 3 :** Ingénierie IA / Backend Pipeline
*   **Membre 4 :** Direction Artistique / UI/UX

---

*Projet réalisé pour le Hackathon GenAI & Agentic AI 2026 - Capgemini Morocco.*
