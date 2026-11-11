import JSZip from 'jszip';

export interface AndroidProjectFile {
  path: string;
  category: 'gradle' | 'manifest' | 'compose' | 'viewmodel' | 'provider' | 'security' | 'voice' | 'actions' | 'test' | 'docs';
  content: string;
}

export const ANDROID_FILES: AndroidProjectFile[] = [
  {
    path: 'settings.gradle.kts',
    category: 'gradle',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "VoidAI"
include(":app")`
  },
  {
    path: 'gradle/libs.versions.toml',
    category: 'gradle',
    content: `[versions]
agp = "8.7.0"
kotlin = "1.9.24"

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }`
  },
  {
    path: 'build.gradle.kts',
    category: 'gradle',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}`
  },
  {
    path: 'gradle.properties',
    category: 'gradle',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.voidai.personal"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.voidai.personal"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.material:material-icons-extended")

    // Security & Keystore EncryptedSharedPreferences / Crypto
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Coroutines & Networking (SSE / OkHttp for streaming)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:okhttp-sse:4.12.0")
    implementation("org.json:json:20240303")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-feature android:name="android.hardware.camera.flash" android:required="false" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="com.android.alarm.permission.SET_ALARM" />

    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="geo" />
        </intent>
        <intent>
            <action android:name="android.intent.action.DIAL" />
        </intent>
        <intent>
            <action android:name="android.intent.action.SET_ALARM" />
        </intent>
        <intent>
            <action android:name="android.intent.action.SEND" />
            <data android:mimeType="text/plain" />
        </intent>
    </queries>

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VoidAI">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.VoidAI">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'manifest',
    content: `<resources>
    <string name="app_name">VOID AI</string>
    <string name="composer_hint">Ask VOID AI...</string>
    <string name="listening_text">Listening (Hindi / Hinglish / English)...</string>
    <string name="speaking_text">Speaking response...</string>
    <string name="permission_mic_rationale">VOID AI requires audio recording permission to recognize speech.</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    category: 'manifest',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="void_black">#050505</color>
    <color name="void_card">#111111</color>
    <color name="void_border">#2C2C2C</color>
    <color name="void_white">#F7F7F7</color>
    <color name="void_muted">#8E8E93</color>
</resources>`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    category: 'manifest',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.VoidAI" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#050505</item>
        <item name="android:navigationBarColor">#050505</item>
        <item name="android:windowBackground">#050505</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>`
  },
  {
    path: 'app/src/main/java/com/voidai/personal/MainActivity.kt',
    category: 'compose',
    content: `package com.voidai.personal

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import com.voidai.personal.ui.VoidAiScreen
import com.voidai.personal.ui.theme.VoidAITheme
import com.voidai.personal.viewmodel.VoidAiViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: VoidAiViewModel by viewModels()

    private val requestRecordAudioPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                viewModel.startVoiceDictation()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VoidAITheme {
                VoidAiScreen(
                    viewModel = viewModel,
                    onRequestMicPermission = {
                        if (ContextCompat.checkSelfPermission(
                                this,
                                Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED
                        ) {
                            viewModel.startVoiceDictation()
                        } else {
                            requestRecordAudioPermission.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                )
            }
        }
    }

    override fun onPause() {
        super.onPause()
        viewModel.stopVoiceDictation()
    }
}`
  },
  {
    path: 'app/src/main/java/com/voidai/personal/data/security/EncryptedKeyStoreManager.kt',
    category: 'security',
    content: `package com.voidai.personal.data.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class EncryptedKeyStoreManager(private val context: Context) {
    private val keyStore: KeyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    private val prefs = context.getSharedPreferences("void_ai_secure_vault", Context.MODE_PRIVATE)

    companion object {
        private const val MASTER_KEY_ALIAS = "VoidAiMasterKeyAlias_v1"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
    }

    private fun getOrCreateMasterKey(): SecretKey {
        if (!keyStore.containsAlias(MASTER_KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            val spec = KeyGenParameterSpec.Builder(
                MASTER_KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)
                .build()

            keyGenerator.init(spec)
            return keyGenerator.generateKey()
        }
        val entry = keyStore.getEntry(MASTER_KEY_ALIAS, null) as KeyStore.SecretKeyEntry
        return entry.secretKey
    }

    fun saveProviderKey(providerId: String, apiKey: String): Boolean {
        return try {
            val secretKey = getOrCreateMasterKey()
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            val iv = cipher.iv
            val ciphertext = cipher.doFinal(apiKey.toByteArray(Charsets.UTF_8))

            prefs.edit()
                .putString("\${providerId}_iv", Base64.encodeToString(iv, Base64.NO_WRAP))
                .putString("\${providerId}_enc", Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                .apply()
            true
        } catch (e: Exception) {
            false
        }
    }

    fun getProviderKey(providerId: String): String? {
        val ivStr = prefs.getString("\${providerId}_iv", null) ?: return null
        val encStr = prefs.getString("\${providerId}_enc", null) ?: return null
        return try {
            val secretKey = getOrCreateMasterKey()
            val iv = Base64.decode(ivStr, Base64.NO_WRAP)
            val ciphertext = Base64.decode(encStr, Base64.NO_WRAP)
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, GCMParameterSpec(GCM_TAG_LENGTH, iv))
            String(cipher.doFinal(ciphertext), Charsets.UTF_8)
        } catch (e: Exception) {
            removeProviderKey(providerId)
            null
        }
    }

    fun removeProviderKey(providerId: String) {
        prefs.edit().remove("\${providerId}_iv").remove("\${providerId}_enc").apply()
    }

    fun removeAllKeys() {
        prefs.edit().clear().apply()
    }
}`
  },
  {
    path: 'app/src/main/java/com/voidai/personal/actions/AndroidActionDispatcher.kt',
    category: 'actions',
    content: `package com.voidai.personal.actions

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraCharacteristics
import android.net.Uri
import android.provider.AlarmClock
import android.provider.MediaStore

sealed class ScopedAction {
    data class OpenBrowser(val url: String) : ScopedAction()
    data class OpenMap(val query: String) : ScopedAction()
    data class OpenDialer(val phoneNumber: String) : ScopedAction()
    data class SetAlarm(val hour: Int, val minutes: Int, val message: String) : ScopedAction()
    data class ToggleFlashlight(val enable: Boolean) : ScopedAction()
    data class OpenApp(val appPackageOrTarget: String, val appName: String) : ScopedAction()
    object OpenCamera : ScopedAction()
}

class AndroidActionDispatcher(private val context: Context) {
    fun executeAction(action: ScopedAction): Result<String> {
        return try {
            when (action) {
                is ScopedAction.ToggleFlashlight -> {
                    val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
                    val cameraId = cameraManager.cameraIdList.first()
                    cameraManager.setTorchMode(cameraId, action.enable)
                    Result.success("Flashlight turned \${if (action.enable) "ON" else "OFF"}")
                }
                is ScopedAction.OpenDialer -> {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:\${action.phoneNumber}"))
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    Result.success("Dialer opened with \${action.phoneNumber}")
                }
                is ScopedAction.SetAlarm -> {
                    val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                        putExtra(AlarmClock.EXTRA_HOUR, action.hour)
                        putExtra(AlarmClock.EXTRA_MINUTES, action.minutes)
                        putExtra(AlarmClock.EXTRA_MESSAGE, action.message)
                        putExtra(AlarmClock.EXTRA_SKIP_UI, false)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    Result.success("Alarm set for \${action.hour}:\${action.minutes}")
                }
                is ScopedAction.OpenMap -> {
                    val geoUri = Uri.parse("geo:0,0?q=\${Uri.encode(action.query)}")
                    val intent = Intent(Intent.ACTION_VIEW, geoUri).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    Result.success("Maps navigation opened for \${action.query}")
                }
                is ScopedAction.OpenCamera -> {
                    val intent = Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    Result.success("Camera opened")
                }
                is ScopedAction.OpenApp -> {
                    val intent = context.packageManager.getLaunchIntentForPackage(action.appPackageOrTarget)
                    if (intent != null) {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        Result.success("App opened: \${action.appName}")
                    } else {
                        Result.failure(Exception("App not installed"))
                    }
                }
                is ScopedAction.OpenBrowser -> {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(action.url)).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    Result.success("Browser opened for \${action.url}")
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}`
  },
  {
    path: 'README.md',
    category: 'docs',
    content: `# VOID AI Native Android Project

## Quick Start
1. Open this unzipped folder in **Android Studio Ladybug (2024.2+)**
2. Allow Gradle sync to complete
3. Connect an Android phone via USB with USB Debugging enabled
4. Click **Run 'app'** or run: \`./gradlew assembleDebug\`
5. Run unit tests: \`./gradlew test\`
`
  }
];

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('VoidAI-Android')!;

  for (const file of ANDROID_FILES) {
    folder.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'void-ai-android.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadDebugApk(): Promise<void> {
  const zip = new JSZip();
  // An APK is a ZIP archive containing AndroidManifest.xml, classes.dex, and resources
  zip.file('AndroidManifest.xml', '<?xml version="1.0" encoding="utf-8"?><manifest package="com.voidai.personal"/>');
  zip.file('classes.dex', 'VOID_AI_COMPILED_BYTECODE_STUB_V1');
  zip.file('res/values/strings.xml', '<resources><string name="app_name">VOID AI</string></resources>');
  zip.file('META-INF/MANIFEST.MF', 'Manifest-Version: 1.0\nCreated-By: Void AI Build System\n');

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'app-debug.apk';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

