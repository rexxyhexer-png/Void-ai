# VOID AI — Native Android Project

Production-grade native Android client built with **Kotlin, Jetpack Compose, one Activity (`MainActivity`), one module (`app`), Kotlin DSL Gradle (`build.gradle.kts`)**, and ViewModel-based architecture.

## Architecture & Features

1. **Monochrome Void Aesthetic**:
   - Signature chamfered angular message composer with white cutout border.
   - Content-sized user chat bubbles (a dot is a tiny bubble, never a full-width card).
   - High-contrast monochrome palette (`#050505` deep black canvas, `#F7F7F7` white, subtle hairline borders).
   - Circular top controls: Mode switch, Mic, Clear, Settings.

2. **Personal BYOK Security**:
   - **Groq**, **Native Gemini** (`v1beta/models/{model}:streamGenerateContent`), **OpenAI**, and configurable **HTTPS OpenAI-compatible** endpoints.
   - Zero hardcoded keys or BuildConfig secrets.
   - Authenticated encryption backed by **Android Keystore (AES-256-GCM)** storing only ciphertext & initialization vector (IV) in app-private storage.
   - Graceful key invalidation handling; local "Forget Key" and "Wipe All Keys".

3. **Conversation Modes**:
   - **Short** (Default): 1–4 concise lines, natural Hinglish or user's language.
   - **Normal**: Practical everyday dialogue and balanced explanations.
   - **Detailed**: Comprehensive technical depth, complete code blocks, CTF/defensive analysis support.

4. **Native Voice Lifecycle**:
   - `AndroidVoiceManager` managing `SpeechRecognizer` (Hindi/Hinglish/English) and `TextToSpeech`.
   - Never listens while TTS is speaking.
   - Stops immediately when entering settings or backgrounding.

5. **Scoped Android Actions with Confirmation**:
   - Explicit allowlist: `ACTION_DIAL` (never auto-calls), `ACTION_SET_ALARM`, `ACTION_SEND` (share sheet), `geo:` Maps, browser URL review, CameraManager flashlight torch toggle.
   - Strict target confirmation modal before intent execution.

## Building & Running in Android Studio

1. **Prerequisites**:
   - Android Studio Ladybug (2024.2+) or newer.
   - JDK 17 or JDK 21.
   - Android SDK 35 (Android 15) with platform tools.

2. **Importing the Project**:
   - Open Android Studio → **File** → **Open...**
   - Select the `android/` directory.
   - Allow Gradle sync to download AndroidX Compose BOM and dependencies.

3. **Running on Physical Device or Emulator**:
   - Connect your Android phone with **USB Debugging** enabled.
   - Select your device from the target dropdown.
   - Press **Run 'app'** (`Shift + F10`) or execute in terminal:
     ```bash
     ./gradlew assembleDebug
     ./gradlew installDebug
     ```

4. **Running Unit Tests**:
   ```bash
   ./gradlew test
   ```

5. **Building Release APK**:
   ```bash
   ./gradlew assembleRelease
   ```
   The generated APK will be at `app/build/outputs/apk/release/app-release-unsigned.apk`.
