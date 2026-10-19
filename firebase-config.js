/* SaludPlus · conexión con Firebase AI Logic (Gemini)
   Pega aquí los datos de tu app web de Firebase (Configuración del proyecto > Tus apps > SDK setup > Config).
   Estos datos NO son secretos (son públicos en cualquier app web); lo que protege tu proyecto es App Check
   y la restricción de la clave por dominio. Mira FIREBASE-PASO-A-PASO.txt. */
window.SP_FIREBASE = {
  apiKey: 'AIzaSyBAQOGSGfDf4W043ycHB2OP0Tux0Ms9Of4',            // ej. 'AIzaSy...'
  authDomain: 'saludplus-62ace.firebaseapp.com',        // ej. 'mi-proyecto.firebaseapp.com'
  projectId: 'saludplus-62ace',         // ej. 'mi-proyecto'
  appId: '1:650901914444:web:560701cb8c6829729745e9',             // ej. '1:1234567890:web:abc123'
  messagingSenderId: '650901914444', // opcional
  appCheckSiteKey: '6Ldv_fYtAAAAAFdg0lowMft1yOtBwTZlvho6co3B',   // clave del sitio de Fraud Defense / reCAPTCHA Enterprise (recomendado)
  appCheckProvider: 'enterprise', // 'enterprise' (por defecto) o 'v3' si tuvieras una clave clásica
  appCheckDebug: false,  // true solo para probar en tu computadora
  model: 'gemini-3.8-flash'
};
