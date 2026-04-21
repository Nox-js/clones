# Guía de Configuración de Firebase – Paso a Paso

Esta guía te lleva de cero a tener la aplicación funcionando.

---

## Paso 1: Crear cuenta en Firebase

1. Ve a **https://firebase.google.com**
2. Haz clic en el botón azul **"Comenzar"** o **"Get Started"**
3. Inicia sesión con tu cuenta de Google (o crea una)

---

## Paso 2: Crear un proyecto Firebase

1. En la consola de Firebase (https://console.firebase.google.com), haz clic en **"Agregar proyecto"**
2. **Nombre del proyecto**: escribe algo como `tourneyhub-mi-nombre`
3. Google Analytics: puedes desactivarlo (no es necesario para esta app)
4. Haz clic en **"Crear proyecto"** y espera unos segundos

---

## Paso 3: Registrar la app web en Firebase

1. Dentro de tu proyecto, haz clic en el icono **`</>`** (Web)
2. **Apodo de la app**: escribe `TourneyHub`
3. ✅ Activa la casilla **"También configura Firebase Hosting"**
4. Haz clic en **"Registrar app"**
5. Aparecerá un bloque de código así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. **Copia estos valores** — los necesitarás en el Paso 7

---

## Paso 4: Activar Firebase Authentication

1. En el menú lateral izquierdo → **"Compilación"** → **"Authentication"**
2. Haz clic en **"Comenzar"**
3. Ve a la pestaña **"Sign-in method"** (o "Método de inicio de sesión")
4. Haz clic en **"Correo electrónico/contraseña"**
5. Activa el primer interruptor (**Habilitar**)
6. Haz clic en **"Guardar"**

---

## Paso 5: Crear la base de datos Firestore

1. En el menú lateral → **"Compilación"** → **"Firestore Database"**
2. Haz clic en **"Crear base de datos"**
3. Elige **"Comenzar en modo de producción"** (las reglas de seguridad ya están escritas)
4. Selecciona la **ubicación** más cercana a tus usuarios (ej: `eur3` para Europa)
5. Haz clic en **"Listo"**

### Desplegar las reglas de seguridad

Más adelante (cuando instales Firebase CLI) ejecuta:

```bash
firebase deploy --only firestore:rules
```

Esto aplicará el archivo `firestore.rules` que ya está escrito en este proyecto.

---

## Paso 6: Configurar Firebase Hosting

El hosting se configura automáticamente cuando ejecutas:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

Responde así:
- **Project**: elige tu proyecto de Firebase
- **Public directory**: `dist`
- **Single-page app**: `Yes`
- **GitHub actions**: `No` (por ahora)

---

## Paso 7: Crear el archivo de configuración

1. En la raíz del proyecto, copia el archivo `.env.example`:

```bash
cp .env.example .env
```

2. Abre `.env` con cualquier editor de texto y rellena los valores que copiaste en el Paso 3:

```env
VITE_FIREBASE_API_KEY=AIzaSy_TU_API_KEY_REAL
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

3. **IMPORTANTE**: El archivo `.env` ya está en `.gitignore` — nunca lo subas a GitHub.

---

## Sobre la seguridad de las claves de Firebase

**¿Son secretas las claves de Firebase?** No exactamente.

- La `apiKey` y demás valores son **identificadores públicos** — Firebase los necesita en el cliente para saber a qué proyecto conectarse
- La **seguridad real** la garantizan las **Firestore Security Rules** (`firestore.rules`)
- Las reglas ya escritas garantizan que:
  - Solo usuarios autenticados pueden leer/escribir datos
  - Cada usuario solo puede ver y modificar **sus propios torneos**
  - Nadie puede escribir datos maliciosos desde fuera

---

## Paso 8: Ejecutar el proyecto localmente

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Arrancar el servidor de desarrollo
npm run dev
```

La app se abrirá en `http://localhost:5173`

---

## Paso 9: Desplegar en producción

```bash
# 1. Construir la app para producción
npm run build

# 2. Desplegar en Firebase Hosting
firebase deploy
```

Firebase te dará una URL del tipo:
`https://tu-proyecto.web.app`

---

## Paso 10: Actualizar el proyecto Firebase en .firebaserc

Abre `.firebaserc` y cambia el `project_id`:

```json
{
  "projects": {
    "default": "tu-proyecto-id-real"
  }
}
```

---

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Arranca la app en local |
| `npm run build` | Genera los archivos para producción |
| `npm run test:run` | Ejecuta todos los tests |
| `firebase deploy` | Despliega todo (hosting + reglas) |
| `firebase deploy --only hosting` | Solo despliega el frontend |
| `firebase deploy --only firestore:rules` | Solo actualiza las reglas de seguridad |
