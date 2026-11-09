package com.voidai.personal.data.provider

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class GeminiProvider(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()
) : AiProvider {

    override val id: String = "gemini"
    override val displayName: String = "Google Gemini Native"
    override val defaultModel: String = "gemini-2.5-flash"

    private val apiBase = "https://generativelanguage.googleapis.com/v1beta"

    override suspend fun fetchModels(apiKey: String, customBaseUrl: String?): Result<List<String>> {
        return try {
            val base = customBaseUrl ?: apiBase
            val url = "$base/models?key=$apiKey"
            val request = Request.Builder()
                .url(url)
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                when (response.code) {
                    200 -> {
                        val body = response.body?.string().orEmpty()
                        val json = JSONObject(body)
                        val models = json.optJSONArray("models") ?: JSONArray()
                        val list = mutableListOf<String>()
                        for (i in 0 until models.length()) {
                            val mObj = models.getJSONObject(i)
                            val name = mObj.optString("name") // e.g. "models/gemini-2.5-flash"
                            val cleanName = name.removePrefix("models/")
                            val supportedMethods = mObj.optJSONArray("supportedGenerationMethods")
                            var canGenerate = false
                            if (supportedMethods != null) {
                                for (j in 0 until supportedMethods.length()) {
                                    if (supportedMethods.getString(j) == "generateContent") {
                                        canGenerate = true
                                        break
                                    }
                                }
                            }
                            if (canGenerate && !cleanName.contains("embedding") && !cleanName.contains("aqa")) {
                                list.add(cleanName)
                            }
                        }
                        if (list.isEmpty()) {
                            list.add(defaultModel)
                        }
                        Result.success(list.sorted())
                    }
                    400, 401, 403 -> Result.failure(ProviderError.Authentication("Gemini API key is invalid or unauthorized (HTTP ${response.code})"))
                    429 -> Result.failure(ProviderError.QuotaExceeded("Gemini API quota exceeded (HTTP 429)"))
                    else -> Result.failure(ProviderError.General("Gemini API returned HTTP ${response.code}"))
                }
            }
        } catch (e: IOException) {
            Result.failure(ProviderError.NetworkFailure(e.localizedMessage ?: "Connection failure"))
        } catch (e: Exception) {
            Result.failure(ProviderError.General(e.localizedMessage ?: "Unknown error"))
        }
    }

    override fun streamChat(
        apiKey: String,
        model: String,
        temperature: Float,
        systemPrompt: String,
        history: List<ChatMessage>,
        customBaseUrl: String?
    ): Flow<String> = callbackFlow {
        val selectedModel = model.ifBlank { defaultModel }.removePrefix("models/")
        val base = customBaseUrl ?: apiBase
        val url = "$base/models/$selectedModel:streamGenerateContent?alt=sse&key=$apiKey"

        val contentsArray = JSONArray()

        // Translate history roles: USER -> 'user', ASSISTANT -> 'model'
        val trimmed = history.takeLast(40)
        for (msg in trimmed) {
            if (msg.role == ChatMessage.Role.SYSTEM) continue
            val role = if (msg.role == ChatMessage.Role.USER) "user" else "model"
            val parts = JSONArray().put(JSONObject().put("text", msg.content))
            contentsArray.put(
                JSONObject().apply {
                    put("role", role)
                    put("parts", parts)
                }
            )
        }

        val rootPayload = JSONObject().apply {
            put("contents", contentsArray)
            // System prompt strictly in systemInstruction
            if (systemPrompt.isNotBlank()) {
                put(
                    "systemInstruction",
                    JSONObject().put(
                        "parts",
                        JSONArray().put(JSONObject().put("text", systemPrompt))
                    )
                )
            }
            put(
                "generationConfig",
                JSONObject().apply {
                    put("temperature", temperature)
                }
            )
        }

        val request = Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .post(rootPayload.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val sseFactory = EventSources.createFactory(client)
        val eventSource = sseFactory.newEventSource(
            request,
            object : EventSourceListener() {
                override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                    try {
                        val json = JSONObject(data)
                        val candidates = json.optJSONArray("candidates")
                        if (candidates != null && candidates.length() > 0) {
                            val candidate = candidates.getJSONObject(0)
                            val content = candidate.optJSONObject("content")
                            val parts = content?.optJSONArray("parts")
                            if (parts != null) {
                                for (i in 0 until parts.length()) {
                                    val part = parts.getJSONObject(i)
                                    // Do not display thought parts per Void AI specification
                                    val isThought = part.optBoolean("thought", false)
                                    if (isThought) continue

                                    val text = part.optString("text", "")
                                    if (text.isNotEmpty()) {
                                        trySend(text)
                                    }
                                }
                            }
                        }
                    } catch (_: Exception) {
                        // ignore malformed chunks
                    }
                }

                override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                    val code = response?.code
                    val error = when (code) {
                        400, 401 -> ProviderError.Authentication("Gemini Key invalid or malformed")
                        403 -> ProviderError.PermissionDenied("Gemini API permission denied")
                        404 -> ProviderError.ModelNotFound(selectedModel)
                        429 -> ProviderError.QuotaExceeded()
                        else -> ProviderError.NetworkFailure(t?.localizedMessage ?: "Stream connection disrupted")
                    }
                    close(error)
                }

                override fun onClosed(eventSource: EventSource) {
                    close()
                }
            }
        )

        awaitClose {
            eventSource.cancel()
        }
    }
}
