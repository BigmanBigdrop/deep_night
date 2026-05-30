# 🎫 BLUEPRINT — Système de Billetterie VIP Privé
## Soirée Villa Bord de Mer — Samedi 06 Juin 2026
### Document de référence technique & logique — À lire AVANT tout code

---

> **Comment utiliser ce document :**  
> Suis les étapes dans l'ordre exact. Chaque section te dit QUOI faire, POURQUOI, et DANS QUEL ORDRE.  
> Tu ne passeras à VS Code qu'à l'Étape 5. Les étapes 1 à 4 se font dans les navigateurs (Supabase, Vercel).

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble du système](#1-vue-densemble-du-système)
2. [Architecture des données](#2-architecture-des-données)
3. [Étape 1 — Créer le projet Supabase](#étape-1--créer-le-projet-supabase)
4. [Étape 2 — Déployer le schéma SQL complet](#étape-2--déployer-le-schéma-sql-complet)
5. [Étape 3 — Configurer l'Auth Supabase (Admin uniquement)](#étape-3--configurer-lauth-supabase-admin-uniquement)
6. [Étape 4 — Créer le projet Vercel & connecter Supabase](#étape-4--créer-le-projet-vercel--connecter-supabase)
7. [Étape 5 — Initialiser le projet Next.js 16 en local (VS Code)](#étape-5--initialiser-le-projet-nextjs-16-en-local-vs-code)
8. [Étape 6 — Structure des fichiers de l'application](#étape-6--structure-des-fichiers-de-lapplication)
9. [Étape 7 — Implémentation fichier par fichier (ordre obligatoire)](#étape-7--implémentation-fichier-par-fichier-ordre-obligatoire)
10. [Étape 8 — Tests locaux avant déploiement](#étape-8--tests-locaux-avant-déploiement)
11. [Étape 9 — Déploiement sur Vercel](#étape-9--déploiement-sur-vercel)
12. [Checklist finale J-1 avant la soirée](#checklist-finale-j-1-avant-la-soirée)

---

## 1. Vue d'ensemble du système

### Le parcours complet d'un invité (de bout en bout)

```
[ADMIN sur /admin/dashboard]
        │
        │  Saisit le prénom + nom de l'invité
        │  → Génère une invitation en base (token UUIDv4, expiration 48h)
        │  → Copie le lien : https://ton-app.vercel.app/register/[token]
        │
        ▼
[INVITÉ reçoit le lien par WhatsApp/SMS/Email]
        │
        │  Ouvre /register/[token]
        │  → Le serveur valide le token (existe ? pas expiré ? pas déjà utilisé ?)
        │  → Si invalide → page /error avec message explicite
        │  → Si valide → affiche le formulaire d'inscription
        │
        │  Remplit : Prénom, Nom, Email (optionnel), Téléphone (optionnel)
        │  → Clique "Je m'inscris"
        │  → Transaction atomique PostgreSQL :
        │       1. Marque l'invitation comme utilisée (is_used = true)
        │       2. Crée le ticket avec qr_code_slug (UUIDv4 frais)
        │       → Si deux clics simultanés : le 2ème reçoit une erreur propre
        │  → Redirigé vers /ticket/[qr_code_slug]
        │
        ▼
[INVITÉ sur /ticket/[qr_code_slug]]
        │
        │  La page vérifie has_completed_survey
        │
        ├─ FALSE → Affiche le formulaire de préférences boissons :
        │            • Catégorie principale (boutons radio)
        │            • Sous-sélection conditionnelle (checkboxes alcools)
        │            • Champs texte libres (marques, allergies, etc.)
        │          → Validation → met à jour le ticket en base
        │          → QR code révélé dynamiquement côté client
        │
        └─ TRUE  → Affiche directement le QR code (qrcode.react)
                   + Nom de l'invité + Date de l'événement
                   + Message "Gardez cet écran ouvert à l'entrée"

[SOIR DE LA SOIRÉE — ADMIN sur /admin/scanner]
        │
        │  Interface smartphone, accès caméra
        │  → Scanne le QR code de l'invité
        │  → Appelle la Server Function validateCheckIn(slug)
        │  → Vérifie : session admin active ? slug valide ?
        │
        ├─ Valide (1er scan)   → Fond VERT  + "Bienvenue [Prénom Nom]"
        ├─ Déjà scanné         → Fond ORANGE + "⚠️ Déjà scanné à 21h34"
        └─ Slug inconnu        → Fond ROUGE  + "❌ Code invalide"
```

---

## 2. Architecture des données

### Les deux tables principales

#### Table `invitations`
Représente un **lien d'invitation envoyé par l'admin à un invité**.  
Un lien = une invitation = un usage maximum.

| Colonne | Type | Explication |
|---|---|---|
| `id` | `uuid` PRIMARY KEY | Identifiant interne, généré automatiquement |
| `token` | `uuid` UNIQUE NOT NULL | C'est ce qui va dans l'URL `/register/[token]`. Généré par `gen_random_uuid()`. |
| `guest_name` | `text` NOT NULL | Le nom saisi par l'admin au moment de la génération |
| `created_at` | `timestamptz` | Date/heure de création de l'invitation |
| `expires_at` | `timestamptz` | Date d'expiration (créée_at + 48 heures par défaut) |
| `is_used` | `boolean` DEFAULT false | Passe à `true` quand l'invité finalise son inscription. Verrou anti-doublon. |
| `created_by` | `uuid` FK → auth.users | L'ID de l'admin qui a créé l'invitation (pour traçabilité) |

#### Table `tickets`
Représente le **ticket définitif de l'invité**. Créé uniquement après inscription réussie.

| Colonne | Type | Explication |
|---|---|---|
| `id` | `uuid` PRIMARY KEY | Identifiant interne |
| `invitation_id` | `uuid` FK → invitations UNIQUE | Lien vers l'invitation source. UNIQUE garantit 1 ticket par invitation. |
| `qr_code_slug` | `uuid` UNIQUE NOT NULL | Ce qui est encodé dans le QR code. Différent du token d'invitation. |
| `guest_first_name` | `text` NOT NULL | Prénom saisi à l'inscription |
| `guest_last_name` | `text` NOT NULL | Nom saisi à l'inscription |
| `guest_email` | `text` | Email (optionnel) |
| `guest_phone` | `text` | Téléphone (optionnel) |
| `created_at` | `timestamptz` | Date de création du ticket |
| `has_completed_survey` | `boolean` DEFAULT false | Passe à `true` quand les préférences boissons sont soumises |
| `drink_category` | `text` | Ex: "spirits", "wine_champagne", "beer", "softs" |
| `drink_spirits_selection` | `text[]` | Tableau : ["whisky", "gin"] si alcools forts choisis |
| `drink_free_text` | `text` | Champ libre : marques, dilutions, allergies |
| `checked_in` | `boolean` DEFAULT false | Passe à `true` au scan de la porte |
| `checked_in_at` | `timestamptz` | Timestamp exact du scan |

### La fonction stockée PostgreSQL (RPC)
Appelée `register_guest_atomically`. C'est le cœur anti-fraude du système.  
Elle s'exécute en une seule transaction ACID :
1. Vérifie que le token existe, n'est pas expiré, et `is_used = false`
2. Met `is_used = true` sur l'invitation (avec un `FOR UPDATE` pour verrouiller la ligne)
3. Crée le ticket
4. Retourne le `qr_code_slug` pour la redirection

Si deux requêtes arrivent en même temps avec le même token, PostgreSQL garantit que l'une réussit et l'autre reçoit une erreur car `is_used` sera déjà `true`.

---

## Étape 1 — Créer le projet Supabase

**Où :** https://supabase.com → "New project"  
**Durée estimée :** 5 minutes

### Actions à faire :
1. Connecte-toi sur [supabase.com](https://supabase.com)
2. Clique **"New project"**
3. Remplis :
   - **Name :** `vip-party-june-2026` (ou ce que tu veux)
   - **Database Password :** Génère un mot de passe fort → **COPIE-LE quelque part**
   - **Region :** Choisis la plus proche (ex: West EU - Ireland pour la France)
   - **Plan :** Free
4. Attends ~2 minutes que le projet soit prêt
5. Note les informations suivantes (tu en auras besoin pour les variables d'environnement) :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : visible dans Settings → API
   - **service_role key** : visible dans Settings → API (⚠️ ne jamais l'exposer côté client)

---

## Étape 2 — Déployer le schéma SQL complet

**Où :** Supabase Dashboard → SQL Editor  
**Durée estimée :** 10 minutes

### Actions à faire :
1. Dans ton projet Supabase, clique **"SQL Editor"** dans la sidebar gauche
2. Clique **"New query"**
3. Copie-colle le script SQL complet (fourni dans le prochain livrable : `schema.sql`)
4. Clique **"Run"** (ou Ctrl+Enter)
5. Vérifie dans **"Table Editor"** que les tables `invitations` et `tickets` sont créées

### Ce que le script SQL va créer (dans l'ordre) :
```
1. Extension pgcrypto (pour gen_random_uuid() si pas déjà activée)
2. Table invitations (avec index sur token et is_used)
3. Table tickets (avec index sur qr_code_slug et checked_in)
4. Fonction stockée register_guest_atomically(...)
5. Politiques RLS sur invitations (admins only)
6. Politiques RLS sur tickets (admins + accès public limité par slug)
7. Trigger pour auto-update de updated_at
```

---

## Étape 3 — Configurer l'Auth Supabase (Admin uniquement)

**Où :** Supabase Dashboard → Authentication  
**Durée estimée :** 5 minutes

### Principe :
- Les invités n'ont **PAS** de compte Supabase. Ils naviguent via tokens/slugs.
- Seuls les admins (toi + co-organisateurs) ont un compte.

### Actions à faire :
1. Va dans **Authentication → Users**
2. Clique **"Add user"** → **"Create new user"**
3. Entre ton email admin et un mot de passe fort
4. Répète pour chaque co-organisateur qui aura accès au dashboard/scanner
5. Va dans **Authentication → Providers** → vérifie que **Email** est activé
6. Va dans **Authentication → URL Configuration** :
   - **Site URL :** `http://localhost:3000` (pour le dev local)
   - Tu le changeras en `https://ton-app.vercel.app` lors du déploiement

### Désactiver l'inscription publique :
1. Va dans **Authentication → Providers → Email**
2. Désactive **"Enable email confirmations"** (pour simplifier le dev)
3. Dans les **Project Settings → Auth**, cherche **"Disable signup"** et active-le
   → Cela empêche n'importe qui de créer un compte via l'API

---

## Étape 4 — Créer le projet Vercel & connecter Supabase

**Où :** https://vercel.com  
**Durée estimée :** 5 minutes (à faire APRÈS avoir le code sur GitHub)

> **Note :** Cette étape se fait APRÈS l'étape 5 (création du code). On la met ici pour la logique, mais tu y reviendras.

### Actions à faire :
1. Va sur [vercel.com](https://vercel.com) → **"Add New Project"**
2. Importe ton repo GitHub (créé à l'étape 5)
3. Dans **Environment Variables**, ajoute :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
   ```
4. **Framework Preset :** Next.js (auto-détecté)
5. Clique **Deploy**

---

## Étape 5 — Initialiser le projet Next.js 16 en local (VS Code)

**Où :** Terminal VS Code  
**Durée estimée :** 10 minutes

### Prérequis à installer si pas déjà fait :
- Node.js 22+ : https://nodejs.org (télécharge la version LTS)
- Git : https://git-scm.com
- VS Code : https://code.visualstudio.com

### Commandes à exécuter dans le terminal VS Code :

```bash
# 1. Créer le projet Next.js 16 avec les options recommandées
npx create-next-app@latest vip-party-ticketing \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# 2. Aller dans le dossier
cd vip-party-ticketing

# 3. Installer les dépendances nécessaires
npm install @supabase/supabase-js @supabase/ssr qrcode.react
npm install -D @types/node

# 4. Ouvrir dans VS Code
code .
```

### Créer le fichier `.env.local` à la racine :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...ton_anon_key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...ton_service_role_key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ Ce fichier ne doit JAMAIS être committé sur GitHub. Vérifie que `.env.local` est dans `.gitignore` (il l'est par défaut avec create-next-app).

### Modifier `next.config.ts` pour activer le PPR :
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,           // Partial Pre-Rendering
    reactCompiler: true, // React Compiler (pas de useMemo/useCallback manuels)
  },
};

export default nextConfig;
```

---

## Étape 6 — Structure des fichiers de l'application

Voici **l'arborescence complète** à créer. Chaque fichier sera implémenté dans l'étape suivante.

```
vip-party-ticketing/
├── .env.local                          ← Variables d'environnement (jamais sur Git)
├── next.config.ts                      ← Config Next.js avec PPR activé
├── package.json
├── tsconfig.json
│
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               ← Client Supabase côté NAVIGATEUR
│   │   │   ├── server.ts               ← Client Supabase côté SERVEUR (cookies)
│   │   │   └── admin.ts                ← Client Supabase avec SERVICE ROLE (admin only)
│   │   └── types.ts                    ← Types TypeScript partagés (Ticket, Invitation...)
│   │
│   ├── app/
│   │   ├── layout.tsx                  ← Layout racine (font, metadata globale)
│   │   ├── page.tsx                    ← Page d'accueil (redirige vers /admin si connecté)
│   │   ├── error/
│   │   │   └── page.tsx                ← Page d'erreur générique
│   │   │
│   │   ├── actions.ts                  ← 🔑 TOUTES les Server Functions
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx              ← Layout admin (vérifie la session, redirige si non connecté)
│   │   │   ├── login/
│   │   │   │   └── page.tsx            ← Formulaire de connexion admin
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            ← Génération invitations + stats boissons
│   │   │   └── scanner/
│   │   │       └── page.tsx            ← Interface scan QR code
│   │   │
│   │   ├── register/
│   │   │   └── [token]/
│   │   │       └── page.tsx            ← Formulaire d'inscription invité
│   │   │
│   │   └── ticket/
│   │       └── [qr_code_slug]/
│   │           └── page.tsx            ← Ticket + survey boissons + QR code
│   │
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   └── Card.tsx
│       ├── DrinkSurveyForm.tsx         ← Formulaire boissons conditionnel (Client Component)
│       ├── QRCodeDisplay.tsx           ← Affichage du QR code (Client Component)
│       └── QRScanner.tsx              ← Scanner caméra (Client Component)
```

---

## Étape 7 — Implémentation fichier par fichier (ordre obligatoire)

> **IMPORTANT :** Respecte cet ordre. Chaque fichier dépend du précédent.

### Ordre d'implémentation :

```
[1] schema.sql          → Base de données (Supabase SQL Editor)
[2] src/lib/types.ts    → Types TypeScript (fondation de tout)
[3] src/lib/supabase/   → Les 3 clients Supabase
[4] src/app/actions.ts  → Server Functions (logique métier)
[5] src/app/admin/login/page.tsx          → Connexion admin
[6] src/app/admin/layout.tsx              → Protection routes admin
[7] src/app/admin/dashboard/page.tsx      → Dashboard admin
[8] src/app/register/[token]/page.tsx     → Inscription invité
[9] src/components/DrinkSurveyForm.tsx    → Formulaire boissons
[10] src/components/QRCodeDisplay.tsx     → Affichage QR code
[11] src/app/ticket/[qr_code_slug]/page.tsx → Page ticket
[12] src/components/QRScanner.tsx         → Scanner caméra
[13] src/app/admin/scanner/page.tsx       → Page scanner admin
```

---

## Étape 8 — Tests locaux avant déploiement

**Durée estimée :** 15-20 minutes

### Lancer le serveur de dev :
```bash
npm run dev
# Ouvre http://localhost:3000
```

### Scénario de test complet à réaliser :

**Test 1 — Connexion admin**
- Aller sur `/admin/login`
- Se connecter avec les credentials créés dans Supabase Auth
- ✅ Vérifier la redirection vers `/admin/dashboard`

**Test 2 — Génération d'invitation**
- Sur le dashboard, entrer "Jean Dupont"
- ✅ Vérifier qu'une invitation apparaît dans la liste
- ✅ Copier le lien `/register/[token]`

**Test 3 — Inscription invité**
- Ouvrir le lien en navigation privée (simule un utilisateur non-admin)
- ✅ Vérifier que le formulaire s'affiche
- Remplir et soumettre
- ✅ Vérifier la redirection vers `/ticket/[slug]`

**Test 4 — Anti-doublon (race condition)**
- Sur la page d'inscription, ouvrir DevTools → Network
- Soumettre le formulaire deux fois rapidement (double-clic)
- ✅ Vérifier qu'un seul ticket est créé en base

**Test 5 — Formulaire boissons**
- Sur `/ticket/[slug]`, vérifier que le QR code est masqué
- Remplir le formulaire, soumettre
- ✅ Vérifier que le QR code apparaît

**Test 6 — Scan à la porte**
- Aller sur `/admin/scanner` (sur mobile ou en mode responsive DevTools)
- Utiliser la caméra pour scanner le QR code du ticket
- ✅ Vérifier affichage vert "Bienvenue Jean Dupont"
- Scanner à nouveau
- ✅ Vérifier affichage orange "Déjà scanné à XX:XX"

**Test 7 — Sécurité slug**
- Extraire le `qr_code_slug` de l'URL
- Faire un appel direct à l'API sans session admin
- ✅ Vérifier réponse 403

---

## Étape 9 — Déploiement sur Vercel

**Durée estimée :** 10 minutes

### Actions :

```bash
# Dans le terminal VS Code
git init
git add .
git commit -m "feat: initial VIP ticketing system"

# Créer un repo sur GitHub (github.com → New repository)
# Puis :
git remote add origin https://github.com/ton-username/vip-party-ticketing.git
git branch -M main
git push -u origin main
```

Ensuite, retourne sur Vercel (Étape 4) pour connecter le repo et configurer les variables d'environnement.

### Après le déploiement :
1. Retourne dans **Supabase → Authentication → URL Configuration**
2. Ajoute `https://ton-app.vercel.app` dans **Redirect URLs**
3. Mets à jour **Site URL** avec l'URL Vercel
4. Mets à jour la variable `NEXT_PUBLIC_APP_URL` dans Vercel

---

## Checklist finale J-1 avant la soirée

### Dans Supabase :
- [ ] Toutes les invitations générées pour les invités attendus
- [ ] Vérifier dans Table Editor que les tickets existent pour les invités inscrits
- [ ] Vérifier dans Table Editor que `has_completed_survey = true` pour chaque ticket inscrit

### Dans l'application :
- [ ] Tester le scanner sur le téléphone réel qui sera utilisé à l'entrée
- [ ] S'assurer que le téléphone du scanner a une session admin active
- [ ] Tester en mode avion que le QR code reste visible (il est généré côté client)

### Logistique :
- [ ] Le QR code est basé sur le `qr_code_slug` (UUID) — il ne change pas
- [ ] Les invités peuvent faire une capture d'écran de leur ticket (recommandé)
- [ ] Prévoir un chargeur pour le téléphone de scan

---

## 🔑 Résumé des concepts de sécurité

| Menace | Protection mise en place |
|---|---|
| Quelqu'un génère ses propres invitations | RLS : seuls les admins connectés peuvent INSERT dans `invitations` |
| Double-clic / soumission simultanée | Transaction atomique PostgreSQL avec `FOR UPDATE` |
| Quelqu'un utilise un slug volé pour scanner | `validateCheckIn()` vérifie la session Supabase admin avant tout |
| Accès au dashboard admin sans compte | Middleware Next.js + `admin/layout.tsx` redirige vers `/admin/login` |
| Ticket QR code exposé avant survey | Le `qr_code_slug` n'est jamais transmis avant `has_completed_survey = true` |
| Invitation expirée utilisée | La fonction RPC vérifie `expires_at > NOW()` avant toute action |

---

## 📦 Dépendances npm à installer

```bash
npm install @supabase/supabase-js @supabase/ssr qrcode.react
```

### Dépendances pour le scanner QR :
```bash
npm install html5-qrcode
# ou (alternative plus légère)
npm install @zxing/library
```

> **Recommandation :** Utilise `html5-qrcode` — meilleur support mobile, API simple.

---

## 🗓️ Planning réaliste sur 3 heures

| Durée | Tâche |
|---|---|
| 0:00 – 0:15 | Étapes 1, 2, 3 (Supabase : projet + SQL + Auth) |
| 0:15 – 0:25 | Étape 5 (Init Next.js, install deps, config) |
| 0:25 – 0:50 | Fichiers [1] à [4] : SQL, types, clients Supabase, actions.ts |
| 0:50 – 1:20 | Fichiers [5] à [7] : Auth admin, layout, dashboard |
| 1:20 – 1:50 | Fichiers [8] à [11] : Register, survey, QR code, ticket |
| 1:50 – 2:20 | Fichiers [12] à [13] : Scanner + page scanner |
| 2:20 – 2:40 | Étape 8 : Tests locaux complets |
| 2:40 – 3:00 | Étape 9 : Push GitHub + déploiement Vercel |

---

*Ce document est ton guide de référence. Ne passe jamais à l'étape N+1 sans avoir validé l'étape N.*  
*Prochain livrable : Le fichier `schema.sql` complet avec chaque ligne commentée.*
