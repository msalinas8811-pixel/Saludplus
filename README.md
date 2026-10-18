# Servidor IA para SaludPlus PWA

Este servidor conecta el chat de la PWA con la API de OpenAI. La clave secreta se configura SOLO en el panel del proveedor de hosting; nunca se coloca en `index.html`, GitHub Pages ni en el chat.

## Desplegar en Render (servicio web Node)
1. Sube la carpeta `backend` a un repositorio privado de GitHub o agrega esta carpeta al repositorio existente.
2. En Render, crea un **Web Service** desde ese repositorio y define **Root Directory** como `backend`.
3. Runtime: Node. Build command: `npm install` (no hay dependencias externas). Start command: `npm start`.
4. En Environment Variables agrega `OPENAI_API_KEY` (la clave API se obtiene desde la plataforma de API de OpenAI; ChatGPT Plus/Go no incluye automáticamente crédito API), `OPENAI_MODEL=gpt-4.1-mini` y `ALLOWED_ORIGIN=https://msalinas8811-pixel.github.io`. Si publicas la PWA en otro dominio, cambia el origen; puedes poner varios separados por coma.
5. Despliega. Abre `https://TU-SERVICIO.onrender.com/health`; debe responder JSON con `ok:true` y `configured:true`. No compartas la URL con claves secretas.
6. En SaludPlus > Chat IA, pega la URL base del servicio (sin `/api/chat`), pulsa **Guardar dirección** y **Probar conexión**. Luego envía una pregunta de prueba.

## Seguridad y límites
- La clave API solo vive como variable de entorno del servidor. No la envíes por chat ni la escribas en la PWA.
- El modo general no manda contexto del historial. El modo personalizado requiere que el paciente marque su autorización y envía solo las últimas mediciones seleccionadas y listas resumidas de medicación/citas.
- El servidor limita cada IP a 20 solicitudes por minuto y no registra deliberadamente el contenido de las preguntas. Para uso real con pacientes se requiere reforzar autenticación, límites, privacidad, gestión de datos y revisión legal/clínica.
- No es un servicio de urgencias y no sustituye a profesionales sanitarios.

## Notas de la versión 22
- En el plan gratuito de Render el servicio se duerme por inactividad: la primera consulta o la prueba de conexión puede tardar hasta un minuto.
- Variable opcional `MAX_PER_MINUTE` (por defecto 20) para el límite por IP.
- El servidor responde en el idioma elegido en la app (ES/EN) y prioriza avisar de posibles urgencias.

## Notas de la versión 23
- `/api/chat` acepta `attachments` (PDF en base64, imágenes JPEG/PNG o texto) y `examNotes`. Se validan tipo y tamaño (≈ 8 MB en total) y se reenvían al modelo como `input_file` / `input_image`; nada se guarda (`store: false`).
- El modelo debe aceptar archivos e imágenes (por ejemplo `gpt-4.1-mini` o superior). Los documentos se tratan como datos, no como instrucciones.
- El contexto personalizado puede incluir `exams` (calendario y resumen de resultados, sin archivos) si el paciente lo autoriza.
