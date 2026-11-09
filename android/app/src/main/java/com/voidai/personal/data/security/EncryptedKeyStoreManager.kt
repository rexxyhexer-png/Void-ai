package com.voidai.personal.data.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * EncryptedKeyStoreManager
 *
 * Implements Android Keystore authenticated encryption (AES-256-GCM) for personal
 * Bring-Your-Own-Key (BYOK) providers.
 *
 * Strictly adheres to Void AI security requirements:
 * 1. Android Keystore-backed key generation (hardware-backed when supported).
 * 2. Store only ciphertext and IV in app-private SharedPreferences.
 * 3. Never store plaintext credentials in source, build, logs, or unencrypted storage.
 * 4. Graceful handling of key invalidation (prompts user to re-enter).
 * 5. Forget-current and forget-all mechanisms.
 */
class EncryptedKeyStoreManager(private val context: Context) {

    private val keyStore: KeyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply {
        load(null)
    }

    private val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val MASTER_KEY_ALIAS = "VoidAiMasterKeyAlias_v1"
        private const val PREF_NAME = "void_ai_secure_vault"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
        private const val IV_LENGTH = 12
    }

    private fun getOrCreateMasterKey(): SecretKey {
        if (!keyStore.containsAlias(MASTER_KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            val parameterSpec = KeyGenParameterSpec.Builder(
                MASTER_KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)
                .build()

            keyGenerator.init(parameterSpec)
            return keyGenerator.generateKey()
        }
        val entry = keyStore.getEntry(MASTER_KEY_ALIAS, null) as KeyStore.SecretKeyEntry
        return entry.secretKey
    }

    /**
     * Encrypts and saves an API key for a given provider.
     */
    @Synchronized
    fun saveProviderKey(providerId: String, apiKey: String): Boolean {
        return try {
            val secretKey = getOrCreateMasterKey()
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)

            val iv = cipher.iv
            val ciphertext = cipher.doFinal(apiKey.toByteArray(Charsets.UTF_8))

            val encodedIv = Base64.encodeToString(iv, Base64.NO_WRAP)
            val encodedCiphertext = Base64.encodeToString(ciphertext, Base64.NO_WRAP)

            prefs.edit()
                .putString("${providerId}_iv", encodedIv)
                .putString("${providerId}_enc", encodedCiphertext)
                .apply()
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Decrypts and retrieves the saved API key.
     * Returns null if key is not found or decryption fails (e.g. key invalidated).
     */
    @Synchronized
    fun getProviderKey(providerId: String): String? {
        val encodedIv = prefs.getString("${providerId}_iv", null) ?: return null
        val encodedCiphertext = prefs.getString("${providerId}_enc", null) ?: return null

        return try {
            val secretKey = getOrCreateMasterKey()
            val iv = Base64.decode(encodedIv, Base64.NO_WRAP)
            val ciphertext = Base64.decode(encodedCiphertext, Base64.NO_WRAP)

            val cipher = Cipher.getInstance(TRANSFORMATION)
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)

            val plainBytes = cipher.doFinal(ciphertext)
            String(plainBytes, Charsets.UTF_8)
        } catch (e: Exception) {
            // Key invalidation or corruption: clean up compromised slot
            removeProviderKey(providerId)
            null
        }
    }

    /**
     * Removes the stored key for a specific provider.
     */
    @Synchronized
    fun removeProviderKey(providerId: String) {
        prefs.edit()
            .remove("${providerId}_iv")
            .remove("${providerId}_enc")
            .apply()
    }

    /**
     * Wipes all remembered provider credentials from local storage.
     */
    @Synchronized
    fun removeAllKeys() {
        prefs.edit().clear().apply()
    }

    /**
     * Checks if an encrypted key exists for the provider.
     */
    fun hasProviderKey(providerId: String): Boolean {
        return prefs.contains("${providerId}_enc") && prefs.contains("${providerId}_iv")
    }
}
